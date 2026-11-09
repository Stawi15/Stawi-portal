import { insforge, MEDIA_BUCKET } from "./insforge";
import type {
  CmsEditor,
  GalleryItem,
  MediaAsset,
  PortalUser,
  Project,
  ProjectDraft,
  Resource,
  ResourceDraft,
} from "./types";

function fail(error: unknown, fallback: string): never {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message.trim()) throw new Error(message);
  }
  throw new Error(fallback);
}

// ---------- Auth & access ----------

export async function signIn(email: string, password: string) {
  const { data, error } = await insforge.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data?.user) fail(error, "Unable to sign in. Check your email and password.");
  return data.user;
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await insforge.auth.signUp({ email, password, name });
  if (error) fail(error, "Unable to create your account.");
  return data;
}

export async function verifyEmail(email: string, otp: string) {
  const { data, error } = await insforge.auth.verifyEmail({ email, otp });
  if (error) fail(error, "That verification code didn't work. Check the code and try again.");
  return data;
}

export async function signOut() {
  await insforge.auth.signOut();
}

export async function getCurrentPortalUser(): Promise<PortalUser | null> {
  const { data, error } = await insforge.auth.getCurrentUser();
  if (error || !data?.user) return null;
  const user = data.user as {
    id: string;
    email: string;
    profile?: { name?: string | null } | null;
  };
  const [editorResult, adminResult] = await Promise.all([
    insforge.database.rpc("is_cms_editor"),
    insforge.database.rpc("is_cms_admin"),
  ]);
  return {
    id: user.id,
    email: user.email,
    name: user.profile?.name?.trim() || user.email.split("@")[0],
    isEditor: editorResult.data === true,
    isAdmin: adminResult.data === true,
  };
}

// ---------- Projects ----------

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await insforge.database
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) fail(error, "Unable to load projects.");
  return (data ?? []) as Project[];
}

export async function createProject(draft: ProjectDraft): Promise<Project> {
  const { data, error } = await insforge.database
    .from("projects")
    .insert([{ ...draft, published_at: draft.published ? new Date().toISOString() : null }])
    .select();
  if (error || !data?.length) fail(error, "Unable to create the project.");
  return data[0] as Project;
}

export async function updateProject(
  id: string,
  draft: ProjectDraft,
  previousPublished: boolean,
): Promise<Project> {
  const patch: Record<string, unknown> = { ...draft };
  if (draft.published && !previousPublished) {
    patch.published_at = new Date().toISOString();
  }
  if (!draft.published) {
    patch.published_at = null;
  }
  const { data, error } = await insforge.database
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select();
  if (error || !data?.length) fail(error, "Unable to save the project.");
  return data[0] as Project;
}

export async function setProjectPublished(project: Project, published: boolean) {
  const { data, error } = await insforge.database
    .from("projects")
    .update({
      published,
      published_at: published ? (project.published_at ?? new Date().toISOString()) : null,
    })
    .eq("id", project.id)
    .select();
  if (error || !data?.length) fail(error, "Unable to update the publish status.");
  return data[0] as Project;
}

export async function deleteProject(id: string) {
  const { error } = await insforge.database.from("projects").delete().eq("id", id);
  if (error) fail(error, "Unable to delete the project.");
}

// ---------- Project gallery ----------

export async function listGallery(projectId: string): Promise<GalleryItem[]> {
  const { data, error } = await insforge.database
    .from("project_gallery")
    .select("id, project_id, media_id, sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (error) fail(error, "Unable to load the project gallery.");
  return (data ?? []) as GalleryItem[];
}

export async function saveGallery(projectId: string, mediaIds: string[]) {
  const existing = await listGallery(projectId);
  const keep = new Set(mediaIds);
  const removed = existing.filter((item) => !keep.has(item.media_id));
  if (removed.length) {
    const { error } = await insforge.database
      .from("project_gallery")
      .delete()
      .eq("project_id", projectId)
      .in(
        "media_id",
        removed.map((item) => item.media_id),
      );
    if (error) fail(error, "Unable to update the gallery.");
  }
  const existingByMedia = new Map(existing.map((item) => [item.media_id, item]));
  const additions = mediaIds
    .map((mediaId, index) => ({ mediaId, sortOrder: index + 1 }))
    .filter(({ mediaId }) => !existingByMedia.has(mediaId));
  if (additions.length) {
    const { error } = await insforge.database.from("project_gallery").insert(
      additions.map(({ mediaId, sortOrder }) => ({
        project_id: projectId,
        media_id: mediaId,
        sort_order: sortOrder,
      })),
    );
    if (error) fail(error, "Unable to add images to the gallery.");
  }
  for (const [index, mediaId] of mediaIds.entries()) {
    const current = existingByMedia.get(mediaId);
    if (current && current.sort_order !== index + 1) {
      const { error } = await insforge.database
        .from("project_gallery")
        .update({ sort_order: index + 1 })
        .eq("id", current.id);
      if (error) fail(error, "Unable to reorder the gallery.");
    }
  }
}

// ---------- Media ----------

export async function listMedia(): Promise<MediaAsset[]> {
  const pageSize = 1000;
  const all: MediaAsset[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await insforge.database
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) fail(error, "Unable to load the media library.");
    const batch = (data ?? []) as MediaAsset[];
    all.push(...batch);
    if (batch.length < pageSize) break;
  }
  return all;
}

