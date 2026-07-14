"use client";
import React, { useContext, useEffect } from "react";
import { authContext } from "@/lib/store/auth-context";
import Authentication from "@/components/Authentication";
import { usePathname, useRouter } from "next/navigation";
import Loading from "@/app/loading";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useContext(authContext);
  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = pathname === "/" || pathname.startsWith("/share/");

  useEffect(() => {
    if (!isPublicRoute && !loading && !user) {
      router.push("/");
    }
  }, [isPublicRoute, user, loading, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Authentication />;
  }

  return <>{children}</>;
}
