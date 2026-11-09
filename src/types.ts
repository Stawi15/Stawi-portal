export interface MediaAsset {
  id: string;
  media_type: string;
  storage_provider: string;
  bucket: string | null;
  object_key: string | null;
  url: string | null;
  alt_text: string;
  title: string | null;
  description: string | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  client_label: string | null;
  year_label: string | null;
  services: string[];
  categories: string[];
  intro: string | null;
  story_title: string | null;
  detail_title: string | null;
  body_paragraphs: string[];
  hero_media_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDraft {
  slug: string;
  title: string;
  client_label: string | null;
  year_label: string | null;
  services: string[];
  categories: string[];
  intro: string | null;
  story_title: string | null;
  detail_title: string | null;
  body_paragraphs: string[];
  hero_media_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  published: boolean;
}

export interface GalleryItem {
  id: string;
  project_id: string;
  media_id: string;
  sort_order: number;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  meta_label: string | null;
  audience: string | null;
  href: string | null;
  media_id: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceDraft {
  title: string;
  description: string | null;
  meta_label: string | null;
  audience: string | null;
  href: string | null;
  media_id: string | null;
  sort_order: number;
  published: boolean;
}

export interface CmsEditor {
  user_id: string;
  display_name: string | null;
  role: string;
  email: string;
  created_at: string;
}

export interface PortalUser {
  id: string;
  email: string;
  name: string;
  isEditor: boolean;
  isAdmin: boolean;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function splitParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function joinParagraphs(paragraphs: string[]): string {
  return paragraphs.join("\n\n");
}

export function mediaLabel(media: MediaAsset) {
  if (media.title?.trim()) return media.title;
  if (media.object_key) {
    const file = media.object_key.split("/").pop() ?? media.object_key;
    return file;
  }
  if (media.alt_text.trim()) return media.alt_text;
  return "Untitled image";
}
