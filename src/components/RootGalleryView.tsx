import React, { useState, useEffect } from 'react';
import { Loader2, Image as ImageIcon, LogIn, LayoutGrid, Sparkles, Info, X, Plus } from 'lucide-react';

const PAGE_SIZE = 9;
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { AppHeader } from './AppHeader';
import type { PublicGalleryProject } from './PublicGalleryView';

interface Props {
  projects: PublicGalleryProject[];
  isLoading: boolean;
  session: any;
  onOpenProject: (shareShortId: string) => void;
  isLoadingProject: boolean;
  onLoginClick: () => void;
  onMyProjectsClick: () => void;
}

export const RootGalleryView = ({
  projects,
  isLoading,
  session,
  onOpenProject,
  isLoadingProject,
  onLoginClick,
  onMyProjectsClick,
}: Props) => {
  const [showInfo, setShowInfo] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset visible count whenever the projects list changes (e.g. after a fresh load).
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [projects]);

  const visibleProjects = projects.slice(0, visibleCount);
  const hasMore = visibleCount < projects.length;
  const remaining = projects.length - visibleCount;
  const handleLoadMore = () => {
    setVisibleCount(Math.min(visibleCount + PAGE_SIZE, projects.length));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader description="Böngészd a közösség által megosztott interaktív hangtérképeket">
        <Button
          variant="ghost"
          onClick={() => setShowInfo(!showInfo)}
          aria-label="Információ a Hangtérképről"
          aria-expanded={showInfo}
          aria-controls="project-info-banner"
          className="text-slate-500 hover:text-indigo-600 shrink-0 rounded-full h-10 w-10 p-0 flex items-center justify-center"
        >
          <Info className="w-5 h-5" aria-hidden="true" />
        </Button>
        {session ? (
          <Button
            onClick={onMyProjectsClick}
            aria-label="Ugrás a saját projektjeimhez"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0 rounded-full h-10 w-10 p-0 sm:rounded-md sm:w-auto sm:px-4 flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Saját projektek</span>
            <span className="sr-only sm:hidden">Saját projektek</span>
          </Button>
        ) : (
          <Button
            onClick={onLoginClick}
            aria-label="Bejelentkezés a fiókodba"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0 rounded-full h-10 w-10 p-0 sm:rounded-md sm:w-auto sm:px-4 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Bejelentkezés</span>
            <span className="sr-only sm:hidden">Bejelentkezés</span>
          </Button>
        )}
      </AppHeader>

      <main id="main-content" role="main" className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          {showInfo && (
            <div
              id="project-info-banner"
              role="region"
              aria-label="A Hangtérkép projektről"
              className="flex items-start gap-3 mb-4"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(99,102,241,0.2)',
                backgroundImage:
                  'linear-gradient(135deg, rgba(238,242,255,0.9) 0%, rgba(250,245,255,0.9) 100%)',
              }}
            >
              <span
                aria-hidden="true"
                className="flex items-center justify-center shrink-0"
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '0.5rem',
                  backgroundImage:
                    'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </span>
              <p className="text-sm text-slate-700 leading-snug flex-1 pt-0.5">
                <span className="font-semibold text-slate-900">Mi ez?</span>{' '}
                A Hangtérkép egy immerzív élmény, amely hangokon keresztül teszi értelmezhetővé és átélhetővé a képeket látás nélkül. A képeken kijelölt zónákhoz kapcsolódó hangok, narrációk és háttércsatornák segítenek feltérképezni a tartalmat — mintha egy láthatatlan térképen tájékozódnál.
              </p>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                aria-label="Információ bezárása"
                className="shrink-0 text-slate-400 hover:text-slate-700 flex items-center justify-center"
                style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '9999px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          <h1 className="text-3xl font-bold text-slate-900">Közösségi galéria</h1>
          <p className="text-slate-500 mt-1">
            Fedezd fel az interaktív hangtérképeket, amiket mások készítettek.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
              <p>Hangtérképek betöltése...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">Még nincsenek nyilvános hangtérképek.</p>
            </div>
          ) : (
            visibleProjects.map((p) => (
              <Card
                key={p.projectId}
                className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border-slate-200"
                onClick={() => { if (p.shareShortId) onOpenProject(p.shareShortId); }}
              >
                <div className="h-48 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-800 truncate">{p.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {p.hotspotCount} zóna
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {hasMore && (
          <div className="flex justify-center" style={{ marginTop: '3rem' }}>
            <Button
              onClick={handleLoadMore}
              aria-label={`További ${Math.min(PAGE_SIZE, remaining)} hangtérkép betöltése`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-10 px-4 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              További {Math.min(PAGE_SIZE, remaining)} hangtérkép betöltése
              <span className="text-white/70 text-sm font-normal">
                ({visibleCount}/{projects.length})
              </span>
            </Button>
          </div>
        )}
      </main>

      {isLoadingProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-2xl">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Hangtérkép betöltése...</span>
          </div>
        </div>
      )}
    </div>
  );
};
