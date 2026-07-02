"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";

const POLICY_TYPE_LABELS: Record<string, string> = {
  BUSINESS_RULE: "업무 규칙",
  UI_SPEC: "화면 명세",
  INTERACTION: "동작 방식",
  VALIDATION: "입력 검증",
  TEXT_CONTENT: "텍스트 내용",
  API_SPEC: "API 연동",
};

const POLICY_TYPE_DESCRIPTIONS: Record<string, string> = {
  BUSINESS_RULE: "비즈니스 로직, 조건, 예외 처리",
  UI_SPEC: "레이아웃, 색상, 크기, 배치",
  INTERACTION: "클릭, 스크롤, 애니메이션 등 상호작용",
  VALIDATION: "필수값, 형식, 범위 등 유효성 검사",
  TEXT_CONTENT: "버튼 문구, 안내 메시지, 레이블",
  API_SPEC: "데이터 연동, 엔드포인트, 요청/응답",
};

interface Recommendation {
  recommendedType: string;
  confidence: number;
  reason: string;
  alternatives: Array<{ type: string; reason: string }>;
}

interface Props {
  onSelect: (policyType: string) => void;
  selectedType?: string;
}

export function PolicyTypeRecommender({ onSelect, selectedType }: Props) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRecommend() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const res = await fetch("/api/ai/recommend-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error("AI 추천 실패");
      const data = await res.json();
      setRecommendation(data);
      onSelect(data.recommendedType);
    } catch {
      setError("AI 추천을 가져오지 못했습니다. 직접 선택해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">정책 내용 설명</label>
        <Textarea
          placeholder="어떤 정책을 등록하려는지 설명해주세요. 예: '장바구니 담기 버튼은 재고가 없으면 비활성화됩니다'"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRecommend}
          disabled={!description.trim() || loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          AI 정책 유형 추천
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {recommendation && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI 추천 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">추천 유형</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className="cursor-pointer"
                  onClick={() => onSelect(recommendation.recommendedType)}
                >
                  {POLICY_TYPE_LABELS[recommendation.recommendedType] || recommendation.recommendedType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  확신도 {Math.round(recommendation.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{recommendation.reason}</p>
            </div>

            {recommendation.alternatives.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">다른 선택지</p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.alternatives.map((alt) => (
                    <Badge
                      key={alt.type}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => onSelect(alt.type)}
                      title={alt.reason}
                    >
                      {POLICY_TYPE_LABELS[alt.type] || alt.type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <p className="text-xs text-muted-foreground mb-2">또는 직접 선택:</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(POLICY_TYPE_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                selectedType === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {POLICY_TYPE_DESCRIPTIONS[value]}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
