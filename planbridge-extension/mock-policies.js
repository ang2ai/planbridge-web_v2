// mock-policies.js — PlanBridge 목업 정책 데이터
// pbId(data-pb-id) 기준으로 해당 컴포넌트의 정책 정보를 조회

window.MOCK_POLICY_MAP = {
  // ── 글로벌 정책 (페이지 루트) ──
  "SamplePage": [
    {
      policyId: "POL-G001",
      policyType: "UI_SPEC",
      scope: "GLOBAL",
      title: "공통 금액 표시 규칙",
      content: "모든 금액은 천단위 콤마 + '원' 접미사로 표시. 소수점 버림.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-01-15",
      version: 2,
    },
    {
      policyId: "POL-G002",
      policyType: "INTERACTION",
      scope: "GLOBAL",
      title: "공통 삭제 확인 규칙",
      content: "삭제 동작 수행 전 반드시 확인 모달을 선행 표시해야 함. '정말 삭제하시겠습니까?' 문구 포함.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-01-15",
      version: 1,
    },
    {
      policyId: "POL-G003",
      policyType: "PERMISSION",
      scope: "GLOBAL",
      title: "관리자 권한 등급",
      content: "일반 관리자: 조회/등록만 허용. 슈퍼관리자: CRUD 전체 허용. 상품삭제는 슈퍼관리자만 가능.",
      approvedBy: "이상훈 (CTO)",
      approvedAt: "2026-01-10",
      version: 1,
    },
  ],

  // ── 검색 영역 ──
  "SamplePage.SearchForm": [
    {
      policyId: "POL-SF001",
      policyType: "UI_SPEC",
      scope: "COMPONENT",
      title: "검색 폼 레이아웃",
      content: "검색 조건은 최대 2행 배치. 첫 행: 상품명, 카테고리, 상태. 두번째 행: 가격범위, 판매자, 날짜.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-02-01",
      version: 1,
    },
  ],

  "SamplePage.SearchForm.ProductNameInput": [
    {
      policyId: "POL-SN001",
      policyType: "VALIDATION",
      scope: "ELEMENT",
      title: "상품명 검색 입력 규칙",
      content: "최소 2자 이상 입력 필요. 특수문자 <, >, \", ' 입력 불가 (XSS 방지). 입력 후 Enter 또는 검색 버튼으로 동작.",
      tableMapping: "PB_PRODUCT.PRODUCT_NAME",
      approvedBy: "김민수 (개발)",
      approvedAt: "2026-02-05",
      version: 2,
    },
  ],

  "SamplePage.SearchForm.CategorySelect": [
    {
      policyId: "POL-SC001",
      policyType: "DATA_SPEC",
      scope: "ELEMENT",
      title: "카테고리 조회 API",
      content: "카테고리 목록은 서버에서 트리 구조로 제공. 1차 선택 시 2차 카테고리 동적 로드.",
      tableMapping: "PB_CATEGORY.CATEGORY_ID, PB_CATEGORY.PARENT_ID",
      apiSpec: "GET /api/categories?parentId={id}",
      approvedBy: "이서연 (백엔드)",
      approvedAt: "2026-02-10",
      version: 1,
    },
  ],

  "SamplePage.SearchForm.StatusSelect": [
    {
      policyId: "POL-SS001",
      policyType: "BIZ_RULE",
      scope: "ELEMENT",
      title: "상태 필터 비즈니스 규칙",
      content: "DELETED 상태는 슈퍼관리자만 검색 가능. 일반 관리자에게는 '삭제' 옵션이 표시되지 않아야 함.",
      tableMapping: "PB_PRODUCT.STATUS",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-02-15",
      version: 1,
    },
  ],

  "SamplePage.SearchForm.PriceRange": [
    {
      policyId: "POL-SP001",
      policyType: "VALIDATION",
      scope: "ELEMENT",
      title: "가격 범위 검증",
      content: "최소가격은 0 이상, 최대가격은 100,000,000 이하. 최소 > 최대일 경우 경고 표시. 10원 단위만 입력 가능.",
      tableMapping: "PB_PRODUCT.PRICE",
      approvedBy: "김민수 (개발)",
      approvedAt: "2026-02-05",
      version: 1,
    },
  ],

  "SamplePage.SearchForm.SellerInput": [
    {
      policyId: "POL-SV001",
      policyType: "DATA_SPEC",
      scope: "ELEMENT",
      title: "판매자 검색 API",
      content: "판매자명 자동완성 지원. 입력 멈춘 후 300ms 뒤 API 호출. 최대 10건 추천 표시.",
      tableMapping: "PB_SELLER.SELLER_NAME",
      apiSpec: "GET /api/sellers/autocomplete?q={keyword}&limit=10",
      approvedBy: "이서연 (백엔드)",
      approvedAt: "2026-02-20",
      version: 1,
    },
  ],

  "SamplePage.SearchForm.DateRange": [
    {
      policyId: "POL-SD001",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "날짜 범위 선택 규칙",
      content: "기본값: 최근 30일. 최대 조회 범위: 1년. 미래 날짜 선택 불가. 형식: YYYY-MM-DD.",
      tableMapping: "PB_PRODUCT.CREATED_AT",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-02-01",
      version: 1,
    },
  ],

  "SamplePage.SearchForm.SearchButton": [
    {
      policyId: "POL-SB001",
      policyType: "INTERACTION",
      scope: "ELEMENT",
      title: "검색 버튼 동작",
      content: "클릭 시 검색 조건 유효성 검증 후 API 호출. 로딩 중 버튼 비활성화. 결과 0건 시 '검색 결과가 없습니다' 안내.",
      apiSpec: "GET /api/products?name={}&category={}&status={}&priceMin={}&priceMax={}&seller={}&from={}&to={}&page=1&size=20",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-02-01",
      version: 1,
    },
  ],

  // ── 그리드 영역 ──
  "SamplePage.ProductGrid": [
    {
      policyId: "POL-PG001",
      policyType: "UI_SPEC",
      scope: "COMPONENT",
      title: "상품 그리드 표시 규칙",
      content: "기본 정렬: 최신 등록순. 페이징: 20건 단위. 컬럼: 상품ID, 상품명, 카테고리, 가격, 할인율, 재고, 상태, 판매자, 등록일.",
      tableMapping: "PB_PRODUCT (전체 조회)",
      apiSpec: "GET /api/products?page={page}&size=20&sort=createdAt,desc",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-02-25",
      version: 2,
    },
    {
      policyId: "POL-PG002",
      policyType: "INTERACTION",
      scope: "COMPONENT",
      title: "그리드 행 선택 동작",
      content: "행 클릭 시 우측에 수정 패널 표시. 선택된 행은 하이라이트(파란 배경). 동시에 1건만 선택 가능.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-02-25",
      version: 1,
    },
  ],

  "SamplePage.ProductGrid.ProductIdCell": [
    {
      policyId: "POL-PC001",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "상품ID 셀 표시",
      content: "PRD-XXX 형태로 고정 표시. 수정 불가(읽기 전용). 클릭 시 클립보드 복사.",
      tableMapping: "PB_PRODUCT.PRODUCT_ID (PK, VARCHAR2(36))",
      approvedBy: "김민수 (개발)",
      approvedAt: "2026-02-25",
      version: 1,
    },
  ],

  "SamplePage.ProductGrid.PriceCell": [
    {
      policyId: "POL-PP001",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "가격 셀 표시",
      content: "천단위 콤마 적용. '원' 접미사. 할인 있을 시 원가 취소선 + 할인가 강조.",
      tableMapping: "PB_PRODUCT.PRICE (NUMBER(10))",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-02-25",
      version: 1,
    },
  ],

  "SamplePage.ProductGrid.StatusCell": [
    {
      policyId: "POL-PS001",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "상태 셀 표시",
      content: "뱃지 색상 — 판매중: green, 품절: orange, 숨김: gray, 삭제: red.",
      tableMapping: "PB_PRODUCT.STATUS (VARCHAR2(20))",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-02-25",
      version: 1,
    },
  ],

  // ── 수정 패널 ──
  "SamplePage.EditPanel": [
    {
      policyId: "POL-EP001",
      policyType: "UI_SPEC",
      scope: "COMPONENT",
      title: "수정 패널 레이아웃",
      content: "우측 슬라이드 패널 형태. 너비 400px. 상단: 상품ID(읽기전용), 하단: 수정 가능 필드들. 저장/취소 버튼.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
    {
      policyId: "POL-EP002",
      policyType: "INTERACTION",
      scope: "COMPONENT",
      title: "수정 패널 저장 동작",
      content: "저장 클릭 → 유효성 검증 → API 호출(PUT) → 성공 시 토스트 '저장되었습니다' → 그리드 갱신. 실패 시 에러 메시지 표시.",
      apiSpec: "PUT /api/products/{productId}",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "SamplePage.EditPanel.ProductNameField": [
    {
      policyId: "POL-EN001",
      policyType: "VALIDATION",
      scope: "ELEMENT",
      title: "상품명 수정 검증",
      content: "필수 입력. 최소 2자 ~ 최대 100자. 특수문자 <, >, \", ' 사용 불가. 앞뒤 공백 자동 trim. 중복 상품명 실시간 검증 (500ms debounce).",
      tableMapping: "PB_PRODUCT.PRODUCT_NAME (VARCHAR2(200), NOT NULL)",
      apiSpec: "GET /api/products/check-name?name={name}&excludeId={productId}",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-05",
      version: 2,
    },
  ],

  "SamplePage.EditPanel.PriceField": [
    {
      policyId: "POL-EP-PRICE001",
      policyType: "VALIDATION",
      scope: "ELEMENT",
      title: "가격 수정 검증",
      content: "숫자만 입력 가능. 최소 100원 ~ 최대 10,000,000원. 10원 단위만 허용.",
      tableMapping: "PB_PRODUCT.PRICE (NUMBER(10), NOT NULL)",
      approvedBy: "김민수 (개발)",
      approvedAt: "2026-03-05",
      version: 1,
    },
    {
      policyId: "POL-EP-PRICE002",
      policyType: "BIZ_RULE",
      scope: "ELEMENT",
      title: "할인가 제약 규칙",
      content: "할인가는 원가의 10% 이상이어야 함 (90% 이상 할인 금지). 위반 시 '할인율이 너무 높습니다' 경고.",
      tableMapping: "PB_PRODUCT.DISCOUNT_RATE (NUMBER(3))",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-05",
      version: 1,
    },
  ],

  "SamplePage.EditPanel.DiscountField": [
    {
      policyId: "POL-ED001",
      policyType: "VALIDATION",
      scope: "ELEMENT",
      title: "할인율 입력 규칙",
      content: "0 ~ 90 범위 정수만 입력 가능. 단위: %. 빈 값 허용(할인 없음 = 0).",
      tableMapping: "PB_PRODUCT.DISCOUNT_RATE (NUMBER(3), DEFAULT 0)",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-05",
      version: 1,
    },
  ],

  "SamplePage.EditPanel.StockField": [
    {
      policyId: "POL-ES001",
      policyType: "BIZ_RULE",
      scope: "ELEMENT",
      title: "재고 수정 비즈니스 규칙",
      content: "재고 0으로 변경 시 상태를 자동으로 SOLDOUT으로 전환할지 확인 모달 표시. 음수 입력 불가.",
      tableMapping: "PB_PRODUCT.STOCK (NUMBER(7), NOT NULL)",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-10",
      version: 1,
    },
  ],

  "SamplePage.EditPanel.StatusField": [
    {
      policyId: "POL-EST001",
      policyType: "PERMISSION",
      scope: "ELEMENT",
      title: "상태 변경 권한",
      content: "SALE ↔ HIDDEN: 일반 관리자 허용. DELETED 전환: 슈퍼관리자만 허용. SOLDOUT → SALE: 재고 1 이상일 때만 허용.",
      tableMapping: "PB_PRODUCT.STATUS (VARCHAR2(20))",
      approvedBy: "이상훈 (CTO)",
      approvedAt: "2026-03-10",
      version: 2,
    },
  ],

  "SamplePage.EditPanel.SaveButton": [
    {
      policyId: "POL-ESV001",
      policyType: "INTERACTION",
      scope: "ELEMENT",
      title: "저장 버튼 동작",
      content: "모든 필드 유효성 검증 통과 후 활성화. 클릭 시 PUT API 호출. 저장 중 스피너 표시. 성공/실패 토스트 메시지.",
      apiSpec: "PUT /api/products/{productId}  Body: { productName, price, discountRate, stock, status }",
      approvedBy: "이서연 (백엔드)",
      approvedAt: "2026-03-10",
      version: 1,
    },
  ],

  // ══════════════════════════════════════════════════════════════
  // DemoPage — 주문 관리 어드민 (FreshMart)
  // ══════════════════════════════════════════════════════════════

  // ── 페이지 전역 ──
  "DemoPage": [
    {
      policyId: "POL-D-G001",
      policyType: "PERMISSION",
      scope: "GLOBAL",
      title: "주문 관리 접근 권한",
      content: "주문 조회: 일반 관리자 이상. 주문 상태 변경: 운영 관리자 이상. 주문 취소처리: 슈퍼관리자만 가능.",
      approvedBy: "이상훈 (CTO)",
      approvedAt: "2026-01-10",
      version: 1,
    },
    {
      policyId: "POL-D-G002",
      policyType: "UI_SPEC",
      scope: "GLOBAL",
      title: "공통 금액 표시 규칙",
      content: "모든 금액은 천단위 콤마 + '원' 접미사로 표시. 소수점 버림. 예: 49,800원.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-01-15",
      version: 2,
    },
    {
      policyId: "POL-D-G003",
      policyType: "BIZ_RULE",
      scope: "GLOBAL",
      title: "주문 상태 전이 규칙",
      content: "PAID → PREPARING → SHIPPED → DELIVERED (순방향만 허용). CANCELLED는 PAID 또는 PREPARING 상태에서만 가능. SHIPPED 이후 취소 불가.",
      tableMapping: "FM_ORDER.STATUS (VARCHAR2(20))",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-02-01",
      version: 2,
    },
  ],

  // ── 통계 카드 영역 ──
  "DemoPage.StatsRow": [
    {
      policyId: "POL-D-SR001",
      policyType: "UI_SPEC",
      scope: "COMPONENT",
      title: "통계 카드 배치 규칙",
      content: "상단 4개 카드: 오늘 주문 / 신규 회원 / 오늘 매출 / 처리 대기. 모바일에서는 2×2 그리드. 각 카드 클릭 시 해당 목록 필터링.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
    {
      policyId: "POL-D-SR002",
      policyType: "DATA_SPEC",
      scope: "COMPONENT",
      title: "통계 집계 기준",
      content: "기준 시각: 서버 KST 00:00 ~ 현재. 실시간 집계(30초 폴링). 오늘 매출 = PAID + SHIPPED + DELIVERED 합산. 처리 대기 = PREPARING + 취소 요청 건수.",
      apiSpec: "GET /api/orders/stats?date=today",
      approvedBy: "이서연 (백엔드)",
      approvedAt: "2026-03-05",
      version: 1,
    },
  ],

  "DemoPage.StatsRow.오늘주문Card": [
    {
      policyId: "POL-D-OC001",
      policyType: "DATA_SPEC",
      scope: "ELEMENT",
      title: "오늘 주문 카드 집계 기준",
      content: "오늘 주문 수는 당일 00:00~현재 시각까지 CONFIRMED 이상 상태의 주문을 집계합니다. 취소·반품 건은 제외합니다.",
      tableMapping: "FM_ORDER.ORDERED_AT (DATE), STATUS != 'CANCELLED'",
      apiSpec: "GET /api/orders/stats?type=today_count",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-05",
      version: 1,
    },
    {
      policyId: "POL-D-OC002",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "오늘 주문 카드 증감 표시",
      content: "전일 대비 증감은 ±N건 형식으로 표시하며, 증가는 초록색 ▲, 감소는 빨간색 ▼로 구분합니다.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-05",
      version: 1,
    },
  ],

  "DemoPage.StatsRow.신규회원Card": [
    {
      policyId: "POL-D-NC001",
      policyType: "DATA_SPEC",
      scope: "ELEMENT",
      title: "신규 회원 카드 집계 기준",
      content: "오늘 가입한 신규 회원 수를 표시합니다. 가입 완료(이메일 인증 포함) 기준. 탈퇴 회원은 제외합니다.",
      tableMapping: "FM_MEMBER.JOINED_AT (DATE), STATUS = 'ACTIVE'",
      apiSpec: "GET /api/orders/stats?type=new_members",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-05",
      version: 1,
    },
    {
      policyId: "POL-D-NC002",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "신규 회원 카드 증감 표시",
      content: "전일 대비 증감을 ±N명으로 표시. 5명 이상 증가 시 초록색 강조. 감소 시 주황색으로 표시합니다.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-05",
      version: 1,
    },
  ],

  "DemoPage.StatsRow.오늘매출Card": [
    {
      policyId: "POL-D-SC001",
      policyType: "DATA_SPEC",
      scope: "ELEMENT",
      title: "오늘 매출 카드 집계 기준",
      content: "오늘 결제 완료된 주문의 총 결제금액 합산. PAID·SHIPPED·DELIVERED 상태만 포함. 취소·환불 금액은 차감합니다.",
      tableMapping: "FM_ORDER.TOTAL_PRICE (NUMBER), STATUS IN ('PAID','SHIPPED','DELIVERED')",
      apiSpec: "GET /api/orders/stats?type=today_revenue",
      approvedBy: "이서연 (백엔드)",
      approvedAt: "2026-03-05",
      version: 1,
    },
    {
      policyId: "POL-D-SC002",
      policyType: "BIZ_RULE",
      scope: "ELEMENT",
      title: "매출 목표 대비 표시",
      content: "당일 목표 매출 대비 달성률을 % 형태로 표시합니다. 목표는 운영팀 설정값을 사용. 100% 초과 시 초록색 강조.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-05",
      version: 1,
    },
  ],

  "DemoPage.StatsRow.처리대기Card": [
    {
      policyId: "POL-D-PC001",
      policyType: "BIZ_RULE",
      scope: "ELEMENT",
      title: "처리 대기 알림 규칙",
      content: "처리 대기 건수가 5건 이상이면 카드 배경을 amber로 강조. 10건 이상이면 red 강조 + 알림 뱃지 표시.",
      tableMapping: "FM_ORDER.STATUS IN ('PREPARING') + 취소 요청",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-10",
      version: 1,
    },
  ],

  // ── 검색 폼 ──
  "DemoPage.SearchForm": [
    {
      policyId: "POL-D-SF001",
      policyType: "UI_SPEC",
      scope: "COMPONENT",
      title: "주문 검색 폼 레이아웃",
      content: "검색 조건: 고객명/주문번호 텍스트 입력, 주문 상태 셀렉트. 가로 배치(데스크탑). Enter 키로 검색 실행 가능.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "DemoPage.SearchForm.CustomerInput": [
    {
      policyId: "POL-D-CI001",
      policyType: "VALIDATION",
      scope: "ELEMENT",
      title: "고객명/주문번호 입력 검증",
      content: "고객명: 1자 이상. 주문번호: 'ORD-' 접두사 포함 시 정확 매칭. 특수문자 <, >, ', \" 입력 불가(XSS 방지). 최대 50자.",
      tableMapping: "FM_ORDER.CUSTOMER_NAME, FM_ORDER.ORDER_ID",
      approvedBy: "김민수 (개발)",
      approvedAt: "2026-03-05",
      version: 1,
    },
    {
      policyId: "POL-D-CI002",
      policyType: "INTERACTION",
      scope: "ELEMENT",
      title: "검색 입력 UX",
      content: "Enter 키 입력 시 즉시 검색 실행. 입력값 지울 시 자동으로 전체 목록 복원. Placeholder: '고객명 또는 주문번호'.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-05",
      version: 1,
    },
  ],

  "DemoPage.SearchForm.StatusSelect": [
    {
      policyId: "POL-D-SS001",
      policyType: "DATA_SPEC",
      scope: "ELEMENT",
      title: "주문 상태 필터 옵션",
      content: "옵션: 전체(ALL) / 결제완료(PAID) / 준비중(PREPARING) / 배송중(SHIPPED) / 배송완료(DELIVERED) / 취소(CANCELLED). 기본값: 전체.",
      tableMapping: "FM_ORDER.STATUS (VARCHAR2(20))",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "DemoPage.SearchForm.SearchButton": [
    {
      policyId: "POL-D-SB001",
      policyType: "INTERACTION",
      scope: "ELEMENT",
      title: "검색 버튼 동작",
      content: "클릭 시 입력값 유효성 확인 후 API 호출. 로딩 중 버튼 비활성화 + 스피너. 결과 0건 시 '검색 결과가 없습니다' 안내 메시지.",
      apiSpec: "GET /api/orders?customer={}&status={}&page=1&size=50",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "DemoPage.SearchForm.ResetButton": [
    {
      policyId: "POL-D-RB001",
      policyType: "INTERACTION",
      scope: "ELEMENT",
      title: "초기화 버튼 동작",
      content: "모든 검색 조건 초기화 + 결과 목록 전체 복원(재검색). 선택된 주문 상세 패널도 닫힘.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  // ── 주문 테이블 ──
  "DemoPage.OrderTable": [
    {
      policyId: "POL-D-OT001",
      policyType: "UI_SPEC",
      scope: "COMPONENT",
      title: "주문 목록 테이블 규칙",
      content: "컬럼: 주문번호, 고객명, 상품(수량), 결제금액, 상태, 결제수단, 주문일. 기본 정렬: 최신 주문일순. 페이지당 50건.",
      tableMapping: "FM_ORDER (전체 조회)",
      apiSpec: "GET /api/orders?page={page}&size=50&sort=orderedAt,desc",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 2,
    },
    {
      policyId: "POL-D-OT002",
      policyType: "INTERACTION",
      scope: "COMPONENT",
      title: "행 클릭 동작",
      content: "행 클릭 시 우측 상세 패널 표시. 선택 행 파란 배경 하이라이트. 동시에 1건만 선택 가능.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "DemoPage.OrderTable.OrderIdCol": [
    {
      policyId: "POL-D-OI001",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "주문번호 컬럼 표시",
      content: "ORD-YYYY-NNNNN 형태 고정. 모노스페이스 폰트. 클릭 시 클립보드 복사 + '복사됨' 툴팁 표시.",
      tableMapping: "FM_ORDER.ORDER_ID (VARCHAR2(20), PK)",
      approvedBy: "김민수 (개발)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "DemoPage.OrderTable.CustomerCol": [
    {
      policyId: "POL-D-CC001",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "고객명 컬럼 표시",
      content: "실명 마스킹: 성 제외 나머지는 * 처리 (예: 김**). 일반 관리자에게만 마스킹 적용. 슈퍼관리자는 전체 이름 표시.",
      tableMapping: "FM_ORDER.CUSTOMER_NAME (VARCHAR2(50))",
      approvedBy: "이상훈 (CTO)",
      approvedAt: "2026-03-10",
      version: 1,
    },
  ],

  "DemoPage.OrderTable.PriceCol": [
    {
      policyId: "POL-D-TC001",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "결제금액 컬럼 표시",
      content: "천단위 콤마 + '원' 접미사. 50,000원 이상은 bold + 파란색 강조. 취소 주문은 취소선 처리.",
      tableMapping: "FM_ORDER.TOTAL_PRICE (NUMBER(12))",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "DemoPage.OrderTable.StatusCol": [
    {
      policyId: "POL-D-SC001",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "주문 상태 뱃지 색상 규칙",
      content: "결제완료(PAID): blue. 준비중(PREPARING): orange. 배송중(SHIPPED): indigo. 배송완료(DELIVERED): green. 취소(CANCELLED): red.",
      tableMapping: "FM_ORDER.STATUS (VARCHAR2(20))",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  // ── 주문 상세 패널 ──
  "DemoPage.OrderDetailPanel": [
    {
      policyId: "POL-D-DP001",
      policyType: "UI_SPEC",
      scope: "COMPONENT",
      title: "주문 상세 패널 레이아웃",
      content: "우측 1/3 컬럼. 상단: 주문번호(읽기전용). 고객 정보 블록, 주문 상품 블록, 상태 변경 셀렉트, 메모 입력, 저장/취소 버튼.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
    {
      policyId: "POL-D-DP002",
      policyType: "INTERACTION",
      scope: "COMPONENT",
      title: "패널 열기/닫기",
      content: "주문 행 클릭 시 패널 표시. 우상단 X 버튼 또는 다른 행 클릭 시 닫힘. 저장/취소 후에도 패널 유지(UX 일관성).",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "DemoPage.OrderDetailPanel.CustomerInfo": [
    {
      policyId: "POL-D-DCI001",
      policyType: "DATA_SPEC",
      scope: "ELEMENT",
      title: "고객 정보 블록 데이터",
      content: "표시 항목: 이름, 연락처. 연락처는 010-****-NNNN 마스킹(일반 관리자). 슈퍼관리자는 전체 노출. 클릭 시 고객 상세 페이지로 이동.",
      tableMapping: "FM_ORDER.CUSTOMER_NAME, FM_ORDER.CUSTOMER_PHONE",
      approvedBy: "이상훈 (CTO)",
      approvedAt: "2026-03-10",
      version: 1,
    },
  ],

  "DemoPage.OrderDetailPanel.ProductInfo": [
    {
      policyId: "POL-D-DPI001",
      policyType: "DATA_SPEC",
      scope: "ELEMENT",
      title: "주문 상품 블록 데이터",
      content: "상품명, 수량, 결제금액, 결제수단 표시. 금액은 천단위 콤마. 묶음 주문의 경우 상품목록 펼치기/접기 기능 제공.",
      tableMapping: "FM_ORDER_ITEM.PRODUCT_NAME, FM_ORDER_ITEM.QTY, FM_ORDER.TOTAL_PRICE",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "DemoPage.OrderDetailPanel.StatusChanger": [
    {
      policyId: "POL-D-DSC001",
      policyType: "BIZ_RULE",
      scope: "ELEMENT",
      title: "주문 상태 변경 제약",
      content: "상태 전이 규칙 준수 필수. SHIPPED 이후 상태는 되돌릴 수 없음. 현재 상태 = 선택 기본값. 변경 가능한 상태만 옵션 표시(disabled 처리 불가 상태).",
      tableMapping: "FM_ORDER.STATUS",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 2,
    },
    {
      policyId: "POL-D-DSC002",
      policyType: "PERMISSION",
      scope: "ELEMENT",
      title: "상태 변경 권한별 제한",
      content: "일반 관리자: PAID→PREPARING, PREPARING→SHIPPED만 허용. 운영 관리자: SHIPPED→DELIVERED 추가. 슈퍼관리자: 전체 상태 변경 가능.",
      approvedBy: "이상훈 (CTO)",
      approvedAt: "2026-03-10",
      version: 1,
    },
  ],

  "DemoPage.OrderDetailPanel.MemoField": [
    {
      policyId: "POL-D-DMF001",
      policyType: "VALIDATION",
      scope: "ELEMENT",
      title: "처리 메모 입력 규칙",
      content: "최대 500자. 상태 변경 시 메모 필수(빈 값 불가). 메모는 처리 이력으로 저장되어 삭제 불가. 특수문자 허용.",
      tableMapping: "FM_ORDER_HISTORY.MEMO (VARCHAR2(500))",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "DemoPage.OrderDetailPanel.ActionButtons": [
    {
      policyId: "POL-D-DAB001",
      policyType: "UI_SPEC",
      scope: "ELEMENT",
      title: "액션 버튼 배치",
      content: "저장 버튼(primary, flex-1), 취소처리 버튼(destructive outline). 취소처리는 PAID·PREPARING 상태에서만 활성화.",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-01",
      version: 1,
    },
  ],

  "DemoPage.OrderDetailPanel.ActionButtons.SaveButton": [
    {
      policyId: "POL-D-SBT001",
      policyType: "INTERACTION",
      scope: "ELEMENT",
      title: "저장 버튼 동작",
      content: "클릭 → 유효성 검증(메모 필수) → PUT API 호출 → 성공 시 '저장되었습니다' 토스트 + 목록 갱신. 실패 시 에러 메시지. 저장 중 버튼 비활성화.",
      apiSpec: "PUT /api/orders/{orderId}  Body: { status, memo }",
      approvedBy: "이서연 (백엔드)",
      approvedAt: "2026-03-05",
      version: 1,
    },
  ],

  "DemoPage.OrderDetailPanel.ActionButtons.CancelButton": [
    {
      policyId: "POL-D-CBT001",
      policyType: "BIZ_RULE",
      scope: "ELEMENT",
      title: "취소처리 버튼 제약",
      content: "PAID·PREPARING 상태에서만 활성화. 클릭 시 확인 모달 선행 표시('정말 취소 처리하시겠습니까?'). 확인 후 POST /api/orders/{orderId}/cancel 호출.",
      apiSpec: "POST /api/orders/{orderId}/cancel  Body: { reason, memo }",
      approvedBy: "박지현 (PM)",
      approvedAt: "2026-03-05",
      version: 1,
    },
    {
      policyId: "POL-D-CBT002",
      policyType: "PERMISSION",
      scope: "ELEMENT",
      title: "취소처리 권한",
      content: "슈퍼관리자만 가능. 일반 관리자·운영 관리자에게는 버튼 숨김 처리.",
      approvedBy: "이상훈 (CTO)",
      approvedAt: "2026-03-10",
      version: 1,
    },
  ],
};
