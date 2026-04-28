import React, { useState } from 'react';
import {
  ArrowLeft, ArrowUp, ArrowDown, X, Plus, Save, Image as ImageIcon, Loader2,
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import type { CuratorGallery } from './CuratorGalleriesView';
import type { Project } from './SoundMapApp';

interface Props {
  gallery: CuratorGallery;
  allProjects: Project[];
  onSave: (g: CuratorGallery) => Promise<void>;
  onBack: () => void;
}

export const CuratorGalleryEditorView = ({ gallery, allProjects, onSave, onBack }: Props) => {
  const [title, setTitle] = useState(gallery.title);
  const [description, setDescription] = useState(gallery.description);
  const [projectIds, setProjectIds] = useState<string[]>(gallery.projectIds);
  const [isSaving, setIsSaving] = useState(false);

  const selectedProjects = projectIds
    .map((id) => allProjects.find((p) => p.id === id))
    .filter(Boolean) as Project[];
  const availableProjects = allProjects.filter((p) => !projectIds.includes(p.id));

  const move = (index: number, direction: 'up' | 'down') => {
    const newIds = [...projectIds];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newIds.length) return;
    [newIds[index], newIds[target]] = [newIds[target], newIds[index]];
    setProjectIds(newIds);
  };

  const remove = (id: string) => setProjectIds((prev) => prev.filter((x) => x !== id));
  const add = (id: string) => setProjectIds((prev) => [...prev, id]);

  const handleSave = async () => {
    if (!title.trim()) { toast.error('A galériának kötelező cím'); return; }
    setIsSaving(true);
    try {
      await onSave({ ...gallery, title: title.trim(), description, projectIds });
      toast.success('Galéria mentve');
    } catch {
      toast.error('Mentés sikertelen');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 flex-1">Galéria szerkesztése</h1>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSaving
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Save className="w-4 h-4 mr-2" />}
            Mentés
          </Button>
        </div>

        {/* Meta */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Galéria neve
            </label>
            <input
              className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="pl. Nyári kiállítás 2025"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Leírás
            </label>
            <textarea
              className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-500 outline-none resize-none focus:ring-2 focus:ring-indigo-300"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Írd le ezt a gyűjteményt a látogatóknak..."
            />
          </div>
        </div>

        {/* Selected projects */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Hangtérképek ebben a galériában{' '}
            <span className="text-slate-400 font-normal">({selectedProjects.length})</span>
          </h2>
          {selectedProjects.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              Még nem adtál hozzá hangtérképet. Válassz egyet alul.
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedProjects.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                >
                  <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                      : <ImageIcon className="w-5 h-5 text-slate-300" />}
                  </div>
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                    {p.title}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => move(i, 'up')}
                      disabled={i === 0}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => move(i, 'down')}
                      disabled={i === selectedProjects.length - 1}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-600"
                      onClick={() => remove(p.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Available projects */}
        {availableProjects.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Hangtérképek hozzáadása</h2>
            <ul className="space-y-2">
              {availableProjects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                >
                  <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                      : <ImageIcon className="w-5 h-5 text-slate-300" />}
                  </div>
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                    {p.title}
                  </span>
                  <Button
                    size="sm" variant="outline"
                    className="shrink-0"
                    onClick={() => add(p.id)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Hozzáadás
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
