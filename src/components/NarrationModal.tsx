import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Upload, Mic, Play, Pause, X, Check, Square } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
    validateFileType,
    validateFileSize,
    validateAudioDuration,
    ValidationResult
} from '../utils/audioValidation';

interface NarrationModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (file: File, path: string) => void;
    sessionUserId: string;
    projectId: string;
}

export const NarrationModal = ({ open, onClose, onSave, sessionUserId, projectId }: NarrationModalProps) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
    
    // Upload state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isPlayingRecording, setIsPlayingRecording] = useState(false);
    const [recordingError, setRecordingError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const recordingAudioRef = useRef<HTMLAudioElement | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    
    useEffect(() => {
        if (!open) {
            // Clean up when modal closes
            setUploadedFile(null);
            stopRecording();
            if (recordingAudioRef.current) {
                recordingAudioRef.current.pause();
                recordingAudioRef.current = null;
            }
            setRecordedBlob(null);
            setRecordingDuration(0);
            setIsPlayingRecording(false);
            setRecordingError(null);
            setActiveTab('upload');
        }
    }, [open]);
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Validate the file type
        const typeValidation = validateFileType(file);
        if (!typeValidation.isValid) {
            toast.error(typeValidation.error || 'Érvénytelen hangfájl');
            return;
        }
        
        // Validate file size (uploaded file, not recording)
        const sizeValidation = validateFileSize(file.size, false);
        if (!sizeValidation.isValid) {
            toast.error(sizeValidation.error || 'A fájl túl nagy');
            return;
        }
        
        // Validate duration
        const durationValidation = await validateAudioDuration(file, false);
        if (!durationValidation.isValid) {
            toast.error(durationValidation.error || 'A hang túl hosszú');
            return;
        }
        
        setUploadedFile(file);
        toast.success('A fájl sikeresen betöltve');
    };
    
    const startRecording = async () => {
        try {
            setRecordingError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1, // Force mono recording
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });
            
            // Reset chunks
            audioChunksRef.current = [];
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const mimeType = (mediaRecorder.mimeType || 'audio/webm').split(';')[0];
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                setRecordedBlob(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            
            // Start duration counter with 3-minute limit
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => {
                    const newDuration = prev + 1;
                    // Auto-stop at 3 minutes (180 seconds)
                    if (newDuration >= 180) {
                        stopRecording();
                        toast.info('Elérted a maximális felvételi időt (3 perc)');
                    }
                    return newDuration;
                });
            }, 1000);
            
        } catch (error) {
            // Handle microphone access errors gracefully
            if (error instanceof DOMException) {
                if (error.name === 'NotAllowedError') {
                    setRecordingError('A mikrofon hozzáférése megtagadva. Kérjük, engedélyezd a mikrofon használatát a felvételhez.');
                } else if (error.name === 'NotFoundError') {
                    setRecordingError('Nem található mikrofon. Csatlakoztass egy mikrofont, és próbáld újra.');
                } else {
                    console.error('Error accessing microphone:', error);
                    setRecordingError('Nem sikerült elérni a mikrofont. Ellenőrizd az eszközbeállításokat.');
                }
            } else {
                console.error('Error accessing microphone:', error);
                setRecordingError('Váratlan hiba történt a mikrofon elérésekor.');
            }
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    };
    
    const togglePlayRecording = () => {
        if (!recordedBlob) return;
        
        if (isPlayingRecording) {
            // Stop playing
            if (recordingAudioRef.current) {
                recordingAudioRef.current.pause();
                recordingAudioRef.current.currentTime = 0;
            }
            setIsPlayingRecording(false);
        } else {
            // Start playing
            const audioUrl = URL.createObjectURL(recordedBlob);
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
                setIsPlayingRecording(false);
                URL.revokeObjectURL(audioUrl);
                recordingAudioRef.current = null;
            };
            
            audio.play().catch((err) => {
                console.error('Playback failed:', err);
                setIsPlayingRecording(false);
                URL.revokeObjectURL(audioUrl);
                recordingAudioRef.current = null;
                toast.error('A lejátszás sikertelen. Lehetséges, hogy a böngésző nem támogatja ezt a hangformátumot.');
            });
            recordingAudioRef.current = audio;
            setIsPlayingRecording(true);
        }
    };
    
    const resetRecording = () => {
        setRecordedBlob(null);
        setRecordingDuration(0);
        if (recordingAudioRef.current) {
            recordingAudioRef.current.pause();
            recordingAudioRef.current = null;
        }
        setIsPlayingRecording(false);
    };
    
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    const handleSave = async () => {
        if (activeTab === 'upload' && uploadedFile) {
            const path = `${sessionUserId}/${projectId}/intro_${Date.now()}.mp3`;
            onSave(uploadedFile, path);
            onClose();
        } else if (activeTab === 'record' && recordedBlob) {
            // Convert recorded blob to File — strip codec params (e.g. audio/webm;codecs=opus → audio/webm)
            const mimeType = (recordedBlob.type || 'audio/webm').split(';')[0];
            const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
            const file = new File([recordedBlob], `recording_${Date.now()}.${ext}`, { type: mimeType });

            // Validate the recording size (for recordings)
            const sizeValidation = validateFileSize(file.size, true);
            if (!sizeValidation.isValid) {
                toast.error(sizeValidation.error || 'A felvétel túl nagy');
                return;
            }

            // Duration is already enforced by the recording timer (3-minute limit)
            if (recordingDuration > 180) {
                toast.error('A felvétel meghaladja a 3 perces korlátot.');
                return;
            }

            const path = `${sessionUserId}/${projectId}/intro_${Date.now()}.${ext}`;
            onSave(file, path);
            onClose();
        } else {
            toast.error('Kérjük, először tölts fel vagy vegyél fel hangot');
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[90vw] h-[80vh] max-h-[700px] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle>Narráció hozzáadása</DialogTitle>
                    <DialogDescription>Tölts fel hangfájlt, vagy készíts felvételt a mikrofonod segítségével</DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b px-6">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors text-center ${
                            activeTab === 'upload'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Upload className="w-4 h-4 inline mr-2" />
                        Feltöltés számítógépről
                    </button>
                    <button
                        onClick={() => setActiveTab('record')}
                        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors text-center ${
                            activeTab === 'record'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Mic className="w-4 h-4 inline mr-2" />
                        Hangfelvétel
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'upload' ? (
                        <div className="h-full flex items-center justify-center p-8">
                            <div className="text-center space-y-4 max-w-md">
                                {!uploadedFile ? (
                                    <>
                                        <div className="w-24 h-24 mx-auto bg-indigo-50 rounded-full flex items-center justify-center">
                                            <Upload className="w-12 h-12 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Hangfájl feltöltése</h3>
                                            <p className="text-sm text-slate-500 mb-4">
                                                Válassz hangfájlt a számítógépedről a feltöltéshez
                                            </p>
                                        </div>
                                        <Button
                                            size="lg"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Fájl kiválasztása
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".mp3,.m4a,.ogg"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <p className="text-xs text-slate-400">
                                            Támogatott formátumok: MP3, M4A (AAC) és OGG. Maximum 5 perc, 10 MB.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                                            <Check className="w-12 h-12 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Fájl kiválasztva</h3>
                                            <p className="text-sm text-slate-500 mb-2">
                                                {uploadedFile.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Másik fájl kiválasztása
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".mp3,.m4a,.ogg"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center p-8">
                            <div className="text-center space-y-6 max-w-md w-full">
                                {!recordedBlob ? (
                                    <>
                                        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                                            isRecording ? 'bg-red-50 animate-pulse' : 'bg-indigo-50'
                                        }`}>
                                            <Mic className={`w-12 h-12 ${isRecording ? 'text-red-600' : 'text-indigo-600'}`} />
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">
                                                {isRecording ? 'Felvétel folyamatban...' : 'Hangfelvétel'}
                                            </h3>
                                            <p className="text-sm text-slate-500 mb-4">
                                                {isRecording
                                                    ? 'Kattints a leállításra, ha kész vagy'
                                                    : 'Kattints az alábbi gombra a felvétel indításához'}
                                            </p>
                                        </div>

                                        {isRecording && (
                                            <div className="text-3xl font-mono font-bold text-indigo-600">
                                                {formatDuration(recordingDuration)}
                                            </div>
                                        )}

                                        {recordingError && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <p className="text-sm text-red-600">{recordingError}</p>
                                            </div>
                                        )}

                                        <Button
                                            size="lg"
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`w-full ${
                                                isRecording 
                                                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                        >
                                            {isRecording ? (
                                                <>
                                                    <Square className="w-4 h-4 mr-2" />
                                                    Felvétel leállítása
                                                </>
                                            ) : (
                                                <>
                                                    <Mic className="w-4 h-4 mr-2" />
                                                    Felvétel indítása
                                                </>
                                            )}
                                        </Button>

                                        <p className="text-xs text-slate-400">
                                            Győződj meg arról, hogy a mikrofonod csatlakoztatva van és az engedélyek meg vannak adva
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                                            <Check className="w-12 h-12 text-green-600" />
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Felvétel kész</h3>
                                            <p className="text-sm text-slate-500 mb-2">
                                                Időtartam: {formatDuration(recordingDuration)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Hallgasd meg a felvételt, vagy vegyél fel újat
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                onClick={togglePlayRecording}
                                                className="flex-1"
                                            >
                                                {isPlayingRecording ? (
                                                    <>
                                                        <Pause className="w-4 h-4 mr-2" />
                                                        Szünet
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Előnézet
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                onClick={resetRecording}
                                                className="flex-1"
                                            >
                                                <Mic className="w-4 h-4 mr-2" />
                                                Újrafelvétel
                                            </Button>
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={handleSave}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Felvétel használata
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer buttons only for upload tab with selected file */}
                {activeTab === 'upload' && uploadedFile && (
                    <div className="px-6 pb-6 pt-4 border-t flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Mégse
                        </Button>
                        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Narráció mentése
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};