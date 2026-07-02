import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { changeRequestsApi, todosApi, type ChangeRequest, type Todo } from "@/lib/api";
import { CR_STEPS, getCrStepIndex, PRIORITY_LABELS, PRIORITY_DOT } from "@/lib/labels";
import { CrCompleteButton } from "./cr-complete-button";
import { TestChecklist } from "./test-checklist";

async function getData(id: string) {
  try {
    const [cr, todos] = await Promise.all([
      changeRequestsApi.get(id),
      changeRequestsApi.getTodos(id).catch(() => [] as Todo[]),
    ]);
    return { cr, todos };
  } catch {
    return null;
  }
}

export default async function ChangeRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();

  const { cr, todos } = data;
  const currentStep = getCrStepIndex(cr.status);
  const doneTodos = todos.filter((t) => t.status === "DONE").length;
  const progressPct = todos.length > 0 ? Math.round((doneTodos / todos.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/change-requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            변경 요청 목록
          </Button>
        </Link>
      </div>

      {/* 제목 카드 */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`h-3 w-3 rounded-full ${PRIORITY_DOT[cr.priority] ?? "bg-gray-400"}`}
                />
                <h1 className="text-xl font-bold">{cr.title}</h1>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {cr.requestedBy}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(cr.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={cr.status} type="cr" />
              <span className="text-xs text-muted-foreground">
                우선순위: {PRIORITY_LABELS[cr.priority] ?? cr.priority}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 요청 내용 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">요청 내용</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cr.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                요청 설명
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{cr.description}</p>
            </div>
          )}
          {cr.currentState && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                현재 상태
              </p>
              <div className="rounded-md bg-muted p-3 text-sm">{cr.currentState}</div>
            </div>
          )}
          {cr.desiredState && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                원하는 상태
              </p>
              <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-sm">
                {cr.desiredState}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 진행 상황 스테퍼 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">진행 상황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {CR_STEPS.map((step, i) => {
              const isPast = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  {isPast ? (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  ) : isCurrent ? (
                    <div className="h-5 w-5 rounded-full border-2 border-primary bg-primary/10 shrink-0 mt-0.5 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        isCurrent ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {/* 개발중 단계에서 진행률 표시 */}
                    {isCurrent && cr.status === "IN_PROGRESS" && todos.length > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>TODO {todos.length}건 중 {doneTodos}건 완료</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* TODO 목록 */}
      {todos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">TODO 목록</CardTitle>
              <Badge variant="secondary">{todos.length}건</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {todos.map((todo) => (
              <Link key={todo.todoId} href="/todos">
                <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    {todo.status === "DONE" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <p className="text-sm truncate">{todo.title}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <StatusBadge status={todo.status} type="todo" />
                    <StatusBadge status={todo.complexity} type="complexity" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI 분석 결과 */}
      {cr.aiAnalysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🤖 AI 분석 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {cr.aiAnalysis}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 테스트 체크리스트 (TESTING 상태일 때) */}
      {cr.status === "TESTING" && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">✅ 테스트 체크리스트</CardTitle>
              <Badge variant="outline" className="text-amber-600 border-amber-400">테스트중</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              아래 항목을 하나씩 확인하고 체크해주세요. 모두 완료되면 운영 반영 버튼이 활성화됩니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <TestChecklist
              crId={cr.requestId}
              title={cr.title}
              description={cr.description ?? ""}
              desiredState={cr.desiredState}
            />
          </CardContent>
        </Card>
      )}

      {/* 완료 처리 버튼 (TESTING 상태일 때) */}
      {cr.status === "TESTING" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">테스트가 완료됐나요?</p>
                <p className="text-sm text-green-700 mt-1">
                  체크리스트를 모두 확인했다면 운영 반영으로 처리해주세요.
                </p>
              </div>
              <CrCompleteButton crId={cr.requestId} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
