import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  GitPullRequestArrow,
  Shield,
  Plus,
  Zap,
  Search,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  changeRequestsApi,
  projectsApi,
  todosApi,
  policiesApi,
  type ChangeRequest,
  type Project,
  type Todo,
} from "@/lib/api";
import {
  PRIORITY_DOT,
  PRIORITY_LABELS,
  CR_STATUS_LABELS,
  COMPLEXITY_LABELS,
} from "@/lib/labels";

async function getData() {
  const [changeRequests, projects, pendingTodos, activePolicies] = await Promise.all([
    changeRequestsApi.list().catch(() => [] as ChangeRequest[]),
    projectsApi.list().catch(() => [] as Project[]),
    todosApi.pending().catch(() => [] as Todo[]),
    policiesApi.search("").catch(() => [] as import("@/lib/api").Policy[]),
  ]);
  return { changeRequests, projects, pendingTodos, activePolicies };
}

export default async function DashboardPage() {
  const { changeRequests, projects, pendingTodos, activePolicies } = await getData();

  const activeChangeRequests = changeRequests.filter(
    (c) => c.status !== "DONE" && c.status !== "REJECTED"
  );
  const inProgressCount = changeRequests.filter((c) => c.status === "IN_PROGRESS").length;
  const doneCount = changeRequests.filter((c) => c.status === "DONE").length;

  const hasTodos = pendingTodos.length > 0;
  const hasActiveCRs = activeChangeRequests.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="대시보드"
        description="오늘 해야 할 일과 프로젝트 현황을 한눈에 확인하세요"
      />

      {/* ── 개발자 영역: TODO 목록 ─────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            ⚡ 개발자 — 오늘 할 일
          </h2>
          {hasTodos && (
            <Badge variant="default" className="ml-1">
              {pendingTodos.length}
            </Badge>
          )}
          <Link href="/todos" className="ml-auto">
            <Button variant="ghost" size="sm" className="text-xs">
              전체 보기 →
            </Button>
          </Link>
        </div>

        {!hasTodos ? (
          <Card>
            <CardContent className="py-0">
              <EmptyState
                icon="🎉"
                title="할 일이 없어요!"
                description="기획자가 변경 요청을 등록하면 여기에 TODO가 생성됩니다."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pendingTodos.slice(0, 5).map((todo) => (
              <Link key={todo.todoId} href="/todos">
                <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {todo.status === "IN_PROGRESS" ? (
                          <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-gray-300 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{todo.title}</p>
                          {todo.targetFiles && (
                            <p className="text-[10px] font-mono text-muted-foreground truncate">
                              {todo.targetFiles}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          {COMPLEXITY_LABELS[todo.complexity] ?? todo.complexity}
                        </Badge>
                        <StatusBadge status={todo.status} type="todo" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {pendingTodos.length > 5 && (
              <Link href="/todos">
                <p className="text-xs text-muted-foreground text-center py-2 hover:text-primary transition-colors">
                  + {pendingTodos.length - 5}건 더 보기
                </p>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── 기획자 영역: 변경 요청 현황 ─────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <GitPullRequestArrow className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            📋 기획자 — 변경 요청 현황
          </h2>
          {hasActiveCRs && (
            <Badge variant="outline" className="ml-1">
              진행중 {activeChangeRequests.length}
            </Badge>
          )}
          <Link href="/change-requests" className="ml-auto">
            <Button variant="ghost" size="sm" className="text-xs">
              전체 보기 →
            </Button>
          </Link>
        </div>

        {!hasActiveCRs ? (
          <Card>
            <CardContent className="py-0">
              <EmptyState
                icon="📬"
                title="진행 중인 요청이 없어요"
                description="변경이 필요한 게 있으면 아래 빠른 시작 버튼을 눌러보세요"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeChangeRequests.slice(0, 5).map((cr) => (
              <Link key={cr.requestId} href={`/change-requests/${cr.requestId}`}>
                <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            PRIORITY_DOT[cr.priority] ?? "bg-gray-400"
                          }`}
                        />
                        <p className="text-sm font-medium truncate">{cr.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(cr.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                        <StatusBadge status={cr.status} type="cr" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {activeChangeRequests.length > 5 && (
              <Link href="/change-requests">
                <p className="text-xs text-muted-foreground text-center py-2 hover:text-primary transition-colors">
                  + {activeChangeRequests.length - 5}건 더 보기
                </p>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── 통계 카드 ─────────────────────────────────────── */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            icon={<FolderKanban className="h-4 w-4 text-muted-foreground" />}
            label="프로젝트"
            value={projects.length}
            sub="등록된 프로젝트"
          />
          <StatCard
            icon={<GitPullRequestArrow className="h-4 w-4 text-muted-foreground" />}
            label="변경 요청"
            value={changeRequests.length}
            sub={`개발중 ${inProgressCount}건`}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            label="완료된 요청"
            value={doneCount}
            sub="이번 전체"
          />
          <StatCard
            icon={<Shield className="h-4 w-4 text-violet-500" />}
            label="등록된 정책"
            value={activePolicies.length}
            sub="전체 정책 수"
          />
          <StatCard
            icon={<Zap className="h-4 w-4 text-blue-500" />}
            label="대기 중 TODO"
            value={pendingTodos.length}
            sub="개발 필요 항목"
          />
        </div>
      </section>

      {/* ── 빠른 시작 ─────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
          빠른 시작
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            href="/change-requests/new"
            icon="✏️"
            title="변경 요청 등록"
            desc="바꾸고 싶은 내용을 단계별 가이드로 쉽게 등록하세요"
          />
          <QuickAction
            href="/plans/new"
            icon="📄"
            title="신규 화면 기획"
            desc="AI가 기존 정책을 참고해서 기획서를 함께 작성해드려요"
          />
          <QuickAction
            href="/policies"
            icon="🔍"
            title="정책 검색"
            desc="기존에 등록된 정책을 찾아보거나 새로 등록하세요"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <div className="rounded-lg border p-4 hover:bg-accent hover:border-primary/30 cursor-pointer transition-all h-full">
        <div className="text-2xl mb-2">{icon}</div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}
