import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { X, ImagePlus, Search, Check } from "lucide-react";
import { formatDate, mediaLabel, type MediaAsset } from "./types";

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

export function StatusBadge({ published }: { published: boolean }) {
  return (
    <span className={`status ${published ? "status-published" : "status-draft"}`}>
      <span />
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function ContentImage({
  src,
  alt,
  className = "",
}: {
  src: string | null | undefined;
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
      aria-label={alt ? `${alt} (image unavailable)` : "No image selected"}
    >
      <ImagePlus size={24} />
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="confirmation">
        <p>{message}</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="button secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button className="button danger" disabled={busy} onClick={onConfirm}>
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function TagInput({
  label,
  values,
  onChange,
  suggestions = [],
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const remaining = suggestions.filter((item) => !values.includes(item));

  function add(raw: string) {
    const value = raw.trim();
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
    setDraft("");
  }

  return (
    <div className="tag-field">
      <span className="tag-field-label">{label}</span>
      <div className="tag-list">
        {values.map((value) => (
          <span className="tag-chip" key={value}>
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((item) => item !== value))}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          placeholder={placeholder ?? "Type and press Enter"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          aria-label={`Add ${label.toLowerCase()}`}
        />
      </div>
      {remaining.length > 0 && (
        <div className="tag-suggestions">
          {remaining.map((item) => (
            <button type="button" key={item} onClick={() => add(item)}>
              + {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MediaPicker({
  media,
  selectedIds = [],
  multiple = false,
  onClose,
  onSelect,
}: {
  media: MediaAsset[];
  selectedIds?: string[];
  multiple?: boolean;
  onClose: () => void;
  onSelect: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>(selectedIds);
  const [shown, setShown] = useState(48);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return media;
    return media.filter((item) =>
      `${item.title ?? ""} ${item.alt_text} ${item.object_key ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [media, query]);

  function toggle(id: string) {
    if (!multiple) {
      onSelect([id]);
      return;
    }
    setPicked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <Modal
      title={multiple ? "Choose images" : "Choose an image"}
      onClose={onClose}
      wide
    >
      <div className="picker">
        <div className="search-input">
          <Search size={16} />
          <input
            aria-label="Search media"
            placeholder="Search by name, alt text, or file..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(48);
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
        <div className="picker-grid">
          {filtered.slice(0, shown).map((item) => {
            const selected = picked.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                className={`picker-item ${selected ? "is-selected" : ""}`}
                onClick={() => toggle(item.id)}
                aria-pressed={selected}
              >
                <ContentImage src={item.url} alt={item.alt_text || mediaLabel(item)} />
                {selected && (
                  <span className="picker-check">
                    <Check size={14} />
                  </span>
                )}
                <span className="picker-name" title={mediaLabel(item)}>
                  {mediaLabel(item)}
                </span>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="empty-state">No images match your search.</p>
        )}
        {filtered.length > shown && (
          <button
            type="button"
            className="button secondary picker-more"
            onClick={() => setShown(shown + 48)}
          >
            Show more ({filtered.length - shown} remaining)
          </button>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          {multiple && (
            <button
              type="button"
              className="button primary"
              onClick={() => onSelect(picked)}
            >
              Use {picked.length} image{picked.length === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function MediaThumb({
  mediaById,
  mediaId,
  alt,
  className = "",
}: {
  mediaById: Map<string, MediaAsset>;
  mediaId: string | null;
  alt: string;
  className?: string;
}) {
  const media = mediaId ? mediaById.get(mediaId) : undefined;
  return <ContentImage src={media?.url} alt={alt} className={className} />;
}

export function UpdatedCell({ value }: { value: string }) {
  return <td className="date-cell">{formatDate(value)}</td>;
}
