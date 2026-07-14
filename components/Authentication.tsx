import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { authContext } from "@/lib/store/auth-context";
import { EyeIcon, EyeOffIcon } from "./Icons";

interface FormData {
  name: string;
  email: string;
  password: string;
}

function Authentication() {
  const {
    googleLoginHandler,
    registerWithEmailAndPassword,
    loginWithEmailAndPassword,
  } = useContext(authContext);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  });
  const [useDemoAccount, setUseDemoAccount] = useState(true);

  useEffect(() => {
    if (useDemoAccount) {
      setFormData({ name: "", email: "demo@gmail.com", password: "123456" });
    } else {
      setFormData({ name: "", email: "", password: "" });
    }
  }, [useDemoAccount, isRegistering]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { name, email, password } = formData;

    if (isRegistering) {
      registerWithEmailAndPassword(email, password, name).catch(
        (error: { code?: string }) => {
          if (error.code === "auth/email-already-in-use") {
            toast.error("The email address is already in use by another account.");
          }
        }
      );
      return;
    }

    loginWithEmailAndPassword(email, password).catch(
      (error: { code?: string }) => {
        if (
          error.code === "auth/invalid-login-credentials" ||
          error.code === "auth/invalid-credential"
        ) {
          toast.error("Incorrect email or password.");
        }
      }
    );
  };

  const handleRegisterLoginToggle = () => {
    const nextIsRegistering = !isRegistering;
    setIsRegistering(nextIsRegistering);
    setUseDemoAccount(!nextIsRegistering);
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
              onChange={() => setUseDemoAccount((previous) => !previous)}
            />
            <span>Use the ready-to-try demo account</span>
          </label>
        ) : null}

        <button type="submit" className="landing-auth-submit">
          {isRegistering ? "Create account" : "Sign in"}
        </button>

        <div className="landing-auth-divider">
          <span>or</span>
        </div>

        <button
          onClick={() => void googleLoginHandler()}
          type="button"
          className="landing-auth-google"
        >
          <span aria-hidden="true">G</span>
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
