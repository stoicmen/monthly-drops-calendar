"use client";

import { useEffect, useMemo, useState } from "react";

type EventType =
  | "mindset_drop"
  | "physique_drop"
  | "mindset_announcement"
  | "physique_announcement"
  | "surprise_drop"
  | "public_prompt"
  | "member_of_month"
  | "feedback_reminder";

interface CalendarEvent {
  date: string;
  type: EventType;
  title: string;
  tagline: string;
  thumbnailUrl: string | null;
  courseId: string | null;
  courseUrl: string | null;
  visibility: "visible" | "hidden" | null;
  isPrimary: boolean;
}

interface MonthData {
  year: number;
  month: number;
  events: CalendarEvent[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const TYPE_STYLES: Record<EventType, { dot: string; pill: string; label: string }> = {
  mindset_drop: {
    dot: "bg-accent-mindset",
    pill: "bg-accent-mindset/15 text-accent-mindset border-accent-mindset/40",
    label: "Mindset",
  },
  physique_drop: {
    dot: "bg-accent-physique",
    pill: "bg-accent-physique/15 text-accent-physique border-accent-physique/40",
    label: "Physique",
  },
  surprise_drop: {
    dot: "bg-accent-surprise",
    pill: "bg-accent-surprise/15 text-accent-surprise border-accent-surprise/40",
    label: "Surprise",
  },
  public_prompt: {
    dot: "bg-accent-prompt",
    pill: "bg-accent-prompt/10 text-accent-prompt border-accent-prompt/30",
    label: "Prompt",
  },
  mindset_announcement: {
    dot: "bg-accent-mindset/50",
    pill: "bg-ink-700 text-ink-200 border-ink-500",
    label: "Mindset · Announcement",
  },
  physique_announcement: {
    dot: "bg-accent-physique/50",
    pill: "bg-ink-700 text-ink-200 border-ink-500",
    label: "Physique · Announcement",
  },
  member_of_month: {
    dot: "bg-ink-200",
    pill: "bg-ink-700 text-ink-200 border-ink-500",
    label: "Member of Month",
  },
  feedback_reminder: {
    dot: "bg-ink-300",
    pill: "bg-ink-700 text-ink-200 border-ink-500",
    label: "Feedback",
  },
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmt(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function isSameDate(d: Date, year: number, month: number, day: number) {
  return (
    d.getFullYear() === year &&
    d.getMonth() === month &&
    d.getDate() === day
  );
}

export default function Calendar({
  initialYear,
  initialMonth,
}: {
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [data, setData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/calendar?year=${year}&month=${month}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed (${r.status})`);
        return r.json();
      })
      .then((json: MonthData) => {
        if (cancelled) return;
        setData(json);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Failed to load");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year, month]);

  // Reset selected date when month changes
  useEffect(() => {
    setSelectedDate(null);
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    if (!data) return map;
    for (const ev of data.events) {
      const arr = map.get(ev.date) || [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [data]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function goPrev() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function goNext() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(fmt(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  const selectedEvents = selectedDate
    ? eventsByDate.get(selectedDate) || []
    : [];

  // Side panel summary: all primary drops in the month
  const monthDrops = useMemo(() => {
    if (!data) return [];
    return data.events.filter((e) => e.isPrimary);
  }, [data]);

  return (
    <div className="min-h-screen w-full bg-ink-900 grain">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-ink-300 mb-1">
              STOIC SOCIETY
            </div>
            <h1 className="font-display text-5xl sm:text-7xl text-ink-100 leading-none">
              {MONTH_NAMES[month].toUpperCase()}{" "}
              <span className="text-ink-300">{year}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="h-10 w-10 grid place-items-center rounded-md border border-ink-500 bg-ink-700 hover:bg-ink-600 transition text-ink-200"
              aria-label="Previous month"
            >
              ←
            </button>
            <button
              onClick={goToday}
              className="h-10 px-4 rounded-md border border-ink-500 bg-ink-700 hover:bg-ink-600 transition text-ink-200 text-xs tracking-[0.2em] font-medium"
            >
              TODAY
            </button>
            <button
              onClick={goNext}
              className="h-10 w-10 grid place-items-center rounded-md border border-ink-500 bg-ink-700 hover:bg-ink-600 transition text-ink-200"
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-md border border-red-900/60 bg-red-900/20 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Calendar grid */}
          <div className="rounded-xl border border-ink-500 bg-ink-800/60 overflow-hidden">
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-ink-500">
              {DAY_LABELS.map((d) => (
                <div
                  key={d}
                  className="px-3 py-3 text-[10px] tracking-[0.25em] text-ink-300 font-medium"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="aspect-square sm:aspect-[5/4] border-r border-b border-ink-500/40 bg-ink-800/40"
                    />
                  );
                }

                const dateStr = fmt(year, month, day);
                const dayEvents = eventsByDate.get(dateStr) || [];
                const primary = dayEvents.filter((e) => e.isPrimary);
                const secondary = dayEvents.filter((e) => !e.isPrimary);
                const isToday = isSameDate(today, year, month, day);
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative text-left aspect-square sm:aspect-[5/4] border-r border-b border-ink-500/40 p-2 sm:p-3 transition hover:bg-ink-700/60 ${
                      isSelected ? "bg-ink-700/80 ring-1 ring-inset ring-ink-300" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`inline-grid place-items-center text-xs sm:text-sm font-semibold ${
                          isToday
                            ? "h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-ink-100 text-ink-900"
                            : "text-ink-200"
                        }`}
                      >
                        {day}
                      </span>
                      {secondary.length > 0 && primary.length === 0 && (
                        <div className="flex gap-0.5">
                          {secondary.slice(0, 3).map((ev, i) => (
                            <span
                              key={i}
                              className={`block h-1 w-1 rounded-full ${TYPE_STYLES[ev.type].dot}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {primary.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {primary.slice(0, 2).map((ev, i) => {
                          const s = TYPE_STYLES[ev.type];
                          return (
                            <div
                              key={i}
                              className={`text-[9px] sm:text-[10px] uppercase tracking-wider px-1.5 py-1 rounded border truncate font-semibold ${s.pill}`}
                              title={ev.title}
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                        {primary.length > 2 && (
                          <div className="text-[9px] text-ink-300">
                            +{primary.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side panel */}
          <aside className="space-y-4">
            {/* Selected-date detail */}
            <div className="rounded-xl border border-ink-500 bg-ink-800/60 p-5 min-h-[240px]">
              {selectedDate ? (
                <SelectedDetail
                  date={selectedDate}
                  events={selectedEvents}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center py-12">
                  <div>
                    <div className="text-3xl mb-3 opacity-30">📅</div>
                    <div className="text-xs tracking-[0.2em] text-ink-300">
                      SELECT A DATE
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* This month's drops summary */}
            <div className="rounded-xl border border-ink-500 bg-ink-800/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] tracking-[0.25em] text-ink-300">
                  THIS MONTH
                </div>
                <div className="text-xs text-ink-200 font-semibold">
                  {monthDrops.length}{" "}
                  {monthDrops.length === 1 ? "DROP" : "DROPS"}
                </div>
              </div>

              {loading && !data ? (
                <div className="text-xs text-ink-300">Loading…</div>
              ) : monthDrops.length === 0 ? (
                <div className="text-xs text-ink-300">No drops this month</div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-auto thin-scroll">
                  {monthDrops.map((ev, i) => {
                    const s = TYPE_STYLES[ev.type];
                    const [y, m, d] = ev.date.split("-");
                    const label = `${MONTH_NAMES[parseInt(m, 10) - 1].slice(0, 3).toUpperCase()} ${parseInt(d, 10)}`;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(ev.date)}
                        className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-ink-700/60 transition"
                      >
                        <span className={`block h-2 w-2 rounded-full ${s.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-ink-100 truncate">
                            {ev.title}
                          </div>
                          <div className="text-[10px] text-ink-300 tracking-wide">
                            {s.label}
                          </div>
                        </div>
                        <div className="text-[10px] tracking-widest text-ink-300 font-medium">
                          {label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="rounded-xl border border-ink-500/50 bg-ink-800/30 p-5">
              <div className="text-[10px] tracking-[0.25em] text-ink-300 mb-3">
                LEGEND
              </div>
              <div className="space-y-2 text-xs">
                <LegendItem color="bg-accent-mindset" label="Mindset Drop · Wed" />
                <LegendItem color="bg-accent-physique" label="Physique Drop · Fri" />
                <LegendItem color="bg-accent-surprise" label="Surprise · 2nd Sat" />
                <LegendItem color="bg-accent-prompt" label="Public Prompt · Sun" />
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-10 pt-6 border-t border-ink-500/40 text-center">
          <div className="text-[10px] tracking-[0.3em] text-ink-300">
            STAY STOIC 🤝
          </div>
        </footer>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-ink-200">
      <span className={`block h-2 w-2 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function SelectedDetail({
  date,
  events,
}: {
  date: string;
  events: CalendarEvent[];
}) {
  const [y, m, d] = date.split("-");
  const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const monthShort = MONTH_NAMES[parseInt(m, 10) - 1].toUpperCase();
  const primary = events.filter((e) => e.isPrimary);
  const secondary = events.filter((e) => !e.isPrimary);

  return (
    <div>
      <div className="mb-4">
        <div className="text-[10px] tracking-[0.25em] text-ink-300">
          {dayName.toUpperCase()}
        </div>
        <div className="font-display text-3xl text-ink-100 leading-none mt-1">
          {monthShort} {parseInt(d, 10)}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-xs text-ink-300">Nothing scheduled.</div>
      ) : (
        <div className="space-y-4">
          {primary.map((ev, i) => (
            <PrimaryCard key={i} ev={ev} />
          ))}

          {secondary.length > 0 && (
            <div className="pt-3 border-t border-ink-500/50 space-y-2">
              <div className="text-[10px] tracking-[0.2em] text-ink-300 mb-2">
                ALSO TODAY
              </div>
              {secondary.map((ev, i) => {
                const s = TYPE_STYLES[ev.type];
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className={`block h-2 w-2 rounded-full ${s.dot} mt-1.5 flex-shrink-0`}
                    />
                    <div className="text-xs text-ink-200">
                      <div className="font-medium">{ev.title}</div>
                      {ev.tagline && (
                        <div className="text-ink-300 text-[11px]">{ev.tagline}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PrimaryCard({ ev }: { ev: CalendarEvent }) {
  const s = TYPE_STYLES[ev.type];
  const inner = (
    <>
      {ev.thumbnailUrl && (
        <div className="aspect-[16/10] overflow-hidden rounded-lg bg-ink-700">
          <img
            src={ev.thumbnailUrl}
            alt={ev.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="mt-3">
        <div
          className={`inline-block text-[9px] tracking-widest uppercase px-2 py-0.5 rounded border ${s.pill}`}
        >
          {s.label}
          {ev.visibility === "hidden" && " · Upcoming"}
        </div>
        <div className="mt-2 font-semibold text-ink-100 leading-tight">
          {ev.title}
        </div>
        {ev.tagline && (
          <div className="mt-1 text-xs text-ink-300 leading-snug">
            {ev.tagline}
          </div>
        )}
      </div>
    </>
  );

  if (ev.courseUrl && ev.visibility === "visible") {
    return (
      <a
        href={ev.courseUrl}
        target="_top"
        rel="noopener noreferrer"
        className="block rounded-lg p-3 -m-3 hover:bg-ink-700/40 transition"
      >
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}
