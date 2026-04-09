import { useRef, useCallback } from 'react';

interface Zone {
  id: string;
  accessibilityDescription?: string | null;
}

/**
 * Manages accessible spatial touch exploration for the sound map player.
 *
 * Behaviour:
 * - When a finger enters a zone: audio switches immediately (via onZoneEnter)
 * - After delayMs with no zone change: the zone's accessibilityDescription is spoken
 * - If speech is in progress when a new zone is entered: finish the current utterance,
 *   then start the delay timer for the new zone (pending slot, not a queue)
 * - When the finger lifts: audio stops, pending speech is dropped, current utterance
 *   finishes naturally
 *
 * Requires role="application" on the container so VoiceOver passes raw touch events
 * through instead of intercepting them.
 */
export function useAccessiblePlayer({
  zones,
  onZoneEnter,
  onZoneLeave,
  delayMs = 3500,
}: {
  zones: Zone[];
  onZoneEnter: (id: string) => void;
  onZoneLeave: () => void;
  delayMs?: number;
}) {
  const activeZoneId = useRef<string | null>(null);
  const pendingZoneId = useRef<string | null>(null);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSpeaking = useRef(false);
  // Keep zones in a ref so the speak callback always sees the latest list
  const zonesRef = useRef(zones);
  zonesRef.current = zones;

  const clearTimer = () => {
    if (delayTimer.current) {
      clearTimeout(delayTimer.current);
      delayTimer.current = null;
    }
  };

  const speakZone = useCallback(
    (id: string) => {
      const zone = zonesRef.current.find((z) => z.id === id);
      if (!zone?.accessibilityDescription) return;

      const utterance = new SpeechSynthesisUtterance(zone.accessibilityDescription);
      isSpeaking.current = true;

      utterance.onend = () => {
        isSpeaking.current = false;
        const next = pendingZoneId.current;
        if (next) {
          pendingZoneId.current = null;
          activeZoneId.current = next;
          delayTimer.current = setTimeout(() => speakZone(next), delayMs);
        }
      };

      speechSynthesis.speak(utterance);
    },
    [delayMs],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);

      if (el?.tagName === 'polygon') {
        const id = el.getAttribute('data-id');
        if (!id || id === activeZoneId.current) return;

        // Switch audio immediately
        onZoneEnter(id);
        clearTimer();

        if (isSpeaking.current) {
          // Let current utterance finish; queue this zone for after
          pendingZoneId.current = id;
        } else {
          activeZoneId.current = id;
          delayTimer.current = setTimeout(() => speakZone(id), delayMs);
        }
      } else if (activeZoneId.current) {
        // Finger moved off all zones
        onZoneLeave();
        activeZoneId.current = null;
        pendingZoneId.current = null;
        clearTimer();
        // Current utterance finishes naturally — no speechSynthesis.cancel()
      }
    },
    [onZoneEnter, onZoneLeave, speakZone, delayMs],
  );

  const handleTouchEnd = useCallback(() => {
    if (activeZoneId.current) {
      onZoneLeave();
      activeZoneId.current = null;
      pendingZoneId.current = null;
      clearTimer();
      // Current utterance finishes naturally
    }
  }, [onZoneLeave]);

  return { handleTouchMove, handleTouchEnd };
}
