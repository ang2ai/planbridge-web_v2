"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BrainCircuit } from "lucide-react";
import { changeRequestsApi, type ChangeRequest } from "@/lib/api";

const statusColors: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  AI_PROCESSING: "outline",
  AI_FAILED: "destructive",
  READY: "default",
  IN_PROGRESS: "default",
  TESTING: "outline",
  DONE: "secondary",
  REJECTED: "destructive",
};

const priorityColors: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  LOW: "secondary",
  MEDIUM: "outline",
  HIGH: "default",
  CRITICAL: "destructive",
};

export function ChangeRequestsTable({
  changeRequests,
}: {
  changeRequests: ChangeRequest[];
}) {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const router = useRouter();

  // 분석 완료(또는 실패)까지 status를 폴링한다.
  // 큐 상태: QUEUED → PROCESSING → COMPLETED / FAILED
  const pollUntilDone = async (id: string): Promise<"COMPLETED" | "FAILED" | "TIMEOUT"> => {
    // 실측: CHANGE_REQUEST agentic 분석이 ~2분 소요 → 여유 두고 4분까지 폴링.
    const maxAttempts = 120; // 2초 간격 × 120 = 최대 4분
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const { status } = await changeRequestsApi.status(id);
        if (status === "COMPLETED") return "COMPLETED";
        if (status === "FAILED") return "FAILED";
      } catch {
        // 일시적 조회 실패는 무시하고 계속 폴링
      }
    }
    return "TIMEOUT";
  };

  const handleAnalyze = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnalyzingId(id);
    try {
      await changeRequestsApi.analyze(id);
      toast.info("AI 분석을 시작했습니다. 완료까지 잠시 기다려 주세요.");
      const result = await pollUntilDone(id);
      if (result === "COMPLETED") {
        toast.success("AI 분석이 완료되었습니다. TODO가 생성되었습니다.");
        router.refresh();
      } else if (result === "FAILED") {
        toast.error("AI 분석에 실패했습니다. 상세에서 사유를 확인하세요.");
        router.refresh();
      } else {
        toast.warning("AI 분석이 지연되고 있습니다. 잠시 후 새로고침해 주세요.");
      }
    } catch {
      toast.error("AI 분석 요청에 실패했습니다.");
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requested By</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changeRequests.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center text-muted-foreground py-8"
            >
              변경 요청이 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          changeRequests.map((cr) => (
            <TableRow key={cr.requestId} className="cursor-pointer">
              <TableCell className="font-mono text-xs">
                {cr.requestId.slice(0, 8)}
              </TableCell>
              <TableCell className="font-medium">{cr.title}</TableCell>
              <TableCell>
                <Badge variant={priorityColors[cr.priority] ?? "default"}>
                  {cr.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[cr.status] ?? "default"}>
                  {cr.status.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell>{cr.requestedBy}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(cr.createdAt).toLocaleDateString("ko-KR")}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleAnalyze(cr.requestId, e)}
                  disabled={analyzingId === cr.requestId}
                >
                  <BrainCircuit className="h-3.5 w-3.5 mr-1" />
                  {analyzingId === cr.requestId ? "분석 중..." : "AI 분석"}
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
