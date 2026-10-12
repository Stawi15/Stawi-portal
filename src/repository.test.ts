import { describe, expect, it } from "vitest";
import { LocalContentRepository, validateData } from "./repository";
import { createSeedData } from "./data";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("Local content repository", () => {
  it("seeds a new workspace and persists its content", async () => {
    const repo = new LocalContentRepository(memoryStorage());
    const data = await repo.load();
    expect(data.content).toHaveLength(12);
    expect(await repo.load()).toEqual(data);
  });
  it("saves create, edit, and delete changes across repository instances", async () => {
    const storage = memoryStorage();
    const repo = new LocalContentRepository(storage);
    const data = await repo.load();
    const item = {
      ...data.content[0],
      id: "new-story",
      title: "New story",
      status: "Draft" as const,
    };
    data.content.push(item);
    await repo.save(data);
    const reopened = new LocalContentRepository(storage);
    expect(
      (await reopened.load()).content.find((i) => i.id === item.id)?.title,
    ).toBe("New story");
    item.title = "Edited story";
    await repo.save(data);
    expect(
      (await reopened.load()).content.find((i) => i.id === item.id)?.title,
    ).toBe("Edited story");
    data.content = data.content.filter((i) => i.id !== item.id);
    await repo.save(data);
    expect((await reopened.load()).content.some((i) => i.id === item.id)).toBe(
      false,
    );
  });
  it("reports corrupt stored data without silently replacing it", async () => {
    const storage = memoryStorage();
    storage.setItem("stawi-portal-v1", "{broken");
    await expect(new LocalContentRepository(storage).load()).rejects.toThrow(
      "Unable to load local content",
    );
    expect(storage.getItem("stawi-portal-v1")).toBe("{broken");
  });
  it("rejects invalid import shapes and invalid content types", () => {
    expect(() => validateData({ version: 1, content: [], media: [] })).toThrow(
      "invalid",
    );
    const data = createSeedData();
    expect(() =>
      validateData({
        ...data,
        content: [{ ...data.content[0], type: "invalid" }],
      }),
    ).toThrow("invalid");
    expect(() => validateData({ ...data, media: [{ id: "bad" }] })).toThrow(
      "invalid",
    );
  });
  it("surfaces browser storage failures", async () => {
    const repo = new LocalContentRepository({
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    await expect(repo.save(createSeedData())).rejects.toThrow("Unable to save");
    await expect(repo.load()).rejects.toThrow("Unable to save");
  });
  it("rejects duplicate identifiers, invalid dates, and unsafe image URLs", () => {
    const data = createSeedData();
    expect(() =>
      validateData({ ...data, content: [data.content[0], data.content[0]] }),
    ).toThrow("invalid");
    expect(() =>
      validateData({
        ...data,
        activity: [{ ...data.activity[0], date: "invalid" }],
      }),
    ).toThrow("invalid");
    expect(() =>
      validateData({
        ...data,
        media: [{ ...data.media[0], url: "javascript:alert(1)" }],
      }),
    ).toThrow("invalid");
    expect(() =>
      validateData({
        ...data,
        content: [{ ...data.content[0], status: "Scheduled", publishAt: "" }],
      }),
    ).toThrow("invalid");
  });
});
