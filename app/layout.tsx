import React from "react";
import "./globals.css";
import Head from "./head";
import ToastProvider from "@/components/ToastProvider";
import Nav from "@/components/Navigation";
import AuthContextProvider from "@/lib/store/auth-context";
import { MindmapProvider } from "@/lib/store/mindmap-context";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Head />
      <body suppressHydrationWarning={true}>
        <AuthContextProvider>
          <MindmapProvider>
            <ToastProvider />
            <Nav />
            <ProtectedRoute>{children}</ProtectedRoute>
          </MindmapProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
