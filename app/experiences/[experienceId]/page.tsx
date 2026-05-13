import Calendar from "@/components/Calendar";

export const dynamic = "force-dynamic";

export default function ExperiencePage() {
  const now = new Date();
  return (
    <Calendar initialYear={now.getFullYear()} initialMonth={now.getMonth()} />
  );
}
