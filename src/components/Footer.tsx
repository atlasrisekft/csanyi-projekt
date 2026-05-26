import React from 'react';
import csanyiLogo from '../assets/csanyi-logo.png';

interface FooterProps {
  onTermsClick: () => void;
  onPrivacyClick: () => void;
}

export const Footer = ({ onTermsClick, onPrivacyClick }: FooterProps) => {
  return (
    <footer className="w-full bg-slate-950 mt-auto">
      <div className="max-w-6xl mx-auto px-8 sm:px-12 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          <img
            src={csanyiLogo}
            alt="Csányi Alapítvány"
            className="h-16 w-auto mb-4"
          />

          <nav aria-label="Jogi dokumentumok" className="flex items-center gap-x-6 gap-y-2 flex-wrap justify-center sm:justify-end">
            <button
              type="button"
              onClick={onTermsClick}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ÁSZF      
            </button>
            <span className="text-slate-700 text-xs" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onPrivacyClick}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Adatvédelmi tájékoztató
            </button>
          </nav>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-800 text-center sm:text-left">
          <p className="text-xs text-slate-500 mt-4">
            © {new Date().getFullYear()} Csányi Alapítvány. Minden jog fenntartva.
          </p>
        </div>
      </div>
    </footer>
  );
};
