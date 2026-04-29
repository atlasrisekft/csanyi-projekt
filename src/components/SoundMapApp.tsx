import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Play,
  Pause,
  Music,
  X,
  Edit3,
  Volume2,
  Trash2,
  Plus,
  ArrowLeft,
  Image as ImageIcon,
  MoreVertical,
  Repeat,
  Check,
  MoveHorizontal,
  Settings2,
  ChevronUp,
  ChevronDown,
  User as UserIcon,
  Share2,
  Copy,
  ExternalLink,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAccessiblePlayer } from "@/hooks/useAccessiblePlayer";
import { AuthView, supabase } from "./auth/AuthView";
import { ProfileView } from "./auth/ProfileView";
import { InteractiveTour, TourStep } from "./InteractiveTour";
import { SoundUploadModal } from "./SoundUploadModal";
import { NarrationModal } from "./NarrationModal";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  initServer,
  loadProjects,
  saveProjects,
  uploadFile,
  getSignedUrl,
  getSharedProject,
  getUserPreferences,
  saveUserPreferences,
  toggleProjectPublic,
  getPublicProjects,
  deleteProject,
} from "../utils/api";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "./ui/drawer";
import { toast } from "sonner";
import { RootGalleryView } from "./RootGalleryView";
import { AppHeader } from "./AppHeader";
import type { PublicGalleryProject } from "./PublicGalleryView";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

// Utility function to sanitize filenames for storage
const sanitizeFilename = (filename: string): string => {
  // Get file extension
  const lastDotIndex = filename.lastIndexOf(".");
  const name =
    lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
  const ext = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : "";

  // Remove or replace problematic characters
  const sanitized = name
    .normalize("NFD") // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics/accents
    .replace(/[\u0080-\uFFFF]/g, "") // Remove all remaining non-ASCII characters
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace non-alphanumeric (except .-_) with underscore
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ""); // Trim underscores from start/end

  return sanitized + ext;
};

export type Point = { x: number; y: number };

export type AudioSettings = {
  volume: number; // 0 to 1
  pan: number; // -1 (left) to 1 (right)
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
};

export type Hotspot = {
  id: string;
  points: Point[];
  audioFile: File | null;
  audioUrl: string | null;
  audioPath?: string | null;
  name: string;
  color: string;
  settings: AudioSettings;
  accessibilityDescription?: string;
};

export type GlobalChannel = {
  id: string;
  name: string;
  audioFile: File | null;
  audioUrl: string | null;
  audioPath?: string | null;
  settings: AudioSettings;
  accessibilityDescription?: string;
};

export type Project = {
  id: string;
  title: string;
  imageFile: File | null;
  imageUrl: string | null;
  imagePath?: string | null;
  hotspots: Hotspot[];
  globalChannels: GlobalChannel[];
  introAudioFile: File | null;
  introAudioUrl: string | null;
  introAudioPath?: string | null;
  introAudioLoop: boolean;
  introAudioAccessibilityDescription?: string;
  createdAt: number;
  isPublic?: boolean;
};

type ViewMode = "gallery" | "editor" | "player" | "profile";

const COLORS = [
  "#4f46e5", // Indigo
  "#0ea5e9", // Sky
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#64748b", // Slate
];

// ---------------------------------------------------------------------------
// CUSTOM UI COMPONENTS
// ---------------------------------------------------------------------------

const VolumeSlider = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) => (
  <div className="space-y-3">
    <div className="flex justify-between text-xs text-slate-500 font-medium">
      <span className="flex items-center gap-1.5">
        <Volume2 className="w-3.5 h-3.5" /> Hangerő
      </span>
      <span>{Math.round(value * 100)}%</span>
    </div>
    <Slider
      value={[value]}
      max={1}
      step={0.01}
      onValueChange={([v]) => onChange(v)}
      className="[&_.bg-primary]:bg-slate-700"
    />
  </div>
);

const PanSlider = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) => (
  <div className="space-y-3">
    <div className="flex justify-between text-xs text-slate-500 font-medium">
      <span className="flex items-center gap-1.5">
        <MoveHorizontal className="w-3.5 h-3.5" /> Panoráma
      </span>
      <span className="font-mono">
        {value === 0
          ? "CENTER"
          : value < 0
            ? `L ${Math.abs(Math.round(value * 100))}%`
            : `R ${Math.round(value * 100)}%`}
      </span>
    </div>
    <div className="relative h-6 flex items-center">
      {/* Center Marker */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 -translate-x-1/2 z-0" />
      <div className="absolute left-0 right-0 h-1 bg-slate-100 rounded-full z-0" />

      <Slider
        value={[value]}
        min={-1}
        max={1}
        step={0.05}
        onValueChange={([v]) => onChange(v)}
        className="relative z-10 [&_.bg-primary]:bg-transparent [&_.bg-primary]:border-transparent [&_.border-primary]:border-slate-600 [&_.border-primary]:bg-white [&_.border-primary]:border-2"
      />
    </div>
    <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
      <span>L</span>
      <span>R</span>
    </div>
  </div>
);

const FadeSlider = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) => (
  <div className="space-y-3">
    <div className="flex justify-between text-xs text-slate-500 font-medium">
      <span className="flex items-center gap-1.5">{label}</span>
      <span>{value.toFixed(1)}s</span>
    </div>
    <Slider
      value={[value]}
      max={5}
      step={0.1}
      onValueChange={([v]) => onChange(v)}
      className="[&_.bg-primary]:bg-slate-700"
    />
  </div>
);

const hueFromHex = (hex: string): number => {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return 0;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6;
  return Math.round(h * 360);
};

const hueToHex = (hue: number): string => {
  const s = 0.75,
    l = 0.5;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

const ColorPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) => {
  const hue = hueFromHex(value);
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500">Zóna színe</p>
      <div
        className="relative h-4 rounded-full"
        style={{
          background:
            "linear-gradient(to right, hsl(0,75%,50%), hsl(60,75%,50%), hsl(120,75%,50%), hsl(180,75%,50%), hsl(240,75%,50%), hsl(300,75%,50%), hsl(360,75%,50%))",
        }}
      >
        <input
          type="range"
          min={0}
          max={360}
          value={hue}
          onChange={(e) => onChange(hueToHex(Number(e.target.value)))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-0 bottom-0 w-4 h-4 rounded-full bg-white border-2 border-white shadow-md pointer-events-none"
          style={{ left: `calc(${(hue / 360) * 100}% - 8px)` }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AUDIO ENGINE HOOK
// ---------------------------------------------------------------------------

const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<
    Map<
      string,
      {
        source: MediaElementAudioSourceNode;
        gain: GainNode;
        panner: StereoPannerNode;
        audio: HTMLAudioElement;
        fadeOutTimer?: NodeJS.Timeout;
        fadeOutDuration: number;
      }
    >
  >(new Map());

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      sourcesRef.current.forEach(({ audio }) => {
        try {
          audio.pause();
        } catch (e) {
          console.error("Error pausing audio during cleanup:", e);
        }
      });
      sourcesRef.current.clear();
    };
  }, []);

  const getContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const play = (id: string, url: string, settings: AudioSettings) => {
    const ctx = getContext();
    const fadeDuration = settings.fadeIn ?? 0.3;

    const existing = sourcesRef.current.get(id);
    if (existing) {
      // Update fade out duration
      existing.fadeOutDuration = settings.fadeOut ?? 0.3;

      if (existing.fadeOutTimer) {
        clearTimeout(existing.fadeOutTimer);
        existing.fadeOutTimer = undefined;
        existing.gain.gain.cancelScheduledValues(ctx.currentTime);
        existing.gain.gain.linearRampToValueAtTime(
          settings.volume,
          ctx.currentTime + fadeDuration,
        );
        return;
      }
      return;
    }

    const audio = new Audio(url);
    audio.loop = settings.loop;
    audio.crossOrigin = "anonymous";

    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    source.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    panner.pan.value = settings.pan;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(
      settings.volume,
      ctx.currentTime + fadeDuration,
    );

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => console.error("Playback failed:", e));
    }
    sourcesRef.current.set(id, {
      source,
      gain,
      panner,
      audio,
      fadeOutDuration: settings.fadeOut ?? 0.3,
    });

    audio.onended = () => {
      if (!settings.loop) {
        sourcesRef.current.delete(id);
      }
    };
  };

  const stop = (id: string) => {
    const node = sourcesRef.current.get(id);
    if (node && !node.fadeOutTimer) {
      const ctx = getContext();
      // Use the stored fadeOutDuration for this specific sound
      const duration = node.fadeOutDuration || 0.3;

      node.gain.gain.cancelScheduledValues(ctx.currentTime);
      node.gain.gain.setValueAtTime(node.gain.gain.value, ctx.currentTime);
      node.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      const timer = setTimeout(
        () => {
          try {
            node.audio.pause();
          } catch (e) {
            console.error("Error pausing audio:", e);
          }
          try {
            node.source.disconnect();
            node.gain.disconnect();
            node.panner.disconnect();
          } catch (e) {}
          sourcesRef.current.delete(id);
        },
        duration * 1000 + 100,
      ); // Add buffer

      node.fadeOutTimer = timer;
    }
  };

  const stopAll = () => {
    sourcesRef.current.forEach((_, id) => {
      const node = sourcesRef.current.get(id);
      if (node && !node.fadeOutTimer) {
        const ctx = getContext();
        // Fast fade out for stopAll
        node.gain.gain.cancelScheduledValues(ctx.currentTime);
        node.gain.gain.setValueAtTime(node.gain.gain.value, ctx.currentTime);
        node.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

        setTimeout(() => {
          try {
            node.audio.pause();
          } catch (e) {
            console.error("Error pausing audio:", e);
          }
          try {
            node.source.disconnect();
            node.gain.disconnect();
            node.panner.disconnect();
          } catch (e) {}
          sourcesRef.current.delete(id);
        }, 150);
      }
    });
  };

  const updateSettings = (id: string, settings: AudioSettings) => {
    const node = sourcesRef.current.get(id);
    if (node) {
      // Update the stored fade out duration
      node.fadeOutDuration = settings.fadeOut ?? 0.3;

      if (!node.fadeOutTimer) {
        const ctx = getContext();
        node.gain.gain.cancelScheduledValues(ctx.currentTime);
        node.gain.gain.linearRampToValueAtTime(
          settings.volume,
          ctx.currentTime + 0.1,
        );

        node.panner.pan.value = settings.pan;
        node.audio.loop = settings.loop;
      }
    }
  };

  const unlock = () => {
    const ctx = getContext();
    return ctx.resume();
  };

  return { play, stop, stopAll, updateSettings, unlock };
};

// ---------------------------------------------------------------------------
// SETTINGS PANEL CONTENT (REUSABLE)
// ---------------------------------------------------------------------------

