"use client";
import React, { useContext, useEffect, useState } from "react";
import { authContext } from "@/lib/store/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore/lite";
import { MindmapContext } from "@/lib/store/mindmap-context";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ChevronRightIcon, LogoutIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";
import type { MindmapExportFormat } from "@/lib/types";

const MindmapActions = dynamic(() => import("./MindmapActions"), {
  ssr: false,
});

function Nav() {
  const { user, loading, logout } = useContext(authContext);
  const { saveMindmap, exportMindMap, currentMindmapTitle } =
    useContext(MindmapContext);
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const pathname = usePathname();
  const isShareRoute = pathname.startsWith("/share/");
  const isEditorRoute = pathname.startsWith("/mindmap/") && pathname.length > 9;
  const showSaveButton = isEditorRoute;

  const logoutAndRedirect = () => {
    logout();
    router.push("/");
  };

  const navigateToMindmap = () => {
    if (isShareRoute) {
      router.push("/");
    } else if (pathname !== "/") {
      router.push("/mindmap");
    }
  };

  const handleExport = (format: MindmapExportFormat) => {
    void exportMindMap(format);
  };

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (user && !isShareRoute) {
        if (user.displayName) {
          setDisplayName(user.displayName);
        } else {
          const q = query(
            collection(db, "users"),
            where("uid", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((d) => {
            const data = d.data() as { name?: string };
            if (data.name) setDisplayName(data.name);
          });
        }
      }
    };
    void fetchDisplayName();
  }, [isShareRoute, user]);

  const signedIn = Boolean(user) && !loading && !isShareRoute;
  const initial = (displayName ?? user?.email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <header className={`app-nav${isEditorRoute ? " app-nav--editor" : ""}`}>
      <div className="app-nav-inner page-frame">
        <div className="app-nav-brand">
          <button
            type="button"
            className="app-nav-logo"
            onClick={navigateToMindmap}
            aria-label="MindCard home"
          >
            <Image
              src="/icon.png"
              alt="MindCard logo"
              width={28}
              height={28}
              loading="eager"
            />
          </button>
          <button type="button" className="app-nav-wordmark" onClick={navigateToMindmap}>
            MindCard
          </button>
          {isEditorRoute && currentMindmapTitle ? (
            <span className="app-nav-crumb" title={currentMindmapTitle}>
              <ChevronRightIcon size={14} />
              <span>{currentMindmapTitle}</span>
            </span>
          ) : null}
        </div>

        <div className="app-nav-side">
          {signedIn && showSaveButton ? (
            <MindmapActions
              onSave={() => void saveMindmap()}
              onNavigateToMindmap={navigateToMindmap}
              onExport={handleExport}
            />
          ) : null}
          <ThemeToggle />
          {signedIn ? (
            <>
              {!showSaveButton && displayName ? (
                <span className="app-nav-user" title={displayName}>
                  <span className="app-nav-avatar" aria-hidden="true">
                    {initial}
                  </span>
                  <small>Hi, {displayName}!</small>
                </span>
              ) : null}
              <button
                type="button"
                onClick={logoutAndRedirect}
                className="icon-button"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogoutIcon size={18} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Nav;
