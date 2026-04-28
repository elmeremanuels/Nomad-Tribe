import React, { useState } from 'react';
import { Database, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { runFullSeed } from '../../lib/seedDatabase';
import { useNomadStore } from '../../store';
import { cn } from '../../lib/utils';

const AdminSeedTab: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [seedResult, setSeedResult] = useState<{citiesSeeded: number, spotsSeeded: number} | null>(null);
  const { addToast } = useNomadStore();

  const handleSeed = async () => {
    if (!confirmed) {
      addToast('Please confirm to proceed with seeding', 'error');
      return;
    }
    setStatus('loading');
    setLoadingStep('Initializing...');
    setError(null);
    setSeedResult(null);
    
    try {
      setLoadingStep('Loading files...');
      const result = await runFullSeed((msg) => {
        setLoadingStep(msg);
        console.log('[Seed Progress]:', msg);
      }) as any;
      setSeedResult({
        citiesSeeded: result.citiesSeeded || 0,
        spotsSeeded: result.spotsSeeded || 0
      });
      setStatus('success');
      addToast('Database successfully seeded!', 'success');
    } catch (err: any) {
      console.error('Seeding error:', err);
      setStatus('error');
      setError(err.message || 'Unknown error during seeding. Check the console.');
      addToast('Seeding failed', 'error');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-secondary">Database Seed</h2>
          <p className="text-slate-500 text-sm">Import 530 cities and 629 spots into Firestore</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
        <h3 className="font-bold text-secondary mb-2 flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-500" />
          Important Information
        </h3>
        <ul className="text-sm text-slate-600 space-y-2 list-disc ml-5">
          <li>This process can take a few minutes for 1000+ records.</li>
          <li>Data is split into chunks of 400 to respect Firestore limits.</li>
          <li>Existing cities with the same ID will be updated (merge).</li>
          <li>Open the browser console (F12) to see detailed logs.</li>
        </ul>
      </div>

      {status === 'loading' ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="font-bold text-secondary">{loadingStep}</p>
          <p className="text-slate-500 text-sm mt-1">Cities and spots are being uploaded to Firestore</p>
        </div>
      ) : status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-secondary mb-2">Seed Complete!</h3>
          <p className="text-slate-500 max-w-xs mx-auto mb-4">
            {seedResult?.citiesSeeded} cities and {seedResult?.spotsSeeded} spots were successfully uploaded to Firestore.
          </p>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">All data is now in Firestore. You can view cities in the Explore tab.</p>
          <button 
            onClick={() => setStatus('idle')}
            className="mt-6 text-primary font-bold hover:underline"
          >
            Run again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {status === 'error' && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex gap-3">
              <AlertCircle size={18} className="shrink-0" />
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <input 
              type="checkbox" 
              id="confirm-seed" 
              checked={confirmed} 
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label htmlFor="confirm-seed" className="text-sm font-medium text-slate-600 cursor-pointer">
              I understand this may overwrite existing data and wish to proceed.
            </label>
          </div>

          <button
            onClick={handleSeed}
            disabled={!confirmed}
            className={cn(
              "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95",
              confirmed 
                ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            )}
          >
            <Play size={20} fill="currentColor" />
            Run Database Seed
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSeedTab;
