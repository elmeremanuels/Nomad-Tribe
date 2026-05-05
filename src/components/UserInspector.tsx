import React, { useState } from 'react';
import { useNomadStore } from '../store';
import { parseISO, format } from 'date-fns';
import { AlertTriangle, Trash2, X, Shield, MessageSquare, ShoppingBag, MapPin, Star, Calendar } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Avatar } from './Avatar';
import { cn } from '../lib/utils';

export const UserInspector = ({ userId, onClose }: { userId: string | null; onClose: () => void }) => {
  const {
    profiles, reports, spots, threads, marketItems, lookingFor,
    moderateUser, deleteUser, addToast
  } = useNomadStore();

  const user = profiles.find(p => p.id === userId);
  const userReports = reports.filter(r =>
    (r.targetType === 'User' && r.targetId === userId) ||
    // Simple lookup for content owned by them that was reported
    (
       (r.targetType === 'Spot' && spots.find(s => s.id === r.targetId)?.recommendedBy === userId) ||
       (r.targetType === 'Thread' && threads.find(t => t.id === r.targetId)?.authorId === userId) ||
       (r.targetType === 'MarketItem' && marketItems.find(m => m.id === r.targetId)?.sellerId === userId)
    )
  );

  const userSpots = spots.filter(s => s.recommendedBy === userId);
  const userThreads = threads.filter(t => t.authorId === userId);
  const userMarket = marketItems.filter(m => m.sellerId === userId);
  const userRequests = lookingFor.filter(r => r.userId === userId);

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user || !userId) return null;

  return (
    <Modal isOpen={!!userId} onClose={onClose} title="User Inspector" fullScreen>
      <div className="max-w-2xl mx-auto space-y-8 pb-12">

        {/* Header */}
        <div className="flex items-center gap-6">
          <Avatar src={user.photoUrl} name={user.familyName} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black text-secondary truncate tracking-tight">{user.familyName}</h2>
            <p className="text-sm text-slate-400 font-medium">
              Joined {format(parseISO(user.createdAt || new Date().toISOString()), 'MMMM d, yyyy')}
              {user.currentLocation && ` · ${user.currentLocation.city}, ${user.currentLocation.country}`}
            </p>
            <div className="mt-2 flex gap-2">
               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                 UID: {user.id}
               </span>
               <span className={cn(
                 "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                 user.role === 'SuperAdmin' ? "bg-primary text-white" : "bg-secondary text-white"
               )}>
                 {user.role}
               </span>
            </div>
          </div>
        </div>

        {/* Risk Indicators */}
        <div className="grid grid-cols-3 gap-4">
          <RiskBadge label="Total Reports" count={userReports.length} alert={userReports.length >= 3} />
          <RiskBadge label="Warnings" count={user.warnings?.length || 0} alert={(user.warnings?.length || 0) >= 2} />
          <RiskBadge 
            label="Account Status"
            value={user.isBanned ? 'BANNED' : user.ugcPrivilegesRevoked ? 'UGC DISABLED' : 'ACTIVE'}
            alert={!!user.isBanned || !!user.ugcPrivilegesRevoked}
          />
        </div>

        {/* Activity Summary */}
        <div className="bg-slate-50 p-6 rounded-3xl grid grid-cols-4 gap-4 text-center">
          <ActivityStat label="Spots" count={userSpots.length} icon={<MapPin className="w-4 h-4" />} />
          <ActivityStat label="Threads" count={userThreads.length} icon={<MessageSquare className="w-4 h-4" />} />
          <ActivityStat label="Market" count={userMarket.length} icon={<ShoppingBag className="w-4 h-4" />} />
          <ActivityStat label="Requests" count={userRequests.length} icon={<Calendar className="w-4 h-4" />} />
        </div>

        {/* Recent Reports */}
        {userReports.length > 0 && (
          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">
              Active Reports Against User
            </h3>
            <div className="space-y-3">
              {userReports.slice(0, 5).map(r => (
                <div key={r.id} className="p-4 bg-red-50/50 border border-red-100 rounded-2xl text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-red-600 uppercase tracking-widest text-[10px] flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {r.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {format(parseISO(r.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-slate-600 italic leading-relaxed">"{r.description || 'No description provided'}"</p>
                  <div className="mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Target: {r.targetType} ({r.targetId})
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activity Timeline */}
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">
            Recent Activity History
          </h3>
          <div className="space-y-3">
            {[
              ...userSpots.map(s => ({ type: 'Spot', title: s.name, at: s.createdAt, body: s.description })),
              ...userThreads.map(t => ({ type: 'Thread', title: t.title, at: t.createdAt, body: t.body })),
              ...userMarket.map(m => ({ type: 'Market', title: m.title, at: m.createdAt, body: m.description })),
              ...userRequests.map(r => ({ type: 'Request', title: r.category, at: r.createdAt, body: r.description })),
            ]
              .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
              .slice(0, 10)
              .map((item, i) => (
                <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl text-xs group hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      {item.type}
                    </span>
                    <span className="font-black text-secondary tracking-tight">{item.title}</span>
                    <span className="ml-auto text-[10px] text-slate-300 font-bold">
                      {format(parseISO(item.at), 'MMM d')}
                    </span>
                  </div>
                  {item.body && <p className="text-slate-500 line-clamp-2 leading-relaxed">{item.body}</p>}
                </div>
              ))}
            
            {userSpots.length === 0 && userThreads.length === 0 && userMarket.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-3xl">
                 <p className="text-sm text-slate-400 font-bold italic">No recent activity found for this user.</p>
              </div>
            )}
          </div>
        </section>

        {/* Action Panel */}
        <section className="pt-8 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-6">
             <Shield className="w-5 h-5 text-red-500" />
             <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Moderator Toolcase</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                const reason = prompt("Reason for warning?");
                if (reason) {
                  moderateUser(userId, { 
                    warnings: [...(user.warnings || []), { reason, issuedAt: new Date().toISOString(), issuedBy: 'Admin' }] 
                  });
                }
              }}
              className="flex items-center justify-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-secondary uppercase tracking-widest">Issue Warning</p>
                <p className="text-[10px] text-slate-400 font-bold">Limit 3 before auto-ban</p>
              </div>
            </button>

            <button
              onClick={() => moderateUser(userId, { ugcPrivilegesRevoked: !user.ugcPrivilegesRevoked })}
              className={cn(
                "flex items-center justify-center gap-3 p-4 border rounded-2xl transition-all group",
                user.ugcPrivilegesRevoked ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl bg-white flex items-center justify-center transition-colors",
                user.ugcPrivilegesRevoked ? "text-green-500" : "text-amber-500"
              )}>
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-secondary uppercase tracking-widest">
                  {user.ugcPrivilegesRevoked ? 'Restore Access' : 'Revoke UGC'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold">Posting privileges</p>
              </div>
            </button>

            <button
              onClick={() => moderateUser(userId, { isBanned: !user.isBanned })}
              className={cn(
                "flex items-center justify-center gap-3 p-4 border rounded-2xl transition-all group",
                user.isBanned ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl bg-white flex items-center justify-center transition-colors",
                user.isBanned ? "text-green-500" : "text-red-500"
              )}>
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-secondary uppercase tracking-widest">
                  {user.isBanned ? 'Unban Account' : 'Permanently Ban'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold">Login access</p>
              </div>
            </button>

            {confirmDelete ? (
              <div className="flex flex-col gap-2 p-4 bg-red-100 border border-red-200 rounded-2xl">
                 <p className="text-[10px] font-black text-red-700 uppercase tracking-widest text-center">Are you absolutely sure?</p>
                 <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        await deleteUser(userId);
                        addToast("User account wiped from core database.", "info");
                        onClose();
                      }}
                      className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-1.5 bg-white text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                 </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl opacity-50 hover:opacity-100 transition-all"
              >
                 <div className="text-center">
                    <p className="text-xs font-black text-red-700 uppercase tracking-widest">Full Purge</p>
                    <p className="text-[10px] text-red-400 font-bold">Wipe all user data</p>
                 </div>
              </button>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
};

const RiskBadge = ({ label, count, value, alert }: { label: string; count?: number; value?: string; alert?: boolean }) => (
  <div className={cn(
    "p-4 rounded-3xl border transition-all",
    alert ? "bg-red-50 border-red-100" : "bg-white border-slate-100"
  )}>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={cn(
      "text-xl font-black tracking-tight",
      alert ? "text-red-600" : "text-secondary"
    )}>
      {value || count}
    </p>
  </div>
);

const ActivityStat = ({ label, count, icon }: { label: string; count: number; icon: React.ReactNode }) => (
  <div className="flex flex-col items-center">
    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 mb-2">
      {icon}
    </div>
    <p className="text-lg font-black text-secondary tracking-tight leading-none">{count}</p>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
  </div>
);
