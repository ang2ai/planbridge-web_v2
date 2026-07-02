# PlanBridge Web (SaaS 프론트엔드 + 크롬 익스텐션)

## 역할
- 기획자/개발자가 사용하는 웹 화면 (Next.js)
- 크롬 익스텐션 소스 관리 (planbridge-extension/)
- 익스텐션 auto-update 파일 호스팅 (public/extension/)

## 기술 스택
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- API 서버: planbridge-api (Spring Boot)

## 환경변수 (.env.local)
- NEXT_PUBLIC_API_URL: Spring Boot API 주소
- NEXT_PUBLIC_EXTENSION_UPDATE_URL: 익스텐션 업데이트 URL

## 실행
```bash
npm install
npm run dev
```

## 설계 문서 (우선순위 순)
@docs/planbridge-final-architecture.md
@docs/planbridge-policy-management-design.md
@docs/planbridge-mapping-design.md
@docs/planbridge-usecases.md

## 문서 우선순위 규칙
- 전체 아키텍처/방향 → planbridge-final-architecture.md 우선
- 정책 관련 작업 → planbridge-policy-management-design.md 우선
- DB/매핑 관련 작업 → planbridge-mapping-design.md 우선
- 문서 간 충돌 시 → planbridge-final-architecture.md 최종 기준

## 개발 원칙
- 기획자(비개발자)가 교육 없이 사용 가능한 UX 우선
- 기술 용어 대신 일반 언어 사용 (예: INTERACTION → 동작방식)
- 정책 유형 선택 시 AI 자동 추천 기능 제공
- shadcn/ui 컴포넌트 우선 사용
- 신규 컴포넌트는 components/ 하위에 생성
