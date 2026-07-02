"use client";

import { cn } from "@/lib/utils";
import { POLICY_TYPE_ICONS, POLICY_TYPE_LABELS, POLICY_TYPE_DESC } from "@/lib/labels";

const TYPES = [
  { value: "VALIDATION" },
  { value: "UI_SPEC" },
  { value: "INTERACTION" },
  { value: "BIZ_RULE" },
  { value: "DATA_SPEC" },
  { value: "PERMISSION" },
  {
    value: "AUTO",
    icon: "🤖",
    label: "AI에게 맡기기",
    desc: "정책 내용만 입력하면 AI가 유형을 자동 판단합니다",
  },
];

interface PolicyTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PolicyTypeSelector({ value, onChange }: PolicyTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {TYPES.map((t) => {
        const icon = t.icon ?? POLICY_TYPE_ICONS[t.value] ?? "📋";
        const label = t.label ?? POLICY_TYPE_LABELS[t.value] ?? t.value;
        const desc = t.desc ?? POLICY_TYPE_DESC[t.value] ?? "";
        const selected = value === t.value;

        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "rounded-lg border p-3 text-left transition-all hover:border-primary/60",
              selected
                ? "border-2 border-primary bg-primary/5 shadow-sm"
                : "border border-border bg-background hover:bg-accent/30"
            )}
          >
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{desc}</div>
          </button>
        );
      })}
    </div>
  );
}
