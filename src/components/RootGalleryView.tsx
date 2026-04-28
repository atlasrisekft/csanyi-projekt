import React, { useState, useMemo } from 'react';
import { Loader2, Image as ImageIcon, LogIn, LayoutGrid, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import type { PublicGalleryProject } from './PublicGalleryView';

const PAGE_SIZE = 9;

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
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? projects.filter(p => p.title.toLowerCase().includes(q)) : projects;
  }, [projects, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Hangtérkép</h1>
            <p className="text-slate-500 mt-1">Fedezd fel az interaktív hangtérképeket.</p>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Button
                onClick={onMyProjectsClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shrink-0 rounded-full h-12 w-12 p-0 sm:rounded-md sm:h-10 sm:w-auto sm:px-4 flex items-center justify-center gap-2"
              >
                <LayoutGrid className="w-6 h-6 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Saját projektek</span>
              </Button>
            ) : (
              <Button
                onClick={onLoginClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shrink-0 rounded-full h-12 w-12 p-0 sm:rounded-md sm:h-10 sm:w-auto sm:px-4 flex items-center justify-center gap-2"
              >
                <LogIn className="w-6 h-6 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Bejelentkezés</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Keresés..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
            <p>Hangtérképek betöltése...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">
              {query ? `Nincs találat erre: „${query}"` : 'Még nincsenek nyilvános hangtérképek.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((p) => (
                <Card
                  key={p.projectId}
                  className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border-slate-200"
                  onClick={() => { if (p.shareShortId) onOpenProject(p.shareShortId); }}
                >
                  <div className="h-48 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-slate-300" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-800 truncate">{p.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{p.hotspotCount} zóna</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  {filtered.length} találat · {safePage}. oldal / {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                    .reduce<(number | '...')[]>((acc, n, i, arr) => {
                      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === '...' ? (
                        <span key={`ellipsis-${i}`} className="text-slate-400 px-1 text-sm">…</span>
                      ) : (
                        <Button
                          key={n}
                          variant={safePage === n ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(n as number)}
                          className={`h-8 w-8 p-0 ${safePage === n ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                        >
                          {n}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
