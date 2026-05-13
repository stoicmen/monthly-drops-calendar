import { NextRequest, NextResponse } from "next/server";
import { buildMonthCalendar } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const now = new Date();
    const year = parseInt(
      url.searchParams.get("year") || String(now.getFullYear()),
      10
    );
    const month = parseInt(
      url.searchParams.get("month") || String(now.getMonth()),
      10
    );

    if (
      isNaN(year) ||
      isNaN(month) ||
      year < 2000 ||
      year > 2100 ||
      month < 0 ||
      month > 11
    ) {
      return NextResponse.json({ error: "invalid year/month" }, { status: 400 });
    }

    const calendar = await buildMonthCalendar(year, month);
    const revalidate = parseInt(process.env.REVALIDATE_SECONDS || "60", 10);

    return NextResponse.json(calendar, {
      headers: {
        "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate * 5}`,
      },
    });
  } catch (err: any) {
    console.error("[calendar api]", err);
    return NextResponse.json(
      { error: err?.message || "failed to build calendar" },
      { status: 500 }
    );
  }
}
