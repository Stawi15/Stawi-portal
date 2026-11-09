import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  FileText,
  FolderKanban,
  Globe,
  Images,
  LibraryBig,
} from "lucide-react";
import { MediaThumb, StatusBadge } from "./components";
import {
  formatDate,
  type MediaAsset,
  type PortalUser,
  type Project,
  type Resource,
} from "./types";

export type OverviewTarget = "projects" | "resources" | "media";

export function OverviewPage({
  user,
  website,
  projects,
  resources,
  media,
  mediaById,
  onNavigate,
  onCreate,
}: {
  user: PortalUser;
  website: string;
  projects: Project[];
  resources: Resource[];
  media: MediaAsset[];
  mediaById: Map<string, MediaAsset>;
  onNavigate: (target: OverviewTarget) => void;
  onCreate: (target: "project" | "resource") => void;
}) {
  const publishedProjects = projects.filter((p) => p.published).length;
  const publishedResources = resources.filter((r) => r.published).length;
  const drafts = projects.filter((p) => !p.published);
  const recent = [...projects]
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, 5);
  const recentActivity = [
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      title: p.published ? "Project live on the website" : "Project draft updated",
      detail: p.title,
      date: p.updated_at,
    })),
    ...resources.map((r) => ({
      id: `resource-${r.id}`,
      title: r.published ? "Resource live on the website" : "Resource draft updated",
      detail: r.title,
      date: r.updated_at,
    })),
  ]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 3);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span />
            STAWI CONTENT HUB
          </div>
          <h1>A little overview. A lot of possibility.</h1>
          <p>
            Welcome back, {user.name}. Here's what's live on the Stawi website today.
          </p>
        </div>
      </div>
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
            <br className="desktop-break" /> Let's keep the Stawi website fresh,
            together.
          </p>
          <button onClick={() => onCreate("project")}>
            Create your next project
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
          <span className="art-caption">a little spark. a lasting impact.</span>
        </div>
      </section>
      <section className="stat-grid" aria-label="Content overview">
        <button className="stat-card" onClick={() => onNavigate("projects")}>
          <div className="stat-card-top">
            <span className="stat-icon blue">
              <FolderKanban size={19} />
            </span>
            <ArrowUpRight size={16} className="stat-arrow" />
          </div>
          <span className="stat-label">Projects</span>
          <div className="stat-value">
            {projects.length}
            <span>{publishedProjects} published</span>
          </div>
          <p>Experiences brought to life</p>
        </button>
        <button className="stat-card" onClick={() => onNavigate("resources")}>
          <div className="stat-card-top">
            <span className="stat-icon orange">
              <LibraryBig size={19} />
            </span>
            <ArrowUpRight size={16} className="stat-arrow" />
          </div>
          <span className="stat-label">Resources</span>
          <div className="stat-value">
            {resources.length}
            <span>{publishedResources} published</span>
          </div>
          <p>Guides and tools to share</p>
        </button>
        <button className="stat-card" onClick={() => onNavigate("media")}>
          <div className="stat-card-top">
            <span className="stat-icon green">
              <Images size={19} />
            </span>
            <ArrowUpRight size={16} className="stat-arrow" />
          </div>
          <span className="stat-label">Media assets</span>
          <div className="stat-value">
            {media.length}
            <span>in your library</span>
          </div>
          <p>The visuals behind it all</p>
        </button>
        <a className="stat-card" href={website} target="_blank" rel="noreferrer">
          <div className="stat-card-top">
            <span className="stat-icon purple">
              <Globe size={19} />
            </span>
            <ArrowUpRight size={16} className="stat-arrow" />
          </div>
          <span className="stat-label">Live website</span>
          <div className="stat-value">
            {publishedProjects + publishedResources}
            <span>items live right now</span>
          </div>
          <p>See your stories out in the world</p>
        </a>
      </section>
      <div className="overview-bottom">
        <section className="panel content-panel">
          <div className="panel-header">
            <div>
              <h2>
                Recently updated projects
                <span className="count-badge">{projects.length}</span>
              </h2>
              <p>The latest from your content workspace.</p>
            </div>
            <button className="text-button" onClick={() => onNavigate("projects")}>
              View all projects
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>PROJECT</th>
                  <th>STATUS</th>
                  <th>UPDATED</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <button
                        className="content-title"
                        onClick={() => onNavigate("projects")}
                      >
                        <MediaThumb
                          mediaById={mediaById}
                          mediaId={project.hero_media_id}
                          alt=""
                        />
                        <span>
                          <strong>{project.title}</strong>
                          <small>
                            {project.client_label || "No client"}
                            <span>·</span>
                            {project.year_label || "No date"}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <StatusBadge published={project.published} />
                    </td>
                    <td className="date-cell">{formatDate(project.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recent.length === 0 && (
            <div className="empty-state">
              <FileText size={30} />
              <h3>A blank page. A fresh start.</h3>
              <p>Create your first project to get started.</p>
            </div>
          )}
        </section>
        <section className="panel activity-panel">
          <div className="panel-header">
            <div>
              <h2>Recent activity</h2>
              <p>A little progress, every day.</p>
            </div>
            <Clock3 size={17} className="muted" />
          </div>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div className="activity-item" key={activity.id}>
                <div
                  className={`activity-icon ${index === 0 ? "orange" : index === 1 ? "blue" : "purple"}`}
                >
                  <FileText size={15} />
                </div>
                <div>
                  <strong>{activity.title}</strong>
                  <p>{activity.detail}</p>
                  <span>{formatDate(activity.date)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="draft-reminder">
            <div>
              <span className="draft-icon">
                <FileText size={16} />
              </span>
              <strong>A few ideas in the making</strong>
            </div>
            <p>
              You have {drafts.length} draft project
              {drafts.length === 1 ? "" : "s"} waiting for their moment.
            </p>
            <button onClick={() => onNavigate("projects")} disabled={!drafts.length}>
              Pick up where you left off
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
