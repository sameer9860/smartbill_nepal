import type { Metadata } from "next";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Admin — SmartBill Nepal",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

