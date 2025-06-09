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

  // OBS 配置相关功能
  checkInstallFonts: () => ipcRenderer.invoke('check-install-fonts'),
  installFonts: () => ipcRenderer.invoke('install-fonts'),
  restartObs: () => ipcRenderer.invoke('restart-obs'),
  connectToObs: () => ipcRenderer.invoke('connect-to-obs'),
  configureObsProfile: (options) => ipcRenderer.invoke('configure-obs-profile', options),
  addObsAudioSources: () => ipcRenderer.invoke('add-obs-audio-sources'),
  addObsVideoDevice: () => ipcRenderer.invoke('add-obs-video-device'),
  oneClickConfigureObs: (options) => ipcRenderer.invoke('one-click-configure-obs', options),
  configureObsUnified: (options) => ipcRenderer.invoke('configure-obs-unified', options),

  // 直播平台相关功能
  getDouyinCompanionInfo: () => ipcRenderer.invoke('get-douyin-companion-info'),
  getDouyinApiInfo: (token, method) => ipcRenderer.invoke('get-douyin-api-info', { token, method }),
  stopDouyinPingAnchor: () => ipcRenderer.invoke('get-douyin-api-info', { token: null, method: 'stop' }),
  maintainDouyinStream: (room_id, stream_id, mode) => ipcRenderer.invoke('maintain-douyin-stream', {
    room_id,
    stream_id,
    mode
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
  getIconPath: () => ipcRenderer.invoke('get-icon-path'),

  // 系统硬件信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // 外部链接
  openExternal: (url) => ipcRenderer.invoke('open-external', { url }),

  // 事件监听 - 改进版本，支持移除监听器和错误处理
  onAuthNotification: (callback) => {
    console.log('Setting up auth notification listener in preload');

    // 创建包装函数以便后续移除和错误处理
    const wrappedCallback = (event, data) => {
      console.log('Auth notification received in preload:', data);
      try {
        callback(data);
      } catch (error) {
        console.error('Error in auth notification callback:', error);
      }
    };

    // 添加监听器
    ipcRenderer.on('auth-notification', wrappedCallback);

    // 返回移除函数
    return () => {
      console.log('Removing auth notification listener');
      ipcRenderer.removeListener('auth-notification', wrappedCallback);
    };
  },

  // 状态通知事件监听 - 改进版本，支持移除监听器和错误处理
  onStatusNotification: (callback) => {
    console.log('Setting up status notification listener in preload');

    // 创建包装函数以便后续移除和错误处理
    const wrappedCallback = (event, data) => {
      console.log('Status notification received in preload:', data);
      try {
        callback(data);
      } catch (error) {
        console.error('Error in status notification callback:', error);
      }
    };

    // 添加监听器
    ipcRenderer.on('status-notification', wrappedCallback);

    // 返回移除函数
    return () => {
      console.log('Removing status notification listener');
      ipcRenderer.removeListener('status-notification', wrappedCallback);
    };
  },

  // 测试通知功能
  testStatusNotification: () => ipcRenderer.invoke('test-status-notification'),
  testAuthNotification: () => ipcRenderer.invoke('test-auth-notification'),

  // 手动触发状态通知（用于测试和备用方案）
  sendStatusNotification: (message, status) => {
    console.log('Manually sending status notification:', message, status);
    // 直接在渲染进程中触发事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('status-notification', {
        detail: { message, status }
      }));
    }
  },

  // 手动触发认证通知（用于测试和备用方案）
  sendAuthNotification: (message) => {
    console.log('Manually sending auth notification:', message);
    // 直接在渲染进程中触发事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-notification', {
        detail: { message }
      }));
    }
  },


});
