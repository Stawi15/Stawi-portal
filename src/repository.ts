import {
  createSeedData,
  isImageUrl,
  type PortalData,
  type ContentItem,
  type MediaItem,
  type Activity,
} from "./data";

const KEY = "stawi-portal-v1";

export interface ContentRepository {
  load(): Promise<PortalData>;
  save(data: PortalData): Promise<void>;
}

function isContent(value: unknown): value is ContentItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    [
      "id",
      "title",
      "category",
      "description",
      "image",
      "updatedAt",
      "publishAt",
      "author",
    ].every((key) => typeof item[key] === "string") &&
    ["news", "project", "product"].includes(String(item.type)) &&
    ["Published", "Draft", "Scheduled"].includes(String(item.status)) &&
    String(item.id).trim().length > 0 &&
    String(item.title).trim().length > 0 &&
    String(item.description).trim().length > 0 &&
    (!item.image || isImageUrl(String(item.image))) &&
    !Number.isNaN(Date.parse(String(item.updatedAt))) &&
    (item.status !== "Scheduled" ||
      !Number.isNaN(Date.parse(String(item.publishAt))))
  );
}

function isMedia(value: unknown): value is MediaItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    ["id", "name", "url", "createdAt"].every(
      (key) => typeof item[key] === "string",
    ) &&
    String(item.id).trim().length > 0 &&
    String(item.name).trim().length > 0 &&
    isImageUrl(String(item.url)) &&
    !Number.isNaN(Date.parse(String(item.createdAt)))
  );
}

function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    ["id", "title", "detail", "date"].every(
      (key) => typeof item[key] === "string",
    ) &&
    String(item.id).trim().length > 0 &&
    ["news", "project", "product", "media"].includes(String(item.type)) &&
    !Number.isNaN(Date.parse(String(item.date)))
  );
}

function hasUniqueIds(items: { id: string }[]) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

export function validateData(value: unknown): PortalData {
  if (!value || typeof value !== "object")
    throw new Error("The saved portal data is invalid.");
  const data = value as Record<string, unknown>;
  if (
    data.version !== 1 ||
    !Array.isArray(data.content) ||
    !data.content.every(isContent) ||
    !Array.isArray(data.media) ||
    !data.media.every(isMedia) ||
    !Array.isArray(data.activity) ||
    !data.activity.every(isActivity) ||
    !hasUniqueIds(data.content) ||
    !hasUniqueIds(data.media) ||
    !hasUniqueIds(data.activity)
  ) {
    throw new Error(
      "The saved portal data is invalid. Restore a valid Stawi export or reset the demo in Settings.",
    );
  }
  return {
    version: 1,
    content: data.content,
    media: data.media,
    activity: data.activity,
  };
}

export class LocalContentRepository implements ContentRepository {
  constructor(private storage: Pick<Storage, "getItem" | "setItem">) {}

  async load(): Promise<PortalData> {
    const saved = this.storage.getItem(KEY);
    if (saved) {
      try {
        return validateData(JSON.parse(saved));
      } catch (error) {
        throw new Error(
          `Unable to load local content: ${error instanceof Error ? error.message : "Invalid data"}`,
        );
      }
    }
    const data = createSeedData();
    await this.save(data);
    return data;
  }

  async save(data: PortalData): Promise<void> {
    validateData(data);
    try {
      this.storage.setItem(KEY, JSON.stringify(data));
    } catch {
      throw new Error(
        "Unable to save to this browser. Storage may be full or disabled. Export your content or remove unused uploaded images and try again.",
      );
    }
  }
}

export function getRepository(): ContentRepository {
  return new LocalContentRepository(window.localStorage);
}
