import { createNanoEvents } from "nanoevents";
import browser, { identity } from "webextension-polyfill";
import { BridgeCommands } from "~/common/consts";

type Port = browser.Runtime.Port;

browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});


const devtoolConnections: Map<number, Port> = new Map();
const contentScriptConnections: Map<number, Port> = new Map();

// 消息分发

// 来自 devtools 等消息
browser.runtime.onConnect.addListener((port) => {
  if (port.sender?.tab) {
    return;
  }

  console.log("[redi-dev] Devtools established a connection");
  const extensionListener = (message: any, port: Port) => {
    if (typeof message.tabId !== 'number') {

      console.error("[redi-dev] Devtools send a message without a tabId", message);
      return;
    }

    console.log(`[redi-dev] Devtools send a message: ${message.cmd}`, message);
    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    if (message.cmd === BridgeCommands.Core_DevtoolsInit) {
      devtoolConnections.set(message.tabId, port)


      // 注入 backend 脚本
      contentScriptConnections.get(message.tabId)?.postMessage({
        cmd: BridgeCommands.Core_InjectFullBackend,
      });


      return;
    }

    // 向 content script 转发消息
    if (typeof message.cmd === "string") {
      if ((message.cmd as string).startsWith('f2b:')) {
        contentScriptConnections.get(message.tabId)?.postMessage(message);
      }
    }
  }

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(function (port) {
    port.onMessage.removeListener(extensionListener);
    console.log("[redi-dev] ContentScript closes a connection");

    for (const tabId of devtoolConnections.keys()) {
      if (devtoolConnections.get(tabId) === port) {
        devtoolConnections.delete(tabId);
        break;
      }
    }
  });


})


// 来自 contentScript 的消息
browser.runtime.onConnect.addListener((port) => {
  if (!port.sender?.tab) {
    return;
  }

  const tabId = port.sender.tab.id!;

  console.log("[redi-dev] ContentScript established a connection");
  const contentScriptListener = (message: any, port: Port) => {

    if (!(typeof message.cmd === "string") || !(message.cmd as string).startsWith("b2f:")) {
      return;
    }
    console.log(`[redi-dev] ContentScript send a message: ${message.cmd}`, message);

    if (devtoolConnections.has(tabId)) {
      devtoolConnections.get(tabId)!.postMessage(message);
    } else {
      console.log("Tab not found in connection list.");
    }
  }

  contentScriptConnections.set(tabId, port);


  if (devtoolConnections.has(tabId)) {
    // 重新注入 backend 脚本
    
    port.postMessage({
      cmd: BridgeCommands.Core_InjectFullBackend,
    });
  }

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(contentScriptListener);

  port.onDisconnect.addListener(function (port) {
    port.onMessage.removeListener(contentScriptListener);
    console.log("[redi-dev] Devtools closes a connection");

    contentScriptConnections.delete(tabId);
  });


});