import { useEffect, useState } from "react";
import { ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { addEditorByEmail, listEditors, removeEditor } from "./api";
import { ConfirmDialog } from "./components";
import { formatDate, type CmsEditor, type PortalUser } from "./types";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function EditorsPage({
  user,
  notify,
}: {
  user: PortalUser;
  notify: (message: string) => void;
}) {
  const [editors, setEditors] = useState<CmsEditor[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "admin">("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<CmsEditor | null>(null);
  const [removeError, setRemoveError] = useState("");

  async function reload() {
    try {
      setEditors(await listEditors());
    } catch (error) {
      setError(errorMessage(error));
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addEditorByEmail(email.trim(), role);
      await reload();
      notify(`${email.trim()} can now ${role === "admin" ? "manage content and editors" : "manage content"}.`);
      setEmail("");
      setRole("editor");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    setBusy(true);
    setRemoveError("");
    try {
      await removeEditor(removing.user_id);
      await reload();
      notify(`${removing.email} no longer has editor access.`);
      setRemoving(null);
    } catch (error) {
      setRemoveError(errorMessage(error));
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
          <h1>Team access</h1>
          <p>Choose who can manage the content on the Stawi website.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel settings-panel">
          <span className="stat-icon orange">
            <UserPlus size={21} />
          </span>
          <h2>Invite an editor</h2>
          <p>
            They need to create an account on the portal sign-in page first. Then add
            their email here to grant access.
          </p>
          <form onSubmit={add} className="editor">
            <label>
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@stawiexperiences.com"
              />
            </label>
            <label>
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "admin")}
              >
                <option value="editor">Editor — manage content</option>
                <option value="admin">Admin — manage content and team access</option>
              </select>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button className="button primary" type="submit" disabled={busy}>
                {busy ? "Working..." : "Grant access"}
              </button>
            </div>
          </form>
        </section>
        <section className="panel settings-panel">
          <span className="stat-icon blue">
            <Users size={21} />
          </span>
          <h2>Current team</h2>
          <p>Everyone who can sign in and manage website content.</p>
          {!editors ? (
            <p className="muted">Loading team...</p>
          ) : editors.length === 0 ? (
            <p className="muted">
              No editors have been added yet. Project admins always have access.
            </p>
          ) : (
            <div className="editor-list">
              {editors.map((editor) => (
                <div className="editor-row" key={editor.user_id}>
                  <div className="avatar small">
                    {(editor.display_name || editor.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{editor.display_name || editor.email}</strong>
                    <span>
                      {editor.email} · Added {formatDate(editor.created_at)}
                    </span>
                  </div>
                  <span className={`demo-pill ${editor.role === "admin" ? "pill-admin" : ""}`}>
                    {editor.role === "admin" ? (
                      <>
                        <ShieldCheck size={13} /> Admin
                      </>
                    ) : (
                      "Editor"
                    )}
                  </span>
                  {editor.user_id !== user.id && (
                    <button
                      className="icon-button"
                      aria-label={`Remove access for ${editor.email}`}
                      onClick={() => {
                        setRemoveError("");
                        setRemoving(editor);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {removing && (
        <ConfirmDialog
          title="Remove editor access?"
          message={`${removing.email} will no longer be able to manage website content. Their account is kept and access can be granted again later.`}
          confirmLabel="Remove access"
          busy={busy}
          error={removeError}
          onCancel={() => {
            setRemoving(null);
            setRemoveError("");
          }}
          onConfirm={() => void confirmRemove()}
        />
      )}
    </>
  );
}
