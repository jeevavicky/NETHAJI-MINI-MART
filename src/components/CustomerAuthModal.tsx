import React, { useState } from 'react';
import { 
  X, Phone, Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight, 
  CheckCircle2, Zap, ShieldCheck, User, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userPhone: string, userName?: string) => void;
  messageBanner?: string | null;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  messageBanner
}) => {
  // Mode: 'login' | 'signup' | 'forgot_password'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  
  // Login / Signup Form State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useOtpLogin, setUseOtpLogin] = useState(false);

  // Forgot Password Steps: 1 = Enter Phone/Email, 2 = Verify OTP, 3 = Reset Password, 4 = Done
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotInput, setForgotInput] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status & Validation
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Reset fields when switching tabs
  const handleSwitchTab = (newMode: 'login' | 'signup' | 'forgot_password') => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
    setForgotStep(1);
    setPhone('');
    setPassword('');
    setName('');
    setEmail('');
    setForgotInput('');
    setOtpDigits(['', '', '', '']);
  };

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!phone || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!useOtpLogin && (!password || password.length < 4)) {
      setErrorMsg('Please enter your password (minimum 4 characters)');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\D/g, '')}`;
      onLoginSuccess(formattedPhone, name || 'Nethaji Customer');
      onClose();
    }, 600);
  };

  // Handle Signup Submit
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || name.trim().length < 2) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!phone || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\D/g, '')}`;
      localStorage.setItem('nethaji_user_name', name);
      onLoginSuccess(formattedPhone, name);
      onClose();
    }, 700);
  };

  // Handle Forgot Password - Step 1: Send OTP
  const handleSendForgotOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!forgotInput || forgotInput.trim().length < 6) {
      setErrorMsg('Please enter registered phone number or email');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotStep(2);
      setSuccessMsg(`OTP sent to ${forgotInput}`);
    }, 600);
  };

  // Handle Forgot Password - Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (otpDigits.some(d => !d)) {
      setErrorMsg('Please enter complete 4-digit OTP');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotStep(3);
      setSuccessMsg('OTP verified successfully! Create a new password below.');
    }, 600);
  };

  // Handle Forgot Password - Step 3: Save New Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const formattedPhone = forgotInput.startsWith('+91') ? forgotInput : `+91 ${forgotInput.replace(/\D/g, '')}`;
      onLoginSuccess(formattedPhone, 'Nethaji Customer');
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* NethajiMiniMart Header Gradient Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-rose-950 text-white p-5 sm:p-6 relative overflow-hidden">
          {/* Subtle Background Lighting Accent */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Top Bar with Skip Button & Close Button */}
          <div className="flex items-center justify-between relative z-10 mb-3">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-200">
                10-Min Grocery
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Skip Option */}
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-200 hover:text-white bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1"
                title="Browse as guest without logging in"
              >
                <span>Skip</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white relative z-10">
            {mode === 'login' && 'Welcome Back to NethajiMiniMart'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot_password' && 'Reset Your Password'}
          </h2>
          <p className="text-xs text-purple-200/90 font-medium mt-1 relative z-10">
            {mode === 'login' && 'Log in for instant checkout & exclusive 10-min delivery'}
            {mode === 'signup' && 'Sign up to unlock ₹1 offers, coupons & fast delivery'}
            {mode === 'forgot_password' && 'Enter your registered details to recover access'}
          </p>
        </div>

        {/* Message Banner (e.g. forced login before checkout) */}
        {messageBanner && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center gap-2 border-b border-amber-600">
            <AlertCircle className="w-4 h-4 shrink-0 fill-slate-950 text-amber-500" />
            <span>{messageBanner}</span>
          </div>
        )}

        {/* Auth Mode Tabs (Login / Register / Forgot) */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-black">
          <button
            type="button"
            onClick={() => handleSwitchTab('login')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer border-b-2 ${
              mode === 'login'
                ? 'border-purple-800 text-purple-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab('signup')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer border-b-2 ${
              mode === 'signup'
                ? 'border-purple-800 text-purple-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            New Customer?
          </button>
        </div>

        {/* Form Body Container */}
        <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= MODE 1: LOGIN ================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Mobile Number Input */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1 text-slate-500 font-bold text-xs pointer-events-none">
                    <Phone className="w-3.5 h-3.5 text-purple-700" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-16 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-800 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Toggle OTP or Password Login */}
              {!useOtpLogin ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSwitchTab('forgot_password')}
                      className="text-xs font-extrabold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-purple-700 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-800 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-xs text-purple-900 font-bold">
                  ⚡ OTP will be sent to +91 {phone || 'XXXXX XXXXX'} via SMS.
                </div>
              )}

              {/* Login Method Toggle */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setUseOtpLogin(!useOtpLogin)}
                  className="text-xs font-bold text-purple-900 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{useOtpLogin ? 'Login with Password instead' : 'Login using OTP instead'}</span>
                </button>
              </div>

              {/* Login Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-900 via-rose-900 to-purple-950 hover:from-purple-950 hover:to-rose-900 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{useOtpLogin ? 'Send OTP & Login' : 'Log In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          )}

          {/* ================= MODE 2: SIGN UP ================= */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-purple-700 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-800 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1 text-slate-500 font-bold text-xs pointer-events-none">
                    <Phone className="w-3.5 h-3.5 text-purple-700" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-16 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-800 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-purple-700 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-800 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Create Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-purple-700 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-800 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-900 via-rose-900 to-purple-950 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 uppercase tracking-wider mt-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          )}

          {/* ================= MODE 3: FORGOT PASSWORD ================= */}
          {mode === 'forgot_password' && (
            <div className="space-y-4">
              
              {/* Step Indicators */}
              <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase text-slate-400">
                <span className={forgotStep === 1 ? 'text-purple-900 font-extrabold' : ''}>1. Mobile</span>
                <span className="text-slate-300">→</span>
                <span className={forgotStep === 2 ? 'text-purple-900 font-extrabold' : ''}>2. OTP</span>
                <span className="text-slate-300">→</span>
                <span className={forgotStep === 3 ? 'text-purple-900 font-extrabold' : ''}>3. Reset</span>
              </div>

              {/* Step 1: Input Mobile */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendForgotOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Enter Mobile Number or Email
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9443312345 or user@mail.com"
                      value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-800 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-purple-900 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Reset OTP</span>}
                  </button>
                </form>
              )}

              {/* Step 2: Verify OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-2 text-center">
                      Enter 4-Digit Verification Code
                    </label>

                    <div className="flex justify-center gap-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const newDigits = [...otpDigits];
                            newDigits[idx] = val;
                            setOtpDigits(newDigits);
                          }}
                          className="w-11 h-12 text-center text-base font-black bg-slate-50 border-2 border-purple-300 focus:border-purple-800 rounded-xl outline-none"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-purple-900 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify OTP</span>}
                  </button>
                </form>
              )}

              {/* Step 3: Set New Password */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-800 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-purple-800 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Update Password & Log In</span>}
                  </button>
                </form>
              )}

              {/* Back to Login */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleSwitchTab('login')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ← Back to Login
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer info banner */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-[10px] text-slate-500 font-bold">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Safe & Secure Login
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-purple-900 font-black hover:underline cursor-pointer"
          >
            Skip & Browse Guest →
          </button>
        </div>

      </div>
    </div>
  );
};
