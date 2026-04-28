import React, { useState, useRef, useEffect } from 'react';
import { Upload, Search, Play, Pause, Loader2, Download, Volume2, Mic, Square, RotateCcw, Check, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { AudioConsentDialog } from './AudioConsentDialog';
import { toast } from 'sonner@2.0.3';
import { 
    validateFileType, 
    validateFileSize, 
    validateAudioDuration,
    validateAudioChannels,
    formatBytes,
    formatDuration as formatDurationUtil,
    getRemainingTime,
    LIMITS,
    getAllowedExtensions 
} from '../utils/audioValidation';

const FREESOUND_API_KEY = '9Zlyu8Q6bhpEENkjKrF2eScP7eVZ1Pgmpg1mxz0q';

interface Sound {
    id: number;
    name: string;
    username: string;
    duration: number;
    previews: {
        'preview-hq-mp3': string;
        'preview-lq-mp3': string;
    };
    download: string;
    description?: string;
    type?: string;
    filesize?: number;
}

interface SoundUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLocalUpload: (file: File) => void;
    onLibrarySelect: (sound: Sound) => void;
}

export const SoundUploadModal = ({ open, onOpenChange, onLocalUpload, onLibrarySelect }: SoundUploadModalProps) => {
    const [activeTab, setActiveTab] = useState<'local' | 'record'>('local');
    const [searchQuery, setSearchQuery] = useState('');
    const [sounds, setSounds] = useState<Sound[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollViewportRef = useRef<HTMLDivElement | null>(null);
    const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Voice recording state
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
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (playbackTimerRef.current) {
                clearTimeout(playbackTimerRef.current);
                playbackTimerRef.current = null;
            }
            setPlayingId(null);
            setSearchQuery('');
            setSounds([]);
            setHasSearched(false);
            setActiveTab('local');
            setCurrentPage(1);
            setTotalPages(0);
            
            // Clean up recording state
            stopRecording();
            if (recordingAudioRef.current) {
                recordingAudioRef.current.pause();
                recordingAudioRef.current = null;
            }
            setRecordedBlob(null);
            setRecordingDuration(0);
            setIsPlayingRecording(false);
            setRecordingError(null);
        }
    }, [open]);

    useEffect(() => {
        const scrollViewport = scrollViewportRef.current;
        if (!scrollViewport) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollViewport;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            
            if (isNearBottom && !isLoadingMore && currentPage < totalPages) {
                loadMoreSounds();
            }
        };

        scrollViewport.addEventListener('scroll', handleScroll);
        return () => scrollViewport.removeEventListener('scroll', handleScroll);
    }, [isLoadingMore, currentPage, totalPages, searchQuery]);

    // Live search with debouncing
    useEffect(() => {
        // Clear previous debounce timer
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        // Only search if query is not empty and we're on the library tab
        if (searchQuery.trim() && activeTab === 'library') {
            searchDebounceRef.current = setTimeout(() => {
                searchSounds();
            }, 500); // 500ms debounce
        } else if (!searchQuery.trim()) {
            // Clear results if search query is empty
            setSounds([]);
            setHasSearched(false);
        }

        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [searchQuery, activeTab]);

    const searchSounds = async () => {
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        setHasSearched(true);
        setCurrentPage(1);
        
        try {
            // Add filters: only MP3 and OGG, exclude WAV and uncompressed
            // Duration limit: 60 seconds max (suitable for web playback)
            const filters = 'type:(mp3 OR ogg) duration:[0 TO 60]';
            const response = await fetch(
                `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(searchQuery)}&filter=${encodeURIComponent(filters)}&fields=id,name,username,duration,previews,download,description,type,filesize&token=${FREESOUND_API_KEY}&page=1&page_size=15`
            );
            const data = await response.json();
            setSounds(data.results || []);
            setTotalPages(Math.ceil(data.count / 15) || 0);
        } catch (error) {
            console.error('Error searching sounds:', error);
            setSounds([]);
        } finally {
            setIsSearching(false);
        }
    };

    const togglePlayPreview = (sound: Sound) => {
        if (playingId === sound.id) {
            // Stop playing
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (playbackTimerRef.current) {
                clearTimeout(playbackTimerRef.current);
                playbackTimerRef.current = null;
            }
            setPlayingId(null);
        } else {
            // Lazy-load preview: Only create Audio element when user interacts
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (playbackTimerRef.current) {
                clearTimeout(playbackTimerRef.current);
            }
            
            // Use only preview files (low or high quality MP3/OGG), never original
            const previewUrl = sound.previews['preview-lq-mp3'] || sound.previews['preview-hq-mp3'];
            if (!previewUrl) {
                toast.error('Ehhez a hanghoz nem érhető el előnézet');
                return;
            }
            
            const audio = new Audio(previewUrl);
            audio.play();
            audioRef.current = audio;
            setPlayingId(sound.id);
            
            // Limit playback to 5 seconds
            playbackTimerRef.current = setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
                setPlayingId(null);
                playbackTimerRef.current = null;
            }, 5000);
            
            audio.onended = () => {
                if (playbackTimerRef.current) {
                    clearTimeout(playbackTimerRef.current);
                    playbackTimerRef.current = null;
                }
                setPlayingId(null);
                audioRef.current = null;
            };
        }
    };

    const handleSelectSound = async (sound: Sound) => {
        try {
            // Stop any playing audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setPlayingId(null);
            
            // Fetch detailed sound info to validate preview file metadata
            toast.loading('Hangfájl ellenőrzése...');
            const detailResponse = await fetch(
                `https://freesound.org/apiv2/sounds/${sound.id}/?token=${FREESOUND_API_KEY}`
            );
            
            if (!detailResponse.ok) {
                toast.dismiss();
                toast.error('Nem sikerült ellenőrizni a hangfájlt');
                return;
            }
            
            const detailData = await detailResponse.json();
            
            // Check if format is allowed (must be mp3 or ogg)
            const fileType = detailData.type?.toLowerCase();
            if (fileType && !['mp3', 'ogg'].includes(fileType)) {
                toast.dismiss();
                toast.error('Ez a hangformátum nem támogatott. Csak MP3 és OGG engedélyezett.');
                return;
            }
            
            // Validate duration (max 60 seconds for web suitability)
            if (detailData.duration > 60) {
                toast.dismiss();
                toast.error('A hang időtartama meghaladja a 60 másodpercet. Kérjük, válassz rövidebb hangot.');
                return;
            }
            
            // Validate preview file size using HEAD request
            const previewUrl = detailData.previews?.['preview-lq-mp3'] || detailData.previews?.['preview-hq-mp3'];
            if (previewUrl) {
                try {
                    const headResponse = await fetch(previewUrl, { method: 'HEAD' });
                    const contentLength = headResponse.headers.get('Content-Length');
                    if (contentLength) {
                        const sizeInBytes = parseInt(contentLength, 10);
                        const sizeInMB = sizeInBytes / (1024 * 1024);
                        
                        // Reject if preview exceeds 1 MB
                        if (sizeInMB > 1) {
                            toast.dismiss();
                            toast.error(`Az előnézeti fájl ${sizeInMB.toFixed(2)} MB, ami meghaladja az 1 MB-os korlátot.`);
                            return;
                        }
                    }
                } catch (error) {
                    console.warn('Could not validate preview file size:', error);
                    // Continue anyway if we can't check size
                }
            }
            
            toast.dismiss();
            onLibrarySelect(detailData);
            onOpenChange(false);
        } catch (error) {
            toast.dismiss();
            console.error('Error validating sound:', error);
            toast.error('Hiba történt a hangfájl ellenőrzése közben');
        }
    };

    const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const typeValidation = validateFileType(file);
        if (!typeValidation.isValid) {
            toast.error(typeValidation.error);
            return;
        }

        // Validate file size
        const sizeValidation = validateFileSize(file.size, false);
        if (!sizeValidation.isValid) {
            toast.error(sizeValidation.error);
            return;
        }

        // Validate duration
        const durationValidation = await validateAudioDuration(file, false);
        if (!durationValidation.isValid) {
            toast.error(durationValidation.error);
            return;
        }

        onLocalUpload(file);
        onOpenChange(false);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const truncateText = (text: string, maxLength: number = 60) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const loadMoreSounds = async () => {
        if (isLoadingMore || currentPage >= totalPages) return;
        
        setIsLoadingMore(true);
        
        try {
            // Apply same filters as initial search: only MP3 and OGG, max 60 seconds
            const filters = 'type:(mp3 OR ogg) duration:[0 TO 60]';
            const response = await fetch(
                `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(searchQuery)}&filter=${encodeURIComponent(filters)}&fields=id,name,username,duration,previews,download,description,type,filesize&token=${FREESOUND_API_KEY}&page=${currentPage + 1}&page_size=15`
            );
            const data = await response.json();
            setSounds(prevSounds => [...prevSounds, ...data.results]);
            setTotalPages(Math.ceil(data.count / 15) || 0);
            setCurrentPage(prevPage => prevPage + 1);
        } catch (error) {
            console.error('Error loading more sounds:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleScrollAreaMount = (node: HTMLDivElement | null) => {
        if (node) {
            // Find the actual scrollable viewport within the ScrollArea
            const viewport = node.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
            if (viewport) {
                scrollViewportRef.current = viewport;
            }
        }
    };

    // Voice recording functions
    const startRecording = async () => {
        try {
            setRecordingError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
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
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            
            // Start duration counter
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
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
            
            audio.play();
            recordingAudioRef.current = audio;
            setIsPlayingRecording(true);
        }
    };
    
    const resetRecording = () => {
        if (recordingAudioRef.current) {
            recordingAudioRef.current.pause();
            recordingAudioRef.current = null;
        }
        setRecordedBlob(null);
        setRecordingDuration(0);
        setIsPlayingRecording(false);
        setRecordingError(null);
    };
    
    const useRecording = () => {
        if (!recordedBlob) return;
        
        // Convert blob to file
        const file = new File([recordedBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        onLocalUpload(file);
        onOpenChange(false);
    };
    
    const formatRecordingDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[90vw] h-[80vh] max-h-[700px] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle>Hang feltöltése</DialogTitle>
                    <DialogDescription>Tölts fel hangot a számítógépedről, vagy böngéssz a hangkönyvtárban.</DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b px-6">
                    <button
                        onClick={() => setActiveTab('local')}
                        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors text-center ${
                            activeTab === 'local'
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
                    {activeTab === 'local' ? (
                        <div className="h-full flex items-center justify-center p-8">
                            <div className="text-center space-y-4 max-w-md">
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
                                    accept=".mp3,.m4a,.ogg,audio/mpeg,audio/mp4,audio/ogg"
                                    className="hidden"
                                    onChange={handleLocalFileSelect}
                                />
                                <p className="text-xs text-slate-400">
                                    Támogatott formátumok: MP3, M4A (AAC) és OGG. Maximum 5 perc, 10 MB.
                                </p>
                            </div>
                        </div>
                    ) : activeTab === 'record' ? (
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
                                                {formatRecordingDuration(recordingDuration)}
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
                                                Időtartam: {formatRecordingDuration(recordingDuration)}
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
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Újrafelvétel
                                            </Button>
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={useRecording}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Felvétel használata
                                        </Button>
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
                                                {formatRecordingDuration(recordingDuration)}
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
                                                Időtartam: {formatRecordingDuration(recordingDuration)}
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
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Újrafelvétel
                                            </Button>
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={useRecording}
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
            </DialogContent>
        </Dialog>
    );
};