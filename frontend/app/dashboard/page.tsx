"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { courses, ApiError, type Course, type Page } from "@/lib/api";
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

  const [result, setResult]       = useState<Page<Course> | null>(null);
  const [search, setSearch]       = useState("");
  const [query, setQuery]         = useState("");
  const [page, setPage]           = useState(0);
  const [loading, setLoading]     = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await courses.list({ search: query || undefined, page, size: 50 });
      setResult(data);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
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

  const courseList = result?.content ?? [];

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
              <Button type="button" variant="ghost" onClick={() => { setSearch(""); setQuery(""); setPage(0); }}>
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
          ) : courseList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No courses found. Try a different search.
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {courseList.map((course) => {
                  const colors = getCourseColors(course.code);
                  return (
                    <Card
                      key={course.id}
                      className={`hover:shadow-md transition-all cursor-pointer border ${colors.card}`}
                      onClick={() => router.push(`/course/${course.code.replace(/ /g, '-')}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 mb-1">
                              <span
                                className={`font-bold text-[15px] leading-tight ${colors.title}`}
                                style={{ fontFamily: "var(--font-montserrat)" }}
                              >
                                {course.code}
                              </span>
                              <span className="text-[13px] font-medium text-foreground/50">
                                · {course.creditHours} cr
                              </span>
                            </div>
                            <p className="text-[13px] font-medium text-foreground/70 line-clamp-2 leading-snug">
                              {course.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {course.department.code}
                            </p>
                          </div>
                          {isAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 mt-0.5"
                              onClick={(e) => { e.stopPropagation(); router.push(`/course/${course.code.replace(/ /g, '-')}`); }}
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

              {result && result.totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {result.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= result.totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
