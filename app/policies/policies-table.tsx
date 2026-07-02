"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Policy } from "@/lib/api";
import { PolicyImpactSheet } from "./policy-impact-dialog";
import { PolicyHistoryDialog } from "./policy-history-dialog";
import { ValidationRulesDialog } from "./validation-rules-dialog";
import { PolicyEditDialog } from "./policy-edit-dialog";
import {
  POLICY_TYPE_LABELS,
  POLICY_TYPE_ICONS,
  POLICY_SCOPE_LABELS,
  POLICY_SCOPE_COLORS,
} from "@/lib/labels";
import { EmptyState } from "@/components/shared/empty-state";

const TYPE_FILTERS = [
  { value: "ALL", label: "전체" },
  { value: "VALIDATION", label: "📝 입력 규칙" },
  { value: "UI_SPEC", label: "👁️ 화면 표시" },
  { value: "BIZ_RULE", label: "💼 업무 규칙" },
  { value: "INTERACTION", label: "🖱️ 동작 규칙" },
  { value: "DATA_SPEC", label: "🔌 데이터 연동" },
  { value: "PERMISSION", label: "🔑 권한/접근" },
];

interface PoliciesTableProps {
  policies: Policy[];
  initialQuery: string;
  initialProjectId?: string;
}

export function PoliciesTable({
  policies,
  initialQuery,
  initialProjectId = "",
}: PoliciesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeType, setActiveType] = useState("ALL");
  const [inputValue, setInputValue] = useState(initialQuery);
  const [projectIdValue, setProjectIdValue] = useState(initialProjectId);

  const handleSearch = (value: string, pid?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    const resolvedPid = pid !== undefined ? pid : projectIdValue;
    if (resolvedPid) params.set("projectId", resolvedPid);
    else params.delete("projectId");
    router.push(`/policies?${params.toString()}`);
  };

  const filtered =
    activeType === "ALL" ? policies : policies.filter((p) => p.policyType === activeType);

  return (
    <div className="space-y-4">
      {/* 검색 영역 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="정책 제목, 태그로 검색..."
            className="pl-9"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(inputValue);
            }}
          />
        </div>
        <Input
          placeholder="프로젝트 ID (선택)"
          className="max-w-44"
          value={projectIdValue}
          onChange={(e) => setProjectIdValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(inputValue, e.currentTarget.value);
          }}
        />
        <Button variant="default" size="sm" onClick={() => handleSearch(inputValue)}>
          검색
        </Button>
      </div>

      {/* 유형 필터 탭 */}
      <div className="flex gap-1.5 flex-wrap">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setActiveType(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              activeType === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 결과 수 */}
      {inputValue && (
        <p className="text-xs text-muted-foreground">
          {filtered.length > 0
            ? `"${inputValue}" 검색 결과 ${filtered.length}건`
            : `"${inputValue}"에 대한 정책이 없어요`}
        </p>
      )}

      {/* 테이블 or 빈 상태 */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={inputValue ? `"${inputValue}"에 대한 정책이 없어요` : "등록된 정책이 없어요"}
          description={
            inputValue
              ? "다른 키워드로 다시 검색하거나 새로 등록해보세요"
              : "첫 번째 정책을 등록해보세요"
          }
        />
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="min-w-[220px]">정책 제목</TableHead>
                <TableHead className="w-[120px]">유형 / 범위</TableHead>
                <TableHead className="w-[140px] hidden sm:table-cell">태그</TableHead>
                <TableHead className="w-[80px] hidden md:table-cell text-center">버전 / 상태</TableHead>
                <TableHead className="w-[180px] text-center">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((policy) => (
                <TableRow key={policy.policyId} className="hover:bg-accent/40 group">
                  {/* 정책 제목 */}
                  <TableCell>
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-base shrink-0 mt-0.5">
                        {POLICY_TYPE_ICONS[policy.policyType] ?? "📋"}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-snug truncate max-w-[280px]">
                          {policy.policyTitle}
                        </p>
                        {policy.policyContent && (
                          <p className="text-xs text-muted-foreground truncate max-w-[280px] mt-0.5">
                            {policy.policyContent}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* 유형 / 범위 */}
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {POLICY_TYPE_LABELS[policy.policyType] ?? policy.policyType}
                      </p>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] border ${
                          POLICY_SCOPE_COLORS[policy.scope] ??
                          "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {POLICY_SCOPE_LABELS[policy.scope] ?? policy.scope}
                      </span>
                    </div>
                  </TableCell>

                  {/* 태그 */}
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex gap-1 flex-wrap max-w-[140px]">
                      {policy.tags
                        ? policy.tags.split(",").slice(0, 3).map((tag) => (
                            <Badge
                              key={tag.trim()}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {tag.trim()}
                            </Badge>
                          ))
                        : <span className="text-xs text-muted-foreground/50">—</span>}
                      {policy.tags && policy.tags.split(",").length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{policy.tags.split(",").length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* 버전 / 상태 */}
                  <TableCell className="hidden md:table-cell text-center">
                    <div className="space-y-1 flex flex-col items-center">
                      <span className="text-xs text-muted-foreground font-mono">
                        v{policy.currentVersion}
                      </span>
                      <Badge
                        variant={policy.status === "ACTIVE" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {policy.status === "ACTIVE" ? "적용 중" : policy.status}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* 작업 */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <PolicyEditDialog policy={policy} />
                      <PolicyHistoryDialog
                        policyId={policy.policyId}
                        policyTitle={policy.policyTitle}
                        currentVersion={policy.currentVersion}
                      />
                      {policy.policyType === "VALIDATION" && (
                        <ValidationRulesDialog
                          policyId={policy.policyId}
                          policyTitle={policy.policyTitle}
                        />
                      )}
                      <PolicyImpactSheet
                        policyId={policy.policyId}
                        policyTitle={policy.policyTitle}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 범례 */}
      <p className="text-[11px] text-muted-foreground/70 text-right">
        ✏️ 수정 &nbsp;|&nbsp; 📋 이력 &nbsp;|&nbsp; ✅ 검증 규칙 &nbsp;|&nbsp; 📊 영향 분석
      </p>
    </div>
  );
}
