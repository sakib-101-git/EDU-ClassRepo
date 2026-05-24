"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { courses, type Course } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import AuthGuard from "@/components/auth-guard";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PREFIX_COLORS: Record<string, { card: string; title: string }> = {
  CSE: { card: "bg-amber-50 border-amber-200 hover:border-amber-300",    title: "text-amber-800" },
  ENG: { card: "bg-orange-50 border-orange-200 hover:border-orange-300",  title: "text-orange-800" },
  BBA: { card: "bg-yellow-50 border-yellow-200 hover:border-yellow-300",  title: "text-yellow-800" },
  AA:  { card: "bg-rose-50 border-rose-200 hover:border-rose-300",        title: "text-rose-800" },
  MAT: { card: "bg-red-50 border-red-200 hover:border-red-300",           title: "text-red-800" },
  PHY: { card: "bg-pink-50 border-pink-200 hover:border-pink-300",        title: "text-pink-800" },
  HUM: { card: "bg-amber-50 border-amber-300 hover:border-amber-400",     title: "text-amber-900" },
  BUS: { card: "bg-orange-50 border-orange-300 hover:border-orange-400",  title: "text-orange-900" },
};

const FALLBACK_PALETTE = [
  { card: "bg-amber-50 border-amber-200 hover:border-amber-300",   title: "text-amber-800" },
  { card: "bg-orange-50 border-orange-200 hover:border-orange-300", title: "text-orange-800" },
  { card: "bg-rose-50 border-rose-200 hover:border-rose-300",       title: "text-rose-800" },
  { card: "bg-yellow-50 border-yellow-200 hover:border-yellow-300", title: "text-yellow-800" },
];

function getCourseColors(code: string) {
  const prefix = code.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (PREFIX_COLORS[prefix]) return PREFIX_COLORS[prefix];
  const hash = prefix.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

export default function MyCoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [list, setList]     = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user?.role === "ADMIN") router.replace("/dashboard"); }, [user, router]);

  useEffect(() => {
    courses.enrolled()
      .then((data) => setList([...data].sort((a, b) => a.code.localeCompare(b.code))))
      .catch(() => toast.error("Failed to load courses"))
      .finally(() => setLoading(false));
  }, []);

  async function handleUnenroll(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Unenroll from this course?")) return;
    await courses.unenroll(id).catch((err) => toast.error(err.message));
    setList((l) => l.filter((c) => c.id !== id));
    toast.success("Unenrolled");
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">My Courses</h1>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg mb-3">You are not enrolled in any courses yet.</p>
              <Button onClick={() => router.push("/dashboard")}>Browse Courses</Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {list.map((course) => {
                const colors = getCourseColors(course.code);
                return (
                  <Card
                    key={course.id}
                    className={`hover:shadow-md transition-all cursor-pointer border ${colors.card}`}
                    onClick={() => router.push(`/course/${course.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span
                              className={`font-bold text-[15px] leading-tight ${colors.title}`}
                              style={{ fontFamily: "var(--font-nunito)" }}
                            >
                              {course.code}
                            </span>
                            <span
                              className="text-[13px] font-semibold text-foreground/50"
                              style={{ fontFamily: "var(--font-nunito)" }}
                            >
                              · {course.creditHours} cr
                            </span>
                          </div>
                          <p
                            className="text-[13px] font-semibold text-foreground/70 line-clamp-2 leading-snug"
                            style={{ fontFamily: "var(--font-nunito)" }}
                          >
                            {course.title}
                          </p>
                          <p
                            className="text-xs text-muted-foreground mt-1"
                            style={{ fontFamily: "var(--font-nunito)" }}
                          >
                            {course.department.code}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 mt-0.5 border-2 border-destructive/60 text-destructive bg-white hover:bg-destructive hover:text-white font-semibold transition-colors"
                          onClick={(e) => handleUnenroll(e, course.id)}
                        >
                          Unenroll
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
