"use client";
import React, { useContext, useEffect } from "react";
import { authContext } from "@/lib/store/auth-context";
import Authentication from "@/components/Authentication";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useContext(authContext);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/mindmap");
    }
  }, [user]);

  if (!user) {
    return <Authentication />;
  }
}
