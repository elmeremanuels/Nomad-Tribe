import React from 'react';
import { cn } from '../../lib/utils';
import { Globe, User, Plus, X, Heart } from 'lucide-react';
import { TagInput } from '../TagInput';

interface Step1Props {
  data: {
    familyName: string;
    nativeLanguage: string;
    spokenLanguages: string[];
    travelReasons: string[];
    bio: string;
    parents: any[];
  };
  onChange: (field: string, value: any) => void;
}

const languages = [
  { code: 'EN', name: 'English' },
  { code: 'NL', name: 'Nederlands' },
  { code: 'DE', name: 'Deutsch' },
  { code: 'FR', name: 'Français' },
  { code: 'RU', name: 'Русский' }
];

const travelReasonsOptions = [
  "Worldschooling",
  "Escaping the 9–5",
  "Remote work adventure",
  "Long-term sabbatical",
  "Digital nomad lifestyle",
  "Slow travel",
  "Educational journey",
  "Culture seeking",
  "Community building",
  "Career break",
  "Minimalism",
  "Other"
];

export const Step1Family: React.FC<Step1Props> = ({ data, onChange }) => {
  const toggleLanguage = (code: string) => {
    if (code === data.nativeLanguage) return;
    const newLanguages = data.spokenLanguages.includes(code)
      ? data.spokenLanguages.filter(l => l !== code)
      : [...data.spokenLanguages, code].slice(0, 4);
    onChange('spokenLanguages', newLanguages);
  };

  const toggleTravelReason = (reason: string) => {
    const newReasons = data.travelReasons.includes(reason)
      ? data.travelReasons.filter(r => r !== reason)
      : [...data.travelReasons, reason];
    onChange('travelReasons', newReasons);
  };

  const updateParent = (index: number, field: string, value: any) => {
    const newParents = [...data.parents];
    newParents[index] = { ...newParents[index], [field]: value };
    onChange('parents', newParents);
  };

  const addParent = () => {
    if (data.parents.length >= 2) return;
    onChange('parents', [...data.parents, { id: `parent_${Date.now()}`, name: '', role: 'Parent', interests: [] }]);
  };

  const removeParent = (index: number) => {
    if (data.parents.length <= 1) return;
    onChange('parents', data.parents.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-12 py-4">
      {/* 1. Family Basics */}
      <section className="space-y-6">
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Family Name 👋</label>
          <input
            type="text"
            placeholder="The [Surname]s"
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-secondary font-bold focus:border-primary/20 outline-none transition-all placeholder:text-slate-300"
            value={data.familyName}
            onChange={(e) => onChange('familyName', e.target.value)}
          />
          <p className="text-[10px] text-slate-400 font-medium px-1">2-40 characters. This is how others find you.</p>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Native Language</label>
          <div className="grid grid-cols-2 gap-2">
            {languages.map(lang => (
              <button
                key={`native-${lang.code}`}
                onClick={() => onChange('nativeLanguage', lang.code)}
                className={cn(
                  "p-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-between",
                  data.nativeLanguage === lang.code
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                )}
              >
                {lang.name}
                {data.nativeLanguage === lang.code && <div className="w-2 h-2 bg-primary rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Other Spoken Languages (Max 4)</label>
          <div className="flex flex-wrap gap-2">
            {languages.filter(l => l.code !== data.nativeLanguage).map(lang => (
              <button
                key={`spoken-${lang.code}`}
                onClick={() => toggleLanguage(lang.code)}
                className={cn(
                  "px-4 py-2 rounded-full border-2 text-xs font-bold transition-all",
                  data.spokenLanguages.includes(lang.code)
                    ? "border-primary bg-primary text-white"
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                )}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Parents Section */}
      <section className="space-y-6">
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Information about the Parents</label>
        <div className="space-y-4">
          {data.parents.map((parent, index) => (
            <div key={parent.id} className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-4 relative">
              {data.parents.length > 1 && (
                <button 
                  onClick={() => removeParent(index)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-secondary border border-slate-200">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-black text-secondary">{index === 0 ? 'Main Contact' : 'Second Parent'}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Maria"
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-secondary outline-none focus:border-primary/20 transition-all"
                    value={parent.name}
                    onChange={(e) => updateParent(index, 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Mom"
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-secondary outline-none focus:border-primary/20 transition-all"
                    value={parent.role}
                    onChange={(e) => updateParent(index, 'role', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Interests</label>
                <TagInput
                  tags={parent.interests}
                  onChange={(tags) => updateParent(index, 'interests', tags)}
                  placeholder="e.g. Yoga, Coding, Surfing..."
                  className="bg-white"
                />
              </div>
            </div>
          ))}

          {data.parents.length < 2 && (
            <button
              onClick={addParent}
              className="w-full py-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
            >
              <Plus className="w-4 h-4" /> Add second parent
            </button>
          )}
        </div>
      </section>

      {/* 3. Travel Reasons */}
      <section className="space-y-3">
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Why are you traveling? (Select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {travelReasonsOptions.map(reason => (
            <button
              key={reason}
              onClick={() => toggleTravelReason(reason)}
              className={cn(
                "px-4 py-2.5 rounded-full border-2 text-xs font-bold transition-all",
                data.travelReasons.includes(reason)
                  ? "border-primary bg-primary text-white shadow-md shadow-primary/10"
                  : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
              )}
            >
              {reason}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Bio */}
      <section className="space-y-1">
        <div className="flex justify-between items-end">
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Family Bio</label>
          <span className={cn("text-[10px] font-bold", data.bio.length > 240 ? "text-red-500" : "text-slate-400")}>
            {data.bio.length}/240
          </span>
        </div>
        <textarea
          placeholder="We're a family of 4 from Amsterdam, traveling through Southeast Asia while running our online business."
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm text-secondary font-medium focus:border-primary/20 outline-none transition-all placeholder:text-slate-300 min-h-[100px] resize-none"
          value={data.bio}
          onChange={(e) => onChange('bio', e.target.value.slice(0, 241))}
        />
      </section>
    </div>
  );
};
