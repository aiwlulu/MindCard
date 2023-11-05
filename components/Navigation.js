"use client";
import { useContext, useEffect, useState } from "react";
import { authContext } from "@/lib/store/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function Nav() {
  const { user, loading, logout } = useContext(authContext);
  const [displayName, setDisplayName] = useState(null);

  const logoutAndRedirect = () => {
    logout();
    window.location.href = "/";
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

  return (
    <header className="w-11/12 mx-auto px-6 py-2 flex items-center">
      <div className="flex items-center gap-4">
        <img src="/icon.png" alt="logo" className="w-16 h-16" />
        <strong className="text-xl font-semibold">MindCard</strong>
        {user && !loading && <small className="ml-8">Hi, {displayName}!</small>}
      </div>
      <div className="flex-grow"></div>
      <div>
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
