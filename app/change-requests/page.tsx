import Link from "next/link";
import { Plus, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { changeRequestsApi, type ChangeRequest } from "@/lib/api";
import {
  CR_STATUS_LABELS,
  CR_STATUS_COLORS,
  CR_STEPS,
  getCrStepIndex,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_DOT,
} from "@/lib/labels";

async function getChangeRequests(): Promise<ChangeRequest[]> {
  try {
    return await changeRequestsApi.list();
  } catch {
    return [];
  }
}

function CrStepper({ status }: { status: string }) {
  const current = getCrStepIndex(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {CR_STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full transition-colors ${
              i < current
                ? "bg-primary"
                : i === current
                ? "bg-primary ring-2 ring-primary/30"
                : "bg-muted-foreground/20"
            }`}
          />
          <span
            className={`text-[10px] hidden sm:inline ${
              i === current ? "text-primary font-medium" : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
          {i < CR_STEPS.length - 1 && (
            <div
              className={`h-px w-4 sm:w-6 ${i < current ? "bg-primary" : "bg-muted-foreground/20"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default async function ChangeRequestsPage() {
  const changeRequests = await getChangeRequests();

  const active = changeRequests.filter((c) => c.status !== "DONE" && c.status !== "REJECTED");
  const done = changeRequests.filter((c) => c.status === "DONE" || c.status === "REJECTED");

  return (
    <div className="space-y-6">
      <PageHeader
        title="변경 요청"
        description="화면·정책 변경 요청을 등록하고 개발 진행 상황을 확인하세요"
      />

      <div className="flex justify-between items-center">
        <div className="flex gap-3 text-sm text-muted-foreground">
          <span>전체 {changeRequests.length}건</span>
          <span>·</span>
          <span className="text-blue-600 font-medium">진행중 {active.length}건</span>
          <span>·</span>
          <span>완료 {done.length}건</span>
        </div>
        <Link href="/change-requests/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            새 변경 요청
          </Button>
        </Link>
      </div>

      {changeRequests.length === 0 ? (
        <EmptyState
          icon="📬"
          title="진행 중인 요청이 없어요"
          description="변경이 필요한 게 있으면 아래 버튼을 눌러 요청을 등록해보세요"
          actionLabel="변경 요청 등록하기"
          onAction={undefined}
          secondaryActionLabel="신규 화면 기획하기"
          onSecondaryAction={undefined}
        />
      ) : (
        <div className="space-y-6">
          {/* 진행 중 */}
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                진행 중 · {active.length}건
              </h2>
              <div className="space-y-3">
                {active.map((cr) => (
                  <CrCard key={cr.requestId} cr={cr} />
                ))}
              </div>
            </section>
          )}

          {/* 완료/반려 */}
          {done.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                완료 / 반려 · {done.length}건
              </h2>
              <div className="space-y-3 opacity-70">
                {done.map((cr) => (
                  <CrCard key={cr.requestId} cr={cr} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CrCard({ cr }: { cr: ChangeRequest }) {
  return (
    <Link href={`/change-requests/${cr.requestId}`}>
      <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* 제목 + 우선순위 점 */}
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    PRIORITY_DOT[cr.priority] ?? "bg-gray-400"
                  }`}
                />
                <p className="text-sm font-semibold truncate">{cr.title}</p>
              </div>

              {/* 메타 */}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{new Date(cr.createdAt).toLocaleDateString("ko-KR")}</span>
                <span>·</span>
                <span>{cr.requestedBy}</span>
              </div>

              {/* 진행 스테퍼 */}
              <CrStepper status={cr.status} />
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge variant={CR_STATUS_COLORS[cr.status] ?? "secondary"}>
                {CR_STATUS_LABELS[cr.status] ?? cr.status}
              </Badge>
              <Badge variant={PRIORITY_COLORS[cr.priority] ?? "outline"} className="text-[10px]">
                {PRIORITY_LABELS[cr.priority] ?? cr.priority}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
