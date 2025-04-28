// ES模块语法的Electron主进程文件
import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';
import { getSoftwareVersion, getSoftwarePath } from '../src/utils/Findsoftpaths.js';
import { loginDouyinWeb } from './modules/douyinWebLogin.js';
import { loginDouyinCompanion } from './modules/douyinCompanionLogin.js';
import { registerOBSWebSocketHandlers } from './modules/obsWebSocketHandlers.js';

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

// 创建浏览器窗口函数
function createWindow() {
  try {
    console.log('Creating main window...');
    // 创建浏览器窗口，设置为830x660，并移除默认标题栏
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false, // 关闭 Node 集成
        contextIsolation: true, // 启用上下文隔离
        preload: path.join(__dirname, 'preload.js'), // 预加载脚本
      },
      resizable: false,
      frame: false, // 移除默认窗口边框
      titleBarStyle: 'hidden', // 隐藏标题栏
    });

    // 开发环境下使用Vite开发服务器
    if (!app.isPackaged) {
      // 尝试多个可能的端口
      const tryLoadURL = async (ports) => {
        for (const port of ports) {
          try {
            const url = `http://localhost:${port}`;
            console.log(`尝试加载开发服务器 URL: ${url}`);
            await mainWindow.loadURL(url);
            console.log(`成功加载开发服务器 URL: ${url}`);
            return true;
          } catch (err) {
            console.log(`无法加载端口 ${port}: ${err.message}`);
          }
        }
        return false;
      };

      // 尝试端口 5173 和 5174
      tryLoadURL([5173, 5174]).then(success => {
        if (!success) {
          console.error('无法加载任何开发服务器 URL');
        }
      });
      // 打开开发者工具
      mainWindow.webContents.openDevTools();
    } else {
      // 生产环境加载打包后的文件
      const htmlPath = path.join(__dirname, '../dist/index.html');
      console.log('Loading production file:', htmlPath);
      mainWindow.loadFile(htmlPath);
    }

    // 添加window加载错误事件监听
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Window failed to load:', errorCode, errorDescription);
    });

    // 添加窗口关闭事件监听
    mainWindow.on('closed', () => {
      mainWindow = null;
      console.log('Main window closed');
    });

    console.log('Window created successfully');
  } catch (error) {
    console.error('Error creating window:', error);
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

  // OBS版本号
  ipcMain.handle('get-obs-version', async () => {
    try {
      console.log('正在获取OBS Studio版本...');
      const version = await getSoftwareVersion('OBS Studio');
      console.log('OBS版本检测结果:', version);
      return version || '未检测到';
    } catch (e) {
      console.error('获取OBS版本时出错:', e);
      return '未检测到';
    }
  });

  // 伴侣版本号
  ipcMain.handle('get-companion-version', async () => {
    try {
      console.log('正在获取直播伴侣版本...');
      const version = await getSoftwareVersion('直播伴侣');
      console.log('直播伴侣版本检测结果:', version);
      return version || '未检测到';
    } catch (e) {
      console.error('获取直播伴侣版本时出错:', e);
      return '未检测到';
    }
  });

  // 注册 OBS WebSocket 相关的 IPC 处理函数
  registerOBSWebSocketHandlers(ipcMain);

  // 直播平台相关功能
  ipcMain.handle('get-douyin-companion-info', async () => {
    try {
      // 从直播伴侣的roomStore.json文件中获取推流信息
      console.log('Getting Douyin companion info from roomStore.json');

      // 定义roomStore.json文件路径
      const ROOM_STORE_PATH = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
                                       'webcast_mate', 'WBStore', 'roomStore.json');

      // 检查文件是否存在
      try {
        await fsAccess(ROOM_STORE_PATH, fs.constants.R_OK);
        console.log('找到roomStore.json文件');

        // 读取文件内容
        const roomStoreData = await fsReadFile(ROOM_STORE_PATH, 'utf8');

        try {
          // 解析JSON
          const roomStore = JSON.parse(roomStoreData);
          console.log('成功解析roomStore.json文件');

          // 打印roomStore的顶层结构，帮助调试
          console.log('roomStore顶层结构:', Object.keys(roomStore));

          // 尝试查找rtmp_push_url的位置
          let rtmpPushUrl = null;

          // 情况1: 直接在顶层
          if (roomStore.rtmp_push_url) {
            rtmpPushUrl = roomStore.rtmp_push_url;
            console.log('在顶层找到RTMP推流地址');
          }
          // 情况2: 在roomStore.settings.stream_url中
          else if (roomStore.settings &&
                  roomStore.settings.stream_url &&
                  roomStore.settings.stream_url.rtmp_push_url) {
            rtmpPushUrl = roomStore.settings.stream_url.rtmp_push_url;
            console.log('在settings.stream_url中找到RTMP推流地址');
          }
          // 情况3: 在roomStore.roomStore.settings.stream_url中
          else if (roomStore.roomStore &&
                  roomStore.roomStore.settings &&
                  roomStore.roomStore.settings.stream_url &&
                  roomStore.roomStore.settings.stream_url.rtmp_push_url) {
            rtmpPushUrl = roomStore.roomStore.settings.stream_url.rtmp_push_url;
            console.log('在roomStore.settings.stream_url中找到RTMP推流地址');
          }

          // 如果找到了RTMP推流地址
          if (rtmpPushUrl) {
            console.log('找到RTMP推流地址:', rtmpPushUrl);
          } else {
            // 如果没有找到，打印更多的调试信息
            console.error('未找到RTMP推流地址，打印完整的JSON结构以便调试:');
            // 打印前1000个字符，避免日志过长
            console.error(JSON.stringify(roomStore, null, 2).substring(0, 1000) + '...');

            // 尝试递归查找包含rtmp_push_url的对象
            const findRtmpUrl = (obj, path = '') => {
              if (!obj || typeof obj !== 'object') return;

              for (const key in obj) {
                const newPath = path ? `${path}.${key}` : key;

                if (key === 'rtmp_push_url') {
                  console.log(`找到rtmp_push_url在路径: ${newPath}, 值: ${obj[key]}`);
                  rtmpPushUrl = obj[key];
                  return true;
                }

                if (typeof obj[key] === 'object' && obj[key] !== null) {
                  if (findRtmpUrl(obj[key], newPath)) return true;
                }
              }

              return false;
            };

            // 尝试递归查找
            findRtmpUrl(roomStore);
          }

          // 再次检查是否找到了RTMP推流地址
          if (rtmpPushUrl) {

            // 拆分RTMP URL为推流地址和推流密钥
            // RTMP URL格式通常为: rtmp://server/app/stream_key
            const lastSlashIndex = rtmpPushUrl.lastIndexOf('/');

            if (lastSlashIndex !== -1 && lastSlashIndex < rtmpPushUrl.length - 1) {
              const streamUrl = rtmpPushUrl.substring(0, lastSlashIndex);
              const streamKey = rtmpPushUrl.substring(lastSlashIndex + 1);

              console.log(`已拆分RTMP URL - 推流地址: ${streamUrl}, 推流密钥: ${streamKey ? '******' : 'none'}`);

              return {
                streamUrl,
                streamKey
              };
            } else {
              console.error('无法拆分RTMP URL:', rtmpPushUrl);
              return {
                streamUrl: rtmpPushUrl,
                streamKey: ''
              };
            }
          } else {
            console.error('roomStore.json中未找到rtmp_push_url字段');
            // 返回错误信息，不提供模拟数据
            throw new Error('roomStore.json中未找到rtmp_push_url字段，请确保直播伴侣已正确启动并创建了直播间');
          }
        } catch (parseError) {
          console.error('解析roomStore.json文件失败:', parseError);
          throw new Error('解析roomStore.json文件失败: ' + parseError.message);
        }
      } catch (fileError) {
        console.error('无法访问roomStore.json文件:', fileError);
        throw new Error('无法访问roomStore.json文件: ' + fileError.message);
      }
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

  // 抖音网页登录 - 使用模块化实现
  ipcMain.handle('login-douyin-web', loginDouyinWeb);

  // 抖音直播伴侣登录 - 使用模块化实现
  ipcMain.handle('login-douyin-companion', loginDouyinCompanion);

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