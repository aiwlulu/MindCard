"use client";
import React, { useContext, useEffect, useState } from "react";
import { authContext } from "@/lib/store/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore/lite";
import { MindmapContext } from "@/lib/store/mindmap-context";
import Image from "next/image";
import dynamic from "next/dynamic";
import { LogoutIcon } from "./Icons";

const MindmapActions = dynamic(() => import("./MindmapActions"), {
  ssr: false,
});

function Nav() {
  const { user, loading, logout } = useContext(authContext);
  const { saveMindmap, exportMindMap } = useContext(MindmapContext);
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const pathname = usePathname();
  const showSaveButton =
    pathname.startsWith("/mindmap/") && pathname.length > 9;

  const logoutAndRedirect = () => {
    logout();
    router.push("/");
  };

  const navigateToMindmap = () => {
    if (pathname !== "/") {
      router.push("/mindmap");
    }
  };

  const handleExport = (format: string) => {
    void exportMindMap(format);
  };

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (user) {
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
  }, [user]);

  useEffect(() => {
    if (showSaveButton) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          void saveMindmap();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [saveMindmap, showSaveButton]);

  return (
    <header className="h-20 w-full md:w-11/12 mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Image
          src="/icon.png"
          alt="MindCard logo"
          width={64}
          height={64}
          className="cursor-pointer logo-hover"
          onClick={navigateToMindmap}
        />
        <strong
          className="text-xl font-semibold cursor-pointer mindcard-hover"
          onClick={navigateToMindmap}
        >
          MindCard
        </strong>
        {user && !loading && !showSaveButton && (
          <small className="truncate">Hi, {displayName}!</small>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user && !loading && showSaveButton && (
          <MindmapActions
            onSave={() => void saveMindmap()}
            onNavigateToMindmap={navigateToMindmap}
            onExport={handleExport}
          />
        )}
        {user && !loading && (
          <button onClick={logoutAndRedirect} className="btn btn-danger">
            <LogoutIcon size={20} className="block lg:hidden" />
            <span className="hidden lg:block truncate">Sign out</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Nav;
