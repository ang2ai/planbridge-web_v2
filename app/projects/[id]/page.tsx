import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { componentsApi, projectsApi, type Component, type Project } from "@/lib/api";
import { GitSyncButton } from "./git-sync-button";

const typeColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PAGE_ROOT: "default",
  LAYOUT: "secondary",
  SECTION: "outline",
  COMPONENT: "default",
  ELEMENT: "secondary",
};

function TreeNode({ node, depth = 0 }: { node: Component; depth?: number }) {
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <Badge
          variant={typeColors[node.componentType] ?? "outline"}
          className="text-[10px] px-1.5"
        >
          {node.componentType}
        </Badge>
        <span className="text-sm font-medium">{node.componentName}</span>
        <span className="text-xs text-muted-foreground ml-auto font-mono">
          {node.pbId}
        </span>
      </div>
      {node.children?.map((child) => (
        <TreeNode key={child.componentId} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

const SYNC_STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  IDLE: { label: "정상", variant: "secondary" },
  SYNCING: { label: "동기화 중", variant: "default" },
  ERROR: { label: "오류", variant: "destructive" },
};

async function getData(id: string): Promise<{
  project: Project | null;
  components: Component[];
  error: string | null;
}> {
  try {
    const [project, components] = await Promise.all([
      projectsApi.get(id).catch(() => null),
      componentsApi.list(id).catch(() => [] as Component[]),
    ]);
    return { project, components, error: null };
  } catch {
    return { project: null, components: [], error: "데이터를 불러오는데 실패했습니다." };
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { project, components, error } = await getData(id);

  if (error && !project) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Project: ${id}`} description="컴포넌트 트리와 프로젝트 정보" />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  const syncStatus = SYNC_STATUS_LABELS[project?.syncStatus ?? "IDLE"] ?? SYNC_STATUS_LABELS.IDLE;

  // 루트 레벨 컴포넌트만 추출 (children으로 내려간 것 제외)
  const rootComponents = components.filter((c) => c.depthLevel === 0 || !components.some((p) => p.children?.some((ch) => ch.componentId === c.componentId)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title={project?.projectName ?? `Project: ${id}`}
          description={project?.projectDesc ?? "컴포넌트 트리와 프로젝트 정보"}
        />
        {project && <GitSyncButton projectId={id} />}
      </div>

      <Tabs defaultValue="tree">
        <TabsList>
          <TabsTrigger value="tree">🌳 컴포넌트 트리</TabsTrigger>
          <TabsTrigger value="info">ℹ️ 프로젝트 정보</TabsTrigger>
          <TabsTrigger value="scans">📋 스캔 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>컴포넌트 계층 구조</CardTitle>
            </CardHeader>
            <CardContent>
              {rootComponents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  등록된 컴포넌트가 없습니다. Chrome Extension으로 페이지를 스캔하세요.
                </p>
              ) : (
                rootComponents.map((node) => (
                  <TreeNode key={node.componentId} node={node} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 정보</CardTitle>
            </CardHeader>
            <CardContent>
              {project ? (
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">프로젝트 ID</dt>
                    <dd className="font-mono mt-1">{project.projectId}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">프레임워크</dt>
                    <dd className="mt-1">{project.framework}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Git URL</dt>
                    <dd className="font-mono mt-1 break-all">
                      {project.repoUrl ?? "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">브랜치</dt>
                    <dd className="font-mono mt-1">{project.repoBranch}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">동기화 상태</dt>
                    <dd className="mt-1">
                      <Badge variant={syncStatus.variant}>{syncStatus.label}</Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">마지막 동기화</dt>
                    <dd className="mt-1">
                      {project.lastSyncedAt
                        ? new Date(project.lastSyncedAt).toLocaleString("ko-KR")
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Base URL</dt>
                    <dd className="font-mono mt-1 break-all">
                      {project.baseUrl ?? "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">상태</dt>
                    <dd className="mt-1">
                      <Badge variant="outline">{project.status}</Badge>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  프로젝트 정보를 불러올 수 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>스캔 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">스캔 이력이 없습니다.</p>
                <p className="text-xs mt-1">Chrome Extension으로 페이지를 스캔하면 데이터가 쌓입니다.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
