"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { UserAvatar, getRoleDisplayName } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Camera,
  Loader2,
  Save,
  Trash2,
  Upload,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, refetch, isLoading: authLoading } = useAuth();
  
  const [displayName, setDisplayName] = React.useState("");
  const [profilePictureUrl, setProfilePictureUrl] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load current profile data
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.displayName || "");
          setProfilePictureUrl(data.profilePictureUrl || data.image || null);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    }
    loadProfile();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setMessage({ type: "error", text: "Please upload a JPEG, PNG, WebP, or GIF image." });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB." });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/picture", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfilePictureUrl(data.profilePictureUrl);
        setMessage({ type: "success", text: "Profile picture updated!" });
        refetch();
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to upload picture." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload picture." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    setIsUploading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/picture", { method: "DELETE" });
      if (res.ok) {
        setProfilePictureUrl(null);
        setMessage({ type: "success", text: "Profile picture removed." });
        refetch();
      } else {
        setMessage({ type: "error", text: "Failed to remove picture." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to remove picture." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profile saved successfully!" });
        refetch();
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to save profile." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const primaryRole = user?.roleAssignments?.[0]?.role?.key || "default";

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and profile picture
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 p-4 rounded-xl border",
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          {message.type === "success" ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Picture Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Your profile picture will be displayed throughout the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="relative">
              <UserAvatar
                src={profilePictureUrl}
                name={displayName || user?.displayName}
                email={user?.email}
                role={primaryRole}
                size="2xl"
                showRing={true}
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload profile picture"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                {profilePictureUrl ? "Change" : "Upload"}
              </Button>
              {profilePictureUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePicture}
                  disabled={isUploading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Recommended: Square image, at least 200×200 pixels.
              <br />
              Max size: 5MB. Formats: JPEG, PNG, WebP, GIF.
            </p>
          </CardContent>
        </Card>

        {/* Profile Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                This is how your name will appear across the platform.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="max-w-md bg-slate-50"
              />
              <p className="text-xs text-muted-foreground">
                Your email address cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-2">
                {user?.roleAssignments?.map((ra, idx) => (
                  <Badge key={idx} variant="secondary">
                    {getRoleDisplayName(ra.role.key)}
                  </Badge>
                )) || (
                  <Badge variant="outline" className="text-amber-600">
                    No roles assigned
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Your roles determine what features you can access.
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-based Color Ring Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Profile Preview</CardTitle>
          <CardDescription>
            See how your avatar appears with your role-based color ring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 items-end">
            {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <UserAvatar
                  src={profilePictureUrl}
                  name={displayName || user?.displayName}
                  email={user?.email}
                  role={primaryRole}
                  size={size}
                  showRing={true}
                />
                <span className="text-xs text-muted-foreground uppercase">{size}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
