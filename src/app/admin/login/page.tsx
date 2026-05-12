import { AdminLoginForm } from "@/features/heroes/components/admin-login-form";
import { safeAdminNextPath } from "@/lib/admin/safe-next-path";

type AdminLoginPageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const resolved = await Promise.resolve(searchParams);
  const nextPath = safeAdminNextPath(resolved?.next);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <AdminLoginForm nextPath={nextPath} />
    </div>
  );
}
