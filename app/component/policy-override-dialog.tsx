"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { policiesApi } from "@/lib/api";
import { Pencil } from "lucide-react";

interface PolicyOverrideDialogProps {
  policyId: string;
  policyTitle: string;
  componentId: string;
}

export function PolicyOverrideDialog({
  policyId,
  policyTitle,
  componentId,
}: PolicyOverrideDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [overrideContent, setOverrideContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!overrideContent.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await policiesApi.override(policyId, componentId, overrideContent);
      setOpen(false);
      setOverrideContent("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setOpen(true)}>
          <Pencil className="h-3 w-3 mr-1" />
          이 컴포넌트에서 재정의
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>정책 재정의 (Override)</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {policyTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-muted-foreground">
            상속된 정책을 이 컴포넌트에서만 다르게 적용하려면 재정의 내용을 입력하세요.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="overrideContent">재정의 내용</Label>
            <Textarea
              id="overrideContent"
              placeholder="이 컴포넌트에 적용할 정책 내용을 입력하세요..."
              value={overrideContent}
              onChange={(e) => setOverrideContent(e.target.value)}
              rows={6}
            />
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !overrideContent.trim()}
          >
            {loading ? "저장 중..." : "재정의 저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
