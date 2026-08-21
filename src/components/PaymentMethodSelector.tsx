import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { CreditCard, QrCode, Banknote, Building, ShieldCheck, Sparkles, ArrowRight, Copy, Check } from 'lucide-react';

export const GPayLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#F8FAFC"/>
    <path d="M16.71 11.23C16.71 10.61 16.65 10.03 16.55 9.47H11.82V11.4H14.57C14.45 12.04 14.08 12.59 13.52 12.96V14.26H15.22C16.21 13.35 16.71 12.41 16.71 11.23Z" fill="#4285F4"/>
    <path d="M11.82 16.23C13.15 16.23 14.26 15.79 15.06 15.06L13.52 13.76C13.09 14.05 12.52 14.23 11.82 14.23C10.53 14.23 9.44 13.36 9.05 12.19H7.29V13.55C8.08 15.13 9.8 16.23 11.82 16.23Z" fill="#34A853"/>
    <path d="M9.05 12.19C8.95 11.89 8.89 11.57 8.89 11.23C8.89 10.89 8.95 10.57 9.05 10.27V8.91H7.29C6.96 9.57 6.77 10.38 6.77 11.23C6.77 12.08 6.96 12.89 7.29 13.55L9.05 12.19Z" fill="#FBBC05"/>
    <path d="M11.82 8.23C12.54 8.23 13.19 8.48 13.7 8.96L15.12 7.54C14.26 6.74 13.14 6.23 11.82 6.23C9.8 6.23 8.08 7.33 7.29 8.91L9.05 10.27C9.44 9.1 10.53 8.23 11.82 8.23Z" fill="#EA4335"/>
  </svg>
);

