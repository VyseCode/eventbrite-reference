# Evently — Eventbrite reference implementation

A reference implementation inspired by **Eventbrite**: discover events, buy tickets, manage check-ins, and track organizer revenue. Built with Next.js 16.4.6 (App Router), React 19, Tailwind CSS 4, TypeScript, MongoDB/Mongoose, bcryptjs, jose (JWT in an HTTP-only cookie), and zod.

## Features

- **Auth**: email/password registration and login, bcrypt hashing, signed JWT in an HTTP-only cookie, guarded app routes.
- **Event discovery**: paginated browsing with text search and filters for category, location, and date range, plus upcoming/newest sorting.
- **Event CRUD**: organizers create events with multiple ticket types (name, price, quantity), edit their own events and ticket types, and delete events with their dependent records. Ticket type edits cannot reduce quantity below tickets already sold, and sold types cannot be removed.
- **Ticketing**: purchase issues a unique ticket code per ticket, reserves inventory atomically with `findOneAndUpdate`-style guarded `$inc`, enforces capacity, per-order limits, sold-out and post-event guards, with rollback on partial failure.
- **My tickets**: paginated list with valid/checked-in filters and ticket codes.
- **Check-in**: organizer-only, marks a ticket used exactly once; a second check-in returns 409.
- **Engagement**: save/unsave events and one review per user per event with ratings. Organizers can flag, unflag, hide and restore reviews; removed reviews are hidden from attendees and excluded from ratings.
- **Audit trail**: organizer event edits and review moderation actions are recorded per event and shown on the event page.
- **Organizer dashboard**: events, tickets sold, revenue, checked-in count, check-in rate, and per-event stats.
- Responsive cards, detail page with ticket selection, loading/disabled states, empty states, and inline error states.

## Local setup

1. `npm install`
2. Start MongoDB locally (`127.0.0.1:27017`) or set `MONGODB_URI`.
3. Copy `.env.example` to `.env.local` and set a real `JWT_SECRET`.
4. `npm run seed` (re-runnable; wipes only `eventbrite_ref`). Seeds one flagged review and its audit entry for demoing moderation.
5. `npm run build && npm run start -- -p 3209` (or `npm run dev -- -p 3209`).

Open <http://localhost:3209>. The production port used for verification is **3209**.

## Environment

| Variable | Example | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/eventbrite_ref` | Mongo connection string |
| `JWT_SECRET` | `replace-with-a-long-random-secret` | HMAC secret for session tokens |

`.env.local` is gitignored; `.env.example` is committed.

## Seed data

`npm run seed` creates indexes, clears only the `eventbrite_ref` database, and inserts:
5 users, 9 events (including a past event and a sold-out ticket type), 8 orders, 30 tickets (some already checked in), 4 saved events, and 5 reviews.

### Demo accounts (password for all: `password123`)

| Email | Role |
| --- | --- |
| `organizer@example.com` | Organizer of most events — use for dashboard and check-in |
| `cole@example.com` | Organizer of the past DevOps event |
| `attendee@example.com` | Attendee with tickets and saves |
| `priya@example.com` | Attendee |
| `marcus@example.com` | Attendee with checked-in tickets and reviews |

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run seed
```

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account (201) |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Current user (or `user: null`) |
| GET/POST | `/api/events` | Browse/search/filter/paginate / create event |
| GET/PATCH/DELETE | `/api/events/[id]` | Event detail / edit (owner) / delete (owner) |
| GET | `/api/events/mine` | Events you organize |
| POST | `/api/events/[id]/purchase` | Buy tickets, reserve inventory atomically |
| GET | `/api/events/[id]/tickets` | Organizer-only attendee ticket list |
| GET/POST | `/api/events/[id]/reviews` | List / add review (organizers also see removed reviews) |
| PATCH | `/api/events/[id]/reviews/[reviewId]` | Organizer flag/unflag/remove/restore review |
| GET | `/api/events/[id]/audit` | Organizer change history for an event |
| POST | `/api/events/[id]/save` | Toggle saved event |
| GET | `/api/tickets` | My tickets (paginated, status filter) |
| POST | `/api/tickets/[code]/check-in` | Organizer check-in (once) |
| GET | `/api/dashboard` | Organizer stats |

## Pages

`/` (redirect), `/login`, `/register`, `/events`, `/events/new`, `/events/[id]`, `/events/[id]/edit`, `/tickets`, `/manage`. Authenticated pages redirect anonymous visitors to `/login`.

## Scalability notes

- One cached Mongoose connection with a bounded pool avoids reconnect storms on hot reload.
- Unique compound indexes enforce one save and one review per user/event; unique ticket codes prevent collisions.
- Inventory is reserved with conditional atomic `$inc`; list/sort fields are indexed; reads use `.lean()` and explicit projections; all list endpoints are paginated and capped.
- Passwords are never selected by default and never serialized to clients.

## Known limitations

- No real payment gateway; ticket prices are recorded but no money is charged.
- No email verification, password reset, rate limiting, or refund/cancellation flow.
- Ticket codes are plain text (no scannable QR image), and check-in is manual by code.
- Moderation is organizer-only and local to each event; there is no platform-wide trust & safety team, appeal flow, or helpfulness voting.
- Ticket price edits affect future purchases only; previously sold tickets keep the price recorded on their order.
- Local Mongo connection; no deployment configuration for a hosted database.

## Reference

Architecture and patterns follow the internal Next.js 16 reference implementation (`linkedin-clone`), with product scope inspired by Eventbrite. This is a demo/reference project, not affiliated with Eventbrite.
