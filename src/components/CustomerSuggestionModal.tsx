import React, { useState, useEffect } from 'react';
import { 
  X, Lightbulb, PackagePlus, Sparkles, Send, ThumbsUp, MessageSquare, 
  CheckCircle2, Clock, HelpCircle, Store, Layers, Phone, User, 
  Share2, ArrowRight, AlertCircle, Image as ImageIcon, Check, Filter
} from 'lucide-react';
import { CustomerSuggestion, Category, StoreSettings } from '../types';
import { api } from '../services/api';

interface CustomerSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  settings?: StoreSettings | null;
  currentUserPhone?: string | null;
  onSelectCategory?: (categoryName: string) => void;
}

export const CustomerSuggestionModal: React.FC<CustomerSuggestionModalProps> = ({
  isOpen,
  onClose,
  categories,
  settings,
  currentUserPhone,
  onSelectCategory
}) => {
  const [activeTab, setActiveTab] = useState<'product' | 'feature' | 'feedback' | 'community'>('product');
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userUpvotedIds, setUserUpvotedIds] = useState<string[]>([]);
  const [communityFilter, setCommunityFilter] = useState<'All' | 'product_request' | 'feature_request' | 'Added'>('All');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: categories[0]?.name || 'Grocery & Staples',
    brandOrDetails: '',
    expectedPrice: '',
    imageUrl: '',
    description: '',
    customerName: '',
    customerPhone: ''
  });

  // Pre-fill user details if logged in
  useEffect(() => {
    if (isOpen) {
      const storedPhone = currentUserPhone || localStorage.getItem('nethaji_user_phone') || '';
      const storedName = localStorage.getItem('nethaji_user_name') || '';
      setFormData(prev => ({
        ...prev,
        customerPhone: prev.customerPhone || storedPhone,
        customerName: prev.customerName || storedName
      }));
      loadSuggestions();
    }
  }, [isOpen, currentUserPhone]);

  const loadSuggestions = async () => {
    setLoadingList(true);
    try {
      const data = await api.getSuggestions();
      setSuggestions(data);
      
      const phoneDigits = (currentUserPhone || localStorage.getItem('nethaji_user_phone') || '').replace(/\D/g, '');
      if (phoneDigits) {
        const upvoted = data.filter(s => s.upvotedBy && s.upvotedBy.includes(phoneDigits)).map(s => s.id);
        setUserUpvotedIds(upvoted);
      }
    } catch (err) {
      console.warn('Could not load suggestions list', err);
    } finally {
      setLoadingList(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitSuccess(null);

    if (!formData.title.trim()) {
      setErrorMessage("Please enter the name of the product or feature title.");
      return;
    }

    const cleanPhone = formData.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number so our team can follow up.");
      return;
    }

    setSubmitting(true);
    try {
      let type: 'product_request' | 'feature_request' | 'store_feedback' = 'product_request';
      if (activeTab === 'feature') type = 'feature_request';
      if (activeTab === 'feedback') type = 'store_feedback';

      const res = await api.createSuggestion({
        type,
        title: formData.title.trim(),
        customerName: formData.customerName.trim() || 'Valued Customer',
        customerPhone: formData.customerPhone.trim(),
        category: activeTab === 'product' ? formData.category : (activeTab === 'feature' ? 'Website Feature' : 'Store Feedback'),
        brandOrDetails: formData.brandOrDetails.trim() || undefined,
        expectedPrice: formData.expectedPrice ? Number(formData.expectedPrice) : undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        description: formData.description.trim() || (activeTab === 'product' ? `Requested product: ${formData.title}` : `Suggested feature: ${formData.title}`)
      });

      // Remember contact name
      if (formData.customerName) {
        localStorage.setItem('nethaji_user_name', formData.customerName);
      }

      setSubmitSuccess(
        activeTab === 'product'
          ? `🎉 Thank you! Your product request for "${formData.title}" has been sent to our Store Admin team. We'll review stock availability promptly.`
          : `🎉 Thank you! Your feature idea "${formData.title}" has been shared directly with our developers and admin team.`
      );

      // Reset form
      setFormData(prev => ({
        ...prev,
        title: '',
        brandOrDetails: '',
        expectedPrice: '',
        imageUrl: '',
        description: ''
      }));

      loadSuggestions();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit suggestion. Please try again or message us on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (sugId: string) => {
    const phone = currentUserPhone || localStorage.getItem('nethaji_user_phone') || formData.customerPhone || 'guest';
    try {
      const res = await api.upvoteSuggestion(sugId, phone);
      setSuggestions(prev => prev.map(s => s.id === sugId ? { ...s, upvotes: res.upvotes } : s));
      if (res.upvoted) {
        setUserUpvotedIds(prev => [...prev, sugId]);
      } else {
        setUserUpvotedIds(prev => prev.filter(id => id !== sugId));
      }
    } catch (e) {
      console.warn('Upvote failed', e);
    }
  };

  const handleWhatsAppDirect = () => {
    const storePhone = (settings?.phone || '9443312345').replace(/\D/g, '');
    let msg = `*Customer Suggestion for Nethaji Mini Mart*\n\n`;
    msg += `*Type:* ${activeTab === 'product' ? '🛍️ Product Request' : activeTab === 'feature' ? '⚡ Website Feature Idea' : '💬 Store Feedback'}\n`;
    if (formData.title) msg += `*Item/Title:* ${formData.title}\n`;
    if (formData.brandOrDetails) msg += `*Brand/Pack:* ${formData.brandOrDetails}\n`;
    if (formData.category && activeTab === 'product') msg += `*Category:* ${formData.category}\n`;
    if (formData.expectedPrice) msg += `*Expected Price:* ₹${formData.expectedPrice}\n`;
    if (formData.description) msg += `*Details:* ${formData.description}\n`;
    msg += `\n*From:* ${formData.customerName || 'Customer'} (${formData.customerPhone || currentUserPhone || 'App User'})`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/91${storePhone.slice(-10)}?text=${encoded}`, '_blank');
  };

  const filteredCommunityList = suggestions.filter(s => {
    if (communityFilter === 'All') return true;
    if (communityFilter === 'Added') return s.status === 'Added';
    return s.type === communityFilter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Lightbulb className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Customer Suggestion & Requests
                </h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Direct Inbox
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Tell us which product to stock or which feature to add on our website!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0 relative z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 p-1.5 flex border-b border-slate-200 text-xs font-bold shrink-0 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('product'); setSubmitSuccess(null); setErrorMessage(null); }}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'product'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Request a Product</span>
          </button>

          <button
            onClick={() => { setActiveTab('feature'); setSubmitSuccess(null); setErrorMessage(null); }}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'feature'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Suggest a Feature</span>
          </button>

          <button
            onClick={() => { setActiveTab('feedback'); setSubmitSuccess(null); setErrorMessage(null); }}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Store Feedback</span>
          </button>

          <button
            onClick={() => { setActiveTab('community'); setSubmitSuccess(null); setErrorMessage(null); }}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'community'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Community List ({suggestions.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          
          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-extrabold text-sm text-emerald-800">Suggestion Sent Successfully!</p>
                <p className="mt-0.5 text-xs text-emerald-700 leading-relaxed">{submitSuccess}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('community')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Community Requests</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(null)}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 font-bold rounded-lg text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Submit Another
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium text-xs">{errorMessage}</span>
            </div>
          )}

          {/* TAB 1, 2, 3: FORM */}
          {activeTab !== 'community' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type Context Card */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 font-black flex items-center justify-center shrink-0 mt-0.5">
                  {activeTab === 'product' ? '🛍️' : activeTab === 'feature' ? '⚡' : '💬'}
                </div>
                <div className="text-[11px] text-amber-900 leading-relaxed">
                  {activeTab === 'product' && (
                    <>
                      <strong className="font-extrabold text-slate-900">Missing an item in our store?</strong> Request your favorite brand, vegetable, spice, dairy product, or snacks. Our procurement team reviews requests daily!
                    </>
                  )}
                  {activeTab === 'feature' && (
                    <>
                      <strong className="font-extrabold text-slate-900">Have an idea to improve the website?</strong> Suggest features like recurring orders, new payment options, customized delivery time slots, recipe bundles, or app improvements.
                    </>
                  )}
                  {activeTab === 'feedback' && (
                    <>
                      <strong className="font-extrabold text-slate-900">General feedback or store suggestions:</strong> Let our store manager know how we can serve you better with eco-packaging, store timings, or delivery speed.
                    </>
                  )}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  {activeTab === 'product' ? 'Product Name & Size *' : activeTab === 'feature' ? 'Feature Name / Idea Title *' : 'Suggestion Subject *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder={
                    activeTab === 'product'
                      ? 'e.g. Aavin Full Cream Milk (Orange) 500ml or Idhayam Gingelly Oil 1L'
                      : activeTab === 'feature'
                      ? 'e.g. Dark Mode Theme Toggle / Scheduled Morning Milk Delivery'
                      : 'e.g. Extend delivery hours till 10:30 PM on weekends'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 text-xs"
                />
              </div>

              {/* Product-Specific Inputs */}
              {activeTab === 'product' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 text-xs cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                      <option value="Other Daily Essentials">Other Daily Essentials</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Brand or Variant (Optional)</label>
                    <input
                      type="text"
                      value={formData.brandOrDetails}
                      onChange={e => setFormData({ ...formData, brandOrDetails: e.target.value })}
                      placeholder="e.g. Nestle / Britannia / Organic"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Expected / Normal Price (₹ Optional)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.expectedPrice}
                      onChange={e => setFormData({ ...formData, expectedPrice: e.target.value })}
                      placeholder="e.g. 85"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Photo URL (Optional)</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/item.jpg"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Description / Reasoning */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  {activeTab === 'product' ? 'Why do you love this item? / Additional Notes' : 'Detailed Description & How it Helps You'}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder={
                    activeTab === 'product'
                      ? 'Tell us why you would buy this regularly (e.g. need daily morning supply, favorite snack for kids, hard to find locally)...'
                      : 'Describe how this feature should work or how it makes shopping easier on Nethaji Mart...'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 text-xs resize-none"
                />
              </div>

              {/* Contact Information */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Your Contact Details (For Store Admin Follow-up)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">Your Name</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="e.g. Keerthi / Priya"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">Mobile Number (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-extrabold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{submitting ? 'Submitting to Admin...' : 'Submit Suggestion to Admin'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppDirect}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-extrabold text-xs shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Direct WhatsApp to Admin"
                >
                  <MessageSquare className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 4: COMMUNITY REQUESTS & TRACKER */}
          {activeTab === 'community' && (
            <div className="space-y-4">
              
              {/* Community Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" /> Filter:
                </span>
                {[
                  { id: 'All', label: 'All Requests' },
                  { id: 'product_request', label: '🛍️ Products' },
                  { id: 'feature_request', label: '⚡ Features' },
                  { id: 'Added', label: '✅ Added / Live' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setCommunityFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      communityFilter === f.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {loadingList ? (
                <div className="py-12 text-center text-slate-400 font-medium">
                  Loading suggestions from store community...
                </div>
              ) : filteredCommunityList.length === 0 ? (
                <div className="py-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <PackagePlus className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700 text-xs">No suggestions in this view yet</p>
                  <p className="text-[11px] text-slate-500">Be the first to request a product or feature!</p>
                  <button
                    onClick={() => setActiveTab('product')}
                    className="mt-2 px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Submit New Suggestion</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCommunityList.map(s => {
                    const isUpvoted = userUpvotedIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          s.status === 'Added'
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : s.status === 'In Progress'
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            
                            {/* Type & Status Badges */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                s.type === 'product_request'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : s.type === 'feature_request'
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}>
                                {s.type === 'product_request' ? '🛍️ Product Request' : s.type === 'feature_request' ? '⚡ Feature Request' : '💬 Store Feedback'}
                              </span>

                              {s.category && (
                                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                  {s.category}
                                </span>
                              )}

                              {/* Status Tag */}
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                s.status === 'Added'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : s.status === 'In Progress'
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : s.status === 'Under Review'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {s.status === 'Added' && <CheckCircle2 className="w-3 h-3" />}
                                {s.status === 'In Progress' && <Clock className="w-3 h-3" />}
                                <span>{s.status === 'Added' ? 'Added to Store' : s.status}</span>
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                              {s.title}
                            </h4>

                            {s.brandOrDetails && (
                              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                                Preferred Variant: <span className="font-bold text-slate-800">{s.brandOrDetails}</span>
                                {s.expectedPrice && <span className="text-emerald-700 font-bold ml-1.5">(Approx ₹{s.expectedPrice})</span>}
                              </p>
                            )}

                            {/* Description */}
                            <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                              {s.description}
                            </p>

                            {/* Admin Note if available */}
                            {s.adminNote && (
                              <div className="mt-2 p-2 bg-slate-100/90 rounded-xl border border-slate-200/90 text-[11px] text-slate-800 flex items-start gap-1.5">
                                <span className="font-extrabold text-emerald-800 shrink-0">Store Admin Note:</span>
                                <span className="text-slate-700">{s.adminNote}</span>
                              </div>
                            )}

                            {/* User & Date info */}
                            <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                              <span>Requested by {s.customerName}</span>
                              <span>•</span>
                              <span>{new Date(s.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}</span>
                            </div>

                          </div>

                          {/* Upvote Button */}
                          <div className="shrink-0 flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => handleUpvote(s.id)}
                              className={`px-3 py-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                                isUpvoted
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                              title="Upvote if you want this too!"
                            >
                              <ThumbsUp className={`w-4 h-4 ${isUpvoted ? 'fill-white' : ''}`} />
                              <span className="font-black text-xs mt-0.5">{s.upvotes || 1}</span>
                            </button>
                            <span className="text-[9px] text-slate-400 mt-1 font-medium">Upvote</span>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer info banner */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 px-4 flex items-center justify-between gap-3 text-slate-500 text-[11px] shrink-0">
          <div className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-emerald-700" />
            <span>Nethaji Mini Mart Customer Care & Procurement Helpdesk</span>
          </div>
          <button
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-950 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
