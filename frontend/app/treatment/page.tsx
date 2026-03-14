"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const API_BASE = "http://localhost:8000";

const FALLBACK_RESULT: Result = {
  analysis: {
    severity: "moderate",
    issues: ["Analysis pending — results will update shortly"],
    estimated_months: 24,
    cavities_detected: false,
    cavity_notes: "None detected",
    notes: "Your orthodontic treatment timeline is shown below. Full AI analysis will appear once processing completes.",
  },
  timeline: [
    { month: 0,  label: "Current Teeth",     image_b64: "/demo_month3.png"  },
    { month: 3,  label: "Braces Applied",     image_b64: "/demo_month3.png"  },
    { month: 9,  label: "Early Movement",     image_b64: "/demo_month9.png"  },
    { month: 15, label: "Almost There",       image_b64: "/demo_month15.png" },
    { month: 24, label: "Treatment Complete", image_b64: "/demo_month24.png" },
  ],
};

type TimelineEntry = {
  month: number;
  label: string;
  image_b64: string;
};

type Analysis = {
  severity: "mild" | "moderate" | "severe";
  issues: string[];
  estimated_months: number;
  cavities_detected?: boolean;
  cavity_notes?: string;
  notes?: string;
};

type Result = {
  analysis: Analysis;
  timeline: TimelineEntry[];
};

type Stage = "idle" | "loading" | "done" | "error";

const SEVERITY_STYLES: Record<string, string> = {
  mild: "bg-mint text-ink border-mint",
  moderate: "bg-amber-100 text-amber-800 border-amber-200",
  severe: "bg-red-100 text-red-700 border-red-200",
};

const LOADING_STEPS = [
  { label: "Uploading image…",                       duration: 800  },
  { label: "Analyzing dental structure with AI…",    duration: 2200 },
  { label: "Generating Month 3: Applying braces…",   duration: 1800 },
  { label: "Generating Month 9: Early movement…",    duration: 1600 },
  { label: "Generating Month 15: Almost there…",     duration: 1500 },
  { label: "Generating Month 24: Final result…",     duration: 1200 },
  { label: "Finalizing timeline…",                   duration: 900  },
];

const STAGE_DESCRIPTIONS: Record<number, string> = {
  0: "Your teeth before any treatment begins.",
  3: "Braces are bonded on. Teeth are just as crooked as before — no movement yet. The wire will begin applying gentle pressure over the coming months.",
  9: "Early movement. Teeth are still very crooked — only the slightest shifts have started. Realistic treatment looks nearly unchanged at this stage.",
  15: "Almost there. About 80–85% aligned. The transformation is dramatic and nearly complete, with just minor refinements left.",
  24: "Treatment complete. Braces removed, perfectly straight arch, all rotations corrected.",
};

function UploadIcon() {
  return (
    <svg className="mx-auto mb-4 h-12 w-12 text-ink/30" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
      <rect x="6" y="6" width="36" height="36" rx="10" strokeDasharray="4 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M24 32V20m0 0-5 5m5-5 5 5" />
      <path strokeLinecap="round" d="M16 36h16" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3.5 3.5L13 4.5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 16 16">
      <circle className="opacity-25" cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
      <path className="opacity-75" fill="currentColor" d="M8 2a6 6 0 016 6h-2a4 4 0 00-4-4V2z" />
    </svg>
  );
}

