"use client";

import { useState } from "react";
import { CheckCircle2, Circle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
}

function buildChecklistFromCr(title: string, description: string, desiredState?: string): CheckItem[] {
  const items: CheckItem[] = [];
  let idx = 0;

  // desiredState가 있으면 각 줄을 항목으로 변환
  if (desiredState) {
    const lines = desiredState.split(/[\n\r]+/).map((l) => l.trim()).filter((l) => l.length > 5);
    lines.slice(0, 6).forEach((line) => {
      items.push({ id: `ds-${idx++}`, label: line, checked: false });
    });
  }

  // description에서 추가 항목 추출
  if (description) {
    const lines = description.split(/[\n\r]+/).map((l) => l.trim()).filter((l) => l.length > 8);
    lines.slice(0, 4).forEach((line) => {
      if (!items.some((i) => i.label === line)) {
        items.push({ id: `desc-${idx++}`, label: line, checked: false });
      }
    });
  }

  // 기본 항목이 없으면 제목 기반으로 생성
  if (items.length === 0) {
    items.push({ id: "t-0", label: `"${title}" 기능이 정상적으로 동작하는지 확인`, checked: false });
    items.push({ id: "t-1", label: "변경 전 동작과 비교하여 차이 없음 확인", checked: false });
    items.push({ id: "t-2", label: "모바일/PC 화면에서 정상 표시 확인", checked: false });
  }

  // 공통 항목 추가
  items.push({ id: "common-0", label: "오류 메시지 없이 정상 완료 확인", checked: false });
  items.push({ id: "common-1", label: "관련 화면/기능에 예상치 못한 영향 없음 확인", checked: false });

  return items;
}

interface TestChecklistProps {
  crId: string;
  title: string;
  description: string;
  desiredState?: string;
}

export function TestChecklist({ crId, title, description, desiredState }: TestChecklistProps) {
  const [items, setItems] = useState<CheckItem[]>(() =>
    buildChecklistFromCr(title, description, desiredState)
  );
  const [showAll, setShowAll] = useState(false);

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const reset = () => {
    setItems((prev) => prev.map((item) => ({ ...item, checked: false })));
  };

  const doneCount = items.filter((i) => i.checked).length;
  const total = items.length;
  const allDone = doneCount === total;
  const displayItems = showAll ? items : items.slice(0, 5);

  return (
    <div className="space-y-3">
      {/* 진행률 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {doneCount}/{total} 항목 확인 완료
          </span>
          {allDone && (
            <Badge className="bg-green-500 text-white text-xs">✓ 전체 완료</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 mr-1" />
          초기화
        </Button>
      </div>

      {/* 진행률 바 */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            allDone ? "bg-green-500" : "bg-primary"
          }`}
          style={{ width: `${(doneCount / total) * 100}%` }}
        />
      </div>

      {/* 체크리스트 항목 */}
      <div className="space-y-2">
        {displayItems.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
              item.checked
                ? "bg-green-50 border-green-200 opacity-70"
                : "bg-background hover:bg-accent"
            }`}
          >
            {item.checked ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
            )}
            <span
              className={`text-sm leading-relaxed ${
                item.checked ? "line-through text-muted-foreground" : ""
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {items.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? `▲ 접기` : `▼ 나머지 ${items.length - 5}개 더 보기`}
        </Button>
      )}
    </div>
  );
}
