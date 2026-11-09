import { useState } from "react";
import {
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createResource,
  deleteResource,
  updateResource,
} from "./api";
import {
  ConfirmDialog,
  ContentImage,
  MediaPicker,
  MediaThumb,
  Modal,
  StatusBadge,
} from "./components";
import {
  formatDate,
  mediaLabel,
  type MediaAsset,
  type Resource,
  type ResourceDraft,
} from "./types";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function ResourcesPage({
  resources,
  media,
  mediaById,
  reloadResources,
  notify,
}: {
  resources: Resource[];
  media: MediaAsset[];
  mediaById: Map<string, MediaAsset>;
  reloadResources: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [editing, setEditing] = useState<{ resource?: Resource } | null>(null);
  const [deleting, setDeleting] = useState<Resource | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function togglePublished(resource: Resource) {
    try {
      await updateResource(resource.id, {
        title: resource.title,
        description: resource.description,
        meta_label: resource.meta_label,
        audience: resource.audience,
        href: resource.href,
        media_id: resource.media_id,
        sort_order: resource.sort_order,
        published: !resource.published,
      });
      await reloadResources();
      notify(
        resource.published
          ? `“${resource.title}” is now hidden from the website.`
          : `“${resource.title}” is now live on the website.`,
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
      await deleteResource(deleting.id);
      await reloadResources();
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
          <h1>Resources</h1>
          <p>Guides, tools, and templates offered on the Stawi website.</p>
        </div>
        <button className="button primary" onClick={() => setEditing({})}>
          <Plus size={18} />
          New resource
        </button>
      </div>
      <section className="panel content-panel">
        <div className="panel-header">
          <div>
            <h2>
              Your resources
              <span className="count-badge">{resources.length}</span>
            </h2>
            <p>Shown in the order below. Published resources appear on the website.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>RESOURCE</th>
                <th>AUDIENCE</th>
                <th>STATUS</th>
                <th>UPDATED</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <button
                      className="content-title"
                      onClick={() => setEditing({ resource })}
                    >
                      <MediaThumb
                        mediaById={mediaById}
                        mediaId={resource.media_id}
                        alt=""
                      />
                      <span>
                        <strong>{resource.title}</strong>
                        <small>{resource.meta_label || "Resource"}</small>
                      </span>
                    </button>
                  </td>
                  <td className="date-cell">{resource.audience || "—"}</td>
                  <td>
                    <StatusBadge published={resource.published} />
                  </td>
                  <td className="date-cell">{formatDate(resource.updated_at)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button row-edit"
                        aria-label={`Edit ${resource.title}`}
                        onClick={() => setEditing({ resource })}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button row-edit"
                        aria-label={
                          resource.published
                            ? `Unpublish ${resource.title}`
                            : `Publish ${resource.title}`
                        }
                        title={resource.published ? "Unpublish" : "Publish"}
                        onClick={() => void togglePublished(resource)}
                      >
                        {resource.published ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        className="icon-button row-edit"
                        aria-label={`Delete ${resource.title}`}
                        title="Delete"
                        onClick={() => setDeleting(resource)}
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
        {resources.length === 0 && (
          <div className="empty-state">
            <FileText size={30} />
            <h3>No resources yet</h3>
            <p>Add a guide, checklist, or template to share with visitors.</p>
          </div>
        )}
      </section>
      {editing && (
        <ResourceEditor
          resource={editing.resource}
          resources={resources}
          media={media}
          mediaById={mediaById}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            await reloadResources();
            notify(message);
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this resource?"
          message={`“${deleting.title}” will be permanently removed from the website and database. This cannot be undone.`}
          confirmLabel="Delete resource"
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

function ResourceEditor({
  resource,
  resources,
  media,
  mediaById,
  onClose,
  onSaved,
}: {
  resource?: Resource;
  resources: Resource[];
  media: MediaAsset[];
  mediaById: Map<string, MediaAsset>;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(resource?.title ?? "");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [metaLabel, setMetaLabel] = useState(resource?.meta_label ?? "");
  const [audience, setAudience] = useState(resource?.audience ?? "");
  const [href, setHref] = useState(resource?.href ?? "");
  const [mediaId, setMediaId] = useState<string | null>(resource?.media_id ?? null);
  const [sortOrder, setSortOrder] = useState(
    resource?.sort_order ??
      (resources.length ? Math.max(...resources.map((r) => r.sort_order)) + 1 : 1),
  );
  const [published, setPublished] = useState(resource?.published ?? false);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Give the resource a title.");
      return;
    }
    const draft: ResourceDraft = {
      title: title.trim(),
      description: description.trim() || null,
      meta_label: metaLabel.trim() || null,
      audience: audience.trim() || null,
      href: href.trim() || null,
      media_id: mediaId,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      published,
    };
    setSaving(true);
    try {
      const saved = resource
        ? await updateResource(resource.id, draft)
        : await createResource(draft);
      await onSaved(
        resource ? `“${saved.title}” was saved.` : `“${saved.title}” was created.`,
      );
    } catch (error) {
      setError(errorMessage(error));
      setSaving(false);
    }
  }

  const image = mediaId ? mediaById.get(mediaId) : undefined;

  return (
    <Modal
      title={resource ? "Edit resource" : "New resource"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="editor">
        <p className="muted">
          Resources appear as cards on the Stawi website's resources section.
        </p>
        <label>
          Title
          <input
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Event Brief Template"
          />
        </label>
        <label>
          Description
          <textarea
            rows={3}
            maxLength={600}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A sentence about what this resource helps with"
          />
        </label>
        <div className="form-row">
          <label>
            Label
            <input
              value={metaLabel}
              maxLength={80}
              onChange={(e) => setMetaLabel(e.target.value)}
              placeholder="e.g. Practical guide"
            />
          </label>
          <label>
            Audience
            <input
              value={audience}
              maxLength={160}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. For leaders & comms leads"
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Link (button destination)
            <input
              value={href}
              maxLength={300}
              onChange={(e) => setHref(e.target.value)}
              placeholder="/contact-us/ or https://..."
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
        <div className="hero-field">
          <span className="tag-field-label">Image (optional)</span>
          <div className="hero-row">
            <ContentImage
              src={image?.url}
              alt={image ? image.alt_text || mediaLabel(image) : "No image selected"}
              className="editor-image"
            />
            <div className="hero-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setPicker(true)}
              >
                <ImagePlus size={15} />
                {image ? "Change image" : "Choose image"}
              </button>
              {image && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setMediaId(null)}
                >
                  <X size={15} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
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
            {saving ? "Saving..." : resource ? "Save resource" : "Create resource"}
          </button>
        </div>
      </form>
      {picker && (
        <MediaPicker
          media={media}
          onClose={() => setPicker(false)}
          onSelect={(ids) => {
            setMediaId(ids[0] ?? null);
            setPicker(false);
          }}
        />
      )}
    </Modal>
  );
}
