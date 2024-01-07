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
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const authContext = createContext({
  user: null,
  loading: false,
  googleLoginHandler: async () => {},
  registerWithEmailAndPassword: async () => {},
  loginWithEmailAndPassword: async () => {},
  logout: async () => {},
});

export default function AuthContextProvider({ children }) {
  const [user, loading] = useAuthState(auth);

  const googleProvider = new GoogleAuthProvider(auth);

  const googleLoginHandler = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      throw error;
    }
  };

  const registerWithEmailAndPassword = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userUid = userCredential.user.uid;

      await addDoc(collection(db, "users"), {
        name,
        email,
        uid: userUid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  };

  const loginWithEmailAndPassword = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    signOut(auth);
  };

  const values = {
    user,
    loading,
    googleLoginHandler,
    registerWithEmailAndPassword,
    loginWithEmailAndPassword,
    logout,
  };

  return <authContext.Provider value={values}>{children}</authContext.Provider>;
}
