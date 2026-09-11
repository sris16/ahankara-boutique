import { redirect } from "next/navigation";

export default function AdminRootPage() {
  // Redirect base /admin route to the dashboard
  redirect("/admin/dashboard");
}
