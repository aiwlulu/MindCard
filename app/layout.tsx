import React from "react";
import "./globals.css";
import Head from "./head";
import ToastProvider from "@/components/ToastProvider";
import Nav from "@/components/Navigation";
import AuthContextProvider from "@/lib/store/auth-context";
import { MindmapProvider } from "@/lib/store/mindmap-context";
import { ThemeProvider } from "@/lib/store/theme-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <Head />
      <body suppressHydrationWarning={true}>
        {/* Applies the saved theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <ThemeProvider>
          <AuthContextProvider>
            <MindmapProvider>
              <ToastProvider />
              <Nav />
              <ProtectedRoute>{children}</ProtectedRoute>
            </MindmapProvider>
          </AuthContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
