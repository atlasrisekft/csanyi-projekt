import React from 'react';
import { Loader2, Image as ImageIcon, Headphones } from 'lucide-react';

export type PublicGalleryProject = {
  projectId: string;
  title: string;
  imageUrl: string | null;
  hotspotCount: number;
  shareShortId: string | null;
};

export type PublicGalleryData = {
  gallery: { id: string; title: string; description: string };
  projects: PublicGalleryProject[];
};

interface Props {
  data: PublicGalleryData | null;
  error: string | null;
  onOpenProject: (shareShortId: string) => void;
  isLoadingProject: boolean;
}

export const PublicGalleryView = ({ data, error, onOpenProject, isLoadingProject }: Props) => {
  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-900 text-slate-400 gap-4">
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-3">
            Sound Gallery
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            {data.gallery.title}
          </h1>
          {data.gallery.description && (
            <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
              {data.gallery.description}
            </p>
          )}
        </div>
      </div>

      {/* Project grid */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
        {data.projects.length === 0 ? (
          <p className="text-slate-400 text-center py-20">
            This gallery has no sound maps yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.projects.map((p) => (
              <button
                key={p.projectId}
                className="group text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onClick={() => {
                  if (p.shareShortId) onOpenProject(p.shareShortId);
                }}
                disabled={!p.shareShortId}
              >
                {/* Thumbnail */}
                <div className="h-56 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                    {p.shareShortId ? (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/95 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2 text-sm font-semibold text-slate-800 shadow-lg">
                        <Headphones className="w-4 h-4" />
                        Explore
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/60 rounded-full px-4 py-2 text-xs text-white">
                        Not available
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 text-base leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {p.hotspotCount} interactive{' '}
                    {p.hotspotCount === 1 ? 'zone' : 'zones'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 py-8 text-center">
        <p className="text-xs text-slate-400">Powered by Sound Atlas</p>
      </div>

      {/* Loading overlay when opening a project */}
      {isLoadingProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-2xl">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Loading sound map...</span>
          </div>
        </div>
      )}
    </div>
  );
};
