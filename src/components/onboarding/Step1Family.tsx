import React from 'react';
import { cn } from '../../lib/utils';
import { Globe } from 'lucide-react';

interface Step1Props {
  data: {
    familyName: string;
    nativeLanguage: string;
    spokenLanguages: string[];
    travelReason: string;
    bio: string;
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

const travelReasons = [
  "Worldschooling",
  "Escaping the 9–5",
  "Remote work adventure",
  "Long-term sabbatical",
  "Digital nomad lifestyle",
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

  return (
    <div className="space-y-8 py-4">
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

      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Why are you traveling?</label>
        <div className="grid grid-cols-1 gap-2">
          {travelReasons.map(reason => (
            <button
              key={reason}
              onClick={() => onChange('travelReason', reason)}
              className={cn(
                "p-3.5 rounded-xl border-2 text-sm font-bold transition-all text-left",
                data.travelReason === reason
                  ? "border-primary bg-primary/5 text-primary shadow-sm"
                  : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
              )}
            >
              {reason}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
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
      </div>
    </div>
  );
};
