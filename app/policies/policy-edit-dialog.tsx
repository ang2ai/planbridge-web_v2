"use client";

import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { policiesApi, type Policy } from "@/lib/api";
import { useRouter } from "next/navigation";

interface PolicyEditDialogProps {
  policy: Policy;
}

export function PolicyEditDialog({ policy }: PolicyEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    policyTitle: policy.policyTitle,
    policyContent: policy.policyContent,
    tags: policy.tags ?? "",
    changeReason: "",
    updatedBy: "admin",
  });

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setForm({
      policyTitle: policy.policyTitle,
      policyContent: policy.policyContent,
      tags: policy.tags ?? "",
      changeReason: "",
      updatedBy: "admin",
    });
  };

  const handleSave = async () => {
    if (!form.policyTitle.trim()) {
      setError("정책 제목을 입력해주세요.");
      return;
    }
    if (!form.policyContent.trim()) {
      setError("정책 내용을 입력해주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await policiesApi.update(policy.policyId, {
        policyTitle: form.policyTitle,
        policyContent: form.policyContent,
        tags: form.tags || undefined,
        changeReason: form.changeReason || undefined,
        updatedBy: form.updatedBy || "admin",
      });
      handleClose();
      router.refresh();
    } catch {
      setError("수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        title="정책 수정"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              정책 수정
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              현재 버전 v{policy.currentVersion} → 저장 시 v{policy.currentVersion + 1}로 업데이트됩니다
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4 pr-1 mt-2">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* 정책 제목 */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                정책 제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.policyTitle}
                onChange={(e) => setForm((p) => ({ ...p, policyTitle: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* 정책 내용 */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                정책 내용 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={form.policyContent}
                onChange={(e) => setForm((p) => ({ ...p, policyContent: e.target.value }))}
                rows={6}
                className="text-sm resize-none"
              />
            </div>

            {/* 태그 */}
            <div className="space-y-1.5">
              <Label className="text-sm">태그</Label>
              <Input
                placeholder="콤마로 구분 (예: 상품,입력검증,필수)"
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* 변경 이유 */}
            <div className="space-y-1.5">
              <Label className="text-sm">변경 이유</Label>
              <Input
                placeholder="예: 요구사항 변경으로 인한 규칙 수정"
                value={form.changeReason}
                onChange={(e) => setForm((p) => ({ ...p, changeReason: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* 수정자 */}
            <div className="space-y-1.5">
              <Label className="text-sm">수정자</Label>
              <Input
                value={form.updatedBy}
                onChange={(e) => setForm((p) => ({ ...p, updatedBy: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t mt-3">
            <Button variant="outline" size="sm" onClick={handleClose}>
              취소
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  수정 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
