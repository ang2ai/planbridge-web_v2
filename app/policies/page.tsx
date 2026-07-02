import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { policiesApi, type Policy } from "@/lib/api";
import { PoliciesTable } from "./policies-table";
import { ConsistencyCheckButton } from "./consistency-check-button";
import { PolicyCreateDialog } from "./policy-create-dialog";
import { Suspense } from "react";

async function getPolicies(q?: string, projectId?: string): Promise<Policy[]> {
  try {
    return await policiesApi.search(q ?? "", projectId);
  } catch {
    return [];
  }
}

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; projectId?: string }>;
}) {
  const { q, projectId } = await searchParams;
  const policies = await getPolicies(q, projectId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="🛡 정책 관리"
          description="등록된 정책을 검색하고 관리하세요. VALIDATION 유형 정책은 구조화된 규칙 편집이 가능합니다."
        />
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <ConsistencyCheckButton projectId={projectId} />
          <PolicyCreateDialog />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Suspense>
            <PoliciesTable policies={policies} initialQuery={q ?? ""} initialProjectId={projectId ?? ""} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