export type PaymentMethodType = 'GPay' | 'COD' | 'UPI' | 'Card' | 'NetBanking';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethodType;
  onChangePaymentMethod: (method: PaymentMethodType) => void;
  grandTotal: number;
  settings: StoreSettings;
  autoRedirectGPay: boolean;
  onChangeAutoRedirectGPay: (autoRedirect: boolean) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  onChangePaymentMethod,
  grandTotal,
  settings,
  autoRedirectGPay,
  onChangeAutoRedirectGPay
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);

  const activeUpiId = settings.paymentUpiId || 'nethaji.mart@upi';
  const activeMerchantName = settings.paymentMerchantName || 'Nethaji Mini Mart & Fresh';

  const upiUrl = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activeMerchantName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('Order Payment')}`;
  const gpayTezUrl = `tez://upi/pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activeMerchantName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('Order Payment')}`;
  const gpayDirectUrl = `gpay://upi/pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activeMerchantName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('Order Payment')}`;

  const triggerGPayRedirect = () => {
    try {
      window.location.href = gpayTezUrl;
      setTimeout(() => {
        window.location.href = gpayDirectUrl;
      }, 300);
      setTimeout(() => {
        window.location.href = upiUrl;
      }, 600);
    } catch (e) {
      window.location.href = upiUrl;
    }
  };

  const copyUpiIdToClipboard = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
        <span className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-700" />
          <span>3. Select Payment Gateway</span>
        </span>
        <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
          100% Safe & Encrypted
        </span>
      </h3>

      {/* Grid selector buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { id: "GPay", label: "Google Pay", isGpay: true, badge: "Auto-Redirect" },
          { id: "COD", label: "Cash on Delivery", icon: Banknote, badge: "Pay on arrival" },
          { id: "UPI", label: "Instant UPI QR", icon: QrCode, badge: "Scan QR" },
          { id: "Card", label: "Card Payment", icon: CreditCard, badge: "Debit/Credit" },
          { id: "NetBanking", label: "Net Banking", icon: Building, badge: "Indian Banks" }
        ].map((m) => {
          const IconComp = m.icon;
          const isSelected = paymentMethod === m.id;

          return (
            <button
              type="button"
              key={m.id}
              onClick={() => onChangePaymentMethod(m.id as PaymentMethodType)}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center gap-1 transition-all relative cursor-pointer ${
                isSelected
                  ? m.isGpay
                    ? "border-blue-600 bg-blue-50/90 text-blue-950 ring-2 ring-blue-500/40 shadow-xs"
                    : "border-emerald-700 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/30 shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {m.isGpay ? (
                <GPayLogo className="w-5 h-5" />
              ) : IconComp ? (
                <IconComp className={`w-5 h-5 ${isSelected ? "text-emerald-700" : "text-slate-500"}`} />
              ) : null}
              <span className="text-[11px] leading-tight font-extrabold">{m.label}</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                  isSelected
                    ? m.isGpay
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-emerald-700 text-white border-emerald-700"
                    : "bg-slate-200 text-slate-600 border-slate-300"
                }`}
              >
                {m.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. Google Pay (GPay) Gateway Box */}
      {paymentMethod === "GPay" && (
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-100/60 border-2 border-blue-500/80 p-4 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <GPayLogo className="w-7 h-7 shrink-0 shadow-xs rounded-full bg-white p-0.5" />
              <div>
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <span>Google Pay Express Gateway</span>
                  <span className="bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    ⚡ Deep Link Ready
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 font-medium">
                  Direct instant payment to {activeMerchantName}
                </p>
              </div>
            </div>
            <span className="text-blue-900 font-black text-xs bg-blue-100 px-2.5 py-1 rounded-xl border border-blue-300">
              ₹{grandTotal}
            </span>
          </div>

          <div className="bg-white/90 p-3 rounded-xl border border-blue-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Payee Merchant:</span>
              <span className="font-extrabold text-slate-900">{activeMerchantName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Merchant UPI VPA:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                  {activeUpiId}
                </span>
                <button
                  type="button"
                  onClick={copyUpiIdToClipboard}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  title="Copy VPA ID to clipboard"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
              <span className="text-slate-500 font-semibold">Total Amount:</span>
              <span className="font-black text-blue-700 text-sm">₹{grandTotal}</span>
            </div>
          </div>

          <div className="bg-blue-600/10 border border-blue-300 p-2.5 rounded-xl text-blue-950 text-[11px] font-medium flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p>
                <strong>Automatic GPay Launching:</strong> When placing order, Google Pay app deep link (<code className="bg-blue-100 px-1 rounded text-[10px] text-blue-900 font-mono">gpay://upi/pay</code>) automatically opens on your phone to complete payment.
              </p>
              <label className="flex items-center gap-2 mt-1.5 cursor-pointer font-extrabold text-blue-900">
                <input
                  type="checkbox"
                  checked={autoRedirectGPay}
                  onChange={(e) => onChangeAutoRedirectGPay(e.target.checked)}
                  className="rounded border-blue-400 text-blue-600 focus:ring-blue-500"
                />
                <span>Auto-redirect to Google Pay App on Submit</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerGPayRedirect}
            className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <GPayLogo className="w-5 h-5 bg-white rounded-full p-0.5" />
            <span>Launch Google Pay App Now (₹{grandTotal})</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* 2. Cash on Delivery (COD) Box */}
      {paymentMethod === "COD" && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 p-4 rounded-2xl space-y-2 text-xs text-emerald-950 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-emerald-950">
              <Banknote className="w-5 h-5 text-emerald-700" />
              <span>Cash on Delivery (COD)</span>
            </div>
            <span className="bg-emerald-200 text-emerald-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase">
              ✓ Verified Doorstep Payment
            </span>
          </div>
          <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
            Pay exact amount <strong className="text-emerald-900 font-extrabold">₹{grandTotal}</strong> in cash or scan rider's mobile UPI QR when your fresh grocery order arrives at your address.
          </p>
          <div className="bg-white/80 p-2 rounded-xl border border-emerald-200 text-[11px] font-bold text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No advance payment needed • Inspect items on arrival</span>
          </div>
        </div>
      )}

      {/* 3. Instant UPI Payment QR Code Section */}
      {paymentMethod === "UPI" && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-extrabold text-slate-900">
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>UPI Payment QR & Deep Link</span>
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded">
              Zero Transaction Fee
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-emerald-100">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs shrink-0 text-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiUrl)}`}
                alt="UPI Payment QR Code"
                className="w-28 h-28 object-contain"
              />
              <span className="text-[9px] text-slate-400 font-semibold block mt-1">Scan with GPay/PhonePe</span>
            </div>
            <div className="space-y-1.5 flex-1 min-w-0 text-left">
              <p className="font-extrabold text-slate-900 text-xs">Merchant: {activeMerchantName}</p>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {activeUpiId}
                </span>
                <button
                  type="button"
                  onClick={copyUpiIdToClipboard}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-slate-200"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Scan QR code using any UPI App (Google Pay, PhonePe, Paytm, BHIM) or click launch button below.
              </p>
              <a
                href={upiUrl}
                className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline text-xs mt-1"
              >
                <span>Click here to open UPI App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4. Debit / Credit Card Option */}
      {paymentMethod === "Card" && (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Credit / Debit Card Checkout</span>
            </span>
            <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
              Visa / Mastercard / RuPay
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Card Number (e.g. 4111 2222 3333 4444)"
              className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono w-full"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="MM/YY"
                className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono text-center"
              />
              <input
                type="password"
                maxLength={4}
                placeholder="CVV"
                className="p-2.5 rounded-xl border border-slate-300 text-xs font-mono text-center"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Net Banking Option */}
      {paymentMethod === "NetBanking" && (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>Select Net Banking Institution</span>
            </span>
          </div>
          <select className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white">
            <option>State Bank of India (SBI)</option>
            <option>HDFC Bank</option>
            <option>ICICI Bank</option>
            <option>Axis Bank</option>
            <option>Kotak Mahindra Bank</option>
            <option>Punjab National Bank (PNB)</option>
            <option>Other Indian Bank</option>
          </select>
        </div>
      )}
    </div>
  );
};
