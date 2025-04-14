// ES模块语法的Electron主进程文件
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

// 将回调函数转换为 Promise
const execAsync = promisify(exec);
const fsAccess = promisify(fs.access);
const fsReadFile = promisify(fs.readFile);
const fsWriteFile = promisify(fs.writeFile);

// 获取__dirname等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义全局变量以存储窗口引用
let mainWindow = null;

// OBS WebSocket 客户端
let obsWebSocket = null;

// 创建浏览器窗口函数
function createWindow() {
  // 创建浏览器窗口，设置为830x660，并移除默认标题栏
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(__dirname, 'preload.js'), // 预加载脚本
    },
    resizable: false,
    frame: false, // 移除默认窗口边框
    titleBarStyle: 'hidden', // 隐藏标题栏
  });

  // 开发环境下使用Vite开发服务器
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// 应用准备就绪后创建窗口
app.whenReady().then(() => {
  createWindow();

  // 设置 IPC 事件监听 - 窗口控制
  ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
  });

  // OBS 相关功能
  ipcMain.handle('get-obs-version', async () => {
    try {
      // 在 Windows 上检测 OBS 版本
      const { stdout } = await execAsync('powershell -Command "Get-ItemProperty -Path \'HKLM:\\SOFTWARE\\OBS Studio\' -Name Version | Select-Object -ExpandProperty Version"', { timeout: 5000 });
      return stdout.trim();
    } catch (error) {
      console.error('Failed to get OBS version:', error);
      return null;
    }
  });

  ipcMain.handle('get-companion-version', async () => {
    try {
      // 在 Windows 上检测直播伴侣版本
      // 注意：这里使用的是示例路径，实际应用中需要更新为正确的路径
      const { stdout } = await execAsync('powershell -Command "Get-ItemProperty -Path \'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*\' | Where-Object { $_.DisplayName -like \'*直播伴侣*\' } | Select-Object -ExpandProperty DisplayVersion"', { timeout: 5000 });
      return stdout.trim();
    } catch (error) {
      console.error('Failed to get companion version:', error);
      return null;
    }
  });

  ipcMain.handle('connect-to-obs', async (event, { address, password }) => {
    try {
      // 在实际应用中，这里应该使用 OBS WebSocket 客户端库
      // 例如：安装 obs-websocket-js 并实现连接逻辑
      console.log(`Connecting to OBS at ${address} with password: ${password ? '******' : 'none'}`);

      // 模拟成功连接
      return { success: true, message: '成功连接到 OBS' };
    } catch (error) {
      console.error('Failed to connect to OBS:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('ensure-obs-websocket-enabled', async () => {
    try {
      // 在实际应用中，这里应该检查 OBS 配置文件并启用 WebSocket
      console.log('Ensuring OBS WebSocket is enabled');

      // 模拟成功启用
      return true;
    } catch (error) {
      console.error('Failed to ensure OBS WebSocket is enabled:', error);
      return false;
    }
  });

  ipcMain.handle('set-obs-stream-settings', async (event, { streamUrl, streamKey }) => {
    try {
      // 在实际应用中，这里应该使用 OBS WebSocket 客户端设置推流参数
      console.log(`Setting OBS stream settings - URL: ${streamUrl}, Key: ${streamKey ? '******' : 'none'}`);

      // 模拟成功设置
      return true;
    } catch (error) {
      console.error('Failed to set OBS stream settings:', error);
      return false;
    }
  });

  ipcMain.handle('start-obs-streaming', async () => {
    try {
      // 在实际应用中，这里应该使用 OBS WebSocket 客户端启动推流
      console.log('Starting OBS streaming');

      // 模拟成功启动
      return true;
    } catch (error) {
      console.error('Failed to start OBS streaming:', error);
      return false;
    }
  });

  ipcMain.handle('stop-obs-streaming', async () => {
    try {
      // 在实际应用中，这里应该使用 OBS WebSocket 客户端停止推流
      console.log('Stopping OBS streaming');

      // 模拟成功停止
      return true;
    } catch (error) {
      console.error('Failed to stop OBS streaming:', error);
      return false;
    }
  });

  // 直播平台相关功能
  ipcMain.handle('get-douyin-companion-info', async () => {
    try {
      // 在实际应用中，这里应该从直播伴侣程序中获取推流信息
      console.log('Getting Douyin companion info');

      // 模拟推流信息
      return {
        streamUrl: 'rtmp://push.douyin.com/live',
        streamKey: 'mock_douyin_companion_key_' + Date.now()
      };
    } catch (error) {
      console.error('Failed to get Douyin companion info:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('get-douyin-api-info', async (event, { token, method }) => {
    try {
      // 在实际应用中，这里应该调用抖音 API 获取推流信息
      console.log(`Getting Douyin API info for method: ${method} with token: ${token ? token.substring(0, 5) + '...' : 'none'}`);

      // 模拟推流信息
      return {
        streamUrl: 'rtmp://push.douyin.com/live',
        streamKey: `mock_douyin_${method}_key_` + Date.now()
      };
    } catch (error) {
      console.error('Failed to get Douyin API info:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('get-bilibili-stream-info', async (event, { token }) => {
    try {
      // 在实际应用中，这里应该调用 Bilibili API 获取推流信息
      console.log(`Getting Bilibili stream info with token: ${token ? token.substring(0, 5) + '...' : 'none'}`);

      // 模拟推流信息
      return {
        streamUrl: 'rtmp://live-push.bilivideo.com/live-bvc',
        streamKey: 'mock_bilibili_key_' + Date.now()
      };
    } catch (error) {
      console.error('Failed to get Bilibili stream info:', error);
      return { error: error.message };
    }
  });

  // 认证相关功能
  ipcMain.handle('login-douyin', async () => {
    try {
      // 在实际应用中，这里应该打开浏览器进行 OAuth 授权
      console.log('Opening Douyin login page');

      // 模拟登录成功
      return {
        success: true,
        user: {
          id: 'douyin_user_123',
          nickname: '抖音用户',
          avatar: null,
          followCount: 100,
          fansCount: 500,
          likeCount: 1000
        },
        token: 'mock_douyin_token_' + Date.now()
      };
    } catch (error) {
      console.error('Failed to login to Douyin:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('login-bilibili', async () => {
    try {
      // 在实际应用中，这里应该打开浏览器进行 OAuth 授权
      console.log('Opening Bilibili login page');

      // 模拟登录成功
      return {
        success: true,
        user: {
          id: 'bilibili_user_456',
          nickname: 'B站用户',
          avatar: null,
          followCount: 200,
          fansCount: 600,
          likeCount: 2000
        },
        token: 'mock_bilibili_token_' + Date.now()
      };
    } catch (error) {
      console.error('Failed to login to Bilibili:', error);
      return { success: false, error: error.message };
    }
  });

  // 在macOS上，点击dock图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 关闭所有窗口时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});