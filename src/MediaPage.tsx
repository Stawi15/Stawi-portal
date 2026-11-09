import { useMemo, useRef, useState } from "react";
import { Copy, ImagePlus, Search, Trash2, Upload, X } from "lucide-react";
import { deleteMedia, updateMedia, uploadMedia } from "./api";
import { ConfirmDialog, ContentImage, Modal } from "./components";
import { formatDate, mediaLabel, type MediaAsset } from "./types";

const PAGE_SIZE = 48;
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function MediaPage({
  media,
  reloadMedia,
  notify,
  onError,
}: {
  media: MediaAsset[];
  reloadMedia: () => Promise<void>;
  notify: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState<MediaAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return media;
    return media.filter((item) =>
      `${item.title ?? ""} ${item.alt_text} ${item.object_key ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [media, query]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      let uploaded = 0;
      for (const file of Array.from(files)) {
        if (!ACCEPTED.includes(file.type))
          throw new Error(`${file.name}: choose a JPG, PNG, WebP, GIF, or SVG image.`);
        if (file.size > MAX_UPLOAD_BYTES)
          throw new Error(`${file.name}: images must be under 15 MB.`);
        await uploadMedia(file, "");
        uploaded += 1;
      }
      await reloadMedia();
      notify(
        `${uploaded} image${uploaded === 1 ? "" : "s"} uploaded. Add alt text so everyone can enjoy them.`,
      );
    } catch (error) {
      onError(errorMessage(error));
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setDeleteError("");
    try {
      await deleteMedia(deleting);
      await reloadMedia();
      notify("Image deleted from the library.");
      setDeleting(null);
      setSelected(null);
    } catch (error) {
      setDeleteError(errorMessage(error));
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
          <h1>Media library</h1>
          <p>Every image available to the Stawi website, stored in InsForge.</p>
        </div>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => uploadRef.current?.click()}
        >
          <Upload size={17} />
          {busy ? "Uploading..." : "Upload images"}
        </button>
      </div>
      <section className="panel media-panel">
        <div className="panel-header">
          <div>
            <h2>
              Your visual library
              <span className="count-badge">{media.length}</span>
            </h2>
            <p>JPG, PNG, WebP, GIF, or SVG. Up to 15 MB per image.</p>
          </div>
          <div className="search-input">
            <Search size={16} />
            <input
              aria-label="Search media"
              placeholder="Find an image..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShown(PAGE_SIZE);
              }}
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
        </div>
        <div className="media-grid">
          {filtered.slice(0, shown).map((item) => (
            <article className="media-card" key={item.id}>
              <button
                className="media-open"
                onClick={() => setSelected(item)}
                aria-label={`Open details for ${mediaLabel(item)}`}
              >
                <ContentImage src={item.url} alt={item.alt_text || mediaLabel(item)} />
              </button>
              <div>
                <strong title={mediaLabel(item)}>{mediaLabel(item)}</strong>
                <span>{formatDate(item.created_at)}</span>
                <button
                  className="icon-button"
                  onClick={() => {
                    setDeleteError("");
                    setDeleting(item);
                  }}
                  aria-label={`Delete ${mediaLabel(item)}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
          <button
            className="upload-card"
            disabled={busy}
            onClick={() => uploadRef.current?.click()}
          >
            <ImagePlus size={30} />
            <strong>Add to your library</strong>
            <span>Upload your next great visual</span>
            <span className="button secondary">
              <Upload size={15} />
              Choose images
            </span>
          </button>
        </div>
        {!filtered.length && query && (
          <p className="empty-state">No images match your search.</p>
        )}
        {filtered.length > shown && (
          <div className="table-footer">
            <span>
              Showing {Math.min(shown, filtered.length)} of {filtered.length} images
            </span>
            <button
              className="button secondary"
              onClick={() => setShown(shown + PAGE_SIZE)}
            >
              Show more
            </button>
          </div>
        )}
      </section>
      <input
        type="file"
        ref={uploadRef}
        accept={ACCEPTED.join(",")}
        multiple
        hidden
        onChange={(e) => void upload(e.target.files)}
      />
      {selected && (
        <MediaDetail
          media={selected}
          onClose={() => setSelected(null)}
          onDelete={() => {
            setDeleteError("");
            setDeleting(selected);
          }}
          onSaved={async (message) => {
            await reloadMedia();
            notify(message);
            setSelected(null);
          }}
          notify={notify}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this image?"
          message={`“${mediaLabel(deleting)}” will be removed from the library and from storage. Images still used by projects or resources cannot be deleted.`}
          confirmLabel="Delete image"
          busy={busy}
          error={deleteError}
          onCancel={() => {
            setDeleting(null);
            setDeleteError("");
          }}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </>
  );
}

function MediaDetail({
  media,
  onClose,
  onDelete,
  onSaved,
  notify,
}: {
  media: MediaAsset;
  onClose: () => void;
  onDelete: () => void;
  onSaved: (message: string) => Promise<void>;
  notify: (message: string) => void;
}) {
  const [title, setTitle] = useState(media.title ?? "");
  const [altText, setAltText] = useState(media.alt_text);
  const [description, setDescription] = useState(media.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateMedia(media.id, {
        alt_text: altText.trim(),
        title: title.trim() || null,
        description: description.trim() || null,
      });
      await onSaved("Image details saved.");
    } catch (error) {
      setError(errorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Modal title="Image details" onClose={onClose} wide>
      <div className="media-detail">
        <ContentImage
          src={media.url}
          alt={media.alt_text || mediaLabel(media)}
          className="media-detail-image"
        />
        <form onSubmit={submit} className="editor">
          <label>
            Name
            <input
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A friendly name for this image"
            />
          </label>
          <label>
            Alt text (describes the image for screen readers)
            <input
              value={altText}
              maxLength={300}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g. Delegates networking at the PPP Symposium"
            />
          </label>
          <label>
            Description
            <textarea
              rows={2}
              maxLength={600}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional internal notes"
            />
          </label>
          <div className="media-meta">
            {media.width && media.height && (
              <span>
                {media.width} × {media.height}px
              </span>
            )}
            {media.mime_type && <span>{media.mime_type}</span>}
            <span>Added {formatDate(media.created_at)}</span>
          </div>
          {media.url && (
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                void navigator.clipboard.writeText(media.url ?? "");
                notify("Image link copied to your clipboard.");
              }}
            >
              <Copy size={15} />
              Copy image link
            </button>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="button danger-outline"
              onClick={onDelete}
              disabled={saving}
            >
              <Trash2 size={15} />
              Delete
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? "Saving..." : "Save details"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
