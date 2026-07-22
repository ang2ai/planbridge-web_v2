// content.js — PlanBridge Content Script
// DOM 요소 선택, React 컴포넌트 추출, 페이지 스캔, 정책 데이터 수집

(function() {
  'use strict';

  // ─── Injected Script 주입 ──────────────────────────────────────
  // React Fiber는 페이지 JS context에서만 접근 가능하므로
  // injected-script.js를 페이지에 <script> 태그로 주입합니다.
  let injectedReady = false;
  const pendingFiberRequests = new Map(); // requestId → { resolve, reject }

  function injectScript() {
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('injected-script.js');
      script.onload = () => script.remove();
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {
      // 주입 실패 시 content.js 내부 Fiber 추출 폴백 사용
    }
  }

  // injected-script에서 오는 메시지 수신
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    // page → content.js 긴급 inspector 제어
    if (event.data && event.data.source === 'planbridge-page') {
      if (event.data.type === 'ACTIVATE_INSPECTOR' && !inspectorActive) {
        activateInspector();
        try { chrome.runtime.sendMessage({ type: 'INSPECTOR_ACTIVATED' }); } catch(e) {}
      }
      if (event.data.type === 'DEACTIVATE_INSPECTOR' && inspectorActive) {
        deactivateInspector();
        try { chrome.runtime.sendMessage({ type: 'INSPECTOR_DEACTIVATED' }); } catch(e) {}
      }
      return;
    }
    if (!event.data || event.data.source !== 'planbridge-injected') return;

    const { type, requestId, payload } = event.data;

    if (type === 'PB_INJECTED_READY') {
      injectedReady = true;
      return;
    }

    if (requestId && pendingFiberRequests.has(requestId)) {
      const { resolve } = pendingFiberRequests.get(requestId);
      pendingFiberRequests.delete(requestId);
      resolve(payload);
    }
  });

  // injected-script에 요청 보내고 Promise로 결과 수신
  function requestFromInjected(type, payload, timeoutMs = 500) {
    return new Promise((resolve) => {
      if (!injectedReady) { resolve(null); return; }
      const requestId = Math.random().toString(36).slice(2);
      const timer = setTimeout(() => {
        pendingFiberRequests.delete(requestId);
        resolve(null);
      }, timeoutMs);
      pendingFiberRequests.set(requestId, {
        resolve: (data) => { clearTimeout(timer); resolve(data); }
      });
      window.postMessage({ source: 'planbridge-content', type, requestId, payload }, '*');
    });
  }

  // 페이지 로드 시 injected-script 주입
  injectScript();

  let inspectorActive = false;
  let overlay = null;
  let overlayLabel = null;
  let selectedOverlay = null;
  let currentHoveredElement = null;

  // ─── DOM 변경 자동 스캔 ───
  let domObserver = null;
  let scanDebounceTimer = null;
  const SCAN_DEBOUNCE_MS = 800; // DOM 변경 후 800ms 동안 추가 변경 없으면 스캔

  // ─── 오버레이 생성 ───
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'pb-overlay';
    document.body.appendChild(overlay);

    overlayLabel = document.createElement('div');
    overlayLabel.className = 'pb-overlay-label';
    document.body.appendChild(overlayLabel);

    selectedOverlay = document.createElement('div');
    selectedOverlay.className = 'pb-selected';
    selectedOverlay.style.display = 'none';
    document.body.appendChild(selectedOverlay);
  }

  function removeOverlay() {
    overlay?.remove();
    overlayLabel?.remove();
    overlay = null;
    overlayLabel = null;
  }

  // ─── 인스펙터 활성화/비활성화 ───
  function activateInspector() {
    if (inspectorActive) return;
    inspectorActive = true;
    createOverlay();
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('mousedown', blockEvent, true);
    document.addEventListener('mouseup', blockEvent, true);
    document.addEventListener('pointerdown', blockEvent, true);
    document.addEventListener('pointerup', blockEvent, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.body.classList.add('pb-inspector-cursor');
  }

  function deactivateInspector() {
    if (!inspectorActive) return;
    inspectorActive = false;
    removeOverlay();
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('mousedown', blockEvent, true);
    document.removeEventListener('mouseup', blockEvent, true);
    document.removeEventListener('pointerdown', blockEvent, true);
    document.removeEventListener('pointerup', blockEvent, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.body.classList.remove('pb-inspector-cursor');
    if (selectedOverlay) selectedOverlay.style.display = 'none';
  }

  // ─── React Fiber 추출 ───
  function getReactFiber(element) {
    const fiberKey = Object.keys(element).find(
      key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
    );
    return fiberKey ? element[fiberKey] : null;
  }

  function getReactInfo(element) {
    const fiber = getReactFiber(element);
    if (!fiber) return null;

    const hierarchy = [];
    let current = fiber;
    let componentName = null;
    let componentProps = null;

    while (current) {
      const type = current.type;
      if (type && typeof type === 'function') {
        const name = type.displayName || type.name;
        if (name && !name.startsWith('_') && name !== 'Fragment') {
          hierarchy.unshift(name);
          if (!componentName) {
            componentName = name;
            try {
              componentProps = sanitizeProps(current.memoizedProps);
            } catch(e) {
              componentProps = {};
            }
          }
        }
      } else if (type && typeof type === 'object' && type.$$typeof) {
        const name = type.displayName || type.render?.displayName || type.render?.name;
        if (name) {
          hierarchy.unshift(name);
          if (!componentName) {
            componentName = name;
            try {
              componentProps = sanitizeProps(current.memoizedProps);
            } catch(e) {
              componentProps = {};
            }
          }
        }
      }
      current = current.return;
    }

    return {
      componentName,
      hierarchy,
      props: componentProps
    };
  }

  function sanitizeProps(props) {
    if (!props) return {};
    const safe = {};
    const seen = new WeakSet();

    for (const [key, value] of Object.entries(props)) {
      if (key === 'children') continue;
      if (typeof value === 'function') {
        safe[key] = `[Function: ${key}]`;
      } else if (value === null || value === undefined) {
        safe[key] = value;
      } else if (typeof value === 'object') {
        if (seen.has(value)) {
          safe[key] = '[Circular]';
        } else {
          seen.add(value);
          try {
            const str = JSON.stringify(value);
            if (str.length < 500) safe[key] = value;
            else safe[key] = '[Large Object]';
          } catch {
            safe[key] = '[Complex Object]';
          }
        }
      } else {
        safe[key] = value;
      }
    }
    return safe;
  }

  // ─── CSS Selector 생성 ───
  function getCssSelector(element) {
    if (element.id) return `#${element.id}`;

    const parts = [];
    let el = element;
    while (el && el !== document.body) {
      let selector = el.tagName.toLowerCase();

      if (el.id) {
        parts.unshift(`#${el.id}`);
        break;
      }

      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\s+/)
          .filter(c => !c.startsWith('pb-') && c.length < 40)
          .slice(0, 2);
        if (classes.length) selector += '.' + classes.join('.');
      }

      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(s => s.tagName === el.tagName);
        if (siblings.length > 1) {
          const idx = siblings.indexOf(el) + 1;
          selector += `:nth-child(${idx})`;
        }
      }

      parts.unshift(selector);
      el = el.parentElement;
    }

    return parts.join(' > ');
  }

  // ─── 페이지에서 정책 데이터 읽기 ───
  // Chrome Extension Content Script는 Isolated World에서 실행되므로
  // 페이지의 window 객체에 접근 불가 → DOM 요소에서 JSON 데이터를 읽음
  // 정책 데이터는 sidepanel에서 직접 관리 (mock-policies.js)
  // content.js에서는 정책 조회 불필요 — Isolated World 문제 우회
  function getPagePolicies() {
    return null;
  }

  function getPoliciesForPbId(pbId, policyMap) {
    if (!policyMap || !pbId) return { applied: [], inherited: [], global: [] };

    const applied = policyMap[pbId] || [];

    const inherited = [];
    const parts = pbId.split('.');
    for (let i = 1; i < parts.length; i++) {
      const parentId = parts.slice(0, i).join('.');
      if (policyMap[parentId]) {
        inherited.push(...policyMap[parentId]);
      }
    }

    const rootKey = parts[0];
    const global = (rootKey !== pbId && policyMap[rootKey]) ? policyMap[rootKey] : [];

    return { applied, inherited, global };
  }

  // ─── 요소 정보 추출 ───
  function extractElementInfo(element) {
    const rect = element.getBoundingClientRect();
    const reactInfo = getReactInfo(element);
    const dataPbId = element.getAttribute('data-pb-id')
      || findClosestPbId(element);

    const info = {
      pbId: dataPbId,
      componentName: reactInfo?.componentName || null,
      cssSelector: getCssSelector(element),

      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className?.toString().substring(0, 200) || null,

      innerText: (element.innerText || '').substring(0, 200).trim(),
      placeholder: element.getAttribute('placeholder'),
      type: element.getAttribute('type'),
      role: element.getAttribute('role'),
      ariaLabel: element.getAttribute('aria-label'),
      href: element.getAttribute('href'),

      pbType: element.getAttribute('data-pb-type') || findClosestPbType(element),

      reactHierarchy: reactInfo?.hierarchy || [],
      reactProps: reactInfo?.props || {},

      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },

      pageUrl: window.location.href,
      pageRoute: window.location.pathname,
      pageTitle: document.title,

      nextData: getNextData(),
      timestamp: new Date().toISOString()
    };

    info.displayId = info.pbId
      || (info.reactHierarchy.length > 0
          ? info.reactHierarchy.slice(-2).join('.')
          : info.cssSelector.split(' > ').slice(-1)[0]);

    // 정책은 sidepanel에서 pbId 기반으로 직접 조회 (content.js에서 안 함)

    return info;
  }

  function findClosestPbId(element) {
    let el = element;
    while (el && el !== document.body) {
      const pbId = el.getAttribute('data-pb-id');
      if (pbId) return pbId;
      el = el.parentElement;
    }
    return null;
  }

  // data-pb-id가 실제로 붙은 조상 요소 자체를 반환 (없으면 원본 그대로)
  // 하이라이트 박스/클릭 대상을 아이콘·텍스트 같은 작은 자식이 아니라
  // 실제 태깅된 컴포넌트 전체 크기로 맞추기 위함
  function findClosestPbElement(element) {
    let el = element;
    while (el && el !== document.body) {
      if (el.hasAttribute('data-pb-id')) return el;
      el = el.parentElement;
    }
    return element;
  }

  function findClosestPbType(element) {
    let el = element;
    while (el && el !== document.body) {
      const pbType = el.getAttribute('data-pb-type');
      if (pbType) return pbType;
      el = el.parentElement;
    }
    return null;
  }

  function getNextData() {
    try {
      const nd = window.__NEXT_DATA__;
      if (nd) {
        return {
          page: nd.page,
          buildId: nd.buildId,
          route: nd.page,
          query: nd.query
        };
      }
    } catch(e) {}
    return null;
  }

  // ─── 인스펙터 이벤트 ───
  function onMouseMove(e) {
    if (!inspectorActive) return;

    const rawTarget = e.target;
    if (rawTarget === overlay || rawTarget === overlayLabel || rawTarget === selectedOverlay) return;
    if (rawTarget.className?.toString().startsWith('pb-')) return;

    // 아이콘/텍스트 같은 하위 요소가 아니라 data-pb-id가 붙은 실제 컴포넌트 전체를 대상으로 함
    const target = findClosestPbElement(rawTarget);

    currentHoveredElement = target;
    const rect = target.getBoundingClientRect();

    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.display = 'block';

    const reactInfo = getReactInfo(target);
    const pbId = target.getAttribute('data-pb-id') || findClosestPbId(target);
    const tagName = target.tagName.toLowerCase();

    let labelText = '';
    if (pbId) {
      labelText = `<span class="pb-tag">pb-id</span>${pbId}`;
    } else if (reactInfo?.componentName) {
      labelText = `<span class="pb-tag">react</span>${reactInfo.componentName}`;
    } else {
      labelText = `<span class="pb-tag">${tagName}</span>${getCssSelector(target).split(' > ').slice(-1)[0]}`;
    }

    const policyMap = getPagePolicies();
    if (policyMap && pbId) {
      const { applied } = getPoliciesForPbId(pbId, policyMap);
      if (applied.length > 0) {
        labelText += ` <span class="pb-tag pb-tag-policy">${applied.length} policies</span>`;
      }
    }

    overlayLabel.innerHTML = labelText;

    let labelTop = rect.top - 26;
    if (labelTop < 4) labelTop = rect.bottom + 4;
    overlayLabel.style.left = Math.max(4, rect.left) + 'px';
    overlayLabel.style.top = labelTop + 'px';
    overlayLabel.style.display = 'block';
  }

  function onClick(e) {
    if (!inspectorActive) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const target = currentHoveredElement || e.target;
    if (!target || target.className?.toString().startsWith('pb-')) return;

    const info = extractElementInfo(target);

    const rect = target.getBoundingClientRect();
    selectedOverlay.style.left = rect.left + 'px';
    selectedOverlay.style.top = rect.top + 'px';
    selectedOverlay.style.width = rect.width + 'px';
    selectedOverlay.style.height = rect.height + 'px';
    selectedOverlay.style.display = 'block';

    try {
      chrome.runtime.sendMessage({ type: 'ELEMENT_SELECTED', data: info });
    } catch(e) {}
  }

  function blockEvent(e) {
    if (!inspectorActive) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  // ─── ESC 키로 선택 모드 취소 ───
  function onKeyDown(e) {
    if (!inspectorActive) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      deactivateInspector();
      try { chrome.runtime.sendMessage({ type: 'INSPECTOR_DEACTIVATED' }); } catch(e) {}
    }
  }

  // ─── 단축키: Ctrl+Shift+F(선택), Ctrl+Shift+S(스캔) ───
  document.addEventListener('keydown', (e) => {
    // 인스펙터 토글: Ctrl+Shift+F
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      if (inspectorActive) {
        deactivateInspector();
        try { chrome.runtime.sendMessage({ type: 'INSPECTOR_DEACTIVATED' }); } catch(e2) {}
      } else {
        activateInspector();
        try { chrome.runtime.sendMessage({ type: 'INSPECTOR_ACTIVATED' }); } catch(e2) {}
      }
    }
    // 스캔: Ctrl+Shift+S
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      scanPage();
    }
  }, false);

  // ─── 페이지 스캔 ───
  // 먼저 injected-script에 스캔 요청 → 결과를 content.js 데이터와 병합
  async function scanPage() {
    const policyMap = getPagePolicies();

    // injected-script로 React Fiber 기반 스캔 시도
    let injectedResult = null;
    if (injectedReady) {
      injectedResult = await requestFromInjected('PB_SCAN_PAGE', {}, 2000);
    }

    // Content script 측 DOM 스캔 (pbId 중심)
    const components = [];
    const allElements = document.querySelectorAll('*');

    allElements.forEach(el => {
      const pbId = el.getAttribute('data-pb-id');
      // injected-script 결과가 있으면 Fiber 정보를 그쪽에서 가져옴
      // 여기서는 DOM 기반 정보 수집 + content.js 내 Fiber 폴백
      const reactInfo = injectedResult ? null : getReactInfo(el);

      if (pbId || (reactInfo?.componentName && reactInfo.componentName !== 'Fragment')) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const cssSelector = getCssSelector(el);

        // injected-script 결과에서 매칭 컴포넌트 찾기
        let injectedComp = null;
        if (injectedResult?.components) {
          injectedComp = injectedResult.components.find(c =>
            c.pbId === pbId || (c.tagName === el.tagName.toLowerCase() &&
              Math.abs(c.rect.x - rect.x) < 2 && Math.abs(c.rect.y - rect.y) < 2)
          );
        }

        const comp = {
          pbId: pbId,
          pbType: el.getAttribute('data-pb-type') || null,
          componentName: injectedComp?.componentName || reactInfo?.componentName || null,
          cssSelector,
          tagName: el.tagName.toLowerCase(),
          reactHierarchy: injectedComp?.reactHierarchy || reactInfo?.hierarchy || [],
          reactProps: injectedComp?.reactProps || reactInfo?.props || {},
          innerText: (el.innerText || '').substring(0, 100).trim(),
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        };

        if (policyMap && pbId) {
          comp.pagePolicies = getPoliciesForPbId(pbId, policyMap);
        }

        components.push(comp);
      }
    });

    // injected-script에서만 발견된 React 컴포넌트 추가 (pbId 없는 것)
    if (injectedResult?.components) {
      injectedResult.components.forEach(ic => {
        if (!ic.pbId && ic.componentName) {
          const alreadyIn = components.some(c => c.componentName === ic.componentName &&
            Math.abs((c.rect?.x || 0) - ic.rect.x) < 2);
          if (!alreadyIn) {
            components.push({
              pbId: null,
              pbType: null,
              componentName: ic.componentName,
              cssSelector: '',
              tagName: ic.tagName,
              reactHierarchy: ic.reactHierarchy || [],
              reactProps: ic.reactProps || {},
              innerText: ic.innerText || '',
              rect: ic.rect
            });
          }
        }
      });
    }

    try { chrome.runtime.sendMessage({
      type: 'SCAN_RESULT',
      data: {
        pageRoute: window.location.pathname,
        pageTitle: document.title,
        pageUrl: window.location.href,
        nextData: injectedResult?.nextData || getNextData(),
        componentCount: components.length,
        components: components,
        hasPolicyData: !!policyMap,
        usedInjectedScript: !!injectedResult,
        scannedAt: new Date().toISOString()
      }
    }); } catch(e) {}
  }

  // ─── DOM 변경 감지 → 자동 스캔 (MutationObserver) ───
  function startDomObserver() {
    if (domObserver) return;

    domObserver = new MutationObserver((mutations) => {
      // PlanBridge 오버레이 요소의 변경은 무시
      const isOnlyPbChange = mutations.every(m => {
        const target = m.target;
        if (target.className?.toString().startsWith('pb-')) return true;
        if (target.id === '__planbridge_policies__') return true;
        // addedNodes / removedNodes 중 pb- 요소만 있는 경우
        const nodes = [...(m.addedNodes || []), ...(m.removedNodes || [])];
        return nodes.length > 0 && nodes.every(n =>
          n.nodeType !== 1 || n.className?.toString().startsWith('pb-')
        );
      });
      if (isOnlyPbChange) return;

      // 디바운스: 연속 변경이 끝난 후 한 번만 스캔
      clearTimeout(scanDebounceTimer);
      scanDebounceTimer = setTimeout(() => {
        scanPage().catch(() => {});
      }, SCAN_DEBOUNCE_MS);
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-pb-id', 'data-pb-type', 'class']
    });
  }

  function stopDomObserver() {
    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
    }
    clearTimeout(scanDebounceTimer);
  }

  // ─── 메시지 수신 ───
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_INSPECTOR') {
      if (inspectorActive) {
        deactivateInspector();
        try { chrome.runtime.sendMessage({ type: 'INSPECTOR_DEACTIVATED' }); } catch(e) {}
      } else {
        activateInspector();
        try { chrome.runtime.sendMessage({ type: 'INSPECTOR_ACTIVATED' }); } catch(e) {}
      }
      sendResponse({ active: inspectorActive });
    }

    if (message.type === 'SCAN_PAGE') {
      scanPage().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
      return true; // async response
    }

    // DOM 자동 스캔 ON/OFF
    if (message.type === 'START_DOM_OBSERVER') {
      startDomObserver();
      sendResponse({ ok: true });
    }
    if (message.type === 'STOP_DOM_OBSERVER') {
      stopDomObserver();
      sendResponse({ ok: true });
    }

    if (message.type === 'HIGHLIGHT_ELEMENT') {
      const selector = message.cssSelector;
      try {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (!selectedOverlay) {
            selectedOverlay = document.createElement('div');
            selectedOverlay.className = 'pb-selected';
            document.body.appendChild(selectedOverlay);
          }
          selectedOverlay.style.left = rect.left + 'px';
          selectedOverlay.style.top = rect.top + 'px';
          selectedOverlay.style.width = rect.width + 'px';
          selectedOverlay.style.height = rect.height + 'px';
          selectedOverlay.style.display = 'block';
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch(e) {}
    }

    return true;
  });

  // ─── 초기 자동 스캔 시작 ───
  // 페이지 로드 후 바로 DOM 감시 시작
  startDomObserver();

  // ─── 정책 상태 시각화 ─────────────────────────────────────────
  // 선택 모드 ON 시 data-pb-id 요소에 색상 테두리 적용
  let policyStatusCache = {}; // { pbId: 'has_policy' | 'no_policy' | 'inherited_only' }
  let tooltipEl = null;
  let modeBadgeEl = null;
  let visualizationActive = false;

  function createTooltip() {
    if (tooltipEl) return;
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'pb-tooltip';
    tooltipEl.style.display = 'none';
    document.body.appendChild(tooltipEl);
  }

  function showTooltip(e, pbId, status) {
    if (!tooltipEl) return;
    const labels = {
      has_policy: { dot: 'pb-dot-green', text: '정책 등록됨' },
      no_policy: { dot: 'pb-dot-red', text: '정책 없음 — 클릭해서 등록하세요' },
      inherited_only: { dot: 'pb-dot-yellow', text: '상속 정책만 있음' },
    };
    const info = labels[status] || labels['no_policy'];
    tooltipEl.innerHTML = `
      <div class="pb-tooltip-title">
        <span class="pb-tooltip-dot ${info.dot}"></span>${pbId}
      </div>
      <div class="pb-tooltip-meta">${info.text}</div>
    `;
    tooltipEl.style.display = 'block';
    tooltipEl.style.left = (e.clientX + 12) + 'px';
    tooltipEl.style.top = (e.clientY - 10) + 'px';
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  function showModeBadge() {
    if (modeBadgeEl) return;
    modeBadgeEl = document.createElement('div');
    modeBadgeEl.className = 'pb-mode-badge';
    modeBadgeEl.innerHTML = `
      🔍 선택 모드
      <div class="pb-legend">
        <span class="pb-legend-dot" style="background:#22c55e"></span>정책 있음
        <span class="pb-legend-dot" style="background:#f59e0b;margin-left:6px"></span>상속만
        <span class="pb-legend-dot" style="background:#ef4444;margin-left:6px"></span>없음
      </div>
    `;
    document.body.appendChild(modeBadgeEl);
  }

  function removeModeBadge() {
    if (modeBadgeEl) { modeBadgeEl.remove(); modeBadgeEl = null; }
  }

  function clearPolicyVisualization() {
    document.querySelectorAll('.pb-has-policy, .pb-no-policy, .pb-inherited-only').forEach(el => {
      el.classList.remove('pb-has-policy', 'pb-no-policy', 'pb-inherited-only');
      el.removeEventListener('mousemove', el._pbMouseMove);
      el.removeEventListener('mouseleave', el._pbMouseLeave);
    });
    hideTooltip();
    removeModeBadge();
    visualizationActive = false;
  }

  function applyPolicyVisualization(policyStatusMap) {
    clearPolicyVisualization();
    visualizationActive = true;
    createTooltip();
    showModeBadge();

    const pbElements = document.querySelectorAll('[data-pb-id]');
    pbElements.forEach(el => {
      const pbId = el.getAttribute('data-pb-id');
      const status = policyStatusMap[pbId] || 'no_policy';

      if (status === 'has_policy') {
        el.classList.add('pb-has-policy');
      } else if (status === 'inherited_only') {
        el.classList.add('pb-inherited-only');
      } else {
        el.classList.add('pb-no-policy');
      }

      const moveHandler = (e) => showTooltip(e, pbId, status);
      const leaveHandler = () => hideTooltip();
      el._pbMouseMove = moveHandler;
      el._pbMouseLeave = leaveHandler;
      el.addEventListener('mousemove', moveHandler);
      el.addEventListener('mouseleave', leaveHandler);
    });
  }

  // 정책 상태 메시지 수신
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'APPLY_POLICY_VISUALIZATION') {
      applyPolicyVisualization(message.policyStatusMap || {});
      sendResponse({ ok: true });
    }
    if (message.type === 'CLEAR_POLICY_VISUALIZATION') {
      clearPolicyVisualization();
      sendResponse({ ok: true });
    }
    // GET_PB_IDS: 현재 페이지의 고유 data-pb-id 목록 반환
    // 중복 제거 필수 — 안 하면 sidepanel의 slice(0,50)이 같은 pbId 반복분만 소진하고
    // 뒤쪽의 실제 다른 컴포넌트는 정책 시각화 검사에서 영영 누락됨
    if (message.type === 'GET_PB_IDS') {
      const ids = [...new Set(
        Array.from(document.querySelectorAll('[data-pb-id]'))
          .map(el => el.getAttribute('data-pb-id'))
          .filter(Boolean)
      )];
      sendResponse({ pbIds: ids });
    }
    return true;
  });

})();
