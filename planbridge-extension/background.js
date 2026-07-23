// background.js — PlanBridge Service Worker

// 익스텐션 아이콘 클릭 시 사이드패널 열기
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// 사이드패널이 열릴 때 자동으로 활성화
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Side Panel ↔ Content Script 메시지 중계
// 주의: Content Script → Side Panel 방향은 중계하지 않는다.
// content.js가 chrome.runtime.sendMessage()로 보내는 순간 이미 background/sidepanel
// 등 모든 확장 컨텍스트에 직접 브로드캐스트되므로, 여기서 같은 메시지를 다시
// sendMessage()하면 sidepanel이 ELEMENT_SELECTED 등을 "두 번" 받게 된다.
// (실제 증상: 두 번째 호출이 "조회 중..." 초기화로 방금 표시된 결과를 0으로
//  덮어써서, 정책이 실제로는 연결돼 있어도 화면엔 "적용 정책 0"으로 보였음)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Side Panel → Content Script (활성 탭으로 전달)
  if (message.type === 'TOGGLE_INSPECTOR' ||
      message.type === 'SCAN_PAGE' ||
      message.type === 'HIGHLIGHT_ELEMENT' ||
      message.type === 'START_DOM_OBSERVER' ||
      message.type === 'STOP_DOM_OBSERVER') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message).catch(() => {});
      }
    });
  }

  return true;
});
