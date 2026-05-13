// Server-side Whop API client. Uses the v1 REST API.
// Never import this from client components.

export type WhopVisibility = "visible" | "hidden";

export interface WhopCourse {
  id: string;
  title: string;
  tagline: string;
  description: string;
  visibility: WhopVisibility;
  thumbnailUrl: string | null;
  experienceId: string;
}

const WHOP_API_BASE = "https://api.whop.com/api/v1";

const MINDSET_EXP = process.env.WHOP_MINDSET_EXPERIENCE_ID || "exp_vxc1XS4rZbZ4zV";
const PHYSIQUE_EXP = process.env.WHOP_PHYSIQUE_EXPERIENCE_ID || "exp_2g7dgVHMJ0TH3q";

async function whopFetch(path: string): Promise<any> {
  const token = process.env.WHOP_API_KEY;
  if (!token) {
    throw new Error(
      "WHOP_API_KEY is not set. Add it to your environment variables."
    );
  }

  const res = await fetch(`${WHOP_API_BASE}${path}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-Company-ID": process.env.WHOP_COMPANY_ID || "",
      "Content-Type": "application/json",
    },
    next: {
      revalidate: parseInt(process.env.REVALIDATE_SECONDS || "60", 10),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Whop API ${res.status} ${path}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

async function listCoursesForExperience(
  experienceId: string
): Promise<WhopCourse[]> {
  const data = await whopFetch(
    `/courses?experience_id=${experienceId}&first=50`
  );

  const results = data?.data || [];
  return results.map(
    (c: any): WhopCourse => ({
      id: c.id,
      title: c.title || "Untitled course",
      tagline: c.tagline || "",
      description: c.description || "",
      visibility: (c.visibility as WhopVisibility) || "visible",
      thumbnailUrl: c?.thumbnail?.optimized_url ?? null,
      experienceId,
    })
  );
}

let _cache: { at: number; map: Map<string, WhopCourse> } | null = null;
const CACHE_TTL_MS = 60_000;

export async function loadAllCourses(): Promise<Map<string, WhopCourse>> {
  const now = Date.now();
  if (_cache && now - _cache.at < CACHE_TTL_MS) {
    return _cache.map;
  }

  const [mindset, physique] = await Promise.all([
    listCoursesForExperience(MINDSET_EXP),
    listCoursesForExperience(PHYSIQUE_EXP),
  ]);

  const map = new Map<string, WhopCourse>();
  for (const c of [...mindset, ...physique]) {
    map.set(c.id, c);
  }

  _cache = { at: now, map };
  return map;
}

export function getDropType(course: WhopCourse): "mindset" | "physique" {
  if (course.experienceId === PHYSIQUE_EXP) return "physique";
  return "mindset";
}

export function getCourseUrl(course: WhopCourse): string {
  // Direct deep link into the Whop experience page for the course
  return `https://whop.com/experiences/${course.experienceId}/courses/${course.id}`;
}
