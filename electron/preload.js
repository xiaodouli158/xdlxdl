// 使用 CommonJS 语法的 preload 脚本
const { contextBridge, ipcRenderer } = require('electron');

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 窗口控制函数
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // OBS 相关功能
  getOBSVersion: () => ipcRenderer.invoke('get-obs-version'),
  getCompanionVersion: () => ipcRenderer.invoke('get-companion-version'),
  connectToOBS: (address, password) => ipcRenderer.invoke('connect-to-obs', { address, password }),
  ensureOBSWebSocketEnabled: () => ipcRenderer.invoke('ensure-obs-websocket-enabled'),
  setOBSStreamSettings: (streamUrl, streamKey) => ipcRenderer.invoke('set-obs-stream-settings', { streamUrl, streamKey }),
  startOBSStreaming: () => ipcRenderer.invoke('start-obs-streaming'),
  stopOBSStreaming: () => ipcRenderer.invoke('stop-obs-streaming'),

  // 直播平台相关功能
  getDouyinCompanionInfo: () => ipcRenderer.invoke('get-douyin-companion-info'),
  getDouyinApiInfo: (token, method) => ipcRenderer.invoke('get-douyin-api-info', { token, method }),
  getBilibiliStreamInfo: (token) => ipcRenderer.invoke('get-bilibili-stream-info', { token }),

  // 认证相关功能
  loginDouyin: () => ipcRenderer.invoke('login-douyin'),
  loginBilibili: () => ipcRenderer.invoke('login-bilibili'),
});
