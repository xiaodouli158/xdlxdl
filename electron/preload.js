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
  stopDouyinPingAnchor: () => ipcRenderer.invoke('get-douyin-api-info', { token: null, method: 'stop' }),
  maintainDouyinStream: (room_id, stream_id, mode) => ipcRenderer.invoke('get-douyin-api-info', {
    token: { room_id, stream_id, mode },
    method: 'maintain'
  }),
  getBilibiliStreamInfo: (token) => ipcRenderer.invoke('get-bilibili-stream-info', { token }),

  // 认证相关功能
  loginDouyinWeb: () => ipcRenderer.invoke('login-douyin-web'),
  loginDouyinCompanion: () => ipcRenderer.invoke('login-douyin-companion'),
  loginBilibili: () => ipcRenderer.invoke('login-bilibili'),

  // 安全认证相关功能
  openAuthUrl: (url) => ipcRenderer.invoke('open-auth-url', { url }),
  showAuthNotification: (message) => ipcRenderer.invoke('show-auth-notification', { message }),

  // 进程管理相关功能
  killMediaSDKServer: () => ipcRenderer.invoke('kill-mediasdk-server'),

  // 更新相关功能
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 事件监听
  onAuthNotification: (callback) => {
    ipcRenderer.on('auth-notification', (event, data) => callback(data));
  },

  // 状态通知事件监听
  onStatusNotification: (callback) => {
    ipcRenderer.on('status-notification', (event, data) => callback(data));
  },
});
