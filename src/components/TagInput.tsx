import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { searchInterests, standardizeInterest } from '../lib/interestUtils';
import { cn } from '../lib/utils';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder = "Add interest...", maxTags = 10, className }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      const results = searchInterests(inputValue);
      setSuggestions(results.map(r => r.standardizedName));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  }, [inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const standardized = standardizeInterest(tag);
    if (standardized && !tags.includes(standardized) && tags.length < maxTags) {
      onChange([...tags, standardized]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span 
            key={tag} 
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20"
          >
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(tag)}
              className="hover:text-primary/70"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.trim() && setShowSuggestions(true)}
            placeholder={tags.length >= maxTags ? "Max interests reached" : placeholder}
            disabled={tags.length >= maxTags}
            className="w-full p-2 pl-8 bg-white border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  index === selectedIndex ? "bg-primary/10 text-primary font-bold" : "hover:bg-slate-50 text-slate-600"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
