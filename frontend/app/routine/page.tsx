"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { routine, semesters, type RoutineSlot, type Semester } from "@/lib/api";
import AuthGuard from "@/components/auth-guard";
import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const DAYS: RoutineSlot["dayOfWeek"][] = [
  "SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
];

const DAY_LABEL: Record<string, string> = {
  SATURDAY: "Sat", SUNDAY: "Sun", MONDAY: "Mon",
  TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
};

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function slotColor(type: string): string {
  return type === "LAB"
    ? "bg-blue-50 border-blue-200 text-blue-900"
    : "bg-green-50 border-green-200 text-green-900";
}

export default function RoutinePage() {
  const [semList, setSemList]     = useState<Semester[]>([]);
  const [semId, setSemId]         = useState<string>("");
  const [slots, setSlots]         = useState<RoutineSlot[]>([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    semesters.list().then((list) => {
      setSemList(list);
      const active = list.find((s) => s.active);
      if (active) setSemId(active.id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!semId) return;
    setLoading(true);
    routine.get(semId)
      .then(setSlots)
      .catch(() => toast.error("Failed to load routine"))
      .finally(() => setLoading(false));
  }, [semId]);

  const byDay = DAYS.reduce<Record<string, RoutineSlot[]>>((acc, d) => {
    acc[d] = slots.filter((s) => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, RoutineSlot[]>);

  const hasAny = slots.length > 0;

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold">Class Routine</h1>
            <Select value={semId} onValueChange={(v) => v && setSemId(v)}>
              <SelectTrigger className="w-56">
                <span className="flex-1 text-left text-sm truncate">
                  {semId
                    ? (() => { const s = semList.find(x => x.id === semId); return s ? `${s.name}${s.active ? " (Active)" : ""}` : "Select semester"; })()
                    : "Select semester"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {semList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.active && "(Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {DAYS.map((d) => (
                <div key={d} className="h-60 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!loading && !hasAny && semId && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-medium mb-2">No slots found for this semester.</p>
              <p className="text-sm">The selected semester has no routine data yet.</p>
            </div>
          )}

          {!loading && hasAny && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {DAYS.map((day) => (
                <div key={day}>
                  <div className="text-center text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    {DAY_LABEL[day]}
                  </div>
                  <div className="space-y-2">
                    {byDay[day].length === 0 ? (
                      <div className="rounded-lg border border-dashed h-16 flex items-center justify-center text-xs text-muted-foreground">
                        Off
                      </div>
                    ) : (
                      byDay[day].map((slot) => (
                        <div
                          key={slot.id}
                          className={`rounded-lg border p-2 text-xs ${slotColor(slot.classType)}`}
                        >
                          <p className="font-bold">{slot.course.code}</p>
                          <p className="truncate">{slot.faculty?.shortForm ?? "—"} · Sec {slot.section}</p>
                          <p className="opacity-70">{formatTime(slot.startTime)}–{formatTime(slot.endTime)}</p>
                          {slot.room && <p className="opacity-70">Room {slot.room}</p>}
                          <Badge variant="outline" className="text-[10px] mt-1 px-1 py-0">
                            {slot.classType}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!semId && semList.length === 0 && (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-semibold mb-2">No Semester Data Yet</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                No semester routine has been uploaded. An administrator can upload the semester
                schedule via the <strong>Admin Panel → Routine</strong> tab using the official
                EDU <code>.docx</code> routine file.
              </p>
            </div>
          )}
          {!semId && semList.length > 0 && (
            <div className="text-center py-20 text-muted-foreground">
              Select a semester above to view the routine.
            </div>
          )}

          {hasAny && (
            <div className="flex gap-4 mt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-green-200 border border-green-300" /> Theory
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded bg-blue-200 border border-blue-300" /> Lab
              </span>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
