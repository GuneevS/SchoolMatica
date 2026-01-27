"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

interface Props {
  schoolId: string;
  schoolName: string;
}

export function SchoolSwitchButton({ schoolId }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSwitch() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/schools/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId }),
      });

      if (response.ok) {
        // Redirect to dashboard with the new school context
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to switch school:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleSwitch}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4" />
      )}
      View as School
    </Button>
  );
}
