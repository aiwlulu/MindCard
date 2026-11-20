import React, { useContext, useState } from "react";
import { authContext } from "@/lib/store/auth-context";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "./Icons";

interface FormData {
  name: string;
  email: string;
  password: string;
}

const EMPTY_FORM: FormData = { name: "", email: "", password: "" };
const DEMO_FORM: FormData = {
  name: "",
  email: "demo@gmail.com",
  password: "123456",
};

function Authentication() {
  const {
    googleLoginHandler,
    registerWithEmailAndPassword,
    loginWithEmailAndPassword,
  } = useContext(authContext);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEMO_FORM);
  const [useDemoAccount, setUseDemoAccount] = useState(true);
  const [pending, setPending] = useState<"form" | "google" | null>(null);
  const [formError, setFormError] = useState("");

  const applyDemoAccount = (nextUseDemoAccount: boolean) => {
    setUseDemoAccount(nextUseDemoAccount);
    setFormData(nextUseDemoAccount ? DEMO_FORM : EMPTY_FORM);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const describeError = (code?: string) => {
    if (code === "auth/email-already-in-use") {
      return "That email already has an account. Sign in instead.";
    }
    if (code === "auth/invalid-login-credentials" || code === "auth/invalid-credential") {
      return "Incorrect email or password.";
    }
    if (code === "auth/network-request-failed") {
      return "No connection. Check your network and try again.";
    }
    if (code === "auth/too-many-requests") {
      return "Too many attempts. Wait a moment and try again.";
    }
    return "Something went wrong. Please try again.";
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const { name, email, password } = formData;
    setFormError("");
    setPending("form");
    const request = isRegistering
      ? registerWithEmailAndPassword(email, password, name)
      : loginWithEmailAndPassword(email, password);
    // On success the page redirects, so the busy state only clears on failure.
    request.catch((error: { code?: string }) => {
      setFormError(describeError(error.code));
      setPending(null);
    });
  };

  const handleGoogle = () => {
    if (pending) return;
    setFormError("");
    setPending("google");
    googleLoginHandler().catch((error: { code?: string }) => {
      // Closing the popup is a choice, not an error worth reporting.
      const dismissed =
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request";
      if (!dismissed) setFormError(describeError(error.code));
      setPending(null);
    });
  };

  const handleRegisterLoginToggle = () => {
    const nextIsRegistering = !isRegistering;
    setIsRegistering(nextIsRegistering);
    setFormError("");
    applyDemoAccount(!nextIsRegistering);
  };

  return (
    <div className="landing-auth-card">
      <div className="landing-auth-heading">
        <span>{isRegistering ? "Create workspace" : "Welcome back"}</span>
        <h3>
          {isRegistering
            ? "Create your MindCard account"
            : "Sign in to keep mapping"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="landing-auth-form">
        {isRegistering ? (
          <label>
            <span>Name</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>
        ) : null}

        <label>
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          <span>Password</span>
          <div className="landing-auth-password">
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              placeholder="At least 6 characters"
              id="password-input"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />
            <button
              type="button"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              onClick={() => setPasswordVisible((previous) => !previous)}
            >
              {passwordVisible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
            </button>
          </div>
        </label>

        {!isRegistering ? (
          <label className="landing-auth-demo">
            <input
              type="checkbox"
              checked={useDemoAccount}
              onChange={() => applyDemoAccount(!useDemoAccount)}
            />
            <span>Use the ready-to-try demo account</span>
          </label>
        ) : null}

        {formError ? (
          <p className="landing-auth-error" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          className="landing-auth-submit"
          disabled={pending !== null}
          aria-busy={pending === "form"}
        >
          {pending === "form"
            ? isRegistering
              ? "Creating account…"
              : "Signing in…"
            : isRegistering
              ? "Create account"
              : "Sign in"}
        </button>

        <div className="landing-auth-divider">
          <span>or</span>
        </div>

        <button
          onClick={handleGoogle}
          type="button"
          className="landing-auth-google"
          disabled={pending !== null}
          aria-busy={pending === "google"}
        >
          <span aria-hidden="true">
            <GoogleIcon size={15} />
          </span>
          Continue with Google
        </button>

        <p className="landing-auth-switch">
          {isRegistering ? "Already have an account?" : "New to MindCard?"}
          <button type="button" onClick={handleRegisterLoginToggle}>
            {isRegistering ? "Sign in" : "Create an account"}
          </button>
        </p>
      </form>
    </div>
  );
}

export default Authentication;
