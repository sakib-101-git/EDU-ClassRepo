"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cgpa } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import AuthGuard from "@/components/auth-guard";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"];
const GRADE_POINTS: Record<string, number> = {
  "A+": 4.00, "A": 3.75, "A-": 3.50, "B+": 3.25, "B": 3.00, "B-": 2.75,
  "C+": 2.50, "C": 2.25, "C-": 2.00, "D+": 1.75, "D": 1.50, "F": 0.00,
};

interface CourseRow { id: number; grade: string; credits: string }

function standingColor(s: string): string {
  if (s === "Summa Cum Laude")  return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (s === "Magna Cum Laude")  return "bg-orange-100 text-orange-800 border-orange-300";
  if (s === "Cum Laude")        return "bg-green-100 text-green-800 border-green-300";
  if (s === "Good Standing")    return "bg-blue-100 text-blue-800 border-blue-300";
  if (s === "Satisfactory")     return "bg-muted text-muted-foreground border-border";
  return "bg-red-100 text-red-800 border-red-300";
}

let nextId = 1;

export default function CgpaPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  useEffect(() => { if (user?.role === "ADMIN") router.replace("/dashboard"); }, [user, router]);

  const [rows, setRows]   = useState<CourseRow[]>([
    { id: nextId++, grade: "A", credits: "3" },
    { id: nextId++, grade: "B+", credits: "3" },
    { id: nextId++, grade: "A-", credits: "3" },
  ]);
  const [result, setResult] = useState<{ cgpa: number; totalCredits: number; standing: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function addRow() {
    setRows((r) => [...r, { id: nextId++, grade: "A", credits: "3" }]);
    setResult(null);
  }

  function removeRow(id: number) {
    setRows((r) => r.filter((row) => row.id !== id));
    setResult(null);
  }

  function updateRow(id: number, field: keyof Omit<CourseRow, "id">, value: string) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    setResult(null);
  }

  async function handleCalculate() {
    const payload = rows.map((r) => ({
      grade: r.grade,
      credits: parseFloat(r.credits),
    }));
    if (payload.some((p) => isNaN(p.credits) || p.credits <= 0)) {
      toast.error("All credit values must be positive numbers");
      return;
    }
    setLoading(true);
    try {
      const res = await cgpa.calculate(payload);
      setResult(res);
    } catch {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  }

  // Live preview CGPA
  const livePoints = rows.reduce((sum, r) => {
    const gp = GRADE_POINTS[r.grade] ?? 0;
    const cr = parseFloat(r.credits) || 0;
    return sum + gp * cr;
  }, 0);
  const liveCredits = rows.reduce((sum, r) => sum + (parseFloat(r.credits) || 0), 0);
  const liveCgpa = liveCredits > 0 ? (livePoints / liveCredits).toFixed(2) : "—";

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6">
          <h1 className="text-2xl font-bold mb-2">CGPA Calculator</h1>
          <p className="text-sm text-muted-foreground mb-6">
            East Delta University grading scale — A+ = 4.00 … F = 0.00
          </p>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Course rows */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-[1fr_100px_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Grade</span>
                <span>Credits</span>
                <span />
              </div>
              {rows.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-[1fr_100px_36px] gap-2 items-center">
                  <Select value={row.grade} onValueChange={(v) => v !== null && updateRow(row.id, "grade", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g} ({GRADE_POINTS[g].toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="0.5"
                    max="6"
                    step="0.5"
                    value={row.credits}
                    onChange={(e) => updateRow(row.id, "credits", e.target.value)}
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addRow}>+ Add Course</Button>
                <Button size="sm" onClick={handleCalculate} disabled={loading}>
                  {loading ? "Calculating…" : "Calculate"}
                </Button>
              </div>
            </div>

            {/* Result card */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">{liveCgpa}</p>
                  <p className="text-xs text-muted-foreground mt-1">{liveCredits} total credits</p>
                </CardContent>
              </Card>

              {result && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Result</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-4xl font-bold text-primary">{result.cgpa.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{result.totalCredits} credit hours</p>
                    <Badge variant="outline" className={`text-xs px-2 py-1 ${standingColor(result.standing)}`}>
                      {result.standing}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* Scale reference */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">EDU Grading Scale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0.5 text-xs">
                    {GRADES.map((g) => (
                      <div key={g} className="flex justify-between text-muted-foreground">
                        <span className="font-medium text-foreground w-8">{g}</span>
                        <span>{GRADE_POINTS[g].toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 space-y-0.5 text-xs text-muted-foreground border-t pt-2">
                    <p>≥ 3.90 — Summa Cum Laude</p>
                    <p>≥ 3.75 — Magna Cum Laude</p>
                    <p>≥ 3.50 — Cum Laude</p>
                    <p>≥ 3.00 — Good Standing</p>
                    <p>≥ 2.00 — Satisfactory</p>
                    <p className="text-red-600">{"< 2.00 — Academic Probation"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
