// injected-script.js — PlanBridge Injected Script
// 페이지 JS context에서 실행 — React Fiber 접근 및 __NEXT_DATA__ 읽기
// Content Script에서 document에 <script> 태그로 주입됨
// Content Script와 window.postMessage로 통신

(function () {
  'use strict';

  // ─── React Fiber 추출 ─────────────────────────────────────────
  function extractReactInfo(domElement) {
    const fiberKey = Object.keys(domElement).find(
      key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
    );
    if (!fiberKey) return null;

    const fiber = domElement[fiberKey];
    const hierarchy = [];
    let componentName = null;
    let componentProps = null;

    let current = fiber;
    while (current) {
      const type = current.type;
      if (type && typeof type === 'function') {
        const name = type.displayName || type.name;
        if (name && !name.startsWith('_') && name !== 'Fragment' && name !== 'Anonymous') {
          hierarchy.unshift(name);
          if (!componentName) {
            componentName = name;
            try {
              componentProps = sanitizeProps(current.memoizedProps);
            } catch (e) {
              componentProps = {};
            }
          }
        }
      } else if (type && typeof type === 'object' && type.$$typeof) {
        const name = type.displayName || (type.render && (type.render.displayName || type.render.name));
        if (name && !name.startsWith('_')) {
          hierarchy.unshift(name);
          if (!componentName) {
            componentName = name;
            try {
              componentProps = sanitizeProps(current.memoizedProps);
            } catch (e) {
              componentProps = {};
            }
          }
        }
      }
      current = current.return;
    }

    return { componentName, hierarchy, props: componentProps };
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
            safe[key] = str.length < 500 ? value : '[Large Object]';
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

  // ─── __NEXT_DATA__ 읽기 ────────────────────────────────────────
  function getNextData() {
    try {
      const nd = window.__NEXT_DATA__;
      if (nd) {
        return { page: nd.page, buildId: nd.buildId, route: nd.page, query: nd.query };
      }
    } catch (e) {}
    return null;
  }

  // ─── 전체 컴포넌트 스캔 ────────────────────────────────────────
  function scanAllComponents() {
    const results = [];
    const allElements = document.querySelectorAll('*');

    allElements.forEach(el => {
      const pbId = el.getAttribute('data-pb-id');
      const reactInfo = extractReactInfo(el);

      if (pbId || (reactInfo?.componentName && reactInfo.componentName !== 'Fragment')) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        results.push({
          pbId: pbId || null,
          pbType: el.getAttribute('data-pb-type') || null,
          componentName: reactInfo?.componentName || null,
          reactHierarchy: reactInfo?.hierarchy || [],
          reactProps: reactInfo?.props || {},
          tagName: el.tagName.toLowerCase(),
          innerText: (el.innerText || '').substring(0, 100).trim(),
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        });
      }
    });

    return {
      components: results,
      nextData: getNextData(),
      pageRoute: window.location.pathname,
      pageTitle: document.title,
      pageUrl: window.location.href,
      scannedAt: new Date().toISOString(),
    };
  }

  // ─── 단일 요소 정보 추출 ──────────────────────────────────────
  function extractElementInfo(element) {
    if (!element) return null;
    const reactInfo = extractReactInfo(element);
    return {
      componentName: reactInfo?.componentName || null,
      reactHierarchy: reactInfo?.hierarchy || [],
      reactProps: reactInfo?.props || {},
      nextData: getNextData(),
    };
  }

  // ─── Content Script로부터 메시지 수신 ─────────────────────────
  window.addEventListener('message', (event) => {
    // 동일 출처 메시지만 처리
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'planbridge-content') return;

    const { type, requestId, payload } = event.data;

    if (type === 'PB_SCAN_PAGE') {
      try {
        const result = scanAllComponents();
        window.postMessage({
          source: 'planbridge-injected',
          type: 'PB_SCAN_RESULT',
          requestId,
          payload: result,
        }, '*');
      } catch (e) {
        window.postMessage({
          source: 'planbridge-injected',
          type: 'PB_SCAN_RESULT',
          requestId,
          payload: null,
          error: String(e),
        }, '*');
      }
    }

    if (type === 'PB_GET_ELEMENT_INFO') {
      try {
        // payload.cssSelector로 요소 찾기
        const selector = payload?.cssSelector;
        let info = null;
        if (selector) {
          const el = document.querySelector(selector);
          if (el) info = extractElementInfo(el);
        }
        // payload.elementIndex로 요소 찾기 (전체 DOM 목록 인덱스)
        window.postMessage({
          source: 'planbridge-injected',
          type: 'PB_ELEMENT_INFO',
          requestId,
          payload: info,
        }, '*');
      } catch (e) {
        window.postMessage({
          source: 'planbridge-injected',
          type: 'PB_ELEMENT_INFO',
          requestId,
          payload: null,
          error: String(e),
        }, '*');
      }
    }

    if (type === 'PB_GET_NEXT_DATA') {
      window.postMessage({
        source: 'planbridge-injected',
        type: 'PB_NEXT_DATA',
        requestId,
        payload: getNextData(),
      }, '*');
    }
  });

  // ─── 준비 완료 신호 ────────────────────────────────────────────
  window.postMessage({
    source: 'planbridge-injected',
    type: 'PB_INJECTED_READY',
    payload: {
      version: '1.0.0',
      hasReact: !!(window.React || document.querySelector('[data-reactroot]') ||
        !!Object.keys(document.querySelector('body') || {}).find(k => k.startsWith('__reactFiber$'))),
      hasNextData: !!window.__NEXT_DATA__,
    },
  }, '*');

})();
