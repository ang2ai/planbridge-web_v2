"use client";

import { useState } from "react";
import { Settings2, Plus, Trash2, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { validationRulesApi, type ValidationRule } from "@/lib/api";

const RULE_TYPES = [
  { value: "REQUIRED",    label: "필수 입력",    hint: "빈값 허용 안 함" },
  { value: "MIN_LENGTH",  label: "최소 길이",    hint: "숫자 (예: 2)" },
  { value: "MAX_LENGTH",  label: "최대 길이",    hint: "숫자 (예: 100)" },
  { value: "PATTERN",     label: "정규식 패턴",  hint: "예: ^[^<>]+$" },
  { value: "RANGE",       label: "숫자 범위",    hint: "min,max (예: 1,100)" },
  { value: "ASYNC",       label: "서버 검증",    hint: "API 엔드포인트 (예: /api/check)" },
  { value: "CROSS_FIELD", label: "필드 간 검증", hint: "비교 필드명" },
  { value: "CUSTOM",      label: "커스텀",       hint: "자유 형식" },
];

function newRule(): ValidationRule {
  return { ruleType: "REQUIRED", fieldName: "", ruleValue: "", errorMessage: "", sortOrder: 0 };
}

interface ValidationRulesDialogProps {
  policyId: string;
  policyTitle: string;
}

export function ValidationRulesDialog({ policyId, policyTitle }: ValidationRulesDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleOpen = async (val: boolean) => {
    setOpen(val);
    if (val && !loaded) {
      setLoading(true);
      setError(null);
      try {
        const data = await validationRulesApi.list(policyId);
        setRules(data.length > 0 ? data : [newRule()]);
        setLoaded(true);
      } catch {
        setError("규칙을 불러오지 못했습니다. 새 규칙을 추가해보세요.");
        setRules([newRule()]);
        setLoaded(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const addRule = () => {
    setRules((prev) => [...prev, { ...newRule(), sortOrder: prev.length }]);
  };

  const removeRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRule = (idx: number, field: keyof ValidationRule, value: string | number) => {
    setRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    const valid = rules.every((r) => r.ruleType && r.errorMessage?.trim());
    if (!valid) {
      setError("모든 규칙에 유형과 오류 메시지를 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await validationRulesApi.save(policyId, rules);
      setRules(saved);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const ruleTypeHint = (type: string) =>
    RULE_TYPES.find((r) => r.value === type)?.hint ?? "";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-xs gap-1.5 h-7 border-blue-200 text-blue-700 hover:bg-blue-50"
        onClick={() => handleOpen(true)}
      >
        <Settings2 className="h-3.5 w-3.5" />
        검증 규칙
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-600" />
              VALIDATION 규칙 편집
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{policyTitle}</p>
          </DialogHeader>

          <div className="flex-1 overflow-auto mt-2 space-y-3 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>규칙을 불러오는 중...</span>
              </div>
            ) : (
              <>
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700">{error}</p>
                  </div>
                )}

                <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
                  <p className="text-xs text-blue-700">
                    💡 각 필드에 대한 검증 규칙을 정의하세요. 순서대로 검증이 실행됩니다.
                  </p>
                </div>

                {/* 규칙 목록 */}
                <div className="space-y-3">
                  {rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border p-3 space-y-3 bg-muted/20"
                    >
                      {/* 헤더: 순번 + 삭제 */}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          규칙 #{idx + 1}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => removeRule(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* 필드명 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">필드명</Label>
                          <Input
                            placeholder="예: productName, email"
                            value={rule.fieldName ?? ""}
                            onChange={(e) => updateRule(idx, "fieldName", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* 규칙 유형 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">규칙 유형</Label>
                          <Select
                            value={rule.ruleType}
                            onValueChange={(v) => updateRule(idx, "ruleType", v ?? "REQUIRED")}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RULE_TYPES.map((rt) => (
                                <SelectItem key={rt.value} value={rt.value} className="text-xs">
                                  {rt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 규칙 값 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            값{" "}
                            <span className="text-muted-foreground/60">
                              ({ruleTypeHint(rule.ruleType)})
                            </span>
                          </Label>
                          <Input
                            placeholder={ruleTypeHint(rule.ruleType)}
                            value={rule.ruleValue ?? ""}
                            onChange={(e) => updateRule(idx, "ruleValue", e.target.value)}
                            className="h-8 text-xs"
                            disabled={rule.ruleType === "REQUIRED"}
                          />
                        </div>

                        {/* 오류 메시지 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            오류 메시지 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="예: 상품명을 입력해주세요"
                            value={rule.errorMessage ?? ""}
                            onChange={(e) => updateRule(idx, "errorMessage", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 규칙 추가 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed text-xs gap-1.5"
                  onClick={addRule}
                >
                  <Plus className="h-3.5 w-3.5" />
                  규칙 추가
                </Button>
              </>
            )}
          </div>

          {/* 저장 버튼 */}
          {!loading && (
            <div className="flex justify-end gap-2 pt-3 border-t mt-3">
              <Button variant="outline" size="sm" onClick={() => handleOpen(false)}>
                닫기
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className={saved ? "bg-green-600 hover:bg-green-600" : ""}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />저장 중...</>
                ) : saved ? (
                  <><Check className="h-4 w-4 mr-2" />저장됨!</>
                ) : (
                  "저장"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
