import React, { useState } from 'react';
import { useNomadStore } from '../../store';
import { DollarSign, Save, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { AppSettings } from '../../types';

export const AdminPricingTab: React.FC = () => {
  const { appSettings, updateAppSettings, addToast } = useNomadStore();
  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAppSettings(localSettings);
      addToast("Pricing settings updated successfully", "success");
    } catch (error) {
      console.error(error);
      addToast("Failed to update pricing settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePricing = (field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }));
  };

  const updateCollabPricing = (field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        collab: {
          ...prev.pricing.collab,
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-secondary uppercase tracking-tight">Pricing & Subscription Management</h2>
          <p className="text-xs text-slate-500 font-medium">Configure costs for family posting and collab tiers</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Settings */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
              <Info className="w-4 h-4" />
            </div>
            <h3 className="font-black text-secondary text-sm uppercase tracking-wider">Global Config</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency Code (ISO)</label>
              <input
                type="text"
                value={localSettings.pricing.currency}
                onChange={e => updatePricing('currency', e.target.value.toUpperCase())}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all uppercase"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trial Period (Days)</label>
              <input
                type="number"
                value={localSettings.pricing.trialDays}
                onChange={e => updatePricing('trialDays', parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Family Posting */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-black text-secondary text-sm uppercase tracking-wider">Family Posting (One-time)</h3>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unlock Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{localSettings.pricing.currency === 'USD' ? '$' : '€'}</span>
              <input
                type="number"
                step="0.01"
                value={localSettings.pricing.familyPosting}
                onChange={e => updatePricing('familyPosting', parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium px-1">Charge users for lifetime access to public community posting features.</p>
          </div>
        </div>

        {/* Collab Tiers */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="font-black text-secondary text-sm uppercase tracking-wider">Collab Subscription Tiers</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly</label>
              <input
                type="number"
                step="0.01"
                value={localSettings.pricing.collab.monthly}
                onChange={e => updateCollabPricing('monthly', parseFloat(e.target.value) || 0)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Annual</label>
              <input
                type="number"
                step="0.01"
                value={localSettings.pricing.collab.annual}
                onChange={e => updateCollabPricing('annual', parseFloat(e.target.value) || 0)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lifetime</label>
              <input
                type="number"
                step="0.01"
                value={localSettings.pricing.collab.lifetime}
                onChange={e => updateCollabPricing('lifetime', parseFloat(e.target.value) || 0)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
              />
            </div>
            <div className="flex items-center gap-3 pt-6 lg:justify-center">
              <input
                type="checkbox"
                id="monthlyEnabled"
                checked={localSettings.pricing.collab.monthlyEnabled}
                onChange={e => updateCollabPricing('monthlyEnabled', e.target.checked)}
                className="w-5 h-5 rounded-lg border-2 border-slate-200 text-primary focus:ring-primary/20"
              />
              <label htmlFor="monthlyEnabled" className="text-xs font-black text-secondary uppercase tracking-widest cursor-pointer">Enable Monthly</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
