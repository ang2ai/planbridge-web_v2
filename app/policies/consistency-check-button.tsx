"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { policiesApi, type PolicyConsistencyResult, type PolicyConsistencyIssue } from "@/lib/api";

const severityColors: Record<
  PolicyConsistencyIssue["severity"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "destructive",
  CRITICAL: "destructive",
};

interface ConsistencyCheckButtonProps {
  projectId?: string;
}

export function ConsistencyCheckButton({ projectId }: ConsistencyCheckButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PolicyConsistencyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputProjectId, setInputProjectId] = useState(projectId ?? "");

  const handleCheck = async () => {
    const pid = inputProjectId.trim();
    if (!pid) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await policiesApi.consistencyCheck(pid);
      setResult(data);
      setOpen(true);
    } catch {
      setError("일관성 검사에 실패했습니다. Project ID를 확인하세요.");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {!projectId && (
          <input
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-xs"
            placeholder="Project ID 입력 후 검사"
            value={inputProjectId}
            onChange={(e) => setInputProjectId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCheck();
            }}
          />
        )}
        <Button
          variant="outline"
          onClick={handleCheck}
          disabled={loading || !inputProjectId.trim()}
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          {loading ? "검사 중..." : "일관성 검사"}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              정책 일관성 검사 결과
            </DialogTitle>
            <DialogDescription>
              Project ID: {inputProjectId}
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold">{result.totalPolicies}</div>
                  <div className="text-xs text-muted-foreground mt-1">검사한 정책</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div
                    className={`text-2xl font-bold ${
                      result.issueCount > 0 ? "text-destructive" : "text-green-600"
                    }`}
                  >
                    {result.issueCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">발견된 문제</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-muted-foreground">검사 시각</div>
                  <div className="text-sm font-medium mt-1">
                    {new Date(result.checkedAt).toLocaleString("ko-KR")}
                  </div>
                </div>
              </div>

              {result.issueCount === 0 ? (
                <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <p className="text-sm text-green-700 font-medium">
                    모든 정책이 일관성 기준을 통과했습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    발견된 문제 목록
                  </div>
                  {result.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{issue.policyTitle}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {issue.policyId}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            {issue.issueType.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant={severityColors[issue.severity]} className="text-[10px]">
                            {issue.severity}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
