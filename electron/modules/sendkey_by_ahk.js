/**
 * 通用快捷键发送模块
 *
 * 这个模块提供了一个通用的接口，用于向任何应用程序发送快捷键。
 * 它使用 sndkey.exe (AutoHotkey) 执行脚本，以便可靠地发送各种组合键。
 */

import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 获取当前模块的目录（ES模块没有__dirname）
const __filename = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(__filename);

// sndkey.exe 的路径（在 public/resources 目录中）
const autoHotkeyPath = path.join(process.cwd(), 'public', 'resources', 'sndkey.exe');

// AHK 脚本的基础目录
const scriptsDir = path.join(scriptDir, 'ahk_scripts');

// 确保脚本目录存在
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

/**
 * 生成发送快捷键的 AHK 脚本
 * @param {Object} options - 配置选项
 * @param {string} options.targetApp - 目标应用程序（可执行文件名或窗口标题）
 * @param {string} options.hotkey - 要发送的快捷键（例如 "^c" 表示 Ctrl+C）
 * @param {boolean} options.useTitle - 是否使用窗口标题而不是可执行文件名来定位窗口
 * @param {boolean} options.activateWindow - 是否在发送快捷键前激活窗口
 * @param {number} options.delayBefore - 发送快捷键前的延迟（毫秒）
 * @param {number} options.delayAfter - 发送快捷键后的延迟（毫秒）
 * @returns {string} 生成的 AHK 脚本内容
 */
function generateHotkeyScript(options) {
  const {
    targetApp,
    hotkey,
    useTitle = false,
    activateWindow = true,
    delayBefore = 100,
    delayAfter = 100
  } = options;

  // 确定窗口匹配条件
  const windowCriteria = useTitle
    ? `"${targetApp}"`
    : `"ahk_exe ${targetApp}"`;

  return `#Requires AutoHotkey v2.0
#SingleInstance force
; 通用快捷键发送脚本
; 自动生成于 ${new Date().toISOString()}

; 定义常量
WM_CLOSE := 0x10

; 检查目标窗口是否存在
if hwnd := WinExist(${windowCriteria})
{
    ; 记录初始状态
    exitCode := 0

    ${activateWindow ? `
    ; 激活窗口（如果需要）
    WinActivate "ahk_id " hwnd

    ; 等待窗口激活
    WinWaitActive "ahk_id " hwnd, , 2
    if !WinActive("ahk_id " hwnd)
        exitCode := 3  ; 无法激活窗口
    ` : ''}

    ; 发送快捷键前的延迟
    Sleep ${delayBefore}

    ; 发送快捷键
    if (exitCode = 0)
    {
        try
        {
            Send "${hotkey}"
            exitCode := 0  ; 成功
        }
        catch as err
        {
            exitCode := 2  ; 发送快捷键失败
        }
    }

    ; 发送快捷键后的延迟
    Sleep ${delayAfter}

    ; 返回结果
    ExitApp exitCode
}
else
{
    ; 目标窗口不存在
    ExitApp 1
}
`;
}

/**
 * 将Electron格式的快捷键转换为AutoHotkey格式
 * @param {string} accelerator - Electron格式的快捷键（例如 "Ctrl+C"）
 * @returns {string} AutoHotkey格式的快捷键（例如 "^c"）
 */
function convertToAHKFormat(accelerator) {
  if (!accelerator) return '';

  return accelerator
    .replace(/CommandOrControl\+|CmdOrCtrl\+/gi, '^')
    .replace(/Command\+|Cmd\+/gi, '^')
    .replace(/Control\+|Ctrl\+/gi, '^')
    .replace(/Shift\+/gi, '+')
    .replace(/Alt\+/gi, '!')
    .replace(/Option\+/gi, '!')
    .replace(/Super\+|Win\+/gi, '#')
    .replace(/Plus/gi, '{+}')
    .replace(/Space/gi, '{Space}')
    .replace(/Tab/gi, '{Tab}')
    .replace(/Backspace/gi, '{Backspace}')
    .replace(/Delete/gi, '{Delete}')
    .replace(/Insert/gi, '{Insert}')
    .replace(/Home/gi, '{Home}')
    .replace(/End/gi, '{End}')
    .replace(/PageUp/gi, '{PgUp}')
    .replace(/PageDown/gi, '{PgDn}')
    .replace(/Escape/gi, '{Escape}')
    .replace(/Enter/gi, '{Enter}')
    .replace(/ArrowUp/gi, '{Up}')
    .replace(/ArrowDown/gi, '{Down}')
    .replace(/ArrowLeft/gi, '{Left}')
    .replace(/ArrowRight/gi, '{Right}')
    .replace(/F(\d+)/gi, '{F$1}');
}

