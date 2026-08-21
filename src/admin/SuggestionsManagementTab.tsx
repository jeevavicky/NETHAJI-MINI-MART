import React, { useState, useEffect } from 'react';
import { 
  CustomerSuggestion, SuggestionType, SuggestionStatus, Category, Product 
} from '../types';
import { api } from '../services/api';
import { 
  Lightbulb, PackagePlus, Sparkles, MessageSquare, ThumbsUp, Search, 
  Filter, CheckCircle2, Clock, XCircle, AlertCircle, ArrowUpRight, 
  Phone, Send, Trash2, Edit3, Plus, ExternalLink, Image as ImageIcon,
  Check, RefreshCw, Layers, ShieldCheck, Tag, ShoppingBag, Eye
} from 'lucide-react';

interface SuggestionsManagementTabProps {
  categories: Category[];
  onRefreshCustomerStore: () => void;
}

export const SuggestionsManagementTab: React.FC<SuggestionsManagementTabProps> = ({
  categories,
  onRefreshCustomerStore
}) => {
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes'>('newest');

  // Inline Admin Note Editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');

  // 1-Click Convert to Product Modal
  const [convertModalSuggestion, setConvertModalSuggestion] = useState<CustomerSuggestion | null>(null);
  const [convertForm, setConvertForm] = useState<{
    name: string;
    category: string;
    brand: string;
    mrp: number;
    price: number;
    unit: string;
    stock: number;
    image: string;
    description: string;
  }>({
    name: '',
    category: '',
    brand: '',
    mrp: 100,
    price: 85,
    unit: '1 pc / pack',
    stock: 25,
    image: '',
    description: ''
  });
  const [converting, setConverting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const data = await api.getSuggestions();
      setSuggestions(data);
    } catch (e) {
      console.error("Failed to fetch suggestions in admin", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleStatusChange = async (id: string, newStatus: SuggestionStatus) => {
    try {
      const res = await api.updateSuggestionStatus(id, newStatus);
      setSuggestions(prev => prev.map(s => s.id === id ? res.suggestion : s));
      showActionToast(`Status updated to "${newStatus}"`);
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    }
  };

  const handleSaveAdminNote = async (id: string) => {
    try {
      const sug = suggestions.find(s => s.id === id);
      const res = await api.updateSuggestionStatus(id, sug?.status || 'Under Review', noteInput.trim());
      setSuggestions(prev => prev.map(s => s.id === id ? res.suggestion : s));
      setEditingNoteId(null);
      showActionToast("Admin note updated successfully!");
    } catch (e: any) {
      alert(e.message || "Failed to save admin note");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete customer suggestion "${title}"?`)) {
      try {
        await api.deleteSuggestion(id);
        setSuggestions(prev => prev.filter(s => s.id !== id));
        showActionToast("Suggestion deleted");
      } catch (e: any) {
        alert(e.message || "Failed to delete suggestion");
      }
    }
  };

  const handleOpenConvertModal = (sug: CustomerSuggestion) => {
    setConvertModalSuggestion(sug);
    const expPrice = sug.expectedPrice || 75;
    setConvertForm({
      name: sug.title,
      category: sug.category && categories.some(c => c.name === sug.category) ? sug.category : (categories[0]?.name || 'Grocery & Staples'),
      brand: sug.brandOrDetails || 'Nethaji Mart',
      mrp: Math.round(expPrice * 1.2),
      price: expPrice,
      unit: '1 pc / pack',
      stock: 30,
      image: sug.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
      description: sug.description || `Added from customer request by ${sug.customerName}`
    });
  };

  const handleConfirmConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertModalSuggestion) return;
    setConverting(true);
    try {
      const res = await api.convertSuggestionToProduct(convertModalSuggestion.id, convertForm);
      setSuggestions(prev => prev.map(s => s.id === convertModalSuggestion.id ? res.suggestion : s));
      setConvertModalSuggestion(null);
      showActionToast(`🎉 Product "${convertForm.name}" published to store catalog!`);
      onRefreshCustomerStore();
    } catch (err: any) {
      alert(err.message || "Failed to convert suggestion to product");
    } finally {
      setConverting(false);
    }
  };

  const showActionToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleSendWhatsAppReply = (sug: CustomerSuggestion) => {
    const cleanPhone = sug.customerPhone.replace(/\D/g, '');
    let msg = `Hello ${sug.customerName || 'Customer'},\n\nThank you for submitting your suggestion on *Nethaji Mini Mart* regarding "*${sug.title}*".\n\n`;
    if (sug.status === 'Added') {
      msg += `🎉 Good news! We have added this item to our store catalogue. You can open the app and order it now with 30-min express delivery!\n\n`;
    } else if (sug.status === 'In Progress') {
      msg += `⚡ Update: Our team is currently procuring this item/working on this feature!\n\n`;
    } else {
      msg += `Our Store Admin team has reviewed your request.\n\n`;
    }
    if (sug.adminNote) {
      msg += `*Store Note:* ${sug.adminNote}\n\n`;
    }
    msg += `Warm regards,\nNethaji Mini Mart Team`;
    window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filter and Sort Logic
  const filteredSuggestions = suggestions.filter(s => {
    if (selectedType !== 'All' && s.type !== selectedType) return false;
    if (selectedStatus !== 'All' && s.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchDesc = s.description.toLowerCase().includes(q);
      const matchName = s.customerName.toLowerCase().includes(q);
      const matchPhone = s.customerPhone.includes(q);
      const matchBrand = (s.brandOrDetails || '').toLowerCase().includes(q);
      return matchTitle || matchDesc || matchName || matchPhone || matchBrand;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'upvotes') {
      return (b.upvotes || 0) - (a.upvotes || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalCount = suggestions.length;
  const productCount = suggestions.filter(s => s.type === 'product_request').length;
  const featureCount = suggestions.filter(s => s.type === 'feature_request').length;
  const addedCount = suggestions.filter(s => s.status === 'Added').length;
  const pendingCount = suggestions.filter(s => s.status === 'Pending' || s.status === 'Under Review').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Alert */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-lg shrink-0">
            <Lightbulb className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white tracking-tight">
                Customer Suggestions & Feature Requests
              </h2>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Interactive Inbox
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Review customer product requests, feature ideas, upvote priorities, and publish requested products directly into your store catalog.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Requests</span>
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCount}</p>
          <p className="text-[10px] text-slate-400 font-medium">All incoming submissions</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Product Requests</span>
            <PackagePlus className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-900">{productCount}</p>
          <p className="text-[10px] text-purple-600 font-bold">Catalog additions</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Feature Ideas</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-900">{featureCount}</p>
          <p className="text-[10px] text-blue-600 font-bold">Website & UI requests</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
          <p className="text-[10px] text-amber-700 font-bold">Requires admin action</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Published to Store</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-800">{addedCount}</p>
          <p className="text-[10px] text-emerald-700 font-bold">Live in customer catalog</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by product name, feature, customer name, phone or category..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-bold text-slate-500 text-[11px] mr-1">Type:</span>
            {[
              { id: 'All', label: 'All' },
              { id: 'product_request', label: '🛍️ Products' },
              { id: 'feature_request', label: '⚡ Features' },
              { id: 'store_feedback', label: '💬 Feedback' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedType === t.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-bold text-slate-500 text-[11px] mr-1">Status:</span>
            {[
              { id: 'All', label: 'All' },
              { id: 'Pending', label: 'Pending' },
              { id: 'Under Review', label: 'Under Review' },
              { id: 'In Progress', label: 'In Progress' },
              { id: 'Added', label: 'Added' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(s.id)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedStatus === s.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 text-xs">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="upvotes">Sort: Highest Upvotes</option>
            </select>
          </div>

        </div>
      </div>

      {/* Suggestions List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold text-sm bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <span>Loading customer requests and suggestions...</span>
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
          <Lightbulb className="w-10 h-10 text-amber-400 mx-auto" />
          <h4 className="font-extrabold text-slate-800 text-sm">No matching suggestions found</h4>
          <p className="text-xs text-slate-500">
            {searchQuery || selectedType !== 'All' || selectedStatus !== 'All'
              ? 'Try changing your search keywords or filter settings.'
              : 'Customer submissions will automatically appear here in real-time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSuggestions.map((sug) => {
            const isEditingNote = editingNoteId === sug.id;

            return (
              <div
                key={sug.id}
                className={`bg-white p-5 rounded-2xl border transition-all shadow-2xs hover:shadow-md ${
                  sug.status === 'Added'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : sug.status === 'In Progress'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  
                  {/* Left Column: Details */}
                  <div className="flex-1 space-y-2.5">
                    
                    {/* Tags row */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        sug.type === 'product_request'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : sug.type === 'feature_request'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {sug.type === 'product_request' ? '🛍️ Product Request' : sug.type === 'feature_request' ? '⚡ Feature Request' : '💬 Store Feedback'}
                      </span>

                      {sug.category && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          {sug.category}
                        </span>
                      )}

                      {/* Status Dropdown */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400">Status:</span>
                        <select
                          value={sug.status}
                          onChange={(e) => handleStatusChange(sug.id, e.target.value as SuggestionStatus)}
                          className={`text-[11px] font-black px-2 py-0.5 rounded-md border cursor-pointer focus:outline-none ${
                            sug.status === 'Added'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : sug.status === 'In Progress'
                              ? 'bg-amber-400 text-slate-950 border-amber-500 font-extrabold'
                              : sug.status === 'Under Review'
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : sug.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-900 border-rose-200'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Added">Added / Published</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      {/* Upvotes Badge */}
                      <span className="text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-amber-600 fill-amber-500" />
                        <span>{sug.upvotes || 1} Customer Upvotes</span>
                      </span>

                      <span className="text-[10px] text-slate-400 ml-auto">
                        {new Date(sug.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="flex items-start gap-3">
                      {sug.imageUrl && (
                        <img
                          src={sug.imageUrl}
                          alt={sug.title}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      )}
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                          {sug.title}
                        </h3>
                        {sug.brandOrDetails && (
                          <p className="text-xs font-semibold text-slate-600 mt-0.5">
                            Brand / Pack Details: <span className="font-bold text-slate-900">{sug.brandOrDetails}</span>
                            {sug.expectedPrice && (
                              <span className="text-emerald-700 font-bold ml-2">
                                (Expected MRP/Price: ₹{sug.expectedPrice})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      {sug.description}
                    </div>

                    {/* Customer Info Pill */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        👤 Customer: {sug.customerName}
                      </span>
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        📞 {sug.customerPhone}
                      </span>
                      {sug.customerEmail && (
                        <span className="text-slate-500">
                          ✉️ {sug.customerEmail}
                        </span>
                      )}
                    </div>

                    {/* Store Admin Note / Response Box */}
                    <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-amber-950 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                          <span>Store Admin Note / Public Response:</span>
                        </span>
                        {!isEditingNote && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(sug.id);
                              setNoteInput(sug.adminNote || '');
                            }}
                            className="text-[11px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{sug.adminNote ? 'Edit Note' : 'Add Note'}</span>
                          </button>
                        )}
                      </div>

                      {isEditingNote ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="e.g. Stocking this item starting next Monday! Or currently checking with dealer..."
                            className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveAdminNote(sug.id)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>Save Note</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-amber-900 text-xs italic">
                          {sug.adminNote || "No public note added yet. Click 'Add Note' to reply."}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 shrink-0 w-full lg:w-48 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    
                    {/* Convert to Product Button (For Product Requests) */}
                    {sug.type === 'product_request' && (
                      <button
                        type="button"
                        onClick={() => handleOpenConvertModal(sug)}
                        className={`w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
                          sug.status === 'Added'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                        }`}
                        title="Add this product directly into store catalog"
                      >
                        <PackagePlus className="w-4 h-4 text-amber-300" />
                        <span>{sug.status === 'Added' ? 'Edit In Catalog' : 'Publish to Catalog'}</span>
                      </button>
                    )}

                    {/* WhatsApp Customer Button */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReply(sug)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      title="Send WhatsApp update to customer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Update</span>
                    </button>

                    {/* Delete Suggestion */}
                    <button
                      type="button"
                      onClick={() => handleDelete(sug.id, sug.title)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Delete Suggestion"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1-Click Convert to Product Modal */}
      {convertModalSuggestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <PackagePlus className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Publish Product to Store Catalog</h3>
                  <p className="text-xs text-emerald-200">Automatically creates a live catalog product from customer request</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalSuggestion(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmConvert} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={convertForm.name}
                  onChange={e => setConvertForm({ ...convertForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Store Category *</label>
                  <select
                    value={convertForm.category}
                    onChange={e => setConvertForm({ ...convertForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={convertForm.brand}
                    onChange={e => setConvertForm({ ...convertForm, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={convertForm.price}
                    onChange={e => setConvertForm({ ...convertForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={convertForm.mrp}
                    onChange={e => setConvertForm({ ...convertForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-500 line-through focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit / Pack Size</label>
                  <input
                    type="text"
                    value={convertForm.unit}
                    onChange={e => setConvertForm({ ...convertForm, unit: e.target.value })}
                    placeholder="e.g. 500g / 1L"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Stock (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    value={convertForm.stock}
                    onChange={e => setConvertForm({ ...convertForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Photo URL</label>
                  <input
                    type="url"
                    value={convertForm.image}
                    onChange={e => setConvertForm({ ...convertForm, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catalog Description</label>
                <textarea
                  rows={2}
                  value={convertForm.description}
                  onChange={e => setConvertForm({ ...convertForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertModalSuggestion(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{converting ? 'Publishing...' : 'Publish to Store Catalog'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
