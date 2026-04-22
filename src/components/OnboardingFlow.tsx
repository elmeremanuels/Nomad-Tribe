import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNomadStore } from '../store';
import { Step1Family } from './onboarding/Step1Family';
import { Step2Kids } from './onboarding/Step2Kids';
import { Step3Trip } from './onboarding/Step3Trip';
import { Step4Collab } from './onboarding/Step4Collab';
import { Step5Welcome } from './onboarding/Step5Welcome';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Kid, Trip, CollabCard, FamilyProfile } from '../types';

export const OnboardingFlow: React.FC = () => {
  const { currentUser, completeOnboarding, setActiveTab } = useNomadStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    familyName: '',
    nativeLanguage: 'EN',
    spokenLanguages: [] as string[],
    travelReason: '',
    bio: '',
    kids: [] as Kid[],
    trips: [
      {
        id: `trip_${Date.now()}`,
        familyId: '',
        location: '',
        coordinates: { lat: 0, lng: 0 },
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ] as Trip[],
    openToCollabs: false,
    collabCard: {
      occupation: '',
      superpowers: [] as string[],
      currentMission: '',
      linkedInUrl: ''
    } as CollabCard
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCollabCard = (field: keyof CollabCard, value: any) => {
    setFormData(prev => ({
      ...prev,
      collabCard: { ...prev.collabCard, [field]: value }
    }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return formData.familyName.length >= 2 && formData.familyName.length <= 40 && !!formData.nativeLanguage && !!formData.travelReason;
      case 2:
        return formData.kids.length === 0 || formData.kids.every(k => k.interests.length >= 1);
      case 3:
        return formData.trips.length > 0 && formData.trips.every(t => t.location.length >= 3 && !!t.startDate && !!t.endDate);
      case 4:
        if (formData.openToCollabs) {
          const linkedInOk = !formData.collabCard.linkedInUrl || 
            (formData.collabCard.linkedInUrl.startsWith('https://linkedin.com') || 
             formData.collabCard.linkedInUrl.startsWith('https://www.linkedin.com'));
          return !!formData.collabCard.occupation && formData.collabCard.superpowers.length >= 1 && linkedInOk;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const profileData: Partial<FamilyProfile> = {
        familyName: formData.familyName,
        bio: formData.bio,
        travelReason: formData.travelReason,
        nativeLanguage: formData.nativeLanguage,
        spokenLanguages: formData.spokenLanguages,
        kids: formData.kids,
        openToCollabs: formData.openToCollabs,
        collabCard: formData.openToCollabs ? formData.collabCard : undefined,
        parents: [{ 
          id: currentUser?.id || '', 
          name: currentUser?.familyName || 'Parent', 
          role: 'Parent', 
          interests: [] 
        }]
      };

      const tripsWithId = formData.trips.map(t => ({ ...t, familyId: currentUser?.id || '' }));
      
      await completeOnboarding(profileData, tripsWithId);
      setActiveTab('tribe');
    } catch (error) {
      console.error("Onboarding failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (step / 5) * 100;

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1Family data={formData} onChange={updateField} />;
      case 2: return <Step2Kids kids={formData.kids} onChange={(kids) => updateField('kids', kids)} />;
      case 3: return <Step3Trip trips={formData.trips} onChange={(trips) => updateField('trips', trips)} />;
      case 4: return (
        <Step4Collab 
          openToCollabs={formData.openToCollabs} 
          collabCard={formData.collabCard}
          onModeChange={(open) => updateField('openToCollabs', open)}
          onCardChange={updateCollabCard}
        />
      );
      case 5: return <Step5Welcome onComplete={handleComplete} isLoading={isLoading} />;
      default: return null;
    }
  };

  const headlines: Record<number, string> = {
    1: "What's your family name? 👋",
    2: "Who are the little travelers? 🧒",
    3: "Where's the tribe going? 🗺️",
    4: "Do you work while you travel? 💼",
    5: "Welcome to the tribe! 🎉"
  };

  const subtexts: Record<number, string> = {
    1: "This is how other Nomad Tribes members will find and recognize you.",
    2: "Adding your kids helps us match you with families whose kids will actually get along.",
    3: "Other families in the same location will show up on your radar — this is where the magic starts.",
    4: "Many Nomad Tribes families are also running businesses or freelancing on the road. Turn on Collab Mode to connect with other working nomads.",
    5: ""
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col md:items-center md:justify-center">
      {/* Container for Desktop */}
      <div className="flex-1 w-full max-w-2xl flex flex-col bg-white overflow-hidden relative">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 sticky top-0 z-50">
          <motion.div 
            className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              {step < 5 && (
                <button
                  onClick={handleBack}
                  disabled={step === 1}
                  className={cn(
                    "p-2 rounded-full mb-4 transition-colors",
                    step === 1 ? "opacity-0" : "hover:bg-slate-50 text-slate-400"
                  )}
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}

              {step < 5 && (
                <div className="space-y-2">
                  <h1 className="text-4xl font-black text-secondary tracking-tight leading-tight">{headlines[step]}</h1>
                  <p className="text-slate-500 font-medium">{subtexts[step]}</p>
                </div>
              )}

              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {step < 5 && (
          <div className="p-6 bg-white border-t border-slate-50 flex justify-between items-center bg-gradient-to-t from-white via-white to-transparent">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Step {step} of 5</span>
                <div className="flex gap-1">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className={cn("h-1 rounded-full transition-all", i === step ? "w-4 bg-primary" : "w-1 bg-slate-200")} />
                   ))}
                </div>
             </div>

             <button
               disabled={!validateStep()}
               onClick={handleNext}
               className={cn(
                 "px-8 py-4 rounded-[2rem] font-black flex items-center gap-2 transition-all shadow-xl active:scale-95",
                 validateStep() 
                   ? "bg-primary text-white shadow-primary/20 hover:scale-105" 
                   : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
               )}
             >
               Next
               <ArrowRight className="w-5 h-5" />
             </button>
          </div>
        )}

        {/* Step 2 "No Kids" Escape */}
        {step === 2 && formData.kids.length === 0 && (
           <button 
             onClick={handleNext}
             className="absolute bottom-24 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
           >
             We don't have kids yet
           </button>
        )}
      </div>
    </div>
  );
};
