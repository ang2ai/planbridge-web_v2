"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { changeRequestsApi } from "@/lib/api";

export function CrCompleteButton({ crId }: { crId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await changeRequestsApi.complete(crId);
      router.refresh();
    } catch {
      // 실패 처리 없이 유지
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleComplete}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4 mr-2" />
      )}
      {loading ? "처리 중..." : "✅ 테스트 완료 → 운영 반영"}
    </Button>
  );
}
