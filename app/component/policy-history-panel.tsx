"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";
import { policiesApi, type Policy, type PolicyVersion } from "@/lib/api";
import { POLICY_TYPE_LABELS, POLICY_TYPE_COLORS } from "@/lib/labels";

interface PolicyHistoryPanelProps {
  policies: Policy[];
}

interface HistoryState {
  [policyId: string]: {
    open: boolean;
    loading: boolean;
    versions: PolicyVersion[];
  };
}

export function PolicyHistoryPanel({ policies }: PolicyHistoryPanelProps) {
  const [state, setState] = useState<HistoryState>({});

  const toggleHistory = async (policyId: string) => {
    const current = state[policyId];

    if (current?.open) {
      setState((prev) => ({
        ...prev,
        [policyId]: { ...prev[policyId], open: false },
      }));
      return;
    }

    if (current?.versions?.length > 0) {
      setState((prev) => ({
        ...prev,
        [policyId]: { ...prev[policyId], open: true },
      }));
      return;
    }

    // 이력 로드
    setState((prev) => ({
      ...prev,
      [policyId]: { open: true, loading: true, versions: [] },
    }));

    try {
      const versions = await policiesApi.history(policyId);
      setState((prev) => ({
        ...prev,
        [policyId]: { open: true, loading: false, versions },
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        [policyId]: { open: false, loading: false, versions: [] },
      }));
    }
  };

  return (
    <div className="space-y-3">
      {policies.map((policy) => {
        const hist = state[policy.policyId];
        const isOpen = hist?.open ?? false;

        return (
          <Card key={policy.policyId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                      POLICY_TYPE_COLORS[policy.policyType] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {POLICY_TYPE_LABELS[policy.policyType] ?? policy.policyType}
                  </span>
                  <CardTitle className="text-sm">{policy.policyTitle}</CardTitle>
                  <Badge variant="outline" className="text-xs">v{policy.currentVersion}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs gap-1"
                  onClick={() => toggleHistory(policy.policyId)}
                >
                  <Clock className="h-3.5 w-3.5" />
                  이력 {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
              </div>
            </CardHeader>

            {isOpen && (
              <CardContent>
                {hist?.loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    이력 불러오는 중...
                  </div>
                ) : hist?.versions?.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    이전 버전 이력이 없습니다. (현재 버전: v{policy.currentVersion})
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      총 {hist.versions.length}개의 이전 버전
                    </p>
                    {hist.versions.map((ver) => (
                      <div key={ver.versionId} className="rounded-md border p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">v{ver.versionNo}</Badge>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{ver.createdBy}</span>
                            <span>{new Date(ver.createdAt).toLocaleDateString("ko-KR")}</span>
                          </div>
                        </div>
                        {ver.changeReason && (
                          <p className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                            📝 변경 사유: {ver.changeReason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {ver.policyContent}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
