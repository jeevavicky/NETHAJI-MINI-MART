import React, { useState, useEffect } from 'react';
import { 
  Bike, ShieldCheck, MapPin, Phone, CheckCircle, Clock, Package, DollarSign, 
  User, LogOut, ArrowRight, Zap, Navigation, AlertCircle, RefreshCw, Star, 
  ChevronRight, Check, X, Shield, Lock, FileText, Smartphone, Award
} from 'lucide-react';
import { DeliveryRider, Order, StoreSettings } from '../types';
import { api } from '../services/api';
import { calculateRiderEarningForOrder } from '../utils/riderEarning';

interface DeliveryRiderPortalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings | null;
  onOrderUpdated?: () => void;
}

export const DeliveryRiderPortal: React.FC<DeliveryRiderPortalProps> = ({
  isOpen,
  onClose,
  settings,
  onOrderUpdated
}) => {
  // Session State
  const [currentRider, setCurrentRider] = useState<DeliveryRider | null>(() => {
    try {
      const saved = localStorage.getItem('nethaji_rider_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auth Form States
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginPhone, setLoginPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regVehicleType, setRegVehicleType] = useState<'Bike' | 'Scooter' | 'E-Bike' | 'Auto'>('Bike');
  const [regVehicleNumber, setRegVehicleNumber] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regZone, setRegZone] = useState('Erode Central (638001)');

  // Documents State
  const [regAadhar, setRegAadhar] = useState('');
  const [regDlUrl, setRegDlUrl] = useState('https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80');
  const [regAadharUrl, setRegAadharUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80');
  const [regRcUrl, setRegRcUrl] = useState('https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80');
  const [regPhotoUrl, setRegPhotoUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  // App States
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history' | 'profile'>('available');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [ridersList, setRidersList] = useState<DeliveryRider[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deliveryOtpInput, setDeliveryOtpInput] = useState<{ [orderId: string]: string }>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch orders and riders
  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedOrders, fetchedRiders] = await Promise.all([
        api.getOrders(),
        api.getRiders()
      ]);
      setAllOrders(fetchedOrders);
      setRidersList(fetchedRiders);

      // Refresh current rider data if logged in
      if (currentRider) {
        const freshRider = fetchedRiders.find(r => r.id === currentRider.id);
        if (freshRider) {
          setCurrentRider(freshRider);
          localStorage.setItem('nethaji_rider_session', JSON.stringify(freshRider));
        }
      }
    } catch (err) {
      console.error("Error loading rider portal data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Auth Handlers
  const handleLogin = async (e?: React.FormEvent, phoneOverride?: string) => {
    if (e) e.preventDefault();
    const phoneToUse = phoneOverride || loginPhone;
    if (!phoneToUse.trim()) {
      showToast('⚠️ Please enter your registered phone number');
      return;
    }

    setPendingNotice(null);
    setLoading(true);
    try {
      const res = await api.riderLogin(phoneToUse);
      if (res.success && res.rider) {
        setCurrentRider(res.rider);
        localStorage.setItem('nethaji_rider_session', JSON.stringify(res.rider));
        showToast(`🎉 Welcome back, ${res.rider.name}!`);
        fetchData();
      }
    } catch (err: any) {
      const errMsg = err.message || 'Login failed. Please check phone number.';
      if (errMsg.includes('PENDING ADMIN VERIFICATION') || errMsg.includes('REJECTED')) {
        setPendingNotice(errMsg);
      }
      showToast(`❌ ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regVehicleNumber.trim()) {
      showToast('⚠️ Please fill in all required fields (Name, Phone & Vehicle Number)');
      return;
    }

    setLoading(true);
    try {
      const res = await api.riderRegister({
        name: regName,
        phone: regPhone,
        email: regEmail,
        vehicleType: regVehicleType,
        vehicleNumber: regVehicleNumber,
        licenseNumber: regLicense || 'TN33 2024009876',
        assignedZone: regZone,
        documents: {
          drivingLicenseNumber: regLicense || 'TN33 2024009876',
          drivingLicenseUrl: regDlUrl,
          aadharNumber: regAadhar || '4521 8890 1234',
          aadharCardUrl: regAadharUrl,
          vehicleRcNumber: regVehicleNumber,
          vehicleRcUrl: regRcUrl,
          profilePhotoUrl: regPhotoUrl
        }
      });

      if (res.success) {
        setPendingNotice(`📋 Registration & Documents Submitted Successfully! Your account for ${regName} (${regPhone}) is currently PENDING ADMIN APPROVAL. Once Nethaji Store Admin verifies your submitted Driving License and Aadhar Card, login will be enabled.`);
        showToast('📋 Application & Documents submitted! Pending Admin Approval.');
        setLoginPhone(regPhone);
        setAuthMode('login');
        fetchData();
      }
    } catch (err: any) {
      showToast(`❌ ${err.message || 'Registration failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentRider(null);
    localStorage.removeItem('nethaji_rider_session');
    showToast('Logged out from Delivery Partner Portal.');
  };

  const handleToggleDuty = async () => {
    if (!currentRider) return;
    const nextStatus = currentRider.status === 'Off Duty' ? 'Available' : 'Off Duty';
    try {
      const updated = await api.updateRiderStatus(currentRider.id, nextStatus);
      setCurrentRider(updated);
      localStorage.setItem('nethaji_rider_session', JSON.stringify(updated));
      showToast(nextStatus === 'Available' ? '🟢 You are now ON DUTY and ready for pickups!' : '🔴 You are now OFF DUTY.');
    } catch {
      showToast('Failed to update duty status');
    }
  };

  // Order Actions
  const handleAcceptOrder = async (orderId: string) => {
    if (!currentRider) return;
    if (currentRider.status === 'Off Duty') {
      showToast('⚠️ Please turn ON DUTY before accepting orders.');
      return;
    }

    setActionLoadingId(orderId);
    try {
      const res = await api.riderActionOnOrder(orderId, currentRider.id, 'accept');
      if (res.success) {
        showToast(`✅ Order ${res.order.orderNumber} accepted! Moved to active deliveries.`);
        fetchData();
        if (onOrderUpdated) onOrderUpdated();
        setActiveTab('active');
      }
    } catch (err: any) {
      showToast(`❌ ${err.message || 'Failed to accept order'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRiderStepAction = async (orderId: string, action: 'picked-up' | 'arrived' | 'delivered') => {
    if (!currentRider) return;
    setActionLoadingId(orderId);

    try {
      const res = await api.riderActionOnOrder(orderId, currentRider.id, action);
      if (res.success) {
        if (action === 'picked-up') {
          showToast('📦 Store Pickup Confirmed! Proceed to customer location.');
        } else if (action === 'arrived') {
          showToast('📍 Arrival status updated. Call customer if required.');
        } else if (action === 'delivered') {
          showToast('🎉 Order Successfully Delivered & Payment Collected!');
        }
        fetchData();
        if (onOrderUpdated) onOrderUpdated();
      }
    } catch (err: any) {
      showToast(`❌ ${err.message || 'Action failed'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  // Filtered Orders
  const availableOrders = allOrders.filter(
    o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled' && (!o.assignedRiderId || o.assignedRiderId === '')
  );

  const myActiveOrders = allOrders.filter(
    o => o.assignedRiderId === currentRider?.id && o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled'
  );

  const myDeliveredOrders = allOrders.filter(
    o => o.assignedRiderId === currentRider?.id && o.orderStatus === 'Delivered'
  );

  const totalEarningsToday = myDeliveredOrders.reduce((acc, o) => {
    return acc + calculateRiderEarningForOrder(o, settings).totalEarning;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 w-full max-w-4xl rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                  Delivery Partner Portal
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/40 uppercase">
                  NETHAJI RIDER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live Order Pickup, Navigation & Earnings Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Refresh Portal Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="bg-amber-500 text-slate-950 font-black text-xs px-4 py-2 text-center animate-in slide-in-from-top duration-200 shrink-0">
            {toastMessage}
          </div>
        )}

        {/* Portal Body */}
        {!currentRider ? (
          /* AUTHENTICATION & REGISTRATION SCREEN */
          <div className="p-4 sm:p-8 overflow-y-auto space-y-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-amber-950/80 via-slate-800 to-slate-900 border border-amber-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest bg-amber-950 px-2.5 py-1 rounded-md border border-amber-800">
                  EARN ₹800 - ₹1,500 DAILY
                </span>
                <h3 className="text-lg font-black text-white">Deliver Fresh Groceries with Nethaji Supermarket</h3>
                <p className="text-xs text-slate-400">Flexible hours, instant payouts & daily delivery bonuses in Erode & Tamil Nadu.</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Rider Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Become a Rider
                </button>
              </div>
            </div>

            {authMode === 'login' ? (
              /* LOGIN FORM */
              <div className="max-w-md mx-auto bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl space-y-5">
                <div className="text-center space-y-1">
                  <h4 className="text-lg font-black text-white">Rider Login</h4>
                  <p className="text-xs text-slate-400">Enter your registered mobile phone number to log in</p>
                </div>

                {pendingNotice && (
                  <div className="bg-amber-950/80 border border-amber-500/60 p-3.5 rounded-2xl text-xs text-amber-200 font-bold space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Account Verification Status</span>
                    </div>
                    <p className="text-[11px] leading-relaxed font-normal text-amber-100">{pendingNotice}</p>
                  </div>
                )}

                <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 mb-1">Mobile Phone Number</label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="+91 98401 11223"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Logging in...' : 'Log In to Rider Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick Demo Login Presets */}
                <div className="pt-3 border-t border-slate-700 space-y-2 text-center">
                  <p className="text-[11px] font-bold text-slate-400">⚡ Pre-Approved Demo Riders (Instant Login):</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLogin(undefined, '9840111223')}
                      className="bg-slate-900 hover:bg-slate-700 border border-slate-700 p-2 rounded-xl text-[11px] text-slate-200 font-bold transition-all text-left cursor-pointer"
                    >
                      <p className="text-amber-400 font-black">Manoj Kumar</p>
                      <p className="text-[10px] text-slate-400">Bike • Erode Central</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogin(undefined, '9789022334')}
                      className="bg-slate-900 hover:bg-slate-700 border border-slate-700 p-2 rounded-xl text-[11px] text-slate-200 font-bold transition-all text-left cursor-pointer"
                    >
                      <p className="text-amber-400 font-black">Karthik Raja</p>
                      <p className="text-[10px] text-slate-400">Scooter • Perundurai</p>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* REGISTRATION FORM & DOCUMENT SUBMISSION */
              <div className="max-w-2xl mx-auto bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl space-y-5">
                <div className="text-center space-y-1">
                  <h4 className="text-lg font-black text-white">Delivery Partner Registration & Verification</h4>
                  <p className="text-xs text-slate-400">Fill your profile and submit verification documents for Admin review</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5 text-xs">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-extrabold text-slate-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-extrabold text-slate-300 mb-1">Mobile Phone Number *</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-extrabold text-slate-300 mb-1">Vehicle Type *</label>
                      <select
                        value={regVehicleType}
                        onChange={(e) => setRegVehicleType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
                      >
                        <option value="Bike">Motorcycle / Bike 🛵</option>
                        <option value="Scooter">Scooter / Moped 🛵</option>
                        <option value="E-Bike">Electric Scooter (EV) ⚡</option>
                        <option value="Auto">Auto Rickshaw 🛺</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-extrabold text-slate-300 mb-1">Vehicle Reg Number *</label>
                      <input
                        type="text"
                        value={regVehicleNumber}
                        onChange={(e) => setRegVehicleNumber(e.target.value)}
                        placeholder="e.g. TN 33 AB 1234"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white uppercase font-bold focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-extrabold text-slate-300 mb-1">Operating Zone / City</label>
                      <input
                        type="text"
                        value={regZone}
                        onChange={(e) => setRegZone(e.target.value)}
                        placeholder="e.g. Erode Central (638001)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block font-extrabold text-slate-300 mb-1">Email Address (Optional)</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="rider@gmail.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* MANDATORY DOCUMENTS SECTION */}
                  <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-amber-400" />
                        <div>
                          <h5 className="font-extrabold text-white text-xs">KYC & Document Verification Submissions</h5>
                          <p className="text-[10px] text-slate-400">Admin will verify these documents before granting login access</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRegName('Venkatesh S');
                          setRegPhone('9894012345');
                          setRegVehicleNumber('TN 33 CD 5678');
                          setRegLicense('TN33 2024005678');
                          setRegAadhar('8923 1102 4490');
                          setRegDlUrl('https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80');
                          setRegAadharUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80');
                          setRegRcUrl('https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80');
                        }}
                        className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                      >
                        ⚡ Fill Sample Rider Docs
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-300 mb-1">Driving License Number *</label>
                        <input
                          type="text"
                          value={regLicense}
                          onChange={(e) => setRegLicense(e.target.value)}
                          placeholder="e.g. TN33 2022001234"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-400"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-300 mb-1">Aadhar Card Number *</label>
                        <input
                          type="text"
                          value={regAadhar}
                          onChange={(e) => setRegAadhar(e.target.value)}
                          placeholder="e.g. 4521 8890 1234"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-400"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center space-y-1">
                          <p className="text-[10px] font-bold text-amber-400">📄 Driving License Photo</p>
                          <img src={regDlUrl} alt="DL Preview" className="w-full h-16 object-cover rounded-lg border border-slate-700" />
                          <span className="text-[9px] text-emerald-400 font-bold block">✓ Document Attached</span>
                        </div>

                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center space-y-1">
                          <p className="text-[10px] font-bold text-amber-400">🪪 Aadhar Card Photo</p>
                          <img src={regAadharUrl} alt="Aadhar Preview" className="w-full h-16 object-cover rounded-lg border border-slate-700" />
                          <span className="text-[9px] text-emerald-400 font-bold block">✓ Document Attached</span>
                        </div>

                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center space-y-1">
                          <p className="text-[10px] font-bold text-amber-400">🏍️ Vehicle RC Photo</p>
                          <img src={regRcUrl} alt="RC Preview" className="w-full h-16 object-cover rounded-lg border border-slate-700" />
                          <span className="text-[9px] text-emerald-400 font-bold block">✓ Document Attached</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700 flex items-start gap-2.5 text-[11px] text-slate-300">
                    <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Admin Verification Notice:</strong> After clicking submit, your application will be placed under <strong>Pending Admin Review</strong>. Store Admin will verify your DL & Aadhar details before enabling login access.
                    </p>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{loading ? 'Submitting Application & Documents...' : 'Submit Documents & Application for Admin Review'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        ) : (
          /* LOGGED IN RIDER DASHBOARD */
          <div className="flex-1 overflow-y-auto flex flex-col">
            
            {/* Rider Identity & Duty Control Bar */}
            <div className="bg-slate-800/90 border-b border-slate-700 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                  {currentRider.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-sm sm:text-base">{currentRider.name}</h3>
                    <span className="bg-slate-900 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{currentRider.rating}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>📱 {currentRider.phone}</span>
                    <span>•</span>
                    <span className="text-amber-300 font-bold">{currentRider.vehicleType} ({currentRider.vehicleNumber})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                {/* Duty Toggle Switch */}
                <button
                  type="button"
                  onClick={handleToggleDuty}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 border transition-all cursor-pointer ${
                    currentRider.status === 'Available' || currentRider.status === 'On Delivery'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600/80 shadow-md'
                      : 'bg-rose-950 text-rose-300 border-rose-700/80'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    currentRider.status === 'Available' || currentRider.status === 'On Delivery' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                  }`} />
                  <span>
                    {currentRider.status === 'Off Duty' ? 'OFF DUTY (Offline)' : 'ON DUTY (Receiving Orders)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Logout Rider"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 pt-3 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setActiveTab('available')}
                className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'available'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Available Orders</span>
                <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-md text-[10px] font-black">
                  {availableOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'active'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span>My Active Deliveries</span>
                {myActiveOrders.length > 0 && (
                  <span className="bg-rose-500 text-white px-2 py-0.2 rounded-full text-[10px] font-black animate-pulse">
                    {myActiveOrders.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'history'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Earnings & History</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Rider Profile</span>
              </button>
            </div>

            {/* TAB CONTENT PANELS */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* TAB 1: AVAILABLE ORDERS FOR PICKUP */}
              {activeTab === 'available' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-white text-base">Orders Ready for Pickup</h4>
                      <p className="text-xs text-slate-400">Accept an order to pick up items from Nethaji Store and deliver to customer.</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-xl">
                      {availableOrders.length} Available
                    </span>
                  </div>

                  {availableOrders.length === 0 ? (
                    <div className="bg-slate-800/40 border border-slate-800 p-8 rounded-3xl text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mx-auto">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-300 text-sm">No Unassigned Orders Right Now</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        All incoming customer orders have been assigned or delivered. Keep your duty status set to ON DUTY to receive new orders automatically!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableOrders.map(order => {
                        const earning = calculateRiderEarningForOrder(order, settings);
                        return (
                        <div 
                          key={order.id} 
                          className="bg-slate-800/90 border border-slate-700/90 rounded-2xl p-4 space-y-3.5 shadow-md hover:border-amber-500/50 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            {/* Top info badge */}
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="font-black text-amber-400 text-xs bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                                {order.orderNumber}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="bg-slate-900 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700">
                                  📍 {earning.distanceKm} KM
                                </span>
                                <span className="bg-emerald-950 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-800">
                                  💰 ₹{earning.totalEarning} Earning
                                </span>
                              </div>
                            </div>

                            {/* Addresses */}
                            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-xs space-y-2">
                              <div className="flex items-start gap-2 text-slate-300">
                                <Package className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-black text-white text-[11px] uppercase tracking-wider">Pickup Point:</p>
                                  <p className="text-slate-300 text-[11px] font-semibold">{settings?.storeName || 'Nethaji Mini Mart'} ({settings?.city || 'Erode'})</p>
                                </div>
                              </div>

                              <div className="border-t border-slate-800 pt-1.5 flex items-start gap-2 text-slate-300">
                                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-black text-white text-[11px] uppercase tracking-wider">Delivery Destination:</p>
                                  <p className="text-slate-300 text-[11px] font-semibold">{order.address.street}, {order.address.area || order.address.city} - {order.address.pincode}</p>
                                </div>
                              </div>
                            </div>

                            {/* Items overview */}
                            <div className="text-xs text-slate-400">
                              <span className="font-bold text-slate-300">Items ({order.items.length}): </span>
                              <span>{order.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}</span>
                            </div>

                            {/* Payment mode badge */}
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                              <span className="text-slate-400 text-[11px]">Payment Mode:</span>
                              <span className={`font-black text-[11px] px-2 py-0.5 rounded-md ${
                                order.paymentMethod === 'COD' 
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}>
                                {order.paymentMethod === 'COD' ? `Collect ₹${order.totalAmount} Cash` : `PAID Online (₹${order.totalAmount})`}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAcceptOrder(order.id)}
                            disabled={actionLoadingId === order.id}
                            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            <span>{actionLoadingId === order.id ? 'Accepting Order...' : 'Accept Order & Start Pickup'}</span>
                          </button>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MY ACTIVE DELIVERIES */}
              {activeTab === 'active' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-white text-base">Active Assigned Deliveries</h4>
                      <p className="text-xs text-slate-400">Manage pickup from store and live dropoff to customer.</p>
                    </div>
                    <span className="text-xs font-bold text-rose-400 bg-rose-950 px-3 py-1 rounded-xl border border-rose-800">
                      {myActiveOrders.length} In Progress
                    </span>
                  </div>

                  {myActiveOrders.length === 0 ? (
                    <div className="bg-slate-800/40 border border-slate-800 p-8 rounded-3xl text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mx-auto">
                        <Navigation className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-300 text-sm">No Active Deliveries Assigned</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Go to the <strong className="text-amber-400">Available Orders</strong> tab to pick up new delivery requests!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myActiveOrders.map(order => (
                        <div 
                          key={order.id}
                          className="bg-slate-800 border-2 border-amber-500/80 rounded-3xl p-5 space-y-4 shadow-xl"
                        >
                          {/* Order Header */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
                            <div>
                              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                                ACTIVE DELIVERY
                              </span>
                              <h5 className="font-black text-white text-base mt-1 flex items-center gap-2">
                                <span>{order.orderNumber}</span>
                                <span className="text-xs text-slate-400 font-semibold">• {order.customerName}</span>
                              </h5>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Call Customer</span>
                              </a>
                              <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(`${order.address.street}, ${order.address.city}, ${order.address.pincode}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Maps</span>
                              </a>
                            </div>
                          </div>

                          {/* Pickup & Drop Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                              <p className="font-extrabold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                                <Package className="w-3.5 h-3.5" />
                                <span>Step 1: Store Pickup</span>
                              </p>
                              <p className="font-bold text-white">{settings?.storeName || 'Nethaji Mini Mart'}</p>
                              <p className="text-slate-400 text-[11px]">{settings?.address || 'Main Road'}, {settings?.city || 'Erode'}</p>
                              <p className="text-slate-300 text-[11px] pt-1 border-t border-slate-800">
                                📞 Store Call: <a href={`tel:${settings?.phone || '9443312345'}`} className="text-amber-300 underline font-bold">{settings?.phone || '+91 94433 12345'}</a>
                              </p>
                            </div>

                            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="font-extrabold text-rose-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>Step 2: Customer Address</span>
                                </p>
                                {order.sharedLocation && (
                                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-md border border-emerald-500/40 uppercase animate-pulse">
                                    📍 Customer Shared GPS Pin
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-white">{order.customerName} ({order.customerPhone})</p>
                              <p className="text-slate-300 text-[11px]">{order.address.street}, {order.address.area || order.address.city} - {order.address.pincode}</p>
                              
                              {order.address.landmark && (
                                <p className="text-amber-300 text-[11px] font-bold">Landmark: {order.address.landmark}</p>
                              )}

                              {/* Zepto style shared location pin notes */}
                              {order.sharedLocation && (
                                <div className="mt-2 pt-2 border-t border-slate-800 bg-slate-950 p-2.5 rounded-xl space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-black text-amber-400 uppercase">Exact Drop Pin Details</span>
                                    <span className="text-slate-500 font-mono">
                                      {order.sharedLocation.lat.toFixed(5)}, {order.sharedLocation.lng.toFixed(5)}
                                    </span>
                                  </div>

                                  {order.sharedLocation.floorDoor && (
                                    <p className="text-[11px] text-white font-extrabold">
                                      🏢 Floor/Door: <span className="text-amber-300">{order.sharedLocation.floorDoor}</span>
                                    </p>
                                  )}

                                  {order.sharedLocation.gateInstructions && (
                                    <p className="text-[11px] text-slate-300 font-medium">
                                      🔔 Gate Instructions: <span className="text-slate-200">{order.sharedLocation.gateInstructions}</span>
                                    </p>
                                  )}

                                  <a
                                    href={`https://maps.google.com/?q=${order.sharedLocation.lat},${order.sharedLocation.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                  >
                                    <Navigation className="w-3.5 h-3.5" />
                                    <span>Navigate to Customer Pin (Google Maps)</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Items Checklist */}
                          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/80 space-y-2 text-xs">
                            <p className="font-extrabold text-slate-300 text-[11px] uppercase tracking-wider">
                              Verify Order Items ({order.items.length}):
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl text-slate-200 font-semibold">
                                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span className="truncate">{item.productName} ({item.unit})</span>
                                  <span className="ml-auto bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-black">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Payment Collection Info */}
                          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <p className="text-slate-400 font-bold text-[11px]">Payment Collection:</p>
                              <p className="font-black text-white text-sm">
                                {order.paymentMethod === 'COD' ? `Collect ₹${order.totalAmount} in Cash` : `Prepaid Online (₹${order.totalAmount})`}
                              </p>
                            </div>

                            <span className={`font-extrabold px-3 py-1 rounded-xl text-xs ${
                              order.paymentMethod === 'COD' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                            }`}>
                              {order.paymentMethod === 'COD' ? '💵 COD ORDER' : '✅ PAID ONLINE'}
                            </span>
                          </div>

                          {/* Action Buttons for Pickup, Arrival, and Delivery */}
                          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => handleRiderStepAction(order.id, 'picked-up')}
                              disabled={actionLoadingId === order.id}
                              className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Package className="w-4 h-4" />
                              <span>Confirm Store Pickup</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRiderStepAction(order.id, 'arrived')}
                              disabled={actionLoadingId === order.id}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>Mark Arrived at Location</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRiderStepAction(order.id, 'delivered')}
                              disabled={actionLoadingId === order.id}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Complete Delivery</span>
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EARNINGS & TRIP HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-1">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Today's Earnings</p>
                      <p className="text-2xl font-black text-emerald-400">₹{totalEarningsToday}</p>
                      <p className="text-[10px] text-emerald-300 font-semibold">Calculated at ₹{settings?.riderPerKmRate ?? 15}/KM + ₹{settings?.riderBasePay ?? 25} Base</p>
                    </div>

                    <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-1">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed Trips Today</p>
                      <p className="text-2xl font-black text-amber-400">{myDeliveredOrders.length}</p>
                      <p className="text-[10px] text-slate-500">Lifetime: {currentRider.completedDeliveriesCount} deliveries</p>
                    </div>

                    <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-1">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Rider Rating</p>
                      <p className="text-2xl font-black text-white flex items-center gap-1">
                        <span>{currentRider.rating}</span>
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      </p>
                      <p className="text-[10px] text-emerald-400 font-bold">100% On-Time Completion</p>
                    </div>
                  </div>

                  {/* Trip Log List */}
                  <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-3">
                    <h5 className="font-extrabold text-white text-sm">Delivered Orders Log</h5>

                    {myDeliveredOrders.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No delivered orders logged yet for this session.</p>
                    ) : (
                      <div className="divide-y divide-slate-700/80 text-xs">
                        {myDeliveredOrders.map(order => {
                          const earning = calculateRiderEarningForOrder(order, settings);
                          return (
                          <div key={order.id} className="py-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-white flex items-center gap-2">
                                <span>{order.orderNumber}</span>
                                <span className="text-[10px] font-bold text-slate-400">({order.customerName})</span>
                              </p>
                              <p className="text-slate-400 text-[11px]">
                                📍 {earning.distanceKm} KM ({earning.perKmRate}₹/KM) • {order.address.area || order.address.city} • {order.paymentMethod}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-black text-emerald-400 text-sm">+₹{earning.totalEarning}</p>
                              <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded uppercase font-bold">DELIVERED</span>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: RIDER PROFILE */}
              {activeTab === 'profile' && (
                <div className="max-w-xl mx-auto bg-slate-800/90 border border-slate-700 p-6 rounded-3xl space-y-5 text-xs">
                  <div className="flex items-center gap-4 border-b border-slate-700 pb-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0">
                      {currentRider.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">{currentRider.name}</h4>
                      <p className="text-slate-400">{currentRider.email || `${currentRider.phone}@nethajiriders.com`}</p>
                      <span className="bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-800 mt-1 inline-block">
                        VERIFIED DELIVERY PARTNER
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 font-extrabold text-[11px]">Mobile Phone</p>
                      <p className="font-bold text-white text-sm">{currentRider.phone}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-extrabold text-[11px]">Vehicle Details</p>
                      <p className="font-bold text-amber-400 text-sm">{currentRider.vehicleType} ({currentRider.vehicleNumber})</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-extrabold text-[11px]">Assigned Operating Zone</p>
                      <p className="font-bold text-white">{currentRider.assignedZone}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-extrabold text-[11px]">Partner Since</p>
                      <p className="font-bold text-white">{currentRider.joinedDate}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 space-y-1">
                    <p className="font-extrabold text-amber-400 text-xs flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      <span>Dispatch Helpdesk</span>
                    </p>
                    <p className="text-slate-300 text-[11px]">
                      Having trouble with an order or location? Contact Nethaji Store Admin: <strong className="text-white">{settings?.phone || '+91 94433 12345'}</strong>
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Footer info bar */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 text-[11px] text-slate-400 text-center flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 px-5">
          <p>Nethaji Store Delivery Partner Fleet System • Version 2.4</p>
          <div className="flex items-center gap-3 font-semibold text-slate-300">
            <span>Store Support: {settings?.phone || '+91 94433 12345'}</span>
            <span>•</span>
            <span>Erode Central</span>
          </div>
        </div>

      </div>
    </div>
  );
};
