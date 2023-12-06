"use client";
import { IoIosFolder, IoMdLogOut, IoIosSave } from "react-icons/io";
import { useContext, useEffect, useState } from "react";
import { authContext } from "@/lib/store/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { MindmapContext } from "@/lib/store/mindmap-context";
import { BsDownload } from "react-icons/bs";
import { Switch } from "@headlessui/react";

function Nav() {
  const { user, loading, logout } = useContext(authContext);
  const { saveMindmap } = useContext(MindmapContext);
  const router = useRouter();
  const [displayName, setDisplayName] = useState(null);
  const pathname = usePathname();
  const showSaveButton =
    pathname.startsWith("/mindmap/") && pathname.length > 9;
  const { exportMindMap } = useContext(MindmapContext);

  const logoutAndRedirect = () => {
    logout();
    router.push("/");
  };

  const navigateToMindmap = () => {
    if (pathname !== "/") {
      router.push("/mindmap");
    }
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

  const handleExport = async () => {
    const mindmapId = pathname.split("/mindmap/")[1];
    if (mindmapId) {
      try {
        await exportMindMap(mindmapId);
      } catch (error) {
        console.error("Error when trying to export:", error);
      }
    }
  };

  const [autoSave, setAutoSave] = useState(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("autoSave")) || false;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("autoSave", JSON.stringify(autoSave));
    }
  }, [autoSave]);

  useEffect(() => {
    if (autoSave && user && !loading && showSaveButton) {
      const interval = setInterval(() => {
        saveMindmap();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoSave, user, loading, showSaveButton]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timeout = setTimeout(() => {
        setAutoSave((currentAutoSave) => !currentAutoSave);

        setTimeout(() => {
          setAutoSave((currentAutoSave) => !currentAutoSave);
        }, 500);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <header className="w-11/12 mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img
          src="/icon.png"
          alt="logo"
          className="w-16 h-16 cursor-pointer logo-hover"
          onClick={navigateToMindmap}
        />

        <strong
          className="text-xl font-semibold cursor-pointer hidden md:block mindcard-hover"
          onClick={navigateToMindmap}
        >
          MindCard
        </strong>
        {user && !loading && (
          <small className="ml-2 truncate">Hi, {displayName}!</small>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user && !loading && showSaveButton && (
          <>
            <div className="items-center gap-3 lg:flex hidden">
              <Switch
                checked={autoSave}
                onChange={setAutoSave}
                className={`${
                  autoSave ? "bg-lime-600" : "bg-gray-400"
                } relative inline-flex items-center h-6 rounded-full w-11`}
              >
                <span
                  className={`${
                    autoSave ? "translate-x-6" : "translate-x-1"
                  } inline-block w-4 h-4 transform bg-white rounded-full`}
                />
              </Switch>
              <span className="text-lime-500 mr-2">Auto Save (30s)</span>
            </div>
            <button
              onClick={() => saveMindmap()}
              className="btn btn-primary lg:mr-4"
            >
              <IoIosSave size={20} className="block lg:hidden" />
              <span className="hidden lg:block">Save</span>
            </button>

            <button
              onClick={navigateToMindmap}
              className="btn btn-primary lg:mr-4"
            >
              <IoIosFolder size={20} className="block lg:hidden" />
              <span className="hidden lg:block">Folder</span>
            </button>

            <button onClick={handleExport} className="btn btn-primary lg:mr-4">
              <BsDownload size={20} className="block lg:hidden" />
              <span className="hidden lg:block">Export</span>
            </button>
          </>
        )}
        {user && !loading && (
          <button onClick={logoutAndRedirect} className="btn btn-danger">
            <IoMdLogOut size={20} className="block lg:hidden" />
            <span className="hidden lg:block">Sign out</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Nav;
