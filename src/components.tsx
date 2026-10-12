import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, ImagePlus, ArrowUpRight, CalendarDays } from "lucide-react";
import {
  categories,
  isImageUrl,
  typeLabels,
  type ContentItem,
  type ContentType,
  type ContentStatus,
  type MediaItem,
} from "./data";

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const focused = document.activeElement;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (focused instanceof HTMLElement) focused.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      aria-labelledby="modal-title"
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      <span />
      {status}
    </span>
  );
}

export function ContentImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={`image-placeholder ${className}`}
      role="img"
      aria-label={`${alt} (image unavailable)`}
    >
      <ImagePlus size={24} />
    </div>
  );
}

export function ContentEditor({
  item,
  initialType,
  media,
  onClose,
  onSave,
}: {
  item?: ContentItem;
  initialType: ContentType;
  media: MediaItem[];
  onClose: () => void;
  onSave: (item: ContentItem) => Promise<void>;
}) {
  const [type, setType] = useState(item?.type ?? initialType);
  const [title, setTitle] = useState(item?.title ?? "");
  const [category, setCategory] = useState(
    item?.category ?? categories[initialType][0],
  );
  const [description, setDescription] = useState(item?.description ?? "");
  const [image, setImage] = useState(item?.image ?? "");
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "Draft");
  const [publishAt, setPublishAt] = useState(item?.publishAt ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!title.trim() || !description.trim()) {
      setError("Please enter a title and content.");
      return;
    }
    if (image && !isImageUrl(image)) {
      setError("Use an HTTP(S) image URL or an image from the media library.");
      return;
    }
    if (
      status === "Scheduled" &&
      (!publishAt || new Date(publishAt).getTime() <= Date.now())
    ) {
      setError("Choose a future publication date.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        id: item?.id ?? crypto.randomUUID(),
        type,
        title: title.trim(),
        category,
        description: description.trim(),
        image,
        status,
        publishAt: status === "Scheduled" ? publishAt : "",
        updatedAt: new Date().toISOString(),
        author: item?.author ?? "Stawi Team",
      });
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save content.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={item ? "Edit content" : "Create something meaningful"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="editor">
        <p className="muted">
          Give your next story, project, or product a home.
        </p>
        <div className="form-row">
          <label>
            Content type
            <select
              value={type}
              onChange={(e) => {
                const next = e.target.value as ContentType;
                setType(next);
                setCategory(categories[next][0]);
              }}
            >
              {Object.entries(typeLabels).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories[type].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Title
          <input
            required
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A great story starts with a great title"
          />
        </label>
        <label>
          Content / description
          <textarea
            required
            rows={6}
            maxLength={20000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell the story behind the experience..."
          />
        </label>
        <div className="form-row">
          <label>
            Cover image URL
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
            />
          </label>
          <label>
            Or choose from your library
            <select
              value={media.some((m) => m.url === image) ? image : ""}
              onChange={(e) => setImage(e.target.value)}
            >
              <option value="">Select an image</option>
              {media.map((m) => (
                <option key={m.id} value={m.url}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {image && (
          <ContentImage
            src={image}
            alt="Cover preview"
            className="editor-image"
          />
        )}
        <div className="form-row">
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
            >
              <option>Draft</option>
              <option>Published</option>
              <option>Scheduled</option>
            </select>
          </label>
          {status === "Scheduled" && (
            <label>
              Publish date & time
              <input
                required
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
              />
            </label>
          )}
        </div>
        <div className="local-notice">
          <CalendarDays size={16} /> Demo mode: publishing and scheduling update
          local content only.
        </div>
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
            {saving ? "Saving..." : "Save content"}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
