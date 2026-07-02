import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { componentsApi, policiesApi, type Component, type Policy } from "@/lib/api";
import { PolicyOverrideDialog } from "./policy-override-dialog";
import { PromptConvertDialog } from "./prompt-convert-dialog";
import { POLICY_TYPE_LABELS, POLICY_TYPE_COLORS } from "@/lib/labels";
import { PolicyHistoryPanel } from "./policy-history-panel";

const scopeColors: Record<string, string> = {
  GLOBAL: "bg-purple-100 text-purple-700 border-purple-200",
  PAGE: "bg-blue-100 text-blue-700 border-blue-200",
  COMPONENT: "bg-green-100 text-green-700 border-green-200",
  ELEMENT: "bg-orange-100 text-orange-700 border-orange-200",
};

const linkTypeLabels: Record<string, string> = {
  DIRECT: "직접 적용",
  INHERITED_GLOBAL: "전역 상속",
  INHERITED_PAGE: "페이지 상속",
  OVERRIDE: "재정의",
};

const componentTypeLabels: Record<string, string> = {
  PAGE_ROOT: "페이지",
  LAYOUT: "레이아웃",
  SECTION: "섹션",
  COMPONENT: "컴포넌트",
  ELEMENT: "요소",
};

async function getData(
  pbId?: string,
  componentName?: string,
  pageRoute?: string,
  projectId?: string
): Promise<{ component: Component | null; policies: Policy[] }> {
  if (!pageRoute || !projectId) {
    return { component: null, policies: [] };
  }
  try {
    const component = await componentsApi.resolve({
      pbId,
      componentName,
      pageRoute,
      projectId,
    });
    const policies = component
      ? await policiesApi.listByComponent(component.componentId).catch(() => [] as Policy[])
      : [];
    return { component, policies };
  } catch {
    return { component: null, policies: [] };
  }
}

