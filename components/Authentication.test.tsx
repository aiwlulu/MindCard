import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Authentication from "./Authentication";
import { authContext } from "@/lib/store/auth-context";

function renderForm(overrides: Partial<React.ContextType<typeof authContext>> = {}) {
  const value = {
    user: null,
    loading: false,
    googleLoginHandler: jest.fn().mockResolvedValue(undefined),
    registerWithEmailAndPassword: jest.fn().mockResolvedValue(undefined),
    loginWithEmailAndPassword: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn(),
    ...overrides,
  };
  render(
    <authContext.Provider value={value}>
      <Authentication />
    </authContext.Provider>
  );
  return value;
}

describe("Authentication", () => {
  it("shows a busy button while the sign-in request is running", () => {
    const login = jest.fn(() => new Promise<void>(() => {}));
    renderForm({ loginWithEmailAndPassword: login });

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const busy = screen.getByRole("button", { name: "Signing in…" });
    expect(busy).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
    fireEvent.click(busy);
    expect(login).toHaveBeenCalledTimes(1);
  });

  it("explains a wrong password next to the form and lets the user retry", async () => {
    const login = jest.fn().mockRejectedValue({ code: "auth/invalid-credential" });
    renderForm({ loginWithEmailAndPassword: login });

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("reports failures that used to be silent, such as a lost connection", async () => {
    renderForm({
      loginWithEmailAndPassword: jest.fn().mockRejectedValue({ code: "auth/network-request-failed" }),
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No connection.");
  });

  it("stays quiet when the Google popup is closed", async () => {
    const google = jest.fn().mockRejectedValue({ code: "auth/popup-closed-by-user" });
    renderForm({ googleLoginHandler: google });

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    await screen.findByRole("button", { name: "Sign in" });
    expect(await screen.findByRole("button", { name: "Continue with Google" })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