/**
 * 向指定应用程序发送快捷键
 * @param {Object} options - 配置选项
 * @param {string} options.targetApp - 目标应用程序（可执行文件名或窗口标题）
 * @param {string} options.hotkey - 要发送的快捷键（Electron格式，例如 "Ctrl+C"）
 * @param {boolean} [options.useTitle=false] - 是否使用窗口标题而不是可执行文件名来定位窗口
 * @param {boolean} [options.activateWindow=true] - 是否在发送快捷键前激活窗口
 * @param {number} [options.delayBefore=100] - 发送快捷键前的延迟（毫秒）
 * @param {number} [options.delayAfter=100] - 发送快捷键后的延迟（毫秒）
 * @param {boolean} [options.updateScript=false] - 是否更新已存在的脚本文件
 * @returns {Promise<{success: boolean, message: string}>} 操作结果
 */
async function sendHotkey(options) {
  // 默认选项
  const {
    targetApp,
    hotkey,
    useTitle = false,
    activateWindow = true,
    delayBefore = 100,
    delayAfter = 100,
    updateScript = false
  } = options;

  // 验证必要参数
  if (!targetApp) {
    return {
      success: false,
      message: '错误: 未指定目标应用程序'
    };
  }

  if (!hotkey) {
    return {
      success: false,
      message: '错误: 未指定快捷键'
    };
  }

  try {
    // 检查 sndkey.exe 是否存在
    if (!fs.existsSync(autoHotkeyPath)) {
      console.error(`错误: sndkey.exe 未找到，路径: ${autoHotkeyPath}`);
      return {
        success: false,
        message: `错误: sndkey.exe 未找到，路径: ${autoHotkeyPath}`
      };
    }

    // 将快捷键转换为 AHK 格式
    const ahkHotkey = convertToAHKFormat(hotkey);

    // 获取脚本路径
    const safeFileName = targetApp.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const scriptPath = path.join(scriptsDir, `hotkey_${safeFileName}.ahk`);

    // 如果脚本不存在或需要更新
    if (!fs.existsSync(scriptPath) || updateScript) {
      const scriptContent = generateHotkeyScript({
        targetApp,
        hotkey: ahkHotkey,
        useTitle,
        activateWindow,
        delayBefore,
        delayAfter
      });
      fs.writeFileSync(scriptPath, scriptContent, 'utf8');
      console.log(`${updateScript ? '更新' : '创建'} AHK 脚本: ${scriptPath}`);
    }

    // 执行 AutoHotkey 脚本并处理结果
    const result = await new Promise((resolve, reject) => {
      execFile(autoHotkeyPath, [scriptPath], (error, stdout, stderr) => {
        if (error) {
          // 检查退出代码
          if (error.code === 1) {
            console.log(`目标应用程序 ${targetApp} 未运行`);
            resolve({
              success: false,
              message: `目标应用程序 ${targetApp} 未运行`
            });
          } else if (error.code === 2) {
            console.log(`向 ${targetApp} 发送快捷键 ${hotkey} 失败`);
            resolve({
              success: false,
              message: `向 ${targetApp} 发送快捷键 ${hotkey} 失败`
            });
          } else if (error.code === 3) {
            console.log(`无法激活 ${targetApp} 窗口`);
            resolve({
              success: false,
              message: `无法激活 ${targetApp} 窗口`
            });
          } else {
            console.error(`执行 AutoHotkey 时出错: ${error.message}`);
            reject(error);
          }
          return;
        }

        if (stderr) {
          console.error(`AutoHotkey 错误输出: ${stderr}`);
        }

        if (stdout) {
          console.log(`AutoHotkey 输出: ${stdout}`);
        }

        console.log(`成功向 ${targetApp} 发送快捷键 ${hotkey}`);
        resolve({
          success: true,
          message: `成功向 ${targetApp} 发送快捷键 ${hotkey}`
        });
      });
    });

    return result;
  } catch (error) {
    console.error(`意外错误: ${error.message}`);
    return {
      success: false,
      message: `意外错误: ${error.message}`
    };
  }
}

// 导出函数供其他模块使用
export { sendHotkey, convertToAHKFormat };
export default sendHotkey;
