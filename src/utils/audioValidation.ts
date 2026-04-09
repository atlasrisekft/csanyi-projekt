// Audio format and validation utilities

export const ALLOWED_FORMATS = {
  'audio/mpeg': ['.mp3'],
  'audio/mp4': ['.m4a'],
  'audio/mp3': ['.mp3'],
  'audio/ogg': ['.ogg'],
  'audio/x-m4a': ['.m4a'],
} as const;

export const LIMITS = {
  VOICE_RECORDING: {
    MAX_DURATION_SECONDS: 180, // 3 minutes
    MAX_SIZE_BYTES: 3 * 1024 * 1024, // 3 MB
    CHANNELS: 1, // Mono
  },
  UPLOADED_AUDIO: {
    MAX_DURATION_SECONDS: 300, // 5 minutes
    MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  },
} as const;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const isAllowedFormat = (mimeType: string): boolean => {
  return Object.keys(ALLOWED_FORMATS).includes(mimeType);
};

export const getAllowedExtensions = (): string => {
  const extensions = Object.values(ALLOWED_FORMATS).flat();
  return [...new Set(extensions)].join(', ');
};

export const validateFileType = (file: File): ValidationResult => {
  const mimeType = file.type.toLowerCase();
  
  if (!isAllowedFormat(mimeType)) {
    return {
      isValid: false,
      error: `Nem támogatott formátum. Csak MP3, M4A (AAC) és OGG fájlok engedélyezettek.`,
    };
  }
  
  return { isValid: true };
};

export const validateFileSize = (
  fileSize: number,
  isRecording: boolean
): ValidationResult => {
  const limit = isRecording
    ? LIMITS.VOICE_RECORDING.MAX_SIZE_BYTES
    : LIMITS.UPLOADED_AUDIO.MAX_SIZE_BYTES;
  
  if (fileSize > limit) {
    const limitMB = limit / (1024 * 1024);
    return {
      isValid: false,
      error: `A fájl mérete meghaladja a ${limitMB} MB-os korlátot ${isRecording ? 'felvételekhez' : 'feltöltésekhez'}.`,
    };
  }
  
  return { isValid: true };
};

export const validateAudioDuration = async (
  file: File | Blob,
  isRecording: boolean
): Promise<ValidationResult> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = audio.duration;
      
      const limit = isRecording
        ? LIMITS.VOICE_RECORDING.MAX_DURATION_SECONDS
        : LIMITS.UPLOADED_AUDIO.MAX_DURATION_SECONDS;
      
      if (duration > limit) {
        const limitMins = Math.floor(limit / 60);
        resolve({
          isValid: false,
          error: `A hang időtartama meghaladja a ${limitMins} perces korlátot ${isRecording ? 'felvételekhez' : 'feltöltésekhez'}.`,
        });
      } else {
        resolve({ isValid: true });
      }
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Nem sikerült ellenőrizni a hang időtartamát. A fájl sérült lehet.',
      });
    };
    
    audio.src = url;
  });
};

export const validateAudioChannels = async (
  audioBlob: Blob
): Promise<ValidationResult> => {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    if (audioBuffer.numberOfChannels > LIMITS.VOICE_RECORDING.CHANNELS) {
      return {
        isValid: false,
        error: 'A hangfelvételeknek monónak (egycsatornásnak) kell lenniük.',
      };
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Nem sikerült ellenőrizni a hangcsatornákat. A fájl sérült lehet.',
    };
  }
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getRemainingTime = (
  currentSeconds: number,
  isRecording: boolean
): number => {
  const limit = isRecording
    ? LIMITS.VOICE_RECORDING.MAX_DURATION_SECONDS
    : LIMITS.UPLOADED_AUDIO.MAX_DURATION_SECONDS;
  return Math.max(0, limit - currentSeconds);
};

export const getRemainingSize = (
  currentBytes: number,
  isRecording: boolean
): number => {
  const limit = isRecording
    ? LIMITS.VOICE_RECORDING.MAX_SIZE_BYTES
    : LIMITS.UPLOADED_AUDIO.MAX_SIZE_BYTES;
  return Math.max(0, limit - currentBytes);
};
