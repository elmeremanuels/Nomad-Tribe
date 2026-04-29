import React, { useState } from 'react';
import { useNomadStore } from '../../store';
import { Plus, MessageSquare, Trash2, Edit2, Shield, Lock, Eye, EyeOff, CheckCircle2, MoreVertical, Search, Filter, Hammer, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';
import { getTopicIcon } from '../../lib/topicIcons';

export default function AdminCommunityTab() {
  const { topics, threads, hashtags, createTopic, updateTopic, deleteTopic, moderateThread, moderateUser, deleteHashtag, seedTopics } = useNomadStore();
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [topicForm, setTopicForm] = useState({ id: '', name: '', description: '', icon: 'Hand', isLocked: false, isActive: true, type: 'discussion', color: '#006d77' });
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const handleOpenEdit = (topic: any) => {
    setTopicForm(topic);
    setIsEditing(true);
    setIsAddTopicOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.id || !topicForm.name) return;
    
    if (isEditing) {
      await updateTopic(topicForm.id, topicForm);
    } else {
      await createTopic(topicForm);
    }
    
    setIsAddTopicOpen(false);
    setIsEditing(false);
    setTopicForm({ id: '', name: '', description: '', icon: 'Hand', isLocked: false, isActive: true, type: 'discussion', color: '#006d77' });
  };

  const handleDeleteTopic = async (id: string) => {
    if (confirm("Are you sure? This will remove the board logic (threads will remain but be uncategorized).")) {
      await deleteTopic(id);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Topics Management */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-secondary tracking-tight">Community Topics</h2>
            <p className="text-sm text-slate-500 font-medium">Configure boards and access levels</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => useNomadStore.getState().seedTopics()}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              <Hammer className="w-4 h-4" /> Seed Defaults
            </button>
            <button 
              onClick={() => setIsAddTopicOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Topic
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map(topic => (
            <div key={topic.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 hover:border-primary/20 transition-all group">
               <div className="flex justify-between items-start">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border"
                    style={{ backgroundColor: `${topic.color || '#006d77'}15`, borderColor: `${topic.color || '#006d77'}30`, color: topic.color || '#006d77' }}
                  >
                     {(() => {
                       const Icon = getTopicIcon(topic.id);
                       return <Icon className="w-6 h-6" />;
                     })()}
                  </div>
                  <div className="flex gap-2">
                     {topic.isLocked && <Lock className="w-4 h-4 text-amber-500" />}
                     {!topic.isActive && <EyeOff className="w-4 h-4 text-red-500" />}
                  </div>
               </div>
               <div>
                  <h3 className="font-black text-secondary">{topic.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-2">{topic.description}</p>
               </div>
               <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{topic.threadCount} Threads</span>
                  <div className="flex gap-1 group-hover:opacity-100 opacity-0 transition-opacity">
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleOpenEdit(topic); }}
                       className="p-2 text-slate-300 hover:text-primary transition-colors"
                     >
                        <Edit2 className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }}
                       className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety Alerts */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-secondary tracking-tight">Safety Alerts</h2>
          <p className="text-sm text-slate-500 font-medium text-red-500">Critical items requiring immediate intervention</p>
        </div>
        <div className="p-12 bg-white border border-dashed border-red-200 rounded-[3rem] text-center space-y-3">
           <Shield className="w-12 h-12 text-red-500 mx-auto opacity-20" />
           <p className="text-sm font-bold text-slate-400 italic">No critical safety alerts at this time. Great job Tribe!</p>
        </div>
      </section>

      {/* Hashtag Management */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-secondary tracking-tight">Hashtag Inventory</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and cleanup community tags</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {hashtags.map(tag => (
            <div key={tag.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-red-200 transition-all">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-secondary">#{tag.id}</span>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{tag.spaceCount} spaces</p>
              </div>
              <button 
                onClick={() => {
                  if (confirm(`Are you sure you want to delete #${tag.id}?`)) {
                    deleteHashtag(tag.id);
                  }
                }}
                className="p-1.5 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Flagged Threads */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-secondary tracking-tight">Active Threads</h2>
          <p className="text-sm text-slate-500 font-medium">Monitor and moderate global conversations</p>
        </div>

        <div className="overflow-hidden border border-slate-100 rounded-3xl">
          <table className="w-full text-left border-collapse bg-white">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <tr>
                  <th className="px-6 py-4">Thread</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {threads.map(thread => (
                 <tr key={thread.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                       <div>
                          <p className="text-sm font-black text-secondary leading-tight">{thread.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">Topic: {topics.find(t => t.id === thread.topicId)?.name}</p>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-600">{thread.authorFamilyName}</td>
                    <td className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(parseISO(thread.lastActivityAt), 'MMM d, HH:mm')}</td>
                    <td className="px-6 py-5">
                       <span className={cn(
                         "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                         thread.status === 'active' ? "bg-green-100 text-green-600" :
                         thread.status === 'locked' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                       )}>
                          {thread.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => moderateThread(thread.id, thread.status === 'locked' ? 'restore' : 'lock')}
                            className="p-2 text-slate-300 hover:text-amber-500 transition-colors" 
                            title={thread.status === 'locked' ? "Unlock" : "Lock"}
                          >
                             {thread.status === 'locked' ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          <button 
                             onClick={() => moderateThread(thread.id, thread.status === 'removed' ? 'restore' : 'remove')}
                             className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                             title="Remove"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Topic Modal */}
      {isAddTopicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-md">
           <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-secondary">{isEditing ? 'Edit Topic' : 'New Topic Board'}</h2>
                    <p className="text-sm text-slate-500 font-medium">Configure category settings and appearance.</p>
                  </div>
                  <button onClick={() => { setIsAddTopicOpen(false); setIsEditing(false); }} className="text-slate-400 hover:text-secondary">
                    <Trash2 className="w-5 h-5" />
                  </button>
               </div>

               <form onSubmit={handleSaveTopic} className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                     <div className="col-span-1 space-y-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Icon</label>
                        <button 
                          type="button"
                          onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                          className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-primary hover:bg-white transition-all shadow-sm"
                        >
                          {(() => {
                             const { ALL_ICONS } = require('../../lib/topicIcons');
                             const Icon = (ALL_ICONS as any)[topicForm.icon] || ALL_ICONS.MessageSquare;
                             return <Icon className="w-8 h-8" />;
                          })()}
                        </button>

                        {isIconPickerOpen && (
                          <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 grid grid-cols-4 gap-2 w-[240px]">
                            {Object.keys(require('../../lib/topicIcons').ALL_ICONS).map(iconName => {
                              const { ALL_ICONS } = require('../../lib/topicIcons');
                              const Icon = (ALL_ICONS as any)[iconName];
                              return (
                                <button 
                                  key={iconName}
                                  type="button"
                                  onClick={() => {
                                    setTopicForm({...topicForm, icon: iconName});
                                    setIsIconPickerOpen(false);
                                  }}
                                  className={cn(
                                    "p-3 rounded-xl hover:bg-primary/10 transition-colors",
                                    topicForm.icon === iconName ? "bg-primary text-white" : "text-slate-400"
                                  )}
                                >
                                  <Icon className="w-5 h-5" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                     </div>
                     <div className="col-span-3 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Board Name</label>
                        <input 
                          type="text" 
                          required
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" 
                          value={topicForm.name} 
                          onChange={e => setTopicForm({...topicForm, name: e.target.value})}
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">Slug ID (Immutable)</label>
                     <input 
                       type="text" 
                       required
                       disabled={isEditing}
                       placeholder="e.g. world-schooling"
                       className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-xs disabled:opacity-50" 
                       value={topicForm.id} 
                       onChange={e => setTopicForm({...topicForm, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                     />
                  </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium h-24 resize-none" 
                      value={topicForm.description} 
                      onChange={e => setTopicForm({...topicForm, description: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                       <select 
                         className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold"
                         value={topicForm.type}
                         onChange={e => setTopicForm({...topicForm, type: e.target.value})}
                       >
                          <option value="discussion">Standard Discussion</option>
                          <option value="social">Social/Intro (Welcome button)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Color</label>
                       <div className="flex gap-2">
                          <input 
                            type="color" 
                            className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer bg-transparent" 
                            value={topicForm.color} 
                            onChange={e => setTopicForm({...topicForm, color: e.target.value})}
                          />
                          <input 
                            type="text"
                            className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-xs" 
                            value={topicForm.color} 
                            onChange={e => setTopicForm({...topicForm, color: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                       <input type="checkbox" checked={topicForm.isLocked} onChange={e => setTopicForm({...topicForm, isLocked: e.target.checked})} className="w-5 h-5 rounded border-slate-200 text-primary" />
                       <span className="text-xs font-bold text-secondary">Locked (Verified Only)</span>
                    </label>
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsAddTopicOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                    <button type="submit" className="flex-2 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                       {isEditing ? 'Save Changes' : 'Create Board'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
