import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  FolderKanban,
  Globe,
  Images,
  LayoutDashboard,
  Leaf,
  LibraryBig,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import {
  getCurrentPortalUser,
  listMedia,
  listProjects,
  listResources,
  signIn,
  signOut,
} from "./api";
import {
  AUTH_DISABLED,
  SERVICE_EMAIL,
  SERVICE_PASSWORD,
} from "./insforge";
import { Modal } from "./components";
import { LoginPage } from "./LoginPage";
import { OverviewPage, type OverviewTarget } from "./OverviewPage";
import { ProjectsPage } from "./ProjectsPage";
import { ResourcesPage } from "./ResourcesPage";
import { MediaPage } from "./MediaPage";
import { EditorsPage } from "./EditorsPage";
import { SettingsPage } from "./SettingsPage";
import {
  formatDate,
  type MediaAsset,
  type PortalUser,
  type Project,
  type Resource,
} from "./types";

type Page = "overview" | "projects" | "resources" | "media" | "editors" | "settings";

const WEBSITE = "https://stawi-website.vercel.app/";

const navigation: { page: Page; label: string; icon: ElementType }[] = [
  { page: "overview", label: "Overview", icon: LayoutDashboard },
  { page: "projects", label: "Projects", icon: FolderKanban },
  { page: "resources", label: "Resources", icon: LibraryBig },
  { page: "media", label: "Media library", icon: Images },
];

