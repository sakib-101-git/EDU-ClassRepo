"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { auth, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace("/register");
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (digits.length === 6) {
      setOtp(digits.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Enter all 6 digits");
      return;
    }
    setLoading(true);
    try {
      const res = await auth.verifyEmail(email, code);
      setAuth(res.user, res.accessToken, res.refreshToken);
      toast.success("Email verified! Welcome.");
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Verification failed");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await auth.resendOtp(email);
      toast.success("New code sent — check your email.");
      setCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not resend code");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Brand panel ───────────────────────────────────────────── */}
      <div
        className="flex flex-col justify-center items-center text-center p-8 sm:p-10 lg:p-14 lg:w-2/5 xl:w-[42%] relative overflow-hidden gap-8"
        style={{
          background:
            "linear-gradient(150deg, #4A0D0D 0%, #6B1515 30%, #8B2020 60%, #5C1010 100%)",
        }}
      >
        <div className="absolute -top-20 -left-20 w-[300px] h-[300px] lg:w-[450px] lg:h-[450px] rounded-full border border-white/8 pointer-events-none" />
        <div className="absolute -bottom-24 -right-20 w-[350px] h-[350px] lg:w-[500px] lg:h-[500px] rounded-full border border-white/6 pointer-events-none" />

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

        <div
          className="relative z-10 w-16 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(201,151,44,0.8), transparent)" }}
        />

        <div className="relative z-10 text-center">
          <h1
            className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            One step<br />to go
          </h1>
          <p className="text-white/65 text-sm leading-relaxed max-w-[240px] mx-auto">
            We sent a 6-digit code to your email. Enter it to activate your account.
          </p>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          Built &amp; run by{" "}
          <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">
            @syed_nazmus_sakib
          </a>
        </p>
      </div>

      {/* ── OTP form panel ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-background">
        <div className="w-full max-w-[380px]">
          <h2
            className="text-3xl font-bold text-foreground mb-1"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Verify your email
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Enter the 6-digit code sent to{" "}
            <span className="text-foreground font-medium">{email}</span>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2.5 justify-between mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  maxLength={1}
                  inputMode="numeric"
                  className="h-14 text-center text-xl font-bold w-full"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-[15px] font-semibold text-white"
              style={{ background: "#A53030" }}
              disabled={loading || otp.join("").length < 6}
            >
              {loading ? "Verifying…" : "Verify & Continue"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-primary font-semibold hover:underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending…" : "Resend code"}
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Wrong email?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-primary font-semibold hover:underline underline-offset-4"
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

