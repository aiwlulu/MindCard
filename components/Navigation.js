"use client";
import { IoIosFolder, IoMdLogOut, IoIosSave } from "react-icons/io";
import React, { useContext, useEffect, useState } from "react";
import { authContext } from "@/lib/store/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { MindmapContext } from "@/lib/store/mindmap-context";
import { BsDownload } from "react-icons/bs";
import AutoSaveToggle from "./AutoSaveToggle";
import debounce from "lodash.debounce";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";

function Nav() {
  const { user, loading, logout } = useContext(authContext);
  const { saveMindmap, exportMindMap } = useContext(MindmapContext);
  const router = useRouter();
  const [displayName, setDisplayName] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
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

  const handleExport = (format) => {
    exportMindMap(format);
    setShowExportOptions(false);
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
          querySnapshot.forEach((doc) => {
            setDisplayName(doc.data().name);
          });
        }
      }
    };

    fetchDisplayName();
  }, [user]);

  useEffect(() => {
    if (showSaveButton) {
      const handleKeyDown = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          saveMindmap();
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [saveMindmap, showSaveButton]);

  const debouncedSaveMindmap = debounce(() => {
    saveMindmap();
  }, 300);

  return (
    <header className="h-20 w-full md:w-11/12 mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img
          src="/icon.png"
          alt="logo"
          className="w-16 h-16 cursor-pointer logo-hover"
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
          <>
            <div className="items-center gap-3 lg:flex hidden">
              <AutoSaveToggle />
            </div>
            <button
              onClick={debouncedSaveMindmap}
              className="btn btn-primary lg:mr-4"
            >
              <IoIosSave size={20} className="block lg:hidden" />
              <span className="hidden lg:block">Save</span>
            </button>

            <button
              onClick={navigateToMindmap}
              className="btn btn-primary lg:mr-4 hidden md:block"
            >
              <IoIosFolder size={20} className="block lg:hidden" />
              <span className="hidden lg:block">Folder</span>
            </button>

            <Menu as="div" className="relative inline-block text-left">
              <MenuButton className="btn btn-primary flex items-center gap-2">
                <BsDownload size={20} className="block lg:hidden" />
                <span className="hidden lg:block">Export</span>
              </MenuButton>
              <MenuItems className="absolute right-0 mt-2 w-40 bg-slate-700 text-white shadow-md rounded-md py-1 z-50">
                <MenuItem>
                  {({ active }) => (
                    <button
                      onClick={() => handleExport("svg")}
                      className={`${
                        active ? "bg-slate-600" : "bg-slate-700"
                      } flex items-center w-full px-4 py-2 text-sm text-left whitespace-nowrap rounded-md`}
                    >
                      Export as SVG
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <button
                      onClick={() => handleExport("markdown")}
                      className={`${
                        active ? "bg-slate-600" : "bg-slate-700"
                      } flex items-center w-full px-4 py-2 text-sm text-left whitespace-nowrap rounded-md`}
                    >
                      Export as Markdown
                    </button>
                  )}
                </MenuItem>
              </MenuItems>
            </Menu>
          </>
        )}
        {user && !loading && (
          <button onClick={logoutAndRedirect} className="btn btn-danger">
            <IoMdLogOut size={20} className="block lg:hidden" />
            <span className="hidden lg:block truncate">Sign out</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Nav;
