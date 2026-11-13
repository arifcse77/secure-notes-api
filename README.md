# Secure Notes API

Backend-first interview task implementation using **Express + TypeScript + MongoDB + Mongoose**.

## Requirements

- Node.js 20+
- MongoDB 6+
- npm

## Run locally

```bash
cp .env.example .env
# Set MONGODB_URI and a random JWT_SECRET (32+ characters).
npm install
npm run dev
```

API base URL: `http://localhost:4000/api`; health check: `/health`.

Create the first administrator out of band (public registration always creates a `user`):

```bash
# Configure ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env
npm run seed:admin
```

Do not commit `.env`. Use a secrets manager in production.

## Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a user |
| POST | `/auth/login` | Public | Login and receive JWT |
| GET | `/auth/me` | Authenticated | Current profile |
| POST | `/notes` | User/Admin | Create own note |
| GET | `/notes?page=1&limit=20` | User/Admin | List own notes |
| GET | `/notes/:id` | Owner | Read own note |
| PUT | `/notes/:id` | Owner | Update own note |
| DELETE | `/notes/:id` | Owner | Delete own note |
| GET | `/posts?page=1&limit=20` | Authenticated | List public posts |
| POST | `/posts` | Authenticated | Create a post |
| POST | `/admin/users` | Admin | Create a user |
| GET | `/admin/users?page=1&limit=20` | Admin | List users |
| GET | `/admin/users/interests?page=1&limit=20` | Admin | Group users by interest |
| GET | `/admin/users/:id` | Admin | Read user |
| PUT | `/admin/users/:id` | Admin | Update user |
| DELETE | `/admin/users/:id` | Admin | Delete user |
| GET | `/admin/notes?page=1&limit=20` | Admin | List all notes |
| GET | `/users/:id/posts?page=1&limit=20` | Authenticated | User's posts via `$lookup` |

All protected requests require `Authorization: Bearer <token>`. Pagination defaults to page 1, limit 20; limit is capped at 100.

## Index rationale

Indexes are declared visibly with `schema.index()` in the model files.

| Collection | Index | Why it exists |
|---|---|---|
| users | `{ email: 1 }`, unique | Exact email lookup for login and uniqueness |
| users | `{ createdAt: -1, _id: -1 }` | Stable newest-first admin user pagination |
| notes | `{ userId: 1, createdAt: -1, _id: -1 }` | Owner-filtered, newest-first note listing |
| notes | `{ createdAt: -1, _id: -1 }` | Admin all-notes newest-first pagination; distinct from owner-filtered access pattern |
| posts | `{ userId: 1 }` | Foreign-field lookup for `$lookup` from users to posts |
| posts | `{ published: 1, createdAt: -1, _id: -1 }` | Public published-post feed and its newest-first pagination |

MongoDB automatically creates `{ _id: 1 }` on each collection. No additional `_id` index is created. No `interests` index is added: the grouping operation unwinds and groups the entire user population, so a standalone interests index does not avoid scanning the users being grouped.

The admin users index supports the exact sort used by the endpoint. The notes compound index supports both list and owner-scoped reads/updates/deletes because `userId` is its prefix. The posts index supports the equality join on `posts.userId`.

### Important query-plan note

The global admin-notes list and public published-post feed each have their own sort/filter access pattern, so each has a matching compound index. These are not duplicates of the owner/lookup indexes: compound index prefixes and sort order matter.

## Aggregation requirements

### Scenario 1 — users grouped by interests

`src/controllers/aggregation.controller.ts` contains exactly one `User.aggregate()` call in `usersGroupedByInterest`. It does not call `find`, `countDocuments`, `distinct`, or another collection method. `$facet` computes the page and total group count inside that same aggregation call.

Users with an empty `interests` array do not appear in a group because `$unwind` emits no row for them. Each user appears once per distinct interest because the User schema normalizes interests to unique lowercase values.

### Scenario 2 — user's posts with `$lookup`

`getUserPosts` uses one `User.aggregate()` pipeline:
1. `$match` the requested user by `_id` (built-in index).
2. `$lookup` posts by `posts.userId` (explicit index).
3. `$unwind`, sort and `$facet` for paginated post results.

The endpoint returns an empty page if the user does not exist or has no posts. This keeps the implementation to one aggregation call.

## Security choices

- Passwords are bcrypt-hashed (default 12 rounds); `passwordHash` is excluded from normal Mongoose queries.
- JWT uses HS256, a configured secret, expiry, and an explicit algorithm allow-list during verification.
- Public registration cannot set `role`; only the admin provisioning endpoint/seed can create admins.
- Note queries always include the authenticated owner ID. An admin can view all notes through `/admin/notes`, but still edits/deletes only their own notes through normal note routes.
- Zod validates request bodies; Mongoose validates persisted documents.
- Helmet, JSON body-size limit, CORS allow-list and auth rate limiting are enabled.
- User deletion does not cascade-delete notes/posts. Establish an explicit retention/cascade policy before changing this behavior.

## Example requests

Register:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"A User","email":"user@example.com","password":"A-Long-Password-123","interests":["chess","reading"]}'
```

Login:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"A-Long-Password-123"}'
```

Create a note:

```bash
curl -X POST http://localhost:4000/api/notes \
  -H 'Authorization: Bearer YOUR_TOKEN' -H 'Content-Type: application/json' \
  -d '{"title":"Interview preparation","content":"Review MongoDB indexes and aggregation."}'
```

## Before submission

1. Run `npm install`, `npm run build`, and start MongoDB.
2. Run `npm run seed:admin`, then test both user and admin tokens.
3. Test that User A cannot read/update/delete User B's note (expect 404).
4. Test that a normal user receives 403 on every `/admin/*` route.
5. Test pagination boundaries, duplicate emails, malformed IDs, expired JWTs and invalid payloads.
6. Run `explain("executionStats")` against the list and lookup queries with representative data. Confirm index use and check for blocking sorts.
7. Consider adding automated integration tests (e.g. Jest/Vitest + Supertest + mongodb-memory-server) before production use.

## Frontend

The task explicitly prioritizes backend. This repository intentionally does not include a UI template or spend time on visual design.
