/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { TagInput } from './components/TagInput';
import { SharedJourneyTimeline } from './components/SharedJourneyTimeline';
import { LocationSelector } from './components/LocationSelector';
import { MapView } from './components/MapView';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import { standardizeInterest } from './lib/interestUtils';
import { Radar, Map as MapIcon, BookOpen, User, Plus, Star, MapPin, Calendar, Users, CheckCircle2, ShieldCheck, MessageSquare, ShoppingBag, X, Download, Trash2, ArrowRight, Info, Heart, Search, Filter, ArrowLeft, Settings, ChevronLeft, ChevronRight, Globe, Lock, Bell, BellOff, LogOut, BarChart3, Shield, Hammer, ArrowBigUp, ArrowBigDown, Navigation, Loader2, Edit2, Send, Compass, Radar as RadarIcon, BarChart3 as BarChartIcon, ShieldCheck as ShieldIcon, Users as UsersIcon, MapPin as MapPinIcon, Calendar as CalendarIcon, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon, Plus as PlusIcon, Globe as GlobeIcon, Search as SearchIcon, Radar as RadarIcon2, Award, UserCheck, Zap, Coffee, Pizza, Beer, Briefcase, ThumbsUp, ThumbsDown, Tag, MoreVertical, ChevronUp, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNomadStore } from './store';
import { containsBlockedContent, cleanContent } from './lib/contentFilter';
import { calculateDistance, calculateMatchScore, Trip, MarketItem, PopUpEvent, LookingForRequest, Kid, Spot, FamilyProfile, Parent, CollabAsk, CollabCard, CollabEndorsement, Report, CityProfile, CityEvent, SpotCategory, DestinationGuidance } from './types';
import { format, parseISO } from 'date-fns';
import { cn } from './lib/utils';
import cities from './data/citiesSeed.json';
import occupations from './data/occupationsSeed.json';
import skillsSeed from './data/skillsSeed.json';

