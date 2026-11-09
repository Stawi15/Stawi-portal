# Stawi Portal

The content management system (CMS) for the Stawi Experiences website, built with
React, TypeScript, and Vite, and connected to the Stawi InsForge backend
(PostgreSQL, authentication, and file storage).

## Run locally

```sh
npm install
cp .env.example .env.local   # fill in the InsForge URL and anon key
npm run dev
```

Open the URL printed by Vite. To validate or build:

```sh
npm run lint
npm test
npm run build
```

Use `npm run format` to format the source files.

## Configuration

The portal reads its backend connection from environment variables
(see [.env.example](.env.example)):

- `VITE_INSFORGE_URL` — the InsForge backend base URL.
- `VITE_INSFORGE_ANON_KEY` — the InsForge anon key (public, shipped to the browser).

Both values are available in the InsForge dashboard under **Install → API Keys**.

### Temporarily disabling sign-in

To open the dashboard directly without the sign-in screen, set in `.env.local`:

```sh
VITE_DISABLE_AUTH=true
VITE_PORTAL_SERVICE_EMAIL=...   # a verified account listed in cms_editors
VITE_PORTAL_SERVICE_PASSWORD=...
```

The portal then signs in silently with that service account. **Anyone who can
open the portal can edit website content while this is on.** Set
`VITE_DISABLE_AUTH=false` (and rotate or delete the service account) to restore
the normal sign-in screen; no other changes are needed.

## Features

- **Sign in / sign up** with email and password, including 6-digit email
  verification for new accounts. Editor access is granted by an administrator.
- **Overview** with live counts of projects, resources, and media, recently
  updated content, and recent activity.
- **Projects**: create, edit, publish/unpublish, and delete the projects shown
  in the website's work section — title, slug, client, services, categories,
  story paragraphs, cover image, ordered photo gallery, SEO fields, and display
  order.
- **Resources**: manage the guides and tools section — title, description,
  label, audience, link, image, order, and publish state.
- **Media library**: browse and search all website images, upload new ones to
  InsForge storage, edit names/alt text, copy links, and delete unused images
  (deletion is blocked while an image is still used by content).
- **Team access** (admins only): grant or remove editor/admin access by email.
- Responsive navigation and accessible modal dialogs.

## Backend model

Content lives in the InsForge PostgreSQL database:

- `projects` + `project_gallery` — work case studies and their image galleries.
- `resources` — downloadable guides and tools.
- `media_assets` — image metadata; files live in the public `website-media`
  storage bucket.
- `cms_editors` — who can edit (role `editor` or `admin`).

Row Level Security enforces permissions server-side: anonymous visitors can
read only published content, and all writes require a `cms_editors` row (or
InsForge project-admin status), checked by the `is_cms_editor()` /
`is_cms_admin()` database functions. Team management uses the
`add_cms_editor_by_email`, `list_cms_editors`, and `remove_cms_editor` RPCs.

Publishing is immediate: content marked **Published** is readable by the public
website right away; drafts are visible only to signed-in editors.

## Deployment

Run `npm run build` and deploy `dist/` to Vercel or another static host, with
the two `VITE_INSFORGE_*` environment variables set at build time. The
dashboard uses in-app navigation, so no server route rewrite is required.
