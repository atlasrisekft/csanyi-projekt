import React, { useState } from 'react';
import {
  Plus, ArrowLeft, MoreVertical, Trash2, Edit3, Share2,
  Copy, ExternalLink, Loader2, LayoutGrid,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from './ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { createGalleryShareLink } from '../utils/api';

export type CuratorGallery = {
  id: string;
  title: string;
  description: string;
  projectIds: string[];
};

interface ShareDialogProps {
  gallery: CuratorGallery;
  session: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const GalleryShareDialog = ({ gallery, session, open, onOpenChange }: ShareDialogProps) => {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    setShareLink(null);
    setIsLoading(true);
    createGalleryShareLink(session?.access_token, gallery.id)
      .then(({ shortId }: { shortId: string }) => {
        setShareLink(`${window.location.origin}/g/${shortId}`);
      })
      .catch(() => toast.error('Failed to create share link'))
      .finally(() => setIsLoading(false));
  }, [open, gallery.id, session?.access_token]);

  const copyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copied!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share "{gallery.title}"</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 mb-4">
          Anyone with this link can browse your gallery.
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : shareLink ? (
          <div className="flex gap-2">
            <input
              readOnly
              value={shareLink}
              className="flex-1 text-sm bg-slate-100 rounded-lg px-3 py-2 outline-none text-slate-700 min-w-0"
            />
            <Button size="icon" variant="outline" onClick={copyLink} title="Copy link">
              <Copy className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => window.open(shareLink, '_blank')} title="Open in new tab">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

interface Props {
  galleries: CuratorGallery[];
  isLoading: boolean;
  onCreate: () => void;
  onEdit: (galleryId: string) => void;
  onDelete: (galleryId: string) => void;
  onBack: () => void;
  session: any;
}

export const CuratorGalleriesView = ({
  galleries, isLoading, onCreate, onEdit, onDelete, onBack, session,
}: Props) => {
  const [shareGallery, setShareGallery] = useState<CuratorGallery | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Galleries</h1>
              <p className="text-slate-500 mt-1">
                Curate and share collections of your sound maps.
              </p>
            </div>
          </div>
          <Button
            onClick={onCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shrink-0 rounded-full h-12 w-12 p-0 sm:rounded-md sm:h-10 sm:w-auto sm:px-4 flex items-center justify-center"
          >
            <Plus className="w-6 h-6 sm:w-5 sm:h-5 sm:mr-2" />
            <span className="hidden sm:inline">New Gallery</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
            <p>Loading galleries...</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <LayoutGrid className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No galleries yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              Create a gallery to curate and share your sound maps.
            </p>
            <Button onClick={onCreate} variant="outline" className="mt-4">
              Create Gallery
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => (
              <Card
                key={gallery.id}
                className="group hover:shadow-lg transition-shadow border-slate-200 overflow-hidden"
              >
                <div
                  className="h-36 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 flex items-center justify-center cursor-pointer"
                  onClick={() => onEdit(gallery.id)}
                >
                  <LayoutGrid className="w-10 h-10 text-indigo-200 group-hover:text-indigo-400 transition-colors" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 cursor-pointer min-w-0" onClick={() => onEdit(gallery.id)}>
                      <h3 className="font-semibold text-slate-800 truncate">{gallery.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {gallery.projectIds.length}{' '}
                        {gallery.projectIds.length === 1 ? 'sound map' : 'sound maps'}
                      </p>
                      {gallery.description && (
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {gallery.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(gallery.id)}>
                          <Edit3 className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShareGallery(gallery)}>
                          <Share2 className="w-4 h-4 mr-2" /> Share link
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-red-600"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete gallery?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{gallery.title}". Your sound maps
                                will not be affected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => onDelete(gallery.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {shareGallery && (
        <GalleryShareDialog
          gallery={shareGallery}
          session={session}
          open={!!shareGallery}
          onOpenChange={(v) => { if (!v) setShareGallery(null); }}
        />
      )}
    </div>
  );
};
