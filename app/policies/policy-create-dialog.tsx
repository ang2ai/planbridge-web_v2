"use client";

import { useState } from "react";
import { Plus, Loader2, Sparkles } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { policiesApi, aiApi } from "@/lib/api";
import { useRouter } from "next/navigation";

const POLICY_TYPES = [
  { value: "VALIDATION",   label: "📝 입력 검증",   desc: "입력값 규칙, 필수 여부, 길이, 패턴" },
  { value: "UI_SPEC",      label: "👁️ 화면 표시",   desc: "레이아웃, 스타일, 표시 형식" },
  { value: "BIZ_RULE",     label: "💼 업무 규칙",   desc: "비즈니스 조건, 계산 규칙" },
  { value: "INTERACTION",  label: "🖱️ 동작 규칙",   desc: "클릭, 이벤트, 상태 전이" },
  { value: "DATA_SPEC",    label: "🔌 데이터 연동", desc: "API 스펙, 데이터 포맷" },
  { value: "PERMISSION",   label: "🔑 권한/접근",   desc: "접근 제어, 역할별 허용 기능" },
];

const SCOPES = [
  { value: "GLOBAL",    label: "🌐 전역 (GLOBAL)",    desc: "모든 컴포넌트에 적용" },
  { value: "PAGE",      label: "📄 페이지 (PAGE)",     desc: "특정 페이지에 적용" },
  { value: "COMPONENT", label: "🧩 컴포넌트 (COMPONENT)", desc: "특정 컴포넌트에 적용" },
  { value: "ELEMENT",   label: "🎯 요소 (ELEMENT)",   desc: "특정 DOM 요소에 적용" },
];

export function PolicyCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recommendingType, setRecommendingType] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    projectId: "",
    policyType: "VALIDATION",
    scope: "ELEMENT",
    policyTitle: "",
    policyContent: "",
    tags: "",
    createdBy: "admin",
  });

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setForm({
      projectId: "",
      policyType: "VALIDATION",
      scope: "ELEMENT",
      policyTitle: "",
      policyContent: "",
      tags: "",
      createdBy: "admin",
    });
  };

  // AI 추천 결과 타입명 → 폼 타입명 매핑 (백엔드/Next.js 경유 AI는 다른 이름 반환)
  const AI_TYPE_MAP: Record<string, string> = {
    BUSINESS_RULE: "BIZ_RULE",
    API_SPEC: "DATA_SPEC",
    TEXT_CONTENT: "UI_SPEC",
  };

  const handleAiRecommend = async () => {
    if (!form.policyContent.trim()) return;
    setRecommendingType(true);
    try {
      const result = await aiApi.recommendPolicyType(form.policyContent);
      const mappedType = AI_TYPE_MAP[result.recommendedType] ?? result.recommendedType;
      setForm((prev) => ({ ...prev, policyType: mappedType }));
    } catch {
      // 실패 무시
    } finally {
      setRecommendingType(false);
    }
  };

  const handleSave = async () => {
    if (!form.policyTitle.trim()) { setError("정책 제목을 입력해주세요."); return; }
    if (!form.policyContent.trim()) { setError("정책 내용을 입력해주세요."); return; }
    if (!form.projectId.trim()) { setError("프로젝트 ID를 입력해주세요."); return; }

    setSaving(true);
    setError(null);
    try {
      await policiesApi.create({
        projectId: form.projectId,
        policyType: form.policyType,
        scope: form.scope,
        policyTitle: form.policyTitle,
        policyContent: form.policyContent,
        tags: form.tags || undefined,
        createdBy: form.createdBy || "admin",
      });
      handleClose();
      router.refresh();
    } catch {
      setError("정책 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-4 w-4" />
        새 정책 등록
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              새 정책 등록
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4 pr-1 mt-2">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* 프로젝트 ID */}
            <div className="space-y-1.5">
              <Label className="text-sm">프로젝트 ID <span className="text-red-500">*</span></Label>
              <Input
                placeholder="예: freshmart-admin"
                value={form.projectId}
                onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* 정책 유형 */}
            <div className="space-y-1.5">
              <Label className="text-sm">정책 유형 <span className="text-red-500">*</span></Label>
              <Select value={form.policyType} onValueChange={(v) => setForm((p) => ({ ...p, policyType: v ?? "VALIDATION" }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POLICY_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value} className="text-sm">
                      <span>{pt.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{pt.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 적용 범위 */}
            <div className="space-y-1.5">
              <Label className="text-sm">적용 범위 <span className="text-red-500">*</span></Label>
              <Select value={form.scope} onValueChange={(v) => setForm((p) => ({ ...p, scope: v ?? "ELEMENT" }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPES.map((sc) => (
                    <SelectItem key={sc.value} value={sc.value} className="text-sm">
                      {sc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 정책 제목 */}
            <div className="space-y-1.5">
              <Label className="text-sm">정책 제목 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="예: 상품명 입력 검증 규칙"
                value={form.policyTitle}
                onChange={(e) => setForm((p) => ({ ...p, policyTitle: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* 정책 내용 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm">정책 내용 <span className="text-red-500">*</span></Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs gap-1 text-violet-600"
                  onClick={handleAiRecommend}
                  disabled={recommendingType || !form.policyContent.trim()}
                >
                  {recommendingType ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  AI 유형 추천
                </Button>
              </div>
              <Textarea
                placeholder="정책 내용을 자연어로 자유롭게 작성하세요&#10;예: 필수 입력, 최소 2자, 최대 100자, 특수문자 <>&quot; 사용 불가"
                value={form.policyContent}
                onChange={(e) => setForm((p) => ({ ...p, policyContent: e.target.value }))}
                rows={5}
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

            {/* 작성자 */}
            <div className="space-y-1.5">
              <Label className="text-sm">작성자</Label>
              <Input
                placeholder="예: 박지현"
                value={form.createdBy}
                onChange={(e) => setForm((p) => ({ ...p, createdBy: e.target.value }))}
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
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />등록 중...</>
              ) : (
                "정책 등록"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
