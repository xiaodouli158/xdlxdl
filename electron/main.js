// ES模块语法的Electron主进程文件
import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';
import { getSoftwareVersion } from '../src/utils/Findsoftpaths.js';
import { loginDouyinWeb } from './modules/douyinWebLogin.js';
import { loginDouyinCompanion } from './modules/douyinCompanionLogin.js';
import { registerOBSWebSocketHandlers } from './modules/obsWebSocketHandlers.js';
import { executeCtrlShiftL } from './modules/keyboard_shortcut.js';
import { initializePaths } from './utils/pathManager.js';

// 将回调函数转换为 Promise
const execAsync = promisify(exec);
const fsAccess = promisify(fs.access);
const fsReadFile = promisify(fs.readFile);
const fsWriteFile = promisify(fs.writeFile);

/**
 * 检查MediaSDK_Server.exe进程是否正在运行
 * @returns {Promise<boolean>} 进程是否正在运行
 */
async function checkMediaSDKServerRunning() {
  try {
    // 在 Windows 上使用 tasklist 命令检查进程是否运行
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq MediaSDK_Server.exe" /NH');

    // 如果输出中包含 MediaSDK_Server.exe，则进程正在运行
    return stdout.includes('MediaSDK_Server.exe');
  } catch (error) {
    console.error('检查 MediaSDK_Server.exe 是否运行时出错:', error);
    return false;
  }
}

/**
 * 杀死 MediaSDK_Server.exe 进程
 * @returns {Promise<{success: boolean, message: string}>} 操作结果
 */
async function killMediaSDKServer() {
  try {
    // 检查进程是否正在运行
    const isRunning = await checkMediaSDKServerRunning();

    if (!isRunning) {
      return {
        success: true,
        message: 'MediaSDK_Server.exe 进程未运行'
      };
    }

    // 在 Windows 上使用 taskkill 命令强制结束进程
    await execAsync('taskkill /F /IM MediaSDK_Server.exe');
    // 在 Windows 上使用 taskkill 命令强制结束进程，以管理员权限运行
    // await execAsync('powershell -Command "Start-Process -Verb RunAs taskkill -ArgumentList \'/F\', \'/IM\', \'MediaSDK_Server.exe\'"');

    console.log('成功杀死 MediaSDK_Server.exe 进程');

    return {
      success: true,
      message: '成功杀死 MediaSDK_Server.exe 进程'
    };
  } catch (error) {
    console.error('杀死 MediaSDK_Server.exe 进程时出错:', error);
    return {
      success: false,
      message: '杀死 MediaSDK_Server.exe 进程时出错: ' + error.message
    };
  }
}

// 获取__dirname等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义全局变量以存储窗口引用
let mainWindow = null;

