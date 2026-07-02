"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Shield,
  GitPullRequestArrow,
  CheckSquare,
  BrainCircuit,
  Plus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRole } from "@/lib/role-context";

// 공통
const commonNav = [
  { title: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { title: "프로젝트", href: "/projects", icon: FolderKanban },
];

// 기획자 메뉴
const plannerNav = [
  { title: "정책 관리", href: "/policies", icon: Shield },
  { title: "변경 요청", href: "/change-requests", icon: GitPullRequestArrow },
];

// 개발자 메뉴
const devNav = [
  { title: "개발 TODO", href: "/todos", icon: CheckSquare },
];

// 빠른 시작
const quickActions = [
  { title: "변경 요청 등록", href: "/change-requests/new", icon: Plus },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { role } = useRole();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  const showPlanner = role === "planner" || role === "operator";
  const showDev = role === "developer" || role === "operator";
  const showQuickActions = role === "planner" || role === "operator";

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">PlanBridge</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* 공통 */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 기획자 메뉴 */}
        {showPlanner && (
          <SidebarGroup>
            <SidebarGroupLabel>📋 기획자</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {plannerNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive(item.href)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* 개발자 메뉴 */}
        {showDev && (
          <SidebarGroup>
            <SidebarGroupLabel>⚡ 개발자</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {devNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive(item.href)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* 빠른 시작 */}
        {showQuickActions && (
          <SidebarGroup>
            <SidebarGroupLabel>빠른 시작</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickActions.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname === item.href}
                    >
                      <item.icon className="h-4 w-4 text-primary" />
                      <span className="text-primary font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-3">
        <p className="text-[10px] text-muted-foreground text-center">
          PlanBridge v2 — 기획·개발 연결 플랫폼
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
