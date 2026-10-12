# Stawi Portal

A responsive content dashboard for Stawi Experiences, built with React, TypeScript, and Vite.

## Run locally

```sh
npm install
npm run dev
```

Open the URL printed by Vite. To validate or build:

```sh
npm run lint
npm test
npm run build
```

Use `npm run format` to format the source files.

## Features

- Overview with content totals, recent activity, quick actions, and explicitly illustrative activity charts.
- Create, edit, preview, and delete news, projects, and products.
- Search content and filter by draft, published, or scheduled status.
- Media library with JPG, PNG, and WebP uploads (2 MB per file in demo mode).
- Cover image selection from the library or an HTTP(S) image URL.
- JSON backup and restore, plus a confirmed demo reset.
- Responsive navigation and accessible modal dialogs.

## Demo limitations

The portal uses browser `localStorage`. Publishing changes only local status; it does **not** update the live website. Scheduling records a future time but does not automatically publish. Charts show sample data, not measured website analytics. No authentication or authorization is implemented. Do not store sensitive data or use this as a production admin portal.

Sample content and images reference the original Stawi website, but the content descriptions are illustrative. Images require an internet connection; unavailable images show a placeholder. Browser storage is limited, so large uploads can exhaust it; save failures are reported and unsaved changes are not shown as successful. Export backups regularly. Clearing browser data removes local content.

Restoring a JSON export replaces the entire local workspace. Removing an image used as a content cover is blocked until the cover is changed.

## Connecting a backend

The data model is defined in [src/data.ts](src/data.ts). Storage is separated behind `ContentRepository` in [src/repository.ts](src/repository.ts). Replace `getRepository()` with an authenticated API adapter implementing `load()` and `save()`, or evolve the interface to per-resource operations when the backend contract is known.

The production integration needs:

1. Authentication and server-enforced roles for editors/admins.
2. CRUD endpoints for news, projects, and products, with schema validation.
3. Object storage uploads rather than base64 images in browser storage.
4. A public website API exposing only published content.
5. Backend scheduling and a reliable publish workflow, including time zone handling.
6. Server-side audit logs and real analytics, replacing the illustrative chart.
7. Pagination, concurrency control, and durable backups.

The live public website remains unchanged. A frontend alone cannot publish into its current static data; wire the public website to the backend's published-content endpoints as part of the integration.

## Deployment

Run `npm run build` and deploy `dist/` to Vercel or another static host. Vercel can use the Vite preset with this folder as the project root. The dashboard uses in-app navigation, so no server route rewrite is required.
