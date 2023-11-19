"use client";
import { useContext, useEffect, useState } from "react";
import { authContext } from "@/lib/store/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { MindmapContext } from "@/lib/store/mindmap-context";

function Nav() {
  const { user, loading, logout } = useContext(authContext);
  const { saveMindmap } = useContext(MindmapContext);
  const router = useRouter();
  const [displayName, setDisplayName] = useState(null);
  const pathname = usePathname();
  const showSaveButton =
    pathname.startsWith("/mindmap/") && pathname.length > 9;

  const logoutAndRedirect = () => {
    logout();
    router.push("/");
  };

  const navigateToMindmap = () => {
    router.push("/mindmap");
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

  return (
    <header className="w-11/12 mx-auto px-6 py-2 flex items-center">
      <div className="flex items-center gap-4">
        <img
          src="/icon.png"
          alt="logo"
          className="w-16 h-16 cursor-pointer"
          onClick={navigateToMindmap}
        />
        <strong
          className="text-xl font-semibold cursor-pointer"
          onClick={navigateToMindmap}
        >
          MindCard
        </strong>
        {user && !loading && <small className="ml-8">Hi, {displayName}!</small>}
      </div>
      <div className="flex-grow"></div>
      <div className="flex items-center gap-4">
        {user && !loading && showSaveButton && (
          <>
            <button
              onClick={navigateToMindmap}
              className="btn btn-primary mr-2"
            >
              MyMind
            </button>
            <button
              onClick={() => saveMindmap()}
              className="btn btn-primary mr-2"
            >
              Save
            </button>
          </>
        )}
        {user && !loading && (
          <button onClick={logoutAndRedirect} className="btn btn-danger">
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}

export default Nav;
