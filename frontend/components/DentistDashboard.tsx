"use client";
import { useState } from "react";

interface Upload {
  label: string;
  emoji: string;
  teethDesc: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  dob: string;
  phone: string;
  email: string;
  lastVisit: string;
  nextAppt: string | null;
  healthScore: number;
  concerns: string[];
  notes: string;
  uploads: Upload[];
  avatar: string;
}

interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  tag: string;
  tagColor: string;
  cardColor: string;
  borderColor: string;
}

const AGENTS: Agent[] = [
  {
    id: "habit_coaching",
    name: "Habit Coaching",
    icon: "🪥",
    description: "Improve brushing & flossing consistency",
    tag: "Behavior",
    tagColor: "text-blue-600 bg-blue-50",
    cardColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "cavity_risk",
    name: "Cavity Risk",
    icon: "⚠️",
    description: "Assess and monitor cavity risk factors",
    tag: "Diagnostic",
    tagColor: "text-red-600 bg-red-50",
    cardColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  {
    id: "whitening_advisor",
    name: "Whitening Advisor",
    icon: "✨",
    description: "Cosmetic whitening recommendations",
    tag: "Cosmetic",
    tagColor: "text-yellow-700 bg-yellow-50",
    cardColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  {
    id: "gum_health",
    name: "Gum Health",
    icon: "🩺",
    description: "Monitor gum inflammation & recession",
    tag: "Periodontal",
    tagColor: "text-pink-600 bg-pink-50",
    cardColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  {
    id: "appt_reminder",
    name: "Appt Reminder",
    icon: "📅",
    description: "Automated appointment follow-ups",
    tag: "Scheduling",
    tagColor: "text-green-600 bg-green-50",
    cardColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    id: "anxiety_support",
    name: "Anxiety Support",
    icon: "🧘",
    description: "Dental anxiety coaching & resources",
    tag: "Wellness",
    tagColor: "text-purple-600 bg-purple-50",
    cardColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    id: "crown_planning",
    name: "Crown Planning",
    icon: "👑",
    description: "Crown replacement planning workflow",
    tag: "Restorative",
    tagColor: "text-orange-600 bg-orange-50",
    cardColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    id: "ortho_monitor",
    name: "Ortho Monitor",
    icon: "🔧",
    description: "Orthodontic treatment tracking",
    tag: "Orthodontic",
    tagColor: "text-teal-600 bg-teal-50",
    cardColor: "bg-teal-50",
    borderColor: "border-teal-200",
  },
];

const PATIENTS: Patient[] = [
  {
    id: "p1",
    name: "John Smith",
    age: 34,
    dob: "1991-07-15",
    phone: "(416) 555-0192",
    email: "john.smith@email.com",
    lastVisit: "2026-02-10",
    nextAppt: "2026-03-20T10:00:00",
    healthScore: 68,
    concerns: ["Inconsistent brushing (once/day)", "Rarely flosses", "Mild plaque buildup on lower molars"],
    notes: "Patient admits to skipping night brushing frequently. No flossing routine. Needs habit coaching intervention. Low cavity risk currently but trajectory is poor.",
    avatar: "👨",
    uploads: [
      { label: "Front smile", emoji: "😁", teethDesc: "Slight yellowing on incisors, plaque visible on gum line" },
      { label: "Left bite", emoji: "🦷", teethDesc: "Early plaque buildup on lower left molars" },
      { label: "Right bite", emoji: "🦷", teethDesc: "Mild calculus deposits near gumline" },
      { label: "Upper teeth", emoji: "⬆️", teethDesc: "Generally healthy, minor staining on canines" },
      { label: "Lower teeth", emoji: "⬇️", teethDesc: "Visible plaque at gum margin, needs immediate attention" },
    ],
  },
  {
    id: "p2",
    name: "Sarah Lee",
    age: 28,
    dob: "1997-03-22",
    phone: "(647) 555-0341",
    email: "sarah.lee@email.com",
    lastVisit: "2026-01-28",
    nextAppt: "2026-03-21T14:30:00",
    healthScore: 88,
    concerns: ["Minor gum inflammation (upper right)", "Interested in teeth whitening", "Reported dental anxiety for procedures"],
    notes: "Excellent hygiene habits overall. Flosses daily, brushes twice. Anxiety triggered by drilling sounds. Has cosmetic goals — wants whitening ahead of wedding in June 2026.",
    avatar: "👩",
    uploads: [
      { label: "Front smile", emoji: "😁", teethDesc: "Even, well-aligned teeth with minor surface staining" },
      { label: "Left bite", emoji: "🦷", teethDesc: "Healthy bite, gums slightly puffy on upper left" },
      { label: "Right bite", emoji: "🦷", teethDesc: "Mild gingival inflammation visible near upper right premolar" },
      { label: "Upper teeth", emoji: "⬆️", teethDesc: "Clean teeth, slight staining on central incisors" },
      { label: "Lower teeth", emoji: "⬇️", teethDesc: "Excellent condition, no issues noted" },
      { label: "LiDAR scan", emoji: "📡", teethDesc: "3D scan — no structural anomalies detected" },
    ],
  },
  {
    id: "p3",
    name: "Mike Johnson",
    age: 45,
    dob: "1980-11-08",
    phone: "(905) 555-0874",
    email: "m.johnson@email.com",
    lastVisit: "2025-12-15",
    nextAppt: null,
    healthScore: 52,
    concerns: ["Active cavity on upper right (tooth #14)", "Receding gum line (lower front)", "Missing crown — tooth #18 needs replacement"],
    notes: "Has not flossed in years. Multiple cavities over history. Needs crown on tooth #14. Gum recession is 2–3mm in lower anterior. High risk patient — overdue for scheduling.",
    avatar: "🧔",
    uploads: [
      { label: "Front smile", emoji: "😁", teethDesc: "Visible dark spot on upper right area — likely cavity" },
      { label: "Upper teeth", emoji: "⬆️", teethDesc: "Cavity confirmed on #14, adjacent teeth showing early decay" },
      { label: "Lower front", emoji: "⬇️", teethDesc: "Gum recession 2–3mm, bone loss suspected on X-ray" },
    ],
  },
  {
    id: "p4",
    name: "Emily Chen",
    age: 19,
    dob: "2006-05-30",
    phone: "(416) 555-0228",
    email: "emily.chen@email.com",
    lastVisit: "2026-03-01",
    nextAppt: "2026-03-22T09:00:00",
    healthScore: 95,
    concerns: ["Braces follow-up (month 8 of 18)", "Wisdom teeth beginning to emerge — monitoring"],
    notes: "Currently in orthodontic treatment. Excellent compliance. Wisdom teeth beginning to emerge, monitoring for impaction risk.",
    avatar: "👧",
    uploads: [
      { label: "Front smile", emoji: "😁", teethDesc: "Braces in place, good alignment progress" },
      { label: "Left bite", emoji: "🦷", teethDesc: "Wire tension normal, no irritation" },
      { label: "Right bite", emoji: "🦷", teethDesc: "Bracket on #5 slightly loose — flagged" },
      { label: "Upper teeth", emoji: "⬆️", teethDesc: "Clean under braces, patient brushing well" },
      { label: "Lower teeth", emoji: "⬇️", teethDesc: "Lower wisdom teeth tips visible distally" },
      { label: "LiDAR scan", emoji: "📡", teethDesc: "3D scan shows emerging wisdom teeth at 30° angle" },
    ],
  },
  {
    id: "p5",
    name: "David Brown",
    age: 52,
    dob: "1973-09-14",
    phone: "(905) 555-0612",
    email: "d.brown@email.com",
    lastVisit: "2026-02-20",
    nextAppt: "2026-03-25T11:00:00",
    healthScore: 71,
    concerns: ["Root canal needed (tooth #18)", "Bone loss in lower jaw", "Chronic dry mouth (medication side effect)"],
    notes: "Takes lisinopril for blood pressure — dry mouth side effect elevates cavity risk. Bone loss confirmed on panoramic X-ray. Root canal referral pending.",
    avatar: "👴",
    uploads: [
      { label: "Front smile", emoji: "😁", teethDesc: "Dry lips, slightly worn incisors from dry mouth" },
      { label: "Left bite", emoji: "🦷", teethDesc: "Tooth #18 shows dark periapical lesion on X-ray" },
      { label: "Lower teeth", emoji: "⬇️", teethDesc: "Bone level 3mm below normal, generalized bone loss" },
    ],
  },
];

function scoreColor(score: number) {
  if (score >= 85) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 65) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-500 bg-red-50 border-red-200";
}

function scoreLabel(score: number) {
  if (score >= 85) return "Good";
  if (score >= 65) return "Fair";
  return "Needs Attention";
}

function formatAppt(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

function TeethPlaceholder({ upload }: { upload: Upload }) {
  const colorMap: Record<string, string> = {
    "😁": "from-slate-100 to-slate-200",
    "🦷": "from-blue-50 to-blue-100",
    "⬆️": "from-sky-50 to-sky-100",
    "⬇️": "from-indigo-50 to-indigo-100",
    "📡": "from-purple-50 to-purple-100",
  };
  const gradient = colorMap[upload.emoji] || "from-gray-50 to-gray-100";

  return (
    <div className={`rounded-xl border border-ink/10 bg-gradient-to-br ${gradient} aspect-square flex flex-col items-end justify-between p-2.5 cursor-pointer hover:shadow-md transition-shadow overflow-hidden relative`}>
      {/* Tooth silhouette lines */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <svg viewBox="0 0 60 60" className="w-10 h-10 fill-current text-ink">
          <path d="M30 4 C20 4 14 10 14 20 C14 26 16 32 18 36 C20 42 22 52 26 54 C28 55 30 53 30 53 C30 53 32 55 34 54 C38 52 40 42 42 36 C44 32 46 26 46 20 C46 10 40 4 30 4Z"/>
        </svg>
      </div>
      <span className="text-lg z-10">{upload.emoji}</span>
      <div className="z-10 w-full">
        <p className="text-xs font-semibold text-ink/70 leading-tight">{upload.label}</p>
        <p className="text-[10px] text-ink/40 mt-0.5 leading-tight line-clamp-2">{upload.teethDesc}</p>
      </div>
    </div>
  );
}

export default function DentistDashboard() {
  const [selected, setSelected] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [draggedAgentId, setDraggedAgentId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [workflows, setWorkflows] = useState<Record<string, string[]>>({});
  const [runningAgents, setRunningAgents] = useState<Record<string, string[]>>({});

  const filtered = PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDrop = (patientId: string) => {
    if (!draggedAgentId) return;
    setWorkflows((prev) => {
      const existing = prev[patientId] || [];
      if (existing.includes(draggedAgentId)) return prev;
      return { ...prev, [patientId]: [...existing, draggedAgentId] };
    });
    setDraggedAgentId(null);
    setIsDragOver(false);
  };

  const removeAgent = (patientId: string, agentId: string) => {
    setWorkflows((prev) => ({
      ...prev,
      [patientId]: (prev[patientId] || []).filter((a) => a !== agentId),
    }));
    setRunningAgents((prev) => ({
      ...prev,
      [patientId]: (prev[patientId] || []).filter((a) => a !== agentId),
    }));
  };

  const runWorkflow = (patientId: string) => {
    const agents = workflows[patientId] || [];
    if (agents.length === 0) return;
    setRunningAgents((prev) => ({ ...prev, [patientId]: agents }));
    // Simulate agents completing one by one
    agents.forEach((agentId, i) => {
      setTimeout(() => {
        setRunningAgents((prev) => ({
          ...prev,
          [patientId]: (prev[patientId] || []).filter((a) => a !== agentId),
        }));
      }, (i + 1) * 1800);
    });
  };

  const patientAgents = selected ? workflows[selected.id] || [] : [];
  const patientRunning = selected ? runningAgents[selected.id] || [] : [];

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      {/* Header */}
      <header className="bg-ink text-white px-6 py-4 flex items-center justify-between shadow-soft shrink-0">
        <div>
          <h1 className="text-lg font-semibold">Dentist Portal</h1>
          <p className="text-xs text-white/50">Patient records · Agent workflows</p>
        </div>
        <a href="/" className="text-xs text-white/50 hover:text-white transition-colors">
          ← Main app
        </a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — patient list */}
        <aside className="w-64 shrink-0 border-r border-ink/10 bg-white overflow-y-auto">
          <div className="p-4 border-b border-ink/10">
            <input
              type="text"
              placeholder="Search patients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm rounded-xl border border-ink/20 px-3 py-2 outline-none focus:border-ink/50 bg-cream placeholder-ink/30"
            />
          </div>
          <div className="divide-y divide-ink/5">
            {filtered.map((p) => {
              const agentCount = (workflows[p.id] || []).length;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`w-full text-left px-4 py-3 hover:bg-sky/30 transition-colors ${
                    selected?.id === p.id ? "bg-sky/50 border-l-2 border-ink" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ml-1 shrink-0 ${scoreColor(p.healthScore)}`}>
                          {p.healthScore}
                        </span>
                      </div>
                      <p className="text-xs text-ink/50 mt-0.5">Age {p.age} · {p.lastVisit}</p>
                      {agentCount > 0 && (
                        <p className="text-xs text-purple-500 mt-0.5">{agentCount} agent{agentCount > 1 ? "s" : ""} assigned</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-5">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-center text-ink/40">
              <div>
                <p className="text-4xl mb-3">🦷</p>
                <p className="text-sm">Select a patient to view their record</p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-5">

              {/* Patient header */}
              <div className="bg-white rounded-2xl border border-ink/10 p-5 shadow-soft flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-ink/5 flex items-center justify-center text-3xl border border-ink/10">
                    {selected.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selected.name}</h2>
                    <p className="text-ink/50 text-xs mt-0.5">DOB: {selected.dob} · Age {selected.age}</p>
                    <div className="flex gap-3 mt-1.5 text-xs text-ink/60">
                      <span>📞 {selected.phone}</span>
                      <span>✉️ {selected.email}</span>
                    </div>
                  </div>
                </div>
                <div className={`text-center px-4 py-3 rounded-2xl border shrink-0 ${scoreColor(selected.healthScore)}`}>
                  <p className="text-3xl font-bold">{selected.healthScore}</p>
                  <p className="text-xs font-medium mt-0.5">{scoreLabel(selected.healthScore)}</p>
                </div>
              </div>

              {/* Appointments */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-ink/10 p-4 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Last Visit</p>
                  <p className="font-medium text-sm">{selected.lastVisit}</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink/10 p-4 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Next Appointment</p>
                  {selected.nextAppt ? (
                    <p className="font-medium text-sm text-coral">{formatAppt(selected.nextAppt)}</p>
                  ) : (
                    <p className="text-ink/40 text-sm">Not scheduled</p>
                  )}
                </div>
              </div>

              {/* Concerns */}
              <div className="bg-white rounded-2xl border border-ink/10 p-5 shadow-soft">
                <h3 className="font-semibold mb-3 text-sm">Active Concerns</h3>
                <ul className="space-y-2">
                  {selected.concerns.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-coral shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl border border-ink/10 p-5 shadow-soft">
                <h3 className="font-semibold mb-2 text-sm">Clinical Notes</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{selected.notes}</p>
              </div>

              {/* Agent Workflow */}
              <div className="bg-white rounded-2xl border border-ink/10 p-5 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">Agent Workflow</h3>
                    <p className="text-xs text-ink/40 mt-0.5">Drag agents from the sidebar → drop here to assign</p>
                  </div>
                  {patientAgents.length > 0 && (
                    <button
                      onClick={() => runWorkflow(selected.id)}
                      disabled={patientRunning.length > 0}
                      className="text-xs font-medium px-3 py-1.5 rounded-xl bg-ink text-white hover:bg-ink/80 disabled:opacity-50 transition-colors"
                    >
                      {patientRunning.length > 0 ? "Running…" : "▶ Run Workflow"}
                    </button>
                  )}
                </div>

                {/* Canvas */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={() => handleDrop(selected.id)}
                  className={`rounded-xl border-2 border-dashed transition-colors min-h-32 p-4 flex items-center gap-3 flex-wrap ${
                    isDragOver
                      ? "border-ink bg-sky/20"
                      : patientAgents.length > 0
                      ? "border-ink/10 bg-cream"
                      : "border-ink/15 bg-cream"
                  }`}
                >
                  {/* Patient node */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-ink text-white flex items-center justify-center text-xl shadow">
                      {selected.avatar}
                    </div>
                    <span className="text-[10px] font-medium text-ink/50">{selected.name.split(" ")[0]}</span>
                  </div>

                  {patientAgents.length === 0 && !isDragOver && (
                    <p className="text-ink/30 text-xs ml-2">← Drop agents here to build a care workflow</p>
                  )}

                  {isDragOver && patientAgents.length === 0 && (
                    <p className="text-ink/50 text-xs ml-2 font-medium">Release to add agent</p>
                  )}

                  {patientAgents.map((agentId, idx) => {
                    const agent = AGENTS.find((a) => a.id === agentId)!;
                    const isRunning = patientRunning.includes(agentId);
                    return (
                      <div key={agentId} className="flex items-center gap-2">
                        {/* Connector line */}
                        <div className="flex items-center gap-0.5">
                          <div className="w-4 h-px bg-ink/20" />
                          {idx < patientAgents.length - 1 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-ink/20" />
                          )}
                        </div>
                        {/* Agent node */}
                        <div className={`relative rounded-xl border px-3 py-2 ${agent.cardColor} ${agent.borderColor} min-w-[100px] transition-all ${isRunning ? "ring-2 ring-offset-1 ring-blue-400 animate-pulse" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-base">{agent.icon}</span>
                            <button
                              onClick={() => removeAgent(selected.id, agentId)}
                              className="text-ink/30 hover:text-red-400 text-sm leading-none mt-0.5"
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-xs font-semibold text-ink/80 mt-1 leading-tight">{agent.name}</p>
                          {isRunning && (
                            <p className="text-[10px] text-blue-500 mt-0.5 font-medium">Running…</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Teeth photos */}
              <div className="bg-white rounded-2xl border border-ink/10 p-5 shadow-soft">
                <h3 className="font-semibold mb-4 text-sm">
                  Teeth Photos
                  <span className="ml-2 text-xs font-normal text-ink/40">{selected.uploads.length} images</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {selected.uploads.map((upload, i) => (
                    <TeethPlaceholder key={i} upload={upload} />
                  ))}
                  <div className="rounded-xl border border-dashed border-ink/20 bg-cream aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-sky/20 transition-colors">
                    <span className="text-2xl text-ink/20">+</span>
                    <span className="text-xs text-ink/30">Add image</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pb-6">
                <a
                  href="/clinic-locator"
                  className="bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-ink/80 transition-colors"
                >
                  Book Appointment
                </a>
                <button className="border border-ink/20 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-sky/30 transition-colors">
                  Send Reminder
                </button>
                <button className="border border-ink/20 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-sky/30 transition-colors">
                  Export Record
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right sidebar — agent library */}
        <aside className="w-56 shrink-0 border-l border-ink/10 bg-white overflow-y-auto">
          <div className="p-4 border-b border-ink/10">
            <p className="text-xs font-semibold text-ink/60 uppercase tracking-wide">Agent Library</p>
            <p className="text-[10px] text-ink/35 mt-0.5">Drag an agent onto a patient workflow</p>
          </div>
          <div className="p-3 space-y-2">
            {AGENTS.map((agent) => (
              <div
                key={agent.id}
                draggable
                onDragStart={() => setDraggedAgentId(agent.id)}
                onDragEnd={() => setDraggedAgentId(null)}
                className={`rounded-xl border p-3 cursor-grab active:cursor-grabbing select-none transition-all hover:shadow-md ${agent.cardColor} ${agent.borderColor} ${
                  draggedAgentId === agent.id ? "opacity-50 scale-95" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{agent.icon}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${agent.tagColor}`}>
                    {agent.tag}
                  </span>
                </div>
                <p className="text-xs font-semibold text-ink/80 leading-tight">{agent.name}</p>
                <p className="text-[10px] text-ink/50 mt-0.5 leading-tight">{agent.description}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