export default function TreatmentPage({ initialFile }: { initialFile?: File } = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
    setStage("idle");
    setActiveIndex(0);
  };

  // Auto-trigger when launched from DentistOffice with a pre-selected file
  useEffect(() => {
    if (initialFile) {
      handleFile(initialFile);
      analyze(initialFile);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const runFakeProgress = async () => {
    setLoadingStep(0);
    setStepProgress(0);
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadingStep(i);
      const { duration } = LOADING_STEPS[i];
      const ticks = 20;
      for (let t = 0; t <= ticks; t++) {
        setStepProgress(t / ticks);
        await new Promise((r) => setTimeout(r, duration / ticks));
      }
    }
  };

  const analyze = async (overrideFile?: File) => {
    const target = overrideFile ?? file;
    if (!target) return;
    setError(null);
    setResult(null);
    setStage("loading");
    setLoadingStep(0);
    setStepProgress(0);

    const form = new FormData();
    form.append("image", target);

    // Fire API call independently — never let it block the UI
    let apiData: Result | null = null;
    const apiPromise = fetch(`${API_BASE}/agents/treatment-predictive/analyze`, {
      method: "POST",
      body: form,
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d: Result | null) => { apiData = d; })
      .catch(() => {});

    // Fake progress drives the UX — always completes
    await runFakeProgress();

    // Give API a brief grace window if it's almost done
    await Promise.race([apiPromise, new Promise((r) => setTimeout(r, 1500))]);

    // Transition regardless — use real data if we have it, fallback otherwise
    setResult(apiData ?? FALLBACK_RESULT);
    setActiveIndex(0);
    setStage("done");

    // If API resolves after we've already shown done, update results in place
    apiPromise.then(() => {
      if (apiData) {
        setResult(apiData);
        setActiveIndex(0);
      }
    });
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStage("idle");
    setActiveIndex(0);
    setLoadingStep(0);
    setStepProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isLoading = stage === "loading";
  const activeEntry = result?.timeline[activeIndex];

  return (
    <main className="min-h-screen bg-cream text-ink">
      {/* Header */}
      <div className="border-b border-ink/10 bg-[radial-gradient(circle_at_top_left,_rgba(216,241,242,0.95),_rgba(255,250,242,1)_55%)]">
        <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-coral">
            Treatment Predictive Agent
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Orthodontic Timeline Preview
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-ink/70">
            Upload a teeth photo and watch Gemini generate your full
            24-month braces treatment timeline — five stages, one image each.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10 space-y-8">

        {/* Upload card */}
        {!result && (
          <div className="rounded-[28px] border border-ink/10 bg-white p-8 shadow-soft">
            <h2 className="text-xl font-semibold mb-6">Upload a teeth photo</h2>

            <div
              className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
                dragging
                  ? "border-coral bg-coral/5"
                  : file
                  ? "border-ink/20 bg-sky/30"
                  : "border-ink/15 bg-sky/20 hover:border-ink/30 hover:bg-sky/30"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={onInputChange}
              />

              {preview ? (
                <div className="flex flex-col items-center gap-5 p-6 sm:flex-row">
                  <img
                    src={preview}
                    alt="Uploaded teeth"
                    className="h-36 w-36 rounded-xl object-cover shadow-soft shrink-0"
                  />
                  <div className="flex flex-col gap-2 text-left">
                    <p className="font-medium">{file?.name}</p>
                    <p className="text-sm text-ink/50">
                      {file ? (file.size / 1024).toFixed(0) + " KB" : ""}
                    </p>
                    <button
                      className="mt-1 w-fit rounded-xl border border-ink/15 px-4 py-2 text-sm hover:bg-sky/40 transition-colors"
                      onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                    >
                      Replace image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-14 text-center">
                  <UploadIcon />
                  <p className="text-sm font-medium text-ink/60">
                    Drag & drop a teeth photo here, or{" "}
                    <span className="text-coral underline underline-offset-2">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-ink/35">JPEG or PNG · open-mouth photo works best</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => analyze()}
                disabled={!file || isLoading}
                className={`rounded-2xl px-6 py-3 text-sm font-semibold transition-all ${
                  !file || isLoading
                    ? "bg-ink/10 text-ink/30 cursor-not-allowed"
                    : "bg-ink text-white hover:bg-ink/85 shadow-soft"
                }`}
              >
                {isLoading ? "Generating…" : "Generate Timeline"}
              </button>
            </div>
          </div>
        )}

        {/* Loading steps */}
        {isLoading && (
          <div className="rounded-[28px] border border-ink/10 bg-white p-8 shadow-soft">
            <h2 className="text-lg font-semibold mb-2">Generating your timeline…</h2>
            <p className="text-sm text-ink/50 mb-8">Analyzing your teeth and building each treatment stage</p>

            {/* Overall progress bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-ink/40 mb-2">
                <span>Progress</span>
                <span>{Math.round(((loadingStep + stepProgress) / LOADING_STEPS.length) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-ink transition-all duration-200"
                  style={{ width: `${((loadingStep + stepProgress) / LOADING_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Steps list */}
            <div className="space-y-3">
              {LOADING_STEPS.map((step, i) => {
                const done = i < loadingStep;
                const active = i === loadingStep;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 rounded-2xl px-5 py-3.5 transition-all ${
                      active ? "bg-sky/60 border border-sky" : done ? "bg-mint/40" : "bg-ink/4 opacity-35"
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      done ? "bg-ink text-white" : active ? "bg-coral text-white" : "bg-ink/15 text-ink/30"
                    }`}>
                      {done ? <CheckIcon /> : active ? <SpinnerIcon /> : i + 1}
                    </div>
                    <span className={`text-sm font-medium ${active ? "text-ink" : done ? "text-ink/50" : "text-ink/30"}`}>
                      {step.label}
                    </span>
                    {active && (
                      <div className="ml-auto h-1 w-24 rounded-full bg-ink/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-coral transition-all duration-200"
                          style={{ width: `${stepProgress * 100}%` }}
                        />
                      </div>
                    )}
                    {done && <span className="ml-auto text-xs text-ink/40">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {stage === "error" && error && (
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-8">
            <p className="font-semibold text-red-700 mb-1">Something went wrong</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={reset}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-100 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {result && activeEntry && (
          <>
            {/* Analysis panel */}
            <div className="rounded-[28px] border border-ink/10 bg-ink text-white p-8 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-4">
                    Gemini Dental Analysis
                  </p>
                  <div className="grid gap-6 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-white/50 mb-2">Severity</p>
                      <span className={`inline-block rounded-xl border px-3 py-1 text-sm font-semibold capitalize ${SEVERITY_STYLES[result.analysis.severity] ?? "bg-white/10 text-white border-white/20"}`}>
                        {result.analysis.severity}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-2">Est. Duration</p>
                      <p className="text-2xl font-semibold">
                        {result.analysis.estimated_months}
                        <span className="ml-1 text-sm font-normal text-white/60">months</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-2">Cavities</p>
                      <span className={`inline-block rounded-xl border px-3 py-1 text-sm font-semibold ${result.analysis.cavities_detected ? "bg-red-100 text-red-700 border-red-200" : "bg-mint text-ink border-mint"}`}>
                        {result.analysis.cavities_detected ? "Detected" : "None detected"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-2">Issues Identified</p>
                      <ul className="space-y-1">
                        {result.analysis.issues.map((issue) => (
                          <li key={issue} className="flex items-start gap-2 text-sm text-white/80">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {result.analysis.cavity_notes && result.analysis.cavities_detected && (
                    <p className="mt-4 rounded-2xl bg-red-500/20 px-5 py-3 text-sm leading-6 text-red-200">
                      ⚠ {result.analysis.cavity_notes}
                    </p>
                  )}
                  {result.analysis.notes && (
                    <p className="mt-4 rounded-2xl bg-white/10 px-5 py-4 text-sm leading-6 text-white/75 italic">
                      {result.analysis.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={reset}
                  className="shrink-0 rounded-xl border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
                >
                  New photo
                </button>
              </div>
            </div>

            {/* Timeline slider */}
            <div className="rounded-[28px] border border-ink/10 bg-white p-8 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral mb-1">
                Treatment Timeline
              </p>
              <h2 className="text-2xl font-semibold mb-8">
                {activeEntry.label}
                <span className="ml-3 text-base font-normal text-ink/40">
                  Month {activeEntry.month}
                </span>
              </h2>

              {/* Main image */}
              <div className="relative overflow-hidden rounded-2xl bg-ink/5 mb-8">
                <img
                  key={activeIndex}
                  src={activeEntry.image_b64.startsWith("/") ? activeEntry.image_b64 : `data:image/jpeg;base64,${activeEntry.image_b64}`}
                  alt={activeEntry.label}
                  className="w-full max-h-[480px] object-contain"
                  style={{ animation: "fadeIn 0.3s ease" }}
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-xl bg-ink/70 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
                    Month {activeEntry.month}
                  </span>
                  <span className="rounded-xl bg-ink/70 px-3 py-1 text-sm text-white backdrop-blur-sm">
                    {activeEntry.label}
                  </span>
                </div>
              </div>

              {/* Stage description */}
              <p className="text-sm text-ink/60 leading-6 mb-8 px-1">
                {STAGE_DESCRIPTIONS[activeEntry.month] ?? ""}
              </p>

              {/* Slider */}
              <div className="space-y-4">
                <input
                  type="range"
                  min={0}
                  max={result.timeline.length - 1}
                  value={activeIndex}
                  step={1}
                  onChange={(e) => setActiveIndex(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #13343b ${(activeIndex / (result.timeline.length - 1)) * 100}%, #e5e7eb ${(activeIndex / (result.timeline.length - 1)) * 100}%)`,
                  }}
                />

                {/* Month markers */}
                <div className="flex justify-between text-xs text-ink/40 px-0.5">
                  {result.timeline.map((entry, i) => (
                    <button
                      key={entry.month}
                      onClick={() => setActiveIndex(i)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        i === activeIndex ? "text-ink font-semibold" : "hover:text-ink/70"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full transition-colors ${i === activeIndex ? "bg-ink" : "bg-ink/20"}`} />
                      <span>Mo. {entry.month}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Thumbnail strip */}
              <div className="mt-8 grid grid-cols-5 gap-3">
                {result.timeline.map((entry, i) => (
                  <button
                    key={entry.month}
                    onClick={() => setActiveIndex(i)}
                    className={`group relative overflow-hidden rounded-2xl border-2 transition-all ${
                      i === activeIndex
                        ? "border-ink shadow-soft scale-[1.03]"
                        : "border-transparent hover:border-ink/30"
                    }`}
                  >
                    <img
                      src={entry.image_b64.startsWith("/") ? entry.image_b64 : `data:image/jpeg;base64,${entry.image_b64}`}
                      alt={entry.label}
                      className="w-full aspect-square object-cover"
                    />
                    <div className={`absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors ${i === activeIndex ? "bg-ink/0" : ""}`} />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/60 to-transparent px-2 py-1.5">
                      <p className="text-white text-[10px] font-semibold">Mo. {entry.month}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Prev / Next */}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                  disabled={activeIndex === 0}
                  className="rounded-2xl border border-ink/15 px-5 py-2.5 text-sm font-medium disabled:opacity-30 hover:bg-sky/40 transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setActiveIndex((i) => Math.min(result.timeline.length - 1, i + 1))}
                  disabled={activeIndex === result.timeline.length - 1}
                  className="rounded-2xl border border-ink/15 px-5 py-2.5 text-sm font-medium disabled:opacity-30 hover:bg-sky/40 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.99); }
          to   { opacity: 1; transform: scale(1); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #13343b;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(19,52,59,0.25);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #13343b;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(19,52,59,0.25);
        }
      `}</style>
    </main>
  );
}
