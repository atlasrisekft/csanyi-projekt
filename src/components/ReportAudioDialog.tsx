import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Flag, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ReportAudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  hotspotId: string;
}

export const ReportAudioDialog = ({
  open,
  onOpenChange,
  projectId,
  hotspotId,
}: ReportAudioDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasons = [
    'Nem megfelelő tartalom',
    'Szerzői jogi jogsértés',
    'Spam vagy félrevezető tartalom',
    'Adatvédelmi jogsértés',
    'Egyéb biztonsági aggály',
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Kérjük, válassz egy okot');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/make-server-5be515e6/report-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            hotspotId,
            reason: selectedReason,
          }),
        }
      );

      if (response.ok) {
        setSubmitted(true);
        toast.success('A bejelentés sikeresen elküldve');
        setTimeout(() => {
          onOpenChange(false);
          setSubmitted(false);
          setSelectedReason('');
        }, 2000);
      } else {
        toast.error('Nem sikerült elküldeni a bejelentést');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      toast.error('Hiba történt a bejelentés elküldése közben');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-600" />
                Hang bejelentése
              </DialogTitle>
              <DialogDescription>
                Segíts megőrizni a platform biztonságát a nem megfelelő vagy káros tartalmak bejelentésével.
                A bejelentésed névtelen.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Miért jelented be ezt a hangot?
              </p>
              {reasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedReason === reason
                      ? 'border-red-600 bg-red-50 text-red-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <DialogFooter className="gap-2 flex flex-col-reverse sm:flex-row">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex-1 sm:flex-1"
              >
                Mégse
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-1"
              >
                {isSubmitting ? 'Küldés...' : 'Bejelentés elküldése'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="mb-2">Bejelentés elküldve</DialogTitle>
            <DialogDescription>
              Köszönjük, hogy segítesz megőrizni közösségünk biztonságát.
            </DialogDescription>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};