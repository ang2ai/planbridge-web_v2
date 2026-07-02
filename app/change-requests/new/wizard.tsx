"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronRight, ChevronLeft, Send, Lightbulb } from "lucide-react";
import { changeRequestsApi } from "@/lib/api";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const PRIORITIES: {
  value: Priority;
  emoji: string;
  label: string;
  description: string;
  borderColor: string;
  selectedColor: string;
}[] = [
  {
    value: "LOW",
    emoji: "🟢",
    label: "낮음",
    description: "여유 있을 때 처리해도 돼요",
    borderColor: "border-slate-200 hover:border-slate-400",
    selectedColor: "border-slate-500 bg-slate-50 ring-2 ring-slate-200",
  },
  {
    value: "MEDIUM",
    emoji: "🔵",
    label: "보통",
    description: "일반적인 우선순위예요",
    borderColor: "border-blue-200 hover:border-blue-400",
    selectedColor: "border-blue-500 bg-blue-50 ring-2 ring-blue-200",
  },
  {
    value: "HIGH",
    emoji: "🟡",
    label: "높음",
    description: "빠른 처리가 필요해요",
    borderColor: "border-amber-200 hover:border-amber-400",
    selectedColor: "border-amber-500 bg-amber-50 ring-2 ring-amber-200",
  },
  {
    value: "CRITICAL",
    emoji: "🔴",
    label: "긴급",
    description: "지금 당장 처리가 필요해요",
    borderColor: "border-red-200 hover:border-red-400",
    selectedColor: "border-red-500 bg-red-50 ring-2 ring-red-300",
  },
];

const STEPS = [
  { label: "변경 대상", desc: "어떤 화면의 무엇을 바꾸고 싶으세요?" },
  { label: "변경 내용", desc: "어떻게 바꾸고 싶으세요?" },
];

export function NewChangeRequestWizard() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [componentId, setComponentId] = useState("");
  const [currentState, setCurrentState] = useState("");

  // Step 2
  const [title, setTitle] = useState("");
  const [desiredState, setDesiredState] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");

  const handleNext = () => {
    if (!componentId.trim()) return;
    if (!title) {
      setTitle(`${componentId} 변경 요청`);
    }
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !desiredState.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      // componentId가 UUID 형식(36자 하이픈 포함)이면 실제 컴포넌트 ID로, 아니면 자유 텍스트 설명으로 전송
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(componentId.trim());
      await changeRequestsApi.create({
        componentId: isUuid ? componentId.trim() : undefined,
        componentDescription: !isUuid ? componentId.trim() : undefined,
        requestedBy: "planner",
        title: title.trim(),
        description: `[현재 상태]\n${currentState || "(미입력)"}\n\n[원하는 상태]\n${desiredState}`,
        currentState: currentState.trim() || undefined,
        desiredState: desiredState.trim(),
        priority,
      });
      router.push("/change-requests");
    } catch {
      setError("제출에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 스텝 인디케이터 */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border-2 transition-colors ${
                i < step
                  ? "bg-primary border-primary text-primary-foreground"
                  : i === step
                  ? "border-primary text-primary bg-primary/5"
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className="hidden sm:block">
              <p className={`text-sm font-medium ${i === step ? "text-primary" : "text-muted-foreground"}`}>
                {s.label}
              </p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 sm:w-16 mx-1 ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>어떤 화면의 무엇을 바꾸고 싶으세요?</CardTitle>
            <CardDescription>
              💡 <strong>Chrome 익스텐션</strong>을 쓰면 화면에서 직접 요소를 클릭해서 자동으로 연결할 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="componentId">
                요소 이름 또는 위치 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="componentId"
                placeholder="예) 상품 관리 페이지 > 할인율 입력 필드"
                value={componentId}
                onChange={(e) => setComponentId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && componentId.trim()) handleNext();
                }}
              />
              <p className="text-xs text-muted-foreground">
                어느 페이지의 어떤 요소인지 알 수 있게 적어주세요. (익스텐션으로 클릭하면 자동 입력됩니다)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentState">
                지금 어떻게 되어있나요?
              </Label>
              <Textarea
                id="currentState"
                placeholder="예: 할인율이 최대 90%까지만 설정 가능한데, 시즌 특가 때 95%까지 필요합니다."
                rows={4}
                value={currentState}
                onChange={(e) => setCurrentState(e.target.value)}
              />
            </div>

            {/* 팁 박스 */}
            <div className="flex gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3">
              <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                현재 상태를 구체적으로 적을수록 AI가 더 정확한 개발 TODO를 만들어줘요.
                불편한 점, 발생하는 문제, 현재 제한 사항 등을 자유롭게 적어주세요.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNext} disabled={!componentId.trim()}>
                다음 단계
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>어떻게 바꾸고 싶으세요?</CardTitle>
            <CardDescription>
              원하는 상태를 구체적으로 설명해주세요. AI가 개발 작업 목록을 자동으로 만들어드려요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Step 1 요약 */}
            <div className="rounded-lg bg-muted/50 border p-3 space-y-2 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                변경 대상
              </p>
              <p className="font-medium">{componentId}</p>
              {currentState && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">
                    현재 상태
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                    {currentState}
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                요청 제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="예) 할인율 최대 95%로 상향, 슈퍼관리자 전용 설정 추가"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desiredState">
                어떻게 바뀌었으면 하나요? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="desiredState"
                placeholder={`예:
- 최대 할인율을 90%에서 95%로 올려주세요
- 90% 초과 할인은 슈퍼관리자 권한이 있는 계정만 설정 가능하게 해주세요
- 90% 초과 시 사유 입력 필드가 나타나도록 해주세요`}
                rows={6}
                value={desiredState}
                onChange={(e) => setDesiredState(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                구체적일수록 개발자가 정확하게 구현할 수 있어요.
              </p>
            </div>

            {/* 우선순위 선택 */}
            <div className="space-y-3">
              <Label>얼마나 급한가요?</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      priority === p.value ? p.selectedColor : `${p.borderColor} bg-background`
                    }`}
                  >
                    <div className="text-lg mb-1">{p.emoji}</div>
                    <div className="font-semibold text-sm">{p.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {p.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(0)} disabled={submitting}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                이전
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !desiredState.trim()}
                className="min-w-32"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "제출 중..." : "제출하기"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              제출 후 AI가 자동으로 개발 TODO 목록을 만들어드려요 🤖
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
