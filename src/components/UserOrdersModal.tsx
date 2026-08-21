import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { 
  X, Search, Package, Clock, CheckCircle2, Truck, AlertCircle, RefreshCw, Printer, 
  RotateCcw, ChevronDown, ChevronUp, MapPin, CreditCard, ShieldCheck, FileText, Check,
  XCircle, Ban, AlertTriangle, Star, Phone, Bike, Zap, Navigation, User, Shield
} from 'lucide-react';
import { ShareRiderLocationModal } from './ShareRiderLocationModal';

interface UserOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onSearchOrdersByPhone: (phone: string) => void;
  currentUserPhone: string | null;
  setCurrentUserPhone: (phone: string) => void;
  onRefreshOrders?: () => void;
}

export const UserOrdersModal: React.FC<UserOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onSearchOrdersByPhone,
  currentUserPhone,
  setCurrentUserPhone,
  onRefreshOrders
}) => {
  const [phoneInput, setPhoneInput] = useState(currentUserPhone || "");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [selectedOrderForLocationShare, setSelectedOrderForLocationShare] = useState<Order | null>(null);
  const [liveToast, setLiveToast] = useState<string | null>(null);

  // Real-time EventSource listener for live order tracking status
  useEffect(() => {
    if (!isOpen) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/orders/live-stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ORDER_UPDATED' && data.order) {
            // Trigger refresh
            if (onRefreshOrders) {
              onRefreshOrders();
            } else if (currentUserPhone) {
              onSearchOrdersByPhone(currentUserPhone);
            }

            if (currentUserPhone && data.order.customerPhone?.includes(currentUserPhone.replace(/[^0-9]/g, ''))) {
              setLiveToast(`⚡ Live Update: Order #${data.order.orderNumber} is now ${data.order.orderStatus}!`);
              setTimeout(() => setLiveToast(null), 4500);
            }
          }
        } catch (e) {
          console.error("Failed to parse live tracking SSE message", e);
        }
      };
    } catch (err) {
      console.warn("Live stream SSE connection warning", err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isOpen, currentUserPhone, onRefreshOrders, onSearchOrdersByPhone]);

  // Amazon-Style Cancel Order State
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("Order created by mistake");
  const [cancelComments, setCancelComments] = useState("");
  const [cancelUpiId, setCancelUpiId] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Return Form State (UPI Payment Gateway Only)
  const [returnReason, setReturnReason] = useState("Defective / Damaged Product");
  const [returnComments, setReturnComments] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [upiProvider, setUpiProvider] = useState<'Google Pay' | 'PhonePe' | 'Paytm' | 'BHIM UPI' | 'Other UPI'>("Google Pay");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  // Star Rating & Feedback State
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenOrderDetails = (order: Order) => {
    setSelectedOrderForDetails(order);
    setRatingValue(order.rating || 5);
    setHoverRating(0);
    setFeedbackText(order.feedback || '');
    setRatingSuccessMsg(null);
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDetails) return;

    try {
      setIsSubmittingRating(true);
      const updatedOrder = await api.rateOrder(selectedOrderForDetails.id, ratingValue, feedbackText.trim());
      setSelectedOrderForDetails(updatedOrder);
      setRatingSuccessMsg("Thank you! Your star rating and feedback have been saved.");

      if (onRefreshOrders) {
        onRefreshOrders();
      } else if (currentUserPhone) {
        onSearchOrdersByPhone(currentUserPhone);
      }

      setTimeout(() => {
        setRatingSuccessMsg(null);
      }, 3000);
    } catch (err) {
      alert("Failed to save rating. Please try again.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setCurrentUserPhone(phoneInput.trim());
    onSearchOrdersByPhone(phoneInput.trim());
  };

  const handleOpenCancelModal = (order: Order) => {
    setSelectedOrderForCancel(order);
    setCancelReason("Order created by mistake");
    setCancelComments("");
    setCancelUpiId(order.customerPhone ? `${order.customerPhone.replace(/[^0-9]/g, '')}@upi` : "");
    setCancelSuccessMsg(null);
  };

  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForCancel) return;

    try {
      setIsSubmittingCancel(true);
      await api.cancelOrder(selectedOrderForCancel.id, {
        reason: cancelReason,
        comments: cancelComments,
        cancelUpiId: selectedOrderForCancel.paymentMethod !== 'Cash on Delivery' ? cancelUpiId.trim() : undefined
      });

      setCancelSuccessMsg(`Order #${selectedOrderForCancel.orderNumber} has been successfully cancelled! ${selectedOrderForCancel.paymentMethod !== 'Cash on Delivery' && cancelUpiId ? `Your refund of ₹${selectedOrderForCancel.totalAmount} will be transferred to UPI ID (${cancelUpiId}).` : 'No charges were deducted.'}`);

      if (onRefreshOrders) {
        onRefreshOrders();
      } else if (currentUserPhone) {
        onSearchOrdersByPhone(currentUserPhone);
      }

      setTimeout(() => {
        setSelectedOrderForCancel(null);
        setCancelSuccessMsg(null);
      }, 3500);
    } catch (err) {
      alert("Failed to cancel order. Please try again.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleOpenReturnModal = (order: Order) => {
    setSelectedOrderForReturn(order);
    setReturnReason("Defective / Damaged Product");
    setReturnComments("");
    setUpiId(order.customerPhone ? `${order.customerPhone.replace(/[^0-9]/g, '')}@upi` : "");
    setUpiName(order.customerName || "");
    setUpiProvider("Google Pay");
    setReturnSuccessMsg(null);
  };

  const handleSubmitReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReturn) return;
    if (!upiId.trim()) {
      alert("Please enter a valid UPI ID for processing your refund via UPI payment gateway.");
      return;
    }

    try {
      setIsSubmittingReturn(true);
      await api.requestOrderReturn(selectedOrderForReturn.id, {
        reason: returnReason,
        comments: returnComments,
        refundUpiId: upiId.trim(),
        refundUpiName: upiName.trim() || selectedOrderForReturn.customerName,
        refundUpiProvider: upiProvider,
        refundAmount: selectedOrderForReturn.totalAmount
      });

      setReturnSuccessMsg(`Return request submitted successfully! Your refund of ₹${selectedOrderForReturn.totalAmount} will be transferred to UPI ID (${upiId}) upon Admin approval.`);
      
      if (onRefreshOrders) {
        onRefreshOrders();
      } else if (currentUserPhone) {
        onSearchOrdersByPhone(currentUserPhone);
      }

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

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Placed':
        return <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase">Placed</span>;
      case 'Approved':
        return <span className="bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase">Approved</span>;
      case 'Packed':
        return <span className="bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase">Packed</span>;
      case 'Out for Delivery':
        return <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase">Out for Delivery</span>;
      case 'Delivered':
        return <span className="bg-emerald-800 text-white px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase">Delivered</span>;
      case 'Cancelled':
        return <span className="bg-rose-100 text-rose-900 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase">{status}</span>;
    }
  };

  const getReturnStatusBadge = (order: Order) => {
    if (!order.returnRequest) return null;
    const { status, refundUpiId } = order.returnRequest;

    switch (status) {
      case 'Requested':
        return (
          <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 animate-spin" />
              <div>
                <p className="font-black text-amber-950">Return Requested (Pending Admin Review)</p>
                <p className="text-[11px] text-amber-800 font-medium">Refund Target UPI: <span className="font-extrabold">{refundUpiId}</span></p>
              </div>
            </div>
            <span className="bg-amber-200 text-amber-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase shrink-0">
              In Review
            </span>
          </div>
        );
      case 'Approved':
        return (
          <div className="bg-blue-50 border border-blue-300 p-2.5 rounded-xl flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <div>
                <p className="font-black text-blue-950">Return Approved by Admin</p>
                <p className="text-[11px] text-blue-800 font-medium">UPI Refund Payment In Progress → <span className="font-extrabold">{refundUpiId}</span></p>
              </div>
            </div>
            <span className="bg-blue-200 text-blue-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase shrink-0">
              UPI Processing
            </span>
          </div>
        );
      case 'Refunded':
        return (
          <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="font-black text-emerald-950">₹{order.returnRequest.refundAmount} Refunded Successfully via UPI</p>
                <p className="text-[11px] text-emerald-800 font-medium">Transferred to UPI ID: <span className="font-extrabold">{refundUpiId}</span></p>
              </div>
            </div>
            <span className="bg-emerald-700 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase shrink-0">
              UPI Refund Completed
            </span>
          </div>
        );
      case 'Rejected':
        return (
          <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-xl flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <div>
                <p className="font-black text-rose-950">Return Request Declined</p>
                {order.returnRequest.adminNote && (
                  <p className="text-[11px] text-rose-800 font-medium">Admin Note: {order.returnRequest.adminNote}</p>
                )}
              </div>
            </div>
            <span className="bg-rose-200 text-rose-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase shrink-0">
              Declined
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-700 shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h2 className="font-extrabold text-base">My Grocery Orders & Returns</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* Live Real-Time Notification Toast */}
          {liveToast && (
            <div className="bg-emerald-950 text-emerald-100 p-3 px-4 rounded-2xl shadow-xl border border-emerald-600 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-extrabold">{liveToast}</span>
              </div>
              <button onClick={() => setLiveToast(null)} className="text-[11px] text-emerald-300 hover:text-white font-black hover:underline cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {/* Mobile Number Search Bar */}
          <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Enter Registered Mobile Number to View Orders, Order Details & Request Returns:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. +91 94433 12345"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search Orders</span>
              </button>
            </div>
          </form>

          {/* Orders List */}
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 space-y-3 p-6 shadow-2xs">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-black text-slate-800">No orders found for this phone number</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Please place an order or enter the mobile number used during checkout to view order details and return items.
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
                    
                    {/* Order Header Bar */}
                    <div className="bg-slate-900 text-white p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-amber-400 text-sm">{order.orderNumber}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 text-[11px]">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.orderStatus)}
                        <span className="font-black text-emerald-400 text-sm">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Return Request Alert Banner (if exists) */}
                    {order.returnRequest && (
                      <div className="p-3 border-b border-slate-100 bg-slate-50">
                        {getReturnStatusBadge(order)}
                      </div>
                    )}

                    {/* Order Quick Summary Body */}
                    <div className="p-4 space-y-3">
                      
                      {/* Items Brief */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Ordered Items ({order.items.length})</span>
                          <span>Slot: {order.deliverySlot}</span>
                        </p>
                        <div className="space-y-1 divide-y divide-slate-100">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs pt-1 text-slate-800">
                              <span className="font-semibold">
                                {item.productName} <span className="text-slate-400 font-normal">({item.unit})</span> x {item.quantity}
                              </span>
                              <span className="font-extrabold text-slate-900">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Display Star Rating summary on Order Card if rated */}
                      {order.rating && (
                        <div className="mx-3 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-bold text-amber-950">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                            Rated {order.rating} / 5 Stars
                          </span>
                          {order.feedback && (
                            <span className="text-slate-600 font-medium italic text-[11px] truncate max-w-[220px]">
                              "{order.feedback}"
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Buttons Bar: View Details / Track Status / Cancel Order / Request Return */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenOrderDetails(order)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span>View Full Order Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Delivery Timeline' : 'Track Status'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* CANCEL ORDER BUTTON (Amazon style - Available for Placed, Approved, or Packed) */}
                          {['Placed', 'Approved', 'Packed'].includes(order.orderStatus) && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancelModal(order)}
                              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0 shadow-2xs"
                            >
                              <XCircle className="w-3.5 h-3.5 text-amber-700" />
                              <span>Cancel Items / Order</span>
                            </button>
                          )}

                          {/* OUT FOR DELIVERY NOTICE */}
                          {order.orderStatus === 'Out for Delivery' && (
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-emerald-600" />
                              Out for delivery (Refuse at doorstep or Return later)
                            </span>
                          )}

                          {/* RETURN ORDER BUTTON (Only for Delivered orders) */}
                          {order.orderStatus === 'Delivered' && (!order.returnRequest || order.returnRequest.status === 'Rejected') && (
                            <button
                              type="button"
                              onClick={() => handleOpenReturnModal(order)}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0 shadow-2xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                              <span>Return Item / Request Refund</span>
                            </button>
                          )}

                          {/* CANCELLED BADGE */}
                          {order.orderStatus === 'Cancelled' && (
                            <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl flex items-center gap-1">
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              Order Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable Real-Time Delivery Partner Tracker Panel */}
                      {isExpanded && (
                        <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3.5 mt-2 animate-in fade-in duration-200 shadow-md">
                          
                          {/* Live Status Header */}
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                                Live Delivery Executive Tracker
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full">
                              Real-Time Sync Active
                            </span>
                          </div>

                          {/* 5-Step Visual Progress Bar */}
                          <div className="py-2 px-1">
                            {(() => {
                              const steps = ['Placed', 'Approved', 'Packed', 'Out for Delivery', 'Delivered'];
                              const currentIdx = steps.indexOf(order.orderStatus);
                              const isCancelled = order.orderStatus === 'Cancelled';

                              if (isCancelled) {
                                return (
                                  <div className="bg-rose-950/80 border border-rose-800/80 p-3 rounded-xl text-rose-200 text-xs font-bold text-center">
                                    ❌ This order was cancelled. No delivery partner is assigned.
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-300">
                                    {steps.map((st, idx) => {
                                      const isPassed = idx <= currentIdx;
                                      const isCurrent = idx === currentIdx;
                                      return (
                                        <div key={st} className={`flex flex-col items-center gap-1 ${isCurrent ? 'text-amber-400 scale-105' : isPassed ? 'text-emerald-400' : 'text-slate-500'}`}>
                                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                                            isCurrent ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 animate-pulse' : isPassed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                                          }`}>
                                            {isPassed ? '✓' : idx + 1}
                                          </div>
                                          <span className="hidden sm:inline text-[9px] text-center max-w-[60px] truncate">{st}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                                    <div 
                                      className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full transition-all duration-500"
                                      style={{ width: `${Math.max(10, ((currentIdx + 1) / steps.length) * 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Zepto-Style Share Location Card */}
                          {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered' && (
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-amber-400" />
                                  <span className="font-extrabold text-white text-[11px]">Zepto Live Drop Location</span>
                                </div>
                                {order.sharedLocation ? (
                                  <span className="bg-emerald-500/20 text-emerald-300 font-black text-[9px] px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                                    ✓ GPS Pin Shared
                                  </span>
                                ) : (
                                  <span className="bg-amber-500/20 text-amber-300 font-bold text-[9px] px-2 py-0.5 rounded border border-amber-500/30">
                                    Recommended
                                  </span>
                                )}
                              </div>

                              {order.sharedLocation && (
                                <div className="text-[10px] text-slate-300 space-y-0.5 bg-slate-900/90 p-2 rounded-lg border border-slate-800 font-mono">
                                  <p className="text-amber-300 font-bold">Pin: {order.sharedLocation.lat.toFixed(5)}, {order.sharedLocation.lng.toFixed(5)}</p>
                                  {order.sharedLocation.floorDoor && <p className="text-slate-200">Floor/Door: {order.sharedLocation.floorDoor}</p>}
                                  {order.sharedLocation.gateInstructions && <p className="text-slate-400">Gate: {order.sharedLocation.gateInstructions}</p>}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedOrderForLocationShare(order)}
                                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>{order.sharedLocation ? 'Update Shared GPS Pin / Instructions' : '📍 Share Exact Pin Location with Rider (Zepto Style)'}</span>
                              </button>
                            </div>
                          )}

                          {/* Delivery Partner Executive Card (When Assigned or Out for Delivery) */}
                          {order.assignedRiderName ? (
                            <div className="bg-slate-800/90 border border-emerald-500/40 p-3.5 rounded-xl space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                                    <Bike className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-extrabold text-white text-xs">{order.assignedRiderName}</p>
                                      <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30">
                                        Assigned Executive
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 font-medium">Vehicle: {order.assignedRiderVehicle || 'Scooter / Bike'}</p>
                                  </div>
                                </div>

                                {order.assignedRiderPhone && (
                                  <a
                                    href={`tel:${order.assignedRiderPhone}`}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-transform active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Call Rider</span>
                                  </a>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                                <div>
                                  <p className="text-slate-400 font-semibold">Delivery Security PIN / OTP:</p>
                                  <p className="text-amber-400 font-black text-xs tracking-wider">
                                    OTP: {order.id.replace(/[^0-9]/g, '').slice(-4) || '3892'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold">Express Delivery Speed:</p>
                                  <p className="text-emerald-400 font-black text-xs">
                                    ⚡ 15 - 30 Minutes
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered' && (
                              <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between text-xs text-slate-300">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                                  <span>Assigning nearest delivery executive from Nethaji partner network...</span>
                                </div>
                              </div>
                            )
                          )}

                          {/* Detailed Timeline Events */}
                          <div className="space-y-2 pt-1 border-t border-slate-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Real-Time Log History
                            </p>
                            <div className="space-y-2 relative pl-4 border-l-2 border-emerald-500/60">
                              {order.timeline.map((step, idx) => (
                                <div key={idx} className="relative text-xs">
                                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-slate-900"></div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-amber-300">{step.status}</span>
                                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(step.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  {step.note && <p className="text-[11px] text-slate-300 font-medium">{step.note}</p>}
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      )}

                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* MODAL 1: DETAILED ORDER BILL RECEIPT MODAL */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-2 py-0.5 rounded uppercase">Official Bill Receipt</span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">{selectedOrderForDetails.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrderForDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <p className="font-black text-slate-400 text-[10px] uppercase">Delivery Address & Contact</p>
              <p className="font-extrabold text-slate-900">{selectedOrderForDetails.customerName} ({selectedOrderForDetails.customerPhone})</p>
              <p className="text-slate-600 font-medium flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{selectedOrderForDetails.address.street}, {selectedOrderForDetails.address.area}, {selectedOrderForDetails.address.city} - {selectedOrderForDetails.address.pincode}</span>
              </p>
              <p className="text-slate-500 text-[11px] font-semibold pt-1 border-t border-slate-200/80">
                Slot: <strong className="text-slate-800">{selectedOrderForDetails.deliverySlot}</strong>
              </p>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <p className="font-black text-slate-400 text-[10px] uppercase">Itemized Products</p>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
                {selectedOrderForDetails.items.map((item, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between bg-white">
                    <div>
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-[10px] text-slate-500">Unit: {item.unit} • Qty: {item.quantity}</p>
                    </div>
                    <p className="font-black text-slate-900">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₹{selectedOrderForDetails.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST Tax</span>
                <span>₹{selectedOrderForDetails.gstAmount}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Charge</span>
                <span>{selectedOrderForDetails.deliveryFee === 0 ? 'FREE' : `₹${selectedOrderForDetails.deliveryFee}`}</span>
              </div>
              {selectedOrderForDetails.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({selectedOrderForDetails.couponCode})</span>
                  <span>-₹{selectedOrderForDetails.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-300">
                <span>Grand Total</span>
                <span className="text-emerald-800">₹{selectedOrderForDetails.totalAmount}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                <span>Payment Mode</span>
                <span className="font-bold">{selectedOrderForDetails.paymentMethod} ({selectedOrderForDetails.paymentStatus})</span>
              </div>
            </div>

            {/* Customer Rating & Feedback Input Field Section */}
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  {selectedOrderForDetails.rating ? 'Your Rating & Feedback' : 'Rate Your Order Experience'}
                </span>
                {selectedOrderForDetails.rating && (
                  <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded-full">
                    ⭐ {selectedOrderForDetails.rating} / 5 Stars
                  </span>
                )}
              </div>

              {ratingSuccessMsg ? (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-extrabold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 stroke-[3]" />
                  <span>{ratingSuccessMsg}</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitRating} className="space-y-3">
                  {/* Star Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Rate this order (1 to 5 Stars):
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= (hoverRating || ratingValue);
                        return (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRatingValue(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                            title={`${star} Star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-6 h-6 ${isFilled ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
                            />
                          </button>
                        );
                      })}
                      <span className="text-xs font-black text-amber-900 ml-2">
                        {hoverRating || ratingValue} Star{(hoverRating || ratingValue) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Input Field */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Customer Review / Feedback
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Write your feedback regarding product quality, delivery speed, or packaging..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingRating}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    <span>{selectedOrderForDetails.rating ? 'Update Rating & Feedback' : 'Submit Rating & Feedback'}</span>
                  </button>
                </form>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" /> Print Bill Receipt
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: RETURN ORDER & UPI REFUND PAYMENT GATEWAY FORM */}
      {selectedOrderForReturn && (
        <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 p-5 sm:p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 font-black flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Request Return & UPI Refund</h3>
                  <p className="text-xs text-slate-500">Order #{selectedOrderForReturn.orderNumber} • Amount: ₹{selectedOrderForReturn.totalAmount}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForReturn(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {returnSuccessMsg ? (
              <div className="py-6 space-y-3 text-center animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Return Request Submitted!</h4>
                <p className="text-xs text-slate-600 font-medium px-4">{returnSuccessMsg}</p>
                <p className="text-[11px] text-amber-800 font-bold bg-amber-50 p-2 rounded-xl border border-amber-200">
                  Notice: Return requests are routed to Nethaji Mini Mart Admin Panel for instant verification and UPI refund execution.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReturnRequest} className="space-y-4 text-xs">
                
                {/* Reason Selection */}
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Select Return Reason *
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Defective / Damaged Product">Defective / Damaged Product</option>
                    <option value="Expired Date / Quality Issue">Expired Date / Quality Issue</option>
                    <option value="Wrong Item Delivered">Wrong Item Delivered</option>
                    <option value="Item Missing or Shortage">Item Missing or Shortage</option>
                    <option value="Package Opened / Broken Seal">Package Opened / Broken Seal</option>
                    <option value="Other Issue">Other Issue</option>
                  </select>
                </div>

                {/* Additional Comments */}
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">
                    Problem Details / Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={returnComments}
                    onChange={(e) => setReturnComments(e.target.value)}
                    placeholder="Describe the issue with the item..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* MANDATORY UPI PAYMENT GATEWAY DETAILS SECTION */}
                <div className="bg-gradient-to-br from-purple-900 via-slate-900 to-rose-950 text-white p-4 rounded-2xl space-y-3 shadow-md border border-purple-800/50">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-amber-400 font-black text-xs flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>UPI REFUND PAYMENT GATEWAY</span>
                    </span>
                    <span className="bg-rose-500/80 text-white font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                      UPI ONLY
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-medium">
                    Refunds for return requests are processed <strong>strictly via UPI</strong> (Google Pay, PhonePe, Paytm, or BHIM UPI ID).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        Select Your UPI App
                      </label>
                      <select
                        value={upiProvider}
                        onChange={(e) => setUpiProvider(e.target.value as any)}
                        className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-bold"
                      >
                        <option value="Google Pay">Google Pay</option>
                        <option value="PhonePe">PhonePe</option>
                        <option value="Paytm">Paytm</option>
                        <option value="BHIM UPI">BHIM UPI</option>
                        <option value="Other UPI">Other UPI App</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 mb-1">
                        UPI Account Holder Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Keerthivasan"
                        value={upiName}
                        onChange={(e) => setUpiName(e.target.value)}
                        className="w-full bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-amber-300 mb-1">
                      Enter UPI ID for Refund Transfer *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9443312345@upi or user@okaxis or mobile@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-amber-400/60 text-amber-300 placeholder-slate-500 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold pt-1 border-t border-white/10 text-slate-300">
                    <span>Refund Amount to be Transferred:</span>
                    <span className="text-amber-400 font-black text-sm">₹{selectedOrderForReturn.totalAmount}</span>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForReturn(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReturn}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingReturn ? (
                      <span>Submitting Request...</span>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Submit Return Request via UPI</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* Amazon-Style Cancel Order Modal */}
      {selectedOrderForCancel && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Cancel Items / Order</h3>
                  <p className="text-[11px] font-bold text-slate-500">Order #{selectedOrderForCancel.orderNumber}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderForCancel(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-black text-sm">{cancelSuccessMsg}</p>
                <p className="text-xs text-emerald-800">Your order status has been updated to Cancelled.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitCancel} className="space-y-4">
                
                {/* Order Summary Brief */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Items to Cancel:</span>
                    <span>{selectedOrderForCancel.items.length} item(s)</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900">
                    <span>Order Total:</span>
                    <span className="text-emerald-700 text-sm font-black">₹{selectedOrderForCancel.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-slate-700">{selectedOrderForCancel.paymentMethod}</span>
                  </div>
                </div>

                {/* Reason Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-800">
                    Reason for Cancellation *
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Order created by mistake">Order created by mistake</option>
                    <option value="Item(s) would not arrive on time">Item(s) would not arrive on time</option>
                    <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                    <option value="Need to change delivery address or slot">Need to change delivery address or slot</option>
                    <option value="Need to change payment method">Need to change payment method</option>
                    <option value="Ordered wrong item or quantity">Ordered wrong item or quantity</option>
                    <option value="Other reason">Other reason</option>
                  </select>
                </div>

                {/* Optional Comments */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tell us why you are cancelling..."
                    value={cancelComments}
                    onChange={(e) => setCancelComments(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Refund Target if Online/UPI */}
                {selectedOrderForCancel.paymentMethod !== 'Cash on Delivery' && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2 text-xs">
                    <p className="font-black text-amber-950 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      Refund Target Information
                    </p>
                    <p className="text-[11px] text-amber-900">
                      As this was a pre-paid order (₹{selectedOrderForCancel.totalAmount}), enter your UPI ID below for instant refund credit:
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. 9443312345@upi or user@okaxis"
                      value={cancelUpiId}
                      onChange={(e) => setCancelUpiId(e.target.value)}
                      className="w-full bg-white border border-amber-300 text-slate-900 font-black px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForCancel(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Keep Order
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingCancel}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingCancel ? (
                      <span>Cancelling...</span>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Confirm Cancellation</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL 4: SHARE RIDER LOCATION MODAL (ZEPTO STYLE) */}
      <ShareRiderLocationModal
        isOpen={!!selectedOrderForLocationShare}
        onClose={() => setSelectedOrderForLocationShare(null)}
        order={selectedOrderForLocationShare}
        onLocationShared={(updatedOrder) => {
          if (onRefreshOrders) {
            onRefreshOrders();
          } else if (currentUserPhone) {
            onSearchOrdersByPhone(currentUserPhone);
          }
          setSelectedOrderForLocationShare(null);
        }}
      />

    </div>
  );
};
