"use client";

import { useRole, ROLE_META, type UserRole } from "@/lib/role-context";
import { BrainCircuit } from "lucide-react";

export function RoleGate({ children }: { children: React.ReactNode }) {
  const { role, setRole, isLoaded } = useRole();

  // 로드 전에는 아무것도 안 보여줌 (hydration mismatch 방지)
  if (!isLoaded) return null;

  // 역할이 선택된 경우 → 앱 정상 표시
  if (role) return <>{children}</>;

  // 역할 미선택 → 선택 화면 표시
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* 로고 */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BrainCircuit className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold tracking-tight">PlanBridge</span>
          </div>
          <p className="text-muted-foreground text-lg">
            어떤 역할로 시작할까요?
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            나중에 언제든지 오른쪽 위 버튼으로 바꿀 수 있어요
          </p>
        </div>

        {/* 역할 선택 카드 */}
        <div className="grid gap-4 sm:grid-cols-3">
          {(["planner", "developer", "operator"] as UserRole[]).map((r) => {
            if (!r) return null;
            const meta = ROLE_META[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="group relative rounded-2xl border-2 border-border bg-white p-8 text-left
                           hover:border-primary hover:shadow-lg transition-all duration-200
                           focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {/* 이모지 */}
                <div className="text-5xl mb-4">{meta.emoji}</div>

                {/* 역할명 */}
                <h2 className="text-2xl font-bold mb-2">{meta.label}</h2>

                {/* 설명 */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {meta.description}
                </p>

                {/* 호버 화살표 */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-primary text-2xl">
                  →
                </div>

                {/* 역할별 색상 줄 */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${meta.badgeColor} opacity-0 group-hover:opacity-100 transition-opacity`}
                />
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          선택한 역할은 이 브라우저에만 저장돼요 · 서버에 전송되지 않아요
        </p>
      </div>
    </div>
  );
}
