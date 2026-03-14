# Frontend Style Guide — Pixel RPG Dental Clinic

This document describes the visual design system used across all gamified UI components in this project. Use it as a reference when building new components so they match the existing aesthetic.

---

## Theme Overview

The UI is styled as a **pixel-art RPG** — think classic JRPG inventory screens, quest logs, and NPC dialogue boxes. The game world is a top-down pixel-art dental clinic. All popup windows, modals, and overlays should feel like they belong inside that world.

**Do not use:**
- Rounded corners (no `border-radius` on any RPG panel element)
- Drop shadows with blur (use hard pixel offsets instead)
- Gradients on panels (flat colors only; gradients only for image overlays)
- Sans-serif or system fonts inside RPG panels
- Animations that feel "modern" (no easing springs, no sliding drawers)

---

## Font

```tsx
const FONT = "'Press Start 2P', monospace";
```

Import via Google Fonts inside each component's `<style jsx global>` block:

```tsx
<style jsx global>{`
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
`}</style>
```

> Every component that uses Press Start 2P must include its own `@import` — the font is not globally loaded.

### Font sizes by use case

| Use case | Size |
|---|---|
| Panel header title | `12px` |
| Section sub-header | `10px` |
| Body / dialogue text | `10px` |
| Smaller body / descriptions | `9px` |
| List items / observations | `8–9px` |
| Stat labels (small caps) | `8px` |
| Tiny hints / footnotes | `7px` |
| Footer bar text | `7px` |
| Buttons | `10px` |
| Slider tick labels | `7–8px` |
| Thumbnail labels | `6–7px` |

> Press Start 2P renders large — use `lineHeight: "20px"` to `"24px"` (fixed px) for body text to keep it readable. Relative values like `2.2` also work and produce roughly the same result.

---

## Color Palette

Each agent has its own color theme. All themes follow the same structural roles — only the hues change.

### Main Dental Office (parchment / brown)

```tsx
const C = {
  bg:      "#EAD3A2",  // parchment — main panel background
  bgDark:  "#D4B896",  // darker parchment — headers, inset areas
  bgDeep:  "#C4A070",  // deep parchment — disabled states, slider track
  border:  "#3D2B1F",  // dark brown — all borders and pixel shadows
  text:    "#2C1810",  // near-black brown — primary text
  muted:   "#7A5C3A",  // medium brown — labels, hints, inactive text
  gold:    "#C8960C",  // gold — active highlights, progress bars, CTA buttons
  goldBrt: "#F5C842",  // bright gold — slider thumb, active selection glow
  red:     "#7A2020",  // dark red — errors, warnings, cavity alerts
  green:   "#2A5A1A",  // dark green — success states, "done", healthy indicators
  page:    "#140904",  // near-black — page background, image backdrop
};
```

### Clinic Locator + Financial Agent (purple / lavender)

```tsx
const C = {
  bg:      "#F3E5F5",  // light lavender — main panel background
  bgDark:  "#E1BEE7",  // lavender — headers, inset areas
  bgDeep:  "#CE93D8",  // medium purple — disabled states
  border:  "#4A148C",  // deep violet — all borders and pixel shadows
  text:    "#210035",  // dark purple — primary text
  muted:   "#7B1FA2",  // orchid — labels, hints
  gold:    "#9C27B0",  // bright purple — active highlights, progress bars
  goldBrt: "#E1BEE7",  // light highlights
  red:     "#7B1F1F",  // dark red — errors
  green:   "#2E5A1C",  // dark green — success
  page:    "#1A0033",  // deep dark purple — page background
};
```

### Habit Coach (green / sage)

```tsx
const C = {
  bg:     "#C8DCC0",  // sage green — main panel background
  bgDark: "#A8C0A0",  // darker sage — headers, inset areas
  border: "#4A6B4A",  // dark green — all borders and pixel shadows
  text:   "#2A3D2A",  // near-black green — primary text
  muted:  "#5A7A5A",  // medium green — labels, hints
  active: "#3D5A3D",  // deep green — active highlights, progress bars
};
```

### Color usage rules (all themes)

- **Panel backgrounds**: `C.bg` for the main area, `C.bgDark` for headers and inset boxes
- **All borders**: `C.border` at `3–5px solid`
- **Pixel drop shadow**: `box-shadow: "5px 5px 0 ${C.border}"` — always hard, never blurred
- **Modal outer shadow**: `8px 8px 0 ${C.border}`
- **CTA / primary action button**: `C.gold` background, `C.page` text
- **Active/selected state**: highlighted border
- **Errors and warnings**: `C.red` border + `C.red + "18"` (10% opacity) background tint
- **Success / complete**: `C.green`
- **Disabled / inactive**: `C.bgDeep` background, `C.muted` text, `opacity: 0.35–0.4`

