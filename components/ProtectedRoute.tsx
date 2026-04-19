"use client";
import React, { useContext, useEffect } from "react";
import { authContext } from "@/lib/store/auth-context";
import Authentication from "@/components/Authentication";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useContext(authContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Authentication />;
  }

  return <>{children}</>;
}
