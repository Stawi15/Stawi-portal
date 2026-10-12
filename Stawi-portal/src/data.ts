export type ContentType = "news" | "project" | "product";
export type ContentStatus = "Published" | "Draft" | "Scheduled";

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  category: string;
  description: string;
  image: string;
  status: ContentStatus;
  updatedAt: string;
  publishAt: string;
  author: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  detail: string;
  date: string;
  type: ContentType | "media";
}

export interface PortalData {
  version: 1;
  content: ContentItem[];
  media: MediaItem[];
  activity: Activity[];
}

const uploads = "https://stawiexperiences.com/wp-content/uploads";
export const photos = {
  symposium: `${uploads}/2026/06/COI00005-scaled.jpg`,
  summit: `${uploads}/2026/06/COI00409-3-scaled.jpg`,
  team: `${uploads}/2023/08/STAWIADVISORY-212-scaled.jpg`,
  event: `${uploads}/2023/07/World-Diabetes-Day5-scaled.jpg`,
  people: `${uploads}/2025/07/COI02654-scaled.jpg`,
  brand: `${uploads}/2023/07/Brand-Comms.png`,
};

export const typeLabels: Record<ContentType, string> = {
  news: "News article",
  project: "Project",
  product: "Product",
};

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isImageUrl(value: string) {
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value))
    return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
export const categories: Record<ContentType, string[]> = {
  news: ["Company news", "Insights", "Events", "Culture"],
  project: [
    "Event Experiences",
    "Team Engagement",
    "Brand Communications",
    "Learning",
  ],
  product: [
    "Experiences",
    "Learning",
    "Gifts & Merchandise",
    "Brand Communications",
  ],
};

export function createSeedData(): PortalData {
  const today = new Date();
  const date = (days: number) =>
    new Date(today.getTime() + days * 86400000).toISOString();
  const entries: [ContentType, string, string, string, ContentStatus][] = [
    [
      "news",
      "Creating connections that go beyond the event",
      "Insights",
      photos.people,
      "Published",
    ],
    [
      "project",
      "Cipla Synergy Summit & Gala Dinner",
      "Event Experiences",
      photos.summit,
      "Published",
    ],
    [
      "product",
      "The team experience, reimagined",
      "Experiences",
      photos.team,
      "Draft",
    ],
    [
      "news",
      "A new chapter in strategy and storytelling",
      "Company news",
      photos.brand,
      "Scheduled",
    ],
    [
      "project",
      "Kenya Private Sector PPP Symposium 2026",
      "Event Experiences",
      photos.symposium,
      "Published",
    ],
    [
      "news",
      "Why meaningful experiences move people",
      "Insights",
      photos.team,
      "Published",
    ],
    [
      "project",
      "World Diabetes Day with Novo Nordisk",
      "Team Engagement",
      photos.event,
      "Published",
    ],
    [
      "product",
      "Culture & connection workshops",
      "Learning",
      photos.people,
      "Published",
    ],
    [
      "news",
      "Behind the experience: meet the Stawi team",
      "Culture",
      photos.team,
      "Draft",
    ],
    [
      "project",
      "Building a shared vision for tomorrow",
      "Learning",
      photos.people,
      "Draft",
    ],
    [
      "product",
      "Brand stories that make an impact",
      "Brand Communications",
      photos.brand,
      "Published",
    ],
    [
      "product",
      "Thoughtful gifts. Lasting impressions.",
      "Gifts & Merchandise",
      photos.summit,
      "Draft",
    ],
  ];
  return {
    version: 1,
    content: entries.map(([type, title, category, image, status], index) => ({
      id: `sample-${index + 1}`,
      type,
      title,
      category,
      image,
      status,
      description:
        "We turn strategy into a rhythm people can feel, remember, and get behind. Discover how Stawi brings people together through purposeful experiences, storytelling, and learning.",
      updatedAt: date(-index),
      publishAt: status === "Scheduled" ? date(7).slice(0, 16) : "",
      author: "Stawi Team",
    })),
    media: Object.entries(photos).map(([name, url], index) => ({
      id: `media-${index}`,
      name: `${name}-experience.jpg`,
      url,
      createdAt: date(-index),
    })),
    activity: [
      {
        id: "a1",
        title: "News article published",
        detail: "Creating connections that go beyond the event",
        date: date(0),
        type: "news",
      },
      {
        id: "a2",
        title: "Project updated",
        detail: "Cipla Synergy Summit & Gala Dinner",
        date: date(-1),
        type: "project",
      },
      {
        id: "a3",
        title: "Product saved as draft",
        detail: "The team experience, reimagined",
        date: date(-2),
        type: "product",
      },
    ],
  };
}
