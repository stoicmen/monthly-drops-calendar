import { loadSchedule } from "./notion";
import { loadAllCourses, getDropType, getCourseUrl, WhopCourse } from "./whop";

export type EventType =
  | "mindset_drop"
  | "physique_drop"
  | "mindset_announcement"
  | "physique_announcement"
  | "surprise_drop"
  | "public_prompt"
  | "member_of_month"
  | "feedback_reminder";

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  type: EventType;
  title: string;
  tagline: string;
  thumbnailUrl: string | null;
  courseId: string | null;
  courseUrl: string | null;
  visibility: "visible" | "hidden" | null;
  isPrimary: boolean; // major events (drops/surprises) vs minor (announcements/prompts)
}

const PRIMARY_TYPES: EventType[] = [
  "mindset_drop",
  "physique_drop",
  "surprise_drop",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number, // 0=Sun, 6=Sat
  n: number
): Date {
  // Find the nth occurrence of `weekday` in this month
  const first = new Date(Date.UTC(year, month, 1));
  const firstWeekday = first.getUTCDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(Date.UTC(year, month, day));
}

export interface MonthCalendar {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
}

export async function buildMonthCalendar(
  year: number,
  month: number
): Promise<MonthCalendar> {
  const courses = await loadAllCourses();
  const schedule = await loadSchedule();

  const events: CalendarEvent[] = [];
  const total = daysInMonth(year, month);

  // 1. Manual drops from schedule.json
  for (let day = 1; day <= total; day++) {
    const d = new Date(Date.UTC(year, month, day));
    const dateStr = formatDate(d);
    const courseId = schedule[dateStr];
    if (!courseId || courseId.startsWith("_")) continue;

    const course = courses.get(courseId);
    if (!course) {
      // Course was scheduled but isn't in Whop (maybe deleted or wrong ID)
      events.push({
        date: dateStr,
        type: "mindset_drop",
        title: "Unknown course",
        tagline: `Course ${courseId} not found`,
        thumbnailUrl: null,
        courseId,
        courseUrl: null,
        visibility: null,
        isPrimary: true,
      });
      continue;
    }

    const dropType = getDropType(course);
    events.push({
      date: dateStr,
      type: dropType === "mindset" ? "mindset_drop" : "physique_drop",
      title: course.title,
      tagline: course.tagline,
      thumbnailUrl: course.thumbnailUrl,
      courseId: course.id,
      courseUrl: getCourseUrl(course),
      visibility: course.visibility,
      isPrimary: true,
    });
  }

  // 2. Auto-generated weekly rhythm
  const scheduledDates = new Set(
    Object.keys(schedule).filter((k) => !k.startsWith("_"))
  );

  for (let day = 1; day <= total; day++) {
    const d = new Date(Date.UTC(year, month, day));
    const dateStr = formatDate(d);
    const dow = d.getUTCDay(); // 0=Sun, 1=Mon, ...

    // Tuesday: Mindset Announcement
    if (dow === 2) {
      events.push({
        date: dateStr,
        type: "mindset_announcement",
        title: "Mindset Announcement",
        tagline: "TikTok teaser + Whop announcement",
        thumbnailUrl: null,
        courseId: null,
        courseUrl: null,
        visibility: null,
        isPrimary: false,
      });
    }

    // Thursday: Physique Announcement
    if (dow === 4) {
      events.push({
        date: dateStr,
        type: "physique_announcement",
        title: "Physique Announcement",
        tagline: "TikTok teaser + Whop announcement",
        thumbnailUrl: null,
        courseId: null,
        courseUrl: null,
        visibility: null,
        isPrimary: false,
      });
    }

    // Sunday: Public Prompt
    if (dow === 0) {
      events.push({
        date: dateStr,
        type: "public_prompt",
        title: "Public Prompt",
        tagline: "Open-ended community prompt",
        thumbnailUrl: null,
        courseId: null,
        courseUrl: null,
        visibility: null,
        isPrimary: false,
      });
    }
  }

  // 3. 3rd Saturday: Mystery Drop (if not already scheduled)
  const thirdSat = getNthWeekdayOfMonth(year, month, 6, 3);
  const thirdSatStr = formatDate(thirdSat);
  if (
    thirdSat.getUTCMonth() === month &&
    !scheduledDates.has(thirdSatStr)
  ) {
    events.push({
      date: thirdSatStr,
      type: "surprise_drop",
      title: "Mystery Drop",
      tagline: "🎲 Mystery drop. No teaser. Just drops.",
      thumbnailUrl: null,
      courseId: null,
      courseUrl: null,
      visibility: null,
      isPrimary: true,
    });
  }

  // 4. Last day of month: Member of the Month + poll
  const lastDay = new Date(Date.UTC(year, month, total));
  events.push({
    date: formatDate(lastDay),
    type: "member_of_month",
    title: "Member of the Month",
    tagline: "Highlight + favorite-guide poll",
    thumbnailUrl: null,
    courseId: null,
    courseUrl: null,
    visibility: null,
    isPrimary: false,
  });

  // 5. Week 4 (start of last full week): Anonymous Feedback Reminder
  // Approximate: 4th Monday of the month
  const fourthMon = getNthWeekdayOfMonth(year, month, 1, 4);
  if (fourthMon.getUTCMonth() === month) {
    events.push({
      date: formatDate(fourthMon),
      type: "feedback_reminder",
      title: "Anonymous Feedback Reminder",
      tagline: "Reminder ping to all members",
      thumbnailUrl: null,
      courseId: null,
      courseUrl: null,
      visibility: null,
      isPrimary: false,
    });
  }

  // Sort by date, primary first within same date
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0);
  });

  return { year, month, events };
}
