"use client";
import { useContext, useEffect } from "react";
import { authContext } from "@/lib/store/auth-context";
import Authentication from "@/components/Authentication";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(authContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Authentication />;
  }

  return children;
}
