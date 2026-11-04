"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AdminRootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (!user.is_staff) {
      router.replace("/dashboard");
    } else {
      router.replace("/admin/dashboard");
    }
  }, [user, loading, router]);

  return null;
}

