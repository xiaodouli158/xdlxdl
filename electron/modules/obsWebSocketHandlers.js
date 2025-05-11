// obsWebSocketHandlers.js - OBS WebSocket 模块
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import os from 'os';
import { exec } from 'child_process';
import OBSWebSocket from 'obs-websocket-js';
import { getSoftwarePath } from '../utils/Findsoftpaths.js';

// 将回调函数转换为 Promise
const fsReadFile = promisify(fs.readFile);
const fsWriteFile = promisify(fs.writeFile);
const fsAccess = promisify(fs.access);
const execAsync = promisify(exec);

// OBS WebSocket 配置文件路径
const OBS_WEBSOCKET_CONFIG_PATH = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'obs-studio', 'plugin_config', 'obs-websocket', 'config.json'
);

// OBS WebSocket 实例
let obsWebSocket = null;

// OBS WebSocket 配置信息
let obsWebSocketConfig = {
  server_enabled: false,
  server_port: 4455,
  server_password: ''
};


/**
 * 确保 OBS WebSocket 服务器已启用并连接到 OBS
 * @param {string} [address] 服务器地址，如果未指定则使用配置中的地址和端口
 * @param {string} [password] 服务器密码，如果未指定则使用配置中的密码
 * @returns {Promise<{success: boolean, message: string, config?: object}>} 结果
 */
