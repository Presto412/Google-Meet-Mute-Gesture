/**
 * popup to bg
 * bg to popup
 * bg to content
 * content to popup
 */
export class Communicator {
  static sendMessageToTab(
    message: any,
    urlMatch?: string,
    tabId?: number,
    queryInfo: chrome.tabs.QueryInfo = {}
  ): void {
    if (tabId) {
      chrome.tabs.sendMessage(tabId, message);
      return;
    }
    chrome.tabs.query(queryInfo, (tabs) => {
      if (!tabs) {
        return;
      }
      let filteredTabs = urlMatch
        ? tabs.filter((tab) => tab.url.includes(urlMatch))
        : tabs;
      filteredTabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {...message, receiver: "contentScript"});
      });
    });
  }

  static sendMessageToPopup(
    message: any,
    responseCallback?: (response: void) => void
  ): void {
    chrome.runtime.sendMessage(
      { ...message, receiver: "popup" },
      responseCallback
    );
  }

  static sendMessageToBackground(
    message: any,
    responseCallback?: (response: void) => void
  ): void {
    chrome.runtime.sendMessage(
      { ...message, receiver: "background" },
      responseCallback
    );
  }
}