const ShareDialogContent = ({
  session,
  project,
  onTogglePublic,
}: {
  session: any;
  project: Project;
  onTogglePublic: (projectId: string, isPublic: boolean) => void;
}) => {
  const [link, setLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    import("../utils/api").then(({ createShareLink }) => {
      createShareLink(session?.access_token, project.id)
        .then((data: any) => {
          console.log("share link response:", data);
          if (!data?.shortId) {
            throw new Error("No shortId returned");
          }
          setLink(`${window.location.origin}/s/${data.shortId}`);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error creating share link:", err);
          setIsLoading(false);
        });
    });
  }, [session?.access_token, project.id]);

  if (isLoading || !link) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center space-x-2">
        <div className="grid flex-1 gap-2">
          <label htmlFor="link" className="sr-only">
            Hivatkozás
          </label>
          <input
            id="link"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            readOnly
            value={link}
          />
        </div>
        <Button
          size="sm"
          className="px-3 gap-1"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
            } catch (e) {
              const input = document.getElementById("link") as HTMLInputElement;
              if (input) {
                input.select();
                document.execCommand("copy");
              }
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span className="text-xs">Másolva</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span className="sr-only">Másolás</span>
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="px-3"
          onClick={() => {
            window.open(link, "_blank");
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Megjelenés a nyilvános galériában</p>
          <p className="text-xs text-slate-500">
            Ha bekapcsolod, ez a projekt látható lesz a főoldalon mindenki számára.
          </p>
        </div>
        <Switch
          checked={project.isPublic ?? false}
          onCheckedChange={(checked) => onTogglePublic(project.id, checked)}
        />
      </div>
    </div>
  );
};

const SettingsPanelContent = ({
  project,
  selectedHotspotId,
  onUpdate,
  setSelectedHotspotId,
  addGlobalChannel,
  session,
  openUploadModal,
  previewingChannelId,
  toggleChannelPreview,
  collapsedChannels,
  toggleChannelCollapse,
  setNarrationModalOpen,
  engine,
  previewingIntroAudio,
  toggleIntroAudioPreview,
  introPreviewTimerRef,
  collapsedIntroAudio,
  toggleIntroAudioCollapse,
  previewingZoneId,
  toggleZonePreview,
  setIsCanvasHighlighted,
}: {
  project: Project;
  selectedHotspotId: string | null;
  onUpdate: (p: Project | ((prev: Project) => Project)) => void;
  setSelectedHotspotId: (id: string | null) => void;
  addGlobalChannel: () => void;
  session: any;
  openUploadModal: (type: "hotspot" | "channel", id: string) => void;
  previewingChannelId: string | null;
  toggleChannelPreview: (channel: GlobalChannel) => void;
  collapsedChannels: Set<string>;
  toggleChannelCollapse: (channelId: string) => void;
  setNarrationModalOpen: (open: boolean) => void;
  engine: ReturnType<typeof useAudioEngine>;
  previewingIntroAudio: boolean;
  toggleIntroAudioPreview: () => void;
  introPreviewTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  collapsedIntroAudio: boolean;
  toggleIntroAudioCollapse: () => void;
  previewingZoneId: string | null;
  toggleZonePreview: (hotspot: Hotspot) => void;
  setIsCanvasHighlighted?: (highlighted: boolean) => void;
}) => {
  const [advancedOpenIds, setAdvancedOpenIds] = React.useState<Set<string>>(
    new Set(),
  );
  const toggleAdvanced = (id: string) =>
    setAdvancedOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="font-bold text-lg mb-4">Projekt beállítások</h2>

        <div className="space-y-3 mb-6" id="tour-intro-audio">
          <Label className="text-slate-500 text-xs uppercase tracking-wider font-bold">
            Bevezető narráció
          </Label>

          {!project.introAudioUrl ? (
            <div
              className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer"
              onClick={() => setNarrationModalOpen(true)}
            >
              <div className="mx-auto w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 text-slate-400">
                <Plus className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                Narráció hozzáadása
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Vezess be a hangtérképedbe hanganyaggal
              </p>
            </div>
          ) : (
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center gap-3 h-12 px-3 cursor-pointer"
                onClick={toggleIntroAudioCollapse}
              >
                <div
                  className="flex-1 bg-slate-100 rounded-lg h-9 flex items-center px-3 min-w-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    className="w-full bg-transparent text-sm text-slate-900 outline-none truncate"
                    value={project.introAudioFile?.name || "Narráció"}
                    onChange={(e) =>
                      onUpdate((p) => ({
                        ...p,
                        introAudioFile: {
                          ...(p.introAudioFile || {}),
                          name: e.target.value,
                        } as any,
                      }))
                    }
                  />
                </div>
                <button className="w-9 h-9 flex items-center justify-center shrink-0 text-slate-500">
                  {collapsedIntroAudio ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Expanded settings */}
              {!collapsedIntroAudio && (
                <div className="border-t border-slate-100 px-3 pb-4 pt-4 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-900">
                      Akadálymentesítési leírás
                    </Label>
                    <textarea
                      className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-500 outline-none resize-none"
                      style={{ minHeight: '120px' }}
                      placeholder={`Írd le ezt a narrációt látássérült felhasználóknak, pl. „Meleg hang, amely végigvezet a hangtérképen."`}
                      value={project.introAudioAccessibilityDescription ?? ""}
                      onChange={(e) =>
                        onUpdate((p) => ({
                          ...p,
                          introAudioAccessibilityDescription: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-slate-400">
                      Felolvasva képernyőolvasók által (VoiceOver / TalkBack),
                      amikor ez a narráció aktiválódik.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border text-sm font-medium transition-colors"
                      style={{
                        borderColor: "#bedbff",
                        color: "#2b7fff",
                      }}
                      onClick={toggleIntroAudioPreview}
                    >
                      {previewingIntroAudio ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Meghallgatás
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border border-black/10 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      onClick={() => setNarrationModalOpen(true)}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Csere
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <button
                      className="w-full h-9 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: "#2b7fff" }}
                      onClick={toggleIntroAudioCollapse}
                    >
                      Mentés
                    </button>
                    <button
                      className="w-full h-9 text-sm font-medium text-red-500"
                      onClick={() => {
                        if (previewingIntroAudio) {
                          engine.stop("preview-intro");
                          if (introPreviewTimerRef.current) {
                            clearTimeout(introPreviewTimerRef.current);
                            introPreviewTimerRef.current = null;
                          }
                        }
                        onUpdate((p) => ({
                          ...p,
                          introAudioFile: null,
                          introAudioUrl: null,
                          introAudioPath: null,
                          introAudioAccessibilityDescription: undefined,
                        }));
                      }}
                    >
                      Narráció törlése
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6 space-y-3" id="tour-add-channel">
          <Label className="text-slate-500 text-xs uppercase tracking-wider font-bold">
            Háttércsatornák
          </Label>

          {(project.globalChannels || []).length === 0 && (
            <div
              className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer"
              onClick={addGlobalChannel}
            >
              <div className="mx-auto w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 text-slate-400">
                <Plus className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                Háttérhang hozzáadása
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Eső, városzaj vagy ambient zene
              </p>
            </div>
          )}
          {(project.globalChannels || []).map((channel) => {
            const isCollapsed = collapsedChannels.has(channel.id);
            const isChAdvancedOpen = advancedOpenIds.has(channel.id);
            return (
              <div
                key={channel.id}
                className="bg-white border rounded-lg shadow-sm overflow-hidden"
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-3 h-12 px-3 cursor-pointer"
                  onClick={() => toggleChannelCollapse(channel.id)}
                >
                  <div
                    className="flex-1 bg-slate-100 rounded-lg h-9 flex items-center px-3 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      className="w-full bg-transparent text-sm text-slate-900 outline-none truncate"
                      value={channel.name}
                      onChange={(e) =>
                        onUpdate((p) => ({
                          ...p,
                          globalChannels: p.globalChannels.map((c) =>
                            c.id === channel.id
                              ? { ...c, name: e.target.value }
                              : c,
                          ),
                        }))
                      }
                    />
                  </div>
                  <button className="w-9 h-9 flex items-center justify-center shrink-0 text-slate-500">
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Expanded settings */}
                {!isCollapsed && (
                  <div className="border-t border-slate-100 px-3 pb-4 pt-4 space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-900">
                        Akadálymentesítési leírás
                      </Label>
                      <textarea
                        className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-500 outline-none resize-none"
                        style={{ minHeight: '120px' }}
                        placeholder={`Írd le ezt a hangot látássérült felhasználóknak, pl. „Finom eső hangulata az egész élmény során."`}
                        value={channel.accessibilityDescription ?? ""}
                        onChange={(e) =>
                          onUpdate((p) => ({
                            ...p,
                            globalChannels: p.globalChannels.map((c) =>
                              c.id === channel.id
                                ? {
                                    ...c,
                                    accessibilityDescription: e.target.value,
                                  }
                                : c,
                            ),
                          }))
                        }
                      />
                      <p className="text-xs text-slate-400">
                        Felolvasva képernyőolvasók által (VoiceOver / TalkBack),
                        amikor ez a csatorna aktiválódik.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border text-sm font-medium transition-colors"
                        style={{
                          borderColor: channel.audioUrl ? "#bedbff" : "#e2e8f0",
                          color: channel.audioUrl ? "#2b7fff" : "#94a3b8",
                        }}
                        onClick={() =>
                          channel.audioUrl && toggleChannelPreview(channel)
                        }
                        disabled={!channel.audioUrl}
                      >
                        {previewingChannelId === channel.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Meghallgatás
                      </button>
                      <button
                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border border-black/10 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        onClick={() => openUploadModal("channel", channel.id)}
                      >
                        {channel.audioUrl ? <RefreshCw className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        {channel.audioUrl ? "Csere" : "Feltöltés"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Hang ismétlése</span>
                      <Switch
                        checked={channel.settings.loop}
                        onCheckedChange={(c) =>
                          onUpdate((p) => ({
                            ...p,
                            globalChannels: p.globalChannels.map((ch) =>
                              ch.id === channel.id
                                ? {
                                    ...ch,
                                    settings: { ...ch.settings, loop: c },
                                  }
                                : ch,
                            ),
                          }))
                        }
                      />
                    </div>

                    <VolumeSlider
                      value={channel.settings.volume}
                      onChange={(v) =>
                        onUpdate((p) => ({
                          ...p,
                          globalChannels: p.globalChannels.map((ch) =>
                            ch.id === channel.id
                              ? {
                                  ...ch,
                                  settings: { ...ch.settings, volume: v },
                                }
                              : ch,
                          ),
                        }))
                      }
                    />

                    <button
                      className="flex items-center justify-between w-full text-sm text-slate-500 py-1"
                      onClick={() => toggleAdvanced(channel.id)}
                    >
                      <span>Speciális beállítások</span>
                      {isChAdvancedOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {isChAdvancedOpen && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FadeSlider
                            label="Beúsztatás"
                            value={channel.settings.fadeIn ?? 2.0}
                            onChange={(v) =>
                              onUpdate((p) => ({
                                ...p,
                                globalChannels: p.globalChannels.map((ch) =>
                                  ch.id === channel.id
                                    ? {
                                        ...ch,
                                        settings: {
                                          ...ch.settings,
                                          fadeIn: v,
                                        },
                                      }
                                    : ch,
                                ),
                              }))
                            }
                          />
                          <FadeSlider
                            label="Kiúsztatás"
                            value={channel.settings.fadeOut ?? 2.0}
                            onChange={(v) =>
                              onUpdate((p) => ({
                                ...p,
                                globalChannels: p.globalChannels.map((ch) =>
                                  ch.id === channel.id
                                    ? {
                                        ...ch,
                                        settings: {
                                          ...ch.settings,
                                          fadeOut: v,
                                        },
                                      }
                                    : ch,
                                ),
                              }))
                            }
                          />
                        </div>
                        <PanSlider
                          value={channel.settings.pan}
                          onChange={(v) =>
                            onUpdate((p) => ({
                              ...p,
                              globalChannels: p.globalChannels.map((ch) =>
                                ch.id === channel.id
                                  ? {
                                      ...ch,
                                      settings: { ...ch.settings, pan: v },
                                    }
                                  : ch,
                              ),
                            }))
                          }
                        />
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-5 space-y-3">
                      <button
                        className="w-full h-9 rounded-lg text-sm font-medium text-white"
                        style={{ backgroundColor: "#2b7fff" }}
                        onClick={() => toggleChannelCollapse(channel.id)}
                      >
                        Mentés
                      </button>
                      <button
                        className="w-full h-9 text-sm font-medium text-red-500"
                        onClick={() =>
                          onUpdate((p) => ({
                            ...p,
                            globalChannels: p.globalChannels.filter(
                              (c) => c.id !== channel.id,
                            ),
                          }))
                        }
                      >
                        Csatorna törlése
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div id="tour-zone-inventory" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-slate-500 text-xs uppercase tracking-wider font-bold">
              Zóna-készlet ({project.hotspots.length})
            </Label>
          </div>
          {project.hotspots.length === 0 ? (
            <div
              className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer"
              onClick={() => {
                if (setIsCanvasHighlighted) {
                  setIsCanvasHighlighted(true);
                  const canvasElement =
                    document.getElementById("tour-canvas-area");
                  if (canvasElement) {
                    canvasElement.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }
              }}
            >
              <div className="mx-auto w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 text-slate-400">
                <Plus className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-600">Zónák hozzáadása</p>
              <p className="text-xs text-slate-400 mt-1">
                Rajzolj a képre zónák létrehozásához
              </p>
            </div>
          ) : (
            <>
              {project.hotspots.map((h) => {
              const isOpen = selectedHotspotId === h.id;
              const isAdvancedOpen = advancedOpenIds.has(h.id);
              return (
                <div
                  key={h.id}
                  className={`bg-white border rounded-lg shadow-sm overflow-hidden ${!h.audioUrl ? 'border-red-200' : ''}`}
                >
                  {/* Header row */}
                  <div
                    className="flex items-center gap-3 h-12 px-3 cursor-pointer"
                    onClick={() =>
                      setSelectedHotspotId(isOpen ? null : h.id)
                    }
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: h.color }}
                    />
                    <div
                      className="flex-1 bg-slate-100 rounded-lg h-9 flex items-center px-3 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        className="w-full bg-transparent text-sm text-slate-900 outline-none truncate"
                        value={h.name}
                        onChange={(e) =>
                          onUpdate((p) => ({
                            ...p,
                            hotspots: p.hotspots.map((z) =>
                              z.id === h.id
                                ? { ...z, name: e.target.value }
                                : z,
                            ),
                          }))
                        }
                      />
                    </div>
                    <button className="w-9 h-9 flex items-center justify-center shrink-0 text-slate-500">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Expanded settings */}
                  {isOpen && (
                    <div className="border-t border-slate-100 px-3 pb-4 pt-4 space-y-5">
                      <div className="flex gap-2">
                        <button
                          id={h.audioUrl ? undefined : "tour-zone-upload-audio"}
                          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border text-sm font-medium transition-colors"
                          style={{
                            borderColor: h.audioUrl ? "#bedbff" : "#e2e8f0",
                            color: h.audioUrl ? "#2b7fff" : "#94a3b8",
                          }}
                          onClick={() => h.audioUrl && toggleZonePreview(h)}
                          disabled={!h.audioUrl}
                        >
                          {previewingZoneId === h.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Meghallgatás
                        </button>
                        <button
                          id={!h.audioUrl ? "tour-zone-upload-audio" : undefined}
                          className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-colors ${
                            h.audioUrl
                              ? 'border border-black/10 text-slate-600 hover:bg-slate-50'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                          onClick={() => openUploadModal("hotspot", h.id)}
                        >
                          {h.audioUrl ? <RefreshCw className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                          {h.audioUrl ? "Csere" : "Feltöltés"}
                        </button>
                      </div>

                      <ColorPicker
                        value={h.color}
                        onChange={(color) =>
                          onUpdate((p) => ({
                            ...p,
                            hotspots: p.hotspots.map((z) =>
                              z.id === h.id ? { ...z, color } : z,
                            ),
                          }))
                        }
                      />

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-900">
                          Akadálymentesítési leírás
                        </Label>
                        <textarea
                          className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-500 outline-none resize-none"
                          style={{ minHeight: '120px' }}
                          placeholder={`Írd le ezt a hangot látássérült felhasználóknak, pl. „Lágy hegedűdallam, amely a jobb felső sarokban lévő arany eget jelképezi."`}
                          value={h.accessibilityDescription ?? ""}
                          onChange={(e) =>
                            onUpdate((p) => ({
                              ...p,
                              hotspots: p.hotspots.map((z) =>
                                z.id === h.id
                                  ? {
                                      ...z,
                                      accessibilityDescription: e.target.value,
                                    }
                                  : z,
                              ),
                            }))
                          }
                        />
                        <p className="text-xs text-slate-400">
                          Felolvasva képernyőolvasók által (VoiceOver / TalkBack),
                          amikor ez a zóna aktiválódik.
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          Hang ismétlése
                        </span>
                        <Switch
                          checked={h.settings.loop}
                          onCheckedChange={(c) =>
                            onUpdate((p) => ({
                              ...p,
                              hotspots: p.hotspots.map((z) =>
                                z.id === h.id
                                  ? { ...z, settings: { ...z.settings, loop: c } }
                                  : z,
                              ),
                            }))
                          }
                        />
                      </div>

                      <VolumeSlider
                        value={h.settings.volume}
                        onChange={(v) =>
                          onUpdate((p) => ({
                            ...p,
                            hotspots: p.hotspots.map((z) =>
                              z.id === h.id
                                ? { ...z, settings: { ...z.settings, volume: v } }
                                : z,
                            ),
                          }))
                        }
                      />

                      <button
                        className="flex items-center justify-between w-full text-sm text-slate-500 py-1"
                        onClick={() => toggleAdvanced(h.id)}
                      >
                        <span>Speciális beállítások</span>
                        {isAdvancedOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isAdvancedOpen && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FadeSlider
                              label="Beúsztatás"
                              value={h.settings.fadeIn ?? 0.5}
                              onChange={(v) =>
                                onUpdate((p) => ({
                                  ...p,
                                  hotspots: p.hotspots.map((z) =>
                                    z.id === h.id
                                      ? { ...z, settings: { ...z.settings, fadeIn: v } }
                                      : z,
                                  ),
                                }))
                              }
                            />
                            <FadeSlider
                              label="Kiúsztatás"
                              value={h.settings.fadeOut ?? 0.5}
                              onChange={(v) =>
                                onUpdate((p) => ({
                                  ...p,
                                  hotspots: p.hotspots.map((z) =>
                                    z.id === h.id
                                      ? { ...z, settings: { ...z.settings, fadeOut: v } }
                                      : z,
                                  ),
                                }))
                              }
                            />
                          </div>
                          <PanSlider
                            value={h.settings.pan}
                            onChange={(v) =>
                              onUpdate((p) => ({
                                ...p,
                                hotspots: p.hotspots.map((z) =>
                                  z.id === h.id
                                    ? { ...z, settings: { ...z.settings, pan: v } }
                                    : z,
                                ),
                              }))
                            }
                          />
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-5 space-y-3">
                        <button
                          id="tour-zone-done-btn"
                          className="w-full h-9 rounded-lg text-sm font-medium text-white"
                          style={{ backgroundColor: "#2b7fff" }}
                          onClick={() => setSelectedHotspotId(null)}
                        >
                          Mentés
                        </button>
                        <button
                          className="w-full h-9 text-sm font-medium text-red-500"
                          onClick={() => {
                            onUpdate((p) => ({
                              ...p,
                              hotspots: p.hotspots.filter(
                                (z) => z.id !== h.id,
                              ),
                            }));
                            setSelectedHotspotId(null);
                          }}
                        >
                          Zóna törlése
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
              <p className="text-xs text-slate-400 text-center mt-1 px-2">
                Új zóna létrehozásához rajzolj a képre.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const refreshProjectUrls = async (
  project: Project,
  token: string,
): Promise<Project> => {
  const p = { ...project };

  // Helper to sanitize a full path (including userId/projectId/filename)
  const sanitizeStoragePath = (path: string): string => {
    const parts = path.split("/");
    return parts
      .map((part, index) => {
        // Don't sanitize user ID and project ID (first two parts)
        if (index < 2) return part;
        // Sanitize the filename part
        return sanitizeFilename(part);
      })
      .join("/");
  };

  if (p.imagePath) {
    try {
      const sanitizedPath = sanitizeStoragePath(p.imagePath);
      const { url } = await getSignedUrl(token, sanitizedPath);
      p.imageUrl = url;
      p.imagePath = sanitizedPath; // Update to sanitized path
    } catch (e) {
      console.warn(
        `Background image not found in storage, clearing reference: ${p.imagePath}`,
      );
      // Clear invalid references
      p.imagePath = undefined;
      p.imageUrl = undefined;
    }
  }

  if (p.introAudioPath) {
    try {
      const sanitizedPath = sanitizeStoragePath(p.introAudioPath);
      const { url } = await getSignedUrl(token, sanitizedPath);
      p.introAudioUrl = url;
      p.introAudioPath = sanitizedPath; // Update to sanitized path
    } catch (e) {
      console.warn(
        `Intro audio not found in storage, clearing reference: ${p.introAudioPath}`,
      );
      // Clear invalid references
      p.introAudioPath = undefined;
      p.introAudioUrl = undefined;
    }
  }

  p.hotspots = await Promise.all(
    p.hotspots.map(async (h) => {
      if (h.audioPath) {
        try {
          const sanitizedPath = sanitizeStoragePath(h.audioPath);
          const { url } = await getSignedUrl(token, sanitizedPath);
          return { ...h, audioUrl: url, audioPath: sanitizedPath };
        } catch (e) {
          console.warn(
            `Hotspot audio not found in storage, clearing reference: ${h.audioPath}`,
          );
          // Return hotspot without audio references
          return { ...h, audioPath: undefined, audioUrl: undefined };
        }
      }
      return h;
    }),
  );

  p.globalChannels = await Promise.all(
    (p.globalChannels || []).map(async (c) => {
      if (c.audioPath) {
        try {
          const sanitizedPath = sanitizeStoragePath(c.audioPath);
          const { url } = await getSignedUrl(token, sanitizedPath);
          return { ...c, audioUrl: url, audioPath: sanitizedPath };
        } catch (e) {
          console.warn(
            `Background channel audio not found in storage, clearing reference: ${c.audioPath}`,
          );
          // Return channel without audio references
          return { ...c, audioPath: undefined, audioUrl: undefined };
        }
      }
      return c;
    }),
  );

  return p;
};

const TOUR_STEPS: TourStep[] = [
  {
    id: "create-project",
    targetId: "tour-create-project",
    title: "Projekt indítása",
    description: "Kattints ide az első hangtérkép-projekted létrehozásához.",
    placement: "right",
  },
  {
    id: "upload-image",
    targetId: "tour-upload-image",
    title: "Alapkép feltöltése",
    description:
      "Töltsd fel azt a képet, amelyet interaktívvá szeretnél tenni. Ez lehet alaprajz, térkép, műalkotás vagy bármilyen kép, amelyre hangzónákat szeretnél helyezni.",
    placement: "bottom",
  },
  {
    id: "draw-zones",
    targetId: "tour-canvas-area",
    title: "Hangzónák rajzolása",
    description:
      "Kattints a képre, és jelöld ki a területet lenyomott egérrel, amit interaktívvá szeretnél tenni. Minden zónához külön hang tartozhat. Ha elengeded az egeret, létrehozzuk a zónát, és megnyílik a beállító panel.",
    placement: "left",
    interactive: true,
  },
  {
    id: "zone-inventory",
    targetId: "tour-zone-inventory",
    title: "Zóna-készlet",
    description:
      "Az összes létrehozott zóna itt jelenik meg. Kattints bármelyik zónára a kijelöléséhez és a hangbeállítások megadásához.",
    placement: "top",
  },
  {
    id: "zone-upload-audio",
    targetId: "tour-zone-upload-audio",
    title: "Hang hozzáadása a zónához",
    description:
      'Most adj hangfájlt ehhez a zónához. Kattints a „Hang feltöltése" gombra, hogy fájlt válassz a számítógépedről, vagy böngéssz a hangkönyvtárban.',
    placement: "left",
  },
  {
    id: "zone-done",
    targetId: "tour-zone-done-btn",
    title: "Zóna beállításainak mentése",
    description:
      'Miután hozzáadtad a hangot és beállítottad a zóna paramétereit, kattints a „Mentés" gombra a főnézethez való visszatéréshez.',
    placement: "top",
  },
  {
    id: "intro-audio",
    targetId: "tour-intro-audio",
    title: "Bevezető narráció",
    description:
      "Adj hozzá narrációt, amely a kezdőképernyőn szólal meg, mielőtt a felhasználók interakcióba lépnének. Ez tökéletes a kontextus felállítására és az utasítások megadására.",
    placement: "left",
  },
  {
    id: "add-channel",
    targetId: "tour-add-channel",
    title: "Háttérhang-csatornák",
    description:
      "Adj hozzá ambient hangokat vagy háttérzenét, amely folyamatosan szól a zónák alatt. Remek esőhanghoz, városzajhoz vagy atmoszferikus zenéhez.",
    placement: "left",
  },
  {
    id: "preview",
    targetId: "tour-preview-btn",
    title: "Alkotásod előnézete",
    description:
      "Teszteld az interaktív élményt, mielőtt megosztanád másokkal.",
    placement: "bottom",
  },
  {
    id: "share",
    targetId: "tour-share-btn",
    title: "Hangtérképed megosztása",
    description:
      "Hozz létre megosztható linket, amelyet tableteken vagy más eszközökön lehet megnyitni. A felhasználók érintéssel fedezhetik fel, így mindenki számára elérhető.",
    placement: "bottom",
  },
];

// ---------------------------------------------------------------------------
// MAIN APP COMPONENT
// ---------------------------------------------------------------------------

export const SoundMapApp = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewMode>("gallery");
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{
    type: "hotspot" | "channel";
    id: string;
  } | null>(null);
  const [narrationModalOpen, setNarrationModalOpen] = useState(false);
  const [showMissingAudioWarning, setShowMissingAudioWarning] = useState(false);
  const [missingAudioZones, setMissingAudioZones] = useState<string[]>([]);

  const handleTourNext = () => {
    if (tourStepIndex < TOUR_STEPS.length - 1) {
      setTourStepIndex((prev) => prev + 1);
    } else {
      setShowOnboarding(false);
      if (session?.access_token) {
        saveUserPreferences(session.access_token, {
          hasSeenOnboarding: true,
        }).catch(console.error);
      }
    }
  };

  const handleTourClose = () => {
    setShowOnboarding(false);
    if (session?.access_token) {
      saveUserPreferences(session.access_token, {
        hasSeenOnboarding: true,
      }).catch(console.error);
    }
  };

  // Shared View State
  const [sharedProject, setSharedProject] = useState<Project | null>(null);
  const [sharedError, setSharedError] = useState<string | null>(null);
  const [isSharedView, setIsSharedView] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      return /^\/s\/.+/.test(path);
    }
    return false;
  });

  const [isRootGalleryView, setIsRootGalleryView] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      return !(/^\/s\/.+/.test(path)) && !(/^\/g\/.+/.test(path));
    }
    return true;
  });
  const [rootGalleryProjects, setRootGalleryProjects] = useState<PublicGalleryProject[]>([]);
  const [isLoadingRootGallery, setIsLoadingRootGallery] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoadingGalleryProject, setIsLoadingGalleryProject] = useState(false);
  const [selectedGalleryProject, setSelectedGalleryProject] = useState<Project | null>(null);

  useEffect(() => {
    if (isSharedView) {
      const path = window.location.pathname;
      const match = path.match(/^\/s\/(.+)$/);
      const shortId = match ? match[1] : null;

      if (shortId) {
        import("../utils/api").then(({ getSharedProject, initServer }) => {
          initServer();
          getSharedProject(shortId)
            .then(setSharedProject)
            .catch((err) => {
              console.error("Error loading shared project:", err);
              setSharedError("A link érvénytelen vagy lejárt.");
            });
        });
      } else {
        setSharedError("Érvénytelen link formátum.");
      }
    }
  }, [isSharedView]);

  useEffect(() => {
    if (!isRootGalleryView) return;
    setIsLoadingRootGallery(true);
    getPublicProjects()
      .then(setRootGalleryProjects)
      .catch((err) => console.error("Publikus projektek betöltése sikertelen:", err))
      .finally(() => setIsLoadingRootGallery(false));
  }, [isRootGalleryView]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load projects and preferences
  useEffect(() => {
    if (session?.access_token) {
      setIsLoadingProjects(true);
      initServer();

      // Load Projects
      loadProjects(session.access_token)
        .then(async (loaded: Project[]) => {
          const hydrated = await Promise.all(
            loaded.map((p) => refreshProjectUrls(p, session.access_token)),
          );
          setProjects(hydrated);

          // Check if any projects were cleaned up (had invalid paths removed)
          const needsSaving = hydrated.some((hydratedProj, idx) => {
            const originalProj = loaded[idx];
            return (
              (originalProj.imagePath && !hydratedProj.imagePath) ||
              (originalProj.introAudioPath && !hydratedProj.introAudioPath) ||
              originalProj.hotspots.some(
                (h: any, i: number) =>
                  h.audioPath && !hydratedProj.hotspots[i]?.audioPath,
              ) ||
              (originalProj.globalChannels || []).some(
                (c: any, i: number) =>
                  c.audioPath &&
                  !(hydratedProj.globalChannels || [])[i]?.audioPath,
              )
            );
          });

          // Auto-save to clean up invalid references in the database
          if (needsSaving) {
            console.log(
              "Auto-saving projects to clean up invalid file references",
            );
            saveProjects(session.access_token, hydrated).catch((err) =>
              console.error("Failed to auto-save cleaned projects:", err),
            );
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingProjects(false));

      // Load Preferences
      getUserPreferences(session.access_token)
        .then((prefs) => {
          if (!prefs.hasSeenOnboarding) {
            setShowOnboarding(true);
          }
        })
        .catch(console.error);
    }
  }, [session?.access_token]);

  // Auto-save
  useEffect(() => {
    if (session?.access_token && projects.length > 0) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        saveProjects(session.access_token, projects)
          .then(() => setIsSaving(false))
          .catch((e) => {
            console.error(e);
            setIsSaving(false);
          });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [projects, session?.access_token]);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const handleCreateProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: `Névtelen projekt ${projects.length + 1}`,
      imageFile: null,
      imageUrl: null,
      hotspots: [],
      globalChannels: [],
      introAudioFile: null,
      introAudioUrl: null,
      introAudioLoop: false,
      createdAt: Date.now(),
    };
    setProjects([...projects, newProject]);
    setCurrentProjectId(newProject.id);
    setView("editor");

    if (showOnboarding && tourStepIndex === 0) {
      setTourStepIndex(1);
    }
  };

  const openUploadModal = (type: "hotspot" | "channel", id: string) => {
    setUploadTarget({ type, id });
    setUploadModalOpen(true);

    // Close the tutorial when upload modal opens
    if (showOnboarding) {
      setShowOnboarding(false);
      if (session?.access_token) {
        saveUserPreferences(session.access_token, {
          hasSeenOnboarding: true,
        }).catch(console.error);
      }
    }
  };

  const handleLocalUpload = async (file: File) => {
    if (!uploadTarget || !session) return;

    const currentProject = projects.find((p) => p.id === currentProjectId);
    if (!currentProject) return;

    if (uploadTarget.type === "hotspot") {
      const path = `${session.user.id}/${currentProject.id}/hs_${uploadTarget.id}_${Date.now()}.mp3`;
      handleUpdateProject((p) => ({
        ...p,
        hotspots: p.hotspots.map((h) =>
          h.id === uploadTarget.id
            ? {
                ...h,
                audioFile: file,
                audioUrl: URL.createObjectURL(file),
                audioPath: path,
                name: file.name.split(".")[0],
              }
            : h,
        ),
      }));
      try {
        await uploadFile(session.access_token, file, path);
      } catch (e) {
        console.error(e);
      }
    } else if (uploadTarget.type === "channel") {
      if (uploadTarget.id === "new") {
        // Create a new channel when uploading
        const newChannel: GlobalChannel = {
          id: crypto.randomUUID(),
          name:
            file.name.split(".")[0] ||
            `Csatorna ${(currentProject.globalChannels || []).length + 1}`,
          audioFile: null,
          audioUrl: null,
          settings: {
            volume: 0.5,
            pan: 0,
            loop: true,
            fadeIn: 2.0,
            fadeOut: 2.0,
          },
        };
        const path = `${session.user.id}/${currentProject.id}/gc_${newChannel.id}_${Date.now()}.mp3`;

        handleUpdateProject((p) => ({
          ...p,
          globalChannels: [
            ...(p.globalChannels || []),
            {
              ...newChannel,
              audioFile: file,
              audioUrl: URL.createObjectURL(file),
              audioPath: path,
            },
          ],
        }));
        try {
          await uploadFile(session.access_token, file, path);
        } catch (e) {
          console.error(e);
        }
      } else {
        const path = `${session.user.id}/${currentProject.id}/gc_${uploadTarget.id}_${Date.now()}.mp3`;
        handleUpdateProject((p) => ({
          ...p,
          globalChannels: p.globalChannels.map((c) =>
            c.id === uploadTarget.id
              ? {
                  ...c,
                  audioFile: file,
                  audioUrl: URL.createObjectURL(file),
                  audioPath: path,
                }
              : c,
          ),
        }));
        try {
          await uploadFile(session.access_token, file, path);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleLibrarySelect = async (sound: any) => {
    if (!uploadTarget || !session) return;

    const currentProject = projects.find((p) => p.id === currentProjectId);
    if (!currentProject) return;

    try {
      // Download the sound from Freesound
      const response = await fetch(
        sound.previews["preview-hq-mp3"] || sound.previews["preview-lq-mp3"],
      );
      const blob = await response.blob();
      const file = new File([blob], `${sound.name}.mp3`, {
        type: "audio/mpeg",
      });

      if (uploadTarget.type === "hotspot") {
        const path = `${session.user.id}/${currentProject.id}/hs_${uploadTarget.id}_${Date.now()}.mp3`;
        const audioUrl =
          sound.previews["preview-hq-mp3"] || sound.previews["preview-lq-mp3"];
        handleUpdateProject((p) => ({
          ...p,
          hotspots: p.hotspots.map((h) =>
            h.id === uploadTarget.id
              ? {
                  ...h,
                  audioFile: file,
                  audioUrl: audioUrl,
                  audioPath: path,
                  name: sound.name,
                }
              : h,
          ),
        }));
        await uploadFile(session.access_token, file, path);
      } else if (uploadTarget.type === "channel") {
        if (uploadTarget.id === "new") {
          // Create a new channel when selecting from library
          const newChannel: GlobalChannel = {
            id: crypto.randomUUID(),
            name:
              sound.name ||
              `Csatorna ${(currentProject.globalChannels || []).length + 1}`,
            audioFile: null,
            audioUrl: null,
            settings: {
              volume: 0.5,
              pan: 0,
              loop: true,
              fadeIn: 2.0,
              fadeOut: 2.0,
            },
          };
          const path = `${session.user.id}/${currentProject.id}/gc_${newChannel.id}_${Date.now()}.mp3`;
          const audioUrl =
            sound.previews["preview-hq-mp3"] ||
            sound.previews["preview-lq-mp3"];

          handleUpdateProject((p) => ({
            ...p,
            globalChannels: [
              ...(p.globalChannels || []),
              {
                ...newChannel,
                audioFile: file,
                audioUrl: audioUrl,
                audioPath: path,
                name: sound.name,
              },
            ],
          }));
          await uploadFile(session.access_token, file, path);
        } else {
          const path = `${session.user.id}/${currentProject.id}/gc_${uploadTarget.id}_${Date.now()}.mp3`;
          const audioUrl =
            sound.previews["preview-hq-mp3"] ||
            sound.previews["preview-lq-mp3"];
          handleUpdateProject((p) => ({
            ...p,
            globalChannels: p.globalChannels.map((c) =>
              c.id === uploadTarget.id
                ? {
                    ...c,
                    audioFile: file,
                    audioUrl: audioUrl,
                    audioPath: path,
                    name: sound.name,
                  }
                : c,
            ),
          }));
          await uploadFile(session.access_token, file, path);
        }
      }
    } catch (e) {
      console.error("Failed to download sound:", e);
    }
  };

  const handleNarrationSave = async (file: File, path: string) => {
    if (!session || !currentProject) return;

    handleUpdateProject((p) => ({
      ...p,
      introAudioFile: file,
      introAudioUrl: URL.createObjectURL(file),
      introAudioPath: path,
    }));

    try {
      await uploadFile(session.access_token, file, path);
    } catch (e) {
      console.error("Failed to upload narration:", e);
    }
  };

  const handleUpdateProject = (
    updatedProject: Project | ((prev: Project) => Project),
  ) => {
    setProjects((prev) => {
      const nextProjects = prev.map((p) => {
        if (p.id === currentProjectId) {
          const nextP =
            typeof updatedProject === "function"
              ? updatedProject(p)
              : updatedProject;

          // Tour Logic
          if (showOnboarding) {
            // Step 1: Upload Image
            if (tourStepIndex === 1 && nextP.imageUrl && !p.imageUrl) {
              setTourStepIndex(2); // Move to draw zones step
            }
            // Step 2: Draw Zones - advance when first hotspot is created
            if (
              tourStepIndex === 2 &&
              nextP.hotspots.length > 0 &&
              p.hotspots.length === 0
            ) {
              setTourStepIndex(3); // Move to zone inventory step
            }
            // Step 4: Zone Upload Audio - advance when audio is added to zone
            if (tourStepIndex === 4) {
              const hasAudioAdded =
                nextP.hotspots.some((h) => h.audioUrl) &&
                !p.hotspots.some((h) => h.audioUrl);
              if (hasAudioAdded) {
                setTourStepIndex(5); // Move to zone done step
              }
            }
            // Step 6: Intro Audio (Narration)
            if (
              tourStepIndex === 6 &&
              nextP.introAudioUrl &&
              !p.introAudioUrl
            ) {
              setTourStepIndex(7); // Move to add channel step
            }
            // Step 7: Add Channel (Background Audio)
            if (
              tourStepIndex === 7 &&
              (nextP.globalChannels?.length || 0) >
                (p.globalChannels?.length || 0)
            ) {
              setTourStepIndex(8); // Move to preview step
            }
          }
          return nextP;
        }
        return p;
      });
      return nextProjects;
    });
  };

  const handleDeleteProject = async (id: string) => {
    const previous = projects;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentProjectId === id) {
      setCurrentProjectId(null);
      setView("gallery");
    }
    if (!session?.access_token) return;
    try {
      await deleteProject(session.access_token, id);
    } catch (e) {
      console.error(e);
      toast.error("A projekt törlése nem sikerült");
      setProjects(previous);
    }
  };

  const handleTogglePublic = async (projectId: string, isPublic: boolean) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, isPublic } : p))
    );
    try {
      await toggleProjectPublic(session.access_token, projectId, isPublic);
      toast.success(isPublic ? "A projekt most nyilvános" : "A projekt most privát");
    } catch {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, isPublic: !isPublic } : p))
      );
      toast.error("A láthatóság frissítése sikertelen");
    }
  };

  const handleShare = () => {
    if (showOnboarding && tourStepIndex === 9) {
      // Move to final step
      setShowOnboarding(false);
      if (session?.access_token) {
        saveUserPreferences(session.access_token, {
          hasSeenOnboarding: true,
        }).catch(console.error);
      }
    }
  };

  if (isSharedView) {
    if (sharedError)
      return (
        <div className="flex flex-col h-screen items-center justify-center text-slate-400 bg-slate-900 gap-4">
          <p>{sharedError}</p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = window.location.pathname)}
          >
            Vissza a főoldalra
          </Button>
        </div>
      );
    if (!sharedProject)
      return (
        <div className="flex h-screen items-center justify-center text-slate-500 bg-slate-900 text-white">
          Betöltés...
        </div>
      );
    return (
      <PlayerView
        project={sharedProject}
        onBack={() => {
          window.location.href = window.location.pathname;
        }}
        isShared={true}
      />
    );
  }

  if (isRootGalleryView) {
    if (selectedGalleryProject) {
      return (
        <PlayerView
          project={selectedGalleryProject}
          onBack={() => setSelectedGalleryProject(null)}
          isShared={true}
        />
      );
    }
    return (
      <>
        <RootGalleryView
          projects={rootGalleryProjects}
          isLoading={isLoadingRootGallery}
          session={session}
          onOpenProject={(shareShortId: string) => {
            setIsLoadingGalleryProject(true);
            getSharedProject(shareShortId)
              .then((p: Project) => setSelectedGalleryProject(p))
              .catch(() => toast.error("A hangtérkép betöltése sikertelen"))
              .finally(() => setIsLoadingGalleryProject(false));
          }}
          isLoadingProject={isLoadingGalleryProject}
          onLoginClick={() => setIsRootGalleryView(false)}
          onMyProjectsClick={() => setIsRootGalleryView(false)}
        />
      </>
    );
  }

  if (!session) {
    return <AuthView onLoginSuccess={() => {}} onBack={() => setIsRootGalleryView(true)} />;
  }

  if (view === "profile") {
    return (
      <ProfileView
        onBack={() => setView("gallery")}
        onSignOut={() => setSession(null)}
        onShowOnboarding={() => {
          setView("gallery");
          setShowOnboarding(true);
          setTourStepIndex(0);
        }}
      />
    );
  }

  return (
    <>
      <InteractiveTour
        steps={TOUR_STEPS}
        currentStepIndex={tourStepIndex}
        isOpen={showOnboarding}
        onNext={handleTourNext}
        onClose={handleTourClose}
      />
      {view === "gallery" && (
        <GalleryView
          projects={projects}
          onCreate={handleCreateProject}
          onSelect={(id) => {
            setCurrentProjectId(id);
            setView("editor");
          }}
          onDelete={handleDeleteProject}
          onProfile={() => setView("profile")}
          isLoading={isLoadingProjects}
          session={session}
          onGoToPublicGallery={() => setIsRootGalleryView(true)}
        />
      )}
      {view === "player" && currentProject && (
        <PlayerView project={currentProject} onBack={() => setView("editor")} />
      )}
      {view === "editor" && currentProject && (
        <EditorView
          project={currentProject}
          onUpdate={handleUpdateProject}
          onBack={() => setView("gallery")}
          onPreview={() => {
            // Check for zones without audio
            const zonesWithoutAudio = currentProject.hotspots
              .filter((h) => !h.audioUrl)
              .map((h, index) => h.name || `Zóna ${index + 1}`);

            if (zonesWithoutAudio.length > 0) {
              setMissingAudioZones(zonesWithoutAudio);
              setShowMissingAudioWarning(true);
            } else {
              if (showOnboarding && tourStepIndex === 8) setTourStepIndex(9); // Advance to share step
              setView("player");
            }
          }}
          session={session}
          onShare={handleShare}
          openUploadModal={openUploadModal}
          setNarrationModalOpen={setNarrationModalOpen}
          tourStepIndex={tourStepIndex}
          setTourStepIndex={setTourStepIndex}
          showOnboarding={showOnboarding}
          onTogglePublic={handleTogglePublic}
        />
      )}
      {!currentProject && view !== "gallery" && (
        <div>Hiba: A projekt nem található</div>
      )}

      <SoundUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onLocalUpload={handleLocalUpload}
        onLibrarySelect={handleLibrarySelect}
      />

      {session && currentProject && (
        <NarrationModal
          open={narrationModalOpen}
          onClose={() => setNarrationModalOpen(false)}
          onSave={handleNarrationSave}
          sessionUserId={session.user.id}
          projectId={currentProject.id}
        />
      )}

      {/* Warning dialog for zones without audio */}
      <AlertDialog
        open={showMissingAudioWarning}
        onOpenChange={setShowMissingAudioWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Hang nélküli zónák
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="text-sm text-slate-500">
                  A következő zónákhoz nincs hangfájl csatolva:
                </p>
                <ul className="mt-3 space-y-1 text-sm list-none">
                  {missingAudioZones.map((zone, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span className="text-slate-700">{zone}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-slate-600">
                  Ezek a zónák láthatók lesznek, de nem szólaltatnak meg hangot,
                  ha az előnézeti módban rájuk kattintasz.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vissza</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowMissingAudioWarning(false);
                if (showOnboarding && tourStepIndex === 4) setTourStepIndex(5);
                setView("player");
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Előnézet így is
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ---------------------------------------------------------------------------
// GALLERY VIEW
// ---------------------------------------------------------------------------

const GalleryView = ({
  projects,
  onCreate,
  onSelect,
  onDelete,
  onProfile,
  isLoading,
  session,
  onGoToPublicGallery,
}: {
  projects: Project[];
  onCreate: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onProfile: () => void;
  isLoading: boolean;
  session: any;
  onGoToPublicGallery: () => void;
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        onBrandClick={onGoToPublicGallery}
        description="Saját projektjeid kezelése — készíts és szerkessz hangtérképeket"
      >
        <Button
          variant="ghost"
          onClick={onGoToPublicGallery}
          aria-label="Vissza a nyilvános galériához"
          className="text-slate-500 hover:text-indigo-600 h-10 w-10 p-0 sm:w-auto sm:px-3 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-medium">Nyilvános galéria</span>
        </Button>
        <Button
          variant="ghost"
          onClick={onProfile}
          aria-label="Profil megnyitása"
          className="text-slate-500 hover:text-indigo-600 h-10 w-10 p-0 sm:w-auto sm:px-3 flex items-center justify-center gap-2"
        >
          <UserIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-medium">
            {session?.user?.user_metadata?.full_name ||
              session?.user?.email?.split("@")[0] ||
              "Felhasználó"}
          </span>
        </Button>
        <Button
          id="tour-create-project"
          onClick={onCreate}
          aria-label="Új projekt létrehozása"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0 rounded-full h-10 w-10 p-0 sm:rounded-md sm:w-auto sm:px-4 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Új projekt</span>
        </Button>
      </AppHeader>

      <main id="main-content" role="main" className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Projektjeim</h1>
          <p className="text-slate-500 mt-1">
            Válassz ki egy hangtérképet szerkesztéshez, vagy hozz létre egy újat.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
              <p>Projektek betöltése...</p>
            </div>
          ) : projects.length > 0 ? (
            projects.map((project) => (
              <Card
                key={project.id}
                className="group hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border-slate-200"
              >
                <div
                  className="h-48 bg-slate-100 relative flex items-center justify-center overflow-hidden"
                  onClick={() => onSelect(project.id)}
                >
                  {project.imageUrl ? (
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => onSelect(project.id)}
                      className="flex-1"
                    >
                      <h3 className="font-semibold text-slate-800 truncate">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {project.hotspots.length} zóna •{" "}
                        {project.globalChannels?.length || 0} csatorna
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-red-600"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Törlés
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Biztosan törlöd?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ez véglegesen törli a(z) „{project.title}" projektet. Ez a művelet nem vonható vissza.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Mégse</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => onDelete(project.id)}
                              >
                                Törlés
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <Music className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">
                Még nincsenek projektek
              </h3>
              <Button onClick={onCreate} variant="outline" className="mt-4">
                Projekt létrehozása
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// ---------------------------------------------------------------------------
// EDITOR VIEW
// ---------------------------------------------------------------------------

const pointsToSvgPath = (points: Point[]) => {
  if (points.length === 0) return "";
  return points.map((p) => `${p.x},${p.y}`).join(" ");
};

// Check if two polygons overlap using point-in-polygon and edge intersection tests
const polygonsOverlap = (poly1: Point[], poly2: Point[]): boolean => {
  // Check if any point of poly1 is inside poly2
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Check if any point of poly1 is in poly2
  for (const point of poly1) {
    if (isPointInPolygon(point, poly2)) return true;
  }

  // Check if any point of poly2 is in poly1
  for (const point of poly2) {
    if (isPointInPolygon(point, poly1)) return true;
  }

  // Check if any edges intersect
  const doEdgesIntersect = (
    p1: Point,
    p2: Point,
    p3: Point,
    p4: Point,
  ): boolean => {
    const ccw = (A: Point, B: Point, C: Point) => {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    };
    return (
      ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
    );
  };

  for (let i = 0; i < poly1.length; i++) {
    const p1 = poly1[i];
    const p2 = poly1[(i + 1) % poly1.length];

    for (let j = 0; j < poly2.length; j++) {
      const p3 = poly2[j];
      const p4 = poly2[(j + 1) % poly2.length];

      if (doEdgesIntersect(p1, p2, p3, p4)) return true;
    }
  }

  return false;
};

const EditorView = ({
  project,
  onUpdate,
  onBack,
  onPreview,
  session,
  onShare,
  openUploadModal,
  setNarrationModalOpen,
  tourStepIndex,
  setTourStepIndex,
  showOnboarding,
  onTogglePublic,
}: {
  project: Project;
  onUpdate: (p: Project | ((prev: Project) => Project)) => void;
  onBack: () => void;
  onPreview: () => void;
  session: any;
  onShare?: () => void;
  openUploadModal: (type: "hotspot" | "channel", id: string) => void;
  setNarrationModalOpen: (open: boolean) => void;
  tourStepIndex?: number;
  setTourStepIndex?: (index: number) => void;
  showOnboarding?: boolean;
  onTogglePublic: (projectId: string, isPublic: boolean) => void;
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    null,
  );

  // Drawer state for mobile
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Overlap warning state
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);

  // Canvas highlight state for "Add Zones" prompt
  const [isCanvasHighlighted, setIsCanvasHighlighted] = useState(false);

  const engine = useAudioEngine();

  // Preview channel state
  const [previewingChannelId, setPreviewingChannelId] = useState<string | null>(
    null,
  );
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Preview zone audio state
  const [previewingZoneId, setPreviewingZoneId] = useState<string | null>(null);
  const zonePreviewTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Preview intro audio state
  const [previewingIntroAudio, setPreviewingIntroAudio] = useState(false);
  const introPreviewTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Collapsed channels state (all collapsed by default)
  const [collapsedChannels, setCollapsedChannels] = useState<Set<string>>(
    new Set(),
  );

  // Collapsed intro audio state
  const [collapsedIntroAudio, setCollapsedIntroAudio] = useState(true);

  // Focused zone state for keyboard navigation
  const [focusedZoneId, setFocusedZoneId] = useState<string | null>(null);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Collapse all background channels when project loads or changes
  useEffect(() => {
    if (project?.globalChannels) {
      const allChannelIds = project.globalChannels.map((c) => c.id);
      setCollapsedChannels(new Set(allChannelIds));
    }
  }, [project?.id]); // Only run when project ID changes

  // Clean up preview timer on unmount
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
      if (zonePreviewTimerRef.current) {
        clearTimeout(zonePreviewTimerRef.current);
      }
      if (introPreviewTimerRef.current) {
        clearTimeout(introPreviewTimerRef.current);
      }
    };
  }, []);

  // Tour logic: Advance when zone is selected
  useEffect(() => {
    if (showOnboarding && tourStepIndex === 3 && selectedHotspotId) {
      // Zone selected, advance to upload audio step
      setTourStepIndex?.(4);
    }
  }, [selectedHotspotId, showOnboarding, tourStepIndex, setTourStepIndex]);

  // Tour logic: Advance when Done button is clicked (zone deselected)
  const handleSetSelectedHotspotId = useCallback(
    (id: string | null) => {
      const wasSelected = selectedHotspotId !== null;
      setSelectedHotspotId(id);

      // If deselecting (Done button clicked) and on zone-done step, advance to intro-audio
      if (showOnboarding && tourStepIndex === 5 && wasSelected && id === null) {
        setTourStepIndex?.(6);
      }
    },
    [selectedHotspotId, showOnboarding, tourStepIndex, setTourStepIndex],
  );

  // Initialize existing channels as collapsed (but not new ones)
  useEffect(() => {
    setCollapsedChannels((prev) => {
      // Keep channels that still exist
      const existingIds = new Set(project.globalChannels.map((c) => c.id));
      const next = new Set<string>();

      // Add back channels that were previously collapsed and still exist
      prev.forEach((id) => {
        if (existingIds.has(id)) {
          next.add(id);
        }
      });

      return next;
    });
  }, [project.globalChannels.length]); // Only run when channel count changes

  const toggleChannelPreview = (channel: GlobalChannel) => {
    if (!channel.audioUrl) return;

    const previewId = `preview-${channel.id}`;

    if (previewingChannelId === channel.id) {
      engine.stop(previewId);
      setPreviewingChannelId(null);
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
    } else {
      // Stop any currently playing preview
      if (previewingChannelId) {
        engine.stop(`preview-${previewingChannelId}`);
      }
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }

      engine.play(previewId, channel.audioUrl, channel.settings);
      setPreviewingChannelId(channel.id);

      // Auto-stop after 5 seconds
      previewTimerRef.current = setTimeout(() => {
        engine.stop(previewId);
        setPreviewingChannelId(null);
        previewTimerRef.current = null;
      }, 5000);
    }
  };

  const toggleIntroAudioPreview = () => {
    if (!project.introAudioUrl) return;

    const previewId = "preview-intro";

    if (previewingIntroAudio) {
      engine.stop(previewId);
      setPreviewingIntroAudio(false);
      if (introPreviewTimerRef.current) {
        clearTimeout(introPreviewTimerRef.current);
        introPreviewTimerRef.current = null;
      }
    } else {
      engine.play(previewId, project.introAudioUrl, {
        volume: 1,
        pan: 0,
        loop: false,
        fadeIn: 0,
        fadeOut: 0,
      });
      setPreviewingIntroAudio(true);

      // Auto-stop after 5 seconds
      introPreviewTimerRef.current = setTimeout(() => {
        engine.stop(previewId);
        setPreviewingIntroAudio(false);
        introPreviewTimerRef.current = null;
      }, 5000);
    }
  };

  const toggleZonePreview = (hotspot: Hotspot) => {
    if (!hotspot.audioUrl) return;

    const previewId = `preview-zone-${hotspot.id}`;

    if (previewingZoneId === hotspot.id) {
      engine.stop(previewId);
      setPreviewingZoneId(null);
      if (zonePreviewTimerRef.current) {
        clearTimeout(zonePreviewTimerRef.current);
        zonePreviewTimerRef.current = null;
      }
    } else {
      // Stop any currently playing preview
      if (previewingZoneId) {
        engine.stop(`preview-zone-${previewingZoneId}`);
      }
      if (zonePreviewTimerRef.current) {
        clearTimeout(zonePreviewTimerRef.current);
      }

      engine.play(previewId, hotspot.audioUrl, hotspot.settings);
      setPreviewingZoneId(hotspot.id);

      // Auto-stop after 5 seconds
      zonePreviewTimerRef.current = setTimeout(() => {
        engine.stop(previewId);
        setPreviewingZoneId(null);
        zonePreviewTimerRef.current = null;
      }, 5000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const sanitizedName = sanitizeFilename(file.name);
      const path = `${session.user.id}/${project.id}/bg_${Date.now()}_${sanitizedName}`;

      // Optimistic update with temporary path
      onUpdate((prev) => ({
        ...prev,
        imageFile: file,
        imageUrl: url,
        hotspots: [],
        imagePath: path,
      }));

      try {
        // Upload returns the actual sanitized path used by the server
        const actualPath = await uploadFile(session.access_token, file, path);
        // Update with the actual path returned from server
        onUpdate((prev) => ({ ...prev, imagePath: actualPath }));
        toast.success("A kép sikeresen feltöltve.");
      } catch (e) {
        console.error("Image upload failed", e);
        toast.error("A kép feltöltése sikertelen. Kérjük, próbáld újra.");
      }
    }
  };

  const getRelativeCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imageContainerRef.current) return { x: 0, y: 0 };
    const rect = imageContainerRef.current.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleStartDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!project.imageUrl) return;
    if ((e.target as Element).tagName === "polygon") return;
    setIsDrawing(true);
    setIsCanvasHighlighted(false); // Clear highlight when starting to draw
    const point = getRelativeCoordinates(e);
    setCurrentPoints([point]);
    handleSetSelectedHotspotId(null);
    engine.stopAll();
  };

  const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    // Prevent scrolling on touch move when drawing
    if ('touches' in e) e.preventDefault();
    setCurrentPoints((prev) => [...prev, getRelativeCoordinates(e)]);
  };

  const handleStopDrawing = () => {
    if (!isDrawing) return;
    if (currentPoints.length > 5) {
      // Check if new selection overlaps with any existing hotspots
      const hasOverlap = project.hotspots.some((hotspot) =>
        polygonsOverlap(currentPoints, hotspot.points),
      );

      if (hasOverlap) {
        // Show popup alert and don't create the hotspot
        setShowOverlapWarning(true);
        setIsDrawing(false);
        setCurrentPoints([]);
        return;
      }

      const newHotspot: Hotspot = {
        id: crypto.randomUUID(),
        points: currentPoints,
        audioFile: null,
        audioUrl: null,
        name: `Zóna ${project.hotspots.length + 1}`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        settings: { volume: 1, pan: 0, loop: false, fadeIn: 0.5, fadeOut: 0.5 },
      };
      onUpdate({ ...project, hotspots: [...project.hotspots, newHotspot] });
      handleSetSelectedHotspotId(newHotspot.id);
      openUploadModal("hotspot", newHotspot.id);
      // Auto open drawer on mobile if new hotspot created
      if (window.innerWidth < 1024) setIsDrawerOpen(true);
    }
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const addGlobalChannel = () => {
    // Instead of creating the channel immediately, just open the modal with a special marker
    openUploadModal("channel", "new");
  };

  const toggleChannelCollapse = (channelId: string) => {
    setCollapsedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  };

  const toggleIntroAudioCollapse = () => {
    setCollapsedIntroAudio((prev) => !prev);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0 z-20 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="-ml-2 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Input
            className="font-semibold text-lg border-transparent hover:border-slate-200 focus-visible:border-indigo-500 shadow-none focus-visible:ring-0 px-3 h-9 flex-1 min-w-0 max-w-md transition-colors"
            value={project.title}
            onChange={(e) => onUpdate({ ...project, title: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex h-9"
                id="tour-share-btn"
                onClick={onShare}
              >
                <Share2 className="w-4 h-4 mr-2" /> Megosztás
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Projekt megosztása</DialogTitle>
                <DialogDescription>
                  Bárki megtekintheti és lejátszhatja a hangtérképedet ezzel a linkkel.
                  Tökéletes tabletekhez.
                </DialogDescription>
              </DialogHeader>
              <ShareDialogContent session={session} project={project} onTogglePublic={onTogglePublic} />
            </DialogContent>
          </Dialog>

          <Button
            id="tour-preview-btn"
            onClick={onPreview}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 h-9 w-9 sm:w-auto sm:px-4 p-0 flex items-center justify-center"
            disabled={!project.imageUrl}
          >
            <Play className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Előnézet</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
        {/* Canvas Area - Takes full height on mobile */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center p-4 lg:p-8 select-none h-full">
          {!project.imageUrl ? (
            <div className="text-center" id="tour-upload-image">
              <Button asChild size="lg">
                <label className="cursor-pointer">
                  <Upload className="w-5 h-5 mr-2" /> Kép feltöltése
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </Button>
            </div>
          ) : (
            <div
              id="tour-canvas-area"
              ref={imageContainerRef}
              className={`relative shadow-2xl transition-all duration-500 ${
                isCanvasHighlighted
                  ? "ring-4 ring-indigo-500 ring-offset-4 ring-offset-slate-100"
                  : ""
              }`}
              onMouseDown={handleStartDrawing}
              onMouseMove={handleDrawMove}
              onMouseUp={handleStopDrawing}
              onMouseLeave={handleStopDrawing}
              onTouchStart={handleStartDrawing}
              onTouchMove={handleDrawMove}
              onTouchEnd={handleStopDrawing}
              onTouchCancel={handleStopDrawing}
            >
              <img
                src={project.imageUrl}
                className="max-w-full max-h-[85vh] block pointer-events-none select-none"
                draggable={false}
              />
              <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {project.hotspots.map((h) => (
                  <polygon
                    key={h.id}
                    points={pointsToSvgPath(h.points)}
                    fill={selectedHotspotId === h.id ? h.color : h.color}
                    fillOpacity={selectedHotspotId === h.id ? 0.5 : 0.25}
                    stroke={
                      selectedHotspotId === h.id
                        ? "white"
                        : focusedZoneId === h.id
                          ? "white"
                          : h.color
                    }
                    strokeWidth={
                      selectedHotspotId === h.id
                        ? "0.8"
                        : focusedZoneId === h.id
                          ? "1.2"
                          : "0.4"
                    }
                    style={{
                      pointerEvents: "all",
                      cursor: "pointer",
                      vectorEffect: "non-scaling-stroke",
                      filter:
                        focusedZoneId === h.id
                          ? "drop-shadow(0 0 10px rgba(255, 255, 255, 0.9))"
                          : "none",
                      outline: "none",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetSelectedHotspotId(h.id);
                      if (h.audioUrl) {
                        engine.stopAll();
                        engine.play(h.id, h.audioUrl, h.settings);
                      }
                      if (window.innerWidth < 1024) setIsDrawerOpen(true);
                    }}
                    onFocus={() => {
                      setFocusedZoneId(h.id);
                      // Clear selection when tabbing to a different zone
                      if (selectedHotspotId !== h.id) {
                        setSelectedHotspotId(null);
                      }
                    }}
                    onBlur={() => setFocusedZoneId(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSetSelectedHotspotId(h.id);
                        if (h.audioUrl) {
                          engine.stopAll();
                          engine.play(h.id, h.audioUrl, h.settings);
                        }
                        if (window.innerWidth < 1024) setIsDrawerOpen(true);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Hangzóna: ${h.name}`}
                  />
                ))}
                {isDrawing &&
                  currentPoints.length > 0 &&
                  (() => {
                    const wouldOverlap =
                      currentPoints.length > 5 &&
                      project.hotspots.some((hotspot) =>
                        polygonsOverlap(currentPoints, hotspot.points),
                      );
                    return (
                      <polygon
                        points={pointsToSvgPath(currentPoints)}
                        fill={
                          wouldOverlap
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(99, 102, 241, 0.2)"
                        }
                        stroke={wouldOverlap ? "#ef4444" : "#4f46e5"}
                        strokeWidth="0.5"
                      />
                    );
                  })()}
              </svg>
            </div>
          )}
        </div>

        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden lg:flex w-96 bg-white border-l shadow-xl z-10 flex-col shrink-0">
          <div className="flex-1 overflow-y-auto">
            <SettingsPanelContent
              project={project}
              selectedHotspotId={selectedHotspotId}
              onUpdate={onUpdate}
              setSelectedHotspotId={handleSetSelectedHotspotId}
              addGlobalChannel={addGlobalChannel}
              session={session}
              openUploadModal={openUploadModal}
              previewingChannelId={previewingChannelId}
              toggleChannelPreview={toggleChannelPreview}
              collapsedChannels={collapsedChannels}
              toggleChannelCollapse={toggleChannelCollapse}
              setNarrationModalOpen={setNarrationModalOpen}
              engine={engine}
              previewingIntroAudio={previewingIntroAudio}
              toggleIntroAudioPreview={toggleIntroAudioPreview}
              introPreviewTimerRef={introPreviewTimerRef}
              collapsedIntroAudio={collapsedIntroAudio}
              toggleIntroAudioCollapse={toggleIntroAudioCollapse}
              previewingZoneId={previewingZoneId}
              toggleZonePreview={toggleZonePreview}
              setIsCanvasHighlighted={setIsCanvasHighlighted}
            />
          </div>
        </div>

        {/* Mobile Bottom Bar Trigger & Drawer */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pointer-events-none flex justify-center z-30">
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                className="shadow-xl rounded-full pointer-events-auto bg-white h-12 px-6"
              >
                <Settings2 className="w-5 h-5 mr-2" />
                {selectedHotspotId ? "Zóna szerkesztése" : "Beállítások és rétegek"}
                <ChevronUp className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh] flex flex-col">
              <DrawerTitle className="sr-only">Projekt beállítások</DrawerTitle>
              <DrawerDescription className="sr-only">
                Zónák, hang és projektbeállítások kezelése.
              </DrawerDescription>
              <div className="overflow-y-auto flex-1">
                <SettingsPanelContent
                  project={project}
                  selectedHotspotId={selectedHotspotId}
                  onUpdate={onUpdate}
                  setSelectedHotspotId={handleSetSelectedHotspotId}
                  addGlobalChannel={addGlobalChannel}
                  session={session}
                  openUploadModal={openUploadModal}
                  previewingChannelId={previewingChannelId}
                  toggleChannelPreview={toggleChannelPreview}
                  collapsedChannels={collapsedChannels}
                  toggleChannelCollapse={toggleChannelCollapse}
                  setNarrationModalOpen={setNarrationModalOpen}
                  engine={engine}
                  previewingIntroAudio={previewingIntroAudio}
                  toggleIntroAudioPreview={toggleIntroAudioPreview}
                  introPreviewTimerRef={introPreviewTimerRef}
                  collapsedIntroAudio={collapsedIntroAudio}
                  toggleIntroAudioCollapse={toggleIntroAudioCollapse}
                  previewingZoneId={previewingZoneId}
                  toggleZonePreview={toggleZonePreview}
                  setIsCanvasHighlighted={setIsCanvasHighlighted}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Overlap Warning Dialog */}
      <AlertDialog
        open={showOverlapWarning}
        onOpenChange={setShowOverlapWarning}
      >
        <AlertDialogContent className="max-w-md">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="text-2xl font-semibold text-slate-900">
                Átfedő kijelölés
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-slate-600 leading-relaxed">
                Ez a kijelölés átfed egy meglévő zónával. A hangzónák nem fedhetik át egymást. Kérjük, rajzold a kijelölést egy másik területre, amely nem fed át meglévő zónákkal.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="mt-2 flex justify-center">
            <AlertDialogAction
              onClick={() => setShowOverlapWarning(false)}
              className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
            >
              Értettem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PLAYER VIEW
// ---------------------------------------------------------------------------

const PlayerView = ({
  project,
  onBack,
  isShared,
}: {
  project: Project;
  onBack: () => void;
  isShared?: boolean;
}) => {
  const [hasStarted, setHasStarted] = useState(false);
  // 'idle' = waiting for first tap, 'speaking' = instructions playing, 'narrating' = intro audio playing
  const [introPhase, setIntroPhase] = useState<'idle' | 'speaking' | 'narrating'>('idle');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const engine = useAudioEngine();
  const introAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleStart = () => {
    setHasStarted(true);

    // Unlock AudioContext within this user gesture so hover audio works immediately
    engine.unlock();

    // Request Fullscreen
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem
        .requestFullscreen()
        .catch((err) => console.log("Fullscreen blocked", err));
    }

    if (introAudioRef.current) {
      try {
        introAudioRef.current.pause();
      } catch (e) {
        console.error("Error pausing intro audio:", e);
      }
    }
    engine.stopAll();

    (project.globalChannels || []).forEach((channel) => {
      if (channel.audioUrl) {
        engine.play(channel.id, channel.audioUrl, channel.settings);
      }
    });
  };

  const handleBack = () => {
    // Exit fullscreen
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .catch((err) => console.log("Exit fullscreen error", err));
    }
    onBack();
  };

  // Auto-play intro audio for non-shared (sighted editor preview)
  useEffect(() => {
    if (isShared || hasStarted || !project.introAudioUrl) return;
    const audio = new Audio(project.introAudioUrl);
    audio.loop = project.introAudioLoop;
    introAudioRef.current = audio;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) =>
        console.log("Autoplay blocked by browser policy:", e),
      );
    }
    return () => {
      try { audio.pause(); } catch (e) {}
    };
  }, [isShared, hasStarted, project.introAudioUrl, project.introAudioLoop]);

  const playIntroAudio = useCallback(() => {
    if (project.introAudioUrl) {
      setIntroPhase('narrating');
      const audio = new Audio(project.introAudioUrl);
      introAudioRef.current = audio;
      audio.onended = () => handleStart();
      audio.play().catch(console.error);
    } else {
      handleStart();
    }
  }, [project.introAudioUrl]);

  // Accessible intro: first tap speaks instructions via TTS, then plays intro audio
  const startAccessibleIntro = useCallback(() => {
    if (introPhase !== 'idle') return;

    const name = project.title ? `${project.title}. ` : '';
    const instructions = `${name}Ez egy interaktív hangtérkép. A bevezetés után húzd az ujjadat a képen a felfedezéshez. Minden zóna hangot játszik le, és néhány másodperc után felolvassa a leírást. Érintsd meg a képernyőt az átugráshoz.`;

    const utterance = new SpeechSynthesisUtterance(instructions);
    setIntroPhase('speaking');
    utterance.onend = playIntroAudio;
    speechSynthesis.speak(utterance);
  }, [introPhase, project.title, playIntroAudio]);

  const handleIntroTap = useCallback(() => {
    if (introPhase === 'idle') {
      startAccessibleIntro();
    } else if (introPhase === 'speaking') {
      // Skip TTS, play narration directly
      speechSynthesis.cancel();
      playIntroAudio();
    } else if (introPhase === 'narrating') {
      handleStart();
    }
  }, [introPhase, startAccessibleIntro, playIntroAudio]);

  const playHotspot = (hotspot: Hotspot) => {
    if (!hotspot.audioUrl) return;
    if (playingId === hotspot.id) return;
    // If we switch directly from one hotspot to another,
    // we might want to fade the old one out quickly while starting the new one
    // The engine handles fading out if we stop it.
    if (playingId) engine.stop(playingId);
    engine.play(hotspot.id, hotspot.audioUrl, hotspot.settings);
    setPlayingId(hotspot.id);
  };

  const stopHotspot = (hotspot: Hotspot) => {
    if (playingId === hotspot.id && !hotspot.settings.loop) {
      engine.stop(playingId);
      setPlayingId(null);
    }
    // If it IS looping, we also stop it on mouse leave (fade out)
    // Usually in these maps, "hover" = play, "leave" = stop, even if looping.
    // Looping just means it repeats WHILE you hover.
    else if (playingId === hotspot.id && hotspot.settings.loop) {
      engine.stop(playingId);
      setPlayingId(null);
    }
  };

  const handleZoneEnter = useCallback((id: string) => {
    const hotspot = project.hotspots.find((h) => h.id === id);
    if (hotspot) playHotspot(hotspot);
  }, [project.hotspots]);

  const handleZoneLeave = useCallback(() => {
    if (playingId) {
      engine.stop(playingId);
      setPlayingId(null);
    }
  }, [playingId, engine]);

  const { handleTouchMove, handleTouchEnd } = useAccessiblePlayer({
    zones: project.hotspots.map((h) => ({
      id: h.id,
      accessibilityDescription: h.accessibilityDescription,
    })),
    onZoneEnter: handleZoneEnter,
    onZoneLeave: handleZoneLeave,
  });

  if (!hasStarted && isShared) {
    return (
      <div
        className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-[100]"
        onClick={handleIntroTap}
        role="main"
        aria-label={project.title || 'Interaktív hangtérkép'}
      >
        <div className="absolute top-4 left-4 z-50" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="bg-black/20 text-white border-white/20 backdrop-blur-md hover:bg-black/40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Vissza a galériához
          </Button>
        </div>
        <span className="sr-only">
          {introPhase === 'idle'
            ? 'Interaktív hangtérkép. Érintsd meg a képernyőt a bevezetés meghallgatásához.'
            : introPhase === 'speaking'
            ? 'A bevezetés lejátszás alatt van. Kérjük, várj.'
            : 'Érintsd meg a képernyőt a hangtérkép felfedezéséhez.'}
        </span>
        <div className="max-w-md w-full space-y-4 pointer-events-none" aria-hidden="true">
          <h1 className="text-4xl font-bold text-white">{project.title || 'Hangtérkép'}</h1>
          <p className="text-slate-400">Interaktív hangtérkép</p>
          {introPhase === 'idle' && (
            <p className="text-slate-500 text-sm mt-8">Érintsd meg a képernyőt a kezdéshez</p>
          )}
          {introPhase === 'speaking' && (
            <p className="text-slate-500 text-sm mt-8">Érintsd meg a képernyőt az átugráshoz</p>
          )}
          {introPhase === 'narrating' && (
            <p className="text-slate-500 text-sm mt-8">Érintsd meg a képernyőt a folytatáshoz</p>
          )}
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-[100]">
        <div className="max-w-md w-full animate-in fade-in zoom-in duration-300 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {project.title}
            </h1>
            <p className="text-slate-400">Interaktív hangtérkép</p>
          </div>
          <Button
            size="lg"
            onClick={handleStart}
            className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl transition-all hover:scale-105"
          >
            <Play className="w-6 h-6 mr-2 fill-current" />
            Élmény indítása
          </Button>
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-slate-300"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Vissza a szerkesztőbe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-50">
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="bg-black/20 text-white border-white/20 backdrop-blur-md hover:bg-black/40"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isShared ? "Vissza a galériához" : "Vissza a szerkesztéshez"}
        </Button>
      </div>

      <div
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="application"
        aria-label="Interaktív hangtérkép. Húzd az ujjadat a zónák felfedezéséhez."
      >
        <span className="sr-only">
          Helyezd az ujjadat a képre és húzd a felfedezéshez. A hang akkor szólal meg, amikor belépel egy zónába. Néhány másodperc után egy leírás is felolvasásra kerül.
        </span>
        <div
          className="relative shadow-2xl select-none"
          style={{ touchAction: "none" }}
        >
          <img
            src={project.imageUrl || ""}
            className="max-w-full max-h-[90vh] block pointer-events-none"
            draggable={false}
          />
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {project.hotspots.map((h) => (
              <polygon
                key={h.id}
                data-id={h.id}
                points={pointsToSvgPath(h.points)}
                fill={playingId === h.id ? h.color : "transparent"}
                fillOpacity={0.5}
                stroke="transparent"
                onMouseEnter={() => playHotspot(h)}
                onMouseLeave={() => stopHotspot(h)}
                onTouchStart={() => playHotspot(h)}
                className="cursor-crosshair transition-all duration-200"
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};
