import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";

/**
 * Centralized server-side guard for all admin pages.
 *
 * Every page.tsx under /admin inherits this layout, which validates the
 * admin session before rendering children.  Route handlers (login/logout
 * route.ts files) are NOT wrapped by layouts in the App Router and remain
 * unaffected.
 *
 * Fail-closed: invalid, expired, idle, revoked, or missing session →
 * redirect to /admin/login.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) {
    redirect("/admin/login");
  }
  return <>{children}</>;
}
