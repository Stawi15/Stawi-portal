import { useState } from "react";
import { ArrowRight, Leaf, MailCheck } from "lucide-react";
import { getCurrentPortalUser, signIn, signUp, verifyEmail } from "./api";
import type { PortalUser } from "./types";

type Mode = "sign-in" | "sign-up" | "verify";

export function LoginPage({
  onSignedIn,
}: {
  onSignedIn: (user: PortalUser) => void;
}) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function finishSignIn() {
    const user = await getCurrentPortalUser();
    if (!user) throw new Error("Signed in, but the session could not be loaded. Try again.");
    onSignedIn(user);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "sign-in") {
        await signIn(email.trim(), password);
        await finishSignIn();
      } else if (mode === "sign-up") {
        const result = await signUp(email.trim(), password, name.trim());
        if (result?.requireEmailVerification) {
          setMode("verify");
          setNotice(
            "We've emailed you a 6-digit verification code. Enter it below to finish creating your account.",
          );
        } else {
          await finishSignIn();
        }
      } else {
        await verifyEmail(email.trim(), code.trim());
        await finishSignIn();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

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
        <h1>
          {mode === "sign-in"
            ? "Welcome back."
            : mode === "sign-up"
              ? "Create your account."
              : "Check your inbox."}
        </h1>
        <p className="login-sub">
          {mode === "verify"
            ? `Enter the verification code we sent to ${email.trim()}.`
            : "Sign in to manage the content on the Stawi Experiences website."}
        </p>
        <form onSubmit={submit} className="login-form">
          {mode === "sign-up" && (
            <label>
              Your name
              <input
                required
                value={name}
                maxLength={80}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Mwangi"
              />
            </label>
          )}
          {mode !== "verify" && (
            <>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@stawiexperiences.com"
                />
              </label>
              <label>
                Password
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
              </label>
            </>
          )}
          {mode === "verify" && (
            <label>
              Verification code
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
            </label>
          )}
          {notice && (
            <p className="login-notice">
              <MailCheck size={15} />
              {notice}
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary login-submit" type="submit" disabled={busy}>
            {busy
              ? "One moment..."
              : mode === "sign-in"
                ? "Sign in"
                : mode === "sign-up"
                  ? "Create account"
                  : "Verify & continue"}
            <ArrowRight size={16} />
          </button>
        </form>
        {mode !== "verify" && (
          <button
            type="button"
            className="text-button login-switch"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError("");
              setNotice("");
            }}
          >
            {mode === "sign-in"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        )}
        {mode === "verify" && (
          <button
            type="button"
            className="text-button login-switch"
            onClick={() => {
              setMode("sign-in");
              setError("");
              setNotice("");
            }}
          >
            Back to sign in
          </button>
        )}
        <p className="login-footnote">
          Access to content editing is granted by a Stawi administrator after you create an
          account.
        </p>
      </main>
    </div>
  );
}
