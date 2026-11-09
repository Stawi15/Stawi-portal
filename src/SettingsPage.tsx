import {
  ArrowUpRight,
  Link2,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { BACKEND_URL, MEDIA_BUCKET } from "./insforge";
import type { MediaAsset, PortalUser, Project, Resource } from "./types";

export function SettingsPage({
  user,
  website,
  projects,
  resources,
  media,
  authDisabled,
  onSignOut,
}: {
  user: PortalUser;
  website: string;
  projects: Project[];
  resources: Resource[];
  media: MediaAsset[];
  authDisabled: boolean;
  onSignOut: () => void;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span />
            STAWI CONTENT HUB
          </div>
          <h1>Settings</h1>
          <p>Your workspace, your account, and how it all connects.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel settings-panel">
          <span className="stat-icon orange">
            <Link2 size={21} />
          </span>
          <h2>Content, connected.</h2>
          <p>
            This portal is connected to the Stawi InsForge backend. Everything you
            publish here appears on the live website.
          </p>
          <div className="setting-row">
            <span>Website</span>
            <a href={website} target="_blank" rel="noreferrer">
              {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="setting-row">
            <span>Backend</span>
            <strong>{BACKEND_URL.replace(/^https?:\/\//, "")}</strong>
          </div>
          <div className="setting-row">
            <span>Connection</span>
            <span className="status status-published">
              <span />
              Connected
            </span>
          </div>
          <div className="setting-row">
            <span>Media storage</span>
            <strong>{MEDIA_BUCKET}</strong>
          </div>
          <div className="setting-row">
            <span>Content</span>
            <strong>
              {projects.length} projects · {resources.length} resources ·{" "}
              {media.length} images
            </strong>
          </div>
        </section>
        <section className="panel settings-panel">
          <span className="stat-icon blue">
            <UserRound size={21} />
          </span>
          <h2>Your account</h2>
          <p>
            {authDisabled
              ? "Sign-in is temporarily disabled; the portal uses a shared workspace account."
              : "You're signed in to the Stawi content workspace."}
          </p>
          <div className="setting-row">
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>
          <div className="setting-row">
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div className="setting-row">
            <span>Access</span>
            <span className="demo-pill">
              {user.isAdmin ? (
                <>
                  <ShieldCheck size={13} /> Admin
                </>
              ) : (
                "Editor"
              )}
            </span>
          </div>
          {authDisabled ? (
            <div className="local-notice">
              <ShieldAlert size={18} />
              Sign-in is turned off (VITE_DISABLE_AUTH=true in .env.local). Anyone
              who can open this portal can edit website content. Set it to false
              to restore the sign-in screen.
            </div>
          ) : (
            <div className="settings-actions">
              <button className="button secondary" onClick={onSignOut}>
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
