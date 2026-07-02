// background.js — PlanBridge Service Worker

// 익스텐션 아이콘 클릭 시 사이드패널 열기
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// 사이드패널이 열릴 때 자동으로 활성화
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Content Script ↔ Side Panel 메시지 중계
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Content Script → Side Panel
  if (message.type === 'ELEMENT_SELECTED' ||
      message.type === 'SCAN_RESULT' ||
      message.type === 'INSPECTOR_ACTIVATED' ||
      message.type === 'INSPECTOR_DEACTIVATED') {
    chrome.runtime.sendMessage(message).catch(() => {});
  }

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
