"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  courses, materials, faculty, ApiError,
  type Course, type Material, type FacultyMember, type Page,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import AuthGuard from "@/components/auth-guard";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

function formatSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(contentType: string): string {
  if (contentType.includes("pdf"))         return "📄";
  if (contentType.includes("image"))       return "🖼️";
  if (contentType.includes("powerpoint") || contentType.includes("presentation")) return "📊";
  if (contentType.includes("word"))        return "📝";
  return "📎";
}

const FACULTY_ALL = "__ALL__";

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [course, setCourse]           = useState<Course | null>(null);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [result, setResult]           = useState<Page<Material> | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState(FACULTY_ALL);
  const [facultySearch, setFacultySearch]     = useState("");
  const [facultyDropdown, setFacultyDropdown] = useState(false);
  const [page, setPage]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [uploadOpen, setUploadOpen]         = useState(false);
  const [uploadFacultyId, setUploadFacultyId] = useState("");
  const [uploadFacultySearch, setUploadFacultySearch] = useState("");
  const [uploadFacultyDrop, setUploadFacultyDrop]     = useState(false);
  const [renameOpen, setRenameOpen]   = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    courses.get(courseId).then(setCourse).catch(() => toast.error("Course not found"));
    faculty.list().then(setFacultyList).catch(() => {});
  }, [courseId]);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await materials.byCourse(courseId, {
        facultyId: selectedFaculty !== FACULTY_ALL ? selectedFaculty : undefined,
        page,
      });
      setResult(data);
    } catch {
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [courseId, selectedFaculty, page]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (!uploadFacultyId) { toast.error("Please select a faculty member"); return; }
    try {
      const res = await materials.upload(file, courseId, uploadFacultyId);
      toast.success(res.message);
      setUploadOpen(false);
      setUploadFacultyId("");
      setUploadFacultySearch("");
      fetchMaterials();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    }
  }

  async function handleApprove(id: string) {
    await materials.approve(id).catch((err) => toast.error(err.message));
    fetchMaterials();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file?")) return;
    await materials.delete(id).catch((err) => toast.error(err.message));
    fetchMaterials();
  }

  async function handleRename() {
    if (!renameOpen || !newName.trim()) return;
    await materials.rename(renameOpen.id, newName.trim()).catch((err) => toast.error(err.message));
    setRenameOpen(null);
    fetchMaterials();
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <Link href="/dashboard" className="text-xs text-muted-foreground hover:underline">
                ← Courses
              </Link>
              <h1 className="text-2xl font-bold mt-1">
                {course ? `${course.code} — ${course.title}` : "Loading…"}
              </h1>
              {course && (
                <p className="text-sm text-muted-foreground">
                  {course.department.name} · {course.creditHours} credit hours
                </p>
              )}
            </div>
            <Dialog open={uploadOpen} onOpenChange={(o) => { setUploadOpen(o); if (!o) { setUploadFacultyId(""); setUploadFacultySearch(""); } }}>
              <DialogTrigger>
                <Button>Upload File</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Study Material</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4 mt-2">
                  {/* Faculty picker */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Faculty member <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <Input
                        placeholder="Search faculty name or short form…"
                        value={
                          uploadFacultySearch ||
                          (uploadFacultyId
                            ? (() => { const f = facultyList.find(x => x.id === uploadFacultyId); return f ? `${f.shortForm} — ${f.name}` : ""; })()
                            : "")
                        }
                        onChange={(e) => {
                          setUploadFacultySearch(e.target.value);
                          if (uploadFacultyId) setUploadFacultyId("");
                          setUploadFacultyDrop(true);
                        }}
                        onFocus={() => setUploadFacultyDrop(true)}
                        onBlur={() => setTimeout(() => setUploadFacultyDrop(false), 150)}
                      />
                      {uploadFacultyDrop && (
                        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md max-h-44 overflow-y-auto">
                          {facultyList
                            .filter(f =>
                              !uploadFacultySearch.trim() ||
                              f.name.toLowerCase().includes(uploadFacultySearch.toLowerCase()) ||
                              f.shortForm.toLowerCase().includes(uploadFacultySearch.toLowerCase())
                            )
                            .map(f => (
                              <button
                                type="button"
                                key={f.id}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                                onMouseDown={() => {
                                  setUploadFacultyId(f.id);
                                  setUploadFacultySearch("");
                                  setUploadFacultyDrop(false);
                                }}
                              >
                                {f.shortForm} — {f.name}
                              </button>
                            ))
                          }
                          {facultyList.filter(f =>
                            !uploadFacultySearch.trim() ||
                            f.name.toLowerCase().includes(uploadFacultySearch.toLowerCase()) ||
                            f.shortForm.toLowerCase().includes(uploadFacultySearch.toLowerCase())
                          ).length === 0 && (
                            <p className="px-3 py-2 text-sm text-muted-foreground">No faculty found</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                    required
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                  />
                  <p className="text-xs text-muted-foreground">PDF, Word, PowerPoint, images — max 50 MB</p>
                  <Button type="submit" className="w-full">Upload</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Faculty search */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative w-64">
              <Input
                placeholder="Search faculty…"
                value={
                  facultySearch ||
                  (selectedFaculty !== FACULTY_ALL
                    ? (() => { const f = facultyList.find(x => x.id === selectedFaculty); return f ? `${f.shortForm} — ${f.name}` : ""; })()
                    : "")
                }
                onChange={(e) => {
                  setFacultySearch(e.target.value);
                  if (selectedFaculty !== FACULTY_ALL) { setSelectedFaculty(FACULTY_ALL); setPage(0); }
                  setFacultyDropdown(true);
                }}
                onFocus={() => setFacultyDropdown(true)}
                onBlur={() => setTimeout(() => setFacultyDropdown(false), 150)}
              />
              {facultyDropdown && (
                <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md max-h-52 overflow-y-auto">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                    onMouseDown={() => { setSelectedFaculty(FACULTY_ALL); setFacultySearch(""); setFacultyDropdown(false); setPage(0); }}
                  >
                    All Faculty
                  </button>
                  {facultyList
                    .filter(f =>
                      !facultySearch.trim() ||
                      f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
                      f.shortForm.toLowerCase().includes(facultySearch.toLowerCase())
                    )
                    .map(f => (
                      <button
                        key={f.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                        onMouseDown={() => { setSelectedFaculty(f.id); setFacultySearch(""); setFacultyDropdown(false); setPage(0); }}
                      >
                        {f.shortForm} — {f.name}
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {result ? `${result.totalElements} file${result.totalElements !== 1 ? "s" : ""}` : ""}
            </span>
          </div>

          {/* File list */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {result?.content.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <span className="text-2xl shrink-0">{fileIcon(m.contentType)}</span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {m.fileName}
                    </a>
                    {m.faculty && (
                      <p className="text-xs font-semibold text-foreground/80 mt-0.5">
                        {m.faculty.shortForm}
                        <span className="font-normal text-muted-foreground"> — {m.faculty.name}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatSize(m.fileSize)} · {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.status === "PENDING" && (
                      <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">Pending</Badge>
                    )}
                    {isAdmin && m.status === "PENDING" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleApprove(m.id)}>
                        Approve
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setRenameOpen({ id: m.id, name: m.fileName }); setNewName(m.fileName); }}>
                        Rename
                      </Button>
                    )}
                    {(isAdmin || m.uploader.id === user?.id) && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {result?.content.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  No materials uploaded yet. Be the first!
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {result && result.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm self-center">{page + 1} / {result.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= result.totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </main>

        {/* Rename dialog */}
        <Dialog open={!!renameOpen} onOpenChange={(o) => !o && setRenameOpen(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Rename File</DialogTitle></DialogHeader>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-2" />
            <Button className="w-full mt-2" onClick={handleRename}>Save</Button>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
