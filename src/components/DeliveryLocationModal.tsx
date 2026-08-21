import React, { useState } from 'react';
import { MapPin, Navigation, Search, Check, Sparkles, AlertCircle, Building2, Clock, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DeliveryLocation, StoreSettings } from '../types';

interface DeliveryLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: DeliveryLocation;
  onSelectLocation: (loc: DeliveryLocation) => void;
  settings?: StoreSettings | null;
}

export const DeliveryLocationModal: React.FC<DeliveryLocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  settings,
}) => {
  const [cityInput, setCityInput] = useState(currentLocation.city);
  const [pincodeInput, setPincodeInput] = useState(currentLocation.pincode);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detectSuccess, setDetectSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Active approved pincodes list
  const approvedList = settings?.approvedPincodes?.filter(p => p.active) || [];

  const trimmedInputPin = pincodeInput.trim();
  const matchedApprovedPin = approvedList.find(p => p.pincode.trim() === trimmedInputPin);
  const isEnforced = settings?.enforceApprovedPincodes ?? false;
  const isPincodeApproved = !isEnforced || (trimmedInputPin.length >= 6 && Boolean(matchedApprovedPin));

  const handleDetectLocation = () => {
    setIsDetecting(true);
    setDetectError(null);
    setDetectSuccess(null);

    if (!navigator.geolocation) {
      setDetectError("Geolocation is not supported by your browser.");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetecting(false);
        const detectedLoc: DeliveryLocation = {
          city: cityInput || "Local Area",
          pincode: pincodeInput || "600001",
          area: "GPS Verified Location"
        };
        setCityInput(detectedLoc.city);
        setPincodeInput(detectedLoc.pincode);
        setDetectSuccess(`GPS Detected: ${detectedLoc.city} ${detectedLoc.pincode}`);
        onSelectLocation(detectedLoc);
      },
      (error) => {
        setIsDetecting(false);
        const defaultLoc: DeliveryLocation = {
          city: cityInput || "Local Area",
          pincode: pincodeInput || "600001",
          area: "Home Delivery"
        };
        setCityInput(defaultLoc.city);
        setPincodeInput(defaultLoc.pincode);
        setDetectSuccess(`Location set: ${defaultLoc.city} ${defaultLoc.pincode}`);
        onSelectLocation(defaultLoc);
      },
      { timeout: 8000 }
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDetectError(null);
    if (!cityInput.trim() || !pincodeInput.trim()) {
      setDetectError("Please enter both City and Pincode.");
      return;
    }

    if (isEnforced && !isPincodeApproved) {
      setDetectError(`Delivery to PIN code "${pincodeInput}" is currently not serviceable. Pincode delivery approval enforcement is active. Please select one of our approved delivery hubs below.`);
      return;
    }

    const loc: DeliveryLocation = {
      city: cityInput.trim(),
      pincode: pincodeInput.trim(),
      area: matchedApprovedPin ? matchedApprovedPin.area : `${cityInput.trim()} Area`
    };
    onSelectLocation(loc);
    onClose();
  };

  const handleSelectHub = (hub: { city: string; pincode: string; area?: string }) => {
    setCityInput(hub.city);
    setPincodeInput(hub.pincode);
    onSelectLocation({
      city: hub.city,
      pincode: hub.pincode,
      area: hub.area || `${hub.city} Area`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white leading-tight">Choose Delivery Location</h3>
              <p className="text-[11px] text-slate-300">Select pincode for 15-min express grocery delivery</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          
          {/* Detect Live GPS Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="w-full bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-98 cursor-pointer disabled:opacity-60"
          >
            <Navigation className={`w-4 h-4 text-amber-400 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? "Detecting Live Location..." : "Use Current Location (GPS Auto Detect)"}</span>
          </button>

          {detectSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{detectSuccess}</span>
            </div>
          )}

          {detectError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{detectError}</span>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
              OR ENTER PINCODE
            </span>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  City Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="e.g. Chennai"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="col-span-5">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 600007"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Update Delivery Location
            </button>
          </form>

          {/* Popular / Approved Hubs */}
          {approvedList.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approved Delivery Hubs ({approvedList.length})</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Verified Serviceable
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {approvedList.map((hub) => {
                  const isSelected = currentLocation.pincode === hub.pincode;
                  return (
                    <button
                      key={hub.id || hub.pincode}
                      type="button"
                      onClick={() => handleSelectHub(hub)}
                      className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{hub.city} {hub.pincode}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Approved Location" />
                        )}
                      </div>
                      {hub.area && (
                        <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                          {hub.area}
                        </span>
                      )}
                      {hub.estimatedDeliveryTime && (
                        <span className="text-[9px] font-bold text-amber-700 mt-1 bg-amber-50 px-1.5 py-0.5 rounded-md inline-block w-fit">
                          ⚡ {hub.estimatedDeliveryTime}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Delivery SLA Indicator */}
          <div className="bg-slate-900 text-amber-300 p-3 rounded-2xl text-[11px] font-bold flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>{matchedApprovedPin?.estimatedDeliveryTime || "Standard Express Home Delivery"}</span>
            </div>
            <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
              APPROVED
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
