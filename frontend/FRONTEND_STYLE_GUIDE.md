# Frontend Style Guide — Pixel RPG Dental Clinic

This document describes the visual design system used across all gamified UI components in this project. Use it as a reference when building new components so they match the existing aesthetic.

---

## Theme Overview

The UI is styled as a **pixel-art RPG** — think classic JRPG inventory screens, quest logs, and NPC dialogue boxes. The game world is a top-down pixel-art dental clinic. All popup windows, modals, and overlays should feel like they belong inside that world.

**Do not use:**
- Rounded corners (no `border-radius` except on the outer game-world modal shell)
- Drop shadows with blur (use hard pixel offsets instead)
- Gradients on panels (flat parchment colors only; gradients only for image overlays)
- Sans-serif or system fonts inside RPG panels
- Animations that feel "modern" (no `ease-in-out` springs, no sliding drawers)

---

## Font

```tsx
const FONT = "'Press Start 2P', monospace";
```

Import via Google Fonts in a `<style>` tag inside the component:

```tsx
<style>{`
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
`}</style>
```

### Font sizes by use case

| Use case | Size |
|---|---|
| Panel header | `12–13px` |
| NPC name label | `9–10px` |
| Body / dialogue text | `9–10px` |
| Stat values (big) | `13–14px` |
| Stat labels (small caps) | `7–8px` |
| List items / observations | `8–9px` |
| Thumbnail labels | `6–7px` |
| Tiny hints / footnotes | `6–7px` |
| Buttons | `9–11px` |
| Slider tick labels | `7–8px` |

> Press Start 2P renders large — always set `lineHeight` to `2.2–2.6` for body text to keep it readable.

---

## Color Palette

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

### Color usage rules

- **Panel backgrounds**: `C.bg` for the main area, `C.bgDark` for headers and inset boxes
- **All borders**: `C.border` at `3–5px solid`
- **Pixel drop shadow**: `box-shadow: "5px 5px 0 #3D2B1F"` — always hard, never blurred
- **CTA / primary action button**: `C.gold` background, `C.page` text
- **Active/selected state**: `C.goldBrt` border + glow
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

For the outermost game-world modal shell (wrapping a full popup), use a slightly larger shadow:
```tsx
boxShadow: "8px 8px 0 #3D2B1F"
```

### Panel Header Bar

```tsx
const hdr = (bg = C.bgDark): React.CSSProperties => ({
  background: bg,
  borderBottom: `4px solid ${C.border}`,
  padding: "8–10px 14–16px",
  display: "flex",
  alignItems: "center",
});
```

Header text format: `[ TITLE IN CAPS ]` — always uppercase with square brackets.

```tsx
<div style={hdr()}>
  <span style={{ fontSize: "12px", color: C.text }}>[ PANEL TITLE ]</span>
  <span style={{ marginLeft: "auto", fontSize: "9px", color: C.muted }}>SUBTITLE</span>
</div>
```

### Button

```tsx
const btn = (active = true): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: "10–11px",
  background: active ? C.bg : C.bgDeep,
  border: `3px solid ${C.border}`,
  boxShadow: active ? `4px 4px 0 ${C.border}` : "none",
  padding: "10–14px 16–24px",
  color: active ? C.text : C.muted,
  cursor: active ? "pointer" : "not-allowed",
  opacity: active ? 1 : 0.4,
  lineHeight: 1,
});
```

Add `.px-btn` class for the press animation:

```css
.px-btn { transition: transform 60ms, box-shadow 60ms; }
.px-btn:hover:not(:disabled) { transform: translate(4px, 4px); box-shadow: none !important; }
.px-btn:disabled { opacity: .35; cursor: not-allowed !important; }
```

**Primary CTA button** (e.g. Generate, Confirm):
```tsx
style={{ ...btn(true), background: C.gold, color: C.page, fontSize: "11px" }}
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
    <p style={{ fontSize: "10px", color: C.gold, marginBottom: "10px", letterSpacing: "1px" }}>
      NPC NAME:
    </p>
    <p style={{ fontSize: "10px", color: C.text, lineHeight: "2.6" }}>
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
    <div key={label} style={{ padding: "10–12px", border: `2px solid ${C.border}`, background: C.bgDark }}>
      <p style={{ fontSize: "7–8px", color: C.muted, marginBottom: "8–10px", letterSpacing: "1–2px" }}>
        {label}
      </p>
      <p style={{ fontSize: "13–14px", color, lineHeight: 1.3 }}>
        {value}
      </p>
    </div>
  ))}
</div>
```

For warning/success states in stats, render the symbol separately at a larger size:

```tsx
<p style={{ fontSize: "14px", color: C.red, display: "flex", alignItems: "center", gap: 6 }}>
  <span style={{ fontSize: "20px" }}>⚠</span>
  <span>WARNING TEXT</span>
</p>
```

### Warning / Alert Box

```tsx
<div style={{
  padding: "12–14px", border: `2px solid ${C.red}`, background: C.red + "18",
  display: "flex", alignItems: "center", gap: "12px",
}}>
  <span style={{ fontSize: "28px", flexShrink: 0 }}>⚠</span>
  <p style={{ fontSize: "9px", color: C.red, lineHeight: "2.4" }}>WARNING MESSAGE</p>
</div>
```

For success/info variants swap `C.red` → `C.green` and `⚠` → `✓`.

### Dashed Drop Zone (Upload / File Input)