function readImageSize(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

export async function uploadMedia(file: File, altText: string): Promise<MediaAsset> {
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const now = new Date();
  const key = `stawi/uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${Date.now()}-${safeName}`;
  const { data: uploaded, error: uploadError } = await insforge.storage
    .from(MEDIA_BUCKET)
    .upload(key, file);
  if (uploadError || !uploaded) fail(uploadError, `Unable to upload ${file.name}.`);
  const size = file.type.startsWith("image/")
    ? await readImageSize(file)
    : { width: null, height: null };
  const { data, error } = await insforge.database
    .from("media_assets")
    .insert([
      {
        media_type: file.type.startsWith("video/") ? "video" : "image",
        storage_provider: "insforge",
        bucket: uploaded.bucket,
        object_key: uploaded.key,
        url: uploaded.url,
        alt_text: altText,
        title: file.name.replace(/\.[a-z0-9]+$/i, ""),
        mime_type: uploaded.mimeType || file.type || null,
        width: size.width,
        height: size.height,
      },
    ])
    .select();
  if (error || !data?.length) {
    await insforge.storage.from(MEDIA_BUCKET).remove(uploaded.key);
    fail(error, `Uploaded ${file.name}, but could not record it in the library.`);
  }
  return data[0] as MediaAsset;
}

export async function updateMedia(
  id: string,
  patch: { alt_text: string; title: string | null; description: string | null },
): Promise<MediaAsset> {
  const { data, error } = await insforge.database
    .from("media_assets")
    .update(patch)
    .eq("id", id)
    .select();
  if (error || !data?.length) fail(error, "Unable to save the image details.");
  return data[0] as MediaAsset;
}

export interface MediaUsage {
  heroProjects: string[];
  galleryCount: number;
  resources: string[];
}

export async function getMediaUsage(mediaId: string): Promise<MediaUsage> {
  const [hero, gallery, resources] = await Promise.all([
    insforge.database.from("projects").select("title").eq("hero_media_id", mediaId),
    insforge.database
      .from("project_gallery")
      .select("id", { count: "exact", head: true })
      .eq("media_id", mediaId),
    insforge.database.from("resources").select("title").eq("media_id", mediaId),
  ]);
  if (hero.error) fail(hero.error, "Unable to check image usage.");
  if (gallery.error) fail(gallery.error, "Unable to check image usage.");
  if (resources.error) fail(resources.error, "Unable to check image usage.");
  return {
    heroProjects: (hero.data ?? []).map((row) => String((row as { title: string }).title)),
    galleryCount: gallery.count ?? 0,
    resources: (resources.data ?? []).map((row) => String((row as { title: string }).title)),
  };
}

export async function deleteMedia(media: MediaAsset) {
  const usage = await getMediaUsage(media.id);
  if (usage.heroProjects.length || usage.galleryCount || usage.resources.length) {
    const parts: string[] = [];
    if (usage.heroProjects.length)
      parts.push(`cover of ${usage.heroProjects.slice(0, 2).join(", ")}`);
    if (usage.galleryCount) parts.push(`${usage.galleryCount} project gallery image(s)`);
    if (usage.resources.length) parts.push(`resource ${usage.resources.slice(0, 2).join(", ")}`);
    throw new Error(
      `This image is still in use (${parts.join("; ")}). Update that content before deleting it.`,
    );
  }
  const { error } = await insforge.database.from("media_assets").delete().eq("id", media.id);
  if (error) fail(error, "Unable to delete the image record.");
  if (media.storage_provider === "insforge" && media.bucket && media.object_key) {
    await insforge.storage.from(media.bucket).remove(media.object_key);
  }
}

// ---------- Resources ----------

export async function listResources(): Promise<Resource[]> {
  const { data, error } = await insforge.database
    .from("resources")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) fail(error, "Unable to load resources.");
  return (data ?? []) as Resource[];
}

export async function createResource(draft: ResourceDraft): Promise<Resource> {
  const { data, error } = await insforge.database.from("resources").insert([draft]).select();
  if (error || !data?.length) fail(error, "Unable to create the resource.");
  return data[0] as Resource;
}

export async function updateResource(id: string, draft: ResourceDraft): Promise<Resource> {
  const { data, error } = await insforge.database
    .from("resources")
    .update(draft)
    .eq("id", id)
    .select();
  if (error || !data?.length) fail(error, "Unable to save the resource.");
  return data[0] as Resource;
}

export async function deleteResource(id: string) {
  const { error } = await insforge.database.from("resources").delete().eq("id", id);
  if (error) fail(error, "Unable to delete the resource.");
}

// ---------- Editors (admin) ----------

export async function listEditors(): Promise<CmsEditor[]> {
  const { data, error } = await insforge.database.rpc("list_cms_editors");
  if (error) fail(error, "Unable to load the editor list.");
  return (data ?? []) as CmsEditor[];
}

export async function addEditorByEmail(email: string, role: "editor" | "admin") {
  const { data, error } = await insforge.database.rpc("add_cms_editor_by_email", {
    p_email: email,
    p_role: role,
  });
  if (error) fail(error, "Unable to add that editor.");
  return data;
}

export async function removeEditor(userId: string) {
  const { error } = await insforge.database.rpc("remove_cms_editor", {
    p_user_id: userId,
  });
  if (error) fail(error, "Unable to remove that editor.");
}
