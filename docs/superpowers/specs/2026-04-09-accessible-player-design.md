# Accessible Player Design

**Date:** 2026-04-09
**Status:** Approved

## Overview

Make the shared player experience fully accessible for blind and visually impaired users on iPad/tablet. The admin prepares a sound map (image + zones with audio and descriptions), shares a link, and the recipient can explore the picture through spatial touch — no sight required.

---

## Rename

`Screen narration` → `Intro narration` everywhere in the editor UI (labels, placeholders, tooltips).

---

## Intro Screen

A new screen shown before the map when opening a shared link. Renders in place of the current direct jump to the player.

### Sequence

1. **Web Speech API announces instructions** immediately on load:
   > *"[Project name]. This is an interactive sound map. After this introduction, drag your finger across the image to explore. Each zone plays audio and announces a description after a few seconds. Tap anywhere to skip to the sound map."*

2. **Intro narration audio starts** once the spoken instructions finish.

3. **Tap anywhere** (available only after instructions have finished) → advances to map screen immediately.

4. **Auto-advance** → if no tap, automatically transitions to the map once the intro narration audio finishes.

### Notes

- If there is no intro narration audio, auto-advance immediately after instructions finish.
- If there is no intro narration and no project name, instructions still play with a generic opener.
- The "tap anywhere" gesture is enabled only after `speechSynthesis.onend` fires for the instructions utterance — prevents accidental skips.

---

## Map Screen

### `role="application"` on the image container

Tells VoiceOver to pass raw touch events through to the page instead of intercepting them. Without this, `touchmove` does not fire while VoiceOver is active.

```
aria-label="Interactive sound map. Drag your finger to explore zones."
```

A visually-hidden `<span className="sr-only">` just inside the container provides fallback instructions for users who arrive without going through the intro screen:

> *"Place your finger anywhere on the image and drag to explore. Audio plays when you enter a zone. A description is announced after a few seconds."*

### `useAccessiblePlayer` hook

Single hook that owns all accessibility behaviour for the map screen. `PlayerView` calls it and replaces its existing `touchmove` handler with the hook's output.

**Inputs:**
- `zones: { id, audioUrl, accessibilityDescription }[]`
- `onZoneEnter: (id: string) => void` — delegates audio start to existing `useAudioEngine`
- `onZoneLeave: () => void` — delegates audio stop

**Internal state:**

| State | Purpose |
|---|---|
| `activeZoneId` | Zone currently under the finger |
| `pendingZoneId` | Zone waiting for current speech to finish |
| `delayTimer` | `setTimeout` ref for the 3.5s announcement delay |
| `utterance` | Current `SpeechSynthesisUtterance` ref |

**Touch flow:**

1. `touchmove` fires → polygon hit-test determines `newZoneId`
2. If `newZoneId === activeZoneId` → no-op
3. If changed:
   - Switch audio immediately (`onZoneEnter(newZoneId)`)
   - Cancel `delayTimer`
   - If speech is currently playing → set `pendingZoneId = newZoneId`, wait for `utterance.onend`
   - If speech is idle → set `activeZoneId = newZoneId`, start 3.5s `delayTimer`
4. `delayTimer` fires → `speechSynthesis.speak(zone.accessibilityDescription)`
5. `utterance.onend` fires → if `pendingZoneId` exists → promote it to `activeZoneId`, clear pending, start new 3.5s `delayTimer`
6. Finger lifts (`touchend`) → cancel `delayTimer`, cancel pending, stop audio. Let current sentence finish naturally.

**Zone with no `accessibilityDescription`:** audio plays, no speech announced.

**Rapid zone switching:** only the most recent zone occupies the pending slot — stale intermediate zones are silently dropped.

---

## What is not changing

- The audio engine (`useAudioEngine`) — no changes needed
- The editor, share flow, zone creation, upload modal
- The visual appearance of the player for sighted users

---

## Files affected

| File | Change |
|---|---|
| `src/components/SoundMapApp.tsx` | Rename "screen narration" → "intro narration" in labels/placeholders; add intro screen before `PlayerView`; add `role="application"` and hook integration to `PlayerView` (defined inline at line ~3073) |
| `src/hooks/useAccessiblePlayer.ts` | New file — the hook |
