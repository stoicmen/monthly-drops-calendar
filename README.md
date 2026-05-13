# Monthly Drops Calendar — Stoic Society

A self-hosted Whop app that shows the current month's character drops, weekly rhythm, and surprise drops. Pulls course data live from the Whop API.

## How it works

- **Calendar grid** — current month by default, with prev/next/today controls
- **Drops** — mapped by date in `data/schedule.json` to your real Whop courses. The app pulls title, tagline, thumbnail, and visibility live from Whop.
- **Weekly rhythm** — auto-generated. Tuesday/Thursday announcements, Sunday public prompts, 2nd Saturday surprise drop, Week 4 feedback reminder, last day of month = Member of the Month.

## Updating drops each month

Edit one file: `data/schedule.json`.

```json
{
  "2026-06-03": "cors_XXXXXX",
  "2026-06-05": "cors_YYYYYY"
}
```

The key is the date (YYYY-MM-DD). The value is the Whop course ID (looks like `cors_xxx`). Commit, push, Vercel redeploys automatically. The calendar updates within 60 seconds.

To get a course ID:
1. Open the course in Whop
2. Look at the URL — it ends in `/cors_XXXXX`
3. Or ask Claude to look it up via MCP

## Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   gh repo create monthly-drops-calendar --private --source=. --push
   ```
   (or use the GitHub web UI to create a new repo and upload)

2. **Deploy to Vercel**
   - Go to https://vercel.com/new
   - Import the GitHub repo
   - Add environment variables (see `.env.example`):
     - `WHOP_API_KEY` — required, server-side only
     - `WHOP_COMPANY_ID` — `biz_RA4DEeFZia7ANs`
     - `WHOP_MINDSET_EXPERIENCE_ID` — `exp_vxc1XS4rZbZ4zV`
     - `WHOP_PHYSIQUE_EXPERIENCE_ID` — `exp_2g7dgVHMJ0TH3q`
   - Deploy. You'll get a URL like `https://monthly-drops-calendar.vercel.app`

3. **Register the app on Whop**
   - Go to https://whop.com/dashboard/developer
   - Create a new app
   - Set the base URL to your Vercel domain
   - Set the experience path to `/experiences/[experienceId]`
   - Set the dashboard path to `/dashboard/[companyId]`
   - Set status to **hidden** (so it doesn't show on the app store)

4. **Install on Stoic Society**
   - Inside the dashboard, install the app on the Stoic Society company
   - Add it as an app inside your experiences
   - Set the experience visibility to **hidden** if you only want admins to see it

## Local dev

```bash
cp .env.example .env.local
# fill in WHOP_API_KEY
npm install
npm run dev
```

Visit http://localhost:3000

## Files you might edit

- `data/schedule.json` — monthly drop schedule (the only file you regularly touch)
- `lib/whop.ts` — Whop API integration
- `lib/calendar.ts` — calendar building logic, weekly rhythm rules
- `components/Calendar.tsx` — UI

## Stay Stoic 🤝