---

## Core Component Patterns

### Panel (the RPG window box)

Every UI section lives in a panel. Panels have a thick border and a hard pixel drop shadow — no border-radius.

```tsx
const panel: React.CSSProperties = {
  background: C.bg,
  border: `4px solid ${C.border}`,
  boxShadow: `5px 5px 0 ${C.border}`,
  overflow: "hidden",
};
```

For the outermost modal shell (wrapping a full popup), use a larger shadow:
```tsx
boxShadow: `8px 8px 0 ${C.border}`
```

### Full-Screen Modal Shell

Standard pattern for all agent popups (Clinic Locator, Habit Coach, Financial Agent):

```tsx
{/* Overlay */}
<div
  className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
  style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
  onClick={onClose}
>
  <div
    onClick={(e) => e.stopPropagation()}
    className={`relative transform transition-all duration-300 ease-out ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-3"}`}
  >
    {/* Main panel */}
    <div style={{ width: "480–560px", maxWidth: "94vw", background: C.bg, border: `4px solid ${C.border}`, boxShadow: `8px 8px 0 ${C.border}`, overflow: "hidden" }}>

      {/* Header bar */}
      <div style={{ background: C.bgDark, borderBottom: `4px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>🔵</span>
        <span style={{ fontFamily: FONT, fontSize: "12px", color: C.text, letterSpacing: "2px" }}>
          [ AGENT TITLE ]
        </span>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: C.bg, border: `4px solid ${C.border}`, boxShadow: `3px 3px 0 ${C.border}`, color: C.text, fontWeight: 900, fontSize: "18px", fontFamily: "monospace", lineHeight: 1, cursor: "pointer" }}
        aria-label="Close"
      >✕</button>

      {/* Scrollable content area */}
      <div style={{ padding: "20px", background: C.bgDark, maxHeight: "70vh", overflowY: "auto", borderBottom: `2px solid ${C.border}` }}>
        <div style={{ background: C.bg, border: `3px solid ${C.border}`, padding: "20px 18px" }}>
          {/* content */}
        </div>
      </div>

      {/* Footer bar */}
      <div style={{ padding: "10px 16px", background: C.bgDark, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: FONT, fontSize: "7px", color: C.muted }}>V1.0.0-BETA</span>
        <span className="agent-blink" style={{ fontFamily: FONT, fontSize: "7px", color: C.active }}>SYSTEM ACTIVE</span>
      </div>

    </div>
  </div>
</div>
```

### Panel Header Bar (standalone, non-modal)

```tsx
const hdr = (bg = C.bgDark): React.CSSProperties => ({
  background: bg,
  borderBottom: `4px solid ${C.border}`,
  padding: "10px 16px",
  display: "flex",
  alignItems: "center",
});
```

Header text format: `[ TITLE IN CAPS ]` — always uppercase with square brackets.

```tsx
<div style={hdr()}>
  <span style={{ fontSize: "12px", fontFamily: FONT, color: C.text }}>[ PANEL TITLE ]</span>
  <span style={{ marginLeft: "auto", fontSize: "8px", fontFamily: FONT, color: C.muted, opacity: 0.6 }}>SUBTITLE</span>
</div>
```

### Button

```tsx
const btn = (active = true): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: "10px",
  background: active ? C.bg : C.bgDeep,
  border: `3px solid ${C.border}`,
  boxShadow: active ? `4px 4px 0 ${C.border}` : "none",
  padding: "12px 20px",
  color: active ? C.text : C.muted,
  cursor: active ? "pointer" : "not-allowed",
  opacity: active ? 1 : 0.4,
  lineHeight: 1,
});
```

Add `.px-btn` class for the press animation:

```css
.px-btn { transition: transform 60ms, box-shadow 60ms; }
.px-btn:hover:not(:disabled) { transform: translate(4px,4px); box-shadow: none !important; }
.px-btn:disabled { opacity: .35; cursor: not-allowed !important; }
```

**Primary CTA button** (e.g. Generate, Confirm):
```tsx
style={{ ...btn(true), background: C.gold, color: C.page }}
```

### NPC Dialogue Box

The signature pattern for AI-generated speech or doctor commentary.

```tsx
<div style={{
  display: "flex", gap: "14px", alignItems: "flex-start",
  padding: "14px", background: C.bgDark, border: `3px solid ${C.border}`,
}}>
  {/* NPC avatar */}
  <div style={{
    flexShrink: 0, width: 60, height: 60,
    border: `3px solid ${C.border}`, background: C.bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 34,
  }}>🦷</div>

  {/* Speech */}
  <div style={{ flex: 1 }}>
    <p style={{ fontFamily: FONT, fontSize: "10px", color: C.gold, marginBottom: "10px", letterSpacing: "1px" }}>
      NPC NAME:
    </p>
    <p style={{ fontFamily: FONT, fontSize: "10px", color: C.text, lineHeight: "22px" }}>
      &ldquo;Dialogue text here.&rdquo;
      <span className="blink" style={{ marginLeft: 3 }}>▌</span>
    </p>
  </div>
</div>
```

The blinking cursor is a standard RPG trope — always add it to dialogue:

```css
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.blink { animation: blink 1s step-end infinite; }
```

### Stats Grid

2-column or 3-column grid of key-value stat boxes.

```tsx
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
  {stats.map(({ label, value, color }) => (
    <div key={label} style={{ padding: "10px 12px", border: `2px solid ${C.border}`, background: C.bgDark }}>
      <p style={{ fontFamily: FONT, fontSize: "8px", color: C.muted, marginBottom: "8px", letterSpacing: "1px" }}>
        {label}
      </p>
      <p style={{ fontFamily: FONT, fontSize: "10px", color, lineHeight: "20px" }}>
        {value}
      </p>
    </div>
  ))}
</div>
```

### Warning / Alert Box

```tsx
<div style={{
  padding: "12px 14px", border: `2px solid ${C.red}`, background: C.red + "18",
  display: "flex", alignItems: "center", gap: "12px",
}}>
  <span style={{ fontSize: "28px", flexShrink: 0 }}>⚠</span>
  <p style={{ fontFamily: FONT, fontSize: "9px", color: C.red, lineHeight: "20px" }}>WARNING MESSAGE</p>
</div>
```

For success/info variants swap `C.red` → `C.green` and `⚠` → `✓`.

### Dashed Drop Zone (Upload / File Input)

```tsx
<label style={{
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  padding: "32px 24px",
  border: `4px dashed ${C.border}`,
  background: C.bgDark,
  cursor: "pointer", gap: "16px",
}}>
  <div style={{ fontSize: 52 }}>⬆</div>
  <p style={{ fontFamily: FONT, fontSize: "11px", color: C.text, letterSpacing: "2px", lineHeight: "22px", textAlign: "center" }}>
    CLICK TO UPLOAD
  </p>
  <div style={{ background: C.gold, border: `4px solid ${C.border}`, boxShadow: `4px 4px 0 ${C.border}`, padding: "12px 28px" }}>
    <span style={{ fontFamily: FONT, fontSize: "11px", color: C.page }}>▶ SELECT FILE</span>
  </div>
  <input type="file" style={{ display: "none" }} />
</label>
```

Animate the drop zone to pulse while waiting:

```css
@keyframes rpgPulse {
  0%,100% { box-shadow: 6px 6px 0 #3D2B1F; }
  50%     { box-shadow: 6px 6px 0 #C8960C, 0 0 24px #F5C84255; }
}
.rpg-dropzone { animation: rpgPulse 2s ease-in-out infinite; }
```

### Progress Bar — Determinate

For known progress (e.g. upload, multi-step analysis):

```tsx
<div style={{ height: "10px", background: C.bgDark, border: `2px solid ${C.border}`, overflow: "hidden" }}>
  <div style={{
    height: "100%", background: C.active,
    width: `${pct}%`, transition: "width .2s",
  }} />
</div>
```

### Progress Bar — Indeterminate (loading sweep)

For unknown-duration loading states (e.g. waiting for AI response):

```tsx
<div style={{ width: "80%", height: "10px", backgroundColor: C.bgDark, border: `2px solid ${C.border}`, overflow: "hidden" }}>
  <div style={{ height: "100%", backgroundColor: C.active, width: "40%", animation: "progressSlide 1.8s linear infinite" }} />
</div>
```

```css
@keyframes progressSlide { 0%{transform:translateX(-100%)} 70%{transform:translateX(260%)} 100%{transform:translateX(260%)} }
```

> The container **must** have `overflow: hidden`. Use `linear` timing — `ease-in-out` makes the bar appear stuck at the ends.

### Pixel Slider (Range Input)

Add CSS via a `<style>` tag — the native range input is fully restyled:

```css
input[type=range] {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 10px;
  background: #C4A070; border: 3px solid #3D2B1F;
  cursor: pointer; outline: none;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px; height: 20px;
  background: #F5C842; border: 3px solid #3D2B1F;
  cursor: pointer; margin-top: -7px;
  box-shadow: 2px 2px 0 #3D2B1F;
}
input[type=range]::-webkit-slider-runnable-track {
  height: 4px;
  background: linear-gradient(to right, #C8960C var(--pct,0%), #C4A070 var(--pct,0%));
  border: 0;
}
```

Drive the fill with a CSS custom property:

```tsx
<input
  type="range" min={0} max={max} value={val}
  onChange={(e) => setVal(Number(e.target.value))}
  style={{ "--pct": `${(val / max) * 100}%` } as React.CSSProperties}
/>
```

### Image Thumbnail Strip

```tsx
<div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "6px" }}>
  {items.map((item, i) => (
    <button
      className="px-thumb"
      onClick={() => setActive(i)}
      style={{
        padding: 0, lineHeight: 0, position: "relative", background: C.page,
        border: `3px solid ${i === active ? C.goldBrt : C.border}`,
        boxShadow: i === active ? `3px 3px 0 ${C.goldBrt}` : `2px 2px 0 ${C.border}`,
        filter: i === active ? "none" : "brightness(.7)",
      }}
    >
      <img src={item.src} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(20,9,4,.9)", padding: "4px", textAlign: "center" }}>
        <span style={{ fontFamily: FONT, fontSize: "7px", color: i === active ? C.goldBrt : C.bgDark }}>
          LABEL
        </span>
      </div>
    </button>
  ))}
</div>
```

```css
.px-thumb { transition: filter .1s; cursor: pointer; }
.px-thumb:hover { filter: brightness(1.15) !important; }
```

### Stacked Image Cross-fade

For multiple images in the same frame (e.g. timeline viewer), stack them with `position: absolute` and toggle `opacity`:

```tsx
<div style={{ position: "relative", overflow: "hidden", height: "340px" }}>
  {images.map((img, i) => (
    <img
      key={i}
      src={img.src}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "cover",
        opacity: i === activeIndex ? 1 : 0,
        transition: "opacity .25s ease",
        pointerEvents: "none",
      }}
    />
  ))}
</div>
```

> Always use `position: absolute` on all images and give the container a **fixed pixel height** to prevent layout reflow when images load.

---

## Layout Patterns

### Side-by-Side Panel Layout

Used for result screens where analysis and visual output are shown together.

```tsx
<div style={{
  display: "flex", gap: "14px", alignItems: "stretch",
  height: "calc(88vh - 40px)",
}}>
  {/* Left — summary/text panel, fixed width */}
  <div style={{ ...panel, flex: "0 0 400px", display: "flex", flexDirection: "column" }}>
    ...
  </div>

  {/* Right — visual/media panel, fills remaining space */}
  <div style={{ ...panel, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1, gap: "12px", overflow: "hidden" }}>
      <div style={{ flex: 1, minHeight: 0, position: "relative", border: `4px solid ${C.border}` }}>
        ...
      </div>
      <div>slider, thumbnails, buttons</div>
    </div>
  </div>
</div>
```

### Full-Screen Game Modal (page-level)

Wraps any RPG popup over the game world background (use for page-level overlays, not component modals):

```tsx
<div style={{
  position: "absolute", inset: 0, zIndex: 30,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(0,0,0,0.75)",
}}>
  <div style={{
    width: "min(96vw, 1200px)", maxHeight: "92vh",
    overflowY: "auto",
    border: `6px solid ${C.border}`,
    boxShadow: `8px 8px 0 ${C.border}`,
    background: C.bg,
  }}>
    {/* content */}
  </div>
</div>
```

---

## Animations Reference

All defined in a `<style jsx global>` block inside the component. Each component should include only the animations it uses, with unique class name prefixes to avoid conflicts (e.g. `.habit-blink`, `.sunlife-blink`).

```css
/* Font import — required in every component */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

/* Blinking cursor — RPG dialogue / status indicators */
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.blink { animation: blink 1s step-end infinite; }

/* Bouncing dots — loading indicator */
@keyframes pixelBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-12px)} }

/* Pulse opacity — secondary loading text */
@keyframes pixelPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }

/* Sweeping progress bar — indeterminate loading */
@keyframes progressSlide { 0%{transform:translateX(-100%)} 70%{transform:translateX(260%)} 100%{transform:translateX(260%)} }

/* Button press — pixel shift down-right */
.px-btn { transition: transform 60ms, box-shadow 60ms; }
.px-btn:hover:not(:disabled) { transform: translate(4px,4px); box-shadow: none !important; }

/* Drop zone glow pulse */
@keyframes rpgPulse {
  0%,100% { box-shadow: 6px 6px 0 #3D2B1F; }
  50%     { box-shadow: 6px 6px 0 #C8960C, 0 0 24px #F5C84255; }
}

/* Node/zone active indicator */
@keyframes nodePulse {
  0%,100% { box-shadow: 0 0 0 3px #F5C842; }
  50%     { box-shadow: 0 0 0 8px #F5C84244; }
}
.node-active { animation: nodePulse 1.2s ease-in-out infinite; }

/* Image fade-in on mount */
@keyframes imgIn { from{opacity:0} to{opacity:1} }
.img-fade { animation: imgIn .2s ease; }
```

---

## Loading Screen Pattern

Multi-step progress with a bar and individual step rows:

```tsx
const STEPS = [
  { label: "STEP ONE...",   duration: 500 },
  { label: "STEP TWO...",   duration: 800 },
  { label: "FINALIZING...", duration: 999 }, // last step: loop until API done
];

// runProgressAnimation loops the final step until `done.resolved = true`
const runProgressAnimation = async (done: { resolved: boolean }) => {
  for (let i = 0; i < STEPS.length - 1; i++) {
    setStep(i);
    // tick through duration...
  }
  // Last step creeps to 92% then snaps to 100% when API resolves
  setStep(STEPS.length - 1); setProgress(0);
  let p = 0;
  while (!done.resolved) {
    p = Math.min(0.92, p + 0.015);
    setProgress(p);
    await new Promise(r => setTimeout(r, 80));
  }
  setProgress(1);
};

// In analyze():
const done = { resolved: false };
const apiCall = fetch(url, opts).then(r => { done.resolved = true; return r; });
await Promise.all([apiCall, runProgressAnimation(done)]);
```

Step row visual:
```tsx
<div style={{
  display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
  background: active ? C.gold + "25" : done ? C.green + "18" : "transparent",
  border: `2px solid ${active ? C.gold : done ? C.green : "transparent"}`,
  opacity: pending ? 0.25 : 1,
}}>
  <span style={{ fontFamily: FONT, color: done ? C.green : active ? C.gold : C.muted }}>
    {done ? "✓" : active ? "▶" : "·"}
  </span>
  <span style={{ fontFamily: FONT, fontSize: "8px", color: active ? C.text : done ? C.green : C.muted }}>
    {step.label}
  </span>
  {active && <MiniProgressBar />}
  {done && <span style={{ marginLeft: "auto", fontFamily: FONT, fontSize: "7px", color: C.green }}>DONE</span>}
</div>
```

---

## Scrollbar Styling

All scrollable areas should use a pixel-art styled scrollbar:

```css
.pixel-scrollbar::-webkit-scrollbar { width: 10px; }
.pixel-scrollbar::-webkit-scrollbar-track { background: C_BGDARK; border-left: 3px solid C_BORDER; }
.pixel-scrollbar::-webkit-scrollbar-thumb { background: C_MUTED; border: 2px solid C_BORDER; }
```

Use a unique class prefix per component to scope the styles (e.g. `.habit-scroll`, `.sunlife-scroll`, `.pixel-scrollbar`).

---

## Quick Reference — New Component Checklist

When building a new popup/modal/panel:

- [ ] Define `const FONT = "'Press Start 2P', monospace"` and include `@import` inside `<style jsx global>`
- [ ] Use the appropriate color theme for the agent (parchment / purple / green)
- [ ] Wrap in a modal shell: `fixed inset-0 z-[9999]` overlay + panel with `8px 8px 0` shadow
- [ ] Add a **header bar**: emoji icon + `[ TITLE IN CAPS ]` at `12px`, centered, `bgDark` background
- [ ] Add a **footer bar**: `V1.0.x-BETA` left + blinking `SYSTEM ACTIVE` right, both at `7px`
- [ ] Add a **close button** (`✕`) absolutely positioned at `-right-3 -top-3`
- [ ] All text UPPERCASE for labels/headers
- [ ] No `border-radius` on any inner element
- [ ] Buttons use the `.px-btn` press animation
- [ ] Scrollable areas use pixel scrollbar CSS with a component-scoped class name
- [ ] Indeterminate loading uses the `progressSlide` sweep animation with `linear` timing and `overflow: hidden` on the container
- [ ] Warnings use `C.red` + `⚠` at a larger font size than body text
- [ ] Success/done states use `C.green` + `✓`
- [ ] Any multi-image container has a **fixed pixel height** (never `auto` or flex-grown)
- [ ] If there's AI-generated text, wrap it in an NPC dialogue box with avatar + blinking cursor
