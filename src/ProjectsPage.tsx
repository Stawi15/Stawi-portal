import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import {
  createProject,
  deleteProject,
  listGallery,
  saveGallery,
  setProjectPublished,
  updateProject,
} from "./api";
import {
  ConfirmDialog,
  ContentImage,
  MediaPicker,
  MediaThumb,
  Modal,
  StatusBadge,
  TagInput,
} from "./components";
import {
  formatDate,
  joinParagraphs,
  mediaLabel,
  slugify,
  splitParagraphs,
  type MediaAsset,
  type Project,
  type ProjectDraft,
} from "./types";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function ProjectsPage({
  projects,
  media,
  mediaById,
  reloadProjects,
  notify,
}: {
  projects: Project[];
  media: MediaAsset[];
  mediaById: Map<string, MediaAsset>;
  reloadProjects: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [editing, setEditing] = useState<{ project?: Project } | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = projects.filter(
    (project) =>
      (status === "All statuses" ||
        (status === "Published" ? project.published : !project.published)) &&
      `${project.title} ${project.client_label ?? ""} ${project.categories.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  async function togglePublished(project: Project) {
    try {
      await setProjectPublished(project, !project.published);
      await reloadProjects();
      notify(
        project.published
          ? `“${project.title}” is now a draft and hidden from the website.`
          : `“${project.title}” is now live on the website.`,
      );
    } catch (error) {
      notify(errorMessage(error));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await deleteProject(deleting.id);
      await reloadProjects();
      notify(`“${deleting.title}” was deleted.`);
      setDeleting(null);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span />
            STAWI CONTENT HUB
          </div>
          <h1>Projects</h1>
          <p>The experiences shown on the Stawi website's work section.</p>
        </div>
        <button className="button primary" onClick={() => setEditing({})}>
          <Plus size={18} />
          New project
        </button>
      </div>
      <section className="panel content-panel">
        <div className="panel-header">
          <div>
            <h2>
              Your projects
              <span className="count-badge">{projects.length}</span>
            </h2>
            <p>Published projects appear on the live website immediately.</p>
          </div>
        </div>
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={16} />
            <input
              aria-label="Search projects"
              placeholder="Search projects..."
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
              aria-label="Filter projects by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>All statuses</option>
              <option>Published</option>
              <option>Draft</option>
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PROJECT</th>
                <th>STATUS</th>
                <th>UPDATED</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id}>
                  <td>
                    <button
                      className="content-title"
                      onClick={() => setEditing({ project })}
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
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button row-edit"
                        aria-label={`Edit ${project.title}`}
                        onClick={() => setEditing({ project })}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button row-edit"
                        aria-label={
                          project.published
                            ? `Unpublish ${project.title}`
                            : `Publish ${project.title}`
                        }
                        title={project.published ? "Unpublish" : "Publish"}
                        onClick={() => void togglePublished(project)}
                      >
                        {project.published ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        className="icon-button row-edit"
                        aria-label={`Delete ${project.title}`}
                        title="Delete"
                        onClick={() => setDeleting(project)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <FileText size={30} />
            <h3>
              {query || status !== "All statuses"
                ? "No matching projects"
                : "No projects yet"}
            </h3>
            <p>
              {query || status !== "All statuses"
                ? "Try a different search or status filter."
                : "Create your first project to showcase your work."}
            </p>
          </div>
        )}
        <div className="table-footer">
          <span>
            Showing {filtered.length} of {projects.length} projects
          </span>
          <span>
            <span className="small-dot" />
            Live backend
          </span>
        </div>
      </section>
      {editing && (
        <ProjectEditor
          project={editing.project}
          projects={projects}
          media={media}
          mediaById={mediaById}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            await reloadProjects();
            notify(message);
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this project?"
          message={`“${deleting.title}” and its gallery links will be permanently removed from the website and database. This cannot be undone.`}
          confirmLabel="Delete project"
          busy={busy}
          error={error}
          onCancel={() => {
            setDeleting(null);
            setError("");
          }}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </>
  );
}

export function ProjectEditor({
  project,
  projects,
  media,
  mediaById,
  onClose,
  onSaved,
}: {
  project?: Project;
  projects: Project[];
  media: MediaAsset[];
  mediaById: Map<string, MediaAsset>;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [clientLabel, setClientLabel] = useState(project?.client_label ?? "");
  const [yearLabel, setYearLabel] = useState(project?.year_label ?? "");
  const [services, setServices] = useState<string[]>(project?.services ?? []);
  const [categories, setCategories] = useState<string[]>(project?.categories ?? []);
  const [intro, setIntro] = useState(project?.intro ?? "");
  const [storyTitle, setStoryTitle] = useState(project?.story_title ?? "");
  const [detailTitle, setDetailTitle] = useState(project?.detail_title ?? "");
  const [body, setBody] = useState(joinParagraphs(project?.body_paragraphs ?? []));
  const [heroMediaId, setHeroMediaId] = useState<string | null>(
    project?.hero_media_id ?? null,
  );
  const [seoTitle, setSeoTitle] = useState(project?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(project?.seo_description ?? "");
  const [sortOrder, setSortOrder] = useState(
    project?.sort_order ?? (projects.length ? Math.max(...projects.map((p) => p.sort_order)) + 1 : 1),
  );
  const [published, setPublished] = useState(project?.published ?? false);
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(!project);
  const [picker, setPicker] = useState<"hero" | "gallery" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const serviceSuggestions = useMemo(
    () => [...new Set(projects.flatMap((p) => p.services))].sort(),
    [projects],
  );
  const categorySuggestions = useMemo(
    () => [...new Set(projects.flatMap((p) => p.categories))].sort(),
    [projects],
  );

  useEffect(() => {
    if (!project) return;
    let active = true;
    listGallery(project.id)
      .then((items) => {
        if (!active) return;
        setGallery(items.map((item) => item.media_id));
        setGalleryLoaded(true);
      })
      .catch((error) => {
        if (!active) return;
        setError(errorMessage(error));
        setGalleryLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [project]);

  function moveGalleryItem(index: number, direction: -1 | 1) {
    const next = [...gallery];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setGallery(next);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const trimmedTitle = title.trim();
    const finalSlug = slugify(slug.trim() || trimmedTitle);
    if (!trimmedTitle) {
      setError("Give the project a title.");
      return;
    }
    if (!finalSlug) {
      setError("The web address (slug) cannot be empty.");
      return;
    }
    if (
      projects.some(
        (other) => other.slug === finalSlug && other.id !== project?.id,
      )
    ) {
      setError("Another project already uses that web address. Choose a different slug.");
      return;
    }
    const draft: ProjectDraft = {
      slug: finalSlug,
      title: trimmedTitle,
      client_label: clientLabel.trim() || null,
      year_label: yearLabel.trim() || null,
      services,
      categories,
      intro: intro.trim() || null,
      story_title: storyTitle.trim() || null,
      detail_title: detailTitle.trim() || null,
      body_paragraphs: splitParagraphs(body),
      hero_media_id: heroMediaId,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      published,
    };
    setSaving(true);
    try {
      const saved = project
        ? await updateProject(project.id, draft, project.published)
        : await createProject(draft);
      await saveGallery(saved.id, gallery);
      await onSaved(
        project ? `“${saved.title}” was saved.` : `“${saved.title}” was created.`,
      );
    } catch (error) {
      setError(errorMessage(error));
      setSaving(false);
    }
  }

  const hero = heroMediaId ? mediaById.get(heroMediaId) : undefined;

  return (
    <Modal
      title={project ? "Edit project" : "New project"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="editor">
        <p className="muted">
          This is what visitors see in the work section of the Stawi website.
        </p>
        <div className="form-row">
          <label>
            Title
            <input
              required
              maxLength={160}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="Name of the experience"
            />
          </label>
          <label>
            Web address (slug)
            <input
              value={slug}
              maxLength={80}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="auto-generated-from-title"
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Client
            <input
              value={clientLabel}
              maxLength={160}
              onChange={(e) => setClientLabel(e.target.value)}
              placeholder="e.g. Cipla"
            />
          </label>
          <label>
            When
            <input
              value={yearLabel}
              maxLength={40}
              onChange={(e) => setYearLabel(e.target.value)}
              placeholder="e.g. May 2026"
            />
          </label>
        </div>
        <TagInput
          label="Services"
          values={services}
          onChange={setServices}
          suggestions={serviceSuggestions}
          placeholder="Add a service and press Enter"
        />
        <TagInput
          label="Categories"
          values={categories}
          onChange={setCategories}
          suggestions={categorySuggestions}
          placeholder="Add a category and press Enter"
        />
        <label>
          Intro line
          <input
            value={intro}
            maxLength={300}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="One line that captures the project"
          />
        </label>
        <div className="form-row">
          <label>
            Story heading
            <input
              value={storyTitle}
              maxLength={200}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="Headline above the story"
            />
          </label>
          <label>
            Detail page heading
            <input
              value={detailTitle}
              maxLength={200}
              onChange={(e) => setDetailTitle(e.target.value)}
              placeholder="Optional alternative heading"
            />
          </label>
        </div>
        <label>
          The story
          <textarea
            rows={8}
            maxLength={20000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Tell the story behind the experience...\n\nSeparate paragraphs with a blank line."}
          />
        </label>
        <div className="hero-field">
          <span className="tag-field-label">Cover image</span>
          <div className="hero-row">
            <ContentImage
              src={hero?.url}
              alt={hero ? hero.alt_text || mediaLabel(hero) : "No cover image selected"}
              className="editor-image"
            />
            <div className="hero-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setPicker("hero")}
              >
                <ImagePlus size={15} />
                {hero ? "Change image" : "Choose image"}
              </button>
              {hero && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setHeroMediaId(null)}
                >
                  <X size={15} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="gallery-field">
          <span className="tag-field-label">
            Gallery ({gallery.length} image{gallery.length === 1 ? "" : "s"})
          </span>
          {!galleryLoaded ? (
            <p className="muted">Loading gallery...</p>
          ) : (
            <div className="gallery-list">
              {gallery.map((mediaId, index) => {
                const item = mediaById.get(mediaId);
                return (
                  <div className="gallery-item" key={mediaId}>
                    <ContentImage
                      src={item?.url}
                      alt={item ? item.alt_text || mediaLabel(item) : "Image"}
                    />
                    <span className="gallery-name">
                      {item ? mediaLabel(item) : "Missing image"}
                    </span>
                    <span className="gallery-tools">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Move image earlier"
                        disabled={index === 0}
                        onClick={() => moveGalleryItem(index, -1)}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Move image later"
                        disabled={index === gallery.length - 1}
                        onClick={() => moveGalleryItem(index, 1)}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Remove image from gallery"
                        onClick={() =>
                          setGallery(gallery.filter((id) => id !== mediaId))
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                );
              })}
              <button
                type="button"
                className="button secondary"
                onClick={() => setPicker("gallery")}
              >
                <ImagePlus size={15} />
                Add images
              </button>
            </div>
          )}
        </div>
        <div className="form-row">
          <label>
            SEO title
            <input
              value={seoTitle}
              maxLength={200}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Title shown in search results"
            />
          </label>
          <label>
            Display order
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              min={0}
            />
          </label>
        </div>
        <label>
          SEO description
          <textarea
            rows={2}
            maxLength={400}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="Short summary shown in search results"
          />
        </label>
        <label className="publish-toggle">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published — visible on the live website
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? "Saving..." : project ? "Save project" : "Create project"}
          </button>
        </div>
      </form>
      {picker === "hero" && (
        <MediaPicker
          media={media}
          onClose={() => setPicker(null)}
          onSelect={(ids) => {
            setHeroMediaId(ids[0] ?? null);
            setPicker(null);
          }}
        />
      )}
      {picker === "gallery" && (
        <MediaPicker
          media={media}
          multiple
          selectedIds={gallery}
          onClose={() => setPicker(null)}
          onSelect={(ids) => {
            setGallery(ids);
            setPicker(null);
          }}
        />
      )}
    </Modal>
  );
}
