import React, { useState } from 'react';
import { useNomadStore } from '../../store';
import { Deal, Advertiser, DealCategory, DealStatus, PlaceResult } from '../../types';
import { Plus, Trash2, Edit2, ExternalLink, Tag, Globe, MapPin, Building2, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PlacesAutocomplete } from '../PlacesAutocomplete';

const AdminDealsTab = () => {
  const { deals, advertisers, addAdvertiser, updateAdvertiser, addDeal, updateDeal } = useNomadStore() as any;
  const [activeSubTab, setActiveSubTab] = useState<'advertisers' | 'deals'>('advertisers');
  const [showAddAdvertiser, setShowAddAdvertiser] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [newAdvertiser, setNewAdvertiser] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    logoUrl: '',
    description: '', // Note: description is not in Advertiser type but I'll store it in notes or ignore
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
    ctaText: 'Claim Deal',
    currency: 'EUR',
    isFeatured: false
  });

  const handleAddAdvertiser = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const advertiser = advertisers.find((a: Advertiser) => a.id === newDeal.advertiserId);
    const data = {
        ...newDeal,
        advertiserName: advertiser?.companyName || 'Unknown',
        endDate: newDeal.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: newDeal.place ? `${newDeal.place.city}, ${newDeal.place.country}` : newDeal.location,
        lat: newDeal.place?.lat || newDeal.lat,
        lng: newDeal.place?.lng || newDeal.lng,
        place: newDeal.place || undefined
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
      ctaText: 'Claim Deal',
      currency: 'EUR',
      isFeatured: false
    });
  };

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
                ctaText: 'Claim Deal',
                currency: 'EUR',
                isFeatured: false
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
        <div className="space-y-4">
          <div className="overflow-hidden border border-slate-100 rounded-[2.5rem]">
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
                {deals.map((deal: Deal) => {
                  return (
                    <tr key={deal.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                            {deal.imageUrl && <img src={deal.imageUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-secondary leading-tight">{deal.name}</p>
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
                        <div className="flex items-center justify-end gap-2">
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
                                location: deal.location,
                                lat: deal.lat || 0,
                                lng: deal.lng || 0,
                                place: deal.place || null,
                                radiusKm: deal.radiusKm || 50,
                                startDate: deal.startDate,
                                endDate: deal.endDate,
                                ctaText: deal.ctaText || 'Claim Deal',
                                currency: deal.currency || 'EUR',
                                isFeatured: deal.isFeatured || false
                              });
                              setShowAddDeal(true);
                            }}
                            className="p-2 text-slate-300 hover:text-primary transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                <button type="submit" className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20">{editingAdvertiser ? 'Save Changes' : 'Create Advertiser'}</button>
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
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name / Title</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                    value={newDeal.name}
                    onChange={e => setNewDeal({...newDeal, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount Label (e.g. 10% OFF)</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                    value={newDeal.discountLabel}
                    onChange={e => setNewDeal({...newDeal, discountLabel: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none shadow-inner"
                  rows={2}
                  value={newDeal.description}
                  onChange={e => setNewDeal({...newDeal, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promo Code (Optional)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                    value={newDeal.promoCode}
                    onChange={e => setNewDeal({...newDeal, promoCode: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Affiliate / Target Link</label>
                  <input 
                    type="url" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                    value={newDeal.affiliateUrl}
                    onChange={e => setNewDeal({...newDeal, affiliateUrl: e.target.value})}
                  />
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

              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20">{editingDeal ? 'Save Changes' : 'Publish Deal'}</button>
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
