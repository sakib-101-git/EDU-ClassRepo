"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  routine as routineApi, semesters,
  type RoutineSlot, type Semester, type CustomRoutine,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import AuthGuard from "@/components/auth-guard";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DAYS: RoutineSlot["dayOfWeek"][] = [
  "SATURDAY","SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY",
];
const DAY_SHORT: Record<string, string> = {
  SATURDAY:"Sat", SUNDAY:"Sun", MONDAY:"Mon",
  TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu",
};

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h < 12 ? "AM" : "PM"}`;
}

function hasConflict(selected: RoutineSlot[], candidate: RoutineSlot): boolean {
  return selected.some((s) => {
    if (s.dayOfWeek !== candidate.dayOfWeek) return false;
    return s.startTime < candidate.endTime && candidate.startTime < s.endTime;
  });
}

export default function CustomRoutinePage() {
  const user = useAuthStore((s) => s.user);

  const [slots, setSlots]             = useState<RoutineSlot[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [saved, setSaved]             = useState<CustomRoutine | null>(null);
  const [routineName, setRoutineName] = useState("My Routine");
  const [activeSem, setActiveSem]     = useState<Semester | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    Promise.all([
      semesters.active().catch(() => null),
    ]).then(([sem]) => {
      setActiveSem(sem);
      if (sem) {
        return routineApi.get(sem.id).then(setSlots);
      }
    }).catch(() => {}).finally(() => setLoading(false));

    routineApi.myCustom().then((list) => {
      if (list.length > 0) {
        const r = list[0];
        setSaved(r);
        setRoutineName(r.name);
        setSelected(new Set(r.slots.map((s) => s.id)));
      }
    }).catch(() => {});
  }, []);

  function toggleSlot(slot: RoutineSlot) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slot.id)) {
        next.delete(slot.id);
      } else {
        const currentSelected = slots.filter((s) => next.has(s.id));
        if (hasConflict(currentSelected, slot)) {
          toast.error(`Time conflict! ${slot.course.code} overlaps with another selected class.`);
          return prev;
        }
        next.add(slot.id);
      }
      return next;
    });
  }

  async function handleSave() {
    if (selected.size === 0) {
      toast.error("Select at least one slot");
      return;
    }
    if (!activeSem) return;
    setSaving(true);
    try {
      const result = await routineApi.createCustom({
        semesterId: activeSem.id,
        name: routineName.trim() || "My Routine",
        slotIds: Array.from(selected),
      });
      setSaved(result);
      toast.success("Routine saved!");
    } catch {
      toast.error("Failed to save routine");
    } finally {
      setSaving(false);
    }
  }

  const byDay = DAYS.reduce<Record<string, RoutineSlot[]>>((acc, d) => {
    acc[d] = slots.filter((s) => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, RoutineSlot[]>);

  const selectedSlots = slots.filter((s) => selected.has(s.id));

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Build My Routine</h1>
              {activeSem && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {activeSem.name} — click slots to add them
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Input
                className="w-40"
                placeholder="Routine name"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
              />
              <Button onClick={handleSave} disabled={saving || selected.size === 0}>
                {saving ? "Saving…" : "Save Routine"}
              </Button>
            </div>
          </div>

          {!activeSem && !loading && (
            <div className="text-center py-16 text-muted-foreground">
              No active semester configured. Ask an admin to ingest a routine first.
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {DAYS.map((d) => <div key={d} className="h-64 rounded-xl bg-muted animate-pulse" />)}
            </div>
          )}

          {!loading && activeSem && slots.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              No routine slots found for this semester. Try ingesting the .docx first.
            </div>
          )}

          {!loading && slots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {DAYS.map((day) => (
                <div key={day}>
                  <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {DAY_SHORT[day]}
                  </p>
                  <div className="space-y-1.5">
                    {byDay[day].length === 0 ? (
                      <div className="h-12 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                        Off
                      </div>
                    ) : (
                      byDay[day].map((slot) => {
                        const isSelected = selected.has(slot.id);
                        const wouldConflict = !isSelected && hasConflict(
                          slots.filter((s) => selected.has(s.id)), slot
                        );
                        return (
                          <button
                            key={slot.id}
                            onClick={() => toggleSlot(slot)}
                            disabled={wouldConflict}
                            className={`w-full text-left rounded-lg border p-2 text-xs transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : wouldConflict
                                ? "opacity-30 cursor-not-allowed bg-muted border-border"
                                : "bg-card border-border hover:border-primary/50 hover:bg-accent/30"
                            }`}
                          >
                            <p className="font-bold">{slot.course.code}</p>
                            <p className="truncate opacity-90">{slot.faculty?.shortForm ?? "—"} · S{slot.section}</p>
                            <p className="opacity-70 text-[10px]">{fmt(slot.startTime)}</p>
                            <Badge variant="outline" className={`text-[9px] mt-0.5 px-1 py-0 ${isSelected ? "border-white/40 text-white" : ""}`}>
                              {slot.classType}
                            </Badge>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected courses summary */}
          {selectedSlots.length > 0 && (
            <>
              <Separator className="my-6" />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Selected: {selectedSlots.length} class{selectedSlots.length !== 1 ? "es" : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {DAYS.map((day) => {
                      const daySlots = selectedSlots.filter((s) => s.dayOfWeek === day)
                        .sort((a, b) => a.startTime.localeCompare(b.startTime));
                      if (daySlots.length === 0) return null;
                      return (
                        <div key={day}>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">{DAY_SHORT[day]}</p>
                          {daySlots.map((s) => (
                            <div key={s.id} className="text-xs py-0.5 flex justify-between">
                              <span className="font-medium">{s.course.code} S{s.section}</span>
                              <span className="text-muted-foreground">{fmt(s.startTime)}–{fmt(s.endTime)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
