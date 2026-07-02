"use client";

import { useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { policiesApi, type PolicyVersion } from "@/lib/api";

interface PolicyHistoryDialogProps {
  policyId: string;
  policyTitle: string;
  currentVersion: number;
}

export function PolicyHistoryDialog({
  policyId,
  policyTitle,
  currentVersion,
}: PolicyHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  const handleOpen = async (val: boolean) => {
    setOpen(val);
    if (val && !loaded) {
      setLoading(true);
      try {
        const data = await policiesApi.history(policyId);
        setVersions(data);
        setLoaded(true);
      } catch {
        setVersions([]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs gap-1 h-7"
        onClick={() => handleOpen(true)}
      >
        <Clock className="h-3.5 w-3.5" />
        이력
      </Button>
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">버전 이력</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{policyTitle}</p>
        </DialogHeader>

        <div className="mt-2">
          {/* 현재 버전 표시 */}
          <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-primary/5 border border-primary/20">
            <Badge className="text-xs">현재 v{currentVersion}</Badge>
            <span className="text-xs text-muted-foreground">최신 버전</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">이력 불러오는 중...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">이전 버전 이력이 없습니다.</p>
              <p className="text-xs mt-1">정책이 수정되면 여기에 이력이 쌓입니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">총 {versions.length}개의 이전 버전</p>
              {versions.map((ver) => (
                <div key={ver.versionId} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">v{ver.versionNo}</Badge>
                    <div className="text-xs text-muted-foreground flex gap-2">
                      <span>{ver.createdBy}</span>
                      <span>{new Date(ver.createdAt).toLocaleDateString("ko-KR")}</span>
                    </div>
                  </div>
                  {ver.changeReason && (
                    <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
                      <p className="text-xs text-blue-700">
                        <span className="font-medium">변경 사유:</span> {ver.changeReason}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">
                    {ver.policyContent}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
