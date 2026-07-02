"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRole, ROLE_META, type UserRole } from "@/lib/role-context";
import { ChevronDown, LogOut } from "lucide-react";

const routeLabels: Record<string, string> = {
  "/dashboard": "대시보드",
  "/projects": "프로젝트",
  "/policies": "정책 관리",
  "/change-requests": "변경 요청",
  "/todos": "개발 TODO",
  "/plans": "화면 기획서",
  "/templates": "참고 템플릿",
  "/component": "컴포넌트 상세",
  "/sample": "샘플 페이지",
};

export function Header() {
  const pathname = usePathname();
  const { role, setRole, clearRole } = useRole();

  const currentLabel =
    Object.entries(routeLabels).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "PlanBridge";

  const currentMeta = role ? ROLE_META[role] : null;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 역할 뱃지 + 전환 드롭다운 */}
      <div className="ml-auto flex items-center gap-2">
        {currentMeta && role && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${currentMeta.color}`}
            >
              <span>{currentMeta.emoji}</span>
              <span>{currentMeta.label}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  역할 전환
                </DropdownMenuLabel>
                {(["planner", "developer", "operator"] as const).map((r) => {
                  const meta = ROLE_META[r];
                  const isActive = r === role;
                  return (
                    <DropdownMenuItem
                      key={r}
                      onClick={() => setRole(r as UserRole)}
                      className={isActive ? "bg-accent font-medium" : ""}
                    >
                      <span className="mr-2">{meta.emoji}</span>
                      <span className="flex-1">{meta.label}</span>
                      {isActive && (
                        <span className="text-[10px] text-muted-foreground ml-1">현재</span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={clearRole}
                className="text-muted-foreground"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                역할 다시 선택
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