```tsx
<label style={{
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  padding: "32–40px 24px",
  border: `4–5px dashed ${C.border}`,
  background: C.bgDark,
  cursor: "pointer", gap: "16–20px",
}}>
  <div style={{ fontSize: 52 }}>⬆</div>
  <p style={{ fontSize: "11–12px", color: C.text, letterSpacing: "2px", lineHeight: "2.4", textAlign: "center" }}>
    CLICK TO UPLOAD
  </p>
  <div style={{ background: C.gold, border: `4px solid ${C.border}`, boxShadow: `4px 4px 0 ${C.border}`, padding: "12px 28px" }}>
    <span style={{ fontSize: "11px", color: C.page }}>▶ SELECT FILE</span>
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

### Progress Bar

```tsx
<div style={{ height: "14–16px", background: C.bgDeep, border: `3px solid ${C.border}` }}>
  <div style={{
    height: "100%", background: C.gold,
    width: `${pct}%`, transition: "width .2s",
    boxShadow: `0 0 8px ${C.goldBrt}88`,
  }} />
</div>
```

### Pixel Slider (Range Input)

Add CSS via a `<style>` tag — the native range input is fully restyled:

```css
input[type=range] {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 10–12px;
  background: #C4A070; border: 3px solid #3D2B1F;
  cursor: pointer; outline: none;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18–20px; height: 18–20px;
  background: #F5C842; border: 3px solid #3D2B1F;
  cursor: pointer; margin-top: -7px;
  box-shadow: 2px 2px 0 #3D2B1F;
}
input[type=range]::-webkit-slider-runnable-track {
  height: 4–6px;
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
<div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "6–8px" }}>
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
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(20,9,4,.9)", padding: "4–5px", textAlign: "center" }}>
        <span style={{ fontSize: "6–7px", color: i === active ? C.goldBrt : C.bgDark, fontFamily: FONT }}>
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
  height: "calc(88vh - 40px)",  // fixed height prevents reflow
}}>
  {/* Left — summary/text panel, fixed width */}
  <div style={{ ...panel, flex: "0 0 400px", display: "flex", flexDirection: "column" }}>
    ...
  </div>

  {/* Right — visual/media panel, fills remaining space */}
  <div style={{ ...panel, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1, gap: "12px", overflow: "hidden" }}>
      {/* Image with flex:1 fills all available height */}
      <div style={{ flex: 1, minHeight: 0, position: "relative", border: `4px solid ${C.border}` }}>
        ...
      </div>
      {/* Controls below stay at natural height */}
      <div>slider, thumbnails, buttons</div>
    </div>
  </div>
</div>
```

### Full-Screen Game Modal

Wraps any RPG popup over the game world background:

```tsx
<div style={{
  position: "absolute", inset: 0, zIndex: 30,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(0,0,0,0.75)",
}}>
  <div style={{
    width: "min(96vw, 1200px)", maxHeight: "92vh",
    overflowY: "auto",
    border: "6px solid #3D2B1F",
    boxShadow: "8px 8px 0 #3D2B1F",
    background: "#EAD3A2",
  }}>
    {/* content */}
  </div>
</div>
```

---

## Animations Reference

All defined in a `<style>` tag inside the component.

```css
/* Blinking cursor — RPG dialogue */
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.blink { animation: blink 1s step-end infinite; }

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

Multi-step progress with a gold bar and individual step rows:

```tsx
const STEPS = [
  { label: "STEP ONE...",   duration: 500 },
  { label: "STEP TWO...",   duration: 800 },
  { label: "FINALIZING...", duration: 999 }, // last step: loop until API done
];

// runFakeProgress loops the final step until `done.resolved = true`
const runFakeProgress = async (done: { resolved: boolean }) => {
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
await Promise.all([apiCall, runFakeProgress(done)]);
```

Step row visual:
```tsx
<div style={{
  display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
  background: active ? C.gold + "25" : done ? C.green + "18" : "transparent",
  border: `2px solid ${active ? C.gold : done ? C.green : "transparent"}`,
  opacity: pending ? 0.25 : 1,
}}>
  <span style={{ color: done ? C.green : active ? C.gold : C.muted }}>
    {done ? "✓" : active ? "▶" : "·"}
  </span>
  <span style={{ fontSize: "7–8px", color: active ? C.text : done ? C.green : C.muted }}>
    {step.label}
  </span>
  {active && <MiniProgressBar />}
  {done && <span style={{ marginLeft: "auto", fontSize: "6–7px", color: C.green }}>DONE</span>}
</div>
```

---

## Quick Reference — New Component Checklist

When building a new popup/modal/panel:

- [ ] Use `Press Start 2P` font
- [ ] Wrap in a `panel` style (parchment bg, 4px brown border, 5px hard shadow)
- [ ] Add a header bar with `[ TITLE IN CAPS ]` format
- [ ] All text UPPERCASE where it's a label/header
- [ ] No `border-radius` on inner elements
- [ ] Buttons use the `.px-btn` press animation
- [ ] Active/selected items use `C.goldBrt` border highlight
- [ ] Warnings use `C.red` + `⚠` at a larger font size than body text
- [ ] Success/done states use `C.green` + `✓`
- [ ] Any multi-image container has a **fixed pixel height** (never `auto` or flex-grown)
- [ ] If there's AI-generated text, wrap it in an NPC dialogue box with avatar + blinking cursor
- [ ] Loading states use the multi-step progress pattern with a gold bar
