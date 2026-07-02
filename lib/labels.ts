// 한국어 레이블 및 색상 매핑

// ─── 변경 요청 상태 ─────────────────────────────────────────
export const CR_STATUS_LABELS: Record<string, string> = {
  DRAFT: "임시저장",
  AI_PROCESSING: "AI 분석중",
  AI_FAILED: "분석 실패",
  READY: "개발 대기",
  IN_PROGRESS: "개발중",
  TESTING: "테스트중",
  DONE: "완료",
  REJECTED: "반려됨",
};

export const CR_STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  AI_PROCESSING: "outline",
  AI_FAILED: "destructive",
  READY: "default",
  IN_PROGRESS: "default",
  TESTING: "outline",
  DONE: "secondary",
  REJECTED: "destructive",
};

// 진행 단계 순서 (스테퍼 표시용)
export const CR_STEPS = [
  { key: "DRAFT",         label: "요청 접수" },
  { key: "AI_PROCESSING", label: "AI 분석" },
  { key: "IN_PROGRESS",   label: "개발중" },
  { key: "TESTING",       label: "테스트" },
  { key: "DONE",          label: "완료" },
];

export function getCrStepIndex(status: string): number {
  const idx = CR_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

// ─── TODO 상태 ───────────────────────────────────────────────
export const TODO_STATUS_LABELS: Record<string, string> = {
  PENDING: "대기",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

export const TODO_STATUS_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  PENDING: "secondary",
  IN_PROGRESS: "default",
  DONE: "outline",
};

// ─── 우선순위 ────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
  CRITICAL: "긴급",
};

export const PRIORITY_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "outline",
  HIGH: "default",
  CRITICAL: "destructive",
};

export const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-green-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-amber-500",
  CRITICAL: "bg-red-500",
};

// ─── 복잡도 ─────────────────────────────────────────────────
export const COMPLEXITY_LABELS: Record<string, string> = {
  SIMPLE: "간단",
  MODERATE: "보통",
  COMPLEX: "복잡",
};

// ─── 정책 유형 ───────────────────────────────────────────────
export const POLICY_TYPE_LABELS: Record<string, string> = {
  VALIDATION: "입력 규칙",
  UI_SPEC: "화면 표시",
  INTERACTION: "동작 규칙",
  BIZ_RULE: "업무 규칙",
  DATA_SPEC: "데이터 연동",
  PERMISSION: "권한/접근",
};

export const POLICY_TYPE_ICONS: Record<string, string> = {
  VALIDATION: "📝",
  UI_SPEC: "👁️",
  INTERACTION: "🖱️",
  BIZ_RULE: "💼",
  DATA_SPEC: "🔌",
  PERMISSION: "🔑",
};

export const POLICY_TYPE_DESC: Record<string, string> = {
  VALIDATION: "필수 입력, 길이 제한, 형식 검증",
  UI_SPEC: "어떻게 보여야 하는지, 포맷·색상",
  INTERACTION: "버튼 누르면 어떻게 되는지, 모달·토스트",
  BIZ_RULE: "할인율 제한, 권한별 허용 범위 등",
  DATA_SPEC: "어떤 API에서 어떤 데이터를 가져오는지",
  PERMISSION: "누가 볼 수 있는지, 누가 수정할 수 있는지",
};

// ─── 정책 범위 ───────────────────────────────────────────────
export const POLICY_SCOPE_LABELS: Record<string, string> = {
  GLOBAL: "전체 적용",
  PAGE: "이 페이지",
  COMPONENT: "이 컴포넌트",
  ELEMENT: "이 요소만",
};

export const POLICY_SCOPE_COLORS: Record<string, string> = {
  GLOBAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAGE: "bg-blue-100 text-blue-800 border-blue-200",
  COMPONENT: "bg-green-100 text-green-800 border-green-200",
  ELEMENT: "bg-purple-100 text-purple-800 border-purple-200",
};

// ─── 정책 유형 색상 (인라인 배지용) ─────────────────────────
export const POLICY_TYPE_COLORS: Record<string, string> = {
  VALIDATION: "bg-blue-100 text-blue-700 border-blue-200",
  UI_SPEC: "bg-green-100 text-green-700 border-green-200",
  INTERACTION: "bg-orange-100 text-orange-700 border-orange-200",
  BIZ_RULE: "bg-red-100 text-red-700 border-red-200",
  DATA_SPEC: "bg-violet-100 text-violet-700 border-violet-200",
  PERMISSION: "bg-amber-100 text-amber-700 border-amber-200",
};
