import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { NewProjectDialog } from "./new-project-dialog";
import { Layers, Shield, GitBranch, RefreshCw } from "lucide-react";
import { projectsApi, type Project } from "@/lib/api";

const FRAMEWORK_LABELS: Record<string, string> = {
  NEXTJS: "Next.js",
  REACT: "React",
  VUE: "Vue",
};

const SYNC_STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  IDLE: { label: "정상", variant: "secondary" },
  SYNCING: { label: "동기화 중", variant: "default" },
  ERROR: { label: "오류", variant: "destructive" },
};

async function getProjects(): Promise<Project[]> {
  try {
    return await projectsApi.list();
  } catch {
    // API 미연결 시 샘플 데이터
    return [
      {
        projectId: "sample-1",
        projectName: "FreshMart Admin",
        projectDesc: "Fresh food e-commerce admin system",
        framework: "NEXTJS",
        status: "ACTIVE",
        syncStatus: "IDLE",
        repoBranch: "main",
      },
    ];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="프로젝트"
          description="등록된 프로젝트를 관리합니다"
        />
        <NewProjectDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const syncStatus = SYNC_STATUS_LABELS[project.syncStatus] || SYNC_STATUS_LABELS.IDLE;
          return (
            <Link key={project.projectId} href={`/projects/${project.projectId}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg truncate">{project.projectName}</CardTitle>
                    <Badge variant="outline" className="shrink-0">
                      {FRAMEWORK_LABELS[project.framework] || project.framework}
                    </Badge>
                  </div>
                  {project.projectDesc && (
                    <CardDescription className="line-clamp-2">
                      {project.projectDesc}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {project.repoUrl && (
                      <div className="flex items-center gap-1">
                        <GitBranch className="h-3.5 w-3.5" />
                        {project.repoBranch}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <RefreshCw className="h-3.5 w-3.5" />
                      <Badge variant={syncStatus.variant} className="text-xs">
                        {syncStatus.label}
                      </Badge>
                    </div>
                    {project.lastSyncedAt && (
                      <span className="text-xs">
                        {new Date(project.lastSyncedAt).toLocaleDateString("ko-KR")} 동기화
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>등록된 프로젝트가 없습니다.</p>
          <p className="text-sm mt-1">새 프로젝트 버튼을 클릭하여 프로젝트를 추가하세요.</p>
        </div>
      )}
    </div>
  );
}

