import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface AudioConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AudioConsentDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: AudioConsentDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-indigo-600" />
          </div>
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-2xl font-semibold text-slate-900">
              Hangfeltöltési hozzájárulás
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 leading-relaxed text-left space-y-3">
              <p>
                A hang mentése előtt kérjük, erősítsd meg, hogy:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Jogszerűen feltöltheted és megoszthatod ezt a hangfelvételt</li>
                <li>Tudatában vagy, hogy a hang személyes adatokat tartalmazhat</li>
                <li>Elfogadod, hogy felelős vagy az általad feltöltött tartalomért</li>
                <li>Megszereztél minden szükséges engedélyt, ha a hang más személyek hangját tartalmazza</li>
              </ul>
              <p className="text-xs text-slate-500 pt-2">
                A folytatással elfogadod a{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  Felhasználási feltételeket
                </a>{' '}
                és az{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  Adatvédelmi irányelveket
                </a>
                .
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="mt-2 flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <AlertDialogCancel onClick={onCancel} className="flex-1 sm:flex-1">
            Mégse
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-1"
          >
            Elfogadom
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};