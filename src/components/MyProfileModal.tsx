import React, { useState, useEffect } from 'react';
import { 
  User, Phone, MapPin, Heart, ShieldCheck, 
  X, ChevronRight, ShoppingBag, Edit2, ArrowLeft,
  MessageSquare, Wallet, RotateCcw, CreditCard, Gift,
  CheckCircle2, HelpCircle, PackageX, AlertCircle, RefreshCw, Check,
  Package, Truck, Undo2
} from 'lucide-react';
import { DeliveryLocation, Order } from '../types';
import { api } from '../services/api';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserPhone: string | null;
  deliveryLocation: DeliveryLocation;
  onOpenLocationModal: () => void;
  onOpenOrders: () => void;
  onOpenWishlist: () => void;
  wishlistCount: number;
  ordersCount: number;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  onOpenAdminAuth: () => void;
  onLogout?: () => void;
  onOpenAuth?: () => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  isOpen,
  onClose,
  currentUserPhone,
  deliveryLocation,
  onOpenLocationModal,
  onOpenOrders,
  onOpenWishlist,
  wishlistCount,
  ordersCount,
  isAdminMode,
  onToggleAdminMode,
  onOpenAdminAuth,
  onLogout,
  onOpenAuth
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'returns'>('profile');
  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('nethaji_user_name') || 'Customer';
  });
  const [userPhone, setUserPhone] = useState(() => {
    return currentUserPhone || '';
  });
  const [showSupportToast, setShowSupportToast] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Delivered Orders & Returns State
  const [userOrdersList, setUserOrdersList] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState<string>('Defective / Damaged Product');
  const [returnComments, setReturnComments] = useState<string>('');
  const [refundUpiId, setRefundUpiId] = useState<string>('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState<boolean>(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  // Default Saved Address state for login number
  const [savedAddress, setSavedAddress] = useState<any>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editStreet, setEditStreet] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [addressSavedToast, setAddressSavedToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserOrders();
      const activePhone = currentUserPhone || userPhone || localStorage.getItem('nethaji_user_phone') || '';
      const cleanPhone = activePhone.replace(/[^0-9]/g, '');
      if (cleanPhone) {
        const stored = localStorage.getItem(`nethaji_saved_address_${cleanPhone}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setSavedAddress(parsed);
            setEditStreet(parsed.streetAddress || '');
            setEditArea(parsed.area || '');
            setEditLandmark(parsed.landmark || '');
            setEditPincode(parsed.pincode || '');
          } catch (e) {}
        } else {
          setEditStreet('');
          setEditArea(deliveryLocation.area || '');
          setEditLandmark('');
          setEditPincode(deliveryLocation.pincode || '');
        }
      }
    }
  }, [isOpen, currentUserPhone, userPhone, deliveryLocation]);

  const handleSaveDefaultAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const activePhone = currentUserPhone || userPhone || localStorage.getItem('nethaji_user_phone') || '';
    const cleanPhone = activePhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      alert("Please login with your phone number to save a default address.");
      return;
    }

    const newAddress = {
      customerName: userName,
      customerPhone: activePhone,
      streetAddress: editStreet,
      area: editArea,
      landmark: editLandmark,
      pincode: editPincode,
      city: deliveryLocation.city || 'Lakkinayakanpatti'
    };

    localStorage.setItem(`nethaji_saved_address_${cleanPhone}`, JSON.stringify(newAddress));
    localStorage.setItem('nethaji_delivery_location', JSON.stringify({
      city: deliveryLocation.city || 'Lakkinayakanpatti',
      pincode: editPincode,
      area: editArea || editStreet
    }));

    setSavedAddress(newAddress);
    setIsEditingAddress(false);
    setAddressSavedToast(true);
    setTimeout(() => setAddressSavedToast(false), 3000);
  };

  const fetchUserOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const phoneToUse = currentUserPhone || userPhone;
      const orders = await api.getOrders({ phone: phoneToUse });
      setUserOrdersList(orders || []);
    } catch (err) {
      console.error("Failed to load user orders for return view", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nethaji_user_name', userName);
    setIsEditingName(false);
  };

  const handleTriggerSupport = () => {
    setShowSupportToast(true);
    setTimeout(() => setShowSupportToast(false), 3000);
  };

  const handlePerformLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setConfirmLogout(false);
    onClose();
  };

  const handleOpenReturnForm = (order: Order) => {
    setSelectedOrderForReturn(order);
    setReturnReason('Defective / Damaged Product');
    setReturnComments('');
    const defaultUpi = (currentUserPhone || userPhone).replace(/[^0-9]/g, '') + '@upi';
    setRefundUpiId(defaultUpi);
    setReturnSuccessMsg(null);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReturn) return;

    try {
      setIsSubmittingReturn(true);
      const updatedOrder = await api.requestOrderReturn(selectedOrderForReturn.id, {
        reason: returnReason,
        comments: returnComments.trim(),
        refundUpiId: refundUpiId.trim() || `${userPhone}@upi`,
        refundUpiName: userName,
        refundUpiProvider: 'BHIM UPI',
        refundAmount: selectedOrderForReturn.totalAmount
      });

      setUserOrdersList(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setReturnSuccessMsg(`Return request for Order #${selectedOrderForReturn.orderNumber} submitted successfully! Your refund of ₹${selectedOrderForReturn.totalAmount} will be transferred to UPI (${refundUpiId.trim()}).`);

      setTimeout(() => {
        setSelectedOrderForReturn(null);
        setReturnSuccessMsg(null);
      }, 3500);
    } catch (err) {
      alert("Failed to submit return request. Please try again.");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const deliveredOrders = userOrdersList.filter(o => o.orderStatus === 'Delivered');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#f2f6f7] w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[94vh] sm:h-[88vh] animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="bg-white px-4 py-3 sm:px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'returns') {
                  setActiveTab('profile');
                  setSelectedOrderForReturn(null);
                } else {
                  onClose();
                }
              }}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === 'returns' ? 'Return Delivered Product' : 'My Profile'}
            </h2>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setSelectedOrderForReturn(null);
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('returns');
                fetchUserOrders();
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'returns' 
                  ? 'bg-rose-600 text-white shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Returns</span>
              {deliveredOrders.length > 0 && (
                <span className="bg-rose-200 text-rose-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {deliveredOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'returns' ? (
          /* DELIVERED PRODUCTS RETURN SECTION */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-[#f2f6f7]">
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-start gap-3 text-rose-950 text-xs">
              <RotateCcw className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm text-rose-900">Delivered Product Returns & Refunds</p>
                <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                  Select a delivered order below to request a return with your specific reason (damage, wrong item, expiry, or quality issue). Instant UPI refund supported.
                </p>
              </div>
            </div>

            {isLoadingOrders ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-7 h-7 text-rose-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading your delivered orders...</p>
              </div>
            ) : deliveredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <PackageX className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">No Delivered Orders Found</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    You don't have any delivered orders eligible for return at this moment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOrders();
                  }}
                  className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-black transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>View All Orders Tracker</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    
                    {/* Order Header */}
                    <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Order ID</span>
                        <span className="text-xs font-black text-slate-900">#{order.orderNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Delivered On</span>
                        <span className="text-xs font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Total</span>
                        <span className="text-xs font-black text-emerald-700">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Items Brief */}
                    <div className="p-3.5 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-xl pr-3">
                            <img src={item.image} alt={item.productName} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                            <div className="text-[11px] leading-tight">
                              <span className="font-bold text-slate-800 block truncate max-w-[130px]">{item.productName}</span>
                              <span className="text-slate-500 font-semibold">{item.quantity} x {item.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Existing Return Request Status if present */}
                      {order.returnRequest ? (
                        <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-amber-950 flex items-center gap-1.5">
                              <RotateCcw className="w-4 h-4 text-amber-600" />
                              Return Request Status:
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              order.returnRequest.status === 'Requested' ? 'bg-amber-200 text-amber-950' :
                              order.returnRequest.status === 'Approved' ? 'bg-blue-200 text-blue-950' :
                              order.returnRequest.status === 'Refunded' ? 'bg-emerald-200 text-emerald-950' :
                              'bg-rose-200 text-rose-950'
                            }`}>
                              {order.returnRequest.status === 'Requested' && '🟡 Pending Review'}
                              {order.returnRequest.status === 'Approved' && '🔵 Approved'}
                              {order.returnRequest.status === 'Refunded' && '🟢 Refund Credited'}
                              {order.returnRequest.status === 'Rejected' && '🔴 Request Rejected'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-700 space-y-1 bg-white p-2.5 rounded-lg border border-amber-100">
                            <p><strong className="text-slate-900">Reason:</strong> {order.returnRequest.reason}</p>
                            {order.returnRequest.comments && <p><strong className="text-slate-900">Comments:</strong> {order.returnRequest.comments}</p>}
                            <p><strong className="text-slate-900">Refund Target UPI:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-black">{order.returnRequest.refundUpiId}</code></p>
                            {order.returnRequest.adminNote && (
                              <p className="text-amber-900 font-extrabold pt-1 border-t border-slate-100">
                                Note from Store Admin: {order.returnRequest.adminNote}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Initiating Return Form toggle button */
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenReturnForm(order)}
                            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                            <span>Request Product Return</span>
                          </button>
                        </div>
                      )}

                      {/* Return Form Inline inside Order Card */}
                      {selectedOrderForReturn?.id === order.id && (
                        <div className="mt-3 p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                            <span className="font-black text-rose-950 text-xs flex items-center gap-1.5">
                              <RotateCcw className="w-4 h-4 text-rose-600" />
                              Return Reason & Refund Details
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForReturn(null)}
                              className="text-rose-400 hover:text-rose-800 p-0.5"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {returnSuccessMsg ? (
                            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-extrabold text-center space-y-1">
                              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                              <p>{returnSuccessMsg}</p>
                            </div>
                          ) : (
                            <form onSubmit={handleSubmitReturn} className="space-y-3">
                              {/* Reason Selection */}
                              <div>
                                <label className="block text-[11px] font-black text-slate-800 mb-1">
                                  Reason for Returning Delivered Product *
                                </label>
                                <select
                                  value={returnReason}
                                  onChange={(e) => setReturnReason(e.target.value)}
                                  className="w-full bg-white border border-rose-200 text-slate-900 font-bold text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                >
                                  <option value="Defective / Damaged Product">Defective / Damaged Product</option>
                                  <option value="Wrong Item / Variant Received">Wrong Item or Variant Received</option>
                                  <option value="Quality Not Satisfactory">Quality Not Satisfactory / Taste Issue</option>
                                  <option value="Item Expired or Near Expiry">Item Expired or Near Expiry</option>
                                  <option value="Missing Items from Package">Missing Items from Package</option>
                                  <option value="Product Not as Described">Product Not as Described in App</option>
                                  <option value="Changed Mind / Don't Need Anymore">Changed Mind / Don't Need Anymore</option>
                                </select>
                              </div>

                              {/* Additional Comments */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Additional Description / Comments
                                </label>
                                <textarea
                                  rows={2}
                                  placeholder="Describe the issue with the delivered item..."
                                  value={returnComments}
                                  onChange={(e) => setReturnComments(e.target.value)}
                                  className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                />
                              </div>

                              {/* UPI ID for Refund */}
                              <div>
                                <label className="block text-[11px] font-black text-slate-800 mb-1">
                                  UPI ID for Instant Refund (₹{order.totalAmount}) *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. 9360193207@upi or name@okaxis"
                                  value={refundUpiId}
                                  onChange={(e) => setRefundUpiId(e.target.value)}
                                  className="w-full bg-white border border-rose-200 font-black text-xs text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                  required
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForReturn(null)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={isSubmittingReturn}
                                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {isSubmittingReturn ? (
                                    <span>Submitting...</span>
                                  ) : (
                                    <>
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Confirm & Submit Return Request</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* REGULAR PROFILE MAIN TAB */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#f2f6f7]">

            {/* User Profile Avatar & Header */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-full bg-purple-900 text-white font-black flex items-center justify-center text-2xl shadow-md shrink-0">
                  <User className="w-8 h-8 fill-white text-purple-900" />
                </div>

                <div className="min-w-0">
                  {currentUserPhone ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-base sm:text-lg font-black text-slate-900 truncate tracking-tight">{userName}</h2>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(!isEditingName)}
                          className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Edit Profile Name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {currentUserPhone}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-base font-black text-slate-900 truncate tracking-tight">Guest Customer</h2>
                      <p className="text-xs font-semibold text-rose-600 mt-0.5">
                        Not Logged In (Browse Mode)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Login vs Logout Header Button */}
              {currentUserPhone ? (
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0"
                >
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-900 to-rose-900 text-white rounded-xl text-xs font-black shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
                >
                  Login / Sign Up
                </button>
              )}
            </div>

            {/* Quick Edit Name Form */}
            {isEditingName && (
              <form onSubmit={handleSaveName} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Update Account Profile</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      placeholder="Enter profile name"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-extrabold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-2xs"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            )}

            {/* Top Quick Action Cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* Card 1: Your Orders */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrders();
                }}
                className="bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group active:scale-97"
              >
                <ShoppingBag className="w-6 h-6 text-slate-800 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-black text-slate-800 leading-tight">
                  Your Orders
                </span>
              </button>

              {/* Card 2: Return Delivered Item */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('returns');
                  fetchUserOrders();
                }}
                className="bg-rose-50/70 hover:bg-rose-100/80 p-4 rounded-2xl border border-rose-200 shadow-2xs flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group active:scale-97"
              >
                <RotateCcw className="w-6 h-6 text-rose-600 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-black text-rose-950 leading-tight">
                  Return Item
                </span>
              </button>

              {/* Card 3: Your Wishlist */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWishlist();
                }}
                className="bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group active:scale-97"
              >
                <Heart className="w-6 h-6 text-slate-800 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-black text-slate-800 leading-tight">
                  Your Wishlist
                </span>
              </button>
            </div>

            {/* Support Toast Notification */}
            {showSupportToast && (
              <div className="bg-slate-900 text-white p-3 rounded-xl text-xs font-extrabold flex items-center justify-between animate-in fade-in duration-150">
                <span>🎧 Support representative connected: 24x7 Helpline +91 94433 12345</span>
                <button onClick={() => setShowSupportToast(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Section: Money Center */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Money Center
              </h3>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-slate-800 shrink-0" />
                  <span className="text-xs font-black text-slate-900">
                    Nethaji Cash & Gift Card
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">₹0</span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Section: Default Saved Delivery Address */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>Default Delivery Address</span>
                </h3>
                {currentUserPhone && (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Linked to {currentUserPhone}
                  </span>
                )}
              </div>

              {addressSavedToast && (
                <div className="bg-emerald-800 text-white p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Default delivery address updated successfully!</span>
                </div>
              )}

              {isEditingAddress ? (
                <form onSubmit={handleSaveDefaultAddress} className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-3 shadow-2xs">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                    Set Default Delivery Address ({currentUserPhone || 'Login Number'})
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Door No. / Street Address *</label>
                      <input
                        type="text"
                        required
                        value={editStreet}
                        onChange={(e) => setEditStreet(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        placeholder="House no., Street name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Area / Locality</label>
                        <input
                          type="text"
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                          placeholder="Area name"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">PIN Code *</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={editPincode}
                          onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                          placeholder="6-digit PIN"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Landmark</label>
                      <input
                        type="text"
                        value={editLandmark}
                        onChange={(e) => setEditLandmark(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        placeholder="Near school, temple, etc."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-2xs"
                    >
                      Save Default Address
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  {savedAddress && (savedAddress.streetAddress || savedAddress.pincode) ? (
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900">
                          {savedAddress.streetAddress || 'Address set'}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-600">
                          {[savedAddress.area, savedAddress.landmark, savedAddress.city, savedAddress.pincode].filter(Boolean).join(', ')}
                        </p>
                        <p className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Saved as Default for {currentUserPhone || 'this login'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(true)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-extrabold transition-colors shrink-0"
                      >
                        Edit Address
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-slate-800">No Default Address Saved</p>
                        <p className="text-[11px] font-medium text-slate-500">
                          {currentUserPhone ? `Add a delivery address to link with ${currentUserPhone}` : 'Login to save your default address'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!currentUserPhone && onOpenAuth) {
                            onClose();
                            onOpenAuth();
                          } else {
                            setIsEditingAddress(true);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-colors shrink-0"
                      >
                        {currentUserPhone ? '+ Add Address' : 'Login First'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section: Your Information */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Your Information
              </h3>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                
                {/* DELIVERED PRODUCT RETURN OPTION WITH REASON */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('returns');
                    fetchUserOrders();
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50/60 transition-colors cursor-pointer group bg-gradient-to-r from-rose-50/40 to-amber-50/40 border-l-4 border-l-rose-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight flex items-center gap-1.5">
                        Return Delivered Product
                        <span className="text-[10px] bg-rose-100 text-rose-900 font-extrabold px-2 py-0.5 rounded-full">
                          Reason & UPI Refund
                        </span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">
                        Select reason (defect, wrong item, quality) for return
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Item 1: Your Refunds */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOrders();
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-slate-800 shrink-0" />
                    <span className="text-xs font-black text-slate-900">
                      Your Refunds & Order Tracker
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Item 2: Your Wishlist */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWishlist();
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-slate-800 shrink-0" />
                    <span className="text-xs font-black text-slate-900">
                      Your Wishlist
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Item 3: E-Gift Cards */}
                <button
                  type="button"
                  onClick={handleTriggerSupport}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-slate-800 shrink-0" />
                    <span className="text-xs font-black text-slate-900">
                      E-Gift Cards
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Item 4: Help & Support */}
                <button
                  type="button"
                  onClick={handleTriggerSupport}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-slate-800 shrink-0" />
                    <span className="text-xs font-black text-slate-900">
                      Help & Support
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Item 5: Saved Addresses */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLocationModal();
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-800 shrink-0" />
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        Saved Addresses
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
                        1 Address ({deliveryLocation.city} - {deliveryLocation.pincode})
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Item 6: Store Admin Mode Access */}
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-black text-white block leading-tight">
                        Store Admin Dashboard
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {isAdminMode ? "Currently Active in Admin Mode" : "Manage products, orders & inventory"}
                      </span>
                    </div>
                  </div>

                  {isAdminMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onToggleAdminMode();
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Exit Admin
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdminAuth();
                      }}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer"
                    >
                      Admin Login
                    </button>
                  )}
                </div>

                {/* Item 7: Customer Logout or Login Button */}
                {currentUserPhone ? (
                  <button
                    type="button"
                    onClick={() => setConfirmLogout(true)}
                    className="w-full p-4 flex items-center justify-between text-left bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer font-extrabold text-xs"
                  >
                    <span className="flex items-center gap-2">
                      🚪 Logout from NethajiMiniMart Account
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenAuth) onOpenAuth();
                    }}
                    className="w-full p-4 flex items-center justify-between text-left bg-purple-50 hover:bg-purple-100 text-purple-900 transition-colors cursor-pointer font-extrabold text-xs"
                  >
                    <span className="flex items-center gap-2">
                      🔑 Log In / Create NethajiMiniMart Account
                    </span>
                    <ChevronRight className="w-4 h-4 text-purple-700" />
                  </button>
                )}

              </div>
            </div>

          </div>
        )}

      </div>

      {/* Logout Confirmation Dialog */}
      {confirmLogout && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900">Are you sure you want to log out?</h3>
            <p className="text-xs text-slate-600 font-medium">
              You will need to log in again to place orders and view saved addresses.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformLogout}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