async function ensureAndConnectToOBS(address = '', password = '') {
  try {
    console.log('正在检查 OBS WebSocket 配置...');
    console.log('配置文件路径:', OBS_WEBSOCKET_CONFIG_PATH);

    // 检查 OBS 是否正在运行
    const isOBSRunning = await checkIfOBSIsRunning();

    // 检查配置文件是否存在
    let configExists = false;
    try {
      await fsAccess(OBS_WEBSOCKET_CONFIG_PATH, fs.constants.R_OK | fs.constants.W_OK);
      console.log('找到 OBS WebSocket 配置文件');
      configExists = true;
    } catch (error) {
      console.error('OBS WebSocket 配置文件不存在或无法访问:', error);
      if (!isOBSRunning) {
        console.log('OBS 未运行，尝试启动 OBS...');
        const startResult = await startOBSProcess();
        if (!startResult.success) {
          return startResult;
        }
      } else {
        return {
          success: false,
          message: 'OBS WebSocket 配置文件不存在，请确保已安装 OBS Studio 和 OBS WebSocket 插件'
        };
      }
    }

    // 如果配置文件存在，检查 WebSocket 服务器是否启用
    let needToRestartOBS = false;
    if (configExists) {
      // 读取配置文件
      const configData = await fsReadFile(OBS_WEBSOCKET_CONFIG_PATH, 'utf8');
      let config;

      try {
        config = JSON.parse(configData);
        console.log('成功解析 OBS WebSocket 配置文件');

        // 保存配置信息到全局变量
        obsWebSocketConfig.server_enabled = config.server_enabled || false;
        obsWebSocketConfig.server_port = config.server_port || 4455;
        obsWebSocketConfig.server_password = config.server_password || '';

        console.log(`OBS WebSocket 配置信息: 启用状态=${obsWebSocketConfig.server_enabled}, 端口=${obsWebSocketConfig.server_port}`);

        // 检查是否需要修改配置
        if (!config.server_enabled) {
          console.log('OBS WebSocket 服务器未启用，正在启用...');

          // 如果 OBS 正在运行，必须先关闭它才能修改配置
          if (isOBSRunning) {
            console.log('OBS 正在运行，需要先关闭 OBS 才能修改配置...');
            const closeResult = await closeOBSProcess();
            if (!closeResult.success) {
              return closeResult;
            }
          }

          // 保存修改后的配置
          config.server_enabled = true;
          obsWebSocketConfig.server_enabled = true;
          await fsWriteFile(OBS_WEBSOCKET_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
          console.log('OBS WebSocket 配置已更新');

          // 标记需要启动 OBS
          needToRestartOBS = true;
        } else {
          console.log('OBS WebSocket 服务器已启用，无需修改配置');
        }
      } catch (parseError) {
        console.error('解析 OBS WebSocket 配置文件失败:', parseError);
        return {
          success: false,
          message: '解析 OBS WebSocket 配置文件失败: ' + parseError.message
        };
      }
    }

    // 如果需要启动 OBS
    if (needToRestartOBS || !isOBSRunning) {
      console.log('正在启动 OBS...');
      const startResult = await startOBSProcess();
      if (!startResult.success) {
        return startResult;
      }

      // 等待 OBS 启动完成
      console.log('等待 OBS 启动完成...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // 尝试连接到 OBS WebSocket 服务器
    // 如果没有指定地址，使用配置中的端口
    const serverPort = address.includes(':') ? address.split(':')[1] : obsWebSocketConfig.server_port;
    const serverAddress = address.includes(':') ? address.split(':')[0] : 'localhost';
    const fullAddress = `${serverAddress}:${serverPort}`;

    // 如果没有指定密码，使用配置中的密码
    const serverPassword = password || obsWebSocketConfig.server_password;

    console.log(`正在连接到 OBS WebSocket 服务器: ${fullAddress}, 密码: ${serverPassword ? '******' : '无'}`);

    // 如果已经连接，直接返回成功
    if (obsWebSocket && obsWebSocket.connected) {
      console.log('已有活跃连接，无需重新连接');
      return {
        success: true,
        message: '已有活跃连接到 OBS WebSocket 服务器'
      };
    }

    // 如果有实例但未连接，先断开并清理
    if (obsWebSocket) {
      try {
        console.log('清理旧连接...');
        await obsWebSocket.disconnect();
      } catch (e) {
        console.log('清理旧连接时出错，忽略:', e.message);
      }
    }

    // 创建新的 OBS WebSocket 实例
    obsWebSocket = new OBSWebSocket();

    try {
      // 简单直接的连接方式
      await obsWebSocket.connect(`ws://${fullAddress}`, serverPassword);

      // 连接成功
      console.log('成功连接到 OBS WebSocket 服务器');

      // 获取 OBS 版本信息
      try {
        const { obsVersion, obsWebSocketVersion } = await obsWebSocket.call('GetVersion');
        console.log(`已连接到 OBS 版本: ${obsVersion}, WebSocket 版本: ${obsWebSocketVersion}`);
      } catch (versionError) {
        console.warn('获取 OBS 版本信息失败:', versionError);
      }
      return {
        success: true,
        message: 'OBS WebSocket 服务器已启用并成功连接'
      };
    } catch (error) {
      console.error('连接到 OBS WebSocket 服务器失败:', error.message);

      return {
        success: false,
        message: '连接到 OBS WebSocket 服务器失败: ' + error.message
      };
    }
  } catch (error) {
    console.error('确保 OBS WebSocket 启用并连接时出错:', error);
    return {
      success: false,
      message: '确保 OBS WebSocket 启用并连接时出错: ' + error.message
    };
  }
}

/**
 * 检查 OBS 是否正在运行
 * @returns {Promise<boolean>} OBS 是否正在运行
 */
async function checkIfOBSIsRunning() {
  try {
    // 在 Windows 上使用 tasklist 命令检查 OBS 是否运行
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq obs64.exe" /NH');

    // 如果输出中包含 obs64.exe，则 OBS 正在运行
    return stdout.includes('obs64.exe');
  } catch (error) {
    console.error('检查 OBS 是否运行时出错:', error);
    return false;
  }
}

/**
 * 关闭 OBS 进程
 * @returns {Promise<{success: boolean, message: string}>} 关闭结果
 */
async function closeOBSProcess() {
  try {
    // 在 Windows 上使用 taskkill 命令关闭 OBS
    await execAsync('taskkill /F /IM obs64.exe');

    console.log('成功关闭 OBS 进程');

    // 等待进程完全关闭
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      message: '成功关闭 OBS 进程'
    };
  } catch (error) {
    console.error('关闭 OBS 进程时出错:', error);
    return {
      success: false,
      message: '关闭 OBS 进程时出错: ' + error.message
    };
  }
}

/**
 * 启动 OBS 进程
 * @returns {Promise<{success: boolean, message: string}>} 启动结果
 */
async function startOBSProcess() {
  try {
    // 使用 Findsoftpaths.js 中的 getSoftwarePath 函数获取 OBS 路径
    console.log('正在使用 getSoftwarePath 查找 OBS 安装路径...');
    const obsPath = await getSoftwarePath('OBS Studio', 'obs64.exe');

    if (!obsPath) {
      return {
        success: false,
        message: '无法找到 OBS 安装路径，请确保已安装 OBS Studio'
      };
    }

    console.log('找到 OBS 安装路径:', obsPath);

    // 启动 OBS
    await execAsync(`start "" "${obsPath}"`);

    console.log('成功启动 OBS 进程');

    return {
      success: true,
      message: '成功启动 OBS 进程'
    };
  } catch (error) {
    console.error('启动 OBS 进程时出错:', error);
    return {
      success: false,
      message: '启动 OBS 进程时出错: ' + error.message
    };
  }
}


/**
 * 设置 OBS 推流设置
 * @param {string} streamUrl 推流地址
 * @param {string} streamKey 推流密钥
 * @returns {Promise<{success: boolean, message: string}>} 设置结果
 */
async function setOBSStreamSettings(streamUrl, streamKey) {
  try {
    console.log(`正在设置 OBS 推流参数 URL: ${streamUrl}, Key: ${streamKey ? '******' : 'none'}`);

    // 检查是否已连接
    if (!obsWebSocket) {
      console.error('未连接到 OBS WebSocket 服务器');
      return {
        success: false,
        message: '未连接到 OBS WebSocket 服务器，请先连接'
      };
    }

    // 设置推流服务为自定义
    await obsWebSocket.call('SetStreamServiceSettings', {
      streamServiceType: 'rtmp_custom',
      streamServiceSettings: {
        server: streamUrl,
        key: streamKey
      }
    });

    console.log('成功设置 OBS 推流参数');
    return {
      success: true,
      message: '成功设置 OBS 推流参数'
    };
  } catch (error) {
    console.error('设置 OBS 推流参数失败:', error);
    return {
      success: false,
      message: '设置 OBS 推流参数失败: ' + error.message
    };
  }
}

/**
 * 启动 OBS 推流
 * @returns {Promise<{success: boolean, message: string}>} 启动结果
 */
async function startOBSStreaming() {
  try {
    console.log('正在启动 OBS 推流...');

    // 检查是否已连接
    if (!obsWebSocket) {
      console.error('未连接到 OBS WebSocket 服务器');
      return {
        success: false,
        message: '未连接到 OBS WebSocket 服务器，请先连接'
      };
    }

    // 检查是否已经在推流
    const streamStatus = await obsWebSocket.call('GetStreamStatus');
    if (streamStatus.outputActive) {
      console.log('OBS 已经在推流中');
      return {
        success: true,
        message: 'OBS 已经在推流中'
      };
    }

    // 启动推流
    await obsWebSocket.call('StartStream');
    console.log('成功启动 OBS 推流');

    return {
      success: true,
      message: '成功启动 OBS 推流'
    };
  } catch (error) {
    console.error('启动 OBS 推流失败:', error);
    return {
      success: false,
      message: '启动 OBS 推流失败: ' + error.message
    };
  }
}

/**
 * 停止 OBS 推流
 * @returns {Promise<{success: boolean, message: string}>} 停止结果
 */
async function stopOBSStreaming() {
  try {
    console.log('正在停止 OBS 推流...');

    // 检查是否已连接
    if (!obsWebSocketConfig) {
      console.error('未连接到 OBS WebSocket 服务器');
      return {
        success: false,
        message: '未连接到 OBS WebSocket 服务器，请先连接'
      };
    }

    // 检查是否正在推流
    const streamStatus = await obsWebSocket.call('GetStreamStatus');
    if (!streamStatus.outputActive) {
      console.log('OBS 当前没有在推流');
      return {
        success: true,
        message: 'OBS 当前没有在推流'
      };
    }

    // 停止推流
    await obsWebSocket.call('StopStream');
    console.log('成功停止 OBS 推流');

    return {
      success: true,
      message: '成功停止 OBS 推流'
    };
  } catch (error) {
    console.error('停止 OBS 推流失败:', error);
    return {
      success: false,
      message: '停止 OBS 推流失败: ' + error.message
    };
  }
}

/**
 * 断开与 OBS WebSocket 服务器的连接
 * @returns {Promise<{success: boolean, message: string}>} 断开结果
 */
async function disconnectFromOBS() {
  try {
    console.log('正在断开与 OBS WebSocket 服务器的连接...');

    // 检查是否已连接
    if (!obsWebSocket || !obsWebSocket.connected) {
      console.log('当前没有连接到 OBS WebSocket 服务器');
      return {
        success: true,
        message: '当前没有连接到 OBS WebSocket 服务器'
      };
    }

    // 断开连接
    await obsWebSocket.disconnect();
    console.log('成功断开与 OBS WebSocket 服务器的连接');

    return {
      success: true,
      message: '成功断开与 OBS WebSocket 服务器的连接'
    };
  } catch (error) {
    console.error('断开与 OBS WebSocket 服务器的连接失败:', error);
    return {
      success: false,
      message: '断开与 OBS WebSocket 服务器的连接失败: ' + error.message
    };
  }
}

/**
 * 注册 OBS WebSocket 相关的 IPC 处理函数
 * @param {Electron.IpcMain} ipcMain Electron 的 IPC 主进程对象
 */
function registerOBSWebSocketHandlers(ipcMain) {
  console.log('注册 OBS WebSocket 相关的 IPC 处理函数...');

  // 确保 OBS WebSocket 服务器已启用
  ipcMain.handle('ensure-obs-websocket-enabled', async () => {
    try {
      // 如果已经连接，直接返回成功
      if (obsWebSocket && obsWebSocket.connected) {
        console.log('已有活跃连接，无需重新连接');
        return true;
      }

      const result = await ensureAndConnectToOBS();
      return result.success;
    } catch (error) {
      console.error('确保 OBS WebSocket 启用失败:', error);
      return false;
    }
  });
  // 设置 OBS 推流参数
  ipcMain.handle('set-obs-stream-settings', async (_, { streamUrl, streamKey }) => {
    try {
      // 如果未连接，先尝试连接
      if (!obsWebSocket || !obsWebSocket.connected) {
        console.log('未连接到 OBS WebSocket 服务器，尝试连接...');
        const connectResult = await ensureAndConnectToOBS();
        if (!connectResult.success) {
          return connectResult;
        }
      } else {
        console.log('已连接到 OBS WebSocket 服务器，继续操作');
      }

      return await setOBSStreamSettings(streamUrl, streamKey);
    } catch (error) {
      console.error('设置 OBS 推流参数失败:', error);
      return {
        success: false,
        message: '设置 OBS 推流参数失败: ' + error.message
      };
    }
  });

  // 启动 OBS 推流
  ipcMain.handle('start-obs-streaming', async () => {
    try {
      // 如果未连接，先尝试连接
      if (!obsWebSocket) {
        console.log('未连接到 OBS WebSocket 服务器，尝试连接...');
        const connectResult = await ensureAndConnectToOBS();
        if (!connectResult.success) {
          return connectResult;
        }
      } else {
        console.log('已连接到 OBS WebSocket 服务器，继续操作');
      }

      return await startOBSStreaming();
    } catch (error) {
      console.error('启动 OBS 推流失败:', error);
      return {
        success: false,
        message: '启动 OBS 推流失败: ' + error.message
      };
    }
  });

  // 停止 OBS 推流
  ipcMain.handle('stop-obs-streaming', async () => {
    try {
      // 如果未连接，先尝试连接
      if (!obsWebSocket) {
        console.log('未连接到 OBS WebSocket 服务器，尝试连接...');
        const connectResult = await ensureAndConnectToOBS();
        if (!connectResult.success) {
          return connectResult;
        }
      } else {
        console.log('已连接到 OBS WebSocket 服务器，继续操作');
      }

      return await stopOBSStreaming();
    } catch (error) {
      console.error('停止 OBS 推流失败:', error);
      return {
        success: false,
        message: '停止 OBS 推流失败: ' + error.message
      };
    }
  });
}



// 导出核心功能函数
export {
  ensureAndConnectToOBS,
  setOBSStreamSettings,
  startOBSStreaming,
  stopOBSStreaming,
  disconnectFromOBS,
  checkIfOBSIsRunning,
  closeOBSProcess,
  startOBSProcess
};
// 导出注册函数
export { registerOBSWebSocketHandlers };
