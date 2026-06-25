# 🏕️ CampHQ — camp management, all in one place

A demo of **CampHQ**, a mobile-first app for running overnight camps: rosters, buses,
cabins, teams, crew roles, schedules, announcements, photos, and a camper-facing
app — without stitching together three separate tools.

**▶️ Live demo:** https://rudygarr.github.io/bunk/

> This is a prototype. Sign-in is simulated and all data is sample data stored in
> your browser (localStorage) — nothing is sent anywhere. Hit it on your phone and
> "Add to Home Screen" for the full app feel.

## Two ways in

- **Run a camp** (organizer) — tap *Enter the demo*. You land on Warrior Week, a
  fully seeded sample camp.
- **I'm a camper** — log in with a demo email (try **`eli@demo.camp`**) and set any
  password. You'll see only your own camp: your bus, cabin, team standings, the
  schedule, photos, announcements, and the camp map + packing list.

## What it does

- **Roster & intake** — add campers one by one, **import a CSV**, or share a **QR
  code** that lets campers sign themselves up (no account needed).
- **Smart auto-fill** — algorithmically place campers into cabins (by gender, bed
  space, friend requests, grade) and buses (by capacity, keeping cabinmates
  together) — with a preview before anything changes.
- **Cabins & buses** — rental buses and cabins (with rooms-within and leaders).
- **Teams** — competitive teams with a live points standings board.
- **Crew roles & shifts** — assign adults to jobs (production, nurse, lifeguard,
  kitchen…) and see coverage gaps.
- **Attendance, health flags, printable packets.**
- **Camper app** — RSVP, schedule, audience-scoped announcements (everyone / your
  bus / your cabin / your team / just you), a photo feed, and a Camp Info tab with
  the map and packing checklist.

## Run it locally

```bash
npm install
npm run dev
```

Built with React 19 + TypeScript + Vite. The whole app reads/writes through
`src/lib/persistence.ts` (localStorage in the demo) — swap that one file for a real
backend and nothing else changes.
