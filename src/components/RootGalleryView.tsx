import React, { useState, useEffect } from 'react';
import { Loader2, Image as ImageIcon, LogIn, LayoutGrid, Plus } from 'lucide-react';

const PAGE_SIZE = 9;
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { TermsPage } from './TermsPage';
import { PrivacyPage } from './PrivacyPage';
import type { PublicGalleryProject } from './PublicGalleryView';
import csanyiHatter from '../assets/csanyi_hatter.png';
import csanyiIkon from '../assets/csanyi_ikon.png';

interface Props {
  projects: PublicGalleryProject[];
  isLoading: boolean;
  session: any;
onOpenProject: (projectId: string) => void;
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [legalPage, setLegalPage] = useState<'terms' | 'privacy' | null>(null);

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

  if (legalPage === 'terms') return <TermsPage onBack={() => setLegalPage(null)} />;
  if (legalPage === 'privacy') return <PrivacyPage onBack={() => setLegalPage(null)} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader description="Böngészd a közösség által megosztott interaktív hangtérképeket">
        {session ? (
          <Button
            onClick={onMyProjectsClick}
            aria-label="Ugrás a saját projektjeimhez"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 rounded-full h-10 w-10 p-0 sm:rounded-md sm:w-auto sm:px-4 flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Saját projektek</span>
            <span className="sr-only sm:hidden">Saját projektek</span>
          </Button>
        ) : (
          <Button
            onClick={onLoginClick}
            aria-label="Bejelentkezés a fiókodba"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 rounded-full h-10 w-10 p-0 sm:rounded-md sm:w-auto sm:px-4 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Bejelentkezés</span>
            <span className="sr-only sm:hidden">Bejelentkezés</span>
          </Button>
        )}
      </AppHeader>

      <section
        aria-label="Üdvözlő rész"
        className="relative w-full overflow-hidden border-b border-indigo-900/20"
        style={{
          backgroundImage: `url(${csanyiHatter})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#4f46e5',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-16 grid grid-cols-1 sm:grid-cols-2 items-center gap-6 sm:gap-8">
          <div className="text-white max-w-xl pt-6">
            <h1 className="text-2xl pt-2s sm:text-4xl lg:text-5xl font-bold leading-tight">
              Üdv a hangtérképen!
            </h1>
            <p className="mt-3 mb-6 sm:mt-4 text-sm sm:text-lg leading-relaxed text-white/90">
              A Hangtérkép egy immerzív élmény, amely hangokon keresztül teszi értelmezhetővé és átélhetővé a képeket látás nélkül. A képeken kijelölt zónákhoz kapcsolódó hangok, narrációk és háttércsatornák segítenek feltérképezni a tartalmat — mintha egy láthatatlan térképen tájékozódnál.
            </p>
          </div>
          <img
            src={csanyiIkon}
            alt=""
            aria-hidden="true"
            className="w-full max-w-[300px] sm:max-w-[260px] lg:max-w-[300px] h-auto mx-auto sm:mx-0 pointer-events-none select-none"
            draggable={false}
          />
        </div>
      </section>

      <main id="main-content" role="main" className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
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
                className="group transition-colors duration-200 cursor-pointer overflow-hidden border border-slate-200 hover:border-indigo-300"
                onClick={() => onOpenProject(p.projectId)}
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-4 flex items-center justify-center gap-2"
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

      <Footer
        onTermsClick={() => setLegalPage('terms')}
        onPrivacyClick={() => setLegalPage('privacy')}
      />

      {isLoadingProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Hangtérkép betöltése...</span>
          </div>
        </div>
      )}
    </div>
  );
};
