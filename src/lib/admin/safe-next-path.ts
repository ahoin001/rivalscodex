/** Prevent open redirects after Supabase auth (relative in-app paths only). */
export function safeAdminNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/admin/guides";
  }
  return next;
}
