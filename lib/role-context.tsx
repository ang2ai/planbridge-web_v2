"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole = "planner" | "developer" | "operator" | null;

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
  isLoaded: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  setRole: () => {},
  clearRole: () => {},
  isLoaded: false,
});

const STORAGE_KEY = "pb-role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UserRole | null;
    if (saved === "planner" || saved === "developer" || saved === "operator") {
      setRoleState(saved);
    }
    setIsLoaded(true);
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem(STORAGE_KEY, newRole);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearRole = useCallback(() => {
    setRoleState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole, isLoaded }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

export const ROLE_META = {
  planner: {
    label: "기획자",
    emoji: "📋",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    badgeColor: "bg-orange-500",
    description: "변경 요청 등록, 정책 관리, 화면 기획서 작성",
  },
  developer: {
    label: "개발자",
    emoji: "⚡",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    badgeColor: "bg-blue-500",
    description: "개발 TODO 확인, Claude Code 프롬프트 복사, 완료 처리",
  },
  operator: {
    label: "운영자",
    emoji: "⚙️",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    badgeColor: "bg-purple-500",
    description: "전체 메뉴 접근, 프로젝트 관리 및 전체 현황 모니터링",
  },
} as const;
