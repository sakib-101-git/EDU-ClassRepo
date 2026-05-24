"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { courses, ApiError, type Course } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import AuthGuard from "@/components/auth-guard";
import Navbar from "@/components/navbar";
import { Input } from "@/components/ui/input";
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

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [search, setSearch]         = useState("");
  const [query, setQuery]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [enrolling, setEnrolling]   = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await courses.list({ search: query || undefined, page: 0, size: 500 });
      setAllCourses([...data.content].sort((a, b) => a.code.localeCompare(b.code)));
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
  }

  async function handleEnroll(courseId: string) {
    setEnrolling(courseId);
    try {
      await courses.enroll(courseId);
      toast.success("Enrolled successfully!", {
        description: 'Head to "My Courses" to access it.',
        action: { label: "My Courses", onClick: () => router.push("/my-courses") },
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Enroll failed");
    } finally {
      setEnrolling(null);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Course Browser</h1>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-lg">
            <Input
              placeholder="Search by code or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">Search</Button>
            {query && (
              <Button type="button" variant="ghost" onClick={() => { setSearch(""); setQuery(""); }}>
                Clear
              </Button>
            )}
          </form>

          {/* Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : allCourses.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No courses found. Try a different search.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allCourses.map((course) => {
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
                        {isAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 mt-0.5"
                            onClick={(e) => { e.stopPropagation(); router.push(`/course/${course.id}`); }}
                          >
                            View
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 mt-0.5 border-2 border-[#A53030] text-[#A53030] bg-white hover:bg-[#A53030] hover:text-white font-semibold transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleEnroll(course.id); }}
                            disabled={enrolling === course.id}
                          >
                            {enrolling === course.id ? "…" : "Enroll"}
                          </Button>
                        )}
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
