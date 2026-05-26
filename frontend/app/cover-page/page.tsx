"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";

type Template = "lab-report" | "assignment";

const ASSIGNMENT_TITLES = [
  "Assignment",
  "Assignment 1",
  "Assignment 2",
  "Assignment 3",
  "Assignment 4",
  "Assignment 5",
  "Assignment 6",
];

const DESIGNATIONS = [
  "Lecturer",
  "Senior Lecturer",
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Head of Department",
];

// ── Cover page visual component ─────────────────────────────────────────────
// Rendered at A4 pixel dimensions (794×1123). html2canvas captures this div.
function CoverSheet({
  ref: coverRef,
  template,
  labTitle,
  experimentNo,
  assignmentTitle,
  assignmentTopic,
  courseName,
  courseCode,
  department,
  facultyName,
  facultyDesignation,
  studentName,
  studentId,
  section,
  semester,
  submissionDate,
}: {
  ref: React.Ref<HTMLDivElement>;
  template: Template;
  labTitle: string;
  experimentNo: string;
  assignmentTitle: string;
  assignmentTopic: string;
  courseName: string;
  courseCode: string;
  department: string;
  facultyName: string;
  facultyDesignation: string;
  studentName: string;
  studentId: string;
  section: string;
  semester: string;
  submissionDate: string;
}) {
  const dept = department || "Computer Science & Engineering";

  return (
    <div
      ref={coverRef}
      style={{
        width: "794px",
        minHeight: "1123px",
        backgroundColor: "#ffffff",
        fontFamily: '"Times New Roman", Times, serif',
        padding: "56px 80px 48px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#000000",
        fontSize: "14px",
        lineHeight: "1.5",
      }}
    >
      {/* University logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="East Delta University"
        width={130}
        height={130}
        style={{ objectFit: "contain", marginBottom: "14px" }}
      />

      {/* University header */}
      <p
        style={{
          fontWeight: "bold",
          fontSize: "21px",
          textAlign: "center",
          margin: "0 0 4px",
          fontFamily: "Cambria, Georgia, serif",
          letterSpacing: "0.02em",
        }}
      >
        East Delta University
      </p>
      <p style={{ fontSize: "14px", textAlign: "center", margin: "0 0 3px" }}>
        Department of {dept}
      </p>
      <p style={{ fontSize: "12px", textAlign: "center", margin: "0 0 22px", color: "#333" }}>
        Chittagong, Bangladesh
      </p>

      <hr style={{ width: "100%", borderTop: "2px solid #000", margin: "0 0 26px" }} />

      {/* Document title */}
      <p
        style={{
          fontWeight: "bold",
          fontSize: "28px",
          textAlign: "center",
          margin: "0 0 10px",
          fontFamily: "Cambria, Georgia, serif",
        }}
      >
        {template === "lab-report" ? "Lab Report" : (assignmentTitle || "Assignment")}
      </p>

      <p style={{ fontSize: "14px", textAlign: "center", margin: "0 0 8px" }}>On</p>

      {template === "lab-report" ? (
        <>
          <p
            style={{
              fontWeight: "bold",
              fontSize: "17px",
              textAlign: "center",
              margin: "0 0 6px",
              maxWidth: "540px",
            }}
          >
            {labTitle || " __________________________________ "}
          </p>
          {experimentNo && (
            <p style={{ fontSize: "13px", textAlign: "center", margin: "0 0 4px" }}>
              Experiment No: {experimentNo}
            </p>
          )}
        </>
      ) : (
        <p
          style={{
            fontWeight: "bold",
            fontSize: "17px",
            textAlign: "center",
            margin: "0 0 6px",
            maxWidth: "540px",
          }}
        >
          {assignmentTopic || " __________________________________ "}
        </p>
      )}

      <div
        style={{
          margin: "18px 0",
          width: "55%",
          borderTop: "1px dashed #555",
        }}
      />

      {/* Course info */}
      <table style={{ width: "100%", fontSize: "14px", marginBottom: "20px" }}>
        <tbody>
          <tr>
            <td style={{ width: "145px", paddingBottom: "6px", fontWeight: "bold" }}>
              Course Name
            </td>
            <td style={{ paddingBottom: "6px" }}>
              :{" "}
              {courseName || " _________________________________"}
            </td>
          </tr>
          <tr>
            <td style={{ paddingBottom: "6px", fontWeight: "bold" }}>Course Code</td>
            <td style={{ paddingBottom: "6px" }}>
              :{" "}
              {courseCode || " ______________"}
            </td>
          </tr>
        </tbody>
      </table>

      <hr style={{ width: "100%", borderTop: "1px solid #888", margin: "0 0 22px" }} />

      {/* Submitted to / by */}
      <div style={{ width: "100%", display: "flex", gap: "48px", marginBottom: "28px" }}>
        {/* Submitted To */}
        <div style={{ flex: 1, fontSize: "14px" }}>
          <p
            style={{
              fontWeight: "bold",
              fontSize: "15px",
              marginBottom: "10px",
              paddingBottom: "5px",
              borderBottom: "1px solid #bbb",
            }}
          >
            Submitted To
          </p>
          <p style={{ margin: "0 0 4px", fontWeight: "bold" }}>
            {facultyName || " _________________________"}
          </p>
          <p style={{ margin: "0 0 4px" }}>{facultyDesignation}</p>
          <p style={{ margin: "0 0 4px" }}>Department of {dept}</p>
          <p style={{ margin: "0" }}>East Delta University</p>
        </div>

        {/* Submitted By */}
        <div style={{ flex: 1, fontSize: "14px" }}>
          <p
            style={{
              fontWeight: "bold",
              fontSize: "15px",
              marginBottom: "10px",
              paddingBottom: "5px",
              borderBottom: "1px solid #bbb",
            }}
          >
            Submitted By
          </p>
          <p style={{ margin: "0 0 4px", fontWeight: "bold" }}>
            {studentName || " _________________________"}
          </p>
          <p style={{ margin: "0 0 4px" }}>
            ID:{" "}
            {studentId || " __________"}
          </p>
          <p style={{ margin: "0 0 4px" }}>
            Section:{" "}
            {section || " ___"}
          </p>
          <p style={{ margin: "0" }}>
            Semester:{" "}
            {semester || " ___"}
          </p>
        </div>
      </div>

      <hr style={{ width: "100%", borderTop: "2px solid #000", margin: "0 0 20px" }} />

      <p style={{ fontSize: "14px", textAlign: "center" }}>
        <strong>Date of Submission:</strong>
        {" "}
        {submissionDate || " ___/___/______"}
      </p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function CoverPageCreator() {
  const router = useRouter();
  const { user } = useAuthStore();
  useEffect(() => { if (user?.role === "ADMIN") router.replace("/dashboard"); }, [user, router]);

  const coverRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<"pdf" | "image" | null>(null);

  // Template
  const [template, setTemplate] = useState<Template>("lab-report");

  // Shared fields — pre-fill from auth store
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [department, setDepartment] = useState(user?.department?.name ?? "");
  const [facultyName, setFacultyName] = useState("");
  const [facultyDesignation, setFacultyDesignation] = useState("Lecturer");
  const [studentName, setStudentName] = useState(user?.name ?? "");
  const [studentId, setStudentId] = useState(user?.studentId ?? "");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState(
    user?.semesterNumber ? `${user.semesterNumber}th` : ""
  );
  const [submissionDate, setSubmissionDate] = useState(
    new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
  );

  // Lab Report fields
  const [labTitle, setLabTitle] = useState("");
  const [experimentNo, setExperimentNo] = useState("");

  // Assignment fields
  const [assignmentTitle, setAssignmentTitle] = useState("Assignment");
  const [assignmentTopic, setAssignmentTopic] = useState("");

  async function downloadAs(mode: "pdf" | "image") {
    if (!coverRef.current) return;
    setDownloading(mode);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(coverRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const baseName =
        template === "lab-report"
          ? `Lab_Report_Cover${experimentNo ? `_Exp${experimentNo}` : ""}`
          : assignmentTitle.replace(/ /g, "_") + "_Cover";

      if (mode === "image") {
        const link = document.createElement("a");
        link.download = `${baseName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Image downloaded");
      } else {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const imgData = canvas.toDataURL("image/png");
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
        pdf.save(`${baseName}.pdf`);
        toast.success("PDF downloaded");
      }
    } catch {
      toast.error("Download failed — try again");
    } finally {
      setDownloading(null);
    }
  }

  const sharedProps = {
    template,
    labTitle,
    experimentNo,
    assignmentTitle,
    assignmentTopic,
    courseName,
    courseCode,
    department,
    facultyName,
    facultyDesignation,
    studentName,
    studentId,
    section,
    semester,
    submissionDate,
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl font-bold">Cover Page Creator</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={downloading !== null}
                onClick={() => downloadAs("image")}
              >
                {downloading === "image" ? "Saving…" : "↓ Download Image"}
              </Button>
              <Button disabled={downloading !== null} onClick={() => downloadAs("pdf")}>
                {downloading === "pdf" ? "Saving…" : "↓ Download PDF"}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
            {/* ── Form panel ── */}
            <div className="space-y-4">

              {/* Template selector */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant={template === "lab-report" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setTemplate("lab-report")}
                    >
                      Lab Report
                    </Button>
                    <Button
                      variant={template === "assignment" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setTemplate("assignment")}
                    >
                      Assignment
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Document-specific */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {template === "lab-report" ? "Lab Details" : "Assignment Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {template === "lab-report" ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Lab / Experiment Title</Label>
                        <Input
                          placeholder="e.g. Implementation of Binary Search Tree"
                          value={labTitle}
                          onChange={(e) => setLabTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Experiment No. (optional)</Label>
                        <Input
                          placeholder="e.g. 3"
                          value={experimentNo}
                          onChange={(e) => setExperimentNo(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Assignment Title</Label>
                        <Select
                          value={assignmentTitle}
                          onValueChange={(v) => v !== null && setAssignmentTitle(v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSIGNMENT_TITLES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Topic</Label>
                        <Input
                          placeholder="e.g. Dynamic Memory Allocation"
                          value={assignmentTopic}
                          onChange={(e) => setAssignmentTopic(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Course info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Course</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Course Name</Label>
                    <Input
                      placeholder="e.g. Data Structures & Algorithms"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Course Code</Label>
                    <Input
                      placeholder="e.g. CSE 2103"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Department</Label>
                    <Input
                      placeholder="e.g. Computer Science & Engineering"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Faculty */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Submitted To</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Faculty Name</Label>
                    <Input
                      placeholder="e.g. Dr. Ahmed Rahman"
                      value={facultyName}
                      onChange={(e) => setFacultyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Designation</Label>
                    <Select
                      value={facultyDesignation}
                      onValueChange={(v) => v !== null && setFacultyDesignation(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DESIGNATIONS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Student */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Submitted By</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Your Name</Label>
                    <Input
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Student ID</Label>
                    <Input
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Section</Label>
                      <Input
                        placeholder="e.g. A"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Semester</Label>
                      <Input
                        placeholder="e.g. 4th"
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date of Submission</Label>
                    <Input
                      value={submissionDate}
                      onChange={(e) => setSubmissionDate(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Preview panel ── */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Live preview — what you download is exactly this
              </p>
              {/* Scroll container for the A4 preview */}
              <div className="overflow-x-auto border rounded-lg shadow-sm bg-gray-100 p-4">
                <CoverSheet ref={coverRef} {...sharedProps} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
