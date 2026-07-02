"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { projectsApi } from "@/lib/api";
import { toast } from "sonner";

export function GitSyncButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      await projectsApi.sync(projectId);
      toast.success("Git 동기화가 완료됐습니다.");
    } catch {
      toast.error("Git 동기화에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleSync} disabled={loading}>
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "동기화 중..." : "Git Sync"}
    </Button>
  );
}
