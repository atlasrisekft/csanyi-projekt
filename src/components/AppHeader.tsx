import React from 'react';
import { Headphones } from 'lucide-react';

interface AppHeaderProps {
  children?: React.ReactNode;
  onBrandClick?: () => void;
  description?: string;
}

const DEFAULT_DESCRIPTION =
  'Interaktív hangélmények — fedezd fel a világot hangokon keresztül';

export const AppHeader = ({ children, onBrandClick, description }: AppHeaderProps) => {
  const tagline = description ?? DEFAULT_DESCRIPTION;
  const brandContent = (
    <>
      <div
        aria-hidden="true"
        className="flex items-center justify-center shrink-0"
        style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '0.5rem',
          backgroundImage:
            'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        }}
      >
        <Headphones className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col min-w-0 leading-tight">
        <span className="font-bold text-slate-900 truncate">Hangtérkép</span>
        <span
          className="hidden sm:block text-slate-500 truncate"
          style={{ fontSize: '0.75rem', marginTop: '0.125rem' }}
        >
          {tagline}
        </span>
      </div>
    </>
  );

  return (
    <>
      {/* Skip-to-content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only"
        style={{
          position: 'absolute',
          top: '0.5rem',
          left: '0.5rem',
          zIndex: 100,
          padding: '0.5rem 0.75rem',
          backgroundColor: '#4f46e5',
          color: '#ffffff',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        Ugrás a tartalomra
      </a>

      <header
        role="banner"
        className="sticky top-0 z-40 border-b border-slate-200"
        style={{
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-4">
          {onBrandClick ? (
            <button
              type="button"
              onClick={onBrandClick}
              aria-label={`Hangtérkép — ${tagline}`}
              className="flex items-center gap-3 min-w-0 cursor-pointer"
              style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textAlign: 'left' }}
            >
              {brandContent}
            </button>
          ) : (
            <a
              href="#main-content"
              aria-label={`Hangtérkép — ${tagline}`}
              className="flex items-center gap-3 min-w-0"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {brandContent}
            </a>
          )}

          {children && (
            <nav aria-label="Fő navigáció" className="shrink-0 flex items-center gap-3">
              {children}
            </nav>
          )}
        </div>
      </header>
    </>
  );
};
