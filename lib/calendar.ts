import scheduleData from "@/data/schedule.json";
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
