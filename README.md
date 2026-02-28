# ❄️ WOS Ally Manager

A full-stack alliance management tool for **Whiteout Survival** players. Keep your alliance organised with a shared event schedule, multi-channel notifications, gift-code tracking, and in-app announcements — all in one place.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📅 **Events** | Create and manage recurring weekly alliance events with day/time scheduling |
| 🔔 **Notifications** | Multi-channel reminders (in-app, Discord webhook, Telegram, Web Push, e-mail) at 10 min, 5 min, and event start |
| 🎁 **Gift Codes** | Track and distribute gift codes; per-user redemption status |
| 📢 **Announcements** | Broadcast news and updates to the whole alliance |
| 👥 **Role system** | Five ranks (R1–R5); admins (R4/R5) manage the full roster |
| 🔐 **Authentication** | Secure email/password auth powered by [Better Auth](https://better-auth.com) |
| 📱 **PWA** | Installable progressive web app with offline support via Workbox |

---

## 🏗️ Tech Stack

**Monorepo** managed with [Turborepo](https://turbo.build) + npm workspaces.

| Layer | Technology |
|---|---|
| Frontend | [SvelteKit 2](https://kit.svelte.dev) + [Tailwind CSS 4](https://tailwindcss.com) |
| Backend | [Hono](https://hono.dev) on Node.js |
| Database | SQLite via [Drizzle ORM](https://orm.drizzle.team) + `better-sqlite3` |
| Auth | [Better Auth](https://better-auth.com) |
| Push | Web Push (VAPID) + Telegram Bot + Discord Webhooks |
| Scheduler | `node-cron` (per-minute tick) |
| Dev runner | [Task](https://taskfile.dev) (optional, wraps npm scripts) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js ≥ 22** (uses `--experimental-strip-types` for TypeScript)
- **npm ≥ 10**

### 1. Clone & install dependencies

```bash
git clone https://github.com/MrBns/wos-ally-manager.git
cd wos-ally-manager
npm install
```

### 2. Configure the server

Copy the example environment file and fill in the required values:

```bash
cp apps/server/.env.example apps/server/.env
```

Open `apps/server/.env` and edit:

```dotenv
PORT=3000
DATABASE_URL=./wos.db          # SQLite file path (created automatically)

# Public URL the browser uses to reach the server
BETTER_AUTH_URL=http://localhost:3000

# Comma-separated list of allowed frontend origins
TRUSTED_ORIGINS=http://localhost:5173

# Generate a strong random secret (min 32 chars)
BETTER_AUTH_SECRET=change-me-in-production-min-32-chars!!

# Optional integrations — leave blank to disable
TELEGRAM_BOT_TOKEN=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_MAILTO=mailto:admin@wos.local
```

> **Tip — generate VAPID keys** (needed for Web Push notifications):
> ```bash
> npx web-push generate-vapid-keys
> ```

### 3. Push the database schema

```bash
npm run db:push --workspace=apps/server
```

### 4. Start development servers

Run both the API server and the web app in one command:

```bash
npm run dev
```

Or with [Task](https://taskfile.dev):

```bash
task dev
```

| Service | Default URL |
|---|---|
| Web (SvelteKit) | http://localhost:5173 |
| API (Hono) | http://localhost:3000 |
| API health check | http://localhost:3000/health |

### 5. Create your first account

Open http://localhost:5173, click **Get Started**, and sign up. Then promote that account to R5 (admin) so you can access the admin panel:

```bash
# Open Drizzle Studio to edit the database via a browser GUI
npm run db:studio --workspace=apps/server
```

In Drizzle Studio, find your user in the `users` table and change the `role` column value from `r1` to `r5`. After that, all admin pages (user management, event creation, etc.) will be available in the app.

---

## 📁 Project Structure

```
wos-ally-manager/
├── apps/
│   ├── server/          # Hono API + Drizzle ORM + Better Auth
│   │   ├── src/
│   │   │   ├── db/      # Drizzle schema & migrations
│   │   │   ├── modules/ # Feature routers (events, notifications, giftcodes, …)
│   │   │   └── shared/  # Auth, middleware, helpers
│   │   └── .env.example
│   └── web/             # SvelteKit frontend + Tailwind CSS
│       └── src/
│           ├── routes/  # Pages: dashboard, events, notifications, admin, …
│           ├── lib/     # API clients, stores, utilities
│           └── components/
├── Taskfile.yml         # Optional Task shortcuts
├── turbo.json           # Turborepo pipeline config
└── package.json         # Root workspace + shared dev deps
```

---

## 🛠️ Available Commands

### Root (runs across all apps via Turborepo)

| Command | Description |
|---|---|
| `npm run dev` | Start all apps in watch/dev mode |
| `npm run build` | Production build for all apps |
| `npm run lint` | Lint & type-check all apps |
| `npm run format` | Format all source files with Prettier |

### Server workspace (`apps/server`)

| Command | Description |
|---|---|
| `npm run dev --workspace=apps/server` | Start API with live reload |
| `npm run build --workspace=apps/server` | Type-check (TypeScript) |
| `npm run db:push --workspace=apps/server` | Push schema changes to the SQLite database |
| `npm run db:studio --workspace=apps/server` | Open Drizzle Studio (browser DB GUI) |

### Web workspace (`apps/web`)

| Command | Description |
|---|---|
| `npm run dev --workspace=apps/web` | Start Vite dev server |
| `npm run build --workspace=apps/web` | Build for production |
| `npm run lint --workspace=apps/web` | ESLint |
| `npm run typecheck --workspace=apps/web` | `svelte-check` type validation |

### Task shortcuts (requires [Task](https://taskfile.dev))

```bash
task dev     # Run all apps
task web     # Run web only
task server  # Run server only
task build   # Build all
task lint    # Lint all
```

---

## ⚙️ Configuration Reference

### Server — `apps/server/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP port for the API server |
| `DATABASE_URL` | No | `./wos.db` | Path to the SQLite database file |
| `BETTER_AUTH_SECRET` | **Yes** | — | Random secret for JWT signing (≥ 32 chars) |
| `BETTER_AUTH_URL` | **Yes** | — | Public URL of the API (used in auth redirects) |
| `TRUSTED_ORIGINS` | **Yes** | — | Comma-separated list of allowed frontend origins |
| `TELEGRAM_BOT_TOKEN` | No | — | Bot token for Telegram notifications |
| `VAPID_PUBLIC_KEY` | No | — | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | No | — | VAPID private key for Web Push |
| `VAPID_MAILTO` | No | `mailto:admin@wos.local` | Contact email included in Web Push requests |

---

## 🔔 Notification Channels

Alliance members can enable any combination of the following channels in their profile settings:

- **In-app** — shown in the notifications panel inside the web app
- **Web Push** — browser/PWA push notifications (requires VAPID keys)
- **Discord** — per-user webhook URL posted to a Discord channel
- **Telegram** — requires a Telegram Bot token and the user's chat ID
- **E-mail** — (configured per user)

The scheduler fires reminders at **10 minutes**, **5 minutes**, and **at event start** (UTC times).

---

## 🤝 Contributing

1. Fork the repository and create a feature branch.
2. Make your changes, run `npm run lint` and `npm run build` to check everything.
3. Open a pull request describing what you changed and why.

---

## 📄 License

This project does not currently include a license file. Please contact the repository owner before using the code in other projects.