const titles: Record<Page, string> = {
  overview: "Overview",
  projects: "Projects",
  resources: "Resources",
  media: "Media library",
  editors: "Team access",
  settings: "Settings",
};

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function App() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authError, setAuthError] = useState("");
  const [page, setPage] = useState<Page>("overview");
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [media, setMedia] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [help, setHelp] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const mediaById = useMemo(
    () => new Map((media ?? []).map((item) => [item.id, item])),
    [media],
  );

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        let loaded = await getCurrentPortalUser();
        if (AUTH_DISABLED && !loaded?.isEditor) {
          // Auth is temporarily disabled: sign in silently with the portal
          // service account so the dashboard opens directly.
          if (!SERVICE_EMAIL || !SERVICE_PASSWORD) {
            throw new Error(
              "Auth is disabled but the service account is not configured. Set VITE_PORTAL_SERVICE_EMAIL and VITE_PORTAL_SERVICE_PASSWORD in .env.local.",
            );
          }
          await signIn(SERVICE_EMAIL, SERVICE_PASSWORD);
          loaded = await getCurrentPortalUser();
        }
        if (active) setUser(loaded);
      } catch (error) {
        if (active && AUTH_DISABLED) setAuthError(errorMessage(error));
      } finally {
        if (active) setCheckingSession(false);
      }
    }
    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const reloadProjects = useCallback(async () => {
    setProjects(await listProjects());
  }, []);
  const reloadResources = useCallback(async () => {
    setResources(await listResources());
  }, []);
  const reloadMedia = useCallback(async () => {
    setMedia(await listMedia());
  }, []);

  useEffect(() => {
    if (!user?.isEditor) return;
    let active = true;
    Promise.all([listProjects(), listResources(), listMedia()])
      .then(([loadedProjects, loadedResources, loadedMedia]) => {
        if (!active) return;
        setProjects(loadedProjects);
        setResources(loadedResources);
        setMedia(loadedMedia);
      })
      .catch((error) => {
        if (active) setError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string) => {
    setToast(message);
  }, []);

  function go(next: Page) {
    setPage(next);
    setMobileNav(false);
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setProjects(null);
    setResources(null);
    setMedia(null);
    setPage("overview");
  }

  if (checkingSession) {
    return <div className="loading login-loading">Opening your workspace...</div>;
  }

  if (AUTH_DISABLED && (!user || !user.isEditor)) {
    return (
      <div className="login-shell">
        <main className="login-card">
          <div className="brand login-brand">
            <span className="brand-emblem">
              <Leaf size={25} strokeWidth={1.8} />
            </span>
            <span className="brand-name">
              STAWI<span>experiences</span>
            </span>
          </div>
          <h1>Unable to open the workspace.</h1>
          <p className="login-sub">
            {authError ||
              "The portal service account could not be loaded. Check the VITE_PORTAL_SERVICE_* values in .env.local."}
          </p>
          <button
            className="button primary login-submit"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </main>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSignedIn={setUser} />;
  }

  if (!user.isEditor) {
    return (
      <div className="login-shell">
        <main className="login-card">
          <div className="brand login-brand">
            <span className="brand-emblem">
              <Leaf size={25} strokeWidth={1.8} />
            </span>
            <span className="brand-name">
              STAWI<span>experiences</span>
            </span>
          </div>
          <h1>Almost there.</h1>
          <p className="login-sub">
            Your account ({user.email}) doesn't have editor access yet. Ask a Stawi
            administrator to add you from the Team access page, then sign in again.
          </p>
          <button className="button primary login-submit" onClick={() => void handleSignOut()}>
            <LogOut size={16} />
            Sign out
          </button>
        </main>
      </div>
    );
  }

  const loading = !projects || !resources || !media;
  const recentUpdates = [
    ...(projects ?? []).map((item) => ({
      id: `p-${item.id}`,
      title: item.published ? "Project live on the website" : "Project draft",
      detail: item.title,
      date: item.updated_at,
    })),
    ...(resources ?? []).map((item) => ({
      id: `r-${item.id}`,
      title: item.published ? "Resource live on the website" : "Resource draft",
      detail: item.title,
      date: item.updated_at,
    })),
    ...(media ?? []).slice(0, 10).map((item) => ({
      id: `m-${item.id}`,
      title: "Image in the media library",
      detail: item.title || item.object_key || "Image",
      date: item.updated_at,
    })),
  ]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 10);

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
              {next === "projects" && projects && (
                <span className="nav-count">{projects.length}</span>
              )}
            </button>
          ))}
          {user.isAdmin && (
            <button
              className={`nav-item ${page === "editors" ? "active" : ""}`}
              onClick={() => go("editors")}
              aria-current={page === "editors" ? "page" : undefined}
            >
              <Users size={19} />
              <span>Team access</span>
            </button>
          )}
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
            <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <span>
                {AUTH_DISABLED ? "Sign-in disabled" : user.isAdmin ? "Admin" : "Editor"}
              </span>
            </div>
            {!AUTH_DISABLED && (
              <button
                className="icon-button"
                aria-label="Sign out"
                title="Sign out"
                onClick={() => void handleSignOut()}
              >
                <LogOut size={16} />
              </button>
            )}
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
              aria-label="View recent updates"
            >
              <Bell size={19} />
              <span />
            </button>
            <div className="avatar small">{user.name.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>
        <main>
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
          {loading && !error && (
            <div className="loading">Opening your workspace...</div>
          )}
          {!loading && projects && resources && media && (
            <>
              {page === "overview" && (
                <OverviewPage
                  user={user}
                  website={WEBSITE}
                  projects={projects}
                  resources={resources}
                  media={media}
                  mediaById={mediaById}
                  onNavigate={(target: OverviewTarget) => go(target)}
                  onCreate={(target) =>
                    go(target === "project" ? "projects" : "resources")
                  }
                />
              )}
              {page === "projects" && (
                <ProjectsPage
                  projects={projects}
                  media={media}
                  mediaById={mediaById}
                  reloadProjects={reloadProjects}
                  notify={notify}
                />
              )}
              {page === "resources" && (
                <ResourcesPage
                  resources={resources}
                  media={media}
                  mediaById={mediaById}
                  reloadResources={reloadResources}
                  notify={notify}
                />
              )}
              {page === "media" && (
                <MediaPage
                  media={media}
                  reloadMedia={reloadMedia}
                  notify={notify}
                  onError={setError}
                />
              )}
              {page === "editors" && user.isAdmin && (
                <EditorsPage user={user} notify={notify} />
              )}
              {page === "settings" && (
                <SettingsPage
                  user={user}
                  website={WEBSITE}
                  projects={projects}
                  resources={resources}
                  media={media}
                  authDisabled={AUTH_DISABLED}
                  onSignOut={() => void handleSignOut()}
                />
              )}
            </>
          )}
          <footer className="page-footer">
            <span>
              Made for meaningful experiences.
              <span className="footer-flower">✳</span>
            </span>
            <span>
              <span className="small-dot" />
              Connected to InsForge
              <span className="footer-separator">/</span>
              {(projects ?? []).filter((item) => item.published).length} projects live
            </span>
          </footer>
        </main>
      </div>
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
      {help && (
        <Modal
          title="A home for your next great story"
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <p>Welcome to the Stawi content workspace.</p>
            <ol>
              <li>
                <strong>Projects.</strong> Showcase your work: add a title, story,
                cover image, and gallery, then publish when it's ready.
              </li>
              <li>
                <strong>Resources.</strong> Share guides, checklists, and templates
                with website visitors.
              </li>
              <li>
                <strong>Media library.</strong> Upload images once and reuse them
                anywhere. Add alt text so everyone can enjoy them.
              </li>
              <li>
                <strong>Publish with confidence.</strong> Drafts stay private;
                published items appear on the live website right away.
              </li>
            </ol>
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
        <Modal title="Recent updates" onClose={() => setNotifications(false)}>
          <div className="notification-list">
            {recentUpdates.length ? (
              recentUpdates.map((item) => (
                <div key={item.id}>
                  <span className="stat-icon orange">
                    <Clock3 size={17} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <small>{formatDate(item.date)}</small>
                  </div>
                </div>
              ))
            ) : (
              <p>
                <FileText size={15} /> No updates yet. Your next step will show up
                here.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
