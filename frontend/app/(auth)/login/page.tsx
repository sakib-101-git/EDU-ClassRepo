"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { auth, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FEATURES = [
  "Course Repository & Materials",
  "Cover Page Creator",
  "Enroll & Track Your Courses",
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await auth.login({ email, password });
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.message.startsWith("EMAIL_NOT_VERIFIED:")) {
        const unverifiedEmail = err.message.split(":")[1];
        toast.info("Please verify your email first.");
        router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Brand panel (top on mobile, left on desktop) ─────────── */}
      <div
        className="flex flex-col justify-center items-center text-center p-8 sm:p-10 lg:p-14 lg:w-3/5 xl:w-[58%] relative overflow-hidden gap-8 lg:gap-10"
        style={{
          background:
            "linear-gradient(150deg, #4A0D0D 0%, #6B1515 30%, #8B2020 60%, #5C1010 100%)",
        }}
      >
        {/* Decorative rings */}
        <div className="absolute -top-20 -left-20 lg:-top-32 lg:-left-32 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] rounded-full border border-white/8 pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 lg:-bottom-40 lg:-right-40 w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] rounded-full border border-white/6 pointer-events-none" />
        <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/4 pointer-events-none" />

        {/* Logo + university identity */}
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/15 blur-2xl scale-[1.8] pointer-events-none" />
            <img
              src="/logo.png"
              alt="EDU"
              className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover ring-4 ring-white/25 shadow-2xl"
            />
          </div>
          <div>
            <p className="text-white font-bold text-xl lg:text-2xl tracking-wide">
              East Delta University
            </p>
            <p className="text-white/55 text-sm mt-1">Chittagong, Bangladesh</p>
          </div>
        </div>

        {/* Gold accent */}
        <div
          className="relative z-10 w-20 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(201,151,44,0.8), transparent)" }}
        />

        {/* Main copy */}
        <div className="relative z-10">
          <h1
            className="text-4xl sm:text-5xl xl:text-6xl font-bold text-white leading-tight mb-3 lg:mb-5"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Your Academic<br />Gateway
          </h1>
          <p className="text-white/70 text-base lg:text-lg leading-relaxed max-w-sm mb-6 lg:mb-8">
            A one stop solution for EDU Students.
          </p>

          <div className="space-y-2.5 lg:space-y-3 text-left inline-block">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(201,151,44,0.3)", border: "1px solid rgba(201,151,44,0.5)" }}
                >
                  <svg className="w-3 h-3 text-yellow-300" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5l-1 1L5 10.5l6-8-1-1z" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Form panel (below on mobile, right on desktop) ───────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-10 bg-background">
        <div className="w-full max-w-[400px]">
          <h2
            className="text-3xl font-bold text-foreground mb-1"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Welcome back
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Sign in to your EDU account to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">University Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ID@eastdelta.edu.bd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-[15px] font-semibold mt-1 text-white"
              style={{ background: "#A53030" }}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline underline-offset-4"
            >
              Create one
            </Link>
          </p>

          <p className="mt-8 text-center text-xs text-muted-foreground/50">
            Built and run by{" "}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              @syed_nazmus_sakib
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
