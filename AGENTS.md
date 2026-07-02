# PlanBridge Web v2 — AI Agent Guide

## 프로젝트 개요

사내 컴포넌트 정책 관리 시스템의 프론트엔드.
Chrome Extension이 스캔한 UI 컴포넌트 정보를 시각화하고,
기획자의 변경 요청을 AI(Azure OpenAI)가 분석하여 개발 TODO를 자동 생성한다.

## 기술 스택

- **Framework**: Next.js 14.2 (App Router)
- **UI**: React 18.3 + Tailwind CSS v4 + @base-ui/react (base-nova)
- **Language**: TypeScript 5
- **Package Manager**: npm

## 디렉토리 구조

```
app/                  Next.js App Router 페이지
  layout.tsx          루트 레이아웃 (사이드바, 헤더)
  globals.css         전역 스타일 (Tailwind v4)
  projects/           프로젝트 목록 · 상세
  change-requests/    변경요청 목록 · 상세 · 생성
  policies/           정책 관리
  component/          컴포넌트 상세
  todos/              AI 생성 TODO 목록
  dashboard/          대시보드
components/
  ui/                 @base-ui/react 기반 공통 컴포넌트
  layout/             사이드바, 헤더, 역할 게이트
  shared/             페이지 헤더 등 공유 컴포넌트
lib/
  api.ts              백엔드 API 클라이언트 (fetch 기반)
  role-context.tsx    역할(기획자/개발자) 상태 관리
plugins/
  planbridge-id-loader.js  빌드 시 data-pb-id 자동 주입 (Babel 로더)
```

## 환경 설정

| 파일 | 용도 | git 포함 |
|------|------|---------|
| `.env.local` | 로컬 개발 | ❌ (gitignore) |
| `.env.dev` | 개발 서버 | ✅ (IP만 수정) |
| `.env.prd` | 운영 서버 | ❌ (gitignore) |
| `.env.example` | 변수 목록 참고 | ✅ |

### 필수 환경변수

```
NEXT_PUBLIC_API_URL                 백엔드 API 주소 (planbridge-api_v2)
NEXT_PUBLIC_EXTENSION_UPDATE_URL    크롬 익스텐션 업데이트 XML 주소
```

## 실행 방법

```sh
# 로컬 개발
npm run dev

# 개발 서버 환경으로 로컬 실행
npm run dev:dev

# 빌드
npm run build          # .env.local 사용
npm run build:dev      # .env.dev 사용
npm run build:prd      # .env.prd 사용
```

## Code Style

- **ESLint**: `.eslintrc.js` — `next/core-web-vitals` 기반
- **Prettier**: `.prettierrc.js` — singleQuote, tabWidth 2, printWidth 100
- 린트 검사: `npm run lint`
- 포맷 적용: `npm run format`

## 백엔드 연동

- 백엔드: **planbridge-api_v2** (Spring Boot 3.1.5, Java 17, PostgreSQL)
- AI: **Azure OpenAI** (GPT-4o) — 백엔드에서 직접 호출, 프론트는 API만 사용

## 주의사항

- `next.config.ts`는 빈 파일 (Next.js 14 미인식) → `next.config.mjs` 사용
- `PLANBRIDGE_INJECT=true` 환경변수 시 빌드 시 `data-pb-id` 자동 주입 활성화
- Tailwind v4 문법 사용 (`@import "tailwindcss"`, `@theme inline {}`)
- `@base-ui/react`는 Radix UI 대신 사용 (MUI 팀 제공, React 18.3+ 필요)
