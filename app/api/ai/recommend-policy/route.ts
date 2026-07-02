import { NextRequest, NextResponse } from "next/server";

const POLICY_TYPES = [
  { type: "BUSINESS_RULE", keywords: ["규칙", "조건", "예외", "경우", "때", "비활성", "활성화", "허용", "금지", "필수", "비회원", "회원", "권한", "업무", "로직"] },
  { type: "UI_SPEC", keywords: ["색상", "크기", "레이아웃", "배치", "디자인", "스타일", "폰트", "여백", "화면", "모양", "보이", "표시", "숨김", "visible"] },
  { type: "INTERACTION", keywords: ["클릭", "호버", "스크롤", "드래그", "애니메이션", "전환", "이동", "열기", "닫기", "토스트", "알림", "팝업", "모달", "동작"] },
  { type: "VALIDATION", keywords: ["검증", "유효", "형식", "범위", "최소", "최대", "글자", "숫자", "이메일", "전화", "필수입력", "오류", "에러", "체크"] },
  { type: "TEXT_CONTENT", keywords: ["문구", "텍스트", "버튼명", "레이블", "메시지", "안내", "설명", "제목", "placeholder", "문자"] },
  { type: "API_SPEC", keywords: ["API", "데이터", "서버", "요청", "응답", "연동", "통신", "엔드포인트", "파라미터", "저장", "조회", "불러오기"] },
];

const POLICY_TYPE_LABELS: Record<string, string> = {
  BUSINESS_RULE: "업무 규칙",
  UI_SPEC: "화면 명세",
  INTERACTION: "동작 방식",
  VALIDATION: "입력 검증",
  TEXT_CONTENT: "텍스트 내용",
  API_SPEC: "API 연동",
};

function recommendPolicyType(description: string) {
  const lower = description.toLowerCase();
  const scores = POLICY_TYPES.map(({ type, keywords }) => ({
    type,
    score: keywords.filter((kw) => lower.includes(kw.toLowerCase())).length,
  })).sort((a, b) => b.score - a.score);

  const best = scores[0];
  const total = scores.reduce((s, i) => s + i.score, 0) || 1;
  const confidence = Math.min(0.95, (best.score / total) * 1.5 + 0.3);

  const reasons: Record<string, string> = {
    BUSINESS_RULE: "업무 조건이나 허용/금지 규칙을 설명하는 내용입니다.",
    UI_SPEC: "화면의 시각적 요소나 레이아웃을 다루는 내용입니다.",
    INTERACTION: "사용자 동작이나 애니메이션 등 상호작용을 다루는 내용입니다.",
    VALIDATION: "입력값 검증이나 유효성 조건을 다루는 내용입니다.",
    TEXT_CONTENT: "화면에 표시되는 문구나 메시지를 다루는 내용입니다.",
    API_SPEC: "서버와의 데이터 연동을 다루는 내용입니다.",
  };

  return {
    recommendedType: best.score > 0 ? best.type : "BUSINESS_RULE",
    confidence: best.score > 0 ? confidence : 0.4,
    reason: reasons[best.score > 0 ? best.type : "BUSINESS_RULE"],
    alternatives: scores
      .slice(1, 3)
      .filter((s) => s.score > 0)
      .map((s) => ({
        type: s.type,
        label: POLICY_TYPE_LABELS[s.type],
        reason: reasons[s.type],
      })),
  };
}

export async function POST(req: NextRequest) {
  const { description } = await req.json();

  if (!description?.trim()) {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400 }
    );
  }

  // 먼저 백엔드 AI 추천 시도, 실패하면 로컬 키워드 기반 추천 사용
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiUrl}/api/ai/recommend-policy-type`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data.data ?? data);
    }
  } catch {
    // 백엔드 미응답 시 로컬 키워드 추천 폴백
  }

  return NextResponse.json(recommendPolicyType(description));
}
