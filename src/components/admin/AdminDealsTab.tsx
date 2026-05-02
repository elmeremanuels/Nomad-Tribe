import React, { useState } from 'react';
import { useNomadStore } from '../../store';
import { Deal, Advertiser, DealCategory, DealStatus, PlaceResult } from '../../types';
import { Plus, Trash2, Edit2, ExternalLink, Tag, Globe, MapPin, Building2, TrendingUp, CheckCircle2, XCircle, Clock, Link2, Loader2, Archive, RotateCcw, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PlacesAutocomplete } from '../PlacesAutocomplete';
import { ImageUpload } from '../ImageUpload';

const AdminDealsTab = () => {
  const { deals, advertisers, addAdvertiser, updateAdvertiser, addDeal, updateDeal, archiveDeal, unarchiveDeal, deleteDeal } = useNomadStore() as any;
  const [activeSubTab, setActiveSubTab] = useState<'advertisers' | 'deals'>('advertisers');
  const [showAddAdvertiser, setShowAddAdvertiser] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | DealStatus>('Active');

  const [newAdvertiser, setNewAdvertiser] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    logoUrl: '',
    description: '',
    notes: '',
    isActive: true
  });

  const [newDeal, setNewDeal] = useState({
    advertiserId: '',
    advertiserName: '',
    name: '',
    description: '',
    discountLabel: '',
    promoCode: '',
    affiliateUrl: '',
    imageUrl: '',
    category: 'Hotel' as DealCategory,
    status: 'Active' as DealStatus,
    targetPremiumOnly: false,
    isGlobal: false,
    location: '',
    lat: 0,
    lng: 0,
    place: null as PlaceResult | null,
    radiusKm: 50,
    startDate: new Date().toISOString(),
    endDate: '',
    ctaText: 'Get Deal',
    currency: 'EUR',
    isFeatured: false,
    originalPrice: 0,
    dealPrice: 0,
    disclaimer: ''
  });

  const handleAddAdvertiser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = {
        companyName: newAdvertiser.companyName,
        contactName: newAdvertiser.contactName,
        email: newAdvertiser.email,
        phone: newAdvertiser.phone,
        isActive: newAdvertiser.isActive,
        notes: newAdvertiser.notes || newAdvertiser.description
      };

      if (editingAdvertiser) {
        await updateAdvertiser(editingAdvertiser.id, data);
      } else {
        await addAdvertiser(data);
      }
      setShowAddAdvertiser(false);
      setEditingAdvertiser(null);
      setNewAdvertiser({ companyName: '', contactName: '', email: '', phone: '', website: '', logoUrl: '', description: '', notes: '', isActive: true });
    } catch (err) {
      console.error("Advertiser save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const advertiser = advertisers.find((a: Advertiser) => a.id === newDeal.advertiserId);
    
    setIsSubmitting(true);
    try {
      const data = {
        ...newDeal,
        advertiserName: advertiser?.companyName || 'Unknown',
        endDate: newDeal.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: newDeal.place ? `${newDeal.place.city}, ${newDeal.place.country}` : newDeal.location,
        lat: newDeal.place?.lat || newDeal.lat,
        lng: newDeal.place?.lng || newDeal.lng,
        place: newDeal.place || null
      };

      if (editingDeal) {
        await updateDeal(editingDeal.id, data);
      } else {
        await addDeal(data);
      }
      setShowAddDeal(false);
      setEditingDeal(null);
      setNewDeal({
        advertiserId: '',
        advertiserName: '',
        name: '',
        description: '',
        discountLabel: '',
        promoCode: '',
        affiliateUrl: '',
        imageUrl: '',
        category: 'Hotel',
        status: 'Active',
        targetPremiumOnly: false,
        isGlobal: false,
        location: '',
        lat: 0,
        lng: 0,
        place: null,
        radiusKm: 50,
        startDate: new Date().toISOString(),
        endDate: '',
        ctaText: 'Get Deal',
        currency: 'EUR',
        isFeatured: false,
        originalPrice: 0,
        dealPrice: 0,
        disclaimer: ''
      });
    } catch (err) {
      console.error("Deal save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleDeals = deals.filter((d: Deal) => 
    statusFilter === 'all' || d.status === statusFilter
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
          <button 
            onClick={() => setActiveSubTab('advertisers')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeSubTab === 'advertisers' ? "bg-white text-secondary shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Advertisers
          </button>
          <button 
            onClick={() => setActiveSubTab('deals')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeSubTab === 'deals' ? "bg-white text-secondary shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Deals
          </button>
        </div>

        <button 
          onClick={() => {
            if (activeSubTab === 'advertisers') {
              setEditingAdvertiser(null);
              setNewAdvertiser({ companyName: '', contactName: '', email: '', phone: '', website: '', logoUrl: '', description: '', notes: '', isActive: true });
              setShowAddAdvertiser(true);
            } else {
              setEditingDeal(null);
              setNewDeal({
                advertiserId: '',
                advertiserName: '',
                name: '',
                description: '',
                discountLabel: '',
                promoCode: '',
                affiliateUrl: '',
                imageUrl: '',
                category: 'Hotel',
                status: 'Active',
                targetPremiumOnly: false,
                isGlobal: false,
                location: '',
                lat: 0,
                lng: 0,
                place: null,
                radiusKm: 50,
                startDate: new Date().toISOString(),
                endDate: '',
                ctaText: 'Get Deal',
                currency: 'EUR',
                isFeatured: false,
                originalPrice: 0,
                dealPrice: 0,
                disclaimer: ''
              });
              setShowAddDeal(true);
            }
          }}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Add {activeSubTab === 'advertisers' ? 'Advertiser' : 'Deal'}
        </button>
      </div>

      {activeSubTab === 'advertisers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advertisers.map((adv: Advertiser) => (
            <div key={adv.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                   <Building2 className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-black text-secondary">{adv.companyName}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{adv.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4">{adv.notes}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingAdvertiser(adv);
                    setNewAdvertiser({
                      companyName: adv.companyName,
                      contactName: adv.contactName,
                      email: adv.email,
                      phone: adv.phone || '',
                      website: '',
                      logoUrl: '',
                      description: '',
                      notes: adv.notes || '',
                      isActive: adv.isActive
                    });
                    setShowAddAdvertiser(true);
                  }}
                  className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
          {advertisers.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold italic">No advertisers found.</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'deals' && (
        <div className="space-y-6">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {(['Active', 'Paused', 'Expired', 'all'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors whitespace-nowrap',
                  statusFilter === s
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-500 border-slate-100 hover:border-primary/30'
                )}
              >
                {s === 'all' ? 'All' : s} ({deals.filter((d: Deal) => s === 'all' || d.status === s).length})
              </button>
            ))}
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-[2.5rem] bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Deal</th>
                  <th className="px-6 py-4">Advertiser</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Performance</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visibleDeals.map((deal: Deal) => {
                  return (
                    <tr key={deal.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                            {deal.imageUrl && <img src={deal.imageUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-secondary leading-tight truncate">{deal.name}</p>
                            <p className="text-[10px] text-accent font-black uppercase mt-1">{deal.discountLabel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-600">
                        {deal.advertiserName}
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                          deal.status === 'Active' ? "bg-green-100 text-green-600" : 
                          deal.status === 'Paused' ? "bg-amber-100 text-amber-600" :
                          "bg-red-100 text-red-600"
                        )}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Impressions</p>
                            <p className="text-xs font-black">{deal.impressions || 0}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Clicks</p>
                            <p className="text-xs font-black text-primary">{deal.clicks || 0}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditingDeal(deal);
                              setNewDeal({
                                advertiserId: deal.advertiserId,
                                advertiserName: deal.advertiserName,
                                name: deal.name,
                                description: deal.description,
                                discountLabel: deal.discountLabel || '',
                                promoCode: deal.promoCode || '',
                                affiliateUrl: deal.affiliateUrl || '',
                                imageUrl: deal.imageUrl || '',
                                category: deal.category,
                                status: deal.status,
                                targetPremiumOnly: deal.targetPremiumOnly || false,
                                isGlobal: deal.isGlobal || false,
                                location: deal.location || '',
                                lat: deal.lat || 0,
                                lng: deal.lng || 0,
                                place: deal.place || null,
                                radiusKm: deal.radiusKm || 50,
                                startDate: deal.startDate,
                                endDate: deal.endDate,
                                ctaText: deal.ctaText || 'Get Deal',
                                currency: deal.currency || 'EUR',
                                isFeatured: deal.isFeatured || false,
                                originalPrice: deal.originalPrice || 0,
                                dealPrice: deal.dealPrice || 0,
                                disclaimer: deal.disclaimer || ''
                              });
                              setShowAddDeal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>

                          {deal.status === 'Paused' ? (
                            <button
                              onClick={async () => {
                                try { await unarchiveDeal(deal.id); } catch (e) { console.error(e); }
                              }}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Restore"
                            >
                              <RotateCcw size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                try { await archiveDeal(deal.id); } catch (e) { console.error(e); }
                              }}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Archive"
                            >
                              <Archive size={14} />
                            </button>
                          )}

                          {confirmingDelete === deal.id ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-lg ml-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await deleteDeal(deal.id);
                                    setConfirmingDelete(null);
                                  } catch (e) { console.error(e); }
                                }}
                                className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmingDelete(null)}
                                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingDelete(deal.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleDeals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">No deals found for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Advertiser Modal Overlay */}
      {showAddAdvertiser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative">
            <h2 className="text-2xl font-black text-secondary mb-6">{editingAdvertiser ? 'Edit Advertiser' : 'New Advertiser'}</h2>
            <form onSubmit={handleAddAdvertiser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  value={newAdvertiser.companyName}
                  onChange={e => setNewAdvertiser({...newAdvertiser, companyName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  value={newAdvertiser.contactName}
                  onChange={e => setNewAdvertiser({...newAdvertiser, contactName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                <input 
                  required
                  type="email" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  value={newAdvertiser.email}
                  onChange={e => setNewAdvertiser({...newAdvertiser, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes / Description</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none shadow-inner"
                  rows={3}
                  value={newAdvertiser.notes}
                  onChange={e => setNewAdvertiser({...newAdvertiser, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAdvertiser ? 'Save Changes' : 'Create Advertiser'}
                </button>
                <button type="button" onClick={() => setShowAddAdvertiser(false)} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Deal Modal Overlay */}
      {showAddDeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-secondary mb-6">{editingDeal ? 'Edit Deal' : 'New Deal'}</h2>
            <form onSubmit={handleAddDeal} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advertiser</label>
                  <select 
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                    value={newDeal.advertiserId}
                    onChange={e => setNewDeal({...newDeal, advertiserId: e.target.value})}
                  >
                    <option value="">Select Advertiser</option>
                    {advertisers.map((a: Advertiser) => (
                      <option key={a.id} value={a.id}>{a.companyName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal Category</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                    value={newDeal.category}
                    onChange={e => setNewDeal({...newDeal, category: e.target.value as any})}
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="VPN">VPN</option>
                    <option value="Coworking">Coworking</option>
                    <option value="Activiteiten">Activiteiten</option>
                    <option value="Verzekering">Verzekering</option>
                    <option value="SIM-kaart">SIM-kaart</option>
                    <option value="Overig">Overig</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal Image</label>
                {newDeal.imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-100">
                    <img 
                      src={newDeal.imageUrl} 
                      alt="Deal preview" 
                      className="w-full h-40 object-cover" 
                    />
                    <button 
                      type="button"
                      onClick={() => setNewDeal({ ...newDeal, imageUrl: '' })}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <ImageUpload 
                    onUpload={(url) => setNewDeal({ ...newDeal, imageUrl: url })}
                    label="Upload deal image"
                  />
                )}
                <p className="text-[10px] text-slate-400 font-medium italic">Landscape photo works best (e.g. 800x400).</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal Title</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  value={newDeal.name}
                  onChange={e => setNewDeal({...newDeal, name: e.target.value})}
                  placeholder="e.g. 20% Discount for Tribes"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                <textarea 
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-y min-h-[120px] shadow-inner"
                  rows={4}
                  maxLength={1500}
                  value={newDeal.description}
                  onChange={e => setNewDeal({...newDeal, description: e.target.value})}
                  placeholder="Full deal details, terms, and how to claim. Visible in the 'More Info' popup."
                />
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] text-slate-400 font-medium">Visible in full in the detail popup.</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tight">{(newDeal.description || '').length}/1500</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original (€)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold"
                    value={newDeal.originalPrice}
                    onChange={e => setNewDeal({...newDeal, originalPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal (€)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-accent"
                    value={newDeal.dealPrice}
                    onChange={e => setNewDeal({...newDeal, dealPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badge</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl font-bold text-accent"
                    value={newDeal.discountLabel}
                    onChange={e => setNewDeal({...newDeal, discountLabel: e.target.value})}
                    placeholder="e.g. 10% OFF"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promo Code</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl font-mono font-bold"
                    value={newDeal.promoCode}
                    onChange={e => setNewDeal({...newDeal, promoCode: e.target.value})}
                    placeholder="TRIBE20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CTA Button Text</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                    value={newDeal.ctaText}
                    onChange={e => setNewDeal({...newDeal, ctaText: e.target.value})}
                    placeholder="Get Deal"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination URL</label>
                  <div className="relative group/url">
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-focus-within/url:text-primary transition-colors" />
                    <input 
                      required
                      type="url" 
                      className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                      value={newDeal.affiliateUrl}
                      onChange={e => setNewDeal({...newDeal, affiliateUrl: e.target.value})}
                      placeholder="https://advertiser.com/deal?ref=..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div 
                    onClick={() => setNewDeal({...newDeal, isGlobal: !newDeal.isGlobal})}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative border",
                      newDeal.isGlobal ? "bg-primary border-primary" : "bg-slate-100 border-slate-200"
                    )}
                  >
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", newDeal.isGlobal ? "left-7" : "left-1")} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Global Deal</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div 
                    onClick={() => setNewDeal({...newDeal, targetPremiumOnly: !newDeal.targetPremiumOnly})}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative border",
                      newDeal.targetPremiumOnly ? "bg-accent border-accent" : "bg-slate-100 border-slate-200"
                    )}
                  >
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", newDeal.targetPremiumOnly ? "left-7" : "left-1")} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Premium Only</span>
                </label>
              </div>

              {!newDeal.isGlobal && (
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Targeting</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="col-span-1 space-y-1">
                        <PlacesAutocomplete 
                          label="City / Hub"
                          placeholder="e.g. Barcelona"
                          value={newDeal.place}
                          onChange={(place) => setNewDeal({
                            ...newDeal, 
                            place,
                            location: place ? `${place.city}, ${place.country}` : ''
                          })}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Radius (KM)</label>
                        <input 
                          type="number" 
                          className="w-full p-3 bg-white border border-slate-100 rounded-xl"
                          value={newDeal.radiusKm}
                          onChange={e => setNewDeal({...newDeal, radiusKm: parseInt(e.target.value) || 50})}
                        />
                     </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration Date (Optional)</label>
                  <input 
                    type="date"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
                    value={newDeal.endDate ? newDeal.endDate.split('T')[0] : ''}
                    onChange={e => setNewDeal({...newDeal, endDate: e.target.value ? new Date(e.target.value).toISOString() : ''})}
                  />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disclaimer</label>
                   <input 
                     type="text" 
                     className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold"
                     value={newDeal.disclaimer}
                     onChange={e => setNewDeal({...newDeal, disclaimer: e.target.value})}
                     placeholder="e.g. Valid until stocks last"
                   />
                </div>
              </div>

              <div className="flex gap-4 sticky bottom-0 bg-white py-4 border-t border-slate-50">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingDeal ? 'Update Deal' : 'Publish Deal'}
                </button>
                <button type="button" onClick={() => setShowAddDeal(false)} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDealsTab;
