"use client";
import React, { createContext } from "react";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore/lite";
import type { AuthContextValue } from "@/lib/types";

export const authContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  googleLoginHandler: async () => {},
  registerWithEmailAndPassword: async () => {},
  loginWithEmailAndPassword: async () => {},
  logout: () => {},
});

export default function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading] = useAuthState(auth);

  const googleProvider = new GoogleAuthProvider();

  const googleLoginHandler = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const registerWithEmailAndPassword = async (
    email: string,
    password: string,
    name: string
  ) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await addDoc(collection(db, "users"), {
      name,
      email,
      uid: userCredential.user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const loginWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    void signOut(auth);
  };

  const values: AuthContextValue = {
    user,
    loading: loading ?? false,
    googleLoginHandler,
    registerWithEmailAndPassword,
    loginWithEmailAndPassword,
    logout,
  };

  return (
    <authContext.Provider value={values}>{children}</authContext.Provider>
  );
}