const ReportModal = ({ isOpen, onClose, target }: { isOpen: boolean, onClose: () => void, target: { id: string, type: Report['targetType'] } | null }) => {
  const { submitReport, currentUser } = useNomadStore();
  const [category, setCategory] = useState<Report['category']>('Harassment');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState(1);

  if (!target || !currentUser) return null;

  const categories: { id: Report['category'], label: string, icon: string }[] = [
    { id: 'Harassment', label: 'Harassment or bullying', icon: '🚨' },
    { id: 'Spam', label: 'Spam or unsolicited promotion', icon: '🚫' },
    { id: 'IllegalContent', label: 'Illegal content or CSAM', icon: '⚠️' },
    { id: 'FakeProfile', label: 'Fake profile', icon: '👤' },
    { id: 'DangerousLocation', label: 'Dangerous or false location', icon: '📍' },
  ];

  const handleSubmit = async () => {
    await submitReport({
      reporterId: currentUser.id,
      targetId: target.id,
      targetType: target.type,
      category,
      description
    });
    onClose();
    setStep(1);
    setDescription('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Content">
      <div className="space-y-6">
        {step === 1 ? (
          <>
            <div className="space-y-3">
              <p className="text-sm text-slate-500 font-medium">Why are you reporting this?</p>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3",
                      category === cat.id ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-600 hover:border-slate-200"
                    )}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-bold text-sm">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Additional Details (Optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 300))}
                placeholder="Please describe the issue..."
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium min-h-[120px]"
              />
              <p className="text-right text-[10px] font-bold text-slate-400">{description.length}/300</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Back</button>
              <button 
                onClick={handleSubmit}
                className="flex-2 py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-500/20"
              >
                Submit Report
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { currentUser, updatePreferences, updateProfile } = useNomadStore();
  if (!currentUser) return null;

  const languages = [
    { code: 'EN', name: 'English' },
    { code: 'NL', name: 'Nederlands' },
    { code: 'DE', name: 'Deutsch' },
    { code: 'FR', name: 'Français' },
    { code: 'RU', name: 'Русский' }
  ];

  const toggleIncognito = async () => {
    await updateProfile({
      privacySettings: {
        ...currentUser.privacySettings,
        isIncognito: !currentUser.privacySettings?.isIncognito
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-8">
        {/* Privacy */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-secondary">
            <Lock className="w-5 h-5" />
            <h3 className="font-bold">Privacy</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <h4 className="font-bold text-secondary text-sm">Incognito Mode</h4>
              <p className="text-[10px] text-slate-500 font-medium">Hide from matching radars</p>
            </div>
            <button 
              onClick={toggleIncognito}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                currentUser.privacySettings?.isIncognito ? "bg-primary" : "bg-slate-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                currentUser.privacySettings?.isIncognito ? "left-7" : "left-1"
              )} />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-secondary">
            <Globe className="w-5 h-5" />
            <h3 className="font-bold">Language</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => updatePreferences({ language: lang.code as any })}
                className={cn(
                  "p-3 rounded-xl border text-sm font-bold transition-all",
                  currentUser.preferences.language === lang.code 
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                    : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200"
                )}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-secondary">
            <MapIcon className="w-5 h-5" />
            <h3 className="font-bold">Journey Suggestions</h3>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
            "Your location is only used to show nearby families and destinations. Ghost Mode hides you completely from all radars. You can turn this on or off at any time."
          </p>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-sm font-bold text-secondary">Next Location Suggestions</p>
              <p className="text-[10px] text-slate-400">See recommendations for your next trip</p>
            </div>
            <button 
              onClick={() => updatePreferences({ showNextLocationSuggestions: !currentUser.preferences.showNextLocationSuggestions })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                currentUser.preferences.showNextLocationSuggestions ? "bg-primary" : "bg-slate-300"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                currentUser.preferences.showNextLocationSuggestions ? "right-1" : "left-1"
              )} />
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-secondary">
            <Lock className="w-5 h-5" />
            <h3 className="font-bold">Privacy</h3>
          </div>
          <div className="space-y-2">
            {[
              { key: 'showBioToNonConnects', label: 'Show Bio to Public' },
              { key: 'showKidsToNonConnects', label: 'Show Kids to Public' },
              { key: 'showTripsToNonConnects', label: 'Show Trips to Public' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm font-bold text-secondary">{item.label}</p>
                <button 
                  onClick={() => updatePreferences({ 
                    privacy: { ...currentUser.preferences.privacy, [item.key]: !currentUser.preferences.privacy[item.key as keyof typeof currentUser.preferences.privacy] } 
                  })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    currentUser.preferences.privacy[item.key as keyof typeof currentUser.preferences.privacy] ? "bg-primary" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    currentUser.preferences.privacy[item.key as keyof typeof currentUser.preferences.privacy] ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-secondary">
            <Star className="w-5 h-5" />
            <h3 className="font-bold">Subscription</h3>
          </div>
          <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-bold text-secondary">Premium Plan</p>
                <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Active</p>
              </div>
              <p className="text-lg font-black text-secondary">€9.99/mo</p>
            </div>
            <button className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">
              Cancel Subscription
            </button>
          </div>
        </div>

        {/* Account Actions */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <button 
            onClick={async () => {
               await useNomadStore.getState().addToast("Logging out...", "info");
               const { signOut } = await import('firebase/auth');
               const { auth } = await import('./firebase');
               await signOut(auth);
               onClose();
            }}
            className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-bold hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
          
          <button 
            onClick={() => {
              if (window.confirm("Are you sure? This will permanently delete your profile, trips, messages, and all data. The only thing we keep is your email address for 45 days to prevent trial abuse. This cannot be undone.")) {
                useNomadStore.getState().deleteAccount();
              }
            }}
            className="w-full text-center py-2 text-xs font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest"
          >
            Delete my account
          </button>
        </div>
      </div>
    </Modal>
  );
};

const AdminDashboard = () => {
  const { appSettings, updateAppSettings, profiles, deleteUser, updateUserRole, marketItems, removeMarketItem, spots, removeSpot, reports, moderateReport, moderateUser } = useNomadStore() as any;
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'content' | 'reports'>('settings');

  const getReportSummary = (report: Report) => {
    if (report.targetType === 'User') {
      const user = profiles.find((p: FamilyProfile) => p.id === report.targetId);
      return user ? `User: ${user.familyName}` : 'Unknown User';
    }
    if (report.targetType === 'Message') return 'Chat Message';
    if (report.targetType === 'CollabAsk') {
      return 'Collab Asset';
    }
    return report.targetType;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-32 md:pb-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-secondary/10 rounded-[1.5rem] flex items-center justify-center text-secondary border border-secondary/20 shadow-sm">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-secondary tracking-tight">Super Admin Dashboard</h1>
              <span className="px-3 py-1 bg-secondary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">System Root</span>
            </div>
            <p className="text-slate-500 font-medium">Global platform control & system monitoring</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 md:flex-none">
          <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Users</p>
            <p className="text-xl font-black text-secondary leading-none">{profiles?.length || 0}</p>
          </div>
          <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market</p>
            <p className="text-xl font-black text-secondary leading-none">{marketItems?.length || 0}</p>
          </div>
          <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spots</p>
            <p className="text-xl font-black text-secondary leading-none">{spots?.length || 0}</p>
          </div>
          <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reports</p>
            <p className="text-xl font-black text-red-500 leading-none">{reports?.filter((r: any) => r.status === 'pending').length || 0}</p>
          </div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar p-1">
        {[
          { id: 'settings', label: 'App Settings', icon: Hammer },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'content', label: 'Content Control', icon: ShoppingBag },
          { id: 'reports', label: 'Safety Reports', icon: ShieldCheck }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-secondary text-white shadow-xl shadow-secondary/20 scale-[1.02]" 
                : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 hover:border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[600px] transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'settings' && (
              <div className="space-y-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-secondary tracking-tight">Global Configuration</h2>
                  <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                        <Download className="w-4 h-4 text-slate-400" />
                      </div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Max Upload Size (KB)</label>
                    </div>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-secondary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={appSettings.maxUploadSizeKB}
                      onChange={(e) => updateAppSettings({ maxUploadSizeKB: parseInt(e.target.value) })}
                    />
                    <p className="text-[10px] text-slate-400 font-medium px-1">Limits the size of family photos and gear images.</p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                        <Hammer className="w-4 h-4 text-slate-400" />
                      </div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Maintenance Mode</label>
                    </div>
                    <button 
                      onClick={() => updateAppSettings({ maintenanceMode: !appSettings.maintenanceMode })}
                      className={cn(
                        "w-full p-4 rounded-2xl font-black border transition-all flex justify-between items-center group",
                        appSettings.maintenanceMode 
                          ? "bg-red-50 border-red-200 text-red-600 shadow-lg shadow-red-100" 
                          : "bg-green-50 border-green-200 text-green-600 shadow-lg shadow-green-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2.5 h-2.5 rounded-full", appSettings.maintenanceMode ? "bg-red-500 animate-pulse" : "bg-green-500")} />
                        {appSettings.maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">Toggle Status</div>
                    </button>
                    <p className="text-[10px] text-slate-400 font-medium px-1">When active, only SuperAdmins can access the application.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-secondary tracking-tight">User Management</h2>
                  <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block" />
                </div>

                <div className="overflow-hidden border border-slate-100 rounded-3xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Family Profile</th>
                        <th className="px-6 py-4">Access Level</th>
                        <th className="px-6 py-4">Subscription</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {profiles.map((p: FamilyProfile) => (
                        <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                                <img 
                                  src={p.photoUrl || `https://picsum.photos/seed/${p.id}/100/100`} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div>
                                <p className="text-sm font-black text-secondary leading-tight">{p.familyName}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">{p.id.substring(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                           <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <select 
                                value={p.role}
                                onChange={(e) => updateUserRole(p.id, e.target.value as any)}
                                className="text-xs font-black bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                              >
                                <option value="User">Standard User</option>
                                <option value="UserPlus">User Plus</option>
                                <option value="SuperAdmin">Super Admin</option>
                              </select>
                              {p.isBanned && (
                                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest px-1">Banned</span>
                              )}
                              {p.ugcPrivilegesRevoked && (
                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest px-1">UGC Revoked</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                              p.isPremium 
                                ? "bg-accent/10 text-accent border-accent/20" 
                                : "bg-slate-100 text-slate-400 border-slate-200"
                            )}>
                              {p.isPremium && <Star className="w-3 h-3 fill-current" />}
                              {p.isPremium ? 'Premium' : 'Free'}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right flex gap-1 justify-end">
                            <button 
                              onClick={() => {
                                if (p.isBanned) {
                                  moderateUser(p.id, { isBanned: false });
                                } else if (confirm(`Ban ${p.familyName}?`)) {
                                  moderateUser(p.id, { isBanned: true });
                                }
                              }}
                              className={cn(
                                "p-3 rounded-xl transition-all",
                                p.isBanned ? "text-red-500 bg-red-50" : "text-slate-300 hover:text-red-500 hover:bg-red-50"
                              )}
                              title={p.isBanned ? "Unban User" : "Ban User"}
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`Delete user ${p.familyName}? This action is irreversible.`)) deleteUser(p.id);
                              }}
                              className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-secondary tracking-tight">Content Control</h2>
                  <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Marketplace Items</h3>
                    <div className="space-y-3">
                      {marketItems.map((item: MarketItem) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-white overflow-hidden border border-slate-100 shadow-sm">
                              <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-secondary leading-tight">{item.title}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">Seller: {item.sellerName}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeMarketItem(item.id)}
                            className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Community Spots</h3>
                    <div className="space-y-3">
                      {spots.map((spot: Spot) => (
                        <div key={spot.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-white overflow-hidden border border-slate-100 shadow-sm">
                              <img src={spot.imageUrl || `https://picsum.photos/seed/${spot.id}/100/100`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-secondary leading-tight">{spot.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">{spot.category}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeSpot(spot.id)}
                            className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-secondary tracking-tight">Safety Reports</h2>
                  <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block" />
                </div>

                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100">
                      <Shield className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-secondary tracking-tight">All Clear</h3>
                      <p className="text-slate-400 font-medium max-w-xs mx-auto">No active safety reports. The community is currently safe and thriving.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map((report: any) => (
                      <div key={report.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              report.status === 'resolved' ? 'bg-green-50 text-green-500' :
                              report.category === 'CSAM' || report.category === 'Harassment' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Shield className="w-5 h-5" />
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{report.category}</p>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                  report.targetType === 'User' ? "bg-purple-100 text-purple-600" :
                                  report.targetType === 'Message' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                                )}>
                                  {report.targetType}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-secondary">{getReportSummary(report)}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                            report.status === 'pending' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {report.status}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-xs text-slate-500">
                          "{report.description}"
                        </div>
                        
                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                          <p className="text-[10px] text-slate-400 font-medium">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            {report.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => moderateReport(report.id, 'resolved', 'Dismissed')}
                                  className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                                >
                                  Dismiss
                                </button>
                                <div className="relative group/actions">
                                  <button className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors">
                                    Take Action
                                  </button>
                                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 hidden group-hover/actions:block z-50">
                                    <button 
                                      onClick={() => {
                                        moderateReport(report.id, 'resolved', 'Banned');
                                        if (report.targetType === 'User') moderateUser(report.targetId, { isBanned: true });
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                      Ban User
                                    </button>
                                    <button 
                                      onClick={() => {
                                        moderateReport(report.id, 'resolved', 'UGC_Revoked');
                                        if (report.targetType === 'User') moderateUser(report.targetId, { ugcPrivilegesRevoked: true });
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                      Revoke UGC
                                    </button>
                                    <button 
                                      onClick={() => {
                                        moderateReport(report.id, 'resolved', 'Warned');
                                        if (report.targetType === 'User') {
                                          const user = profiles.find((p: any) => p.id === report.targetId);
                                          moderateUser(report.targetId, { warnings: (user?.warnings || 0) + 1 });
                                        }
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                      Warning
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const ImageUpload = ({ onUpload, label }: { onUpload: (url: string) => void, label: string }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, file.size, file.type);

    // Check file size (limit to 500KB for Base64 storage in Firestore)
    if (file.size > 500 * 1024) {
      useNomadStore.getState().addToast("Afbeelding is te groot. Kies een afbeelding kleiner dan 500KB.", "error");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (result && result.startsWith('data:image/')) {
        console.log("Image read successfully, calling onUpload");
        onUpload(result);
      } else {
        console.error("Failed to read image as data URL");
        useNomadStore.getState().addToast("Bestand lezen mislukt.", "error");
      }
      setIsUploading(false);
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className="hidden" 
          id={`upload-${label}`}
        />
        <label 
          htmlFor={`upload-${label}`}
          className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer group-hover:border-primary/40 transition-all"
        >
          {isUploading ? (
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <>
              <Plus className="w-6 h-6 text-slate-400 mb-2 group-hover:text-primary transition-colors" />
              <span className="text-xs font-bold text-slate-400 group-hover:text-primary transition-colors">Click to upload photo</span>
            </>
          )}
        </label>
      </div>
    </div>
  );
};



const Modal = ({ isOpen, onClose, title, children, dark }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, dark?: boolean }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "relative w-full max-w-md rounded-3xl overflow-hidden card-shadow",
            dark ? "bg-[#004d55] text-white" : "bg-white text-secondary"
          )}
        >
          <div className={cn(
            "p-6 border-b flex justify-between items-center",
            dark ? "border-white/10" : "border-slate-100"
          )}>
            <h2 className={cn("text-xl font-bold", dark ? "text-white" : "text-secondary")}>{title}</h2>
            <button onClick={onClose} className={cn(
              "p-2 rounded-full transition-colors",
              dark ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            )}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Badge: React.FC<{ name: string, size?: 'sm' | 'md' }> = ({ name, size = 'sm' }) => {
  const getBadgeInfo = (name: string) => {
    switch (name) {
      case 'Profile Pro': return { icon: <UserCheck className="w-3 h-3" />, color: 'bg-green-100 text-green-600', label: 'Profile Pro' };
      case 'Marketplace Hero': return { icon: <ShoppingBag className="w-3 h-3" />, color: 'bg-orange-100 text-orange-600', label: 'Market Hero' };
      case 'Local Guide': return { icon: <MapPin className="w-3 h-3" />, color: 'bg-blue-100 text-blue-600', label: 'Local Guide' };
      case 'Top Contributor': return { icon: <Star className="w-3 h-3" />, color: 'bg-purple-100 text-purple-600', label: 'Top Contributor' };
      case 'Trusted Member': return { icon: <ShieldCheck className="w-3 h-3" />, color: 'bg-accent/10 text-accent', label: 'Trusted' };
      case 'Tribe Pioneer': return { icon: <Award className="w-3 h-3" />, color: 'bg-emerald-100 text-emerald-600', label: 'Tribe Pioneer' };
      default: return { icon: <Shield className="w-3 h-3" />, color: 'bg-slate-100 text-slate-600', label: name };
    }
  };

  const info = getBadgeInfo(name);
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider",
      info.color,
      size === 'sm' ? "text-[8px]" : "text-[10px] px-3 py-1"
    )}>
      {info.icon}
      {info.label}
    </div>
  );
};

const VoteButtons = ({ type, id, votes }: { type: 'lookingFor' | 'marketplace' | 'spots', id: string, votes?: { up: string[], down: string[] } }) => {
  const { vote, currentUser } = useNomadStore();
  const upCount = votes?.up?.length || 0;
  const downCount = votes?.down?.length || 0;
  const score = upCount - downCount;
  
  const hasUpvoted = votes?.up?.includes(currentUser?.id || '');
  const hasDownvoted = votes?.down?.includes(currentUser?.id || '');

  return (
    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
      <button 
        onClick={(e) => { e.stopPropagation(); vote(type, id, 'up'); }}
        className={cn("transition-colors", hasUpvoted ? "text-green-500" : "text-slate-400 hover:text-green-500")}
      >
        <ArrowBigUp className={cn("w-5 h-5", hasUpvoted && "fill-current")} />
      </button>
      <span className={cn("text-xs font-black", score > 0 ? "text-green-600" : score < 0 ? "text-red-600" : "text-slate-400")}>
        {score > 0 ? `+${score}` : score}
      </span>
      <button 
        onClick={(e) => { e.stopPropagation(); vote(type, id, 'down'); }}
        className={cn("transition-colors", hasDownvoted ? "text-red-500" : "text-slate-400 hover:text-red-500")}
      >
        <ArrowBigDown className={cn("w-5 h-5", hasDownvoted && "fill-current")} />
      </button>
    </div>
  );
};

// --- Views ---

const MultiTierPaywall = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { currentUser, updateProfile, addToast, setCollabMode } = useNomadStore();
  const [loadingTier, setLoadingTier] = useState<'MONTHLY' | 'ANNUAL' | 'LIFETIME' | null>(null);

  const handleSubscribe = async (tier: 'MONTHLY' | 'ANNUAL' | 'LIFETIME') => {
    setLoadingTier(tier);
    // Simulate payment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let premiumUntil: string | undefined;
    if (tier === 'MONTHLY') {
      premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (tier === 'ANNUAL') {
      premiumUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    await updateProfile({
      isPremium: true,
      premiumType: tier,
      premiumUntil
    });

    setLoadingTier(null);
    onClose();
    addToast("Welcome to the Inner Circle. All professional features are now unlocked!", "success");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Your Tribe Access">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-slate-500 font-medium text-sm">
            Switch to Collab Focus, unlock the Professional Match Center and connect with world-class remote experts.
          </p>
          <p className="text-[10px] text-primary font-black uppercase tracking-widest">
            Family Focus features are 100% free
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Card 1: Monthly */}
          <button 
            onClick={() => handleSubscribe('MONTHLY')}
            disabled={!!loadingTier}
            className="group relative p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-left transition-all hover:border-primary active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black text-secondary">Pro Monthly</h3>
                <p className="text-2xl font-black text-primary">€14,99 <span className="text-xs text-slate-400">/ month</span></p>
              </div>
              {loadingTier === 'MONTHLY' ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Zap className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />}
            </div>
            <p className="text-xs text-slate-400 font-medium">Connect locally, share skills, and scale your business while traveling.</p>
          </button>

          {/* Card 2: Annual - Best Value */}
          <button 
            onClick={() => handleSubscribe('ANNUAL')}
            disabled={!!loadingTier}
            className="group relative p-6 bg-secondary border-2 border-primary rounded-3xl text-left transition-all hover:ring-2 hover:ring-primary/20 active:scale-[0.98] disabled:opacity-50"
          >
            <div className="absolute -top-3 right-6 bg-accent text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              Best Value - 2 Months Free
            </div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black text-white">Pro Annual</h3>
                <p className="text-2xl font-black text-white">€149,00 <span className="text-xs text-white/40">/ year</span></p>
              </div>
              {loadingTier === 'ANNUAL' ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Award className="w-6 h-6 text-[#e9c46a] group-hover:scale-110 transition-transform" />}
            </div>
            <p className="text-xs text-white/60 font-medium">All Pro features with full annual commitment savings.</p>
          </button>

          {/* Card 3: Lifetime */}
          <button 
            onClick={() => handleSubscribe('LIFETIME')}
            disabled={!!loadingTier}
            className="group relative p-6 bg-slate-900 border-2 border-slate-800 rounded-3xl text-left transition-all hover:border-accent active:scale-[0.98] disabled:opacity-50"
          >
            <div className="absolute -top-3 right-6 bg-white text-slate-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              Founding Member LTD
            </div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black text-white">Lifetime Access</h3>
                <p className="text-2xl font-black text-accent">€399,00 <span className="text-xs text-white/40">once</span></p>
              </div>
              {loadingTier === 'LIFETIME' ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <ShieldCheck className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />}
            </div>
            <p className="text-xs text-white/40 font-medium italic">BEST FOR LONG-TERM NOMADS. Pay once, use forever.</p>
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 font-medium">
          Secure payment with Stripe. Cancel anytime for subscriptions.
        </p>
      </div>
    </Modal>
  );
};

const PremiumAction = ({ 
  children, 
  onClick, 
  className,
  isPremium,
  onPaywall 
}: { 
  children: React.ReactElement<any>, 
  onClick: () => void, 
  className?: string,
  isPremium: boolean,
  onPaywall: () => void 
}) => {
  const collabMode = useNomadStore(state => state.collabMode);
  // Family Focus (collabMode is false) is always free
  // Collab Focus (collabMode is true) requires premium
  const effectivelyPremium = isPremium || collabMode === false;

  const handleClick = (e: React.MouseEvent) => {
    console.log("PremiumAction clicked. collabMode:", collabMode, "isPremium:", isPremium, "effectivelyPremium:", effectivelyPremium);
    if (!effectivelyPremium) {
      e.preventDefault();
      e.stopPropagation();
      onPaywall();
    } else {
      onClick();
    }
  };

  return (
    <div className={cn("relative group", className)}>
      {React.cloneElement(children, { 
        onClick: handleClick,
        className: cn(children.props?.className, !effectivelyPremium && "pr-8 relative overflow-hidden")
      } as any)}
      {!effectivelyPremium && (
        <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center justify-center bg-accent/20 text-accent p-1 rounded-lg pointer-events-none group-hover:scale-110 transition-transform">
          <Lock className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

const MarketplaceView = ({ onBack, onContactSeller, collabMode, onPaywall }: { onBack: () => void, onContactSeller: (item: MarketItem) => void, collabMode?: boolean, onPaywall: () => void }) => {
  const { marketItems, currentUser, reserveItem, cancelReservation, addItem, addLookingFor, processPayment, addToast } = useNomadStore();
  const isPremium = currentUser?.isPremium || false;
  const [radius, setRadius] = useState(20);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isRequestItemOpen, setIsRequestItemOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({ title: '', description: '', price: 0, category: collabMode ? 'Professional Services' : 'Gear' as any, imageUrl: '', locationName: '', lat: 0, lng: 0 });
  const [newRequest, setNewRequest] = useState({ title: '', description: '', location: '', lat: 0, lng: 0 });

  const filteredItems = marketItems.filter(item => {
    // Mock distance check - stable based on item ID
    const distance = (item.id.length * 7) % 50; 
    
    // In collab mode, only show B2B/Professional items
    if (collabMode && item.category !== 'Professional Services') return false;
    if (!collabMode && item.category === 'Professional Services') return false;

    return distance <= radius;
  });

  const handlePayment = async (item: MarketItem) => {
    setIsProcessing(item.id);
    const price = item.price === 'Free' ? 0 : item.price;
    const success = await processPayment(item.id, price);
    if (success) {
      reserveItem(item.id, currentUser?.id || '');
      addToast(`Betaling geslaagd! Item gereserveerd.`, "success");
    }
    setIsProcessing(null);
  };

  return (
    <div className={cn(
      "p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-24 md:pb-8 transition-colors duration-500 min-h-full",
      collabMode ? "bg-[#006d77] text-white" : "text-slate-900"
    )}>
      <header className="flex items-center gap-4">
        <button 
          onClick={onBack} 
          className={cn("p-2 rounded-xl border transition-all", collabMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-100 card-shadow text-slate-600")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={cn("text-3xl font-black tracking-tight", collabMode ? "text-white" : "text-secondary")}>
            {collabMode ? 'B2B Services' : 'Marketplace'}
          </h1>
          <p className={cn("font-medium", collabMode ? "text-white/60" : "text-slate-500")}>
            {collabMode ? 'Hire fellow nomads or offer your professional services.' : 'Buy, sell, or request gear from the tribe.'}
          </p>
        </div>
      </header>

      <div className={cn(
        "p-6 rounded-[2rem] border transition-all space-y-4",
        collabMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 card-shadow"
      )}>
        <div className="flex justify-between items-center">
          <h3 className={cn("text-xs font-black uppercase tracking-widest", collabMode ? "text-white/40" : "text-slate-400")}>Search Radius: {radius}km</h3>
          <input 
            type="range" 
            min="5" 
            max="100" 
            value={radius} 
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-32 accent-[#e9c46a]"
          />
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddItemOpen(true)}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all",
              collabMode ? "bg-white text-[#006d77]" : "bg-primary text-white shadow-primary/20"
            )}
          >
            <Plus className="w-4 h-4" /> {collabMode ? 'Post Service' : 'Sell Item'}
          </button>
          <button 
            onClick={() => setIsRequestItemOpen(true)}
            className={cn(
              "flex-1 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all",
              collabMode ? "bg-white/10 text-white border border-white/10" : "bg-secondary text-white shadow-secondary/20"
            )}
          >
            <MessageSquare className="w-4 h-4" /> {collabMode ? 'Request Help' : 'Request Item'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className={cn(
            "rounded-3xl overflow-hidden border transition-all group",
            collabMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 card-shadow"
          )}>
            <div className={cn("h-48 relative", collabMode ? "bg-white/5" : "bg-slate-100")}>
              <img 
                src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/300`} 
                alt="" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}/400/300`;
                }}
              />
              <div className={cn(
                "absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black",
                collabMode ? "bg-[#e9c46a] text-[#264653]" : "bg-white/90 backdrop-blur text-secondary"
              )}>
                €{item.price}
              </div>
              {item.status === 'Reserved' && (
                <div className="absolute inset-0 bg-secondary/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-white text-secondary px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest">Reserved</span>
                </div>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className={cn("font-bold text-lg", collabMode ? "text-white" : "text-secondary")}>{item.title}</h4>
                <p className={cn("text-xs flex items-center gap-1", collabMode ? "text-white/40" : "text-slate-400")}>
                  <MapPin className="w-3 h-3" /> {item.location.name}
                </p>
              </div>

              <div className="flex gap-2">
                {item.status === 'Available' ? (
                  <>
                    <button 
                      disabled={isProcessing === item.id}
                      onClick={() => handlePayment(item)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50",
                        collabMode ? "bg-[#e9c46a] text-[#264653]" : "bg-primary text-white shadow-primary/20"
                      )}
                    >
                      {isProcessing === item.id ? 'Processing...' : collabMode ? 'Hire' : 'Buy Now'}
                    </button>
                    <PremiumAction isPremium={isPremium} onPaywall={onPaywall} onClick={() => onContactSeller(item)}>
                      <button 
                        className={cn(
                          "p-2.5 rounded-xl border transition-all",
                          collabMode ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 text-slate-600 border-slate-100"
                        )}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </PremiumAction>
                    <button 
                      onClick={() => {
                        const reason = prompt("Why are you reporting this item?");
                        if (reason) {
                          useNomadStore.getState().reportContent(item.id, 'MarketItem', reason);
                          addToast("Melding verzonden.", "info");
                        }
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border transition-all hover:text-red-400",
                        collabMode ? "bg-white/5 border-white/10 text-white/40" : "bg-slate-50 text-slate-400 border-slate-100"
                      )}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </>
                ) : item.reservedBy === currentUser?.id ? (
                  <button 
                    onClick={() => cancelReservation(item.id)}
                    className="w-full bg-red-50 text-red-600 py-2.5 rounded-xl text-xs font-bold border border-red-100"
                  >
                    Cancel Reservation
                  </button>
                ) : (
                  <button disabled className={cn(
                    "w-full py-2.5 rounded-xl text-xs font-bold border transition-all",
                    collabMode ? "bg-white/5 text-white/20 border-white/10" : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    Already Reserved
                  </button>
                )}
              </div>
              <div className="flex justify-end mt-2">
                <VoteButtons type="marketplace" id={item.id} votes={item.votes} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} title="List an Item">
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          addItem({
            id: `m-${Date.now()}`,
            sellerId: currentUser?.id || '',
            sellerName: currentUser?.familyName || 'Unknown',
            title: newItem.title,
            description: newItem.description,
            price: newItem.price,
            category: newItem.category,
            imageUrl: newItem.imageUrl,
            location: { name: newItem.locationName || 'Current Location', lat: newItem.lat || 0, lng: newItem.lng || 0 },
            status: 'Available',
            createdAt: new Date().toISOString()
          });
          setIsAddItemOpen(false);
          setNewItem({ title: '', description: '', price: 0, category: 'Gear', imageUrl: '', locationName: '', lat: 0, lng: 0 });
          addToast("Item geplaatst!", "success");
        }}>
          <ImageUpload label="Item Photo" onUpload={(url) => setNewItem(prev => ({...prev, imageUrl: url}))} />
          {newItem.imageUrl && (
            <div className="w-full h-32 rounded-2xl overflow-hidden">
              <img src={newItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
            <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price (€)</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseInt(e.target.value)})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl" rows={3} value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
          </div>
          <LocationSelector 
            label="Location (Where is the item?)"
            placeholder="Search city..."
            value={newItem.locationName}
            onChange={(val, coords) => setNewItem(prev => ({ ...prev, locationName: val, lat: coords?.lat || 0, lng: coords?.lng || 0 }))}
          />
          <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold">List Item</button>
        </form>
      </Modal>

      <Modal isOpen={isRequestItemOpen} onClose={() => setIsRequestItemOpen(false)} title="Request Gear">
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          addLookingFor({
            id: `lf-${Date.now()}`,
            userId: currentUser?.id || '',
            familyName: currentUser?.familyName || '',
            location: newRequest.location || 'Current Location',
            lat: newRequest.lat || 0,
            lng: newRequest.lng || 0,
            category: 'Gear',
            title: newRequest.title,
            description: newRequest.description,
            createdAt: new Date().toISOString()
          });
          setIsRequestItemOpen(false);
          setNewRequest({ title: '', description: '', location: '', lat: 0, lng: 0 });
          addToast("Verzoek geplaatst bij de tribe!", "success");
        }}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">What do you need?</label>
            <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl" value={newRequest.title} onChange={e => setNewRequest({...newRequest, title: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Details</label>
            <textarea required rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl resize-none" value={newRequest.description} onChange={e => setNewRequest({...newRequest, description: e.target.value})} />
          </div>
          <LocationSelector 
            label="Location"
            placeholder="Where do you need help?"
            value={newRequest.location}
            onChange={(val, coords) => setNewRequest(prev => ({ ...prev, location: val, lat: coords?.lat || 0, lng: coords?.lng || 0 }))}
          />
          <button type="submit" className="w-full bg-secondary text-white py-4 rounded-2xl font-bold">Post Request</button>
        </form>
      </Modal>
    </div>
  );
};

const DealsView = ({ onBack, onPaywall }: { onBack: () => void, onPaywall: () => void }) => {
  const { spots, currentUser } = useNomadStore();
  const isPremium = currentUser?.isPremium || false;
  const [filter, setFilter] = useState('All');

  const deals = spots.filter(s => s.monthlyDeal);
  const categories = ['All', 'Accommodation', 'Co-working', 'Activities'];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl border border-slate-100 card-shadow">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Exclusive Deals</h1>
          <p className="text-slate-500 font-medium">Special offers for our verified tribe members.</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
              filter === cat ? "bg-secondary text-white border-secondary" : "bg-white text-slate-400 border-slate-100"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deals.map(spot => (
          <div key={spot.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 card-shadow flex flex-col">
            <div className="h-48 relative">
              <img 
                src={spot.imageUrl || `https://picsum.photos/seed/${spot.id}/600/400`} 
                alt="" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${spot.id}/600/400`;
                }}
              />
              <div className="absolute top-4 right-4 bg-accent text-white px-4 py-2 rounded-2xl font-black text-sm shadow-lg">
                {spot.monthlyDeal?.discount}
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-secondary">{spot.name}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{spot.monthlyDeal?.description}</p>
              </div>
              
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-bold">5 families used this</span>
                </div>
                <PremiumAction isPremium={isPremium} onPaywall={onPaywall} onClick={() => alert("Deal Claimed! Check your dashboard for details.")}>
                  <button 
                    className="bg-accent text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-accent/20 active:scale-95 transition-transform"
                  >
                    Claim Deal
                  </button>
                </PremiumAction>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TribeView = ({ onViewAllMarketplace, onSayHello, onSelectFamily, onPaywall }: { onViewAllMarketplace: () => void, onSayHello: (family: FamilyProfile, message?: string) => void, onSelectFamily: (family: FamilyProfile) => void, onPaywall: () => void }) => {
  const { currentUser, trips, profiles, lookingFor, addLookingFor, removeLookingFor, marketItems, reserveItem, connections, requestConnection, acceptConnection, cancelConnection, collabMode, setCollabMode, collabAsks, addCollabAsk, removeCollabAsk, blocks, saveVibeCheck } = useNomadStore();
  const isPremium = currentUser?.isPremium || false;
  const [isLookingForOpen, setIsLookingForOpen] = useState(false);
  const [isCollabAskOpen, setIsCollabAskOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: '', description: '', category: 'Help' as any, location: '', lat: 0, lng: 0 });
  const [newCollabAsk, setNewCollabAsk] = useState({ skillNeeded: '', description: '' });
  const [isVibeCheckOpen, setIsVibeCheckOpen] = useState(false);
  const [vibeMetrics, setVibeMetrics] = useState({ 
    kindvriendelijkheid: 5, 
    veiligheid: 5, 
    voorzieningen: 5, 
    community: 5, 
    betaalbaarheid: 5, 
    internet: 5, 
    gezondheidszorg: 5 
  });
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [tribeSearchQuery, setTribeSearchQuery] = useState('');
  const [professionalOnly, setProfessionalOnly] = useState(false);

  const getConnection = (otherId: string) => {
    return connections.find(c => 
      (c.requesterId === currentUser?.id && c.recipientId === otherId) ||
      (c.requesterId === otherId && c.recipientId === currentUser?.id)
    );
  };

  const locationMetrics = useMemo(() => {
    const metrics = [];
    if (currentUser?.currentLocation) {
      metrics.push({
        location: currentUser.currentLocation.name,
        weather: 'Local',
        emergency: '112',
        date: format(new Date(), 'EEEE, MMM do'),
        families: profiles.filter(p => 
          p.currentLocation && 
          calculateDistance(currentUser.currentLocation!.lat, currentUser.currentLocation!.lng, p.currentLocation.lat, p.currentLocation.lng) <= 50
        ).length
      });
    }
    
    const userTrips = trips.filter(t => t.familyId === currentUser?.id);
    userTrips.forEach(trip => {
      metrics.push({
        location: trip.location,
        weather: 'Upcoming',
        emergency: '112',
        date: format(parseISO(trip.startDate), 'MMM d, yyyy'),
        families: profiles.filter(p => 
          p.currentLocation?.name === trip.location || 
          trips.some(t => t.familyId === p.id && t.location === trip.location)
        ).length
      });
    });

    if (metrics.length === 0) {
      return [{ 
        location: 'Global Tribe', 
        weather: 'Varies', 
        emergency: '112', 
        date: format(new Date(), 'EEEE, MMM do'),
        families: profiles.length
      }];
    }
    return metrics;
  }, [currentUser, trips, profiles]);

  const currentMetrics = locationMetrics[activeLocationIndex] || locationMetrics[0];

  const filteredProfiles = useMemo(() => {
    if (!currentUser) return [];
    return profiles.filter(p => {
       // Filter out self
       if (p.id === currentUser.id) return false;
       // Filter out ghost mode users (unless it's us, but we already filtered self)
       if (p.privacySettings?.isIncognito) return false;
       // Filter out blocked/blocking users
       if (blocks.some(b => (b.blockerId === currentUser.id && b.blockedId === p.id) || (b.blockerId === p.id && b.blockedId === currentUser.id))) return false;
       
       // Remote Worker Global Visibility
       if (collabMode && p.collabCard?.isRemote) return true;

       // Distance filter (50km radius for families)
       if (p.currentLocation && currentUser.currentLocation) {
         const dist = calculateDistance(currentUser.currentLocation.lat, currentUser.currentLocation.lng, p.currentLocation.lat, p.currentLocation.lng);
         return dist <= 50;
       }

       return true;
    });
  }, [currentUser, profiles, blocks, collabMode]);

  // --- Collab Mode Monetization Gating ---
  const isCollabGated = collabMode && !currentUser?.isPremium && currentUser?.premiumType !== 'TRIAL' && currentUser?.premiumType !== 'ANNUAL' && currentUser?.premiumType !== 'MONTHLY' && currentUser?.premiumType !== 'LIFETIME';

  const anonymize = (name: string, isGated: boolean) => {
    if (!isGated) return name;
    return `Digital Nomad ${name.split(' ').pop() || ''}`.trim();
  };

  const anonymizePhoto = (photoUrl: string | undefined, isGated: boolean, seed: string) => {
    if (!isGated) return photoUrl || `https://picsum.photos/seed/${seed}/200/200`;
    return `https://picsum.photos/seed/${seed}/200/200?blur=10`;
  };

  const handleAddLookingFor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (containsBlockedContent(newRequest.title) || containsBlockedContent(newRequest.description)) {
      useNomadStore.getState().addToast("Your post contains inappropriate language. Please keep it family-friendly.", "error");
      return;
    }

    try {
      const request: LookingForRequest = {
        id: `lf-${Date.now()}`,
        userId: currentUser.id,
        familyName: currentUser.familyName,
        location: newRequest.location,
        lat: newRequest.lat,
        lng: newRequest.lng,
        category: newRequest.category,
        title: cleanContent(newRequest.title),
        description: cleanContent(newRequest.description),
        createdAt: new Date().toISOString()
      };
      await addLookingFor(request);
      setIsLookingForOpen(false);
      setNewRequest({ title: '', description: '', category: 'Help', location: '', lat: 0, lng: 0 });
    } catch (error) {
      console.error("Failed to add looking for request:", error);
    }
  };
  
  const handleAddCollabAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (containsBlockedContent(newCollabAsk.description)) {
      useNomadStore.getState().addToast("Your post contains inappropriate language.", "error");
      return;
    }

    try {
      const ask: CollabAsk = {
        id: `ask-${Date.now()}`,
        userId: currentUser.id,
        skillNeeded: newCollabAsk.skillNeeded,
        description: cleanContent(newCollabAsk.description),
        locationSlug: currentUser.currentLocation?.name || 'Global',
        createdAt: new Date().toISOString()
      };
      await addCollabAsk(ask);
      setIsCollabAskOpen(false);
      setNewCollabAsk({ skillNeeded: '', description: '' });
    } catch (error) {
      console.error("Failed to add collab ask:", error);
    }
  };

  const matches = useMemo(() => {
    if (!currentUser) return [];
    const userTrips = trips.filter(t => t.familyId === currentUser.id);
    const otherTrips = trips.filter(t => t.familyId !== currentUser.id);
    
    const results = [];
    for (const uTrip of userTrips) {
      for (const oTrip of otherTrips) {
        const otherProfile = filteredProfiles.find(p => p.id === oTrip.familyId);
        if (otherProfile) {
          // Collab Mode Filter
          if (collabMode && !otherProfile.openToCollabs) continue;

          const match = calculateMatchScore(currentUser, uTrip, otherProfile, oTrip, collabMode);
          if (match.score > 0) {
            results.push({
              id: `${uTrip.id}-${oTrip.id}`,
              family: otherProfile,
              trip: oTrip,
              score: match.score,
              reasons: match.reasons
            });
          }
        }
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }, [currentUser, trips, filteredProfiles, collabMode]);

  return (
    <div className={cn(
      "p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-24 md:pb-8 transition-colors duration-500 min-h-full",
      collabMode ? "bg-[#006d77] text-white" : "text-slate-900"
    )}>
      {isCollabGated ? (
        <CollabOpportunitySummary 
          onUpgrade={onPaywall} 
          stats={{
            proFamilies: profiles.filter(p => (p.openToCollabs || p.collabCard?.occupation)).length,
            collabAsks: collabAsks.length || 8
          }} 
        />
      ) : (
        <>
          {/* Collab Ask Modal */}
      <Modal isOpen={isCollabAskOpen} onClose={() => setIsCollabAskOpen(false)} title="Post a Collab Ask" dark={collabMode}>
        <form onSubmit={handleAddCollabAsk} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Skill Needed</label>
              <select 
                value={newCollabAsk.skillNeeded}
                onChange={(e) => setNewCollabAsk(prev => ({ ...prev, skillNeeded: e.target.value }))}
                className={cn(
                  "w-full rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition-all",
                  collabMode 
                    ? "bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:ring-white/20" 
                    : "bg-slate-50 border-slate-100 text-secondary placeholder:text-slate-400 focus:ring-primary/20"
                )}
                required
              >
                <option value="" className="text-secondary">Select Skill</option>
                {skillsSeed.map(skill => (
                  <option key={skill} value={skill} className="text-secondary">{skill}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Description (Max 150 chars)</label>
              <textarea 
                maxLength={150}
                value={newCollabAsk.description}
                onChange={(e) => setNewCollabAsk(prev => ({ ...prev, description: e.target.value }))}
                className={cn(
                  "w-full rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition-all h-32",
                  collabMode 
                    ? "bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:ring-white/20" 
                    : "bg-slate-50 border-slate-100 text-secondary placeholder:text-slate-400 focus:ring-primary/20"
                )}
                placeholder="I need help with... (e.g., setting up Meta Ads for my e-commerce brand)"
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-[#e9c46a] text-[#264653] py-4 rounded-3xl font-black text-sm shadow-xl shadow-black/20 active:scale-[0.98] transition-all">
            Post Locally
          </button>
        </form>
      </Modal>

      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className={cn("text-3xl font-black tracking-tight", collabMode ? "text-white" : "text-secondary")}>
            {collabMode ? 'Collab Focus' : 'Your Tribe'}
          </h1>
          <p className={cn("font-medium", collabMode ? "text-white/60" : "text-slate-500")}>Families nearby and on your future route.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {filteredProfiles.slice(0, 3).map(p => (
              <div key={p.id} className={cn("w-10 h-10 rounded-full border-2 bg-slate-200 overflow-hidden", collabMode ? "border-[#006d77]" : "border-white")}>
                <img 
                  src={p.photoUrl || `https://picsum.photos/seed/${p.id}/100/100`} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${p.id}/100/100`;
                  }}
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[10px] font-bold text-white">
              +{filteredProfiles.length > 3 ? filteredProfiles.length - 3 : 0}
            </div>
          </div>
        </div>
      </header>

      {collabMode && (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Collab Match Center</h2>
            {!collabAsks.some(a => a.userId === currentUser?.id) && (
              <button 
                onClick={() => setIsCollabAskOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Plus className="w-3 h-3" />
                Post New Ask
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* My Active Ask */}
            <div className="bg-white/10 border border-white/10 rounded-[2rem] p-6 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Tag className="w-16 h-16" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">My Active Ask</p>
              {collabAsks.find(a => a.userId === currentUser?.id) ? (
                <div className="space-y-4">
                  <div>
                    <span className="bg-[#e9c46a] text-[#264653] px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      Looking For: {collabAsks.find(a => a.userId === currentUser?.id)?.skillNeeded}
                    </span>
                    <p className="mt-3 text-sm font-medium leading-relaxed italic">
                      "{collabAsks.find(a => a.userId === currentUser?.id)?.description}"
                    </p>
                  </div>
                  <button 
                    onClick={() => removeCollabAsk(collabAsks.find(a => a.userId === currentUser?.id)!.id)}
                    className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Delete & Post New
                  </button>
                </div>
              ) : (
                <div className="py-4 text-center space-y-4">
                  <p className="text-sm text-white/60">What do you need help with in this location?</p>
                  <button 
                    onClick={() => setIsCollabAskOpen(true)}
                    className="bg-white text-[#006d77] px-6 py-2 rounded-xl font-bold text-xs"
                  >
                    Post 1st Ask
                  </button>
                </div>
              )}
            </div>

            {/* Local Collabs Feed */}
            <div className="md:col-span-1 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Local Collabs</p>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {collabAsks
                  .filter(a => a.userId !== currentUser?.id && a.locationSlug === currentUser?.currentLocation?.name)
                  .map(ask => {
                    const family = profiles.find(p => p.id === ask.userId);
                    const hasMySkill = currentUser?.collabCard?.superpowers.includes(ask.skillNeeded);
                    
                    if (!family) return null;

                    return (
                      <div key={ask.id} className={cn(
                        "p-4 rounded-2xl border transition-all",
                        hasMySkill ? "bg-white text-[#006d77] border-white shadow-xl scale-[1.02]" : "bg-white/5 border-white/10"
                      )}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <img src={family.photoUrl} className="w-8 h-8 rounded-xl object-cover" alt="" />
                            <div>
                              <p className="text-sm font-bold">{family.familyName}</p>
                              <p className={cn("text-[9px] font-bold uppercase", hasMySkill ? "text-[#006d77]/60" : "text-white/40")}>{ask.skillNeeded}</p>
                            </div>
                          </div>
                          {hasMySkill && (
                            <div className="bg-[#e9c46a] text-[#264653] px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">
                              Perfect Match
                            </div>
                          )}
                        </div>
                        <p className={cn("text-xs leading-relaxed line-clamp-2 italic", hasMySkill ? "text-[#006d77]" : "text-white/80")}>
                          "{ask.description}"
                        </p>
                        <PremiumAction
                          isPremium={isPremium}
                          onPaywall={onPaywall}
                          onClick={() => onSayHello(family, `Hey ${family.familyName.split(' ')[0]}, I saw your Collab Ask about ${ask.skillNeeded}. I'm an expert in that! Want to grab a coffee here in ${currentUser?.currentLocation?.name}?`)}
                        >
                          <button 
                            className={cn(
                              "w-full mt-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              hasMySkill ? "bg-[#006d77] text-white" : "bg-white/10 text-white hover:bg-white/20"
                            )}
                          >
                            Schedule Coffee
                          </button>
                        </PremiumAction>
                      </div>
                    );
                  })}
                {collabAsks.filter(a => a.userId !== currentUser?.id && a.locationSlug === currentUser?.currentLocation?.name).length === 0 && (
                  <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/5">
                    <Coffee className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-white/40">No other asks in this city yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Location Metrics Slider */}
      <section className="relative group">
        <div className={cn(
          "p-6 rounded-[2.5rem] border flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden transition-colors",
          collabMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-100 card-shadow"
        )}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeLocationIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col md:flex-row items-center gap-8 w-full"
            >
              <div className="flex-1 space-y-1 text-center md:text-left">
                <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", collabMode ? "text-white/40" : "text-primary")}>Current Location</p>
                <h2 className={cn("text-2xl font-black", collabMode ? "text-white" : "text-secondary")}>{currentMetrics.location}</h2>
                <p className={cn("text-xs font-bold", collabMode ? "text-white/40" : "text-slate-400")}>{currentMetrics.date}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-8 flex-1">
                <div className="text-center">
                  <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", collabMode ? "text-white/20" : "text-slate-300")}>Weather</p>
                  <p className="text-sm font-bold">{currentMetrics.weather}</p>
                </div>
                <div className="text-center">
                  <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", collabMode ? "text-white/20" : "text-slate-300")}>Emergency</p>
                  <p className="text-sm font-bold text-red-500">{currentMetrics.emergency}</p>
                </div>
                <div className="text-center">
                  <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", collabMode ? "text-white/20" : "text-slate-300")}>Tribe</p>
                  <p className="text-sm font-bold">{currentMetrics.families} Families</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-2">
            <button 
              onClick={() => setActiveLocationIndex(prev => (prev === 0 ? locationMetrics.length - 1 : prev - 1))}
              className={cn("p-3 rounded-2xl transition-colors", collabMode ? "bg-white/10 hover:bg-white/20" : "bg-slate-50 hover:bg-slate-100")}
            >
              <ChevronLeft className={cn("w-5 h-5", collabMode ? "text-white" : "text-secondary")} />
            </button>
            <button 
              onClick={() => setActiveLocationIndex(prev => (prev === locationMetrics.length - 1 ? 0 : prev + 1))}
              className={cn("p-3 rounded-2xl transition-colors", collabMode ? "bg-white/10 hover:bg-white/20" : "bg-slate-50 hover:bg-slate-100")}
            >
              <ChevronRight className={cn("w-5 h-5", collabMode ? "text-white" : "text-secondary")} />
            </button>
          </div>
        </div>
      </section>
         {/* Pending Connection Requests Visibility fix */}
      {(() => {
        const pendingConnections = connections.filter(c => c.recipientId === currentUser?.id && c.status === 'pending');
        const nearbyHelpRequests = lookingFor.filter(r => r.userId !== currentUser?.id && currentUser?.currentLocation?.name && r.location === currentUser?.currentLocation?.name);
        
        if (pendingConnections.length === 0 && nearbyHelpRequests.length === 0) return null;

        return (
          <section className="space-y-4">
            <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", collabMode ? "text-white/40" : "text-slate-400")}>
              New Requests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingConnections.map(conn => {
                  const requester = profiles.find(p => p.id === conn.requesterId);
                  if (!requester) return null;
                  return (
                     <div key={conn.id} className={cn(
                       "p-4 rounded-[2rem] border flex items-center justify-between gap-4",
                       collabMode ? "bg-white/5 border-white/10" : "bg-primary/5 border-primary/10 shadow-sm"
                     )}>
                       <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                           <img src={requester.photoUrl || `https://picsum.photos/seed/${requester.id}/200/200`} alt="" className="w-full h-full object-cover" />
                         </div>
                         <div>
                           <p className={cn("font-bold", collabMode ? "text-white" : "text-secondary")}>{requester.familyName}</p>
                           <p className={cn("text-[10px] font-black uppercase tracking-widest", collabMode ? "text-white/40" : "text-primary")}>Wil connecten</p>
                         </div>
                       </div>
                       <div className="flex gap-4">
                         <button 
                           onClick={() => acceptConnection(conn.id)}
                           className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                         >
                           Accepteer
                         </button>
                         <button 
                           onClick={() => cancelConnection(conn.id)}
                           className={cn("p-2 rounded-xl border transition-all text-slate-400 hover:text-red-500 hover:border-red-500/20", collabMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100")}
                         >
                            <X className="w-5 h-5" />
                         </button>
                       </div>
                     </div>
                  );
                })}

                {nearbyHelpRequests.map(req => {
                  const requester = profiles.find(p => p.id === req.userId);
                  return (
                    <div key={req.id} className={cn(
                      "p-4 rounded-[2rem] border flex items-center justify-between gap-4",
                      collabMode ? "bg-white/5 border-white/10" : "bg-accent/5 border-accent/10 shadow-sm"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center bg-slate-100 shrink-0">
                          {requester?.photoUrl ? (
                            <img src={requester.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : <User className="w-6 h-6 text-slate-400" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className={cn("font-bold truncate", collabMode ? "text-white" : "text-secondary")}>{req.title}</p>
                          <p className={cn("text-[10px] font-black uppercase tracking-widest", collabMode ? "text-white/40" : "text-accent")}>{req.category} verzoek van {req.familyName}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const itemFamily = profiles.find(p => p.id === req.userId);
                          if (itemFamily) onSayHello(itemFamily, `Hoi ${itemFamily.familyName}, ik zag je verzoek voor '${req.title}' en wil graag helpen!`);
                        }}
                        className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                      >
                        Help {collabMode ? 'Collab' : 'Tribe'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </section>
        );
      })()}
      
      {/* Matches & Overlaps */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", collabMode ? "text-white/40" : "text-slate-400")}>Matches & Overlaps</h2>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={cn("relative flex-1 md:w-64", collabMode ? "text-white/40" : "text-slate-400")}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" />
              <input 
                type="text"
                placeholder={collabMode ? "Search skill or role..." : "Search interests..."}
                value={tribeSearchQuery}
                onChange={(e) => setTribeSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-3 rounded-2xl text-xs font-bold transition-all outline-none",
                  collabMode 
                    ? "bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:bg-white/10" 
                    : "bg-white border border-slate-100 text-secondary card-shadow focus:border-primary/20"
                )}
              />
            </div>

            {collabMode && (
              <button 
                onClick={() => setProfessionalOnly(!professionalOnly)}
                className={cn(
                  "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                  professionalOnly
                    ? "bg-amber-400 border-amber-400 text-[#264653]"
                    : "bg-white/5 border-white/10 text-white/60"
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Pro Only</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches
            .filter(match => {
              if (professionalOnly && !match.family.collabCard?.occupation) return false;
              if (tribeSearchQuery) {
                const query = tribeSearchQuery.toLowerCase();
                const interests = [
                  ...match.family.parents.flatMap(p => p.interests),
                  ...match.family.kids.flatMap(k => k.interests)
                ].join(' ').toLowerCase();
                const bio = match.family.bio.toLowerCase();
                const familyName = match.family.familyName.toLowerCase();
                const occupation = match.family.collabCard?.occupation.toLowerCase() || '';
                const mission = match.family.collabCard?.currentMission.toLowerCase() || '';
                const superpowers = match.family.collabCard?.superpowers.join(' ').toLowerCase() || '';

                return interests.includes(query) || bio.includes(query) || familyName.includes(query) || occupation.includes(query) || mission.includes(query) || superpowers.includes(query);
              }
              return true;
            })
            .map((match) => {
            const connection = getConnection(match.family.id);
            const isConnected = connection?.status === 'accepted';
            const isReceived = connection?.status === 'pending' && connection.recipientId === currentUser?.id;
            const isSent = connection?.status === 'pending' && connection.requesterId === currentUser?.id;
            
            return (
              <motion.div 
                key={match.id}
                whileHover={{ y: -4 }}
                className={cn(
                  "rounded-[2rem] p-6 border flex flex-col transition-colors",
                  collabMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-100 card-shadow"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className={cn("w-16 h-16 rounded-2xl overflow-hidden border-2", collabMode ? "bg-white/10 border-white/10" : "bg-slate-100 border-slate-50")}>
                      <img 
                        src={anonymizePhoto(match.family.photoUrl, isCollabGated, match.family.id)} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${match.family.id}/200/200?blur=10`;
                        }}
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <h3 className={cn("font-bold text-xl", collabMode ? "text-white" : "text-secondary")}>
                        {anonymize(match.family.familyName, isCollabGated)}
                      </h3>
                      {collabMode ? (
                        <div className="flex items-center text-xs text-white/60 font-black uppercase tracking-widest mt-0.5">
                          <Briefcase className="w-3 h-3 mr-1.5 text-white/40" />
                          {match.family.collabCard?.occupation || 'Digital Nomad'}
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-slate-500 font-medium">
                          <MapPin className="w-3 h-3 mr-1 text-primary" />
                          {isConnected ? match.trip.location : `${match.trip.location} in ${format(parseISO(match.trip.startDate), 'MMMM')}`}
                        </div>
                      )}
                      {isConnected && !collabMode && (
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">
                          {format(parseISO(match.trip.startDate), 'MMM d')} - {format(parseISO(match.trip.endDate), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-xs font-black", collabMode ? "bg-white/20 text-white" : "bg-accent/10 text-accent")}>
                    {match.score}% Match
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold", collabMode ? "bg-white/10 text-white/80" : "bg-primary/10 text-primary")}>
                    {match.family.nativeLanguage}
                  </span>
                  {(collabMode ? match.family.collabCard?.superpowers || [] : Array.from(new Set([
                    ...match.family.parents.flatMap(p => p.interests),
                    ...match.family.kids.flatMap(k => k.interests)
                  ]))).slice(0, 4).map((tag, i) => (
                    <span key={i} className={cn("text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1", collabMode ? "bg-[#e9c46a]/10 text-[#e9c46a]" : "bg-slate-100 text-slate-600")}>
                      {collabMode && <Award className="w-2 h-2" />}
                      {tag}
                    </span>
                  ))}
                </div>

                <div className={cn("mt-auto flex items-center justify-between pt-4 border-t", collabMode ? "border-white/10" : "border-slate-50")}>
                  <div className="flex -space-x-2">
                    {match.family.kids.map((kid, i) => (
                      <div key={i} className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black", collabMode ? "bg-white/10 border-white/10 text-white" : "bg-white border-slate-100 text-primary")}>
                        {kid.age}
                      </div>
                    ))}
                  </div>
                  {isConnected ? (
                    <PremiumAction isPremium={isPremium} onPaywall={onPaywall} onClick={() => onSayHello(match.family)}>
                      <button 
                        className={cn("px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-transform", collabMode ? "bg-white text-[#006d77]" : "bg-primary text-white shadow-primary/20")}
                      >
                        Chat
                      </button>
                    </PremiumAction>
                  ) : isReceived ? (
                    <button 
                      onClick={() => acceptConnection(connection.id)}
                      className={cn("px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-transform", collabMode ? "bg-white text-[#006d77]" : "bg-primary text-white shadow-primary/20")}
                    >
                      Accept
                    </button>
                  ) : isSent ? (
                    <button 
                      onClick={() => cancelConnection(connection.id)}
                      className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-colors group", collabMode ? "bg-white/10 text-white/40 hover:bg-red-500/20 hover:text-red-400" : "bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500")}
                    >
                      <span className="group-hover:hidden">Pending...</span>
                      <span className="hidden group-hover:inline">Cancel Request</span>
                    </button>
                  ) : (
                    <PremiumAction isPremium={isPremium} onPaywall={onPaywall} onClick={() => requestConnection(match.family.id)}>
                      <button 
                        className={cn("px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-transform", collabMode ? "bg-white text-[#006d77]" : "bg-secondary text-white shadow-secondary/20")}
                      >
                        {collabMode ? 'Coffee & Collab?' : 'Connect'}
                      </button>
                    </PremiumAction>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Nearby Tribe */}
      <section className="space-y-4">
        <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", collabMode ? "text-white/40" : "text-slate-400")}>Neighborhood</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {profiles.filter(p => p.id !== currentUser?.id && (!collabMode || p.openToCollabs)).map(p => (
            <motion.div 
              key={p.id}
              className={cn(
                "flex-shrink-0 w-48 rounded-3xl p-4 border text-center transition-colors",
                collabMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-100 card-shadow"
              )}
            >
              <div className={cn("w-20 h-20 rounded-full mx-auto mb-3 border-4 overflow-hidden", collabMode ? "border-white/10" : "border-slate-50")}>
                <img 
                  src={anonymizePhoto(p.photoUrl, isCollabGated, p.id)} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${p.id}/200/200?blur=10`;
                  }}
                />
              </div>
              <h4 className={cn("font-bold truncate flex items-center justify-center gap-1", collabMode ? "text-white" : "text-secondary")}>
                {anonymize(p.familyName, isCollabGated)}
                {p.role === 'SuperAdmin' && !isCollabGated && <Shield className={cn("w-3 h-3 fill-current", collabMode ? "text-white" : "text-secondary")} />}
              </h4>
              
              {collabMode ? (
                <div className="mt-1">
                  <p className={cn("text-[10px] font-black uppercase tracking-widest truncate px-2", collabMode ? "text-white/80" : "text-primary")}>
                    {p.collabCard?.occupation || 'Digital Nomad'}
                  </p>
                  <p className={cn("text-[8px] font-bold uppercase mt-0.5", collabMode ? "text-white/40" : "text-slate-400")}>Open to Collabs</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center gap-1 mt-1">
                    {(p.badges || []).slice(0, 2).map((badge, i) => (
                      <Badge key={i} name={badge} />
                    ))}
                  </div>
                  <p className={cn("text-[10px] font-bold uppercase mt-1", collabMode ? "text-white/40" : "text-slate-400")}>{p.nativeLanguage} • {p.kids.length} Kids</p>
                </>
              )}
              {collabMode && p.collabCard && p.collabCard.occupation && (
                <div className="mt-3 p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-[#e9c46a] uppercase truncate pr-2">{p.collabCard.occupation}</p>
                    <Briefcase className="w-3 h-3 text-white/20" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.collabCard.superpowers.slice(0, 2).map(s => (
                      <span key={s} className="text-[8px] font-bold px-1.5 py-0.5 bg-white/10 rounded-md text-white/60">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <button 
                  onClick={() => onSelectFamily(p)}
                  className={cn(
                    "w-full py-2 rounded-xl text-xs font-bold transition-colors",
                    collabMode ? "bg-white/10 text-white/80 hover:bg-white/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  View Profile
                </button>
                {(() => {
                  const conn = getConnection(p.id);
                  const isReceived = conn?.status === 'pending' && conn.recipientId === currentUser?.id;
                  const isSent = conn?.status === 'pending' && conn.requesterId === currentUser?.id;

                  if (conn?.status === 'accepted') {
                    return (
                      <PremiumAction isPremium={isPremium} onPaywall={onPaywall} onClick={() => onSayHello(p)}>
                        <button 
                          className={cn(
                            "w-full py-2 rounded-xl text-xs font-bold shadow-lg transition-all",
                            collabMode ? "bg-white text-[#006d77]" : "bg-primary text-white shadow-primary/20"
                          )}
                        >
                          Chat
                        </button>
                      </PremiumAction>
                    );
                  }
                  if (isReceived) {
                    return (
                      <button 
                        onClick={() => acceptConnection(conn.id)}
                        className="w-full py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20"
                      >
                        Accept
                      </button>
                    );
                  }
                  if (isSent) {
                    return (
                      <button 
                        onClick={() => cancelConnection(conn.id)}
                        className="w-full py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-colors group"
                      >
                        <span className="group-hover:hidden">Pending...</span>
                        <span className="hidden group-hover:inline">Cancel Request</span>
                      </button>
                    );
                  }
                  return (
                    <PremiumAction isPremium={isPremium} onPaywall={onPaywall} onClick={() => requestConnection(p.id)}>
                      <button 
                        className="w-full py-2 bg-secondary text-white rounded-xl text-xs font-bold shadow-lg shadow-secondary/20"
                      >
                        {collabMode ? 'Collab?' : 'Connect'}
                      </button>
                    </PremiumAction>
                  );
                })()}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Looking For Modal */}
      <Modal isOpen={isLookingForOpen} onClose={() => setIsLookingForOpen(false)} title="What are you looking for?">
        <form onSubmit={handleAddLookingFor} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {['Help', 'Playdate', 'Gear', 'Advice'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewRequest({...newRequest, category: cat as any})}
                  className={cn(
                    "py-2 rounded-xl text-sm font-bold border transition-all",
                    newRequest.category === cat ? "bg-secondary text-white border-secondary" : "bg-slate-50 text-slate-500 border-slate-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
            <input 
              required
              type="text" 
              placeholder="Short summary..." 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={newRequest.title}
              onChange={e => setNewRequest({...newRequest, title: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea 
              required
              rows={3}
              placeholder="Tell the tribe more..." 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              value={newRequest.description}
              onChange={e => setNewRequest({...newRequest, description: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
            <input 
              required
              type="text" 
              placeholder="Current city..." 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={newRequest.location}
              onChange={e => setNewRequest({...newRequest, location: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            Post Request
          </button>
        </form>
      </Modal>
      <VibeCheckModal 
        isOpen={isVibeCheckOpen} 
        onClose={() => setIsVibeCheckOpen(false)} 
        onSave={(metrics) => saveVibeCheck(metrics)} 
      />

    </>
  )}
</div>
  );
};

const CollabOpportunitySummary = ({ onUpgrade, stats }: { onUpgrade: () => void, stats: { proFamilies: number, collabAsks: number } }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white space-y-8">
      <div className="relative">
        <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10 border-4 border-white rotate-3">
          <Briefcase className="w-12 h-12" />
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce">
          <Zap className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-black text-secondary tracking-tight uppercase">Unlock Your Pro Network</h2>
        <p className="text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
          In your current neighborhood, there are professional opportunities waiting for you.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-1">
          <p className="text-2xl font-black text-secondary">{stats.proFamilies}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomad Pros</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-1">
          <p className="text-2xl font-black text-secondary">{stats.collabAsks}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Asks</p>
        </div>
      </div>

      <div className="w-full max-w-sm p-6 bg-[#006d77]/5 rounded-[2.5rem] border border-[#006d77]/10 space-y-4">
        <div className="flex -space-x-3 justify-center">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden blur-[2px]">
              <img src={`https://picsum.photos/seed/pro-${i}/100/100`} alt="" />
            </div>
          ))}
          <div className="w-10 h-10 rounded-full border-2 border-white bg-amber-400 flex items-center justify-center text-[#264653] text-[10px] font-black">
            +12
          </div>
        </div>
        <p className="text-[10px] font-black text-[#006d77] uppercase tracking-widest">Connect with verified professionals</p>
      </div>

      <button 
        onClick={onUpgrade}
        className="w-full max-w-sm bg-accent text-white py-6 rounded-[2rem] font-black shadow-2xl shadow-accent/40 flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <ShieldCheck className="w-6 h-6" />
        Unlock Tribe PRO
      </button>

      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Starting from €19/mo</p>
    </div>
  );
};

const ConnectView = ({ onPaywall, onSayHello }: { onPaywall: () => void, onSayHello: (family: FamilyProfile, msg: string) => void }) => {
  const { currentUser, profiles, conversations, messages, sendMessage, subscribeToMessages, connections, acceptConnection, cancelConnection, addToast, trips, collabMode, notifications, markNotificationRead, lookingFor } = useNomadStore();
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [activePortalTab, setActivePortalTab] = useState<'chat' | 'notifications'>('chat');
  const [messageText, setMessageText] = useState('');
  const [localCollabTab, setLocalCollabTab] = useState<'tribe' | 'collab'>(collabMode ? 'collab' : 'tribe');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const prevPendingCount = React.useRef(0);

  useEffect(() => {
    const pendingCount = connections.filter(c => c.recipientId === currentUser?.id && c.status === 'pending').length;
    if (pendingCount > prevPendingCount.current) {
      const latest = connections.filter(c => c.recipientId === currentUser?.id && c.status === 'pending').sort((a, b) => b.id.localeCompare(a.id))[0];
      const requester = profiles.find(p => p.id === latest?.requesterId);
      if (requester) {
        addToast(`${requester.familyName} wil met je connecten! Klik op de chat om te accepteren.`, "info");
      }
    }
    prevPendingCount.current = pendingCount;
  }, [connections.length, currentUser?.id, profiles, addToast]);

  useEffect(() => {
    if (activeConvoId) {
      const unsubscribe = subscribeToMessages(activeConvoId);
      return () => unsubscribe();
    }
  }, [activeConvoId, subscribeToMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages[activeConvoId || '']]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvoId || !messageText.trim()) return;
    sendMessage(activeConvoId, messageText);
    setMessageText('');
  };

  const activeConvo = conversations.find(c => c.id === activeConvoId);
  const connection = connections.find(c => c.id === activeConvo?.connectionId);

  // --- Monetization Gating --- 
  if (collabMode && !currentUser?.isPremium && currentUser?.premiumType !== 'TRIAL') {
    const proProfiles = profiles.filter(p => (p.openToCollabs || p.collabCard)).length;
    const stats = {
      proFamilies: Math.max(8, proProfiles),
      collabAsks: Math.max(5, profiles.length / 4 >> 0)
    };
    return <CollabOpportunitySummary onUpgrade={onPaywall} stats={stats} />;
  }

  const otherParticipantId = connection?.requesterId === currentUser?.id ? connection?.recipientId : connection?.requesterId;
  const otherParticipant = profiles.find(p => p.id === otherParticipantId);

  const pendingConnections = connections.filter(c => c.recipientId === currentUser?.id && c.status === 'pending');
  const sentRequests = connections.filter(c => c.requesterId === currentUser?.id && c.status === 'pending');

  const filteredConversations = conversations.filter(convo => {
    const conn = connections.find(c => c.id === convo.connectionId);
    const otherId = conn?.requesterId === currentUser?.id ? conn?.recipientId : conn?.requesterId;
    const other = profiles.find(p => p.id === otherId);
    return other?.familyName.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());

  return (
    <div className="h-full relative overflow-hidden flex flex-col bg-slate-50">
      <AnimatePresence initial={false}>
        {!activeConvoId ?
           <motion.div 
            key="list"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="h-full flex flex-col"
          >
            {/* WhatsApp Header for List */}
            <div className={cn(
              "p-4 text-white space-y-4 shadow-lg",
              collabMode ? "bg-[#004d55] shadow-white/5" : "bg-primary shadow-primary/20"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden">
                    <img 
                      src={currentUser?.photoUrl || `https://picsum.photos/seed/${currentUser?.id}/100/100`} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight leading-none">{collabMode ? 'Collab Chat' : 'Connect'}</h1>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-[10px] font-bold text-white/60 tracking-widest uppercase">Tribe Online</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text" 
                  placeholder={collabMode ? "Zoek professionals..." : "Zoek Tribe members..."} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/10 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all"
                />
              </div>

              <div className="flex border-b border-white/10 mt-2">
                <button 
                  onClick={() => setActivePortalTab('chat')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                    activePortalTab === 'chat' ? "text-white" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Chat
                  {activePortalTab === 'chat' && (
                    <motion.div layoutId="portalTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                  )}
                </button>
                <button 
                  onClick={() => setActivePortalTab('notifications')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                    activePortalTab === 'notifications' ? "text-white" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Notifications
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="ml-1 w-2 h-2 bg-accent rounded-full inline-block" />
                  )}
                  {activePortalTab === 'notifications' && (
                    <motion.div layoutId="portalTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-20 font-sans">
              {activePortalTab === 'notifications' ?
                <div className="p-4 space-y-4">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 opacity-40">
                      <BellOff className="w-12 h-12 mb-3" />
                      <p className="text-xs font-bold uppercase tracking-widest">No notifications</p>
                    </div>
                  ) : notifications.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markNotificationRead(n.id)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer relative",
                        n.isRead ? "bg-white border-slate-100 opacity-60" : "bg-white border-primary/20 shadow-sm shadow-primary/5"
                      )}
                    >
                      {!n.isRead && <div className="absolute top-4 right-4 w-2 h-2 bg-accent rounded-full" />}
                      <div className="flex gap-3">
                         <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", n.type === 'VibeCheck' ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary")}>
                           {n.type === 'VibeCheck' ? <MapIcon className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-secondary">{n.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">
                               {format(new Date(n.createdAt), 'MMM d, HH:mm')}
                            </p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              : 
                <>
                  {(() => {
                    const pending = connections.filter(c => c.recipientId === currentUser?.id && c.status === 'pending');
                    const nearbyLooking = lookingFor.filter(r => r.userId !== currentUser?.id && currentUser?.currentLocation?.name && r.location === currentUser?.currentLocation?.name);
                    
                    if (pending.length === 0 && nearbyLooking.length === 0) return null;

                    return (
                      <div className="p-4 space-y-3">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">New Requests</h2>
                        
                        {pending.map(conn => {
                          const family = profiles.find(p => p.id === conn.requesterId);
                          if (!family) return null;
                          return (
                            <div key={conn.id} className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                  <img src={family.photoUrl || `https://picsum.photos/seed/${family.id}/100/100`} alt="" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-secondary">{family.familyName}</p>
                                  <p className="text-[10px] text-primary font-black uppercase">Connect Verzoek</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => cancelConnection(conn.id)}
                                  className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors rounded-xl"
                                  title="Weigeren"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => acceptConnection(conn.id)}
                                  className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                  Accepteer
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {nearbyLooking.map(req => {
                          const family = profiles.find(p => p.id === req.userId);
                          return (
                            <div key={req.id} className="bg-accent/5 p-4 rounded-2xl border border-accent/10 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                  {family?.photoUrl ? (
                                    <img src={family.photoUrl} alt="" className="w-full h-full object-cover" />
                                  ) : <User className="w-5 h-5 text-slate-300" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-secondary truncate">{req.title}</p>
                                  <p className="text-[10px] text-accent font-black uppercase truncate">{req.category} verzoek</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                   if (family) onSayHello(family, `Hoi ${family.familyName}, ik zag je verzoek voor '${req.title}' en wil graag helpen!`);
                                }}
                                className="bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-transform shrink-0"
                              >
                                Help
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {sentRequests.length > 0 && (
                    <div className="p-4 space-y-3">
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Sent Requests</h2>
                      {sentRequests.map(conn => {
                        const family = profiles.find(p => p.id === conn.recipientId);
                        if (!family) return null;
                        return (
                          <div key={conn.id} className="p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 bg-white opacity-80">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden opacity-50">
                                <img src={family.photoUrl || `https://picsum.photos/seed/${family.id}/100/100`} alt="" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-secondary">{family.familyName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Waiting for acceptance...</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => cancelConnection(conn.id)}
                              className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="divide-y divide-slate-50">
                {filteredConversations.length === 0 && pendingConnections.length === 0 && sentRequests.length === 0 ? (
                  <div className="p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Nog geen gesprekken of verzoeken. Maak contact met families!</p>
                  </div>
                ) : filteredConversations.map((convo) => {
                  const conn = connections.find(c => c.id === convo.connectionId);
                  const otherId = conn?.requesterId === currentUser?.id ? conn?.recipientId : conn?.requesterId;
                  const other = profiles.find(p => p.id === otherId);
                  
                  // Mock unread for visual flair (every 3rd convo if last message isn't from us)
                  const hasUnread = conversations.indexOf(convo) % 3 === 0;

                  return (
                    <button 
                      key={convo.id}
                      onClick={() => setActiveConvoId(convo.id)}
                      className="w-full p-4 bg-white hover:bg-slate-50 flex items-center gap-4 transition-colors text-left border-b border-slate-50 relative"
                    >
                      <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 relative">
                        <img 
                          src={other?.photoUrl || `https://picsum.photos/seed/${otherId}/200/200`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-secondary truncate">{other?.familyName || 'Tribe Member'}</h4>
                          <span className={cn(
                            "text-[10px] font-bold uppercase whitespace-nowrap",
                            hasUnread ? "text-primary" : "text-slate-400"
                          )}>
                            {convo.lastMessageAt ? new Date(convo.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className={cn(
                            "text-sm truncate leading-tight flex-1",
                            hasUnread ? "text-secondary font-bold" : "text-slate-500"
                          )}>
                            {convo.lastMessageSnippet || 'Start een gesprek...'}
                          </p>
                          {hasUnread && (
                            <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-primary/20">
                              2
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          }
        </div>
      </motion.div>
        : 
          <motion.div 
            key="chat"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <header className="p-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveConvoId(null)} 
                  className="p-2 hover:bg-slate-50 rounded-full text-slate-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                  <img 
                    src={otherParticipant?.photoUrl || `https://picsum.photos/seed/${otherParticipantId}/100/100`} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-secondary truncate">{otherParticipant?.familyName || 'Tribe Member'}</h3>
                  <p className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                  <Plus className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#e5ddd5]/30">
              {/* WhatsApp background pattern feel */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              
              {/* Shared Journey Info - WhatsApp context style */}
              <div className="mx-auto max-w-[90%] mb-8">
                <SharedJourneyTimeline 
                  userTrips={trips.filter(t => t.familyId === currentUser?.id)} 
                  otherTrips={trips.filter(t => t.familyId === otherParticipant.id)} 
                />
              </div>

              {messages[activeConvoId]?.map((msg, i) => {
                const isMine = msg.senderId === currentUser?.id;
                return (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "group flex flex-col max-w-[85%] relative",
                      isMine ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div 
                      className={cn(
                        "p-3 px-4 rounded-2xl text-sm font-medium shadow-sm relative",
                        isMine 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-white text-secondary rounded-tl-none border border-slate-100"
                      )}
                    >
                      {msg.content}
                      <div className={cn(
                        "text-[9px] mt-1 flex items-center justify-end gap-1 font-bold",
                        isMine ? "text-white/70" : "text-slate-400"
                      )}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMine && <CheckCircle2 className="w-3 h-3 text-white/50" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 sticky bottom-0 z-30">
              <div className="flex-1 flex items-center bg-slate-50 rounded-[2rem] border border-slate-100 px-3 py-1">
                <button type="button" className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Type een bericht..."
                  className="flex-1 bg-transparent border-none py-3 text-sm focus:outline-none focus:ring-0 outline-none"
                />
                <button type="button" className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                  <Star className="w-5 h-5" />
                </button>
              </div>
              <button 
                type="submit" 
                disabled={!messageText.trim()}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 flex-shrink-0",
                  messageText.trim() ? "bg-primary text-white shadow-primary/30" : "bg-slate-200 text-slate-400"
                )}
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </motion.div>
        }
      </AnimatePresence>
    </div>
  );
};

const TribeNearbyView = ({ 
  onPaywall, 
  onViewAllDeals, 
  onRecommendSpot, 
  onViewAllMarketplace, 
  onContactSeller, 
  onSetLocation,
  onSelectFamily,
  onSelectSpot,
  onSelectItem
}: { 
  onPaywall: () => void, 
  onViewAllDeals: () => void, 
  onRecommendSpot: () => void, 
  onViewAllMarketplace: () => void, 
  onContactSeller: (item: MarketItem) => void, 
  onSetLocation: () => void,
  onSelectFamily?: (family: FamilyProfile) => void,
  onSelectSpot?: (spot: Spot) => void,
  onSelectItem?: (item: MarketItem) => void
}) => {
  const { spots, destinations, currentUser, trips, marketItems, lookingFor, addLookingFor, removeLookingFor, removeMarketItem, removeSpot, reserveItem, reviews, profiles, collabMode, blocks } = useNomadStore();
  const isPremium = currentUser?.isPremium || false;
  const [isLookingForOpen, setIsLookingForOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: '', description: '', category: 'Help' as any, location: '', lat: 0, lng: 0 });
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);

  useEffect(() => {
    if (collabMode) {
      setNewRequest(prev => ({ ...prev, category: 'Work' }));
    } else {
      setNewRequest(prev => ({ ...prev, category: 'Help' }));
    }
  }, [collabMode]);

  const handleAddLookingFor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (containsBlockedContent(newRequest.title) || containsBlockedContent(newRequest.description)) {
      useNomadStore.getState().addToast("Your post contains inappropriate language. Please keep it family-friendly.", "error");
      return;
    }

    try {
      const request: LookingForRequest = {
        id: `lf-${Date.now()}`,
        userId: currentUser.id,
        familyName: currentUser.familyName,
        location: newRequest.location,
        lat: newRequest.lat,
        lng: newRequest.lng,
        category: newRequest.category,
        title: cleanContent(newRequest.title),
        description: cleanContent(newRequest.description),
        createdAt: new Date().toISOString()
      };
      await addLookingFor(request);
      setIsLookingForOpen(false);
      setNewRequest({ title: '', description: '', category: 'Help', location: '', lat: 0, lng: 0 });
    } catch (error) {
      console.error("Failed to add looking for request:", error);
    }
  };

  const locations = useMemo(() => {
    const locs: { name: string; type: 'current' | 'planned' | 'default'; lat: number; lng: number }[] = [];
    
    // 1. Current Location (Highest Priority)
    if (currentUser?.currentLocation?.name) {
      locs.push({ 
        name: currentUser.currentLocation.name, 
        type: 'current',
        lat: currentUser.currentLocation.lat,
        lng: currentUser.currentLocation.lng
      });
    }
    
    // 2. Planned Trips
    const userTrips = trips
      .filter(t => t.familyId === currentUser?.id)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    userTrips.forEach(t => {
      if (!locs.some(l => l.name === t.location)) {
        locs.push({ 
          name: t.location, 
          type: 'planned',
          lat: t.coordinates.lat,
          lng: t.coordinates.lng
        });
      }
    });
    
    // 3. Fallback
    const hasAnyLocation = locs.length > 0;
    if (locs.length === 0) {
      locs.push({ name: 'Chiang Mai', type: 'default', lat: 18.7883, lng: 98.9853 });
    }
    return { locs, hasAnyLocation };
  }, [currentUser?.currentLocation, trips, currentUser?.id]);

  const activeLocation = useMemo(() => {
    const safeIndex = activeLocationIndex % locations.locs.length;
    return locations.locs[safeIndex];
  }, [locations.locs, activeLocationIndex]);

  const destination = useMemo(() => {
    return destinations.find(d => 
      activeLocation.name.toLowerCase().includes(d.cityName.toLowerCase()) || 
      activeLocation.name.toLowerCase().includes(d.country.toLowerCase())
    ) || destinations[0];
  }, [destinations, activeLocation]);

  const totalLocations = locations.locs.length;

  const filteredProfiles = useMemo(() => {
    if (!currentUser) return [];
    return profiles.filter(p => {
       if (p.id === currentUser.id) return false;
       if (p.privacySettings?.isIncognito) return false;
       if (blocks.some(b => (b.blockerId === currentUser.id && b.blockedId === p.id) || (b.blockerId === p.id && b.blockedId === currentUser.id))) return false;
       
       // Distance filter (100km radius for families)
       if (p.currentLocation && activeLocation.lat && activeLocation.lng) {
         const dist = calculateDistance(activeLocation.lat, activeLocation.lng, p.currentLocation.lat, p.currentLocation.lng);
         return dist <= 100;
       }
       
       return true;
    });
  }, [currentUser, profiles, blocks, activeLocation]);

  const filteredLookingFor = useMemo(() => {
    if (!currentUser) return [];
    return lookingFor.filter(r => {
      // Filter out blocked users
      if (blocks.some(b => (b.blockerId === currentUser.id && b.blockedId === r.userId) || (b.blockerId === r.userId && b.blockedId === currentUser.id))) return false;
      
      // Distance filter (50km radius)
      if (r.lat && r.lng && activeLocation.lat && activeLocation.lng) {
        const dist = calculateDistance(activeLocation.lat, activeLocation.lng, r.lat, r.lng);
        return dist <= 50;
      }
      
      // Fallback to name matching if coords missing
      return r.location.toLowerCase().includes(activeLocation.name.toLowerCase().split(',')[0]);
    });
  }, [currentUser, lookingFor, blocks, activeLocation]);

  const filteredSpots = useMemo(() => {
    return spots.filter(spot => {
      // Basic category filter for collab mode
      if (collabMode && (spot.category !== 'Workspace' && spot.category !== 'Accommodation')) return false;
      
      // Distance filter (50km radius)
      if (spot.coordinates && activeLocation.lat && activeLocation.lng) {
        const dist = calculateDistance(activeLocation.lat, activeLocation.lng, spot.coordinates.lat, spot.coordinates.lng);
        return dist <= 50;
      }
      
      // Fallback
      const cityName = (spot as any).cityName;
      if (cityName) {
        return cityName.toLowerCase().includes(activeLocation.name.toLowerCase().split(',')[0]);
      }
      return true;
    });
  }, [spots, collabMode, activeLocation]);

  const filteredDeals = useMemo(() => {
    return filteredSpots.filter(s => s.monthlyDeal);
  }, [filteredSpots]);

  const filteredMarketItems = useMemo(() => {
    if (!currentUser) return [];
    return marketItems.filter(i => {
      // Filter out blocked users
      if (blocks.some(b => (b.blockerId === currentUser.id && b.blockedId === i.sellerId) || (b.blockerId === i.sellerId && b.blockedId === currentUser.id))) return false;
      
      // Distance filter (50km radius)
      if (i.location && activeLocation.lat && activeLocation.lng) {
        const dist = calculateDistance(activeLocation.lat, activeLocation.lng, i.location.lat, i.location.lng);
        return dist <= 50;
      }
      
      // Fallback
      return i.location.name.toLowerCase().includes(activeLocation.name.toLowerCase().split(',')[0]);
    });
  }, [currentUser, marketItems, blocks, activeLocation]);

  return (
    <div className={cn(
      "p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-24 md:pb-8 transition-colors duration-500 min-h-full",
      collabMode ? "bg-[#006d77] text-white" : "text-slate-900"
    )}>
      <header className="flex justify-between items-start">
        <div>
          <h1 className={cn("text-3xl font-black tracking-tight", collabMode ? "text-white" : "text-secondary")}>
            Neighborhood
          </h1>
          <p className={cn("font-medium", collabMode ? "text-white/60" : "text-slate-500")}>Stuff, services, and destination guidance.</p>
        </div>
        {!locations.hasAnyLocation && (
          <button 
            onClick={onSetLocation}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 animate-pulse transition-all",
              collabMode ? "bg-accent/20 text-accent border border-accent/40" : "bg-primary/10 text-primary border border-primary/20"
            )}
          >
            <MapPin className="w-3 h-3" /> Set Location
          </button>
        )}
      </header>

      {/* Tribe Map */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", collabMode ? "text-white/40" : "text-slate-400")}>Neighborhood Map</h2>
          <div className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", collabMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500")}>
            Showing {activeLocation.name}
          </div>
        </div>
        <div className="h-[400px] w-full">
          <MapView 
            center={{ lat: activeLocation.lat, lng: activeLocation.lng }} 
            profiles={filteredProfiles}
            spots={filteredSpots}
            marketItems={filteredMarketItems}
            onSelectFamily={onSelectFamily}
            onSelectSpot={onSelectSpot}
            onSelectItem={onSelectItem}
          />
        </div>
      </section>

      {/* Quick Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {(collabMode ? [
          { id: 'coworking', label: 'Coworking', icon: <Briefcase className="w-3 h-3" /> },
          { id: 'networking', label: 'Networking', icon: <Users className="w-3 h-3" /> },
          { id: 'looking-for', label: 'Collab Asks', icon: <Search className="w-3 h-3" /> },
          { id: 'marketplace', label: 'B2B Services', icon: <ShoppingBag className="w-3 h-3" /> },
          { id: 'deals', label: 'Work Deals', icon: <Tag className="w-3 h-3" /> },
        ] : [
          { id: 'guidance', label: 'Guidance', icon: <MapIcon className="w-3 h-3" /> },
          { id: 'looking-for', label: 'Looking For', icon: <Search className="w-3 h-3" /> },
          { id: 'marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-3 h-3" /> },
          { id: 'directory', label: 'Directory', icon: <BookOpen className="w-3 h-3" /> },
          { id: 'deals', label: 'Deals', icon: <Tag className="w-3 h-3" /> },
        ]).map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              const el = document.getElementById(cat.id);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all",
              collabMode 
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10" 
                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 card-shadow"
            )}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Destination Guidance Slider */}
      <section id="guidance" className="relative group">
        {!destination ? (
          <div className={cn("rounded-[2.5rem] p-12 border border-dashed text-center", collabMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
            <MapIcon className={cn("w-12 h-12 mx-auto mb-4", collabMode ? "text-white/20" : "text-slate-300")} />
            <p className={cn("text-sm font-medium", collabMode ? "text-white/40" : "text-slate-500")}>Loading destination guidance for {activeLocation.name}...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeLocationIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "rounded-[2.5rem] p-8 relative overflow-hidden transition-colors",
                collabMode ? "bg-white/5 border border-white/10" : "bg-secondary text-white card-shadow"
              )}
            >
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-black tracking-tight">{destination.cityName}</h2>
                      {activeLocation.type === 'current' && (
                        <span className="bg-accent text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Current</span>
                      )}
                      {activeLocation.type === 'planned' && (
                        <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Planned</span>
                      )}
                    </div>
                    <p className={cn("font-bold uppercase tracking-widest text-sm", collabMode ? "text-white/40" : "text-white/60")}>{destination.country}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveLocationIndex(prev => (prev === 0 ? totalLocations - 1 : prev - 1))}
                      className={cn("p-3 backdrop-blur-md rounded-2xl transition-all", collabMode ? "bg-white/5 hover:bg-white/10" : "bg-white/10 hover:bg-white/20")}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setActiveLocationIndex(prev => (prev === totalLocations - 1 ? 0 : prev + 1))}
                      className={cn("p-3 backdrop-blur-md rounded-2xl transition-all", collabMode ? "bg-white/5 hover:bg-white/10" : "bg-white/10 hover:bg-white/20")}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className={cn("backdrop-blur-md p-4 rounded-2xl border", collabMode ? "bg-white/5 border-white/10" : "bg-white/10 border-white/10")}>
                    <p className={cn("text-[10px] font-black uppercase mb-1", collabMode ? "text-white/20" : "text-white/40")}>{collabMode ? 'Networking Cost' : 'Cost Index'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">${collabMode ? destination.costIndex.coworking || 150 : destination.costIndex.localMeal}</span>
                      <span className={cn("text-xs", collabMode ? "text-white/40" : "text-white/60")}>{collabMode ? 'Monthly Desk' : 'Local Meal'}</span>
                    </div>
                  </div>
                  <div className={cn("backdrop-blur-md p-4 rounded-2xl border", collabMode ? "bg-white/5 border-white/10" : "bg-white/10 border-white/10")}>
                    <p className={cn("text-[10px] font-black uppercase mb-1", collabMode ? "text-white/20" : "text-white/40")}>{collabMode ? 'Internet Speed' : 'Schools'}</p>
                    <p className="text-sm font-bold truncate">{collabMode ? 'High Speed Fiber' : destination.internationalSchools.join(', ')}</p>
                  </div>
                  <div className={cn("hidden lg:block backdrop-blur-md p-4 rounded-2xl border", collabMode ? "bg-white/5 border-white/10" : "bg-white/10 border-white/10")}>
                    <p className={cn("text-[10px] font-black uppercase mb-1", collabMode ? "text-white/20" : "text-white/40")}>{collabMode ? 'Networking Pulse' : 'Tribe Score'}</p>
                    <div className="flex items-center gap-2">
                      <Zap className={cn("w-3 h-3", collabMode ? "text-amber-400" : "text-primary shadow-sm")} />
                      <span className="text-sm font-bold">{collabMode ? 'Vibrant' : 'Very Friendly'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className={cn("px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all", collabMode ? "bg-white text-[#006d77]" : "bg-primary text-white shadow-primary/20")}>
                    View Full Guide
                  </button>
                  <button className={cn("backdrop-blur-md px-6 py-3 rounded-xl font-bold text-sm border transition-all", collabMode ? "bg-white/5 border-white/10 text-white" : "bg-white/10 border-white/20 text-white")}>
                    See Families Going
                  </button>
                </div>
              </div>
              <MapPin className={cn("absolute -bottom-10 -right-10 w-64 h-64", collabMode ? "text-white/5" : "text-white/5")} />
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Looking For */}
      <section id="looking-for" className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", collabMode ? "text-white/40" : "text-slate-400")}>Looking For</h2>
          <button 
            onClick={() => setIsLookingForOpen(true)}
            className={cn("text-xs font-bold flex items-center gap-1", collabMode ? "text-white" : "text-primary")}
          >
            <Plus className="w-3 h-3" /> Post Request
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {filteredLookingFor.length === 0 ? (
            <div className={cn("w-full py-12 rounded-3xl border border-dashed text-center", collabMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
              <p className={cn("text-sm font-medium", collabMode ? "text-white/40" : "text-slate-400")}>No requests yet. Be the first!</p>
            </div>
          ) : filteredLookingFor.filter(r => !collabMode || r.category === 'Work').map((request) => (
            <motion.div 
              key={request.id}
              className={cn(
                "flex-shrink-0 w-72 p-5 rounded-3xl border relative group transition-colors",
                collabMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-100 card-shadow"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  request.category === 'Help' ? "bg-red-100 text-red-600" :
                  request.category === 'Playdate' ? "bg-blue-100 text-blue-600" :
                  request.category === 'Gear' ? "bg-orange-100 text-orange-600" :
                  request.category === 'Work' ? "bg-green-100 text-green-600" :
                  "bg-purple-100 text-purple-600"
                )}>
                  {request.category}
                </span>
                {currentUser?.id === request.userId && (
                  <button 
                    onClick={() => removeLookingFor(request.id)}
                    className={cn("transition-colors", collabMode ? "text-white/20 hover:text-red-400" : "text-slate-300 hover:text-red-500")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className={cn("font-bold mb-1 line-clamp-1", collabMode ? "text-white" : "text-secondary")}>{request.title}</h3>
              <p className={cn("text-xs mb-4 line-clamp-2", collabMode ? "text-white/60" : "text-slate-500")}>{request.description}</p>
              <div className={cn("flex items-center justify-between mt-auto pt-3 border-t", collabMode ? "border-white/10" : "border-slate-50")}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden", collabMode ? "bg-white/10 text-white/40" : "bg-slate-100 text-slate-500")}>
                    {(() => {
                      const requester = profiles.find(p => p.id === request.userId);
                      return requester?.photoUrl ? (
                        <img src={requester.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : request.familyName[0];
                    })()}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("text-[10px] font-bold", collabMode ? "text-white/60" : "text-slate-500")}>{request.familyName}</span>
                    <div className="flex gap-1">
                      {(profiles.find(p => p.id === request.userId)?.badges || []).slice(0, 1).map((badge, i) => (
                        <Badge key={i} name={badge} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className={cn("flex items-center text-[10px] font-bold", collabMode ? "text-white/40" : "text-slate-400")}>
                  <MapPin className="w-3 h-3 mr-1" />
                  {request.location}
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <VoteButtons type="lookingFor" id={request.id} votes={request.votes} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Marketplace */}
      <section id="marketplace" className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", collabMode ? "text-white/40" : "text-slate-400")}>Marketplace</h2>
          <button 
            onClick={() => onViewAllMarketplace()}
            className={cn("text-xs font-bold flex items-center gap-1", collabMode ? "text-white" : "text-primary")}
          >
            <ShoppingBag className="w-3 h-3" /> View All
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {filteredMarketItems.length === 0 ? (
            <div className={cn("w-full py-12 rounded-3xl border border-dashed text-center", collabMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
              <p className={cn("text-sm font-medium", collabMode ? "text-white/40" : "text-slate-400")}>No items yet. List something!</p>
            </div>
          ) : filteredMarketItems.slice(0, 5).map((item) => (
            <motion.div 
              key={item.id}
              className={cn(
                "flex-shrink-0 w-64 rounded-3xl border overflow-hidden group transition-colors",
                collabMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-100 card-shadow"
              )}
            >
              <div className="h-32 bg-slate-100 relative">
                <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/300`} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex gap-2">
                  {currentUser?.id === item.sellerId && (
                    <button 
                      onClick={() => removeMarketItem(item.id)}
                      className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-red-500 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-secondary">
                    ${item.price === 'Free' ? 'FREE' : item.price}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className={cn("font-bold text-sm mb-1 truncate", collabMode ? "text-white" : "text-secondary")}>{item.title}</h3>
                <div className={cn("flex items-center text-[10px] font-bold mb-3", collabMode ? "text-white/40" : "text-slate-400")}>
                  <MapPin className="w-3 h-3 mr-1" />
                  {item.location.name}
                </div>
                <button 
                  disabled={item.status !== 'Available'}
                  onClick={() => currentUser && reserveItem(item.id, currentUser.id)}
                  className={cn(
                    "w-full py-2 rounded-xl text-xs font-bold transition-all mb-3",
                    item.status === 'Available' 
                      ? (collabMode ? "bg-white text-[#006d77] hover:bg-white/90" : "bg-secondary text-white hover:bg-secondary/90") 
                      : (collabMode ? "bg-white/10 text-white/20" : "bg-slate-100 text-slate-400 cursor-not-allowed")
                  )}
                >
                  {item.status === 'Available' ? 'Reserve Item' : item.status}
                </button>
                <div className="flex justify-end">
                  <VoteButtons type="marketplace" id={item.id} votes={item.votes} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Directory */}
      <section id="directory" className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", collabMode ? "text-white/40" : "text-slate-400")}>Vetted Directory</h2>
          <button 
            onClick={() => onRecommendSpot()}
            className={cn("text-xs font-bold flex items-center gap-1", collabMode ? "text-white" : "text-primary")}
          >
            <Plus className="w-3 h-3" /> Recommend Spot
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredSpots
            .map(spot => (
              <div key={spot.id} className={cn(
                "rounded-3xl overflow-hidden border group transition-colors",
                collabMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-100 card-shadow"
              )}>
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                <img src={spot.imageUrl || `https://picsum.photos/seed/${spot.id}/600/400`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3 flex gap-2">
                  {currentUser?.id === spot.recommendedBy && (
                    <button 
                      onClick={() => removeSpot(spot.id)}
                      className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-red-500 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-black text-secondary">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {spot.rating}
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <h4 className={cn("font-bold", collabMode ? "text-white" : "text-secondary")}>{spot.name}</h4>
                <div className="flex flex-wrap gap-1">
                  {spot.verifiedTags.slice(0, 2).map((tag, i) => (
                    <span key={i} className={cn("text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border", collabMode ? "bg-white/10 text-white/60 border-white/10" : "bg-slate-50 text-slate-400 border-slate-100")}>
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Reviews Section */}
                <div className={cn("pt-3 border-t space-y-3", collabMode ? "border-white/10" : "border-slate-50")}>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", collabMode ? "text-white/20" : "text-slate-300")}>Recent Reviews</p>
                  {(() => {
                    const spotReviews = (reviews || [])
                      .filter(r => r.spotId === spot.id)
                      .sort((a, b) => {
                        const authorA = profiles.find(p => p.id === a.authorId);
                        const authorB = profiles.find(p => p.id === b.authorId);
                        const badgesA = authorA?.badges?.length || 0;
                        const badgesB = authorB?.badges?.length || 0;
                        return badgesB - badgesA; // Prioritize more badges
                      });

                    if (spotReviews.length === 0) {
                      return <p className={cn("text-[10px] italic", collabMode ? "text-white/20" : "text-slate-400")}>No reviews yet.</p>;
                    }

                    return spotReviews.slice(0, 2).map(review => {
                      const author = profiles.find(p => p.id === review.authorId);
                      return (
                        <div key={review.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className={cn("w-4 h-4 rounded-full overflow-hidden", collabMode ? "bg-white/10" : "bg-slate-100")}>
                                <img src={author?.photoUrl || `https://picsum.photos/seed/${review.authorId}/50/50`} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className={cn("text-[10px] font-bold", collabMode ? "text-white/80" : "text-secondary")}>{author?.familyName}</span>
                              {author?.badges && author.badges.length > 0 && (
                                <Badge name={author.badges[0]} />
                              )}
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                              <span className={cn("text-[10px] font-bold", collabMode ? "text-white/80" : "text-secondary")}>{review.rating}</span>
                            </div>
                          </div>
                          <p className={cn("text-[10px] line-clamp-2 leading-relaxed", collabMode ? "text-white/40" : "text-slate-500")}>"{review.story}"</p>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className={cn("pt-3 flex justify-between items-center border-t", collabMode ? "border-white/10" : "border-slate-50")}>
                  <VoteButtons type="spots" id={spot.id} votes={spot.votes} />
                  <button className={cn("text-[10px] font-bold hover:underline", collabMode ? "text-white/60" : "text-primary")}>Write Review</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Deals */}
      <section id="deals" className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", collabMode ? "text-white/40" : "text-slate-400")}>Deals</h2>
          <button 
            onClick={() => onViewAllDeals()}
            className={cn("text-xs font-bold flex items-center gap-1", collabMode ? "text-white" : "text-primary")}
          >
            <Tag className="w-3 h-3" /> View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDeals.length === 0 ? (
            <div className={cn("w-full py-12 rounded-3xl border border-dashed text-center", collabMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
              <p className={cn("text-sm font-medium", collabMode ? "text-white/40" : "text-slate-400")}>No deals in this location yet.</p>
            </div>
          ) : filteredDeals.map((spot) => (
            <div key={spot.id} className={cn(
              "rounded-3xl p-6 flex flex-col md:flex-row gap-6 border transition-colors",
              collabMode ? "bg-white/5 border-white/10 text-white" : "bg-accent/5 border-accent/10"
            )}>
              <div className="w-full md:w-32 h-32 rounded-2xl bg-slate-200 overflow-hidden">
                <img src={`https://picsum.photos/seed/${spot.id}/300/300`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className={cn("font-bold text-lg", collabMode ? "text-white" : "text-secondary")}>{spot.name}</h3>
                  <span className="bg-accent text-white px-2 py-1 rounded-lg text-[10px] font-black">{spot.monthlyDeal?.discount}</span>
                </div>
                <p className={cn("text-sm font-medium", collabMode ? "text-white/60" : "text-slate-600")}>{spot.monthlyDeal?.description}</p>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={cn("w-6 h-6 rounded-full border-2 bg-slate-200", collabMode ? "border-[#006d77]" : "border-white")} />
                    ))}
                  </div>
                  <span className={cn("text-[10px] font-bold", collabMode ? "text-white/40" : "text-slate-400")}>3 families staying here</span>
                </div>
                <PremiumAction isPremium={isPremium} onPaywall={onPaywall} onClick={() => alert("Deals are available in your user dashboard.")}>
                  <button 
                    className={cn(
                      "w-full mt-4 py-3 rounded-xl font-bold text-sm shadow-lg transition-all",
                      collabMode ? "bg-white text-[#006d77] hover:bg-white/90" : "bg-accent text-white shadow-accent/20"
                    )}
                  >
                    Claim Deal
                  </button>
                </PremiumAction>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Looking For Modal */}
      <Modal isOpen={isLookingForOpen} onClose={() => setIsLookingForOpen(false)} title="What are you looking for?">
        <form onSubmit={handleAddLookingFor} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {[collabMode ? 'Work' : 'Help', 'Playdate', 'Gear', 'Advice'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewRequest({...newRequest, category: cat as any})}
                  className={cn(
                    "py-2 rounded-xl text-sm font-bold border transition-all",
                    newRequest.category === cat 
                      ? (collabMode ? "bg-white text-[#006d77] border-white" : "bg-secondary text-white border-secondary") 
                      : (collabMode ? "bg-white/5 text-white/40 border-white/10" : "bg-slate-50 text-slate-500 border-slate-100")
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
            <input 
              required
              type="text" 
              placeholder={collabMode ? "e.g. Looking for a React Dev..." : "Short summary..."} 
              className={cn(
                "w-full p-4 border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                collabMode 
                  ? "bg-white/5 border-white/10 text-white focus:ring-white/20" 
                  : "bg-slate-50 border-slate-100 focus:ring-primary/20"
              )}
              value={newRequest.title}
              onChange={e => setNewRequest({...newRequest, title: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea 
              required
              rows={3}
              placeholder={collabMode ? "Describe the project or collaboration..." : "Tell the tribe more..."} 
              className={cn(
                "w-full p-4 border rounded-2xl focus:outline-none focus:ring-2 transition-all resize-none",
                collabMode 
                  ? "bg-white/5 border-white/10 text-white focus:ring-white/20" 
                  : "bg-slate-50 border-slate-100 focus:ring-primary/20"
              )}
              value={newRequest.description}
              onChange={e => setNewRequest({...newRequest, description: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <LocationSelector 
              label="Location"
              placeholder="Search city..."
              value={newRequest.location}
              onChange={(val, coords) => setNewRequest(prev => ({ ...prev, location: val, lat: coords?.lat || 0, lng: coords?.lng || 0 }))}
            />
          </div>
          <button 
            type="submit" 
            className={cn(
              "w-full py-4 rounded-2xl font-bold shadow-lg transition-all",
              collabMode ? "bg-white text-[#006d77]" : "bg-primary text-white shadow-primary/20"
            )}
          >
            Post Request
          </button>
        </form>
      </Modal>
    </div>
  );
};

const VibeCheckSection = ({ dest }: { dest: DestinationGuidance }) => {
  const { verifyCityData, updateCityVibe, collabMode, addToast } = useNomadStore();
  const [vibe, setVibe] = useState(dest.vibeScore);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const handleVerify = (category: string, isCorrect: boolean) => {
    if (isCorrect) {
      const currentPrice = dest.costIndex[category as keyof typeof dest.costIndex] as number;
      verifyCityData(dest.id, category, currentPrice);
      addToast("Bedankt voor het verifiëren!", "success");
    } else {
      setEditingCategory(category);
    }
  };

  const handleSubmitPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory && newPrice) {
      verifyCityData(dest.id, editingCategory, parseFloat(newPrice));
      setEditingCategory(null);
      setNewPrice('');
      addToast("Prijs suggestie ingediend!", "success");
    }
  };

  return (
    <div className={cn(
      "p-6 rounded-[2.5rem] border space-y-6 transition-colors",
      collabMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 card-shadow"
    )}>
      <div className="flex items-center justify-between">
        <h3 className={cn(
          "text-sm font-black uppercase tracking-widest flex items-center gap-2",
          collabMode ? "text-white" : "text-secondary"
        )}>
          <Zap className="w-4 h-4 text-accent" /> Vibe Check
        </h3>
        <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">
          {vibe.toFixed(1)} / 10
        </span>
      </div>

      <div className="space-y-4">
        <input 
          type="range" 
          min="0" 
          max="10" 
          step="0.1"
          className="w-full accent-accent"
          value={vibe}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setVibe(val);
            updateCityVibe(dest.id, val);
          }}
        />
        <div className={cn(
          "flex justify-between text-[10px] font-black uppercase tracking-widest",
          collabMode ? "text-white/20" : "text-slate-300"
        )}>
          <span>Chill</span>
          <span>Hectic</span>
        </div>
      </div>

      <div className={cn("space-y-4 pt-4 border-t", collabMode ? "border-white/10" : "border-slate-50")}>
        <h4 className={cn("text-[10px] font-black uppercase tracking-widest", collabMode ? "text-white/40" : "text-slate-400")}>Verify Costs</h4>
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: 'Coffee', key: 'coffee', icon: <Coffee className="w-3 h-3" /> },
            { label: 'Pizza', key: 'pizza', icon: <Pizza className="w-3 h-3" /> },
            { label: 'Beer', key: 'beer', icon: <Beer className="w-3 h-3" /> },
            { label: 'Coworking', key: 'coworking', icon: <Briefcase className="w-3 h-3" /> },
          ].map((item) => (
            <div key={item.key} className={cn(
              "flex items-center justify-between p-3 rounded-2xl transition-colors",
              collabMode ? "bg-white/5" : "bg-slate-50"
            )}>
              <div className="flex items-center gap-3">
                <div className={collabMode ? "text-white/40" : "text-slate-400"}>{item.icon}</div>
                <div>
                  <p className={cn("text-[10px] font-bold uppercase", collabMode ? "text-white/40" : "text-slate-400")}>{item.label}</p>
                  <p className={cn("font-black text-sm", collabMode ? "text-white" : "text-secondary")}>
                    €{(dest.costIndex[item.key as keyof typeof dest.costIndex] as number || 0).toFixed(2)}
                    {item.key === 'coworking' && '/mo'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleVerify(item.key, true)}
                  className={cn(
                    "p-2 rounded-xl border transition-colors",
                    collabMode ? "bg-white/5 border-white/10 text-green-400 hover:bg-green-400/10" : "bg-white border-slate-100 text-green-500 hover:bg-green-50"
                  )}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleVerify(item.key, false)}
                  className={cn(
                    "p-2 rounded-xl border transition-colors",
                    collabMode ? "bg-white/5 border-white/10 text-red-400 hover:bg-red-400/10" : "bg-white border-slate-100 text-red-500 hover:bg-red-50"
                  )}
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title={`Correct ${editingCategory} price`}>
        <form onSubmit={handleSubmitPrice} className="space-y-4">
          <p className="text-sm text-slate-500">What is the actual price for {editingCategory} in {dest.cityName}?</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">€</span>
            <input 
              autoFocus
              type="number" 
              step="0.01"
              className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0.00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20">
            Submit Correction
          </button>
        </form>
      </Modal>
    </div>
  );
};

const NotificationCenter = ({ isOpen, onClose, onOpenConnect, onOpenVibeCheck }: { isOpen: boolean, onClose: () => void, onOpenConnect: () => void, onOpenVibeCheck: () => void }) => {
  const { notifications, markNotificationRead, setActiveTab, currentUser } = useNomadStore();
  
  const unread = notifications.filter(n => !n.isRead && new Date(n.scheduledFor) <= new Date());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications">
      <div className="space-y-6 pb-6">
        {/* Subscription Info Card */}
        {currentUser && (
          <div className="p-5 bg-secondary text-white rounded-3xl space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Current Plan</p>
                <div className="flex items-center gap-2">
                   <h3 className="text-xl font-bold">{currentUser.isPremium ? 'Tribe PRO' : 'Tribe Free'}</h3>
                   <span className={cn("px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest", currentUser.isPremium ? "bg-accent" : "bg-white/20")}>
                     {currentUser.isPremium ? 'Active' : 'Basic'}
                   </span>
                </div>
              </div>
              <Award className="w-8 h-8 text-white/20" />
            </div>

            {currentUser.isPremium && currentUser.premiumUntil && (
              <div className="pt-3 border-t border-white/10 relative z-10">
                <p className="text-[10px] font-medium text-white/60">
                   Plan expires on {format(parseISO(currentUser.premiumUntil), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
            
            {!currentUser.isPremium && (
              <button 
                onClick={() => {
                  onClose();
                  (useNomadStore.getState() as any).setIsPaywallOpen(true);
                }}
                className="w-full bg-accent text-white py-2 rounded-xl text-xs font-bold shadow-lg shadow-accent/20"
              >
                Upgrade to PRO
              </button>
            )}
            <Globe className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5" />
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Updates</h4>
          {unread.length === 0 ? (
            <div className="py-8 text-center space-y-3 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-slate-400 font-medium text-sm">All caught up!</p>
            </div>
          ) : (
            unread.map(n => (
              <div 
                key={n.id} 
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.type === 'ConnectionRequest') {
                    onOpenConnect();
                    onClose();
                  } else if (n.type === 'VibeCheck') {
                    onOpenVibeCheck();
                    onClose();
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    n.type === 'ConnectionRequest' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                  )}>
                    {n.type === 'ConnectionRequest' ? <Users className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-secondary text-sm">{n.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {format(parseISO(n.createdAt), 'MMM d, HH:mm')}
                  </span>
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">View Details</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

const VibeCheckModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (metrics: Record<string, number>) => void }) => {
  const [metrics, setMetrics] = useState({ 
    kindvriendelijkheid: 5, 
    veiligheid: 5, 
    voorzieningen: 5, 
    community: 5, 
    betaalbaarheid: 5, 
    internet: 5, 
    gezondheidszorg: 5 
  });

  const labels: Record<string, string> = {
    kindvriendelijkheid: 'Kindvriendelijkheid',
    veiligheid: 'Veiligheid',
    voorzieningen: 'Voorzieningen',
    community: 'Community',
    betaalbaarheid: 'Betaalbaarheid',
    internet: 'Internet (MBPS)',
    gezondheidszorg: 'Gezondheidszorg'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vibe Check! 🌍">
      <div className="space-y-8 pb-4">
        <p className="text-sm text-slate-500 font-medium">Hoe is de ervaring voor families in deze stad? Jouw feedback helpt de Tribe groeien!</p>
        
        <div className="space-y-6">
          {Object.entries(metrics).map(([key, val]) => (
            <div key={key} className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-secondary">{labels[key]}</label>
                <span className="text-sm font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{val}{key === 'internet' ? ' Mbps' : '/10'}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={val} 
                onChange={(e) => setMetrics(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          ))}
        </div>

        <button 
          onClick={() => {
            onSave(metrics);
            onClose();
          }}
          className="w-full py-4 bg-primary text-white rounded-3xl font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all"
        >
          Opslaan & Tribe Delen
        </button>
      </div>
    </Modal>
  );
};

const ProfileView = ({ onShare, onLogout, onAddTrip, onEditTrip, setIsNotificationCenterOpen, isNotificationCenterOpen, setIsConnectOpen, onSetLocation }: { onShare: () => void, onLogout: () => void, onAddTrip: () => void, onEditTrip: (trip: Trip) => void, setIsNotificationCenterOpen: (open: boolean) => void, isNotificationCenterOpen: boolean, setIsConnectOpen: (open: boolean) => void, onSetLocation: () => void }) => {
  const { currentUser, trips, removeTrip, updateProfile, updateKids, reviews, marketItems, spots, destinations, notifications, addToast, collabMode, collabEndorsements, setActiveTab } = useNomadStore();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditTribeOpen, setIsEditTribeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditCollabCardOpen, setIsEditCollabCardOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [editProfile, setEditProfile] = useState<Partial<FamilyProfile>>({
    collabCard: { occupation: '', superpowers: [], currentMission: '', linkedInUrl: '' },
    openToCollabs: false
  });
  const [editTribe, setEditTribe] = useState<{ 
    parents: Parent[], 
    kids: Kid[] 
  }>({ parents: [], kids: [] });
  
  if (!currentUser) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating profile with:", editProfile);
    try {
      // Only update fields that are in the edit form to avoid overwriting other fields (like parents/kids) with stale data
      await updateProfile({
        familyName: editProfile.familyName,
        photoUrl: editProfile.photoUrl,
        bio: editProfile.bio,
        travelReasons: editProfile.travelReasons || [],
        askUsAbout: editProfile.askUsAbout,
        collabCard: editProfile.collabCard,
        openToCollabs: editProfile.openToCollabs
      });
      console.log("Profile updated successfully");
      setIsEditProfileOpen(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      addToast("Profiel bijwerken mislukt.", "error");
    }
  };

  const handleUpdateTribe = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating tribe with:", editTribe);
    try {
      await updateProfile({ 
        parents: editTribe.parents, 
        kids: editTribe.kids 
      });
      console.log("Tribe updated successfully");
      setIsEditTribeOpen(false);
    } catch (err) {
      console.error("Error updating tribe:", err);
      addToast("Tribe bijwerken mislukt.", "error");
    }
  };

  const sortedTrips = useMemo(() => {
    return trips
      .filter(t => t.familyId === currentUser.id)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [trips, currentUser.id]);

  const badgeMotivation = useMemo(() => {
    const badges = currentUser.badges || [];
    const userReviews = (reviews || []).filter(r => r.authorId === currentUser.id);
    const userMarket = (marketItems || []).filter(i => i.sellerId === currentUser.id);
    const userSpots = (spots || []).filter(s => s.recommendedBy === currentUser.id);
    
    const hasBio = currentUser.bio && currentUser.bio.length > 20;
    const hasPhoto = !!currentUser.photoUrl;
    const hasKids = currentUser.kids && currentUser.kids.length > 0;
    const hasParents = currentUser.parents && currentUser.parents.length > 0;
    const hasLanguages = currentUser.spokenLanguages && currentUser.spokenLanguages.length > 0;
    
    if (!badges.includes('Profile Pro')) {
      const missing = [];
      if (!hasBio) missing.push('bio');
      if (!hasPhoto) missing.push('photo');
      if (!hasKids) missing.push('kids');
      if (!hasParents) missing.push('parents');
      if (!hasLanguages) missing.push('languages');
      return { icon: <Award className="w-4 h-4" />, text: `Complete ${missing[0]} for Profile Pro`, color: 'text-green-400', bg: 'bg-green-400/10' };
    }
    
    if (!badges.includes('Top Contributor') && userReviews.length < 5) {
      return { icon: <Star className="w-4 h-4" />, text: `${5 - userReviews.length} more reviews for Top Contributor`, color: 'text-purple-400', bg: 'bg-purple-400/10' };
    }

    if (!badges.includes('Marketplace Hero') && userMarket.length < 3) {
      return { icon: <ShoppingBag className="w-4 h-4" />, text: `${3 - userMarket.length} more items for Market Hero`, color: 'text-orange-400', bg: 'bg-orange-400/10' };
    }

    if (!badges.includes('Local Guide') && userSpots.length < 2) {
      return { icon: <MapPin className="w-4 h-4" />, text: `${2 - userSpots.length} more spots for Local Guide`, color: 'text-blue-400', bg: 'bg-blue-400/10' };
    }

    return null;
  }, [currentUser, reviews, marketItems, spots]);

  return (
    <div className={cn(
      "p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-24 md:pb-8 transition-colors duration-500 min-h-full",
      collabMode ? "bg-[#006d77] text-white" : "text-secondary"
    )}>
      <header className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative">
        <div className="w-32 h-32 rounded-[3rem] bg-slate-100 overflow-hidden border-4 border-white shadow-xl relative">
          <img 
            src={currentUser.photoUrl || `https://picsum.photos/seed/${currentUser.id}/400/400`} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${currentUser.id}/400/400`;
            }}
            alt="" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className={cn("text-4xl font-black tracking-tight", collabMode ? "text-white" : "text-secondary")}>{currentUser.familyName}</h1>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Premium Badge */}
                {currentUser.isPremium && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/20 shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                    Premium
                  </div>
                )}
                
                {/* Verification Level Label */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                  <ShieldCheck className="w-3 h-3" />
                  LVL {currentUser.verificationLevel}
                </div>
                
                {/* Professional Endorsements (Collab Mode specific) */}
                {collabMode && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">
                    <Award className="w-3 h-3" />
                    {collabEndorsements.filter(e => e.targetUserId === currentUser.id).length} Endorsements
                  </div>
                )}
                
                {/* Vouches Label (only if > 0) */}
                {currentUser.vouchedBy.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                    <Users className="w-3 h-3" />
                    {currentUser.vouchedBy.length} Vouches
                  </div>
                )}
              </div>
            </div>

            <p className={cn("font-bold uppercase tracking-[0.2em] text-xs", collabMode ? "text-white/40" : "text-primary")}>
              {currentUser.nativeLanguage} • {currentUser.spokenLanguages.length} Languages • {currentUser.kids.length} Kids
            </p>
          </div>
          
          {!collabMode && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-slate-600 text-sm relative">
              <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Why we travel</span>
              "{currentUser.travelReasons?.join(', ')}"
            </div>
          )}
        </div>
          <div className="flex flex-col gap-2 relative">
            <div className="flex justify-end md:justify-start gap-2">
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={cn(
                    "p-3 rounded-2xl transition-all border flex items-center gap-2",
                    collabMode 
                      ? "bg-white/10 text-white border-white/10 hover:bg-white/20" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <MoreVertical className="w-6 h-6" />
                  <span className="text-sm font-bold md:hidden">Menu</span>
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsMenuOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={cn(
                          "absolute right-0 mt-2 w-56 rounded-3xl shadow-2xl border p-2 z-50 overflow-hidden",
                          collabMode ? "bg-[#004d55] border-white/10" : "bg-white border-slate-100"
                        )}
                      >
                        <button 
                          onClick={() => {
                            setIsNotificationCenterOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors group",
                            collabMode ? "text-white hover:bg-white/10" : "text-secondary hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("p-2 rounded-xl transition-colors", collabMode ? "bg-white/10 group-hover:bg-white/20 text-white" : "bg-slate-100 group-hover:bg-slate-200 text-slate-600")}>
                            <Bell className="w-4 h-4" />
                          </div>
                          Notifications
                        </button>

                        <button 
                          onClick={() => {
                            setEditProfile(currentUser);
                            setIsEditProfileOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors group",
                            collabMode ? "text-white hover:bg-white/10" : "text-secondary hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("p-2 rounded-xl transition-colors", collabMode ? "bg-white/10 group-hover:bg-white/20 text-white" : "bg-slate-100 group-hover:bg-slate-200 text-slate-600")}>
                            <Edit2 className="w-4 h-4" />
                          </div>
                          Edit Profile
                        </button>

                        <button 
                          onClick={() => {
                            setIsSettingsOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors group",
                            collabMode ? "text-white hover:bg-white/10" : "text-secondary hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("p-2 rounded-xl transition-colors", collabMode ? "bg-white/10 group-hover:bg-white/20 text-white" : "bg-slate-100 group-hover:bg-slate-200 text-slate-600")}>
                            <Settings className="w-4 h-4" />
                          </div>
                          Settings
                        </button>

                        <button 
                          onClick={() => {
                            onShare();
                            setIsMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors group",
                            collabMode ? "text-white hover:bg-white/10" : "text-secondary hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("p-2 rounded-xl transition-colors", collabMode ? "bg-white/10 group-hover:bg-white/20 text-white" : "bg-slate-100 group-hover:bg-slate-200 text-slate-600")}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          Share Profile
                        </button>

                        <div className={cn("my-2 border-t", collabMode ? "border-white/10" : "border-slate-100")} />

                        <button 
                          onClick={() => {
                            onLogout();
                            setIsMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors group text-red-500 hover:bg-red-50",
                            collabMode && "hover:bg-red-500/10"
                          )}
                        >
                          <div className={cn("p-2 rounded-xl bg-red-100 text-red-500 group-hover:bg-red-200 transition-colors", collabMode && "bg-red-500/10 group-hover:bg-red-500/20")}>
                            <LogOut className="w-4 h-4" />
                          </div>
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
      </header>

      {/* Collab Mode Specific Sections */}
      {collabMode && (
        <section className="bg-white/10 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] border border-white/10 text-white relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Collab Focus Badges</h3>
            <div className="flex flex-wrap gap-3">
              {(currentUser.badges || []).map(badge => (
                <Badge key={badge} name={badge} size="sm" />
              ))}
            </div>
          </div>
          <Award className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5" />
        </section>
      )}

      {/* Collab Card Section */}
      {collabMode && (
        <section className={cn(
          "rounded-[2.5rem] p-6 md:p-8 border transition-all shadow-2xl",
          "bg-[#004d55] border-white/10 text-white"
        )}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Collab Card</h3>
                <p className="text-xs text-white/40">Your professional identity for the Tribe.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setEditProfile({ 
                  collabCard: currentUser.collabCard || { occupation: '', superpowers: [], currentMission: '', linkedInUrl: '' },
                  openToCollabs: currentUser.openToCollabs || false
                });
                setIsEditCollabCardOpen(true);
              }}
              className="font-bold text-sm flex items-center gap-2 px-4 py-2 rounded-xl transition-colors bg-white/10 text-[#e9c46a] hover:bg-white/20"
            >
              <Edit2 className="w-4 h-4" />
              Edit Card
            </button>
          </div>

          {currentUser.collabCard?.occupation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Currently</p>
                  <p className="text-xl font-bold text-white">{currentUser.collabCard.occupation}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Current Mission</p>
                  <p className="text-sm leading-relaxed italic text-white/60">"{currentUser.collabCard.currentMission}"</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Superpowers</p>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.collabCard.superpowers.map(skill => (
                      <span key={skill} className="px-3 py-1 rounded-lg text-xs font-bold bg-[#e9c46a] text-[#264653]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {currentUser.collabCard.linkedInUrl && (
                  <a 
                    href={currentUser.collabCard.linkedInUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-bold text-sm text-[#e9c46a]"
                  >
                    <Globe className="w-4 h-4" />
                    View LinkedIn
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center rounded-3xl border border-dashed bg-white/5 border-white/10">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-white/20" />
              <p className="text-sm max-w-xs mx-auto mb-6 text-white/40">You haven't set up your Collab Card yet. Add your skills to meet professional matches.</p>
              <button 
                onClick={() => setIsEditCollabCardOpen(true)}
                className="px-8 py-3 rounded-2xl font-bold text-sm shadow-lg bg-[#e9c46a] text-[#264653]"
              >
                Set Up Card
              </button>
            </div>
          )}
        </section>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {/* Collab Card Modal */}
      <Modal isOpen={isEditCollabCardOpen} onClose={() => setIsEditCollabCardOpen(false)} title="Edit Collab Card" dark={collabMode}>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className={cn("block text-xs font-black uppercase tracking-widest mb-2", collabMode ? "text-white/40" : "text-slate-400")}>Occupation</label>
              <select 
                value={editProfile.collabCard?.occupation || ''}
                onChange={(e) => setEditProfile(prev => ({ 
                  ...prev, 
                  collabCard: { ...prev.collabCard!, occupation: e.target.value } 
                }))}
                className={cn(
                  "w-full rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2",
                  collabMode ? "bg-white/10 border-white/10 text-white focus:ring-white/20" : "bg-slate-50 border-slate-100 text-secondary focus:ring-primary/20"
                )}
                required
              >
                <option value="" className={cn(collabMode ? "bg-[#004d55]" : "")}>Select Occupation</option>
                {occupations.map(occ => <option key={occ.id} value={occ.name} className={cn(collabMode ? "bg-[#004d55]" : "")}>{occ.name}</option>)}
              </select>
            </div>

            <div>
              <label className={cn("block text-xs font-black uppercase tracking-widest mb-2", collabMode ? "text-white/40" : "text-slate-400")}>Superpowers (Max 3)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(editProfile.collabCard?.superpowers || []).map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setEditProfile(prev => ({ 
                      ...prev, 
                      collabCard: { ...prev.collabCard!, superpowers: prev.collabCard!.superpowers.filter(s => s !== skill) } 
                    }))}
                    className="bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
                  >
                    {skill}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
              {(editProfile.collabCard?.superpowers || []).length < 3 && (
                <select 
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !editProfile.collabCard?.superpowers.includes(e.target.value)) {
                      setEditProfile(prev => ({ 
                        ...prev, 
                        collabCard: { ...prev.collabCard!, superpowers: [...prev.collabCard!.superpowers, e.target.value] } 
                      }));
                    }
                  }}
                  className={cn(
                    "w-full rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2",
                    collabMode ? "bg-white/10 border-white/10 text-white focus:ring-white/20" : "bg-slate-50 border-slate-100 text-secondary focus:ring-primary/20"
                  )}
                >
                  <option value="" className={cn(collabMode ? "bg-[#004d55]" : "")}>Add Superpower...</option>
                  {skillsSeed.filter(s => !editProfile.collabCard?.superpowers.includes(s)).map(skill => (
                    <option key={skill} value={skill} className={cn(collabMode ? "bg-[#004d55]" : "")}>{skill}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className={cn("block text-xs font-black uppercase tracking-widest mb-2", collabMode ? "text-white/40" : "text-slate-400")}>Current Mission</label>
              <textarea 
                value={editProfile.collabCard?.currentMission || ''}
                onChange={(e) => setEditProfile(prev => ({ 
                  ...prev, 
                  collabCard: { ...prev.collabCard!, currentMission: e.target.value } 
                }))}
                className={cn(
                  "w-full rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 h-24",
                  collabMode ? "bg-white/10 border-white/10 text-white focus:ring-white/20" : "bg-slate-50 border-slate-100 text-secondary focus:ring-primary/20"
                )}
                placeholder="What are you working on right now?"
                required
              />
            </div>

            <div>
              <label className={cn("block text-xs font-black uppercase tracking-widest mb-2", collabMode ? "text-white/40" : "text-slate-400")}>LinkedIn URL</label>
              <input 
                type="url"
                value={editProfile.collabCard?.linkedInUrl || ''}
                onChange={(e) => setEditProfile(prev => ({ 
                  ...prev, 
                  collabCard: { ...prev.collabCard!, linkedInUrl: e.target.value } 
                }))}
                className={cn(
                  "w-full rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2",
                  collabMode ? "bg-white/10 border-white/10 text-white focus:ring-white/20" : "bg-slate-50 border-slate-100 text-secondary focus:ring-primary/20"
                )}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            {/* Remote Worker Toggle */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-2xl border transition-colors",
              collabMode ? "bg-white/5 border-white/10" : "bg-amber-400/5 border-amber-400/10"
            )}>
              <div>
                <p className={cn("text-sm font-bold", collabMode ? "text-white" : "text-secondary")}>Remote Worker / Global Tribe</p>
                <p className={cn("text-[10px] font-medium", collabMode ? "text-white/40" : "text-slate-500")}>Show up worldwide, not just in your current city</p>
              </div>
              <button
                type="button"
                onClick={() => setEditProfile(prev => ({ 
                  ...prev, 
                  collabCard: { ...prev.collabCard!, isRemote: !prev.collabCard?.isRemote } 
                }))}
                className={cn(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  editProfile.collabCard?.isRemote ? (collabMode ? "bg-amber-400" : "bg-primary") : "bg-slate-200"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  editProfile.collabCard?.isRemote ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>

            <div className={cn(
              "flex items-center justify-between p-4 rounded-2xl border transition-colors",
              collabMode ? "bg-white/5 border-white/10" : "bg-[#006d77]/5 border-[#006d77]/10"
            )}>
              <div>
                <p className={cn("text-sm font-bold", collabMode ? "text-white" : "text-[#006d77]")}>Open to Collabs</p>
                <p className={cn("text-[10px] font-medium", collabMode ? "text-white/40" : "text-[#006d77]/60")}>Allow others to see your professional background</p>
              </div>
              <button
                type="button"
                onClick={() => setEditProfile(prev => ({ ...prev, openToCollabs: !prev.openToCollabs }))}
                className={cn(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  editProfile.openToCollabs ? "bg-[#006d77]" : "bg-slate-200"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  editProfile.openToCollabs ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={cn(
              "w-full py-4 rounded-3xl font-black text-sm shadow-xl transition-all active:scale-[0.98]",
              collabMode ? "bg-[#e9c46a] text-[#264653] shadow-black/20" : "bg-[#006d77] text-white shadow-[#006d77]/20"
            )}
          >
            Save Collab Card
          </button>
        </form>
      </Modal>

      <NotificationCenter 
        isOpen={isNotificationCenterOpen} 
        onClose={() => setIsNotificationCenterOpen(false)} 
        onOpenConnect={() => setIsConnectOpen(true)}
        onOpenVibeCheck={() => {
          setActiveTab('tribe');
          setIsNotificationCenterOpen(false);
          // Assuming TribeView is rendered when activeTab is tribe
        }}
      />

      <div className="space-y-8">
        {/* Badges & Reputation Section - Compact */}
        {!collabMode && (
          <section className="bg-secondary text-white p-4 md:p-6 rounded-[2.5rem] card-shadow relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-shrink-0">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                  <h3 className="font-black text-xs uppercase tracking-[0.1em]">Badges</h3>
                </div>
              </div>
              
              <div className="flex-1 flex flex-wrap gap-2 justify-center md:justify-start">
                {(currentUser.badges || []).map(badge => (
                  <Badge key={badge} name={badge} size="sm" />
                ))}
              </div>

              {badgeMotivation && (
                <div className="w-full md:w-auto">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3 animate-pulse">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", badgeMotivation.bg)}>
                      {React.cloneElement(badgeMotivation.icon as React.ReactElement<{ className?: string }>, { className: 'w-3 h-3' })}
                    </div>
                    <p className={cn("text-[10px] font-bold", badgeMotivation.color)}>{badgeMotivation.text}</p>
                  </div>
                </div>
              )}
            </div>
            <Award className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5" />
          </section>
        )}

        {/* Our Story - Full Width & Prominent */}
        {!collabMode && (
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 card-shadow space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-secondary">Our Story</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-lg">{currentUser.bio}</p>
          </section>
        )}

        {/* Ask Us About */}
        {!collabMode && currentUser.askUsAbout && (
          <section className="bg-accent/5 border border-accent/10 p-6 rounded-[2rem] space-y-3">
            <h3 className="text-xs font-black text-accent uppercase tracking-[0.2em] flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Ask us about...
            </h3>
            <p className="text-secondary font-bold text-lg leading-snug">{currentUser.askUsAbout}</p>
          </section>
        )}

        {/* Tribe */}
        {!collabMode && (
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 card-shadow space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-secondary">The Tribe</h2>
              <button onClick={() => {
                setEditTribe({ 
                  parents: [...(currentUser.parents || [])], 
                  kids: [...(currentUser.kids || [])] 
                });
                setIsEditTribeOpen(true);
              }} className="text-xs font-bold text-primary hover:underline">Edit Tribe</button>
            </div>
            
            <div className="space-y-6">
              {/* Parents Sub-section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentUser.parents.map((parent) => (
                    <div key={parent.id} className="bg-slate-50 p-6 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl overflow-hidden">
                          {parent.photoUrl ? (
                            <img src={parent.photoUrl} alt={parent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            parent.name[0]
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-secondary">{parent.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{parent.role}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parent.interests.map((interest, i) => (
                          <span key={i} className="text-[10px] bg-white text-slate-500 px-2 py-1 rounded-lg font-bold border border-slate-100">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kids Sub-section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kids</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentUser.kids.map((kid) => (
                    <div key={kid.id} className="bg-slate-50 p-6 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent font-black text-xl">
                            {kid.age}
                          </div>
                          <div>
                            <h4 className="font-bold text-secondary">{kid.age} Years Old</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kid.gender || 'Kid'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {kid.interests.map((interest, i) => (
                          <span key={i} className="text-[10px] bg-white text-slate-500 px-2 py-1 rounded-lg font-bold border border-slate-100">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Our Adventure */}
        <section className={cn(
          "p-8 rounded-[2.5rem] border space-y-6",
          collabMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-100 card-shadow"
        )}>
            <div className="flex justify-between items-center">
              <h2 className={cn("text-xl font-black", collabMode ? "text-white" : "text-secondary")}>Our Adventure</h2>
              <div className="flex gap-2">
                <button 
                  onClick={onSetLocation}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                    collabMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <MapPin className="w-4 h-4" /> Current Location
                </button>
                <button 
                  onClick={() => onAddTrip()}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform",
                    collabMode ? "bg-[#e9c46a] text-[#264653]" : "bg-primary text-white shadow-lg shadow-primary/20"
                  )}
                >
                  <Plus className="w-4 h-4" /> Add Trip
                </button>
              </div>
            </div>

            <div className="relative pl-8 space-y-8">
              {/* Timeline Road Line */}
              <div className={cn("absolute left-[15px] top-4 bottom-4 w-1 border-l-2 border-dashed", collabMode ? "border-white/20" : "border-slate-200")} />
              
              {/* Current Location */}
              {currentUser.currentLocation && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  <div className={cn("absolute -left-[25px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-4 shadow-sm z-10", collabMode ? "bg-[#e9c46a] border-[#006d77]" : "bg-accent border-white")} />
                  <div 
                    onClick={onSetLocation}
                    className={cn(
                      "p-5 rounded-3xl border relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform",
                      collabMode ? "bg-white/10 border-white/10" : "bg-accent text-white border-accent/20 card-shadow"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Navigation className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-lg">Now</span>
                    </div>
                    <h4 className="font-bold text-lg relative z-10">{currentUser.currentLocation.name}</h4>
                    <p className={cn("text-xs mt-1 font-bold relative z-10", collabMode ? "text-white/60" : "text-white/60")}>
                      Updated {currentUser.currentLocation.updatedAt ? format(parseISO(currentUser.currentLocation.updatedAt), 'MMM d, HH:mm') : 'Recently'}
                    </p>
                    <Globe className="absolute -bottom-2 -right-2 w-16 h-16 opacity-10" />
                  </div>
                  
                  {/* Vibe Check & Verification for Current Location */}
                  {(() => {
                    const dest = destinations.find(d => d.cityName.toLowerCase() === currentUser.currentLocation?.name.toLowerCase());
                    if (dest) {
                      return (
                        <div className="mt-4">
                          <VibeCheckSection dest={dest} />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </motion.div>
              )}

              {/* Future Trips Timeline */}
              {sortedTrips.map((trip, index) => (
                <motion.div 
                  key={trip.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className={cn("absolute -left-[25px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-4 shadow-sm z-10", collabMode ? "bg-white/40 border-[#006d77]" : "bg-primary border-white")} />
                  <div 
                    onClick={() => onEditTrip(trip)}
                    className={cn(
                      "p-5 rounded-3xl border group relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform",
                      collabMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 card-shadow text-secondary"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", collabMode ? "bg-white/10" : "bg-primary/10 text-primary")}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrip(trip.id);
                          }}
                          className={cn("p-2 transition-colors", collabMode ? "text-white/40 hover:text-red-400" : "text-slate-300 hover:text-red-500")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg relative z-10">{trip.location}</h4>
                    <p className={cn("text-xs mt-1 font-bold relative z-10", collabMode ? "text-white/40" : "text-slate-500")}>
                      {(() => {
                        try {
                          return `${format(parseISO(trip.startDate), 'MMM d')} — ${format(parseISO(trip.endDate), 'MMM d, yyyy')}`;
                        } catch (e) {
                          return `${trip.startDate} — ${trip.endDate}`;
                        }
                      })()}
                    </p>
                    <MapPin className="absolute -bottom-2 -right-2 w-16 h-16 opacity-5" />
                  </div>
                </motion.div>
              ))}

              {sortedTrips.length === 0 && !currentUser.currentLocation && (
                <div className={cn("py-16 text-center rounded-[2.5rem] border-2 border-dashed flex flex-col items-center gap-4", collabMode ? "bg-white/5 border-white/10 border-white/20" : "bg-slate-50 border-slate-200")}>
                  <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center", collabMode ? "bg-white/10" : "bg-white shadow-xl text-slate-300")}>
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <p className={cn("text-lg font-black", collabMode ? "text-white" : "text-secondary")}>Where are you now?</p>
                    <p className={cn("text-sm font-medium max-w-xs mx-auto px-4", collabMode ? "text-white/40" : "text-slate-400")}>Add your current location to see families nearby and get local guidance.</p>
                  </div>
                  <button 
                    onClick={onSetLocation}
                    className={cn(
                      "px-8 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-transform mt-2",
                      collabMode ? "bg-[#e9c46a] text-[#264653]" : "bg-primary text-white shadow-primary/20"
                    )}
                  >
                    Set Current Location
                  </button>
                </div>
              )}
            </div>
          </section>
      </div>

      {/* Modals */}
      {/* Trip modal moved to App level */}

      <Modal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} title="Edit Family Profile">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Family Name</label>
            <input 
              required
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={editProfile.familyName || ''}
              onChange={e => setEditProfile(prev => ({...prev, familyName: e.target.value}))}
            />
          </div>
          <div className="space-y-1">
            <ImageUpload label="Profile Picture" onUpload={(url) => {
              console.log("Profile picture uploaded:", url.substring(0, 50) + "...");
              setEditProfile(prev => ({...prev, photoUrl: url}));
            }} />
            {editProfile.photoUrl && (
              <div className="w-24 h-24 rounded-[2rem] overflow-hidden mx-auto border-4 border-white shadow-lg mt-2">
                <img 
                  src={editProfile.photoUrl} 
                  onError={(e) => {
                    console.error("Image preview error, falling back to placeholder");
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/preview/200/200`;
                  }}
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Our Story (Bio)</label>
            <textarea 
              required
              rows={3}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              value={editProfile.bio || ''}
              onChange={e => setEditProfile(prev => ({...prev, bio: e.target.value}))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Why we travel (comma separated)</label>
            <textarea 
              required
              rows={2}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none font-bold text-sm"
              value={editProfile.travelReasons?.join(', ') || ''}
              onChange={e => setEditProfile(prev => ({...prev, travelReasons: e.target.value.split(',').map(r => r.trim())}))}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ask us about...</label>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={editProfile.askUsAbout || ''}
              onChange={e => setEditProfile(prev => ({...prev, askUsAbout: e.target.value}))}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Professional Networking</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupation</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                value={editProfile.collabCard?.occupation || ''}
                onChange={e => setEditProfile(prev => ({
                  ...prev, 
                  collabCard: {
                    ...(prev.collabCard || { superpowers: [], currentMission: '', linkedInUrl: '' }),
                    occupation: e.target.value
                  }
                }))}
              >
                <option value="">Select Occupation</option>
                {occupations.map(occ => (
                  <option key={occ.id} value={occ.name}>{occ.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <h4 className="font-bold text-secondary text-sm">Open to Collabs</h4>
                <p className="text-[10px] text-slate-500 font-medium">Allow others to see your professional background</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditProfile(prev => ({
                  ...prev,
                  openToCollabs: !prev.openToCollabs
                }))}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  editProfile.openToCollabs ? "bg-primary" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  editProfile.openToCollabs ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20 active:scale-95 transition-transform">
            Update Profile
          </button>
        </form>
      </Modal>

      <Modal isOpen={isEditTribeOpen} onClose={() => setIsEditTribeOpen(false)} title="The Tribe">
        <form onSubmit={handleUpdateTribe} className="space-y-8">
          {/* Parents Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Parents</h3>
              <button 
                type="button"
                onClick={() => {
                  console.log("Adding parent to edit state");
                  setEditTribe(prev => ({
                    ...prev, 
                    parents: [...(prev.parents || []), { id: `p-${Date.now()}`, name: '', role: 'Parent', interests: [], interestsString: '' }]
                  }));
                }}
                className="text-xs font-bold text-primary flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Parent
              </button>
            </div>
            <div className="space-y-3">
              {editTribe.parents.map((parent, index) => (
                <div key={parent.id} className="bg-slate-50 p-4 rounded-2xl space-y-3 relative group">
                  <button 
                    type="button"
                    onClick={() => setEditTribe(prev => ({
                      ...prev,
                      parents: prev.parents.filter((_, i) => i !== index)
                    }))}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Name"
                      className="p-2 bg-white border border-slate-100 rounded-lg text-sm font-bold"
                      value={parent.name}
                      onChange={e => {
                        const newParents = [...editTribe.parents];
                        newParents[index] = { ...newParents[index], name: e.target.value };
                        setEditTribe(prev => ({ ...prev, parents: newParents }));
                      }}
                    />
                    <input 
                      type="text" 
                      placeholder="Role (e.g. Mom)"
                      className="p-2 bg-white border border-slate-100 rounded-lg text-sm font-bold"
                      value={parent.role}
                      onChange={e => {
                        const newParents = [...editTribe.parents];
                        newParents[index] = { ...newParents[index], role: e.target.value };
                        setEditTribe(prev => ({ ...prev, parents: newParents }));
                      }}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Photo URL (optional)"
                    className="w-full p-2 bg-white border border-slate-100 rounded-lg text-sm font-bold"
                    value={parent.photoUrl || ''}
                    onChange={e => {
                      const newParents = [...editTribe.parents];
                      newParents[index] = { ...newParents[index], photoUrl: e.target.value };
                      setEditTribe(prev => ({ ...prev, parents: newParents }));
                    }}
                  />
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Interests</label>
                    <TagInput 
                      tags={parent.interests}
                      onChange={tags => {
                        const newParents = [...editTribe.parents];
                        newParents[index] = { ...newParents[index], interests: tags };
                        setEditTribe(prev => ({ ...prev, parents: newParents }));
                      }}
                      placeholder="Add interest (e.g. SEO, AI, Surfing)"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Occupation</label>
                      <select 
                        className="w-full p-2 bg-white border border-slate-100 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={parent.collabCard?.occupation || ''}
                        onChange={e => {
                          const newParents = [...editTribe.parents];
                          newParents[index] = { 
                            ...newParents[index], 
                            collabCard: {
                              ...(newParents[index].collabCard || { superpowers: [], currentMission: '', linkedInUrl: '' }),
                              occupation: e.target.value
                            } 
                          };
                          setEditTribe(prev => ({ ...prev, parents: newParents }));
                        }}
                      >
                        <option value="">Select Occupation</option>
                        {occupations.map(occ => (
                          <option key={occ.id} value={occ.name}>{occ.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kids Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Kids</h3>
              <button 
                type="button"
                onClick={() => {
                  console.log("Adding kid to edit state");
                  setEditTribe(prev => ({
                    ...prev, 
                    kids: [...(prev.kids || []), { id: `k-${Date.now()}`, age: 0, gender: 'Boy', interests: [], interestsString: '' }]
                  }));
                }}
                className="text-xs font-bold text-accent flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Kid
              </button>
            </div>
            <div className="space-y-3">
              {editTribe.kids.map((kid, index) => (
                <div key={kid.id} className="bg-slate-50 p-4 rounded-2xl space-y-3 relative group">
                  <button 
                    type="button"
                    onClick={() => setEditTribe(prev => ({
                      ...prev,
                      kids: prev.kids.filter((_, i) => i !== index)
                    }))}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Age</label>
                      <input 
                        type="number" 
                        className="w-full p-2 bg-white border border-slate-100 rounded-lg text-sm font-bold"
                        value={kid.age}
                        onChange={e => {
                          const newKids = [...editTribe.kids];
                          newKids[index] = { ...newKids[index], age: parseInt(e.target.value) || 0 };
                          setEditTribe(prev => ({ ...prev, kids: newKids }));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Gender</label>
                      <select 
                        className="w-full p-2 bg-white border border-slate-100 rounded-lg text-sm font-bold"
                        value={kid.gender}
                        onChange={e => {
                          const newKids = [...editTribe.kids];
                          newKids[index] = { ...newKids[index], gender: e.target.value as any };
                          setEditTribe(prev => ({ ...prev, kids: newKids }));
                        }}
                      >
                        <option value="Boy">Boy</option>
                        <option value="Girl">Girl</option>
                        <option value="Non-binary">Non-binary</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Interests</label>
                    <TagInput 
                      tags={kid.interests}
                      onChange={tags => {
                        const newKids = [...editTribe.kids];
                        newKids[index] = { ...newKids[index], interests: tags };
                        setEditTribe(prev => ({ ...prev, kids: newKids }));
                      }}
                      placeholder="Add interest (e.g. Coding, Math, Dinosaurs)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-accent text-white py-4 rounded-2xl font-bold shadow-lg shadow-accent/20 active:scale-95 transition-transform">
            Update Tribe
          </button>
        </form>
      </Modal>
    </div>
  );
};

const EditLocationModal = ({ 
  isOpen, 
  onClose, 
  onDetect, 
  onManual, 
  isDetecting, 
  manualLocation, 
  setManualLocation 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onDetect: () => void, 
  onManual: (e: React.FormEvent) => void,
  isDetecting: boolean,
  manualLocation: { name: string, lat: number, lng: number },
  setManualLocation: (val: { name: string, lat: number, lng: number }) => void
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Current Location">
      <div className="space-y-6">
        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
            <Navigation className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-secondary">Use GPS</h3>
            <p className="text-xs text-slate-500">Automatically detect your city and country.</p>
          </div>
          <button 
            disabled={isDetecting}
            onClick={onDetect}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98]",
              isDetecting 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-primary text-white shadow-primary/20 hover:scale-[1.02]"
            )}
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                Detect Location
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300 bg-white px-4">
            Or enter manually
          </div>
        </div>

        <form onSubmit={onManual} className="space-y-4">
          <LocationSelector 
            label="Stad, Land"
            placeholder="Bijv. Lissabon, Portugal"
            value={manualLocation.name}
            onChange={(val, coords) => setManualLocation({ name: val, lat: coords?.lat || 0, lng: coords?.lng || 0 })}
          />
          <button type="submit" className="w-full bg-secondary text-white py-4 rounded-2xl font-bold shadow-lg shadow-secondary/20 active:scale-95 transition-transform">
            Set Location
          </button>
        </form>
      </div>
    </Modal>
  );
};


const PioneerCelebrationModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pioneer Unlocked! 🏆">
      <div className="text-center space-y-6 py-4">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-accent rounded-[2.5rem] flex items-center justify-center text-white shadow-xl shadow-accent/30 animate-bounce">
            <Award className="w-12 h-12" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-4 border-white animate-pulse">
            <Star className="w-4 h-4 fill-current" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-secondary">You're a Pioneer!</h2>
          <p className="text-slate-500">
            By adding the first spot in this city, you've helped the entire Tribe grow.
          </p>
        </div>

        <div className="bg-accent/10 p-6 rounded-[2rem] border border-accent/20">
          <p className="text-accent font-black text-lg">30 Days Premium Unlocked</p>
          <p className="text-[10px] text-accent/60 uppercase tracking-widest font-bold">Enjoy free messaging & exclusive deals</p>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-secondary text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
        >
          Start Exploring Premium
        </button>
      </div>
    </Modal>
  );
};

const EmptyStatePioneer = ({ cityName, onAddSpot }: { cityName: string, onAddSpot: () => void }) => {
  return (
    <div className="bg-secondary text-white p-8 rounded-[3rem] card-shadow relative overflow-hidden text-center space-y-6">
      <div className="relative z-10">
        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-white/20">
          <Award className="w-10 h-10 text-accent" />
        </div>
        <h3 className="text-2xl font-black">Be the Pioneer for {cityName}!</h3>
        <p className="text-white/70 max-w-md mx-auto text-sm">
          Add the first Kid-Friendly Spot and instantly unlock <span className="text-accent font-bold">1 Month of Premium Tribe Access</span>.
        </p>
        <button 
          onClick={onAddSpot}
          className="mt-6 bg-accent text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
        >
          <Plus className="w-5 h-5" /> Add First Spot
        </button>
      </div>
      <Globe className="absolute -bottom-8 -right-8 w-48 h-48 text-white/5" />
    </div>
  );
};
const ExploreView = ({ onAddTrip }: { onAddTrip: (city: string) => void }) => {
  const { spots, currentUser, cities: cityProfiles, cityEvents, collabMode, rsvpToCityEvent } = useNomadStore() as any;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityProfile | null>(null);
  const [activeContinent, setActiveContinent] = useState<'Alle' | 'Azië' | 'Europa' | 'Amerika' | 'Afrika' | 'Oceanië'>('Alle');

  const continents = ['Alle', 'Azië', 'Europa', 'Amerika', 'Afrika', 'Oceanië'] as const;

  const filteredCities = useMemo(() => {
    if (!searchQuery) return [];
    return cityProfiles.filter((c: any) => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.country.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, cityProfiles]);

  const dashboardCities = useMemo(() => {
    let list = cityProfiles;
    if (activeContinent !== 'Alle') {
      list = list.filter((c: any) => c.continent === activeContinent);
    }
    return list;
  }, [activeContinent, cityProfiles]);

  if (selectedCity) {
    return (
      <CityPage 
        city={selectedCity} 
        onBack={() => setSelectedCity(null)}
        onAddTrip={onAddTrip}
      />
    );
  }

  return (
    <div className={cn(
      "p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-24 md:pb-8 transition-colors duration-500 min-h-full",
      collabMode ? "bg-[#006d77] text-white" : "text-slate-900"
    )}>
      <header className="space-y-6">
        <div>
          <h1 className={cn("text-3xl font-black tracking-tight", collabMode ? "text-white" : "text-secondary")}>Explore Hubs</h1>
          <p className={cn("font-medium", collabMode ? "text-white/60" : "text-slate-500")}>
            {collabMode ? "Identify your next professional hub" : "Research your next family adventure"}
          </p>
        </div>

        <div className="relative">
          <div className="relative">
            <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", collabMode ? "text-white/40" : "text-slate-400")} />
            <input 
              type="text"
              placeholder="Zoek hubs..."
              className={cn(
                "w-full pl-12 pr-4 py-4 rounded-[2rem] card-shadow focus:outline-none focus:ring-2 transition-all font-bold",
                collabMode 
                  ? "bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:ring-white/20" 
                  : "bg-white border-slate-100 text-secondary focus:ring-primary/20"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <AnimatePresence>
            {filteredCities.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-slate-100 shadow-xl z-50 overflow-hidden"
              >
                {filteredCities.map((city: any) => (
                  <button
                    key={city.id}
                    onClick={() => {
                      setSelectedCity(city);
                      setSearchQuery('');
                    }}
                    className="w-full p-4 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <p className="font-bold text-secondary">{city.name}</p>
                      <p className="text-xs text-slate-400">{city.country}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {continents.map(continent => (
            <button
              key={continent}
              onClick={() => setActiveContinent(continent)}
              className={cn(
                "px-5 py-2.5 rounded-full font-black text-xs transition-all border whitespace-nowrap",
                activeContinent === continent 
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                  : (collabMode ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200")
              )}
            >
              {continent}
            </button>
          ))}
        </div>
      </header>

      {/* Recommended Hubs */}
      <section className="space-y-6">
        <h2 className={cn("text-xs font-black uppercase tracking-[0.2em]", collabMode ? "text-white/40" : "text-slate-400")}>
          {activeContinent === 'Alle' ? 'Recommended Hubs' : `${activeContinent} Hubs`}
        </h2>
        
        {dashboardCities.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-200 mx-auto shadow-sm">
                <Globe className="w-10 h-10" />
             </div>
             <p className="text-slate-400 font-bold">Soon more hubs in this region!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {dashboardCities.map((city: any) => (
              <motion.div
                key={city.id}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedCity(city)}
                className={cn(
                  "rounded-[2.5rem] overflow-hidden border cursor-pointer transition-all flex flex-col h-full",
                  collabMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 card-shadow"
                )}
              >
                <div className="h-48 relative bg-slate-100">
                  <img 
                    src={city.coverImageUrl || `https://picsum.photos/seed/${city.id}/600/450`} 
                    alt={city.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-secondary">
                    ⭐ {city.nomadScore}
                  </div>
                </div>
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-secondary">{city.name}</h3>
                    <p className="text-xs text-slate-400 font-bold">{city.country}</p>
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[10px] font-black text-slate-500">{city.familyCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[10px] font-black text-slate-500">{city.spotCount}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const CityPage = ({ city, onBack, onAddTrip }: { city: CityProfile, onBack: () => void, onAddTrip: (city: string) => void }) => {
  const { spots, cityEvents, rsvpToCityEvent, collabMode } = useNomadStore() as any;
  const [activeFilter, setActiveFilter] = useState<'All' | SpotCategory>('All');
  
  const citySpots = useMemo(() => {
    return spots.filter((s: Spot) => s.citySlug === city.id || s.name.toLowerCase().includes(city.name.toLowerCase()));
  }, [city, spots]);

  const filteredSpots = useMemo(() => {
    if (activeFilter === 'All') return citySpots;
    return citySpots.filter((s: Spot) => s.category === activeFilter);
  }, [citySpots, activeFilter]);

  const events = useMemo(() => {
    return cityEvents.filter((e: CityEvent) => e.citySlug === city.id);
  }, [city, cityEvents]);

  return (
    <div className={cn(
      "min-h-full pb-24 md:pb-8 transition-colors duration-500",
      collabMode ? "bg-[#006d77] text-white" : "bg-slate-50/50"
    )}>
      {/* Hero Banner */}
      <div className="h-[350px] relative">
        <img 
          src={city.coverImageUrl || `https://picsum.photos/seed/${city.id}/1200/800`} 
          alt={city.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all text-white border border-white/20 shadow-xl z-20"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="absolute bottom-12 left-8 md:left-12 right-8 md:right-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                 <h1 className="text-5xl font-black text-white tracking-tight">{city.name}</h1>
                 <div className="px-4 py-1.5 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                    ⭐ {city.nomadScore} Hub Score
                 </div>
              </div>
              <p className="text-xl text-white/80 font-bold">{city.country} • {city.continent}</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => onAddTrip(city.name)}
                className="bg-primary text-white px-8 py-4 rounded-[1.5rem] font-black shadow-2xl shadow-primary/40 flex items-center gap-3 hover:scale-105 transition-transform"
              >
                <Calendar className="w-5 h-5" /> Plan Trip
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-12 -mt-8 relative z-10 space-y-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Goedkoop eten', value: `€${city.costOfLiving.localMeal.toFixed(0)} avg`, icon: Coffee, color: 'bg-amber-400' },
            { label: 'Air Quality', value: `${city.airQuality.status} (${city.airQuality.aqi})`, icon: Globe, color: 'bg-green-500' },
            { label: 'Vibe Score', value: `${city.vibeScore}/10`, icon: Zap, color: 'bg-indigo-500' },
            { label: 'Families', value: `${city.familyCount} Tribers`, icon: Users, color: 'bg-primary' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl flex items-center gap-4 group">
               <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110", stat.color)}>
                  <stat.icon className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-sm font-black text-secondary">{stat.value}</p>
               </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-12">
             <section className="space-y-6">
                <h2 className="text-2xl font-black text-secondary tracking-tight">Neighborhood Guide</h2>
                <div className="h-[400px] rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl">
                   <MapView center={city.coordinates} />
                </div>
             </section>

             <section className="space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-black text-secondary tracking-tight">Hub Calendar</h2>
                </div>
                {events.length === 0 ? (
                  <div className="bg-white p-12 rounded-[3rem] border border-slate-100 text-center space-y-4">
                     <p className="text-slate-500 font-bold italic">No events planned this week.</p>
                     <button className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Become an Organizer</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event: any) => (
                      <div key={event.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                         <div className="space-y-3">
                            <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block">
                               {event.category}
                            </div>
                            <h3 className="text-lg font-black text-secondary leading-tight">{event.title}</h3>
                            <p className="text-xs text-slate-400 font-bold">{event.time} • {event.recurrence.frequency}</p>
                         </div>
                         <button 
                            onClick={() => rsvpToCityEvent(event.id)}
                            className="mt-4 w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                         >
                            Bijwonen ({event.rsvps?.length || 0})
                         </button>
                      </div>
                    ))}
                  </div>
                )}
             </section>

             <section className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <h2 className="text-2xl font-black text-secondary tracking-tight">Kindvriendelijke Plekken</h2>
                   <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {['All', 'Playground', 'Cafe', 'Restaurant', 'Workspace'].map(f => (
                        <button 
                          key={f}
                          onClick={() => setActiveFilter(f as any)}
                          className={cn(
                            "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                            activeFilter === f ? "bg-secondary text-white border-secondary" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                   </div>
                </div>

                {filteredSpots.length === 0 ? (
                   <div className="bg-white p-12 rounded-[3rem] border border-slate-100 text-center">
                      <p className="text-slate-400 font-bold">More geverifieerde spots binnenkort!</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredSpots.map((spot: Spot) => (
                        <div key={spot.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-lg transition-transform hover:scale-[1.02] group cursor-pointer">
                           <div className="h-48 rounded-2xl overflow-hidden mb-4 relative bg-slate-100">
                              <img src={spot.imageUrl || `https://picsum.photos/seed/${spot.id}/800/600`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute top-4 right-4 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[9px] font-black text-secondary">
                                 ⭐ {spot.rating}
                              </div>
                           </div>
                           <h3 className="font-black text-secondary px-2">{spot.name}</h3>
                           <p className="text-[10px] text-slate-400 font-bold px-2 mb-2 uppercase tracking-widest">{spot.category}</p>
                           <p className="text-xs text-slate-500 font-medium px-2 line-clamp-2">{spot.description}</p>
                        </div>
                      ))}
                   </div>
                )}
             </section>
           </div>

           <div className="space-y-8">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                   <ShoppingBag className="w-5 h-5 text-amber-500" />
                   <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest">Kosten Gids</h3>
                </div>
                <div className="space-y-4">
                   {[
                     { label: 'Eenvoudige Maaltijd', value: `€${city.costOfLiving.localMeal.toFixed(2)}` },
                     { label: 'Goede Cappuccino', value: `€${city.costOfLiving.coffee.toFixed(2)}` },
                     { label: 'Grote Pizza', value: `€${city.costOfLiving.pizza.toFixed(2)}` },
                     { label: 'Apt (1 slk)', value: `€${city.costOfLiving.oneBedApartment.toFixed(0)}` },
                     { label: 'Internet', value: `€${city.costOfLiving.internet50mbps.toFixed(2)}` },
                   ].map((item, i) => (
                     <div key={i} className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <p className="text-[10px] font-bold text-slate-500">{item.label}</p>
                        <p className="text-[10px] font-black text-secondary">{item.value}</p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-secondary p-8 rounded-[3rem] border border-secondary/20 shadow-2xl text-white space-y-6">
                <div className="flex items-center gap-3">
                   <ShieldCheck className="w-5 h-5 text-amber-400" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50">Safety & Infra</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                       <p className="text-[8px] text-white/40 font-black uppercase mb-1">Safety</p>
                       <p className="text-lg font-black">{city.safety.safetyIndex}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                       <p className="text-[8px] text-white/40 font-black uppercase mb-1">Crime</p>
                       <p className="text-lg font-black">{city.safety.crimeIndex}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <Navigation className={cn("w-4 h-4", city.infrastructure.drivingSide === 'right' ? 'text-green-400' : 'text-amber-400')} />
                       <p className="text-[10px] font-bold text-white/80">Driving on the {city.infrastructure.drivingSide}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                       <Globe className="w-4 h-4 text-blue-400" />
                       <p className="text-[10px] font-bold text-white/80">Timezone: {city.infrastructure.timezone}</p>
                    </div>
                  </div>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                   <BookOpen className="w-5 h-5 text-primary" />
                   <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest">Onderwijs</h3>
                </div>
                <div className="space-y-3">
                   {(city.internationalSchools || []).length === 0 ? (
                      <p className="text-[10px] text-slate-400 font-medium italic">No verified schools yet.</p>
                   ) : (
                     city.internationalSchools.map((s, i) => (
                       <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 group hover:bg-slate-100 transition-colors cursor-pointer">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <p className="text-[10px] font-black text-secondary truncate">{s}</p>
                       </div>
                     ))
                   )}
                </div>
             </div>
           </div>
        </div>

        <footer className="pt-12 border-t border-slate-200/60 pb-8 text-center space-y-2 opacity-50">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Tribe Ecosystem Intelligence</p>
        </footer>
      </div>
    </div>
  );
};

// --- Main App ---

import { auth, googleProvider, facebookProvider, appleProvider } from './firebase';
import { signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';

const WelcomeModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return null;
};

// ... existing code ...

export default function App() {
  const { 
    currentUser, 
    init, 
    isAuthReady, 
    requestConnection, 
    connections, 
    acceptConnection, 
    addTrip, 
    updateTrip, 
    calculateBadges,
    notifications,
    collabMode,
    setCollabMode,
    addToast,
    sendMessage,
    collabEndorsements,
    conversations,
    isLocationModalOpen,
    setIsLocationModalOpen,
    cancelConnection,
    profiles
  } = useNomadStore();
  const [activeTab, setActiveTab] = useState<'tribe' | 'connect' | 'tribe-nearby' | 'explore' | 'profile' | 'marketplace' | 'deals' | 'admin'>('tribe');
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<FamilyProfile | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [isRecommendSpotOpen, setIsRecommendSpotOpen] = useState(false);
  const [newSpot, setNewSpot] = useState({ name: '', description: '', category: 'Playground' as any, imageUrl: '', locationName: '', lat: 0, lng: 0 });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState({ name: '', lat: 0, lng: 0 });

  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({ id: '', location: '', startDate: '', endDate: '', lat: 0, lng: 0 });
  const [reportingTarget, setReportingTarget] = useState<{ id: string, type: Report['targetType'] } | null>(null);

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const trip: Trip = {
        id: newTrip.id || `trip-${Date.now()}`,
        familyId: currentUser.id,
        location: newTrip.location,
        coordinates: { lat: newTrip.lat, lng: newTrip.lng },
        startDate: newTrip.startDate,
        endDate: newTrip.endDate
      };
      
      if (newTrip.id) {
        await updateTrip(trip);
      } else {
        await addTrip(trip);
      }
      
      setIsAddTripOpen(false);
      setNewTrip({ id: '', location: '', startDate: '', endDate: '', lat: 0, lng: 0 });
    } catch (err) {
      console.error("Error saving trip:", err);
      addToast("Trip opslaan mislukt.", "error");
    }
  };

  useEffect(() => {
    init();
    calculateBadges();
    const { seedInitialData } = useNomadStore.getState() as any;
    seedInitialData?.();
  }, []);

  // --- Real-time Notification Watcher ---
  const prevNotificationsRef = useRef(notifications);
  useEffect(() => {
    if (currentUser) {
      const newNotifications = notifications.filter(n => 
        !n.isRead && 
        !prevNotificationsRef.current.some(prev => prev.id === n.id)
      );
      
      newNotifications.forEach(n => {
        addToast(n.message, "info");
      });
      
      prevNotificationsRef.current = notifications;
    }
  }, [notifications, currentUser, addToast]);

  // --- Connection Request Watcher ---
  const prevConnectionsCount = useRef(connections.length);
  useEffect(() => {
    if (currentUser) {
      const pendingIncoming = connections.filter(c => c.recipientId === currentUser.id && c.status === 'pending');
      const prevPendingIncoming = prevNotificationsRef.current.filter((n: any) => n.type === 'ConnectionRequest').length; // Fallback or check count
      
      // If connections length increased and we have a new pending request from someone else
      if (connections.length > prevConnectionsCount.current) {
         const latest = pendingIncoming[0];
         if (latest) {
           const requester = profiles.find(p => p.id === latest.requesterId);
           if (requester) {
             addToast(`${requester.familyName} wil met je connecten! Klik op de chat om te accepteren.`, "info");
           }
         }
      }
      prevConnectionsCount.current = connections.length;
    }
  }, [connections.length, currentUser, profiles, addToast]);

  const handleLogin = async (provider: 'google' | 'facebook' | 'apple' = 'google') => {
    if (isLoggingIn) return;

    const isIframe = window.self !== window.top;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isIframe && isMobile) {
      addToast("Tip: Als het inloggen in dit venster niet lukt, gebruik dan de 'Open in nieuw tabblad' knop.", "info");
    }

    setIsLoggingIn(true);
    
    let authProvider: any = googleProvider;
    if (provider === 'facebook') authProvider = facebookProvider;
    if (provider === 'apple') authProvider = appleProvider;

    try {
      const result = await signInWithPopup(auth, authProvider);
      if (result.user) {
        addToast(`Welkom terug, ${result.user.displayName}!`, "success");
        // Give a moment for the toast then force a clean reload for state consistency
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setIsLoggingIn(false);
      }
    } catch (error: any) {
      setIsLoggingIn(false);
      console.error("Login Error Details:", error);

      if (error.code === 'auth/operation-not-allowed') {
        addToast(`Deze inlogmethode (${provider}) is nog niet ingeschakeld in de Firebase Console. Ga naar 'Authentication' > 'Sign-in method' en schakel ${provider} in.`, "error");
      } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        if (isMobile || isIframe) {
          try {
            addToast("Popup geblokkeerd. We proberen het nu via een redirect...", "info");
            await signInWithRedirect(auth, authProvider);
          } catch (redirectError: any) {
             console.error("Redirect fallback failed:", redirectError);
             addToast("Inloggen mislukt. Open de app in een nieuw tabblad.", "error");
          }
        } else {
          addToast("Inlogvenster gesloten of geblokkeerd.", "error");
        }
      } else if (error.code === 'auth/unauthorized-domain') {
        addToast(`403 Fout: Domein niet geautoriseerd. Voeg exact '${window.location.hostname}' toe aan 'Authorized Domains'.`, "error");
      } else {
        addToast(`Login mislukt: ${error.message}.`, "error");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleContactSeller = async (item: MarketItem) => {
    try {
      await requestConnection(item.sellerId);
      setIsConnectOpen(true);
    } catch (error) {
      console.error("Failed to contact seller:", error);
    }
  };

  const handleSayHello = async (family: FamilyProfile, message?: string) => {
    const connectionId = `conn-${[currentUser?.id, family.id].sort().join('-')}`;
    const existing = useNomadStore.getState().connections.find(c => c.id === connectionId);

    if (existing?.status === 'accepted') {
      if (message) {
        // If there's an existing conversation, we can send the message
        const convoId = `convo-${connectionId}`;
        await sendMessage(convoId, message);
      }
      setIsConnectOpen(true);
      return;
    }

    try {
      await requestConnection(family.id);
      if (message) {
        // We can't send a message until accepted in this model, 
        // but we could store it or send it as part of the request meta if we updated schema.
        // For now, let's just alert or log that the request is sent.
        console.log("Requested connection with pre-filled message intent:", message);
      }
      setIsConnectOpen(true);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  if (isLoggingIn || !isAuthReady) {
    return <FullPageLoader message={!isAuthReady ? "Syncing with the Tribe..." : "Getting you in..."} />;
  }

  if (currentUser && !currentUser.hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  if (!currentUser) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-8 text-center space-y-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30"
        >
          <Users className="w-12 h-12" />
        </motion.div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-secondary tracking-tight">NomadTribe</h1>
          <p className="text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
            Connect with nomadic families, swap gear, and grow your professional network on the road.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <button 
            onClick={() => handleLogin('google')}
            disabled={isLoggingIn}
            className="w-full bg-white text-secondary py-4 rounded-2xl font-bold shadow-lg shadow-black/5 active:scale-95 transition-transform flex items-center justify-center gap-3 border border-slate-100"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleLogin('apple')}
              disabled={isLoggingIn}
              className="bg-black text-white py-4 rounded-2xl font-bold shadow-lg shadow-black/5 active:scale-95 transition-transform flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
              Apple
            </button>
            <button 
              onClick={() => handleLogin('facebook')}
              disabled={isLoggingIn}
              className="bg-[#1877F2] text-white py-4 rounded-2xl font-bold shadow-lg shadow-black/5 active:scale-95 transition-transform flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </div>
          <p className="text-[9px] text-slate-400 mt-4 px-6 text-center leading-tight">
            Let op: Facebook & Apple login vereisen handmatige configuratie van App ID's in de Firebase Console.
          </p>
        </div>

          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Login Problems?</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-primary hover:underline"
            >
              Stuck here? Refresh App
            </button>
          </div>

        {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
          <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-xs space-y-4 max-w-xs">
            <p className="text-slate-500 font-bold">Mobile Browser issues?</p>
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full py-3 bg-white text-secondary rounded-2xl font-black border border-slate-200 shadow-sm"
            >
              Open in new Tab
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleShareProfile = () => {
    const shareData = {
      title: 'NomadTribe Profile',
      text: `Check out ${currentUser?.familyName}'s profile on NomadTribe!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(err => {
        // Only log if it's not a user cancellation
        if (err.name !== 'AbortError') {
          console.error("Share failed:", err);
        }
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      addToast('Profiel link gekopieerd!', 'success');
    }).catch(() => {
      addToast('Kopiëren mislukt. Kopieer de URL uit de adresbalk.', 'error');
    });
  };

  const renderContent = () => {
    if (activeTab === 'admin' && currentUser?.role === 'SuperAdmin') return <AdminDashboard />;

    switch (activeTab) {
      case 'tribe': return (
        <TribeView 
          onViewAllMarketplace={() => setActiveTab('marketplace')} 
          onSayHello={handleSayHello}
          onSelectFamily={setSelectedFamily}
          onPaywall={() => setIsPaywallOpen(true)}
        />
      );
      case 'tribe-nearby': return (
        <TribeNearbyView 
          onPaywall={() => setIsPaywallOpen(true)} 
          onViewAllDeals={() => setActiveTab('deals')} 
          onRecommendSpot={() => setIsRecommendSpotOpen(true)}
          onViewAllMarketplace={() => setActiveTab('marketplace')}
          onContactSeller={handleContactSeller}
          onSetLocation={() => setIsLocationModalOpen(true)}
          onSelectFamily={setSelectedFamily}
          onSelectSpot={setSelectedSpot}
          onSelectItem={setSelectedItem}
        />
      );
      case 'profile': return (
        <ProfileView 
          onShare={handleShareProfile} 
          onLogout={handleLogout}
          onSetLocation={() => setIsLocationModalOpen(true)}
          onAddTrip={() => {
            setNewTrip({ id: '', location: '', startDate: '', endDate: '', lat: 0, lng: 0 });
            setIsAddTripOpen(true);
          }}
          onEditTrip={(trip) => {
            setNewTrip({ 
              id: trip.id, 
              location: trip.location, 
              startDate: trip.startDate, 
              endDate: trip.endDate, 
              lat: trip.coordinates?.lat || 0, 
              lng: trip.coordinates?.lng || 0 
            });
            setIsAddTripOpen(true);
          }}
          setIsNotificationCenterOpen={setIsNotificationCenterOpen}
          isNotificationCenterOpen={isNotificationCenterOpen}
          setIsConnectOpen={setIsConnectOpen}
        />
      );
      case 'explore': return (
        <ExploreView 
          onAddTrip={(city) => {
            setNewTrip({ id: '', location: city, startDate: '', endDate: '', lat: 0, lng: 0 });
            setIsAddTripOpen(true);
          }}
        />
      );
      case 'marketplace': return <MarketplaceView onBack={() => setActiveTab('tribe')} onContactSeller={handleContactSeller} collabMode={collabMode} onPaywall={() => setIsPaywallOpen(true)} />;
      case 'deals': return <DealsView onBack={() => setActiveTab('tribe-nearby')} onPaywall={() => setIsPaywallOpen(true)} />;
      case 'admin': return <AdminDashboard />;
      default: return (
        <TribeView 
          onViewAllMarketplace={() => setActiveTab('marketplace')} 
          onSayHello={handleSayHello}
          onSelectFamily={setSelectedFamily}
          onPaywall={() => setIsPaywallOpen(true)}
        />
      );
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      addToast("Geolocatie wordt niet ondersteund door je browser.", "error");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        
        // Robust address parsing
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.state_district || addr.state || 'Unknown City';
        const country = addr.country || 'Unknown Country';
        
        const locationName = `${city}, ${country}`;
        await useNomadStore.getState().updateProfile({
          currentLocation: {
            name: locationName,
            lat: latitude,
            lng: longitude,
            updatedAt: new Date().toISOString()
          }
        });
        setIsLocationModalOpen(false);
        addToast(`Locatie ingesteld op ${locationName}`, "success");
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        addToast("Stad/land ophalen mislukt. Voer het handmatig in.", "error");
      } finally {
        setIsDetectingLocation(false);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      setIsDetectingLocation(false);
      let msg = "Locatie ophalen mislukt.";
      if (error.code === 1) msg = "Locatie toegang geweigerd door gebruiker.";
      addToast(msg, "error");
    }, { timeout: 10000 });
  };

  const handleManualLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLocation.name) return;
    
    let lat = manualLocation.lat;
    let lng = manualLocation.lng;

    // Fallback: If lat/lng are 0, try to geocode the name first
    if (lat === 0 && lng === 0) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation.name)}&limit=1`);
        const data = await response.json();
        if (data && data[0]) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        }
      } catch (err) {
        console.error("Manual geocoding fallback failed:", err);
      }
    }

    try {
      await useNomadStore.getState().updateProfile({
        currentLocation: {
          name: manualLocation.name,
          lat: manualLocation.lat,
          lng: manualLocation.lng,
          updatedAt: new Date().toISOString()
        }
      });
      setIsLocationModalOpen(false);
      setManualLocation({ name: '', lat: 0, lng: 0 });
      addToast("Locatie handmatig ingesteld!", "success");
    } catch (err) {
      console.error("Error setting manual location:", err);
      addToast("Locatie instellen mislukt.", "error");
    }
  };

  return (
    <ErrorBoundary>
      <div className={cn(
        "flex flex-col md:flex-row h-screen text-slate-900 overflow-hidden transition-colors duration-500",
        collabMode ? "bg-[#006d77]" : "bg-background"
      )}>
        {/* Desktop Sidebar */}
        <aside className={cn(
          "hidden md:flex flex-col w-72 border-r p-6 z-50 transition-colors duration-500",
          collabMode ? "bg-[#004d55] border-white/10" : "bg-white border-slate-100"
        )}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Users className="w-6 h-6" />
          </div>
          <span className={cn("text-xl font-black tracking-tight", collabMode ? "text-white" : "text-secondary")}>NomadTribe</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarLink active={activeTab === 'tribe'} onClick={() => setActiveTab('tribe')} icon={<Radar />} label={collabMode ? "Matches" : "Tribe"} />
          <SidebarLink active={activeTab === 'tribe-nearby'} onClick={() => setActiveTab('tribe-nearby')} icon={<MapIcon />} label="Neighborhood" />
          <SidebarLink active={activeTab === 'explore'} onClick={() => setActiveTab('explore')} icon={<Globe />} label="Explore" />
          <SidebarLink active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={
            <div className="relative">
              <User />
              {notifications.filter(n => !n.isRead && new Date(n.scheduledFor) <= new Date()).length > 0 && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white" />
              )}
            </div>
          } label={collabMode ? "Collab Card" : "My Journey"} />
          {currentUser?.role === 'SuperAdmin' && (
            <SidebarLink active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Shield className="w-5 h-5" />} label="Super Admin" />
          )}
        </nav>

        <div className="space-y-4 pt-6">
          <div className={cn("p-1.5 rounded-2xl flex flex-col gap-1 shadow-inner", collabMode ? "bg-[#006d77]/20 border border-[#006d77]/10" : "bg-slate-100 border border-slate-200")}>
            <button 
              onClick={() => setCollabMode(false)}
              className={cn(
                "w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left",
                !collabMode ? "bg-white text-secondary shadow-md" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Family Focus
            </button>
            <button 
              onClick={() => setCollabMode(true)}
              className={cn(
                "w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 text-left",
                collabMode ? "bg-[#006d77] text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Briefcase className={cn("w-4 h-4", collabMode ? "text-white" : "text-slate-400")} />
              Collab Focus
              <span className="ml-auto bg-amber-400 text-[#264653] text-[8px] px-1 py-0.5 rounded-md font-black shadow-sm">BETA</span>
            </button>
          </div>

          <div className={cn(
            "p-4 rounded-3xl border transition-colors",
            collabMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100"
          )}>
            <p className={cn("text-xs font-bold uppercase tracking-widest mb-2", collabMode ? "text-white/40" : "text-slate-400")}>Beta Access</p>
            <p className={cn("text-xs leading-relaxed", collabMode ? "text-white/60" : "text-slate-500")}>You are helping shape the future of nomadic parenting.</p>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={cn(
        "fixed transition-all duration-500 ease-in-out left-0 right-0 md:hidden bottom-nav-shadow border-t z-[100]",
        isMenuOpen ? "bottom-0 h-48" : "bottom-0 h-20",
        collabMode ? "bg-[#006d77] border-[#005f6a]" : "bg-white border-slate-100"
      )}>
        <div className="flex items-center justify-around h-20 px-2 pb-6">
          <NavButton active={activeTab === 'tribe'} onClick={() => setActiveTab('tribe')} icon={<Radar className="w-6 h-6" />} label={collabMode ? "Matches" : "Tribe"} dark={collabMode} />
          <NavButton active={activeTab === 'tribe-nearby'} onClick={() => setActiveTab('tribe-nearby')} icon={<MapIcon className="w-6 h-6" />} label="Near" dark={collabMode} />
          <div className="flex flex-col items-center">
             <button 
               onClick={() => setIsMenuOpen(!isMenuOpen)}
               className={cn(
                 "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90",
                 collabMode ? "bg-white text-[#006d77] shadow-white/10" : "bg-primary text-white shadow-primary/20",
                 isMenuOpen && "rotate-180"
               )}
             >
               <ChevronUp className="w-6 h-6" />
             </button>
             <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-40">Focus</span>
          </div>
          <NavButton active={activeTab === 'explore'} onClick={() => setActiveTab('explore')} icon={<Globe className="w-6 h-6" />} label="Explore" dark={collabMode} />
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={
            <div className="relative">
              <User className="w-6 h-6" />
              {notifications.filter(n => !n.isRead && new Date(n.scheduledFor) <= new Date()).length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white" />
              )}
            </div>
          } label="Profile" dark={collabMode} />
        </div>

        {/* Expanded Focus Menu */}
        <div className={cn(
          "px-6 pt-2 pb-8 grid grid-cols-2 gap-4 transition-all duration-500",
          isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        )}>
           <button 
             onClick={() => {
               setCollabMode(false);
               setIsMenuOpen(false);
             }}
             className={cn(
               "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
               !collabMode 
                 ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                 : "bg-white/5 border-white/10 text-white/60"
             )}
           >
             <Home className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-widest">Family Focus</span>
           </button>
            <button 
              onClick={() => {
                setCollabMode(true);
                setIsMenuOpen(false);
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                collabMode 
                  ? "bg-[#e9c46a] text-[#264653] border-[#e9c46a] shadow-lg shadow-[#e9c46a]/20" 
                  : "bg-[#006d77]/5 border-[#006d77]/10 text-[#006d77]"
              )}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Collab Focus</span>
            </button>
            {currentUser?.role === 'SuperAdmin' && (
              <button 
                onClick={() => {
                  setActiveTab('admin');
                  setIsMenuOpen(false);
                }}
                className={cn(
                  "col-span-2 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                  activeTab === 'admin'
                    ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20"
                    : "bg-slate-50 border-slate-100 text-slate-400"
                )}
              >
                <Shield className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Super Admin Panel</span>
              </button>
            )}
        </div>
      </nav>

      {/* Global Modals */}
      <ToastContainer />
      <ReportModal isOpen={!!reportingTarget} onClose={() => setReportingTarget(null)} target={reportingTarget} />
      
      <Modal isOpen={!!selectedFamily} onClose={() => setSelectedFamily(null)} title={selectedFamily?.familyName || ''}>
        {selectedFamily && (
          <div className="space-y-6">
            <div className="flex justify-end -mt-2 -mr-2">
              <div className="relative group/menu">
                <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                  <MoreVertical className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 opacity-0 group-hover/menu:opacity-100 pointer-events-none group-hover/menu:pointer-events-auto transition-all z-[100] transform translate-y-2 group-hover/menu:translate-y-0">
                  <button 
                    onClick={() => {
                      setReportingTarget({ id: selectedFamily.id, type: 'User' });
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" /> Report family
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm(`Block ${selectedFamily.familyName}? They will no longer see you in their radar and vice versa.`)) {
                        await useNomadStore.getState().blockUser(selectedFamily.id);
                        setSelectedFamily(null);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> Block family
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden">
                <img 
                  src={selectedFamily.photoUrl || `https://picsum.photos/seed/${selectedFamily.id}/200/200`} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${selectedFamily.id}/200/200`;
                  }}
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{selectedFamily.nativeLanguage}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedFamily.role === 'SuperAdmin' && (
                    <span className="px-2 py-0.5 bg-secondary text-white rounded-full text-[8px] font-black uppercase tracking-widest">Super Admin</span>
                  )}
                  {selectedFamily.isPremium && (
                    <span className="px-2 py-0.5 bg-accent text-white rounded-full text-[8px] font-black uppercase tracking-widest">Premium</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 font-medium">{selectedFamily.bio}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">The Tribe</h4>
              <div className="flex flex-wrap gap-2">
                {selectedFamily.kids.map(k => (
                  <div key={k.id} className="bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-bold text-secondary">
                    {k.age}y {k.gender}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([
                  ...selectedFamily.parents.flatMap(p => p.interests),
                  ...selectedFamily.kids.flatMap(k => k.interests)
                ])).map((interest, i) => (
                  <span key={i} className="bg-primary/5 text-primary px-2 py-1 rounded-lg text-[10px] font-bold">
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {selectedFamily.collabCard && selectedFamily.openToCollabs && (
              <div className={cn(
                "p-6 rounded-[2.5rem] border space-y-4 transition-all relative overflow-hidden group",
                collabMode ? "bg-[#004d55] border-white/10 text-white shadow-xl" : "bg-slate-50 border-slate-100"
              )}>
                <div className="flex justify-between items-start relative z-10">
                   <div>
                     <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", collabMode ? "text-white/40" : "text-slate-400")}>Professional Profile</p>
                     <p className="font-bold text-lg">{selectedFamily.collabCard.occupation}</p>
                   </div>
                   <Briefcase className={cn("w-6 h-6", collabMode ? "text-white/20" : "text-slate-200")} />
                </div>
                
                <div className="space-y-3 relative z-10">
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", collabMode ? "text-white/40" : "text-slate-400")}>Superpowers</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFamily.collabCard.superpowers.map(skill => (
                      <button 
                        key={skill}
                        onClick={async () => {
                          if (currentUser && currentUser.id !== selectedFamily.id) {
                            const endId = `end-${currentUser.id}-${selectedFamily.id}-${skill}`;
                            if (!collabEndorsements.find(e => e.id === endId)) {
                                await useNomadStore.getState().addCollabEndorsement({
                                  id: endId,
                                  targetUserId: selectedFamily.id,
                                  authorId: currentUser.id,
                                  skill,
                                  comment: '',
                                  createdAt: new Date().toISOString()
                                });
                                useNomadStore.getState().addToast(`You endorsed ${selectedFamily.familyName} for ${skill}!`, "success");
                            } else {
                                useNomadStore.getState().addToast(`You already endorsed this skill!`, "info");
                            }
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2",
                          collabMode 
                            ? "bg-white/10 border-white/5 hover:bg-[#e9c46a] hover:text-[#264653]" 
                            : "bg-white border-slate-100 hover:border-primary/20 hover:text-primary"
                        )}
                      >
                        {skill}
                        <Award className={cn("w-3.5 h-3.5", collabMode ? "text-amber-400" : "text-slate-300")} />
                        <span className="text-[10px] font-black opacity-60">
                           {collabEndorsements.filter(e => e.targetUserId === selectedFamily.id && e.skill === skill).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 relative z-10">
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", collabMode ? "text-white/40" : "text-slate-400")}>Current Mission</p>
                  <p className={cn("text-xs italic", collabMode ? "text-white/80" : "text-slate-600")}>"{selectedFamily.collabCard.currentMission}"</p>
                </div>

                {selectedFamily.collabCard.linkedInUrl && (
                  <a 
                    href={selectedFamily.collabCard.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold pt-2 relative z-10",
                      collabMode ? "text-[#e9c46a]" : "text-primary"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    Professional Network Profile
                  </a>
                )}
                
                <Award className={cn("absolute -bottom-8 -right-8 w-32 h-32 opacity-[0.03] transition-transform group-hover:scale-110", collabMode ? "text-white" : "text-secondary")} />
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  handleSayHello(selectedFamily);
                  setSelectedFamily(null);
                }}
                className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20"
              >
                Message Family
              </button>
              {currentUser?.id !== selectedFamily.id && (
                <button 
                  onClick={async () => {
                    if (currentUser) {
                      await useNomadStore.getState().vouchForFamily(currentUser.id, selectedFamily.id);
                      useNomadStore.getState().addToast(`Je hebt ingestaan voor ${selectedFamily.familyName}!`, "success");
                    }
                  }}
                  className="px-4 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors"
                  title="Vouch for this family"
                >
                  <ShieldCheck className="w-6 h-6" />
                </button>
              )}
            </div>
            
            {currentUser?.id !== selectedFamily.id && (
              <button 
                onClick={() => {
                  setReportingTarget({ id: selectedFamily.id, type: 'User' });
                }}
                className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-400 transition-colors pt-2 underline underline-offset-4"
              >
                Report this profile
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={isRecommendSpotOpen} onClose={() => setIsRecommendSpotOpen(false)} title="Recommend a Spot">
        <form className="space-y-4" onSubmit={async (e) => { 
          e.preventDefault(); 
          if (!currentUser) return;

          if (containsBlockedContent(newSpot.name) || containsBlockedContent(newSpot.description)) {
            useNomadStore.getState().addToast("Your recommendation contains inappropriate language.", "error");
            return;
          }
          
          const spot: Spot = {
            id: `spot-${Date.now()}`,
            name: cleanContent(newSpot.name),
            description: cleanContent(newSpot.description),
            category: newSpot.category,
            imageUrl: newSpot.imageUrl,
            coordinates: { lat: newSpot.lat || 0, lng: newSpot.lng || 0 },
            verifiedTags: ['Community Recommended'],
            tags: [],
            rating: 5.0,
            recommendedBy: currentUser.id,
            citySlug: 'unknown',
            countryCode: 'XX',
            isVetted: false,
            reportCount: 0,
            isHidden: false,
            dataSource: 'ugc',
            viewCount: 0,
            saveCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await useNomadStore.getState().addSpot(spot);
          setIsRecommendSpotOpen(false); 
          setNewSpot({ name: '', description: '', category: 'Playground', imageUrl: '', locationName: '', lat: 0, lng: 0 });
          useNomadStore.getState().addToast("Bedankt voor je aanbeveling! Ons team zal het verifiëren.", "success"); 
        }}>
          <ImageUpload label="Spot Photo" onUpload={(url) => setNewSpot(prev => ({...prev, imageUrl: url}))} />
          {newSpot.imageUrl && (
            <div className="w-full h-32 rounded-2xl overflow-hidden">
              <img src={newSpot.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spot Name</label>
            <input 
              required 
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
              placeholder="e.g. Best Playground Ever" 
              value={newSpot.name}
              onChange={e => setNewSpot({...newSpot, name: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <select 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={newSpot.category}
              onChange={e => setNewSpot({...newSpot, category: e.target.value as any})}
            >
              <option value="Playground">Playground</option>
              <option value="Workspace">Workspace</option>
              <option value="Medical">Medical</option>
              <option value="Accommodation">Accommodation</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Why is it family friendly?</label>
            <textarea 
              required 
              rows={3} 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" 
              placeholder="Tell the tribe..." 
              value={newSpot.description}
              onChange={e => setNewSpot({...newSpot, description: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20">
            Submit Recommendation
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!selectedSpot} onClose={() => setSelectedSpot(null)} title={selectedSpot?.name || ''}>
        {selectedSpot && (
          <div className="space-y-6">
            <div className="w-full h-48 rounded-[2rem] overflow-hidden bg-slate-100">
              <img src={selectedSpot.imageUrl || `https://picsum.photos/seed/${selectedSpot.id}/600/400`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-black uppercase tracking-widest">{selectedSpot.category}</span>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-yellow-500" />
                <span className="font-bold text-sm">{selectedSpot.rating}</span>
              </div>
            </div>
            <p className="text-slate-600 font-medium leading-relaxed">{selectedSpot.description}</p>
            <div className="flex flex-wrap gap-2">
              {selectedSpot.verifiedTags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-wider">{tag}</span>
              ))}
            </div>
            <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">Write Review</button>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={selectedItem?.title || ''}>
        {selectedItem && (
          <div className="space-y-6">
            <div className="w-full h-64 rounded-[2.5rem] overflow-hidden bg-slate-100">
              <img src={selectedItem.imageUrl || `https://picsum.photos/seed/${selectedItem.id}/600/600`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-lg text-xs font-black uppercase tracking-widest">{selectedItem.category}</span>
              <span className="text-2xl font-black text-secondary">${selectedItem.price}</span>
            </div>
            <p className="text-slate-600 font-medium leading-relaxed">{selectedItem.description}</p>
            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={() => {
                  handleContactSeller(selectedItem);
                  setSelectedItem(null);
                }}
                className="w-full py-4 bg-secondary text-white rounded-2xl font-bold shadow-lg shadow-secondary/20"
              >
                Contact Seller
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating Connect Widget */}
      <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[120] flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
          {isConnectOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "w-[90vw] md:w-[420px] h-[75vh] max-h-[800px] rounded-[2.5rem] shadow-2xl border flex flex-col overflow-hidden pointer-events-auto",
                collabMode ? "bg-[#004d55] border-white/10" : "bg-white border-slate-100"
              )}
            >
              <div className="flex-1 overflow-hidden relative">
                {/* Internal Close Button - for better accessibility and WhatsApp feel */}
                <button 
                  onClick={() => setIsConnectOpen(false)}
                  className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-md"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <ConnectView 
                  onPaywall={() => {
                    setIsConnectOpen(false);
                    setIsPaywallOpen(true);
                  }} 
                  onSayHello={handleSayHello}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsConnectOpen(!isConnectOpen)}
          className={cn(
            "w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 relative group pointer-events-auto",
            collabMode ? "bg-accent text-white shadow-accent/40" : "bg-primary text-white shadow-primary/40"
          )}
        >
          {isConnectOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8 group-hover:scale-110 transition-transform" />}
          {/* Badge */}
          {(() => {
            const pendingCount = connections.filter(c => c.recipientId === currentUser?.id && c.status === 'pending').length;
            // Simulated unread: every 4th message in conversations as unread for visual feedback
            const unreadCount = conversations.length > 0 ? Math.ceil(conversations.length / 4) : 0;
            const total = pendingCount + unreadCount;
            
            if (total > 0) {
              return (
                <div className="absolute -top-1 -right-1 min-w-[24px] h-[24px] px-1.5 bg-accent text-white rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black shadow-lg">
                  {total}
                </div>
              );
            }
            return null;
          })()}
        </button>
      </div>

      <MultiTierPaywall isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} />

      <EditLocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
        onDetect={handleGetLocation} 
        onManual={handleManualLocation}
        isDetecting={isDetectingLocation}
        manualLocation={manualLocation}
        setManualLocation={setManualLocation}
      />

      {/* Add/Edit Trip Modal */}
      <Modal 
        isOpen={isAddTripOpen} 
        onClose={() => setIsAddTripOpen(false)} 
        title={newTrip.id ? "Edit Trip" : "Add Trip"}
        dark={collabMode}
      >
        <form onSubmit={handleAddTrip} className="space-y-6">
          <LocationSelector 
            label="Location"
            placeholder="Search city (e.g. Barcelona, Spanje)"
            value={newTrip.location}
            onChange={(val, coords) => setNewTrip(prev => ({ 
              ...prev, 
              location: val, 
              lat: coords?.lat || prev.lat, 
              lng: coords?.lng || prev.lng 
            }))}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={cn("text-xs font-black uppercase tracking-widest", collabMode ? "text-white/40" : "text-slate-400")}>Startdatum</label>
              <input 
                required
                type="date" 
                className={cn(
                  "w-full p-4 rounded-2xl focus:outline-none focus:ring-2 transition-all font-bold",
                  collabMode ? "bg-white/10 border-white/10 text-white focus:ring-white/20" : "bg-slate-50 border-slate-100 text-secondary focus:ring-primary/20"
                )}
                value={newTrip.startDate}
                onChange={e => setNewTrip(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className={cn("text-xs font-black uppercase tracking-widest", collabMode ? "text-white/40" : "text-slate-400")}>Einddatum</label>
              <input 
                required
                type="date" 
                className={cn(
                  "w-full p-4 rounded-2xl focus:outline-none focus:ring-2 transition-all font-bold",
                  collabMode ? "bg-white/10 border-white/10 text-white focus:ring-white/20" : "bg-slate-50 border-slate-100 text-secondary focus:ring-primary/20"
                )}
                value={newTrip.endDate}
                onChange={e => setNewTrip(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={cn(
              "w-full py-4 rounded-[2rem] font-black shadow-xl transition-all active:scale-[0.98]",
              collabMode ? "bg-[#e9c46a] text-[#264653]" : "bg-primary text-white shadow-primary/20"
            )}
          >
            {newTrip.id ? "Update Trip" : "Reis Toevoegen"}
          </button>
        </form>
      </Modal>
    </div>
    </ErrorBoundary>
  );
}

const ChatView = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
        <MessageSquare className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-secondary mb-2">Messages</h2>
      <p className="text-slate-500 max-w-xs">Connect with other families to plan playdates and gear swaps.</p>
      <div className="mt-8 w-full max-w-md space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 card-shadow flex items-center gap-4 text-left opacity-50">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-full bg-slate-100 rounded" />
            </div>
          </div>
        ))}
        <p className="text-xs text-slate-400 font-medium">Chat functionality coming soon in the next update!</p>
      </div>
    </div>
  );
};

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  const collabMode = useNomadStore(state => state.collabMode);
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all group",
        active 
          ? (collabMode ? "bg-[#e9c46a] text-[#264653] shadow-lg shadow-[#e9c46a]/20 font-black" : "bg-primary text-white shadow-lg shadow-primary/20") 
          : (collabMode ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-secondary")
      )}
    >
      <span className={cn("transition-transform group-hover:scale-110", active ? (collabMode ? "text-[#264653]" : "text-white") : (collabMode ? "text-white/40" : "text-slate-400"))}>
        {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 20 })}
      </span>
      {label}
    </button>
  );
}

function FullPageLoader({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Users className="w-6 h-6 text-primary" />
        </div>
      </div>
      <p className="mt-8 text-xs font-black text-secondary uppercase tracking-[0.3em] animate-pulse">
        {message}
      </p>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, dark }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, dark?: boolean }) {
  const collabMode = useNomadStore(state => state.collabMode);
  const isDark = dark || collabMode;
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300 relative px-2",
        active 
          ? (isDark ? "text-white" : "text-primary") 
          : (isDark ? "text-white/40 hover:text-white/60" : "text-slate-400")
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className={cn(
            "absolute -top-3 w-1 h-1 rounded-full",
            isDark ? "bg-white" : "bg-primary"
          )}
        />
      )}
      <div className={cn(
        "p-1 rounded-xl transition-colors",
        active ? (isDark ? "bg-white/10" : "bg-primary/5") : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
