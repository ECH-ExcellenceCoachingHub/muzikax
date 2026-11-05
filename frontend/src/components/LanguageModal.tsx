'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageModal() {
  const { language, setLanguage, t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has already selected a language
    const hasSelectedLanguage = localStorage.getItem('languageSelected');
    
    // Show modal only if user hasn't selected a language yet
    if (!hasSelectedLanguage) {
      // Quick appearance - no delay
      const timer = setTimeout(() => {
        // Check if AI popup was already seen
        const hasSeenAIPopup = localStorage.getItem('aiAssistantPopupSeen');
        
        if (hasSeenAIPopup) {
          // AI popup already shown before, show language modal now
          setIsVisible(true);
        } else {
          // Wait for AI popup to finish
          const secondTimer = setTimeout(() => {
            setIsVisible(true);
          }, 500); // Reduced from 3000ms to 500ms
          
          return () => clearTimeout(secondTimer);
        }
      }, 500); // Reduced from 2500ms to 500ms
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLanguageSelect = (lang: 'en' | 'rw' | 'sw') => {
    setLanguage(lang);
    // Save to localStorage so user won't be asked again
    localStorage.setItem('languageSelected', 'true');
    localStorage.setItem('language', lang);
    setIsVisible(false);
  };

  if (!mounted || !isVisible) return null;

  const options: { code: 'en' | 'rw' | 'sw'; label: string; region: string }[] = [
    { code: 'en', label: t('english') || 'English', region: t('unitedKingdom') || 'United Kingdom' },
    { code: 'rw', label: t('kinyarwanda') || 'Kinyarwanda', region: t('rwanda') || 'Rwanda' },
    { code: 'sw', label: t('kiswahili') || 'Kiswahili', region: t('tanzaniaKenya') || 'Tanzania/Kenya' },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => setIsVisible(false)}
    >
      <div
        className="bg-surface-elevated border-t sm:border border-border-medium rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/50 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            {t('selectLanguage') || 'Select Language'}
          </h2>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3 space-y-1.5">
          {options.map(({ code, label, region }) => {
            const selected = language === code;
            return (
              <button
                key={code}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLanguageSelect(code);
                }}
                aria-pressed={selected}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors duration-150 active:scale-[0.99] ${
                  selected
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-surface border-transparent hover:bg-surface-overlay'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold tracking-wide uppercase ${
                      selected ? 'bg-primary text-black' : 'bg-surface-overlay text-text-secondary'
                    }`}
                  >
                    {code}
                  </span>
                  <div className="flex flex-col items-start">
                    <span className="text-[15px] font-semibold text-text-primary">{label}</span>
                    <span className="text-xs text-text-muted">{region}</span>
                  </div>
                </div>
                {selected && (
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 text-center border-t border-border-light">
          <p className="text-xs text-text-muted">
            {t('languageChangeInfo') || 'You can change this later in settings'}
          </p>
        </div>
      </div>
    </div>
  );
}
