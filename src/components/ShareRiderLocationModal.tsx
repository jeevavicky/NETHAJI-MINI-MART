import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Share2, Copy, Check, Sparkles, Building2, 
  X, MessageSquare, AlertCircle, PhoneCall, ExternalLink, ShieldCheck, Bike
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Order } from '../types';
import { api } from '../services/api';

interface ShareRiderLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onLocationShared?: (updatedOrder: Order) => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export const ShareRiderLocationModal: React.FC<ShareRiderLocationModalProps> = ({
  isOpen,
  onClose,
  order,
  onLocationShared
}) => {
  // Default Erode coordinates or customer saved coordinates
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: order?.sharedLocation?.lat || 11.3410,
    lng: order?.sharedLocation?.lng || 77.7172
  });

  const [landmark, setLandmark] = useState(order?.sharedLocation?.landmark || order?.address?.landmark || '');
  const [floorDoor, setFloorDoor] = useState(order?.sharedLocation?.floorDoor || '');
  const [gateInstructions, setGateInstructions] = useState(order?.sharedLocation?.gateInstructions || '');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      if (order.sharedLocation?.lat && order.sharedLocation?.lng) {
        setPosition({ lat: order.sharedLocation.lat, lng: order.sharedLocation.lng });
      } else {
        // Mock default around delivery pincode
        setPosition({ lat: 11.3410 + (Math.random() * 0.01 - 0.005), lng: 77.7172 + (Math.random() * 0.01 - 0.005) });
      }
      setLandmark(order.sharedLocation?.landmark || order.address.landmark || '');
      setFloorDoor(order.sharedLocation?.floorDoor || '');
      setGateInstructions(order.sharedLocation?.gateInstructions || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGetGPS = () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      showToast("⚠️ Geolocation is not supported by your browser");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetecting(false);
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(newCoords);
        showToast("📍 Live GPS Location Pinpointed Successfully!");
      },
      (err) => {
        setIsDetecting(false);
        showToast("⚠️ GPS access permission denied. Set pin manually on map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveAndSync = async () => {
    setIsSaving(true);
    try {
      const res = await api.shareLocationWithRider(order.id, {
        lat: position.lat,
        lng: position.lng,
        landmark: landmark.trim(),
        floorDoor: floorDoor.trim(),
        gateInstructions: gateInstructions.trim()
      });

      if (res.success && res.order) {
        showToast("🎉 Location Pin & Notes Shared with Delivery Rider!");
        if (onLocationShared) onLocationShared(res.order);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      showToast(`❌ ${err.message || 'Failed to sync location'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const googleMapsUrl = `https://maps.google.com/?q=${position.lat.toFixed(6)},${position.lng.toFixed(6)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(googleMapsUrl);
    setCopySuccess(true);
    showToast("📋 Direct Map Location Link copied to clipboard!");
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📍 *Exact Delivery Location Pin for Order #${order.orderNumber}*\n\n` +
      `Customer Name: ${order.customerName}\n` +
      `Address: ${order.address.street}, ${order.address.city} - ${order.address.pincode}\n` +
      (landmark ? `Landmark: ${landmark}\n` : '') +
      (floorDoor ? `Floor/Door: ${floorDoor}\n` : '') +
      (gateInstructions ? `Gate Instructions: ${gateInstructions}\n` : '') +
      `Google Maps Location: ${googleMapsUrl}`
    );

    const riderPhone = order.assignedRiderPhone ? order.assignedRiderPhone.replace(/\D/g, '') : '';
    const whatsappUrl = riderPhone ? `https://wa.me/91${riderPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white leading-tight">Share Location with Rider</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-500/40 uppercase">
                  ZEPTO STYLE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Order #{order.orderNumber} • Pinpoint exact drop door location for express rider
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast banner */}
        {toastMessage && (
          <div className="bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 text-center animate-in slide-in-from-top duration-200 shrink-0">
            {toastMessage}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Assigned Rider Info Banner */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Assigned Delivery Rider</p>
                <h4 className="text-xs font-black text-white">
                  {order.assignedRiderName || 'Nethaji Express Rider'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {order.assignedRiderVehicle || 'Bike'} • {order.assignedRiderPhone || 'Live On Duty'}
                </p>
              </div>
            </div>

            {order.assignedRiderPhone && (
              <a
                href={`tel:${order.assignedRiderPhone}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Call Rider</span>
              </a>
            )}
          </div>

          {/* Interactive Map Visualizer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                <span>Pinpoint Exact Delivery Location</span>
              </label>
              <button
                type="button"
                onClick={handleGetGPS}
                disabled={isDetecting}
                className="text-[11px] font-extrabold text-amber-400 hover:text-amber-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Navigation className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? 'Locating...' : 'Use My Current GPS'}</span>
              </button>
            </div>

            <div className="h-48 w-full rounded-2xl overflow-hidden border border-slate-700 relative bg-slate-950 shadow-inner">
              {hasValidKey ? (
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    defaultCenter={position}
                    center={position}
                    defaultZoom={15}
                    zoom={15}
                    mapId="CUSTOMER_RIDER_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                    onClick={(e) => {
                      if (e.detail.latLng) {
                        setPosition({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
                      }
                    }}
                  >
                    <AdvancedMarker position={position}>
                      <Pin background="#f59e0b" glyphColor="#0f172a" borderColor="#fef3c7" />
                    </AdvancedMarker>
                  </Map>
                </APIProvider>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex flex-col items-center justify-center text-center space-y-2 relative">
                  <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-500/40 animate-pulse">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-white">GPS Coordinates Pinpointed</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Lat: {position.lat.toFixed(5)}, Lng: {position.lng.toFixed(5)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetGPS}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-md"
                  >
                    ⚡ Auto-Detect GPS Location
                  </button>
                </div>
              )}

              {/* Map Badge Overlay */}
              <div className="absolute top-2 left-2 bg-slate-950/90 text-white text-[10px] font-black px-2.5 py-1 rounded-xl border border-slate-700 backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Rider Pinpoint View</span>
              </div>
            </div>
          </div>

          {/* Delivery Location Details Inputs */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-1">
                  Floor / Door / House Number
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={floorDoor}
                    onChange={(e) => setFloorDoor(e.target.value)}
                    placeholder="e.g. 2nd Floor, Door No. 42/B"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-semibold text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-1">
                  Prominent Nearby Landmark
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite Pillaiyar Temple"
                    className="w-full bg-slate-950 border border-slate-700 text-white font-semibold text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 mb-1">
                Gate / Delivery Notes for Rider
              </label>
              <div className="relative">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={gateInstructions}
                  onChange={(e) => setGateInstructions(e.target.value)}
                  placeholder="e.g. Ring bell 202, leave with security if unreachable"
                  className="w-full bg-slate-950 border border-slate-700 text-white font-semibold text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Quick Sharing Buttons */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Direct Sharing Options</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp to Rider</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 active:scale-98"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copySuccess ? 'Link Copied!' : 'Copy Location Link'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAndSync}
            disabled={isSaving}
            className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSaving ? 'Syncing with Rider...' : 'Save & Share Pin with Rider'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
