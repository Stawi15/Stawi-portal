import { useEffect, useRef, useState, type ElementType } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  Newspaper,
  FolderKanban,
  Package,
  Images,
  Settings,
  Search,
  ArrowUpRight,
  Plus,
  ChevronDown,
  ChevronRight,
  Bell,
  ArrowRight,
  MoreHorizontal,
  Globe,
  CircleHelp,
  X,
  Menu,
  Clock3,
  Check,
  FileText,
  Pencil,
  Eye,
  Trash2,
  Upload,
  Download,
  Link2,
  Leaf,
  CheckCircle2,
  SlidersHorizontal,
  ImagePlus,
} from "lucide-react";
import {
  createSeedData,
  formatDate,
  typeLabels,
  type ContentItem,
  type ContentType,
  type PortalData,
  type MediaItem,
  type Activity,
} from "./data";
import {
  getRepository,
  validateData,
  type ContentRepository,
} from "./repository";
import { ContentEditor, ContentImage, Modal, StatusBadge } from "./components";

type Page = "overview" | "news" | "project" | "product" | "media" | "settings";
const navigation: { page: Page; label: string; icon: ElementType }[] = [
  { page: "overview", label: "Overview", icon: LayoutDashboard },
  { page: "news", label: "News & insights", icon: Newspaper },
  { page: "project", label: "Projects", icon: FolderKanban },
  { page: "product", label: "Products", icon: Package },
  { page: "media", label: "Media library", icon: Images },
];
const WEBSITE = "https://stawi-website.vercel.app/";
const icons: Record<ContentType | "media", ElementType> = {
  news: Newspaper,
  project: FolderKanban,
  product: Package,
  media: Images,
};
const titles: Record<Page, string> = {
  overview: "Overview",
  news: "News & insights",
  project: "Projects",
  product: "Products",
  media: "Media library",
  settings: "Settings",
};

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [data, setData] = useState<PortalData | null>(null);
  const repository = useRef<ContentRepository | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [editor, setEditor] = useState<{
    type: ContentType;
    item?: ContentItem;
  } | null>(null);
  const [preview, setPreview] = useState<ContentItem | null>(null);
  const [deleting, setDeleting] = useState<ContentItem | MediaItem | null>(
    null,
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const [help, setHelp] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [createMenu, setCreateMenu] = useState(false);
  const [period, setPeriod] = useState("This month");
  const [busy, setBusy] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        repository.current = getRepository();
        const loaded = await repository.current.load();
        if (active) setData(loaded);
      } catch (error) {
        if (active) setError(errorMessage(error));
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!createMenu) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCreateMenu(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [createMenu]);

  async function persist(next: PortalData, message: string) {
    if (!repository.current) throw new Error("Local storage is not available.");
    await repository.current.save(next);
    setData(next);
    setError("");
    setToast(message);
  }

  function go(next: Page) {
    setPage(next);
    setQuery("");
    setStatus("All statuses");
    setMobileNav(false);
  }

  async function saveItem(item: ContentItem) {
    if (!data) throw new Error("Content is still loading.");
    const exists = data.content.some((entry) => entry.id === item.id);
    await persist(
      {
        ...data,
        content: [
          item,
          ...data.content.filter((entry) => entry.id !== item.id),
        ],
        activity: [
          {
            id: crypto.randomUUID(),
            title: `${typeLabels[item.type]} ${exists ? "updated" : "created"}`,
            detail: item.title,
            date: item.updatedAt,
            type: item.type,
          },
          ...data.activity,
        ].slice(0, 30),
      },
      "Content saved to this browser.",
    );
  }

  async function deleteItem() {
    if (!data || !deleting) return;
    setBusy(true);
    try {
      if ("type" in deleting) {
        await persist(
          {
            ...data,
            content: data.content.filter((item) => item.id !== deleting.id),
            activity: [
              {
                id: crypto.randomUUID(),
                title: `${typeLabels[deleting.type]} deleted`,
                detail: deleting.title,
                date: new Date().toISOString(),
                type: deleting.type,
              },
              ...data.activity,
            ].slice(0, 30),
          },
          "Content deleted.",
        );
      } else {
        const used = data.content.some((item) => item.image === deleting.url);
        if (used)
          throw new Error(
            "This image is used by content. Change or remove its cover image before deleting this file.",
          );
        await persist(
          {
            ...data,
            media: data.media.filter((item) => item.id !== deleting.id),
          },
          "Image removed from the library.",
        );
      }
      setDeleting(null);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function upload(files: FileList | null) {
    if (!files?.length || !data) return;
    setBusy(true);
    try {
      const media: MediaItem[] = [];
      for (const file of Array.from(files)) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
          throw new Error(`${file.name}: choose a JPG, PNG, or WebP image.`);
        if (file.size > 2 * 1024 * 1024)
          throw new Error(
            `${file.name}: images must be under 2 MB in demo mode.`,
          );
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === "string"
              ? resolve(reader.result)
              : reject(new Error("Unable to read image."));
          reader.onerror = () =>
            reject(new Error(`Unable to read ${file.name}.`));
          reader.readAsDataURL(file);
        });
        media.push({
          id: crypto.randomUUID(),
          name: file.name,
          url,
          createdAt: new Date().toISOString(),
        });
      }
      const activity: Activity = {
        id: crypto.randomUUID(),
        title: `${media.length} image${media.length === 1 ? "" : "s"} uploaded`,
        detail: media.map((m) => m.name).join(", "),
        type: "media",
        date: new Date().toISOString(),
      };
      await persist(
        {
          ...data,
          media: [...media, ...data.media],
          activity: [activity, ...data.activity].slice(0, 30),
        },
        "Images added to your media library.",
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  function exportData() {
    if (!data) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `stawi-content-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("Content export requested. Check your browser downloads.");
  }

  async function restore(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Choose a Stawi export smaller than 10 MB.");
      const restored = validateData(JSON.parse(await file.text()));
      await persist(restored, "Content restored from your export.");
    } catch (error) {
      setError(`Restore failed: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
      if (restoreRef.current) restoreRef.current.value = "";
    }
  }

  const content = data?.content ?? [];
  const filtered = content
    .filter(
      (item) =>
        (page === "overview" || item.type === page) &&
        (status === "All statuses" || item.status === status) &&
        `${item.title} ${item.category} ${typeLabels[item.type]}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const drafts = content.filter((item) => item.status === "Draft");
  const shown = page === "overview" ? filtered.slice(0, 5) : filtered;
  const published = content.filter(
    (item) => item.status === "Published",
  ).length;
  const media = (data?.media ?? []).filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="app-shell">
      {mobileNav && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "is-open" : ""}`}>
        <a
          className="brand"
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            go("overview");
          }}
          aria-label="Stawi Portal home"
        >
          <span className="brand-emblem">
            <Leaf size={25} strokeWidth={1.8} />
          </span>
          <span className="brand-name">
            STAWI<span>experiences</span>
          </span>
        </a>
        <div className="workspace">
          <div className="workspace-avatar">
            S<span />
          </div>
          <div>
            <strong>Stawi Portal</strong>
            <span>Content workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ page: next, label, icon: Icon }) => (
            <button
              key={next}
              className={`nav-item ${page === next ? "active" : ""}`}
              onClick={() => go(next)}
              aria-current={page === next ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {next === "news" && (
                <span className="nav-count">
                  {content.filter((i) => i.type === "news").length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="site-card">
            <span className="site-icon">
              <Globe size={20} />
            </span>
            <strong>Your stories. Out in the world.</strong>
            <p>See the experiences you're helping bring to life.</p>
            <a href={WEBSITE} target="_blank" rel="noreferrer">
              Visit Stawi website
              <ArrowUpRight size={15} />
            </a>
          </div>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => go("settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="nav-item" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            <span>Help & getting started</span>
            <ArrowUpRight size={15} />
          </button>
          <div className="profile">
            <div className="avatar">ST</div>
            <div>
              <strong>Stawi Team</strong>
              <span>Demo workspace</span>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{titles[page]}</strong>
          </div>
          <div className="topbar-right">
            <a
              className="website-link"
              href={WEBSITE}
              target="_blank"
              rel="noreferrer"
            >
              <Globe size={15} />
              View website
              <ArrowUpRight size={14} />
            </a>
            <span className="top-divider" />
            <button
              className="notification-button icon-button"
              onClick={() => setNotifications(true)}
              aria-label="View recent activity"
            >
              <Bell size={19} />
              <span />
            </button>
            <div className="avatar small">ST</div>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span />
                STAWI CONTENT HUB
              </div>
              <h1>
                {page === "overview"
                  ? "A little overview. A lot of possibility."
                  : titles[page]}
              </h1>
              <p>
                {page === "overview"
                  ? "Here's what's happening with your Stawi website today."
                  : page === "media"
                    ? "One home for the images behind your stories."
                    : page === "settings"
                      ? "Manage your workspace and prepare for your next chapter."
                      : `Create, curate, and manage your ${page === "news" ? "news and insights" : `${page}s`}.`}
              </p>
            </div>
            {page !== "settings" && (
              <div className="create-wrapper">
                {page === "media" ? (
                  <button
                    className="button primary"
                    disabled={busy || !data}
                    onClick={() => uploadRef.current?.click()}
                  >
                    <Upload size={17} />
                    {busy ? "Uploading..." : "Upload images"}
                  </button>
                ) : (
                  <button
                    className="button primary"
                    disabled={!data}
                    onClick={() =>
                      page === "overview"
                        ? setCreateMenu(!createMenu)
                        : setEditor({ type: page as ContentType })
                    }
                    aria-expanded={page === "overview" ? createMenu : undefined}
                  >
                    <Plus size={18} />
                    Create content
                    {page === "overview" && <ChevronDown size={15} />}
                  </button>
                )}
                {createMenu && (
                  <>
                    <button
                      className="menu-dismiss"
                      aria-label="Close create menu"
                      onClick={() => setCreateMenu(false)}
                    />
                    <div className="create-menu">
                      {(["news", "project", "product"] as const).map((type) => {
                        const Icon = icons[type];
                        return (
                          <button
                            key={type}
                            onClick={() => {
                              setEditor({ type });
                              setCreateMenu(false);
                            }}
                          >
                            <Icon size={17} />
                            New {typeLabels[type].toLowerCase()}
                            <ArrowUpRight size={14} />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {!data && !error && (
            <div className="loading">Opening your workspace...</div>
          )}
          {page === "overview" && (
            <>
              <section className="welcome-banner">
                <div className="welcome-copy">
                  <span className="welcome-label">
                    <span />
                    MAKE AN IMPACT
                  </span>
                  <h2>
                    Good stories deserve
                    <br />
                    to be shared.
                  </h2>
                  <p>
                    Turn your latest experiences into your next great story.
                    <br className="desktop-break" /> Let's keep the Stawi
                    website fresh, together.
                  </p>
                  <button
                    onClick={() => setEditor({ type: "news" })}
                    disabled={!data}
                  >
                    Create your next story
                    <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="banner-art" aria-hidden="true">
                  <div className="art-orbit orbit-one" />
                  <div className="art-orbit orbit-two" />
                  <div className="art-dots" />
                  <div className="art-card art-card-back">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="art-card art-card-front">
                    <div className="art-photo">
                      <div className="art-sun" />
                      <div className="art-mountain" />
                    </div>
                    <div className="art-line" />
                    <div className="art-line short" />
                    <div className="art-card-footer">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  <div className="art-star">✳</div>
                  <div className="art-check">
                    <Check size={23} />
                  </div>
                  <span className="art-caption">
                    a little spark. a lasting impact.
                  </span>
                </div>
              </section>
              <section className="stat-grid" aria-label="Content overview">
                {(
                  [
                    {
                      label: "News & insights",
                      type: "news",
                      color: "orange",
                      caption: "Stories worth sharing",
                    },
                    {
                      label: "Projects",
                      type: "project",
                      color: "blue",
                      caption: "Experiences brought to life",
                    },
                    {
                      label: "Products",
                      type: "product",
                      color: "purple",
                      caption: "Possibilities to explore",
                    },
                    {
                      label: "Media assets",
                      type: "media",
                      color: "green",
                      caption: "The visuals behind it all",
                    },
                  ] as const
                ).map(({ label, type, color, caption }) => {
                  const Icon = icons[type];
                  const entries = content.filter((item) => item.type === type);
                  return (
                    <button
                      key={type}
                      className="stat-card"
                      onClick={() => go(type)}
                    >
                      <div className="stat-card-top">
                        <span className={`stat-icon ${color}`}>
                          <Icon size={19} />
                        </span>
                        <ArrowUpRight size={16} className="stat-arrow" />
                      </div>
                      <span className="stat-label">{label}</span>
                      <div className="stat-value">
                        {type === "media"
                          ? (data?.media.length ?? 0)
                          : entries.length}
                        <span>
                          {type === "media"
                            ? "in your library"
                            : `${entries.filter((item) => item.status === "Published").length} published`}
                        </span>
                      </div>
                      <p>{caption}</p>
                    </button>
                  );
                })}
              </section>
              <div className="overview-middle">
                <section className="panel chart-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Content at a glance</h2>
                      <p>A little consistency goes a long way.</p>
                    </div>
                    <select
                      aria-label="Chart period"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    >
                      <option>This month</option>
                      <option>Last month</option>
                    </select>
                  </div>
                  <div className="chart-summary">
                    <strong>{period === "This month" ? "18" : "14"}</strong>
                    <span>content updates</span>
                    <span className="sample-tag">Sample data</span>
                  </div>
                  <div
                    className="chart"
                    role="img"
                    aria-label={`Illustrative ${period.toLowerCase()} content updates chart. Sample data, not live analytics.`}
                  >
                    <div className="chart-y">
                      <span>12</span>
                      <span>8</span>
                      <span>4</span>
                      <span>0</span>
                    </div>
                    <div className="chart-plot">
                      <div className="chart-grid">
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                      <svg viewBox="0 0 600 140" preserveAspectRatio="none">
                        <defs>
                          <linearGradient
                            id="chart-fill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#ef783c"
                              stopOpacity=".14"
                            />
                            <stop
                              offset="100%"
                              stopColor="#ef783c"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d={
                            period === "This month"
                              ? "M0 105 C40 106 50 60 95 72 S165 104 200 60 S260 71 300 38 S360 59 400 27 S465 65 500 35 S560 44 600 12 L600 140 L0 140Z"
                              : "M0 120 C70 110 80 85 120 100 S180 70 220 90 S300 40 350 70 S460 30 500 60 S560 26 600 33 L600 140 L0 140Z"
                          }
                          fill="url(#chart-fill)"
                        />
                        <path
                          d={
                            period === "This month"
                              ? "M0 105 C40 106 50 60 95 72 S165 104 200 60 S260 71 300 38 S360 59 400 27 S465 65 500 35 S560 44 600 12"
                              : "M0 120 C70 110 80 85 120 100 S180 70 220 90 S300 40 350 70 S460 30 500 60 S560 26 600 33"
                          }
                          fill="none"
                          stroke="#e8753d"
                          strokeWidth="2.5"
                        />
                        <path
                          d="M0 122 C50 121 65 103 105 111 S185 121 225 104 S310 116 355 91 S440 111 490 91 S570 96 600 77"
                          fill="none"
                          stroke="#93aaa0"
                          strokeWidth="2"
                          strokeDasharray="5 5"
                        />
                      </svg>
                      <div className="chart-x">
                        {["01", "05", "10", "15", "20", "25", "30"].map(
                          (day) => (
                            <span key={day}>{day}</span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="orange-dot" />
                      Published
                    </span>
                    <span>
                      <i className="green-dot" />
                      Drafts
                    </span>
                    <span className="chart-note">Illustrative activity</span>
                  </div>
                </section>
                <section className="panel quick-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Make your next move</h2>
                      <p>Big ideas start with a small step.</p>
                    </div>
                    <span className="spark-icon">✳</span>
                  </div>
                  <div className="quick-actions">
                    {(
                      [
                        [
                          "news",
                          "Share a story",
                          "Add news or a fresh insight",
                          "orange",
                        ],
                        [
                          "project",
                          "Showcase your work",
                          "Bring a new project to life",
                          "blue",
                        ],
                        [
                          "product",
                          "Add a possibility",
                          "Introduce a product or service",
                          "purple",
                        ],
                      ] as const
                    ).map(([type, title, text, color]) => {
                      const Icon = icons[type];
                      return (
                        <button
                          key={type}
                          disabled={!data}
                          onClick={() => setEditor({ type })}
                        >
                          <span className={`stat-icon ${color}`}>
                            <Icon size={18} />
                          </span>
                          <span>
                            <strong>{title}</strong>
                            <small>{text}</small>
                          </span>
                          <ArrowUpRight size={17} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="quick-tip">
                    <span className="tip-icon">
                      <Leaf size={16} />
                    </span>
                    <p>
                      A fresh website is a growing website.
                      <br />
                      <strong>Keep the good things coming.</strong>
                    </p>
                  </div>
                </section>
              </div>
            </>
          )}
          {(page === "overview" ||
            page === "news" ||
            page === "project" ||
            page === "product") && (
            <div className={page === "overview" ? "overview-bottom" : ""}>
              <section className="panel content-panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      {page === "overview"
                        ? "Recent content"
                        : `Your ${page === "news" ? "news & insights" : `${page}s`}`}
                      <span className="count-badge">
                        {page === "overview"
                          ? content.length
                          : content.filter((i) => i.type === page).length}
                      </span>
                    </h2>
                    <p>
                      {page === "overview"
                        ? "The latest from your content workspace."
                        : "Your next great experience starts here."}
                    </p>
                  </div>
                  {page === "overview" && (
                    <button
                      className="text-button"
                      onClick={() => {
                        go("news");
                      }}
                    >
                      View news
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>
                <div className="table-toolbar">
                  <div className="search-input">
                    <Search size={16} />
                    <input
                      aria-label="Search content"
                      placeholder="Search content..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        className="icon-button"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="status-filter">
                    <SlidersHorizontal size={15} />
                    <select
                      aria-label="Filter content by status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option>All statuses</option>
                      <option>Published</option>
                      <option>Draft</option>
                      <option>Scheduled</option>
                    </select>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>CONTENT</th>
                        <th>STATUS</th>
                        <th>UPDATED</th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((item) => (
                        <ContentRow
                          key={item.id}
                          item={item}
                          onEdit={() => setEditor({ type: item.type, item })}
                          onPreview={() => setPreview(item)}
                          onDelete={() => setDeleting(item)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                {shown.length === 0 && (
                  <div className="empty-state">
                    <FileText size={30} />
                    <h3>
                      {query || status !== "All statuses"
                        ? "No matching content"
                        : "A blank page. A fresh start."}
                    </h3>
                    <p>
                      {query || status !== "All statuses"
                        ? "Try a different search or status filter."
                        : "Create your first piece of content to get started."}
                    </p>
                  </div>
                )}
                <div className="table-footer">
                  <span>
                    Showing {shown.length} of {filtered.length}{" "}
                    {page === "overview"
                      ? "content items"
                      : `${page === "news" ? "articles" : `${page}s`}`}
                  </span>
                  <span>
                    <span className="small-dot" />
                    Saved locally
                  </span>
                </div>
              </section>
              {page === "overview" && (
                <section className="panel activity-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Recent activity</h2>
                      <p>A little progress, every day.</p>
                    </div>
                    <Clock3 size={17} className="muted" />
                  </div>
                  <div className="activity-list">
                    {data?.activity.slice(0, 3).map((activity, index) => {
                      const Icon = icons[activity.type];
                      return (
                        <div className="activity-item" key={activity.id}>
                          <div
                            className={`activity-icon ${index === 0 ? "orange" : index === 1 ? "blue" : "purple"}`}
                          >
                            <Icon size={15} />
                          </div>
                          <div>
                            <strong>{activity.title}</strong>
                            <p>{activity.detail}</p>
                            <span>{formatDate(activity.date)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="draft-reminder">
                    <div>
                      <span className="draft-icon">
                        <FileText size={16} />
                      </span>
                      <strong>A few ideas in the making</strong>
                    </div>
                    <p>
                      You have {drafts.length} draft
                      {drafts.length === 1 ? "" : "s"} waiting for their moment.
                    </p>
                    <button
                      onClick={() => {
                        const draft = drafts[0];
                        if (draft) setEditor({ type: draft.type, item: draft });
                      }}
                      disabled={!drafts.length}
                    >
                      Pick up where you left off
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}
          {page === "media" && (
            <section className="panel media-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    Your visual library
                    <span className="count-badge">
                      {data?.media.length ?? 0}
                    </span>
                  </h2>
                  <p>JPG, PNG, and WebP. Up to 2 MB per image in demo mode.</p>
                </div>
                <div className="search-input">
                  <Search size={16} />
                  <input
                    aria-label="Search media"
                    placeholder="Find an image..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="media-grid">
                {media.map((item) => (
                  <article className="media-card" key={item.id}>
                    <ContentImage src={item.url} alt={item.name} />
                    <div>
                      <strong title={item.name}>{item.name}</strong>
                      <span>{formatDate(item.createdAt)}</span>
                      <button
                        className="icon-button"
                        onClick={() => setDeleting(item)}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
                <button
                  className="upload-card"
                  disabled={busy || !data}
                  onClick={() => uploadRef.current?.click()}
                >
                  <ImagePlus size={30} />
                  <strong>Add to your library</strong>
                  <span>Upload your next great visual</span>
                  <span className="button secondary">
                    <Plus size={15} />
                    Choose images
                  </span>
                </button>
              </div>
              {!media.length && query && (
                <p className="empty-state">No images match your search.</p>
              )}
            </section>
          )}
          {page === "settings" && (
            <div className="settings-grid">
              <section className="panel settings-panel">
                <span className="stat-icon orange">
                  <Link2 size={21} />
                </span>
                <h2>Content, connected.</h2>
                <p>
                  This is a local demo workspace, not a live connection. Changes
                  are saved in this browser and are not sent to the Stawi
                  website.
                </p>
                <div className="setting-row">
                  <span>Website</span>
                  <a href={WEBSITE} target="_blank" rel="noreferrer">
                    stawi-website.vercel.app
                    <ArrowUpRight size={14} />
                  </a>
                </div>
                <div className="setting-row">
                  <span>Backend connection</span>
                  <span className="demo-pill">Not connected</span>
                </div>
                <div className="setting-row">
                  <span>Storage</span>
                  <strong>This browser only</strong>
                </div>
                <div className="local-notice">
                  <CircleHelp size={18} />
                  Connect a backend repository and authentication before using
                  this as a production admin portal.
                </div>
              </section>
              <section className="panel settings-panel">
                <span className="stat-icon blue">
                  <Download size={21} />
                </span>
                <h2>Your content. Yours to keep.</h2>
                <p>
                  Export your workspace as JSON to back it up or move it into a
                  future backend. Restoring replaces all current local content.
                </p>
                <div className="settings-actions">
                  <button
                    className="button secondary"
                    disabled={!data || busy}
                    onClick={exportData}
                  >
                    <Download size={16} />
                    Export content
                  </button>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => restoreRef.current?.click()}
                  >
                    <Upload size={16} />
                    Restore export
                  </button>
                </div>
                <hr />
                <h3>Start fresh</h3>
                <p>
                  Reset this browser's workspace to the original sample content.
                  Export your content first if you want to keep it.
                </p>
                <button
                  className="button danger-outline"
                  disabled={busy}
                  onClick={() => setConfirmReset(true)}
                >
                  Reset demo workspace
                </button>
              </section>
            </div>
          )}
          <footer className="page-footer">
            <span>
              Made for meaningful experiences.
              <span className="footer-flower">✳</span>
            </span>
            <span>
              <span className="small-dot" />
              Demo workspace<span className="footer-separator">/</span>
              {published} locally published
            </span>
          </footer>
        </main>
      </div>
      <input
        type="file"
        ref={uploadRef}
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => void upload(e.target.files)}
      />
      <input
        type="file"
        ref={restoreRef}
        accept=".json,application/json"
        hidden
        onChange={(e) => void restore(e.target.files?.[0])}
      />
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {editor && (
        <ContentEditor
          item={editor.item}
          initialType={editor.type}
          media={data?.media ?? []}
          onClose={() => setEditor(null)}
          onSave={saveItem}
        />
      )}
      {preview && (
        <Modal title="Content preview" onClose={() => setPreview(null)} wide>
          <article className="preview">
            <ContentImage src={preview.image} alt={preview.title} />
            <div className="preview-meta">
              <span className="eyebrow">{preview.category}</span>
              <StatusBadge status={preview.status} />
            </div>
            <h2>{preview.title}</h2>
            <p className="preview-byline">
              By {preview.author} · {formatDate(preview.updatedAt)}
            </p>
            <p className="preview-text">{preview.description}</p>
            {preview.status === "Scheduled" && (
              <p className="local-notice">
                Scheduled locally for{" "}
                {new Date(preview.publishAt).toLocaleString()}. Automatic
                publishing requires a backend.
              </p>
            )}
            <div className="local-notice">
              Local preview only. This content has not been sent to the live
              website.
            </div>
          </article>
        </Modal>
      )}
      {deleting && (
        <Modal
          title={
            "type" in deleting ? "Delete this content?" : "Remove this image?"
          }
          onClose={() => setDeleting(null)}
        >
          <div className="confirmation">
            <p>
              “{"title" in deleting ? deleting.title : deleting.name}” will be
              removed from this browser's workspace. This cannot be undone.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Keep it
              </button>
              <button
                className="button danger"
                disabled={busy}
                onClick={() => void deleteItem()}
              >
                {busy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {confirmReset && (
        <Modal
          title="Reset your demo workspace?"
          onClose={() => setConfirmReset(false)}
        >
          <div className="confirmation">
            <p>
              This replaces all local content and uploaded media with sample
              data. Export your content first to keep a backup.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
              <button
                className="button danger"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    if (!repository.current)
                      repository.current = getRepository();
                    await persist(createSeedData(), "Demo workspace reset.");
                    setConfirmReset(false);
                  } catch (error) {
                    setError(errorMessage(error));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Reset workspace
              </button>
            </div>
          </div>
        </Modal>
      )}
      {help && (
        <Modal
          title="A home for your next great story"
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <p>Welcome to the Stawi content workspace.</p>
            <ol>
              <li>
                <strong>Create content.</strong> Add news, showcase a project,
                or introduce a product.
              </li>
              <li>
                <strong>Make it yours.</strong> Write your story, choose a
                category, and add a cover image from the media library.
              </li>
              <li>
                <strong>Choose its next step.</strong> Keep a draft, mark it
                published locally, or set a future schedule.
              </li>
              <li>
                <strong>Keep a backup.</strong> Export your workspace in
                Settings.
              </li>
            </ol>
            <div className="local-notice">
              This is a demo. No login or backend is configured. Data is stored
              only in this browser; clearing browser storage removes it.
              Scheduling does not automatically publish.
            </div>
            <a
              className="button secondary"
              href={WEBSITE}
              target="_blank"
              rel="noreferrer"
            >
              Explore the Stawi website
              <ArrowUpRight size={16} />
            </a>
          </div>
        </Modal>
      )}
      {notifications && (
        <Modal
          title="Workspace activity"
          onClose={() => setNotifications(false)}
        >
          <div className="notification-list">
            {data?.activity.length ? (
              data.activity.map((activity) => (
                <div key={activity.id}>
                  <span className="stat-icon orange">
                    <Clock3 size={17} />
                  </span>
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.detail}</p>
                    <small>{formatDate(activity.date)}</small>
                  </div>
                </div>
              ))
            ) : (
              <p>No activity yet. Your next step will show up here.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function ContentRow({
  item,
  onEdit,
  onPreview,
  onDelete,
}: {
  item: ContentItem;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  useEffect(() => {
    if (!menuPosition) return;
    const close = () => setMenuPosition(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuPosition]);
  const Icon = icons[item.type];
  return (
    <tr>
      <td>
        <button className="content-title" onClick={onPreview}>
          <ContentImage src={item.image} alt="" />
          <span>
            <strong>{item.title}</strong>
            <small>
              <Icon size={11} />
              {typeLabels[item.type]}
              <span>·</span>
              {item.category}
            </small>
          </span>
        </button>
      </td>
      <td>
        <StatusBadge status={item.status} />
      </td>
      <td className="date-cell">{formatDate(item.updatedAt)}</td>
      <td>
        <div className="row-actions">
          <button
            className="icon-button row-edit"
            aria-label={`Edit ${item.title}`}
            onClick={onEdit}
          >
            <Pencil size={15} />
          </button>
          <button
            className="icon-button"
            aria-label={`More actions for ${item.title}`}
            aria-expanded={Boolean(menuPosition)}
            onClick={(event) => {
              if (menuPosition) {
                setMenuPosition(null);
                return;
              }
              const rect = event.currentTarget.getBoundingClientRect();
              setMenuPosition({
                top: Math.max(
                  8,
                  Math.min(rect.bottom + 6, window.innerHeight - 150),
                ),
                left: Math.max(8, rect.right - 160),
              });
            }}
          >
            <MoreHorizontal size={19} />
          </button>
          {menuPosition &&
            createPortal(
              <>
                <button
                  className="menu-dismiss"
                  aria-label="Close actions"
                  onClick={() => setMenuPosition(null)}
                />
                <div
                  className="row-menu"
                  style={{
                    position: "fixed",
                    ...menuPosition,
                    right: "auto",
                    bottom: "auto",
                  }}
                >
                  <button
                    onClick={() => {
                      onPreview();
                      setMenuPosition(null);
                    }}
                  >
                    <Eye size={15} />
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      onEdit();
                      setMenuPosition(null);
                    }}
                  >
                    <Pencil size={15} />
                    Edit content
                  </button>
                  <button
                    className="delete-action"
                    onClick={() => {
                      onDelete();
                      setMenuPosition(null);
                    }}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </>,
              document.body,
            )}
        </div>
      </td>
    </tr>
  );
}
