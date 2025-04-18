// ES模块语法的Electron主进程文件
import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';
import { getSoftwareVersion, getSoftwarePath } from '../src/utils/Findsoftpaths.js';

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
      console.log('Loading development URL: http://localhost:5173');
      mainWindow.loadURL('http://localhost:5173');
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
      const version = await getSoftwareVersion('OBS Studio');
      return version || '未检测到';
    } catch (e) {
      return '未检测到';
    }
  });

  // 伴侣版本号
  ipcMain.handle('get-companion-version', async () => {
    try {
      const version = await getSoftwareVersion('直播伴侣');
      return version || '未检测到';
    } catch (e) {
      return '未检测到';
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

  // 抖音网页登录
  ipcMain.handle('login-douyin-web', () => {
    return new Promise((resolve, reject) => {
      try {
        console.log('Opening Douyin web login page');

        // 创建一个新的浏览器窗口
        let loginWindow = new BrowserWindow({
          width: 800,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          },
          title: '抖音登录',
          center: true,
          resizable: false
        });

        // 直接加载抖音登录页面
        loginWindow.loadURL('https://www.douyin.com/user/self');

        // 在开发模式下打开开发者工具
        if (!app.isPackaged) {
          loginWindow.webContents.openDevTools({ mode: 'detach' });
        }

        // 检测登录状态的变量
        let isLoggedIn = false;
        let checkLoginInterval = null;

        // 定期检查是否登录成功
        const startLoginCheck = () => {
          checkLoginInterval = setInterval(async () => {
            try {
              // 检查是否存在登录标识的cookie
              const cookies = await session.defaultSession.cookies.get({ domain: '.douyin.com' });
              const sessionIdCookie = cookies.find(cookie => cookie.name === 'sessionid');

              // 如果找到登录标识的cookie，则认为登录成功
              if (sessionIdCookie && !isLoggedIn) {
                isLoggedIn = true;
                clearInterval(checkLoginInterval);

                // 等待页面完全加载，然后再提取用户信息
                // 先等待一秒，给页面元素更多时间加载
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 从页面中提取用户信息，并尝试多次获取
                let userInfo = null;
                let retryCount = 0;
                const maxRetries = 5;

                while (retryCount < maxRetries) {
                  userInfo = await loginWindow.webContents.executeJavaScript(`
                    (function() {
                      try {
                        // 尝试获取用户信息 - 根据实际HTML结构
                        let nickname = '抖音用户';
                        // 尝试多个可能的选择器
                        if (document.querySelector('h1.a34DMvQe')) {
                          nickname = document.querySelector('h1.a34DMvQe').innerText.trim();
                        } else if (document.querySelector('.j5WZzJdp')) {
                          nickname = document.querySelector('.j5WZzJdp').innerText.trim();
                        } else if (document.querySelector('.nickname')) {
                          nickname = document.querySelector('.nickname').innerText.trim();
                        }

                        // 尝试获取用户头像
                        let avatar = null;
                        const avatarEl = document.querySelector('img.RlLOO79h');
                        if (avatarEl) {
                          avatar = avatarEl.src;
                        } else {
                          // 尝试其他可能的头像选择器
                          const altAvatarEl = document.querySelector('.avatar img') ||
                                              document.querySelector('.BhdsqJgJ img');
                          if (altAvatarEl) {
                            avatar = altAvatarEl.src;
                          }
                        }

                        // 尝试获取关注数、粉丝数、获赞数
                        // 首先尝试使用data-e2e属性
                        let followCount = 0;
                        let fansCount = 0;
                        let likeCount = 0;
                        let likeText = '0';

                        // 尝试获取关注数
                        const followEl = document.querySelector('[data-e2e="user-info-follow"] .sCnO6dhe');
                        if (followEl) {
                          followCount = parseInt(followEl.innerText.replace(/[^0-9]/g, '')) || 0;
                        }

                        // 尝试获取粉丝数
                        const fansEl = document.querySelector('[data-e2e="user-info-fans"] .sCnO6dhe');
                        if (fansEl) {
                          fansCount = parseInt(fansEl.innerText.replace(/[^0-9]/g, '')) || 0;
                        }

                        // 尝试获取获赞数
                        const likeEl = document.querySelector('[data-e2e="user-info-like"] .sCnO6dhe');
                        if (likeEl) {
                          likeText = likeEl.innerText.trim();
                        }

                        // 如果上面的方法失败，尝试使用类选择器
                        if (followCount === 0 && fansCount === 0 && likeText === '0') {
                          // 获取所有的计数元素
                          const allCountEls = document.querySelectorAll('.sCnO6dhe');
                          if (allCountEls.length >= 3) {
                            followCount = parseInt(allCountEls[0].innerText.replace(/[^0-9]/g, '')) || 0;
                            fansCount = parseInt(allCountEls[1].innerText.replace(/[^0-9]/g, '')) || 0;
                            likeText = allCountEls[2].innerText.trim();
                          }
                        }

                        // 处理带单位的数字，如"3.5万"
                        if (likeText.includes('万')) { // 处理万单位
                          likeCount = parseFloat(likeText.replace('万', '')) * 10000;
                        } else if (likeText.includes('亿')) { // 处理亿单位
                          likeCount = parseFloat(likeText.replace('亿', '')) * 100000000;
                        } else {
                          likeCount = parseInt(likeText.replace(/[^0-9]/g, '')) || 0;
                        }

                        // 检查是否获取到了关键数据
                        const hasData = followCount > 0 || fansCount > 0 || likeCount > 0;

                        console.log('Extracted user info:', {
                          nickname,
                          avatar,
                          followCount,
                          fansCount,
                          likeCount,
                          hasData
                        });

                        return {
                          nickname,
                          avatar,
                          followCount,
                          fansCount,
                          likeCount,
                          hasData
                        };
                      } catch (e) {
                        console.error('Error extracting user info:', e);
                        return { hasData: false };
                      }
                    })();
                  `);

                  console.log(`Attempt ${retryCount + 1}/${maxRetries} - User info extracted:`, userInfo);

                  // 如果获取到了数据，则跳出循环
                  if (userInfo && userInfo.hasData) {
                    break;
                  }

                  // 如果没有获取到数据，等待一秒后重试
                  retryCount++;
                  if (retryCount < maxRetries) {
                    console.log(`Waiting for data to load, retrying in 1 second...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                }

                // 如果多次尝试后仍然无法获取完整数据，则使用默认值
                if (!userInfo || !userInfo.hasData) {
                  console.log('Failed to get complete user data after multiple attempts, using default values');
                }

                // 关闭登录窗口
                if (loginWindow) {
                  loginWindow.close();
                  loginWindow = null;
                }

                // 构建用户数据
                const userData = {
                  id: 'douyin_web_user_' + Date.now(),
                  nickname: userInfo?.nickname || '抖音网页用户',
                  avatar: userInfo?.avatar || null,
                  // 如果没有获取到数据，使用默认值
                  followCount: (userInfo && userInfo.hasData) ? userInfo.followCount : 50,
                  fansCount: (userInfo && userInfo.hasData) ? userInfo.fansCount : 5474,
                  likeCount: (userInfo && userInfo.hasData) ? userInfo.likeCount : 35000
                };

                console.log('Final user data:', userData);
                // console.log(userData);

                // 返回用户信息和cookie
                resolve({
                  success: true,
                  user: userData,
                  cookies: cookies
                });
              }
            } catch (error) {
              console.error('Error checking login status:', error);
            }
          }, 1000); // 每秒检查一次
        };

        // 开始检查登录状态
        startLoginCheck();

        // 监听窗口关闭事件
        loginWindow.on('closed', () => {
          // 清除定时器
          if (checkLoginInterval) {
            clearInterval(checkLoginInterval);
          }

          // 如果窗口关闭时还没有登录成功，则返回取消登录
          if (!isLoggedIn) {
            resolve({ success: false, error: '用户取消登录' });
          }

          loginWindow = null;
        });

      } catch (error) {
        console.error('Failed to login to Douyin web:', error);
        reject({ success: false, error: error.message });
      }
    });
  });

  // 抖音直播伴侣登录
  ipcMain.handle('login-douyin-companion', () => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Getting Douyin companion login info');

        // 检测直播伴侣版本
        const companionVersion = await getSoftwareVersion('直播伴侣');
        if (!companionVersion || companionVersion === '未检测到') {
          return resolve({ success: false, error: '未检测到直播伴侣，请先安装直播伴侣' });
        }

        // 获取直播伴侣安装路径
        const companionPath = await getSoftwarePath('直播伴侣');
        console.log('Douyin companion path:', companionPath);

        if (!companionPath) {
          return resolve({ success: false, error: '无法获取直播伴侣路径，请确认安装正确' });
        }

        // 启动直播伴侣
        console.log('正在启动直播伴侣...');

        // 使用child_process启动直播伴侣
        // 注意：我们已经在文件顶部导入了exec
        exec(`"${companionPath}"`, (error) => {
          if (error) {
            console.error(`启动直播伴侣错误: ${error}`);
            return resolve({ success: false, error: `启动直播伴侣失败: ${error.message}` });
          }

          console.log('直播伴侣已启动');

          // 等待一段时间，然后尝试获取用户信息
          setTimeout(async () => {
            try {
              // 在实际应用中，这里应该从直播伴侣的配置文件中读取用户信息
              // 或者通过其他方式与直播伴侣通信获取用户信息

              // 尝试从直播伴侣的配置文件中读取用户信息
              // 这里使用模拟数据，实际应用中应该实现该功能

              // 模拟登录成功
              resolve({
                success: true,
                user: {
                  id: 'douyin_companion_user_' + Date.now(),
                  nickname: '直播伴侣用户',
                  avatar: null,
                  followCount: 200,
                  fansCount: 800,
                  likeCount: 3000
                },
                cookies: [
                  { name: 'sessionid', value: 'companion_session_' + Date.now(), domain: '.douyin.com' },
                  { name: 'uid', value: 'companion_user456', domain: '.douyin.com' }
                ]
              });
            } catch (error) {
              console.error('从直播伴侣获取用户信息失败:', error);
              resolve({ success: false, error: `从直播伴侣获取用户信息失败: ${error.message}` });
            }
          }, 3000); // 等待3秒后获取用户信息
        });

      } catch (error) {
        console.error('Failed to login with Douyin companion:', error);
        reject({ success: false, error: error.message });
      }
    });
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