import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Mail, User, Phone, Eye, EyeOff, 
  Sparkles, CheckCircle2, AlertCircle, X, KeyRound, UserPlus, LogIn, 
  ArrowLeft, RefreshCw, Key, Send, Check
} from 'lucide-react';
import { AdminUser } from '../types';
import { api } from '../services/api';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admin: AdminUser) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('Store Manager');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSecurityKey, setRegSecurityKey] = useState('');

  // Email Verification State for Registration
  const [regEmailVerified, setRegEmailVerified] = useState(false);
  const [regEmailCode, setRegEmailCode] = useState('');
  const [regSentCode, setRegSentCode] = useState<string | null>(null);
  const [regVerifyingCode, setRegVerifyingCode] = useState(false);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'new_password' | 'success'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotDemoCode, setForgotDemoCode] = useState<string | null>(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. LOGIN HANDLER
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminLogin(loginEmail, loginPassword);
      setSuccessMsg(`Welcome back, ${res.admin.name}!`);
      setTimeout(() => {
        onSuccess(res.admin);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // 2. REGISTER HANDLER
  const handleSendRegEmailCode = async () => {
    if (!regEmail || !regEmail.includes('@')) {
      setErrorMsg('Please enter a valid work email address first.');
      return;
    }
    setErrorMsg(null);
    setRegVerifyingCode(true);
    try {
      const res = await api.adminSendVerificationCode(regEmail);
      if (res.verificationCode) {
        setRegSentCode(res.verificationCode);
      }
      setSuccessMsg(`Verification OTP code sent to ${regEmail}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification code');
    } finally {
      setRegVerifyingCode(false);
    }
  };

  const handleVerifyRegEmailCode = async () => {
    if (!regEmailCode || regEmailCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setErrorMsg(null);
    setRegVerifyingCode(true);
    try {
      await api.adminVerifyEmailCode(regEmail, regEmailCode.trim());
      setRegEmailVerified(true);
      setSuccessMsg('Email address verified successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid verification code.');
    } finally {
      setRegVerifyingCode(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName || !regEmail || !regPassword || !regSecurityKey) {
      setErrorMsg('Please fill in all required fields (Name, Email, Password, Authorization Key).');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminRegister({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        role: regRole,
        securityKey: regSecurityKey
      });

      setSuccessMsg(`Admin account registered successfully! Logging in as ${res.admin.name}...`);
      setTimeout(() => {
        onSuccess(res.admin);
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 3. FORGOT PASSWORD HANDLERS
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setErrorMsg('Please enter a valid admin email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminForgotPassword(forgotEmail.trim());
      if (res.verificationCode) {
        setForgotDemoCode(res.verificationCode);
        setForgotOtpCode(res.verificationCode); // Auto-fill code for effortless demo testing!
      }
      setSuccessMsg(`Verification OTP code sent to registered Admin Gmail ID (${forgotEmail})`);
      setForgotStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'No admin account found with this email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotOtpCode || forgotOtpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      await api.adminVerifyResetCode(forgotEmail.trim(), forgotOtpCode.trim());
      setSuccessMsg('OTP verified successfully! Please enter your new password.');
      setForgotStep('new_password');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminResetPassword(forgotEmail.trim(), forgotOtpCode.trim(), forgotNewPassword);
      setSuccessMsg(res.message || 'Password reset successfully!');
      setForgotStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Header Header Bar */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight">NETHAJI</span>
                <span className="font-bold text-lg text-amber-400">ADMIN</span>
              </div>
              <p className="text-[11px] text-emerald-200 font-medium">Store Management & Analytics Control</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'login'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Admin Login</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'register'
                ? 'border-emerald-700 text-emerald-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('forgot');
              setForgotStep('email');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'forgot'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Forgot Password</span>
          </button>
        </div>

        {/* Form Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Admin Email or Username</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter email or username"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setForgotEmail(loginEmail);
                      setForgotStep('email');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter admin password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Log In to Admin Dashboard</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500">
                  Need a new staff account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Email Address *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="Work Email Address"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        setRegEmailVerified(false);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendRegEmailCode}
                    disabled={regVerifyingCode || !regEmail}
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] px-3 py-2 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                  >
                    {regSentCode ? 'Resend OTP' : 'Verify Email'}
                  </button>
                </div>

                {/* Email Verification OTP Box */}
                {regSentCode && !regEmailVerified && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] text-amber-900 font-medium">
                      <span>Simulated OTP Sent: <code className="font-mono font-bold bg-amber-200 px-1 py-0.5 rounded">{regSentCode}</code></span>
                      <span className="text-amber-700">Enter code below</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="6-digit OTP"
                        maxLength={6}
                        value={regEmailCode}
                        onChange={(e) => setRegEmailCode(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyRegEmailCode}
                        disabled={regVerifyingCode}
                        className="bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg shrink-0 hover:bg-emerald-800"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}

                {regEmailVerified && (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                    <Check className="w-3.5 h-3.5" /> Work Email Verified
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-2 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Inventory Lead">Inventory Lead</option>
                    <option value="Billing Counter">Billing Counter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Admin Authorization Key *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter store security key"
                    value={regSecurityKey}
                    onChange={(e) => setRegSecurityKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Authorization key required for registering new store management staff</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Staff Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-amber-400" />
                      <span>Register & Launch Admin Panel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {/* Step 1: Enter Email */}
              {forgotStep === 'email' && (
                <form onSubmit={handleSendForgotOtp} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Reset Admin Password</p>
                      <p className="text-[11px] text-amber-800/90 mt-0.5">
                        Enter your registered Admin email address. We will generate a 6-digit OTP code to verify your identity.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Admin Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="Enter registered admin email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-slate-950" />
                        <span>Send OTP Verification Code</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Verify OTP Code */}
              {forgotStep === 'otp' && (
                <form onSubmit={handleVerifyForgotOtp} className="space-y-4 animate-in fade-in">
                  {forgotDemoCode && (
                    <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-xs text-emerald-900 font-medium">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Verification OTP Sent to Admin Gmail!
                      </p>
                      <p className="mt-1 text-[11px]">
                        Sent to registered address <span className="font-semibold text-slate-800">{forgotEmail}</span>: <code className="bg-emerald-200 font-mono font-bold text-slate-900 px-2 py-0.5 rounded text-xs ml-1">{forgotDemoCode}</code>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={forgotOtpCode}
                        onChange={(e) => setForgotOtpCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white tracking-widest"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('email')}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {loading ? 'Verifying Code...' : 'Verify OTP Code'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Enter New Password */}
              {forgotStep === 'new_password' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">New Admin Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 6 characters"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Repeat new password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? 'Updating Password...' : 'Reset & Save Password'}
                  </button>
                </form>
              )}

              {/* Step 4: Success Confirmation */}
              {forgotStep === 'success' && (
                <div className="text-center py-4 space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Password Reset Successful!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Your Admin password has been updated. You can now log in using your new password.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setLoginEmail(forgotEmail);
                      setLoginPassword(forgotNewPassword);
                      setErrorMsg(null);
                      setSuccessMsg('You can now log in with your new password.');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md"
                  >
                    Proceed to Admin Login
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
