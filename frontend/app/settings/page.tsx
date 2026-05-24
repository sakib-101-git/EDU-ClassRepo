"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { users, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import AuthGuard from "@/components/auth-guard";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initials = user?.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  async function handlePicUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      await users.uploadProfilePic(file);
      const me = await users.me();
      updateUser(me);
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 space-y-6">
          <h1 className="text-2xl font-bold">Settings</h1>

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar upload */}
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profilePicUrl ?? ""} alt={user?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? "Uploading…" : "Change Photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF — max 5 MB</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handlePicUpload}
                  />
                </div>
              </div>

              <Separator />

              {/* Account info */}
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Full Name</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Student ID</p>
                  <p className="font-medium">{user?.studentId ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Role</p>
                  <p className="font-medium capitalize">{user?.role?.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Department</p>
                  <p className="font-medium">{user?.department ? `${user.department.code} — ${user.department.name}` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Semester</p>
                  <p className="font-medium">{user?.semesterNumber ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
}
