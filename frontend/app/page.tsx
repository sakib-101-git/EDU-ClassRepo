import { redirect } from "next/navigation";

// Root route: always redirect to dashboard (middleware will catch unauthenticated users)
export default function RootPage() {
  redirect("/dashboard");
}
