import React from 'react';
import { Loader2, Image as ImageIcon, LogIn, LayoutGrid } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
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
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Hangtérkép</h1>
            <p className="text-slate-500 mt-1">
              Fedezd fel az interaktív hangtérképeket.
            </p>
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
            projects.map((p) => (
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
