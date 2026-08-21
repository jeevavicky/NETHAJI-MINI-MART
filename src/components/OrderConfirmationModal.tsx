import React, { useState } from 'react';
import { Order, StoreSettings } from '../types';
import { CheckCircle2, Printer, Share2, Package, ArrowRight, Home, Clock, MapPin, Navigation } from 'lucide-react';
import { ShareRiderLocationModal } from './ShareRiderLocationModal';

interface OrderConfirmationModalProps {
  order: Order | null;
  settings: StoreSettings;
  onClose: () => void;
  onViewOrderTracker: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  settings,
  onClose,
  onViewOrderTracker
}) => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentOrderState, setCurrentOrderState] = useState<Order | null>(order);

  if (!order) return null;
  const activeOrder = currentOrderState || order;

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello Nethaji Mini Mart! My Order ID is ${activeOrder.orderNumber}. Total: ₹${activeOrder.totalAmount}. Please share delivery status.`
    );
    window.open(`https://wa.me/91${settings.phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in duration-200">
          
          {/* Checkmark Animation & Success Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Order Placed Successfully!</h2>
            <p className="text-xs text-slate-500">
              Thank you for shopping with <strong className="text-emerald-800">{settings.storeName}</strong>.
            </p>
            <div className="inline-block bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-800 border border-slate-200">
              Order Number: <span className="text-emerald-800 font-extrabold">{activeOrder.orderNumber}</span>
            </div>
          </div>

          {/* Zepto-Style Location Share Highlight Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white">Share Live Drop Location</h4>
                  <p className="text-[10px] text-slate-400">Zepto-style pinpoint GPS drop & door notes for rider</p>
                </div>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 font-black text-[9px] px-2 py-0.5 rounded border border-emerald-500/40 uppercase">
                {activeOrder.sharedLocation ? '✓ Pin Shared' : 'Express Delivery'}
              </span>
            </div>

            {activeOrder.sharedLocation ? (
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <p className="text-amber-400 font-extrabold">✓ Location Shared with Delivery Partner</p>
                <p className="text-slate-300">
                  GPS: {activeOrder.sharedLocation.lat.toFixed(4)}, {activeOrder.sharedLocation.lng.toFixed(4)}
                  {activeOrder.sharedLocation.floorDoor ? ` • ${activeOrder.sharedLocation.floorDoor}` : ''}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span>{activeOrder.sharedLocation ? 'Update Location Pin / Notes' : '📍 Share Exact Pin Location with Rider'}</span>
            </button>
          </div>

          {/* Delivery Slot & Address summary */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" /> Delivery Slot:
              </span>
              <span className="font-bold text-slate-900">{activeOrder.deliverySlot}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-emerald-700" /> Address:
              </span>
              <span className="font-semibold text-slate-800 truncate max-w-xs">{activeOrder.address.street}, {activeOrder.address.pincode}</span>
            </div>
          </div>

          {/* Ordered Items Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Items in Order ({activeOrder.items.length})</h4>
            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {activeOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-800 truncate max-w-xs">
                    {item.productName} <span className="text-slate-400">({item.unit})</span> x {item.quantity}
                  </span>
                  <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1 text-emerald-900">
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>₹{activeOrder.subtotal}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>GST (5%)</span>
              <span>₹{activeOrder.gstAmount}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Delivery Fee</span>
              <span>{activeOrder.deliveryFee === 0 ? "FREE" : `₹${activeOrder.deliveryFee}`}</span>
            </div>
            {activeOrder.discountAmount > 0 && (
              <div className="flex justify-between font-bold text-amber-800">
                <span>Coupon Discount ({activeOrder.couponCode})</span>
                <span>-₹{activeOrder.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-slate-900 border-t border-emerald-200 pt-1">
              <span>Total Paid ({activeOrder.paymentMethod})</span>
              <span className="text-emerald-800 text-base">₹{activeOrder.totalAmount}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handlePrintInvoice}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Store Invoice</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Track on WhatsApp</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onViewOrderTracker();
            }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Track Order Progress</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      </div>

      <ShareRiderLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        order={activeOrder}
        onLocationShared={(updatedOrder) => {
          setCurrentOrderState(updatedOrder);
        }}
      />
    </>
  );
};

