"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  materials, semesters, courses, departments, ApiError,
  type Material, type Page, type Semester, type Course, type Department,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import AuthGuard from "@/components/auth-guard";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Approvals tab ────────────────────────────────────────────────────────────
function ApprovalsTab() {
  const [pending, setPending]   = useState<Page<Material> | null>(null);
  const [page, setPage]         = useState(0);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName]   = useState("");

  const fetchPending = useCallback(async () => {
    const data = await materials.pending(page).catch(() => null);
    if (data) setPending(data);
  }, [page]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  async function handleApprove(id: string) {
    try {
      await materials.approve(id);
      toast.success("Approved");
      fetchPending();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Reject and remove this file?")) return;
    try {
      await materials.reject(id);
      toast.success("Rejected");
      fetchPending();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    }
  }

  async function handleRename() {
    if (!renameTarget || !newName.trim()) return;
    try {
      await materials.rename(renameTarget.id, newName.trim());
      toast.success("File renamed");
      setRenameTarget(null);
      fetchPending();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Rename failed");
    }
  }

  return (
    <div className="space-y-3">
      {pending?.content.length === 0 && (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No pending files — all caught up!
        </div>
      )}

      {pending?.content.map((m) => (
        <div key={m.id} className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{m.fileName}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
              <span className="text-xs font-semibold text-foreground">{m.course.code}</span>
              {m.faculty ? (
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                  {m.faculty.shortForm} — {m.faculty.name}
                </span>
              ) : (
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">No faculty</span>
              )}
              <span className="text-xs text-muted-foreground">by {m.uploader.name}</span>
              <span className="text-xs text-muted-foreground">{formatSize(m.fileSize)}</span>
              <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 mt-0.5">
            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-7 text-xs">Preview</Button>
            </a>
            <Button
              size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => { setRenameTarget({ id: m.id, name: m.fileName }); setNewName(m.fileName); }}
            >
              Rename
            </Button>
            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApprove(m.id)}>
              Approve
            </Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleReject(m.id)}>
              Reject
            </Button>
          </div>
        </div>
      ))}

      {pending && pending.totalPages > 1 && (
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Page {page + 1} of {pending.totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={page >= pending.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename File</DialogTitle></DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            className="mt-2"
          />
          <Button className="w-full mt-2" onClick={handleRename}>Save</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Course Management tab ─────────────────────────────────────────────────────
function CoursesTab() {
  const [depts, setDepts]   = useState<Department[]>([]);
  const [courseList, setCourseList] = useState<Page<Course> | null>(null);
  const [page, setPage]     = useState(0);
  const [deptFilter, setDeptFilter] = useState("__ALL__");
  const [loading, setLoading] = useState(false);

  // Add course form
  const [code, setCode]         = useState("");
  const [title, setTitle]       = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [credits, setCredits]   = useState("3");
  const [adding, setAdding]     = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await courses.list({
        dept: deptFilter !== "__ALL__" ? deptFilter : undefined,
        page,
        size: 15,
      });
      setCourseList(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [deptFilter, page]);

  useEffect(() => { departments.list().then(setDepts).catch(() => {}); }, []);
  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !title.trim() || !deptCode) {
      toast.error("Fill in all fields");
      return;
    }
    setAdding(true);
    try {
      await courses.create({ code: code.trim().toUpperCase(), title: title.trim(), departmentCode: deptCode, creditHours: Number(credits) });
      toast.success(`Course ${code.toUpperCase()} added`);
      setCode(""); setTitle(""); setDeptCode(""); setCredits("3");
      fetchCourses();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add course");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string, courseCode: string) {
    if (!confirm(`Delete course ${courseCode}? This cannot be undone.`)) return;
    try {
      await courses.delete(id);
      toast.success(`${courseCode} deleted`);
      fetchCourses();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      {/* Add course form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add New Course</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Course Code</Label>
              <Input placeholder="e.g. CSE 4101" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-xs">Course Title</Label>
              <Input placeholder="e.g. Machine Learning" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Department</Label>
              <Select value={deptCode} onValueChange={(v) => v !== null && setDeptCode(v)}>
                <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                <SelectContent>
                  {depts.map((d) => (
                    <SelectItem key={d.code} value={d.code}>{d.code} — {d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Credit Hours</Label>
              <Select value={credits} onValueChange={(v) => v !== null && setCredits(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["1","2","3","4"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={adding} className="sm:col-span-2 lg:col-span-1">
              {adding ? "Adding…" : "+ Add Course"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Course list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">
            {courseList ? `${courseList.totalElements} courses total` : "Loading…"}
          </p>
          <Select value={deptFilter} onValueChange={(v) => { if (v !== null) { setDeptFilter(v); setPage(0); } }}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__ALL__">All Departments</SelectItem>
              {depts.map((d) => <SelectItem key={d.code} value={d.code}>{d.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 rounded-lg bg-muted animate-pulse" />
          ))}
          {!loading && courseList?.content.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
              <div>
                <span className="text-sm font-medium">{c.code}</span>
                <span className="text-sm text-muted-foreground"> — {c.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">({c.creditHours} cr · {c.department.code})</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(c.id, c.code)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        {courseList && courseList.totalPages > 1 && (
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground self-center">Page {page + 1} of {courseList.totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= courseList.totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Semester Routine tab ──────────────────────────────────────────────────────
function RoutineTab() {
  const [semList, setSemList]   = useState<Semester[]>([]);
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [semCode, setSemCode]   = useState("");
  const [semName, setSemName]   = useState("");
  const [setActive, setSetActive] = useState(true);

  useEffect(() => { semesters.list().then(setSemList).catch(() => {}); }, []);

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !semCode.trim() || !semName.trim()) {
      toast.error("Fill all fields and select a .docx file");
      return;
    }
    setIngesting(true);
    setResult(null);
    try {
      const res = await semesters.ingest(file, semCode.trim(), semName.trim(), setActive);
      setResult(`${res.message} — ${res.slotsCreated} slots created`);
      toast.success("Routine ingested successfully!");
      semesters.list().then(setSemList).catch(() => {});
      setSemCode(""); setSemName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Ingestion failed";
      toast.error(msg);
      setResult(`Error: ${msg}`);
    } finally {
      setIngesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload Semester Routine</CardTitle>
          <p className="text-xs text-muted-foreground">Upload the EDU routine .docx file to populate the timetable.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIngest} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Semester Code</Label>
                <Input placeholder="e.g. SUMMER-2026" value={semCode} onChange={(e) => setSemCode(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Semester Name</Label>
                <Input placeholder="e.g. Summer 2026" value={semName} onChange={(e) => setSemName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Routine .docx File</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".docx"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="setActive"
                checked={setActive}
                onChange={(e) => setSetActive(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="setActive" className="cursor-pointer">Set as active semester</Label>
            </div>
            <Button type="submit" disabled={ingesting}>
              {ingesting ? "Ingesting…" : "Upload & Ingest"}
            </Button>
            {result && (
              <p className={`text-sm ${result.startsWith("Error") ? "text-destructive" : "text-green-600"}`}>
                {result}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {semList.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Semesters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {semList.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm py-1">
                <div>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground ml-1.5">({s.code})</span>
                </div>
                <div className="flex items-center gap-2">
                  {s.active
                    ? <Badge className="text-xs">Active</Badge>
                    : (
                      <Button size="sm" variant="outline" className="h-6 text-xs"
                        onClick={() => semesters.activate(s.id).then(() => semesters.list().then(setSemList)).catch(() => {})}>
                        Set Active
                      </Button>
                    )
                  }
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "ADMIN") {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar />
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Admin access required.
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage course materials, courses, and semester routines.
            </p>
          </div>

          <Tabs defaultValue="approvals">
            <TabsList className="mb-6">
              <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
              <TabsTrigger value="courses">Course Management</TabsTrigger>
              <TabsTrigger value="routine">Semester Routine</TabsTrigger>
            </TabsList>

            <TabsContent value="approvals">
              <ApprovalsTab />
            </TabsContent>

            <TabsContent value="courses">
              <CoursesTab />
            </TabsContent>

            <TabsContent value="routine">
              <RoutineTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}
