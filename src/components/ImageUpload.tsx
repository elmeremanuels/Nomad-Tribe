import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNomadStore } from '../store';

export const ImageUpload = ({ onUpload, label }: { onUpload: (url: string) => void, label: string }) => {
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
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="relative group">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className="hidden" 
          id={`upload-${label.replace(/\s+/g, '-')}`}
        />
        <label 
          htmlFor={`upload-${label.replace(/\s+/g, '-')}`}
          className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-primary/20 transition-all"
        >
          {isUploading ? (
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <>
              <Plus className="w-6 h-6 text-slate-300 mb-2" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload</span>
            </>
          )}
        </label>
      </div>
    </div>
  );
};
