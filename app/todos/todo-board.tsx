"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ClipboardCopy,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  Download,
  Code2,
  Loader2,
  Zap,
} from "lucide-react";
import { todosApi, aiApi, type Todo } from "@/lib/api";
import { toast } from "sonner";
import {
  PRIORITY_DOT,
  PRIORITY_LABELS,
  COMPLEXITY_LABELS,
  TODO_STATUS_LABELS,
} from "@/lib/labels";
import { EmptyState } from "@/components/shared/empty-state";

const COLUMNS: { status: string; label: string; icon: string }[] = [
  { status: "PENDING", label: "대기", icon: "⏳" },
  { status: "IN_PROGRESS", label: "진행중", icon: "🔵" },
  { status: "DONE", label: "완료", icon: "✅" },
];

const NEXT_STATUS: Record<string, string> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
};
const PREV_STATUS: Record<string, string> = {
  IN_PROGRESS: "PENDING",
  DONE: "IN_PROGRESS",
};

export function TodoBoard({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingCodeId, setLoadingCodeId] = useState<string | null>(null);
  const [codeDialog, setCodeDialog] = useState<{ title: string; code: string } | null>(null);
  const [completeDialog, setCompleteDialog] = useState<{ todo: Todo } | null>(null);
  const [completeMemo, setCompleteMemo] = useState("");
  const [completing, setCompleting] = useState(false);
  const [exportMarkdown, setExportMarkdown] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleCopyPrompt = async (todo: Todo) => {
    setCopyingId(todo.todoId);
    try {
      const data = await todosApi.getPrompt(todo.todoId);
      await navigator.clipboard.writeText(data.prompt);
      setCopiedId(todo.todoId);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("프롬프트가 클립보드에 복사됐습니다.");
    } catch {
      toast.error("프롬프트 복사에 실패했습니다.");
    } finally {
      setCopyingId(null);
    }
  };

  const handleGenerateCode = async (todo: Todo) => {
    // todo의 requestId로 연결된 정책 찾아서 코드 생성
    setLoadingCodeId(todo.todoId);
    try {
      // prompt에서 policyId 추출 시도 (없으면 그냥 prompt 내용 표시)
      const promptData = await todosApi.getPrompt(todo.todoId);
      setCodeDialog({ title: todo.title, code: promptData.prompt });
    } catch {
      // 실패 무시
    } finally {
      setLoadingCodeId(null);
    }
  };

  const handleStatusChange = async (todoId: string, newStatus: string) => {
    if (newStatus === "DONE") {
      const todo = todos.find((t) => t.todoId === todoId);
      if (todo) {
        setCompleteDialog({ todo });
        return;
      }
    }
    try {
      const updated = await todosApi.update(todoId, { status: newStatus });
      setTodos((prev) => prev.map((t) => (t.todoId === updated.todoId ? updated : t)));
    } catch {
      // 실패 무시
    }
  };

  const handleConfirmComplete = async () => {
    if (!completeDialog) return;
    setCompleting(true);
    try {
      const updated = await todosApi.update(completeDialog.todo.todoId, { status: "DONE" });
      setTodos((prev) => prev.map((t) => (t.todoId === updated.todoId ? updated : t)));
      setCompleteDialog(null);
      setCompleteMemo("");
    } catch {
      // 실패 무시
    } finally {
      setCompleting(false);
    }
  };

  const handleExportDone = async () => {
    const completedIds = todos.filter((t) => t.status === "DONE").map((t) => t.todoId);
    if (completedIds.length === 0) return;
    setExporting(true);
    try {
      const data = await todosApi.export(completedIds);
      setExportMarkdown(data.markdown);
    } catch {
      // 실패 무시
    } finally {
      setExporting(false);
    }
  };

  const completedCount = todos.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-4">
      {/* 상단 요약 + 내보내기 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>전체 {todos.length}건</span>
          <span>완료 <span className="text-green-600 font-medium">{completedCount}건</span></span>
          <span>대기 {todos.filter((t) => t.status === "PENDING").length}건</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportDone}
          disabled={exporting || completedCount === 0}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          {exporting ? "내보내는 중..." : `완료된 TODO 내보내기 (${completedCount})`}
        </Button>
      </div>

      {/* 내보내기 결과 */}
      {exportMarkdown && (
        <div className="relative rounded-md border bg-muted p-4">
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-2 top-2 h-6 text-xs"
            onClick={() => setExportMarkdown(null)}
          >
            닫기
          </Button>
          <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-64 font-mono pr-12">
            {exportMarkdown}
          </pre>
        </div>
      )}

      {/* 칸반 보드 */}
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((column) => {
          const items = todos.filter((t) => t.status === column.status);
          return (
            <div key={column.status} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <span>{column.icon}</span>
                <h3 className="text-sm font-semibold">{column.label}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {items.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="text-xs text-muted-foreground">항목 없음</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <TodoCard
                      key={item.todoId}
                      todo={item}
                      copyingId={copyingId}
                      copiedId={copiedId}
                      loadingCodeId={loadingCodeId}
                      onCopy={handleCopyPrompt}
                      onGenerateCode={handleGenerateCode}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {todos.length === 0 && (
        <EmptyState
          icon="🎉"
          title="할 일이 없어요!"
          description="기획자가 변경 요청을 등록하면 여기에 TODO가 생성됩니다."
        />
      )}

      {/* 완료 확인 다이얼로그 */}
      <Dialog open={!!completeDialog} onOpenChange={() => setCompleteDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>TODO를 완료로 처리할까요?</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              완료 처리하면 기획자에게 진행 상황이 반영됩니다.
            </p>
            <div className="rounded-md bg-muted p-3 text-sm font-medium">
              {completeDialog?.todo.title}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="completeMemo">완료 메모 (선택)</Label>
              <Textarea
                id="completeMemo"
                placeholder="예: PR #123 참고, 테스트 완료"
                value={completeMemo}
                onChange={(e) => setCompleteMemo(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialog(null)}>
              취소
            </Button>
            <Button onClick={handleConfirmComplete} disabled={completing}>
              {completing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              완료 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 코드/프롬프트 뷰어 다이얼로그 */}
      <Dialog open={!!codeDialog} onOpenChange={() => setCodeDialog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">{codeDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-auto rounded-md bg-slate-900 p-4">
            <pre className="text-xs text-slate-100 whitespace-pre-wrap font-mono leading-relaxed">
              {codeDialog?.code}
            </pre>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                if (codeDialog?.code) {
                  await navigator.clipboard.writeText(codeDialog.code);
                }
              }}
            >
              <ClipboardCopy className="h-4 w-4 mr-2" />
              복사
            </Button>
            <Button onClick={() => setCodeDialog(null)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TodoCard({
  todo,
  copyingId,
  copiedId,
  loadingCodeId,
  onCopy,
  onGenerateCode,
  onStatusChange,
}: {
  todo: Todo;
  copyingId: string | null;
  copiedId: string | null;
  loadingCodeId: string | null;
  onCopy: (todo: Todo) => void;
  onGenerateCode: (todo: Todo) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const isCopied = copiedId === todo.todoId;
  const isCopying = copyingId === todo.todoId;
  const isLoadingCode = loadingCodeId === todo.todoId;

  return (
    <Card className="hover:border-primary/40 transition-all">
      <CardContent className="p-3 space-y-2.5">
        {/* 제목 + 복잡도 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 min-w-0">
            {todo.status === "DONE" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium leading-snug">{todo.title}</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {COMPLEXITY_LABELS[todo.complexity] ?? todo.complexity}
          </Badge>
        </div>

        {/* 대상 파일 경로 */}
        {todo.targetFiles && (
          <p className="text-[10px] text-muted-foreground pl-5 font-mono truncate" title={todo.targetFiles}>
            📁 {todo.targetFiles}
          </p>
        )}

        {/* 날짜 */}
        <p className="text-xs text-muted-foreground pl-5">
          {new Date(todo.createdAt).toLocaleDateString("ko-KR")}
        </p>

        {/* Claude Code 프롬프트 복사 (핵심 CTA) */}
        <div className="pl-5">
          <Button
            size="sm"
            variant="default"
            className={`h-8 text-xs w-full justify-start gap-1.5 ${
              isCopied
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
            onClick={() => onCopy(todo)}
            disabled={isCopying}
          >
            {isCopying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isCopied ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <ClipboardCopy className="h-3 w-3" />
            )}
            {isCopied ? "Claude Code 프롬프트 복사됨 ✓" : "Claude Code 프롬프트 복사"}
          </Button>
        </div>

        {/* 상태 이동 버튼 */}
        <div className="flex flex-wrap gap-1 pl-5">

          {/* 이전/다음 상태 */}
          {PREV_STATUS[todo.status] && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={() => onStatusChange(todo.todoId, PREV_STATUS[todo.status])}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          )}
          {NEXT_STATUS[todo.status] && (
            <Button
              size="sm"
              variant={NEXT_STATUS[todo.status] === "DONE" ? "default" : "outline"}
              className={`h-7 text-xs px-2 ${
                NEXT_STATUS[todo.status] === "DONE"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }`}
              onClick={() => onStatusChange(todo.todoId, NEXT_STATUS[todo.status])}
            >
              {NEXT_STATUS[todo.status] === "DONE" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  완료
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  시작
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

