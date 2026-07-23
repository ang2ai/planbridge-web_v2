// sidepanel.js — PlanBridge Side Panel Logic

(function() {
  'use strict';

  // ─── State ───
  let selectedElement = null;
  let inspectorActive = false;
  let autoScanActive = true;
  let scanData = null;
  let editingPolicyId = null;
  let currentTags = [];
  let currentMode = 'planner'; // 'planner' | 'dev'
  let currentPolicies = [];    // 현재 선택 요소에 로드된 정책 목록 (실제 policyId 보유)

  // ─── Settings Helpers ───
  // API URL 로부터 SaaS 웹 URL을 추론한다 (webUrl 미설정 시 폴백).
  // 로컬 개발: 포트 → 3000. 그 외(사내망 등): :8080 제거 후 원래 호스트 사용.
  function deriveWebUrl(apiUrl) {
    if (!apiUrl) return 'http://localhost:3000';
    if (/localhost|127\.0\.0\.1/.test(apiUrl)) {
      return apiUrl.replace(/:\d+/, ':3000');
    }
    // 사내망 등: api 호스트에서 포트만 제거 (예: http://pb-api:8080 → http://pb-api)
    return apiUrl.replace(/:8080\b/, '');
  }

  async function getSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['apiUrl', 'projectId', 'webUrl'], (data) => {
        const apiUrl = data.apiUrl || 'http://localhost:8080';
        resolve({
          apiUrl,
          projectId: data.projectId || '',
          // 명시 설정값 우선, 없으면 apiUrl 로부터 추론
          webUrl: (data.webUrl && data.webUrl.trim()) || deriveWebUrl(apiUrl)
        });
      });
    });
  }

  function showError(message) {
    showToast(message, 'warning');
  }

  // fetch 래퍼: 네트워크 실패(서버 다운/CORS 등)를 사용자가 이해할 수 있는 메시지로 변환.
  // 반환값은 일반 Response 이므로 기존 res.ok / res.json() 로직을 그대로 사용한다.
  async function safeFetch(url, options) {
    try {
      return await fetch(url, options);
    } catch (e) {
      throw new Error('API 서버에 연결할 수 없습니다. 설정에서 API URL을 확인하세요.');
    }
  }

  // ─── API Helpers ───
  // content.js 스캔 결과를 백엔드 ScanDataRequest 형식으로 변환.
  // (pageRoute→routePath, tagName→elementTag, innerText→currentText,
  //  reactHierarchy 배열→JSON 문자열 — 백엔드 DTO가 String 필드)
  function toScanRequest(scanData) {
    const comps = (scanData.components || [])
      .filter(c => c.pbId) // pbId 없는 요소는 upsert 키가 없어 제외
      .map((c, i) => ({
        pbId: c.pbId,
        componentName: c.componentName || c.pbId,
        cssSelector: c.cssSelector || '',
        componentType: c.pbType || null,
        elementTag: c.tagName || null,
        currentProps: c.reactProps ? JSON.stringify(c.reactProps) : null,
        currentText: c.innerText || null,
        reactHierarchy: Array.isArray(c.reactHierarchy)
          ? JSON.stringify(c.reactHierarchy)
          : (c.reactHierarchy || null),
        treePath: Array.isArray(c.reactHierarchy) ? c.reactHierarchy.join(' > ') : null,
        depthLevel: Array.isArray(c.reactHierarchy) ? c.reactHierarchy.length : null,
        sortOrder: i
      }));
    return {
      routePath: scanData.pageRoute || '/',
      pageTitle: scanData.pageTitle || null,
      scanType: 'EXTENSION',
      scannedBy: 'extension',
      components: comps
    };
  }

  async function sendScanToApi(scanPayload) {
    const { apiUrl, projectId } = await getSettings();
    if (!projectId) { showError('Project ID를 설정해주세요'); return null; }
    const res = await safeFetch(`${apiUrl}/api/projects/${projectId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toScanRequest(scanPayload))
    });
    if (!res.ok) throw new Error(`스캔 API 오류: ${res.status}`);
    return res.json();
  }

  async function fetchPoliciesForComponent(componentId) {
    const { apiUrl } = await getSettings();
    const res = await safeFetch(`${apiUrl}/api/components/${componentId}/policies`);
    if (!res.ok) throw new Error(`정책 조회 오류: ${res.status}`);
    const json = await res.json();
    return json.data || json;
  }

  async function createPolicy(policyData) {
    const { apiUrl, projectId } = await getSettings();
    const res = await safeFetch(`${apiUrl}/api/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...policyData, projectId })
    });
    if (!res.ok) throw new Error(`정책 생성 오류: ${res.status}`);
    return res.json();
  }

  async function updatePolicyApi(policyId, policyData) {
    const { apiUrl } = await getSettings();
    const res = await safeFetch(`${apiUrl}/api/policies/${policyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policyData)
    });
    if (!res.ok) throw new Error(`정책 수정 오류: ${res.status}`);
    return res.json();
  }

  async function deletePolicyApi(policyId) {
    const { apiUrl } = await getSettings();
    const res = await safeFetch(`${apiUrl}/api/policies/${policyId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`정책 삭제 오류: ${res.status}`);
  }

  function openInSaasWeb(componentId, projectId) {
    getSettings().then(({ webUrl }) => {
      chrome.tabs.create({
        url: `${webUrl}/component?componentId=${componentId}&projectId=${projectId}`
      });
    });
  }

  // ─── Mode Toggle ───
  function switchMode(mode) {
    currentMode = mode;
    chrome.storage.local.set({ preferredMode: mode });

    const plannerBtn = document.getElementById('btnModePlanner');
    const devBtn = document.getElementById('btnModeDev');
    const devSection = document.getElementById('devModeSection');
    const plannerSection = document.getElementById('plannerSection');

    if (mode === 'dev') {
      plannerBtn.classList.remove('active');
      devBtn.classList.add('active');
      devSection.classList.add('visible');
      plannerSection.classList.add('hidden');
      // Refresh dev panel if element is selected
      if (selectedElement) refreshDevPanel();
    } else {
      devBtn.classList.remove('active');
      plannerBtn.classList.add('active');
      devSection.classList.remove('visible');
      plannerSection.classList.remove('hidden');
    }
  }

  async function loadSavedMode() {
    return new Promise(resolve => {
      chrome.storage.local.get(['preferredMode'], (data) => {
        if (data.preferredMode) {
          currentMode = data.preferredMode;
          // Apply without triggering full refresh
          const plannerBtn = document.getElementById('btnModePlanner');
          const devBtn = document.getElementById('btnModeDev');
          const devSection = document.getElementById('devModeSection');
          const plannerSection = document.getElementById('plannerSection');
          if (currentMode === 'dev') {
            plannerBtn.classList.remove('active');
            devBtn.classList.add('active');
            devSection.classList.add('visible');
            plannerSection.classList.add('hidden');
          }
        }
        resolve();
      });
    });
  }

  // ─── Developer Mode API calls ───
  async function getDevPrompt(policyId) {
    const { apiUrl } = await getSettings();
    const res = await safeFetch(`${apiUrl}/api/policies/${policyId}/to-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`프롬프트 변환 오류: ${res.status}`);
    const json = await res.json();
    return json.prompt || json.data || JSON.stringify(json, null, 2);
  }

  async function getZodCode(policyId) {
    const { apiUrl } = await getSettings();
    const res = await safeFetch(`${apiUrl}/api/policies/${policyId}/to-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`코드 생성 오류: ${res.status}`);
    const json = await res.json();
    return json.code || json.data || JSON.stringify(json, null, 2);
  }

  async function fetchTodosForComponent(componentId) {
    const { apiUrl } = await getSettings();
    const res = await safeFetch(`${apiUrl}/api/components/${componentId}/todos`);
    if (!res.ok) return [];
    const json = await res.json();
    const arr = json.data || json;
    return Array.isArray(arr) ? arr : [];
  }

  function refreshDevPanel() {
    if (!selectedElement) return;
    const el = selectedElement;
    const componentId = el.componentId || el.pbId || el.componentName;
    if (!componentId) return;

    // Show pending TODO badge
    fetchTodosForComponent(componentId).then(todos => {
      const pending = todos.filter(t => !t.done && !t.completed);
      const badge = document.getElementById('devTodoBadge');
      if (badge) {
        if (pending.length > 0) {
          badge.textContent = `${pending.length} TODO`;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    }).catch(() => {});
  }

  // ─── Change Request API ───
  async function createChangeRequest(data) {
    const { apiUrl, projectId } = await getSettings();
    if (!projectId) throw new Error('Project ID를 설정해주세요');
    const res = await safeFetch(`${apiUrl}/api/change-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, projectId })
    });
    if (!res.ok) throw new Error(`변경 요청 생성 오류: ${res.status}`);
    return res.json();
  }

  // 선택한 요소(pbId/컴포넌트명)를 실제 DB 컴포넌트 UUID로 해석
  // (페이지가 사전 스캔되어 있어야 매칭됨. 실패 시 null 반환)
  async function resolveComponentId(el) {
    const { apiUrl, projectId } = await getSettings();
    if (!projectId || !el) return null;
    try {
      const res = await safeFetch(`${apiUrl}/api/components/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          pbId: el.pbId || '',
          componentName: el.componentName || '',
          cssSelector: el.cssSelector || '',
          pageRoute: el.pageRoute || window.location.pathname
        })
      });
      if (!res.ok) {
        console.warn('[PlanBridge] resolveComponentId 실패:', res.status, { projectId, pbId: el.pbId, pageRoute: el.pageRoute || window.location.pathname });
        return null;
      }
      const json = await res.json();
      const comp = json.data || json;
      return comp?.componentId || null;
    } catch (e) {
      console.warn('[PlanBridge] resolveComponentId 예외:', e);
      return null;
    }
  }

  // 생성된 변경 요청에 대해 AI 분석 트리거 (컴포넌트가 연결된 경우에만 성공)
  async function triggerAnalysis(requestId) {
    const { apiUrl } = await getSettings();
    const res = await safeFetch(`${apiUrl}/api/change-requests/${requestId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`AI 분석 요청 오류: ${res.status}`);
    return res.json();
  }

  // ─── Init ───
  async function init() {
    await loadSettingsIntoForm();
    await loadSavedMode();
    setupEventListeners();
    setupMessageListener();
  }

  // ─── Settings Form ───
  async function loadSettingsIntoForm() {
    const { apiUrl, projectId, webUrl } = await getSettings();
    const urlInput = document.getElementById('settingsApiUrl');
    const pidInput = document.getElementById('settingsProjectId');
    const webInput = document.getElementById('settingsWebUrl');
    if (urlInput) urlInput.value = apiUrl;
    if (pidInput) pidInput.value = projectId;
    if (webInput) webInput.value = webUrl;
  }

  function saveSettings() {
    const apiUrl = document.getElementById('settingsApiUrl')?.value?.trim() || 'http://localhost:8080';
    const projectId = document.getElementById('settingsProjectId')?.value?.trim() || '';
    // 빈 값이면 추론에 맡기기 위해 빈 문자열로 저장
    const webUrl = document.getElementById('settingsWebUrl')?.value?.trim() || '';
    chrome.storage.sync.set({ apiUrl, projectId, webUrl }, () => {
      showToast('설정이 저장되었습니다');
    });
  }

  // ─── Event Listeners ───
  function setupEventListeners() {
    document.getElementById('btnInspect').addEventListener('click', toggleInspector);
    document.getElementById('btnScan').addEventListener('click', scanPage);

    const btnAutoScan = document.getElementById('btnAutoScan');
    if (btnAutoScan) {
      btnAutoScan.addEventListener('click', toggleAutoScan);
      updateAutoScanButton();
    }

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Policy modal
    document.getElementById('btnAddPolicy').addEventListener('click', () => openPolicyModal());
    document.getElementById('btnCancelPolicy').addEventListener('click', closePolicyModal);
    document.getElementById('btnSavePolicy').addEventListener('click', () => savePolicy(false));
    document.getElementById('btnSaveAndCr').addEventListener('click', () => savePolicy(true));
    document.getElementById('policyModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closePolicyModal();
    });

    document.getElementById('tagInputField').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        e.preventDefault();
        addTag(e.target.value.trim());
        e.target.value = '';
      }
    });

    // Settings
    const btnSaveSettings = document.getElementById('btnSaveSettings');
    if (btnSaveSettings) btnSaveSettings.addEventListener('click', saveSettings);

    // Search (component text search)
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => searchComponents(e.target.value), 200);
    });

    // Mode toggle
    document.getElementById('btnModePlanner').addEventListener('click', () => switchMode('planner'));
    document.getElementById('btnModeDev').addEventListener('click', () => switchMode('dev'));

    // Developer mode: copy prompt
    document.getElementById('btnCopyPrompt').addEventListener('click', async () => {
      if (!selectedElement) { showError('요소를 먼저 선택하세요'); return; }
      const el = selectedElement;
      const componentId = el.componentId || el.pbId || el.componentName;
      if (!componentId) { showError('컴포넌트 ID가 없습니다'); return; }

      const schemaBox = document.getElementById('devSchemaBox');
      const schemaLabel = document.getElementById('devSchemaLabel');
      const btn = document.getElementById('btnCopyPrompt');
      btn.disabled = true;
      btn.textContent = '⏳ 변환 중...';

      try {
        // 로드된 정책들의 실제 policyId로 개발 프롬프트 생성 후 병합
        const policyIds = currentPolicies.filter(p => p.policyId).map(p => p.policyId).slice(0, 5);
        if (policyIds.length === 0) throw new Error('연결된 정책이 없습니다');
        const parts = [];
        for (const pid of policyIds) {
          try { parts.push(await getDevPrompt(pid)); } catch {}
        }
        if (parts.length === 0) throw new Error('프롬프트 변환 실패');
        const prompt = parts.join('\n\n---\n\n');
        schemaBox.textContent = prompt;
        schemaBox.classList.remove('hidden');
        schemaLabel.style.display = 'block';
        await navigator.clipboard.writeText(prompt);
        showToast('📋 프롬프트가 클립보드에 복사되었습니다');
      } catch (err) {
        // If API fails, build a basic prompt from available data
        const fallbackPrompt = buildFallbackPrompt(el);
        schemaBox.textContent = fallbackPrompt;
        schemaBox.classList.remove('hidden');
        schemaLabel.style.display = 'block';
        try {
          await navigator.clipboard.writeText(fallbackPrompt);
          showToast('📋 프롬프트 복사 완료 (로컬 생성)');
        } catch {
          showError('클립보드 복사 실패');
        }
      } finally {
        btn.disabled = false;
        btn.textContent = '📋 Claude Code 프롬프트 복사';
      }
    });

    // Developer mode: generate TypeScript/Zod code
    document.getElementById('btnGenCode').addEventListener('click', async () => {
      if (!selectedElement) { showError('요소를 먼저 선택하세요'); return; }
      const el = selectedElement;
      const componentId = el.componentId || el.pbId || el.componentName;
      if (!componentId) { showError('컴포넌트 ID가 없습니다'); return; }

      const codeBox = document.getElementById('devCodeBox');
      const codeLabel = document.getElementById('devCodeLabel');
      const btn = document.getElementById('btnGenCode');
      btn.disabled = true;
      btn.textContent = '⏳ 생성 중...';

      try {
        // VALIDATION 정책 우선, 없으면 첫 정책의 실제 policyId로 Zod 코드 생성
        const valPolicy = currentPolicies.find(p => p.policyType === 'VALIDATION' && p.policyId)
          || currentPolicies.find(p => p.policyId);
        if (!valPolicy) throw new Error('연결된 정책이 없습니다');
        const code = await getZodCode(valPolicy.policyId);
        codeBox.textContent = code;
        codeBox.classList.remove('hidden');
        codeLabel.style.display = 'block';
        showToast('⚡ TypeScript 코드가 생성되었습니다');
      } catch (err) {
        codeBox.textContent = `// 코드 생성 실패: ${err.message}\n// 정책이 연결된 요소인지 확인하세요.`;
        codeBox.classList.remove('hidden');
        codeLabel.style.display = 'block';
        showError(`코드 생성 실패: ${err.message}`);
      } finally {
        btn.disabled = false;
        btn.textContent = '⚡ TypeScript 코드 생성';
      }
    });

    // Change request toggle
    const crToggleBtn = document.getElementById('crToggleBtn');
    const crFormSection = document.getElementById('cr-form-section');
    if (crToggleBtn && crFormSection) {
      crToggleBtn.addEventListener('click', () => {
        const isOpen = crFormSection.classList.contains('open');
        if (isOpen) {
          crFormSection.classList.remove('open');
          crToggleBtn.classList.remove('open');
        } else {
          crFormSection.classList.add('open');
          crToggleBtn.classList.add('open');
          // Pre-fill current state from selected element text
          if (selectedElement && !document.getElementById('cr-current').value) {
            const el = selectedElement;
            const name = el.pbId || el.componentName || el.tagName || '';
            const text = el.innerText ? el.innerText.substring(0, 200) : '';
            document.getElementById('cr-current').value = text
              ? `컴포넌트: ${name}\n현재 텍스트: ${text}`
              : `컴포넌트: ${name}`;
          }
        }
      });
    }

    // Change request submit
    const crSubmit = document.getElementById('cr-submit');
    if (crSubmit) {
      crSubmit.addEventListener('click', async () => {
        const title = document.getElementById('cr-title').value.trim();
        const currentState = document.getElementById('cr-current').value.trim();
        const desiredState = document.getElementById('cr-desired').value.trim();
        const priority = document.getElementById('cr-priority').value;

        if (!title) { showError('요청 제목을 입력해주세요'); return; }
        if (!desiredState) { showError('원하는 상태를 입력해주세요'); return; }

        crSubmit.disabled = true;
        crSubmit.textContent = '제출 중...';

        const el = selectedElement;

        try {
          // 1) 선택된 요소를 실제 DB 컴포넌트(UUID)로 해석 (사전 스캔 필요)
          const resolvedId = await resolveComponentId(el);

          // 2) API 필수값 description 구성 (웹 마법사와 동일 포맷)
          const description = `[현재 상태]\n${currentState || '(미입력)'}\n\n[원하는 상태]\n${desiredState}`;

          // 3) 변경 요청 생성 — 해석 성공 시 componentId(UUID), 실패 시 자유 텍스트 설명
          const payload = {
            title,
            description,
            currentState,
            desiredState,
            priority,
            requestedBy: 'extension-user'
          };
          if (resolvedId) {
            payload.componentId = resolvedId;
          } else if (el) {
            payload.componentDescription = `${el.pbId || el.componentName || el.tagName || '요소'} (${el.pageRoute || window.location.pathname})`;
          }

          const createRes = await createChangeRequest(payload);
          const created = createRes?.data || createRes;
          const requestId = created?.requestId;

          // 4) 컴포넌트가 연결된 경우 AI 분석 자동 트리거
          if (resolvedId && requestId) {
            try {
              await triggerAnalysis(requestId);
              showToast('✅ 변경 요청 등록 + AI 분석을 시작했습니다');
            } catch {
              showToast('변경 요청은 등록됐지만 AI 분석 시작에 실패했습니다');
            }
          } else {
            showToast('변경 요청 등록됨 (AI 분석은 📡 스캔 후 가능)');
          }

          // Reset form
          document.getElementById('cr-title').value = '';
          document.getElementById('cr-current').value = '';
          document.getElementById('cr-desired').value = '';
          document.getElementById('cr-priority').value = 'MEDIUM';
          crFormSection.classList.remove('open');
          crToggleBtn.classList.remove('open');
        } catch (err) {
          showError(`제출 실패: ${err.message}`);
        } finally {
          crSubmit.disabled = false;
          crSubmit.textContent = '변경 요청 제출';
        }
      });
    }
  }

  // ─── Message Listener ───
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'ELEMENT_SELECTED') {
        selectedElement = message.data;
        renderSelectedElement();
        switchTab('policies');
      }
      if (message.type === 'SCAN_RESULT') {
        scanData = message.data;
        renderScanResult();
        if (!scanData._auto) switchTab('tree');
        const policyNote = scanData.hasPolicyData ? ' (정책 감지)' : '';
        showToast(`스캔 완료: ${scanData.componentCount}개${policyNote}`);
        // 스캔 결과를 API로 전송
        sendScanToApi(scanData).then(result => {
          if (result) showToast('스캔 데이터 API 전송 완료');
        }).catch(err => {
          showError(`스캔 API 전송 실패: ${err.message}`);
        });
      }
      if (message.type === 'INSPECTOR_DEACTIVATED' || message.type === 'CONTENT_SCRIPT_READY') {
        inspectorActive = false;
        const btn = document.getElementById('btnInspect');
        btn.classList.remove('active');
        btn.textContent = '🎯 선택';
      }
      if (message.type === 'INSPECTOR_ACTIVATED') {
        inspectorActive = true;
        const btn = document.getElementById('btnInspect');
        btn.classList.add('active');
        btn.textContent = '🎯 선택 중...';
      }
    });
  }

  // ─── Inspector / Scan / AutoScan ───
  function toggleInspector() {
    inspectorActive = !inspectorActive;
    const btn = document.getElementById('btnInspect');
    btn.classList.toggle('active', inspectorActive);
    btn.textContent = inspectorActive ? '🎯 선택 중...' : '🎯 선택';
    chrome.runtime.sendMessage({ type: 'TOGGLE_INSPECTOR' });
    // 선택 모드 ON → 정책 상태 시각화 자동 실행
    if (inspectorActive) {
      triggerPolicyVisualization();
    } else {
      stopPolicyVisualization();
    }
  }

  function scanPage() {
    document.getElementById('btnScan').textContent = '📡 스캔 중...';
    chrome.runtime.sendMessage({ type: 'SCAN_PAGE' });
    setTimeout(() => { document.getElementById('btnScan').textContent = '📡 스캔'; }, 2000);
  }

  function toggleAutoScan() {
    autoScanActive = !autoScanActive;
    updateAutoScanButton();
    chrome.runtime.sendMessage({ type: autoScanActive ? 'START_DOM_OBSERVER' : 'STOP_DOM_OBSERVER' });
    showToast(autoScanActive ? 'DOM 자동 스캔 ON' : 'DOM 자동 스캔 OFF');
  }
  function updateAutoScanButton() {
    const btn = document.getElementById('btnAutoScan');
    if (!btn) return;
    btn.classList.toggle('active', autoScanActive);
    btn.textContent = autoScanActive ? '🔄 자동' : '🔄 수동';
  }

  // ─── Tab Switching ───
  function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const tabEl = document.querySelector(`.tab[data-tab="${tabName}"]`);
    const panelEl = document.getElementById(`panel-${tabName}`);
    if (tabEl) tabEl.classList.add('active');
    if (panelEl) panelEl.classList.add('active');
  }

  // ─── Render Selected Element ───
  function renderSelectedElement() {
    document.getElementById('noSelection').style.display = 'none';
    document.getElementById('selectionView').style.display = 'block';

    // Reset dev panel outputs on new selection
    const schemaBox = document.getElementById('devSchemaBox');
    const codeBox = document.getElementById('devCodeBox');
    const schemaLabel = document.getElementById('devSchemaLabel');
    const codeLabel = document.getElementById('devCodeLabel');
    if (schemaBox) { schemaBox.classList.add('hidden'); schemaBox.textContent = ''; }
    if (codeBox) { codeBox.classList.add('hidden'); codeBox.textContent = ''; }
    if (schemaLabel) schemaLabel.style.display = 'none';
    if (codeLabel) codeLabel.style.display = 'none';
    // Reset CR form pre-fill guard
    const crCurrent = document.getElementById('cr-current');
    if (crCurrent) crCurrent.value = '';

    const el = selectedElement;
    const infoEl = document.getElementById('elementInfo');

    let tagType = 'dom', tagLabel = el.tagName, displayName = el.cssSelector?.split(' > ').slice(-1)[0] || '';
    if (el.pbId) { tagType = 'pbid'; tagLabel = 'pb-id'; displayName = el.pbId; }
    else if (el.componentName) { tagType = 'react'; tagLabel = 'React'; displayName = el.componentName; }

    let hierarchyHtml = '';
    if (el.reactHierarchy?.length > 0) {
      const crumbs = el.reactHierarchy.map((name, i) =>
        `<span class="crumb ${i === el.reactHierarchy.length - 1 ? 'current' : ''}">${name}</span>`
      ).join('<span class="sep">›</span>');
      hierarchyHtml = `<div class="hierarchy">${crumbs}</div>`;
    }

    infoEl.innerHTML = `
      <div class="el-header">
        <span class="el-tag ${tagType}">${tagLabel}</span>
        <span class="el-name">${displayName}</span>
      </div>
      <div class="el-meta">
        <span class="meta-chip"><span class="label">태그</span> &lt;${el.tagName}&gt;</span>
        ${el.pbType ? `<span class="meta-chip"><span class="label">pb-type</span> ${el.pbType}</span>` : ''}
        ${el.innerText ? `<span class="meta-chip"><span class="label">텍스트</span> ${el.innerText.substring(0, 30)}${el.innerText.length > 30 ? '...' : ''}</span>` : ''}
        <span class="meta-chip"><span class="label">경로</span> ${el.pageRoute}</span>
      </div>
      ${hierarchyHtml}
    `;

    renderPoliciesForElement();
    if (currentMode === 'dev') refreshDevPanel();
  }

  // ─── MOCK_POLICY_MAP 폴백: pbId 기반 계층 탐색 ───
  // API에 스캔 데이터가 없을 때 mock-policies.js의 MOCK_POLICY_MAP을 사용한다.
  function getMockPoliciesForPbId(pbId) {
    const map = window.MOCK_POLICY_MAP;
    if (!map || !pbId) return [];
    const result = [];
    const own = map[pbId] || [];
    result.push(...own);
    // 부모 경로 정책을 "상속"으로 추가
    const parts = pbId.split('.');
    for (let i = 1; i < parts.length; i++) {
      const parentId = parts.slice(0, i).join('.');
      const parentPolicies = map[parentId] || [];
      parentPolicies.forEach(p => {
        if (!result.find(r => r.policyId === p.policyId)) {
          result.push({ ...p, scope: p.scope === 'ELEMENT' || p.scope === 'COMPONENT' ? 'PAGE' : p.scope });
        }
      });
    }
    return result;
  }

  // ─── Render Policies (API 연동) ───
  async function renderPoliciesForElement() {
    if (!selectedElement) return;
    const el = selectedElement;

    document.getElementById('appliedCount').textContent = '...';
    document.getElementById('inheritedCount').textContent = '...';
    document.getElementById('policyCount').textContent = '...';

    const appliedContainer = document.getElementById('appliedPolicies');
    const inheritedContainer = document.getElementById('inheritedPolicies');
    appliedContainer.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px 0;">조회 중...</div>';
    inheritedContainer.innerHTML = '';
    currentPolicies = [];

    // componentId 결정: 실제 DB UUID로 해석(캐시) → 정책 조회/프롬프트에 사용
    // 주의: resolve 실패 시 pbId/componentName을 컴포넌트ID로 대신 쓰면 안 됨.
    // UUID가 아닌 문자열로 /api/components/{id}/policies 호출 시 그냥 조용히 빈 배열(0건)이
    // 반환되어 "정책 등록됨(태그 매칭)"과 "적용 정책 0(FK 미해석)"이 모순돼 보이는
    // 혼란스러운 상태를 만듦 — 실패는 명확히 실패로 보여줘야 함.
    if (!el.resolvedComponentId) {
      const resolved = await resolveComponentId(el);
      if (resolved) el.resolvedComponentId = resolved;
    }
    const componentId = el.resolvedComponentId || el.componentId;

    if (!componentId) {
      appliedContainer.innerHTML = '<div style="color:#f59e0b;font-size:12px;padding:8px 0;">⚠ 이 컴포넌트를 DB에서 찾지 못했습니다. Project ID 설정이 맞는지, 이 페이지가 스캔되었는지 확인하세요.</div>';
      document.getElementById('appliedCount').textContent = '0';
      document.getElementById('inheritedCount').textContent = '0';
      document.getElementById('policyCount').textContent = '0';
      renderOpenInSaasButton(null);
      return;
    }

    function displayPolicies(arr, isMock) {
      currentPolicies = arr;
      const applied = arr.filter(p => p.scope === 'ELEMENT' || p.scope === 'COMPONENT');
      const inherited = arr.filter(p => p.scope === 'GLOBAL' || p.scope === 'PAGE');

      document.getElementById('appliedCount').textContent = applied.length;
      document.getElementById('inheritedCount').textContent = inherited.length;
      document.getElementById('policyCount').textContent = arr.length;

      appliedContainer.innerHTML = applied.length
        ? applied.map(p => renderApiPolicyCard(p, false)).join('') +
          (isMock ? '<div style="font-size:10px;color:var(--text-muted);margin-top:6px;padding:2px 4px;border-left:2px solid var(--border)">※ 목업 데이터 (DB 스캔 전)</div>' : '')
        : '<div style="color:var(--text-muted);font-size:12px;padding:8px 0;">등록된 정책이 없습니다</div>';

      inheritedContainer.innerHTML = inherited.length
        ? inherited.map(p => renderApiPolicyCard(p, true)).join('')
        : '<div style="color:var(--text-muted);font-size:12px;padding:8px 0;">상속된 정책이 없습니다</div>';

      document.querySelectorAll('.policy-card[data-policy-id]').forEach(card => {
        card.querySelector('.btn-edit')?.addEventListener('click', (e) => { e.stopPropagation(); openPolicyModal(card.dataset.policyId); });
        card.querySelector('.btn-delete')?.addEventListener('click', (e) => { e.stopPropagation(); deletePolicy(card.dataset.policyId); });
      });

      renderOpenInSaasButton(componentId);
    }

    // mock 데이터를 즉시 표시 (API 응답 대기 없이)
    const mockArr = getMockPoliciesForPbId(el.pbId);
    if (mockArr.length > 0) {
      displayPolicies(mockArr, true);
    } else {
      appliedContainer.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px 0;">조회 중...</div>';
      document.getElementById('appliedCount').textContent = '0';
      document.getElementById('inheritedCount').textContent = '0';
      document.getElementById('policyCount').textContent = '0';
    }

    // API에 실제 데이터 있으면 교체
    // 주의: fetch 실패(.catch)와 "정책 조회는 성공했지만 이후 부가 UI 렌더링(예:
    // SaaS 버튼)에서 예외가 남" 경우를 반드시 구분해야 함. displayPolicies가 이미
    // 정책 개수를 정확히 표시한 뒤 무관한 코드에서 예외가 나면, 그걸 "정책 없음"으로
    // 오인해 .catch에서 방금 표시한 올바른 결과를 도로 0으로 덮어쓰는 버그가 있었음.
    fetchPoliciesForComponent(componentId).then(policies => {
      const arr = Array.isArray(policies) ? policies : [];
      if (arr.length > 0) {
        try {
          displayPolicies(arr, false);
        } catch (renderErr) {
          // 카운트/카드 표시는 이미 끝났을 수 있으니 조용히 로그만 남기고 넘어감
          console.warn('[PlanBridge] displayPolicies 부가 렌더링 오류(정책 표시 자체는 유효):', renderErr);
        }
      } else if (mockArr.length === 0) {
        appliedContainer.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px 0;">등록된 정책이 없습니다</div>';
        renderOpenInSaasButton(componentId);
      }
    }).catch((e) => {
      console.warn('[PlanBridge] fetchPoliciesForComponent 실패:', e);
      if (mockArr.length === 0) {
        appliedContainer.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px 0;">등록된 정책이 없습니다</div>';
        document.getElementById('appliedCount').textContent = '0';
        document.getElementById('policyCount').textContent = '0';
        renderOpenInSaasButton(componentId);
      }
    });
  }

  function renderOpenInSaasButton(componentId) {
    // Remove existing button if any
    const existing = document.getElementById('btnOpenInSaas');
    if (existing) existing.remove();

    if (!componentId) return;

    const addPolicyBtn = document.getElementById('btnAddPolicy');

    const btn = document.createElement('button');
    btn.id = 'btnOpenInSaas';
    btn.className = 'add-policy-btn';
    btn.style.borderStyle = 'solid';
    btn.style.marginTop = '4px';
    btn.innerHTML = '🌐 SaaS에서 열기';
    btn.addEventListener('click', () => {
      getSettings().then(({ projectId }) => {
        openInSaasWeb(componentId, projectId);
      });
    });

    // addPolicyBtn이 selectionView의 직계 자식이 아닐 수 있어(중첩 래퍼 등)
    // selectionView.insertBefore(btn, addPolicyBtn.nextSibling)가
    // "참조 노드가 이 노드의 자식이 아님" 에러로 항상 실패했었음.
    // addPolicyBtn의 실제 부모를 기준으로 삽입하고, 못 찾으면 selectionView에 append.
    if (addPolicyBtn && addPolicyBtn.parentNode) {
      addPolicyBtn.parentNode.insertBefore(btn, addPolicyBtn.nextSibling);
    } else {
      document.getElementById('selectionView')?.appendChild(btn);
    }
  }

  function renderApiPolicyCard(policy, isInherited) {
    const type = policy.policyType || 'UI_SPEC';
    const scope = policy.scope || 'ELEMENT';
    // API 응답(policyTitle/policyContent/currentVersion)과 mock 데이터(title/content/version) 모두 지원
    const title = policy.policyTitle || policy.title || '';
    const content = policy.policyContent || policy.content || '';
    const version = policy.currentVersion || policy.version || 1;
    const policyId = policy.policyId || '';
    const tagsHtml = policy.tags
      ? `<div class="pc-tags">${policy.tags.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('')}</div>`
      : '';
    return `
      <div class="policy-card ${isInherited ? 'page-policy inherited' : ''}" data-policy-id="${policyId}">
        <div class="pc-header">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="policy-type ${type}">${type}</span>
            ${isInherited ? `<span class="inherited-badge">${scope}</span>` : ''}
          </div>
          <span class="pc-version">v${version}</span>
        </div>
        <div class="pc-title">${title}</div>
        <div class="pc-content">${content}</div>
        ${tagsHtml}
        ${policyId ? `<div class="pc-actions"><button class="btn btn-sm btn-ghost btn-edit">✏️ 수정</button><button class="btn btn-sm btn-ghost btn-delete">🗑 삭제</button></div>` : ''}
      </div>`;
  }

  // ─── Policy CRUD (API 연동) ───
  function openPolicyModal(policyId = null) {
    editingPolicyId = policyId;
    currentTags = [];
    const title = document.getElementById('modalTitle');

    if (policyId) {
      title.textContent = '정책 수정';
      // 현재 카드에서 데이터 읽기 (이미 렌더된 카드 기준)
      const card = document.querySelector(`.policy-card[data-policy-id="${policyId}"]`);
      if (card) {
        const typeEl = card.querySelector('.policy-type');
        const titleEl = card.querySelector('.pc-title');
        const contentEl = card.querySelector('.pc-content');
        if (typeEl) document.getElementById('policyType').value = typeEl.textContent.trim();
        if (titleEl) document.getElementById('policyTitle').value = titleEl.textContent.trim();
        if (contentEl) document.getElementById('policyContent').value = contentEl.textContent.trim();
        const tags = card.querySelectorAll('.pc-tags .tag');
        currentTags = Array.from(tags).map(t => t.textContent.trim());
      }
    } else {
      title.textContent = '새 정책 추가';
      document.getElementById('policyType').value = 'UI_SPEC';
      document.getElementById('policyTitle').value = '';
      document.getElementById('policyContent').value = '';
      const r = document.querySelector('input[name="scope"][value="ELEMENT"]');
      if (r) r.checked = true;
    }
    // 수정 모드에서만 "저장 + 변경요청 생성" + 변경사유 노출
    const isEdit = !!policyId;
    document.getElementById('btnSaveAndCr').style.display = isEdit ? 'inline-flex' : 'none';
    document.getElementById('policyChangeReasonGroup').style.display = isEdit ? 'block' : 'none';
    const reasonEl = document.getElementById('policyChangeReason');
    if (reasonEl) reasonEl.value = '';
    renderTags();
    document.getElementById('policyModal').classList.add('open');
  }

  function closePolicyModal() {
    document.getElementById('policyModal').classList.remove('open');
    editingPolicyId = null;
    currentTags = [];
  }

  async function savePolicy(createCr = false) {
    const type = document.getElementById('policyType').value;
    const scope = document.querySelector('input[name="scope"]:checked')?.value || 'ELEMENT';
    const title = document.getElementById('policyTitle').value.trim();
    const content = document.getElementById('policyContent').value.trim();
    const changeReason = document.getElementById('policyChangeReason')?.value.trim() || '';
    if (!title) { showError('제목을 입력해주세요'); return; }
    if (!content) { showError('내용을 입력해주세요'); return; }

    const el = selectedElement;
    const elementKey = el?.pbId || el?.componentName || el?.cssSelector || 'unknown';

    try {
      if (editingPolicyId) {
        await updatePolicyApi(editingPolicyId, {
          policyTitle: title,
          policyContent: content,
          tags: currentTags.join(','),
          changeReason: changeReason || undefined,
          updatedBy: 'system'
        });
        showToast('정책이 수정되었습니다');
      } else {
        const policyData = {
          policyType: type,
          scope,
          policyTitle: title,
          policyContent: content,
          tags: currentTags.join(','),
          createdBy: 'system',
          componentId: el?.resolvedComponentId || el?.componentId || elementKey,
          pageId: el?.pageRoute || '/'
        };
        await createPolicy(policyData);
        showToast('정책이 등록되었습니다');
      }

      // UC2: 저장 + 변경요청 생성 — 정책 변경을 개발 TODO로 연결
      if (createCr) {
        const resolvedId = el ? await resolveComponentId(el) : null;
        const description = `[변경 사유]\n${changeReason || '(미입력)'}\n\n[정책: ${title}]\n${content}`;
        const payload = {
          title: `정책 변경: ${title}`,
          description,
          currentState: changeReason || '정책 수정',
          desiredState: content,
          priority: 'MEDIUM',
          requestedBy: 'extension-user'
        };
        if (resolvedId) payload.componentId = resolvedId;
        else if (el) payload.componentDescription = `${el.pbId || el.componentName || '요소'} (${el.pageRoute || '/'})`;

        try {
          const createRes = await createChangeRequest(payload);
          const reqId = (createRes?.data || createRes)?.requestId;
          if (resolvedId && reqId) {
            try { await triggerAnalysis(reqId); showToast('✅ 정책 저장 + 변경요청 + AI 분석 시작'); }
            catch { showToast('정책 저장 + 변경요청 등록됨 (AI 분석 시작 실패)'); }
          } else {
            showToast('정책 저장 + 변경요청 등록됨 (AI 분석은 스캔 후 가능)');
          }
        } catch (crErr) {
          showError(`정책은 저장됐지만 변경요청 생성 실패: ${crErr.message}`);
        }
      }

      closePolicyModal();
      renderPoliciesForElement();
    } catch (err) {
      showError(`저장 실패: ${err.message}`);
    }
  }

  async function deletePolicy(policyId) {
    if (!confirm('이 정책을 삭제하시겠습니까?')) return;
    try {
      await deletePolicyApi(policyId);
      showToast('정책이 삭제되었습니다');
      renderPoliciesForElement();
    } catch (err) {
      showError(`삭제 실패: ${err.message}`);
    }
  }

  function addTag(tag) { if (!currentTags.includes(tag)) { currentTags.push(tag); renderTags(); } }
  function removeTag(tag) { currentTags = currentTags.filter(t => t !== tag); renderTags(); }
  function renderTags() {
    const container = document.getElementById('tagInput');
    const input = document.getElementById('tagInputField');
    container.querySelectorAll('.tag').forEach(el => el.remove());
    currentTags.forEach(tag => {
      const t = document.createElement('span');
      t.className = 'tag';
      t.innerHTML = `${tag} <span class="remove" data-tag="${tag}">×</span>`;
      container.insertBefore(t, input);
    });
    container.querySelectorAll('.remove').forEach(el => {
      el.addEventListener('click', () => removeTag(el.dataset.tag));
    });
  }

  // =========================================================
  // ─── 검색: 화면 텍스트 기반 컴포넌트 찾기 ───
  // =========================================================
  function searchComponents(query) {
    const resultsEl = document.getElementById('searchResults');
    if (!query.trim()) {
      resultsEl.innerHTML = `<div class="empty-state" style="padding:32px;"><div class="icon">🔍</div><strong>텍스트로 컴포넌트 찾기</strong><p>화면에 보이는 텍스트(버튼명, 라벨 등)를<br>입력하면 해당 컴포넌트를 찾아줍니다</p></div>`;
      return;
    }

    if (!scanData?.components?.length) {
      resultsEl.innerHTML = `<div class="empty-state" style="padding:32px;"><p>먼저 📡 스캔을 실행하세요</p></div>`;
      return;
    }

    const q = query.toLowerCase();
    const results = scanData.components.filter(c => {
      const text = (c.innerText || '').toLowerCase();
      const name = (c.componentName || '').toLowerCase();
      const pbId = (c.pbId || '').toLowerCase();
      return text.includes(q) || name.includes(q) || pbId.includes(q);
    });

    if (results.length === 0) {
      resultsEl.innerHTML = `<div class="empty-state" style="padding:32px;"><p>"${query}" 에 해당하는 컴포넌트가 없습니다</p></div>`;
      return;
    }

    resultsEl.innerHTML = `<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">${results.length}개 컴포넌트 발견</div>` +
      results.map(c => {
        const badge = c.pbId ? '🏷' : c.componentName ? '⚛️' : '📌';
        const name = c.pbId || c.componentName || c.tagName;
        const text = (c.innerText || '').substring(0, 80);
        const highlighted = text ? highlightText(text, query) : '<span style="color:var(--text-muted);">(텍스트 없음)</span>';
        return `
          <div class="search-result-item" data-selector="${encodeURIComponent(c.cssSelector)}" data-pb-id="${c.pbId || ''}">
            <div class="sr-name">${badge} ${highlightText(name, query)}</div>
            <div class="sr-text">${highlighted}</div>
            <div class="sr-meta">
              <span>&lt;${c.tagName}&gt;</span>
              ${c.pbType ? `<span>[${c.pbType}]</span>` : ''}
            </div>
          </div>`;
      }).join('');

    resultsEl.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const selector = decodeURIComponent(item.dataset.selector);
        chrome.runtime.sendMessage({ type: 'HIGHLIGHT_ELEMENT', cssSelector: selector });
        const pbId = item.dataset.pbId;
        if (pbId) {
          const comp = scanData.components.find(c => c.pbId === pbId);
          if (comp) {
            selectedElement = {
              pbId: comp.pbId, componentName: comp.componentName, cssSelector: comp.cssSelector,
              tagName: comp.tagName, pbType: comp.pbType, innerText: comp.innerText,
              reactHierarchy: comp.reactHierarchy, reactProps: {},
              pageRoute: scanData.pageRoute, pageTitle: scanData.pageTitle, pageUrl: scanData.pageUrl,
              displayId: comp.pbId, timestamp: new Date().toISOString()
            };
            renderSelectedElement();
            switchTab('policies');
          }
        }
      });
    });
  }

  // ─── Scan Result ───
  function renderScanResult() {
    if (!scanData) return;
    document.getElementById('noTree').style.display = 'none';
    document.getElementById('treeView').style.display = 'block';
    document.getElementById('treeCount').textContent = scanData.componentCount;

    const reactCount = scanData.components.filter(c => c.componentName).length;
    const pbIdCount = scanData.components.filter(c => c.pbId).length;

    document.getElementById('scanStats').innerHTML = `
      <div class="stat"><div class="stat-value">${scanData.componentCount}</div><div class="stat-label">전체 요소</div></div>
      <div class="stat"><div class="stat-value">${reactCount}</div><div class="stat-label">React</div></div>
      <div class="stat"><div class="stat-value">${pbIdCount}</div><div class="stat-label">PB-ID</div></div>`;

    const grouped = {};
    scanData.components.forEach(comp => {
      let group;
      if (comp.pbId) { const p = comp.pbId.split('.'); group = p.length > 1 ? p.slice(0,2).join('.') : p[0]; }
      else { group = comp.reactHierarchy?.length > 1 ? comp.reactHierarchy[comp.reactHierarchy.length - 2] : '_root'; }
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(comp);
    });

    let treeHtml = '';
    Object.entries(grouped).forEach(([group, items]) => {
      const icon = group === '_root' ? '📄' : '📦';
      treeHtml += `<div class="scan-group"><div class="scan-group-header">${icon} ${group === '_root' ? 'Root' : group} (${items.length})</div><div class="scan-group-children">${items.map(item => {
        const name = item.pbId || item.componentName || item.tagName;
        const badge = item.pbId ? '🏷' : item.componentName ? '⚛️' : '📌';
        const pt = item.pbType ? `<span class="detail">[${item.pbType}]</span>` : '';
        return `<div class="scan-item" data-selector="${encodeURIComponent(item.cssSelector)}" data-pb-id="${item.pbId || ''}"><span class="icon">${badge}</span><span class="name">${name}</span>${pt}<span class="detail">&lt;${item.tagName}&gt;</span></div>`;
      }).join('')}</div></div>`;
    });
    document.getElementById('scanTree').innerHTML = treeHtml;

    document.querySelectorAll('.scan-item').forEach(item => {
      item.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'HIGHLIGHT_ELEMENT', cssSelector: decodeURIComponent(item.dataset.selector) });
        const pbId = item.dataset.pbId;
        if (pbId) {
          const comp = scanData.components.find(c => c.pbId === pbId);
          if (comp) {
            selectedElement = { pbId: comp.pbId, componentName: comp.componentName, cssSelector: comp.cssSelector, tagName: comp.tagName, pbType: comp.pbType, innerText: comp.innerText, reactHierarchy: comp.reactHierarchy, reactProps: {}, pageRoute: scanData.pageRoute, pageTitle: scanData.pageTitle, pageUrl: scanData.pageUrl, displayId: comp.pbId, timestamp: new Date().toISOString() };
            renderSelectedElement(); switchTab('policies');
          }
        }
      });
    });
  }

  function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:rgba(233,69,96,0.3);color:inherit;border-radius:2px;padding:0 1px;">$1</mark>');
  }

  function buildFallbackPrompt(el) {
    const name = el.pbId || el.componentName || el.tagName || 'Unknown';
    const text = el.innerText ? `\ninner text: "${el.innerText.substring(0, 300)}"` : '';
    const route = el.pageRoute || '/';
    const type = el.pbType ? `\npb-type: ${el.pbType}` : '';
    return [
      `# PlanBridge — Component Dev Prompt`,
      `component: ${name}`,
      `page: ${route}${type}${text}`,
      ``,
      `## Task`,
      `Implement or update the above component according to the policies defined in PlanBridge.`,
      `Fetch the latest policies from the API and ensure type-safe TypeScript code with Zod validation.`,
    ].join('\n');
  }

  // ─── 정책 상태 시각화 (선택 모드 ON 시 자동 실행) ───────────
  async function triggerPolicyVisualization() {
    try {
      const { apiUrl, projectId } = await getSettings();
      if (!projectId) return;

      // 현재 탭에서 data-pb-id 목록 가져오기
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      const pbIdsResponse = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PB_IDS' });
      const pbIds = pbIdsResponse?.pbIds || [];
      if (pbIds.length === 0) return;

      // API에서 각 pbId의 정책 수 조회
      const policyStatusMap = {};
      const checks = pbIds.slice(0, 200).map(async (pbId) => {
        try {
          const res = await safeFetch(`${apiUrl}/api/policies/search?q=${encodeURIComponent(pbId)}&projectId=${projectId}`);
          if (!res.ok) { policyStatusMap[pbId] = 'no_policy'; return; }
          const json = await res.json();
          const policies = json.data || json;
          if (Array.isArray(policies) && policies.length > 0) {
            const hasDirectPolicy = policies.some(p => p.scope === 'ELEMENT' || p.scope === 'COMPONENT');
            policyStatusMap[pbId] = hasDirectPolicy ? 'has_policy' : 'inherited_only';
          } else {
            policyStatusMap[pbId] = 'no_policy';
          }
        } catch {
          policyStatusMap[pbId] = 'no_policy';
        }
      });
      await Promise.all(checks);

      // content.js에 시각화 적용 메시지 전송
      chrome.tabs.sendMessage(tab.id, {
        type: 'APPLY_POLICY_VISUALIZATION',
        policyStatusMap
      });
    } catch (e) {
      // 조용히 실패 (선택 모드가 비활성화 상태일 수 있음)
    }
  }

  async function stopPolicyVisualization() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_POLICY_VISUALIZATION' });
      }
    } catch (e) {}
  }

  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'warning' ? 'var(--warning)' : 'var(--success)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  init();
})();
