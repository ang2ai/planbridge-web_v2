"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { policiesApi, type PolicyImpact } from "@/lib/api";
import { BarChart2, Loader2 } from "lucide-react";

interface PolicyImpactSheetProps {
  policyId: string;
  policyTitle: string;
}

export function PolicyImpactSheet({ policyId, policyTitle }: PolicyImpactSheetProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [impact, setImpact] = useState<PolicyImpact | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !impact) {
      setLoading(true);
      setError(null);
      try {
        const data = await policiesApi.impact(policyId);
        setImpact(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "영향 범위 분석을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-7 px-2 text-xs")}>
        <BarChart2 className="h-3 w-3 mr-1" />
        영향 분석
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>정책 영향 범위 분석</SheetTitle>
          <SheetDescription className="line-clamp-2">{policyTitle}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              분석 중...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {impact && !loading && (
            <>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">
                  이 정책은{" "}
                  <span className="text-primary font-bold text-base">
                    {impact.affectedCount}개
                  </span>{" "}
                  컴포넌트에 영향을 미칩니다.
                </p>
                {impact.scope && (
                  <p className="text-xs text-muted-foreground mt-1">
                    적용 범위: <Badge variant="outline" className="text-[10px]">{impact.scope}</Badge>
                  </p>
                )}
              </div>

              {impact.affectedComponents.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    영향 받는 컴포넌트
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {impact.affectedComponents.map((comp) => (
                      <div
                        key={comp.componentId}
                        className="rounded-md border px-3 py-2 text-sm"
                      >
                        <p className="font-medium">{comp.componentName}</p>
                        {comp.pagePath && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {comp.pagePath}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  영향 받는 컴포넌트가 없습니다.
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