export default async function ComponentDetailPage({
  searchParams,
}: {
  searchParams: Promise<{
    pbId?: string;
    componentName?: string;
    pageRoute?: string;
    projectId?: string;
  }>;
}) {
  const { pbId, componentName, pageRoute, projectId } = await searchParams;
  const { component, policies } = await getData(pbId, componentName, pageRoute, projectId);

  const displayName = component?.componentName ?? componentName ?? pbId ?? "컴포넌트 상세";
  // API returns "APPLIED" for directly registered policies, "DIRECT" is legacy fallback
  const directPolicies = policies.filter(
    (p) => p.linkType === "APPLIED" || p.linkType === "DIRECT" || !p.linkType
  );
  const inheritedPolicies = policies.filter((p) =>
    ["INHERITED_GLOBAL", "INHERITED_PAGE", "OVERRIDE"].includes(p.linkType ?? "")
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayName}
        description={`경로: ${pageRoute ?? "N/A"} | PB ID: ${pbId ?? component?.pbId ?? "N/A"}`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* 컴포넌트 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>컴포넌트 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">PB ID</dt>
                  <dd className="font-mono mt-1 text-xs break-all">{component?.pbId ?? pbId ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">컴포넌트명</dt>
                  <dd className="mt-1 font-medium">{component?.componentName ?? componentName ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">페이지 경로</dt>
                  <dd className="font-mono mt-1 text-xs">{pageRoute ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">유형</dt>
                  <dd className="mt-1">
                    <Badge variant="outline">
                      {componentTypeLabels[component?.componentType ?? ""] ?? component?.componentType ?? "ELEMENT"}
                    </Badge>
                  </dd>
                </div>
                {component?.elementTag && (
                  <div>
                    <dt className="text-muted-foreground">HTML 태그</dt>
                    <dd className="font-mono mt-1">&lt;{component.elementTag}&gt;</dd>
                  </div>
                )}
                {component?.depthLevel !== undefined && (
                  <div>
                    <dt className="text-muted-foreground">계층 깊이</dt>
                    <dd className="mt-1">{component.depthLevel}단계</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Tabs defaultValue="policies">
            <TabsList>
              <TabsTrigger value="policies">
                🛡 적용 정책 {policies.length > 0 && `(${policies.length})`}
              </TabsTrigger>
              <TabsTrigger value="history">📜 정책 이력</TabsTrigger>
            </TabsList>

            {/* 적용 정책 탭 */}
            <TabsContent value="policies" className="mt-4">
              <div className="space-y-4">
                {/* 직접 적용 정책 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">직접 적용 정책</CardTitle>
                    <CardDescription>
                      이 컴포넌트에 직접 등록된 정책
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {directPolicies.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">등록된 정책이 없습니다.</p>
                        <p className="text-xs mt-1">Chrome Extension으로 정책을 등록하세요.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {directPolicies.map((policy) => (
                          <PolicyCard
                            key={policy.policyId}
                            policy={policy}
                            componentId={component?.componentId}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 상속 정책 */}
                {inheritedPolicies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">상속 정책</CardTitle>
                      <CardDescription>
                        상위 범위(전역/페이지)에서 상속된 정책
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {inheritedPolicies.map((policy) => (
                          <PolicyCard
                            key={policy.policyId}
                            policy={policy}
                            componentId={component?.componentId}
                            isInherited
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* 정책 이력 탭 */}
            <TabsContent value="history" className="mt-4">
              {policies.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p className="text-sm">정책이 없어 이력을 확인할 수 없습니다.</p>
                  </CardContent>
                </Card>
              ) : (
                <PolicyHistoryPanel policies={policies} />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* 사이드 패널 */}
        <div className="space-y-4">
          {component?.treePath && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">계층 구조</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm font-mono">
                  {component.treePath.split(".").map((part, i, arr) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1 ${
                        i === arr.length - 1 ? "font-bold text-primary" : "text-muted-foreground"
                      }`}
                      style={{ paddingLeft: `${i * 12}px` }}
                    >
                      {i > 0 && <span className="text-muted-foreground/50">└─</span>}
                      <span>{part}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 정책 요약 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">정책 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {["VALIDATION", "UI_SPEC", "INTERACTION", "BIZ_RULE", "DATA_SPEC", "PERMISSION"].map((type) => {
                  const count = policies.filter((p) => p.policyType === type).length;
                  if (count === 0) return null;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {POLICY_TYPE_LABELS[type] ?? type}
                      </span>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </div>
                  );
                })}
                {policies.length === 0 && (
                  <p className="text-muted-foreground text-xs">등록된 정책 없음</p>
                )}
              </div>
            </CardContent>
          </Card>

          {component?.currentSpec && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">현재 스펙</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="rounded-md bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap">
                  {component.currentSpec}
                </pre>
              </CardContent>
            </Card>
          )}

          {!component && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <p className="text-sm text-amber-800">
                  ⚠ 컴포넌트를 찾을 수 없습니다.
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Chrome Extension으로 요소를 선택하면 자동으로 이 페이지로 이동합니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// 정책 카드 서버 컴포넌트
function PolicyCard({
  policy,
  componentId,
  isInherited = false,
}: {
  policy: Policy;
  componentId?: string;
  isInherited?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${
        isInherited ? "bg-muted/30" : ""
      }`}
    >
      <div className="flex items-start gap-2 flex-wrap">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            POLICY_TYPE_COLORS[policy.policyType] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {POLICY_TYPE_LABELS[policy.policyType] ?? policy.policyType}
        </span>
        <span className="text-sm font-medium flex-1">{policy.policyTitle}</span>
        <div className="flex gap-1 ml-auto">
          <Badge variant="outline" className="text-xs">v{policy.currentVersion}</Badge>
          {policy.linkType && (
            <Badge variant="secondary" className="text-[10px]">
              {linkTypeLabels[policy.linkType] ?? policy.linkType}
            </Badge>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {policy.policyContent}
      </p>
      {policy.tags && (
        <div className="flex gap-1 flex-wrap">
          {policy.tags.split(",").map((tag) => (
            <Badge key={tag.trim()} variant="secondary" className="text-[10px]">
              {tag.trim()}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <PromptConvertDialog
          policyId={policy.policyId}
          policyTitle={policy.policyTitle}
        />
        {isInherited && componentId && (
          <PolicyOverrideDialog
            policyId={policy.policyId}
            policyTitle={policy.policyTitle}
            componentId={componentId}
          />
        )}
      </div>
    </div>
  );
}
