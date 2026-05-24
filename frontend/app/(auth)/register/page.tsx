"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { auth, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    studentId: "",
    email: "",
    password: "",
    semesterNumber: "1",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await auth.register({
        name: form.name,
        studentId: form.studentId,
        email: form.email,
        password: form.password,
        semesterNumber: parseInt(form.semesterNumber, 10),
      });
      toast.success("Check your email for a 6-digit verification code.");
      router.push(`/verify-email?email=${encodeURIComponent(res.email)}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Brand panel (top on mobile, left on desktop) ─────────── */}
      <div
        className="flex flex-col justify-center items-center text-center p-8 sm:p-10 lg:p-12 lg:w-2/5 xl:w-[38%] relative overflow-hidden gap-7 lg:gap-9"
        style={{
          background:
            "linear-gradient(150deg, #4A0D0D 0%, #6B1515 30%, #8B2020 60%, #5C1010 100%)",
        }}
      >
        {/* Decorative rings */}
        <div className="absolute -top-16 -left-16 lg:-top-24 lg:-left-24 w-[260px] h-[260px] lg:w-[400px] lg:h-[400px] rounded-full border border-white/8 pointer-events-none" />
        <div className="absolute -bottom-24 -right-20 lg:-bottom-32 lg:-right-32 w-[340px] h-[340px] lg:w-[500px] lg:h-[500px] rounded-full border border-white/6 pointer-events-none" />

        {/* Logo + university identity */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/15 blur-2xl scale-[1.8] pointer-events-none" />
            <img
              src="/edu-logo.jpg"
              alt="EDU"
              className="relative w-20 h-20 lg:w-28 lg:h-28 rounded-full object-cover ring-4 ring-white/25 shadow-2xl"
            />
          </div>
          <div>
            <p className="text-white font-bold text-lg lg:text-xl tracking-wide">
              East Delta University
            </p>
            <p className="text-white/55 text-xs mt-1">Chittagong, Bangladesh</p>
          </div>
        </div>

        {/* Gold accent */}
        <div
          className="relative z-10 w-16 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(201,151,44,0.8), transparent)" }}
        />

        {/* Copy */}
        <div className="relative z-10">
          <h1
            className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3 lg:mb-4"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Join to learn<br />and grow
          </h1>
          <p className="text-white/65 text-sm leading-relaxed max-w-[260px] mx-auto">
            Register with your university email to access course materials
            and academic tools.
          </p>
        </div>

        {/* Bottom credit */}
        <p className="relative z-10 text-white/30 text-xs">
          Built &amp; run by{" "}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/50 transition-colors"
          >
            @syed_nazmus_sakib
          </a>
        </p>
      </div>

      {/* ── Form panel (below on mobile, right on desktop) ───────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 bg-background overflow-y-auto">
        <div className="w-full max-w-[420px] py-4">
          <h2
            className="text-3xl font-bold text-foreground mb-1"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={form.studentId}
                onChange={(e) => set("studentId", e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">University Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                autoComplete="email"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  minLength={5}
                  autoComplete="new-password"
                  className="h-10 pr-11"
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

            <div className="space-y-1.5">
              <Label>Semester</Label>
              <Select
                value={form.semesterNumber}
                onValueChange={(v) => v !== null && set("semesterNumber", v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-[15px] font-semibold mt-1 text-white"
              style={{ background: "#A53030" }}
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline underline-offset-4"
            >
              Sign in
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
