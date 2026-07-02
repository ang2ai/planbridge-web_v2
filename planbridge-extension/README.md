# PlanBridge 크롬 익스텐션 (프로토타입 v0.1)

기획-개발 브릿지 시스템. 웹 페이지의 요소를 선택하고 정책을 관리합니다.

## 설치 방법 (3단계, 1분)

### 1. 압축 해제
다운로드한 `planbridge-extension.zip`을 원하는 위치에 압축 해제합니다.

### 2. 크롬에서 로드
1. Chrome 주소창에 `chrome://extensions` 입력
2. 우측 상단 **"개발자 모드"** 토글 ON
3. **"압축해제된 확장 프로그램을 로드합니다"** 클릭
4. 압축 해제한 `planbridge-extension` 폴더 선택

### 3. 사용 시작
- 주소창 우측에 **PB** 아이콘이 나타납니다
- 아이콘 클릭 → Side Panel이 열립니다

## 사용법

### 요소 선택
1. Side Panel에서 **🎯 선택** 버튼 클릭
2. 웹 페이지에서 원하는 요소에 마우스를 올리면 빨간색 하이라이트
3. 클릭하면 요소가 선택되고 Side Panel에 정보 표시

### 정책 등록
1. 요소 선택 후 **+ 새 정책 추가** 클릭
2. 정책 유형, 범위, 제목, 내용 입력
3. 태그 추가 (Enter)
4. **저장** 클릭

### 페이지 스캔
- **📡 스캔** 클릭 → 현재 페이지의 모든 컴포넌트를 수집
- "트리" 탭에서 구조 확인 가능

### 정책 검색
- "검색" 탭에서 전체 정책을 제목/내용/태그로 검색

## 현재 기능 (프로토타입)

- [x] DOM 요소 선택 + 하이라이트
- [x] React 컴포넌트명/계층 추출
- [x] data-pb-id 감지
- [x] Next.js 라우트 정보 추출
- [x] 정책 CRUD (로컬 스토리지 저장)
- [x] 정책 유형별 분류 (6종)
- [x] 적용 범위 (ELEMENT/COMPONENT/PAGE/GLOBAL)
- [x] 상속 정책 표시
- [x] 페이지 스캔 (컴포넌트 트리)
- [x] 정책 검색
- [x] 태그 관리

## 연동 기능 (API 서버 연결 시)

- [x] Oracle DB 연동 (API 서버 — 설정 탭의 API URL)
- [x] AI 분석 (worker → Claude API): 변경 요청 → TODO 자동 생성
- [x] 정책 ↔ 변경요청 연동 (정책 수정 시 changeReason 기반 CR 생성)
- [x] 컴포넌트 UUID resolve (pbId → 실 컴포넌트 매핑)

## 추후 확장

- [ ] 정책 버전 관리
- [ ] 정책 충돌 감지 (확장 UI)
- [ ] 신규 화면 기획 지원

## 설정 (설정 탭)

- **API URL**: Spring Boot API 주소 (기본 `http://localhost:8080`)
- **웹(SaaS) URL**: "웹에서 열기" 대상 주소. 비우면 API URL에서 자동 추론
  (로컬은 `:3000`, 사내망은 API 호스트의 포트 제거).
- **Project ID**: 스캔/정책 등록 대상 프로젝트

## 기술 스택

- Chrome Extension Manifest V3
- Side Panel API
- Content Script (DOM Inspector)
- Chrome Storage API (로컬 저장)
