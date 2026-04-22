import React from 'react';
import { cn } from '../../lib/utils';
import { Plus, X, Baby, User, Users } from 'lucide-react';
import { Kid } from '../../types';

interface Step2Props {
  kids: Kid[];
  onChange: (kids: Kid[]) => void;
}

const interestList = [
  "Gaming", "Lego", "Drawing", "Surfing", "Football", 
  "Swimming", "Reading", "Cooking", "Music", "Coding", 
  "Dance", "Nature", "Animals", "Minecraft", "YouTube"
];

export const Step2Kids: React.FC<Step2Props> = ({ kids, onChange }) => {
  const addKid = () => {
    if (kids.length >= 6) return;
    const newKid: Kid = {
      id: `kid_${Date.now()}_${kids.length}`,
      age: 5,
      gender: 'Boy',
      interests: []
    };
    onChange([...kids, newKid]);
  };

  const removeKid = (id: string) => {
    onChange(kids.filter(k => k.id !== id));
  };

  const updateKid = (id: string, field: keyof Kid, value: any) => {
    onChange(kids.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const toggleInterest = (kidId: string, interest: string) => {
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return;

    const newInterests = kid.interests.includes(interest)
      ? kid.interests.filter(i => i !== interest)
      : [...kid.interests, interest].slice(0, 5);
    
    updateKid(kidId, 'interests', newInterests);
  };

  return (
    <div className="space-y-8 py-4">
      {/* Safety Notice */}
      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <p className="text-[10px] leading-relaxed text-primary/70 font-medium">
          <span className="font-bold">Privacy Note:</span> This information is entered by you as a parent or guardian. 
          Your children's ages and interests are only used to find compatible families to meet. 
          We never use this data for advertising or share it with third parties.
        </p>
      </div>

      {kids.length === 0 ? (
        <div className="text-center py-12 space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-slate-200" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-secondary">No little nomads yet?</h3>
            <p className="text-sm text-slate-400 max-w-[240px] mx-auto font-medium">Adding kids helps you find the perfect community, but you can always add them later.</p>
          </div>
          <button
            onClick={addKid}
            className="px-8 py-4 bg-primary text-white rounded-[2rem] font-black shadow-xl shadow-primary/20 flex items-center gap-2 mx-auto active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Add First Child
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {kids.map((kid, index) => (
            <div key={kid.id} className="p-6 bg-white rounded-3xl border-2 border-slate-100 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => removeKid(kid.id)}
                  className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Baby className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-secondary">Child #{index + 1}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Profile Details</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Age</label>
                  <select
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold text-secondary outline-none appearance-none"
                    value={kid.age}
                    onChange={(e) => updateKid(kid.id, 'age', parseInt(e.target.value))}
                  >
                    {[...Array(18)].map((_, i) => (
                      <option key={i} value={i}>{i === 0 ? '0 (baby)' : i}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Gender</label>
                  <div className="flex bg-slate-50 rounded-xl p-1 gap-1">
                    {['Boy', 'Girl', 'Non-binary'].map(g => (
                      <button
                        key={g}
                        onClick={() => updateKid(kid.id, 'gender', g)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-black transition-all",
                          kid.gender === g ? "bg-white text-primary shadow-sm" : "text-slate-400"
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Interests (Min 1)</label>
                  <span className="text-[10px] font-bold text-slate-400">{kid.interests.length}/5</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interestList.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(kid.id, interest)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border-2 text-[10px] font-bold transition-all",
                        kid.interests.includes(interest)
                          ? "border-primary bg-primary text-white"
                          : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                      )}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {kids.length < 6 && (
            <button
              onClick={addKid}
              className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-[0.99]"
            >
              <Plus className="w-5 h-5" /> Add Another Child
            </button>
          )}
        </div>
      )}
    </div>
  );
};