// 添加安全认证状态跟踪
let securityAuthInProgress = false;
let lastAuthUrl = null;
let authTimeoutId = null;

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
app.whenReady().then(async () => {
  // 初始化应用程序路径
  console.log('Initializing application paths...');
  await initializePaths();

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
      // 先检查MediaSDK_Server.exe进程是否正在运行
      console.log('检查MediaSDK_Server.exe进程是否正在运行...');
      const isRunning = await checkMediaSDKServerRunning();

      if (!isRunning) {
        console.log('MediaSDK_Server.exe进程未运行，尝试启动直播伴侣...');

        try {
          // 调用loginDouyinCompanion启动直播伴侣
          console.log('正在启动直播伴侣...');
          const loginResult = await loginDouyinCompanion();

          if (!loginResult.success) {
            console.error('启动直播伴侣失败:', loginResult.error);
            return { error: `启动直播伴侣失败: ${loginResult.error}` };
          }

          console.log('直播伴侣启动成功，等待MediaSDK_Server.exe进程启动...');

          // 等待5秒，让直播伴侣有时间启动MediaSDK_Server.exe进程
          await new Promise(resolve => setTimeout(resolve, 15000));

          // 再次检查MediaSDK_Server.exe进程是否已启动
          const isRunningAfterStart = await checkMediaSDKServerRunning();

          if (!isRunningAfterStart) {
            console.error('启动直播伴侣后，MediaSDK_Server.exe进程仍未运行');
            return { error: '启动直播伴侣后，MediaSDK_Server.exe进程仍未运行，请手动启动直播伴侣' };
          }

          console.log('成功启动直播伴侣并检测到MediaSDK_Server.exe进程');
        } catch (startError) {
          console.error('启动直播伴侣时出错:', startError);
          return { error: `启动直播伴侣时出错: ${startError.message}` };
        }
      }

      console.log('检测到MediaSDK_Server.exe进程正在运行');

      // 执行keyboard_shortcut.js中的快捷键，直播伴侣开播
      try {
        console.log('正在执行Ctrl+Shift+L快捷键...');
        executeCtrlShiftL()
          .then(() => {
            console.log('快捷键执行成功');
          })
          .catch((error) => {
            console.error('快捷键执行失败:', error);
          });
      } catch (error) {
        console.error('执行快捷键时出错:', error);
      }

      // 只有当MediaSDK_Server.exe进程正在运行时，才从roomStore.json获取推流信息
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

          // 首先检查status是否为2
          let status = null;

          // 检查status的位置
          if (roomStore.status !== undefined) {
            status = roomStore.status;
            console.log('在顶层找到status:', status);
          } else if (roomStore.roomStore && roomStore.roomStore.status !== undefined) {
            status = roomStore.roomStore.status;
            console.log('在roomStore.roomStore中找到status:', status);
          }

          // 如果status不是2，返回错误
          if (status !== 2) {
            console.log(`直播间状态不是2，当前状态: ${status}`);
            return {
              error: `直播间未准备好，当前状态: ${status}，需要状态为2才能获取推流地址`,
              status: status
            };
          }

          console.log('直播间状态为2，可以获取推流地址');

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
                streamKey,
                status: status
              };
            } else {
              console.error('无法拆分RTMP URL:', rtmpPushUrl);
              return {
                streamUrl: rtmpPushUrl,
                streamKey: '',
                status: status
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
      console.log(`Getting Douyin API info for method: ${method} with token: ${token ? token.substring(0, 5) + '...' : 'none'}`);

      // 导入douyin_rtmp_api模块
      try {
        const { main: douyinRtmpApi } = await import('./modules/douyin_rtmp_api.js');

        // 根据方法选择模式
        // 手机开播对应phone模式，自动开播对应auto模式
        const mode = method === 'create' ? 'auto' : 'phone';
        console.log(`Using mode: ${mode} for method: ${method}`);

        // 调用API
        const result = await douyinRtmpApi(mode, { handleAuth: true });

        console.log('Douyin RTMP API result:', result);

        // 如果是停止直播，则停止ping/anchor请求
        if (method === 'stop') {
          const { stopPingAnchor } = await import('./modules/douyin_rtmp_api.js');
          const stopped = stopPingAnchor();
          console.log('Stopped ping/anchor requests:', stopped);
          return { success: true, message: '已停止直播状态维持' };
        }

        // 如果是手动维持直播状态
        if (method === 'maintain' && token) {
          try {
            const { startPingAnchor } = await import('./modules/douyin_rtmp_api.js');
            const { roomId, streamId, mode } = token;

            if (!roomId || !streamId) {
              return { error: '缺少必要的房间ID或流ID参数' };
            }

            const started = startPingAnchor(roomId, streamId, mode || 'phone');
            console.log('Started ping/anchor requests:', started);
            return {
              success: true,
              message: '已开始直播状态维持',
              roomId,
              streamId
            };
          } catch (error) {
            console.error('Error starting ping/anchor requests:', error);
            return { error: `启动直播状态维持失败: ${error.message}` };
          }
        }

        // 检查是否需要安全认证
        if (result.requiresAuth && result.authUrl) {
          console.log('Security authentication required:', result.authPrompt);

          // 检查是否已经在处理相同的认证URL
          if (securityAuthInProgress && lastAuthUrl === result.authUrl) {
            console.log('Security authentication already in progress for this URL, skipping duplicate');
            return {
              requiresAuth: true,
              authUrl: result.authUrl,
              authPrompt: result.authPrompt
            };
          }

          // 设置认证状态
          securityAuthInProgress = true;
          lastAuthUrl = result.authUrl;

          // 打开认证URL
          try {
            console.log('Opening authentication URL in browser:', result.authUrl);
            await shell.openExternal(result.authUrl);

            // 向渲染进程发送通知消息
            if (mainWindow) {
              // Always use our custom message regardless of what the API returns
              const customAuthMessage = '直播安全认证，请完成后重试！';
              mainWindow.webContents.send('auth-notification', { message: customAuthMessage });
            }

            // 设置超时，30秒后重置认证状态
            if (authTimeoutId) {
              clearTimeout(authTimeoutId);
            }

            authTimeoutId = setTimeout(() => {
              console.log('Resetting security authentication status after timeout');
              securityAuthInProgress = false;
              lastAuthUrl = null;
              authTimeoutId = null;
            }, 30000); // 30秒后重置
          } catch (error) {
            console.error('Failed to open authentication URL:', error);
            // 出错时重置认证状态
            securityAuthInProgress = false;
            lastAuthUrl = null;
          }

          return {
            requiresAuth: true,
            authUrl: result.authUrl,
            authPrompt: result.authPrompt
          };
        }

        // 检查是否需要重试（手机开播模式下，状态不为2）
        if (result.needsRetry) {
          console.log(`Stream not ready yet. Current status: ${result.currentStatus}, expected: ${result.expectedStatus}`);
          return {
            needsRetry: true,
            currentStatus: result.currentStatus,
            expectedStatus: result.expectedStatus,
            roomId: result.room_id,
            streamId: result.stream_id,
            error: result.error || '直播间未准备好，请等待或重试'
          };
        }

        // 检查是否有错误
        if (result.error) {
          console.error('Douyin API error:', result.error);
          return { error: result.error };
        }

        // 检查是否有RTMP URL
        if (result.rtmpUrl) {
          // 拆分RTMP URL为推流地址和推流密钥
          const lastSlashIndex = result.rtmpUrl.lastIndexOf('/');

          if (lastSlashIndex !== -1 && lastSlashIndex < result.rtmpUrl.length - 1) {
            const streamUrl = result.rtmpUrl.substring(0, lastSlashIndex);
            const streamKey = result.rtmpUrl.substring(lastSlashIndex + 1);

            console.log(`已拆分RTMP URL - 推流地址: ${streamUrl}, 推流密钥: ${streamKey ? '******' : 'none'}`);

            return {
              streamUrl,
              streamKey,
              roomId: result.roomId,
              streamId: result.streamId
            };
          }
        }

        // 如果没有找到RTMP URL
        return { error: '未找到有效的推流地址' };
      } catch (error) {
        console.error('Error importing or running douyin_rtmp_api:', error);
        return { error: `API模块错误: ${error.message}` };
      }
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

  // 安全认证相关功能
  ipcMain.handle('open-auth-url', async (_, { url }) => {
    try {
      // 检查是否已经在处理相同的认证URL
      if (securityAuthInProgress && lastAuthUrl === url) {
        console.log('Security authentication already in progress for this URL, skipping duplicate');
        return { success: true, alreadyInProgress: true };
      }

      // 设置认证状态
      securityAuthInProgress = true;
      lastAuthUrl = url;

      console.log('Opening authentication URL in browser:', url);
      await shell.openExternal(url);

      // 设置超时，30秒后重置认证状态
      if (authTimeoutId) {
        clearTimeout(authTimeoutId);
      }

      authTimeoutId = setTimeout(() => {
        console.log('Resetting security authentication status after timeout');
        securityAuthInProgress = false;
        lastAuthUrl = null;
        authTimeoutId = null;
      }, 30000); // 30秒后重置

      return { success: true };
    } catch (error) {
      console.error('Failed to open authentication URL:', error);
      // 出错时重置认证状态
      securityAuthInProgress = false;
      lastAuthUrl = null;
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('show-auth-notification', async (_, { message }) => {
    try {
      console.log('Showing authentication notification:', message);

      // 如果主窗口存在，向渲染进程发送通知消息
      if (mainWindow) {
        mainWindow.webContents.send('auth-notification', { message });
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to show authentication notification:', error);
      return { success: false, error: error.message };
    }
  });

  // MediaSDK_Server.exe 进程管理
  ipcMain.handle('kill-mediasdk-server', async () => {
    try {
      console.log('正在尝试杀死 MediaSDK_Server.exe 进程...');
      return await killMediaSDKServer();
    } catch (error) {
      console.error('杀死 MediaSDK_Server.exe 进程失败:', error);
      return {
        success: false,
        message: '杀死 MediaSDK_Server.exe 进程失败: ' + error.message
      };
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