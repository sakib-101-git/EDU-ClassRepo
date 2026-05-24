"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { auth } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const STUDENT_LINKS = [
  { href: "/dashboard",  label: "Courses" },
  { href: "/my-courses", label: "My Courses" },
  { href: "/cover-page", label: "Cover Page" },
];

const ADMIN_LINKS = [
  { href: "/dashboard", label: "Courses" },
  { href: "/admin",     label: "Admin Panel" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth, getRefreshToken } = useAuthStore();

  const isAdmin = user?.role === "ADMIN";
  const navLinks = isAdmin ? ADMIN_LINKS : STUDENT_LINKS;

  async function handleLogout() {
    const rt = getRefreshToken() ?? "";
    try { await auth.logout(rt); } catch { /* ignore */ }
    clearAuth();
    router.replace("/login");
    toast.success("Logged out");
  }

  const initials = user?.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
      {/* Gold accent line */}
      <div
        className="h-[3px]"
        style={{ background: "linear-gradient(to right, #8B2020, #C9972C 40%, #E5C06A 60%, #C9972C 80%, #8B2020)" }}
      />

      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-14">
        {/* Logo + name */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard" className="hover:opacity-90 transition-opacity">
            <img
              src="/edu-logo.jpg"
              alt="EDU"
              className="h-8 w-8 rounded-full object-cover ring-1 ring-white/30"
            />
          </Link>
          <div className="hidden sm:block leading-none">
            <p className="font-bold text-[13px] tracking-wide" style={{ fontFamily: "var(--font-montserrat)" }}>East Delta University</p>
          </div>
          <Link href="/dashboard" className="sm:hidden font-bold text-base hover:opacity-90 transition-opacity">
            EDU
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors relative
                  ${isActive
                    ? "bg-white/20 text-white"
                    : "text-primary-foreground/80 hover:bg-white/10 hover:text-white"
                  }`}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                    style={{ background: "#C9972C" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-white/30 hover:ring-white/60 transition-all">
              <AvatarImage src={user?.profilePicUrl ?? ""} alt={user?.name} />
              <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-muted-foreground text-xs truncate">{user?.email}</p>
              {isAdmin && (
                <p className="text-xs font-semibold text-primary mt-0.5">Administrator</p>
              )}
            </div>
            <DropdownMenuSeparator />
            {/* Mobile nav inside dropdown */}
            <div className="md:hidden">
              {navLinks.map((link) => (
                <DropdownMenuItem key={link.href} onClick={() => router.push(link.href)}>
                  {link.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
