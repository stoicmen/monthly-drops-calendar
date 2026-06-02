// Server-side: loads the drop schedule (date -> Whop course ID) from Notion.
// This replaces the static data/schedule.json. Never import from client components.
//
// Required env var:  NOTION_TOKEN   (your Notion internal integration token)
// Optional env var:  NOTION_DATABASE_ID  (defaults to the Course Drop Schedule DB)

const DATABASE_ID =
  process.env.NOTION_DATABASE_ID || "f5fe78b1-5023-4af3-8a09-af9bfd5451c4";

function plain(prop: any): string {
  if (!prop) return "";
  const items = prop.title || prop.rich_text || [];
  return items.map((p: any) => p.plain_text).join("").trim();
}

export async function loadSchedule(): Promise<Record<string, string>> {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error(
      "NOTION_TOKEN is not set. Add it in Vercel > Settings > Environment Variables."
    );
  }

  const schedule: Record<string, string> = {};
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        next: {
          revalidate: parseInt(process.env.REVALIDATE_SECONDS || "60", 10),
        },
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Notion API ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    for (const row of data.results || []) {
      const props = row.properties || {};
      const date: string = props["Drop Date"]?.date?.start || "";
      const courseId = plain(props["Whop Course ID"]);
      if (date && courseId) {
        // Keep only YYYY-MM-DD in case Notion returns a full timestamp.
        schedule[date.slice(0, 10)] = courseId;
      }
    }

    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return schedule;
}
