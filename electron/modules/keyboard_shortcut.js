// Script to execute global keyboard shortcuts using PowerShell
// ES Module version
import { spawn } from 'child_process';
import { getStartLiveHotkey } from './douyinCompanionLogin.js';

/**
 * 将键码转换为虚拟键码
 * @param {string} keyCode 键码，例如 "ControlLeft", "ShiftLeft", "KeyL"
 * @returns {number} 虚拟键码
 */
function getVirtualKeyCode(keyCode) {
  // 常用虚拟键码映射
  const keyCodeMap = {
    // 控制键
    'ControlLeft': 0x11,   // CTRL key
    'ControlRight': 0x11,  // CTRL key
    'ShiftLeft': 0x10,     // SHIFT key
    'ShiftRight': 0x10,    // SHIFT key
    'AltLeft': 0x12,       // ALT key
    'AltRight': 0x12,      // ALT key
    'MetaLeft': 0x5B,      // Windows key
    'MetaRight': 0x5C,     // Windows key

    // 字母键
    'KeyA': 0x41, 'KeyB': 0x42, 'KeyC': 0x43, 'KeyD': 0x44, 'KeyE': 0x45,
    'KeyF': 0x46, 'KeyG': 0x47, 'KeyH': 0x48, 'KeyI': 0x49, 'KeyJ': 0x4A,
    'KeyK': 0x4B, 'KeyL': 0x4C, 'KeyM': 0x4D, 'KeyN': 0x4E, 'KeyO': 0x4F,
    'KeyP': 0x50, 'KeyQ': 0x51, 'KeyR': 0x52, 'KeyS': 0x53, 'KeyT': 0x54,
    'KeyU': 0x55, 'KeyV': 0x56, 'KeyW': 0x57, 'KeyX': 0x58, 'KeyY': 0x59,
    'KeyZ': 0x5A,

    // 数字键
    'Digit0': 0x30, 'Digit1': 0x31, 'Digit2': 0x32, 'Digit3': 0x33, 'Digit4': 0x34,
    'Digit5': 0x35, 'Digit6': 0x36, 'Digit7': 0x37, 'Digit8': 0x38, 'Digit9': 0x39,

    // 功能键
    'F1': 0x70, 'F2': 0x71, 'F3': 0x72, 'F4': 0x73, 'F5': 0x74,
    'F6': 0x75, 'F7': 0x76, 'F8': 0x77, 'F9': 0x78, 'F10': 0x79,
    'F11': 0x7A, 'F12': 0x7B
  };

  return keyCodeMap[keyCode] || 0;
}

/**
 * 将快捷键字符串转换为SendKeys格式
 * @param {string} accelerator 快捷键字符串，例如 "Ctrl+Shift+L"
 * @returns {string} SendKeys格式的快捷键，例如 "^+L"
 */
function acceleratorToSendKeys(accelerator) {
  if (!accelerator) return '';

  return accelerator
    .replace(/Ctrl/gi, '^')
    .replace(/Shift/gi, '+')
    .replace(/Alt/gi, '%')
    .replace(/\+/g, '')
    .replace(/\s/g, '');
}

/**
 * Main function to execute the global keyboard shortcut for starting live stream
 * This shortcut will be sent system-wide without needing to focus on a specific window
 */
async function executeCtrlShiftL() {
  try {
    // 获取配置的快捷键
    const hotkeyConfig = await getStartLiveHotkey();
    console.log(`Executing global keyboard shortcut: ${hotkeyConfig.accelerator}...`);

    // 将键码转换为虚拟键码数组
    const virtualKeyCodes = hotkeyConfig.code.map(keyCode => getVirtualKeyCode(keyCode));
    const virtualKeyCodesStr = virtualKeyCodes.map(code => `0x${code.toString(16).toUpperCase()}`).join(', ');

    // 将快捷键字符串转换为SendKeys格式
    const sendKeysFormat = acceleratorToSendKeys(hotkeyConfig.accelerator);

    // Create a PowerShell script with both methods that worked
    const psScript = `
# Add the Windows Forms assembly for SendKeys
Add-Type -AssemblyName System.Windows.Forms

# Create a keyboard sending function using Windows API
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class KeyboardSend
{
    [DllImport("user32.dll")]
    private static extern void keybd_event(byte bVk, byte bScan, int dwFlags, int dwExtraInfo);

    private const int KEYEVENTF_EXTENDEDKEY = 0x1;
    private const int KEYEVENTF_KEYUP = 0x2;

    public static void KeyDown(byte key)
    {
        keybd_event(key, 0, KEYEVENTF_EXTENDEDKEY, 0);
    }

    public static void KeyUp(byte key)
    {
        keybd_event(key, 0, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, 0);
    }

    public static void SendKeyCombination(byte[] keys)
    {
        // Press all keys in order
        foreach (byte key in keys)
        {
            KeyDown(key);
            System.Threading.Thread.Sleep(50);
        }

        // Release all keys in reverse order
        for (int i = keys.Length - 1; i >= 0; i--)
        {
            KeyUp(keys[i]);
            System.Threading.Thread.Sleep(50);
        }
    }
}
"@

# No need to wait for window focus since the shortcut is global
Write-Host "Sending global keyboard shortcut..."

# Method 1: Use our custom KeyboardSend class
Write-Host "Trying method 1: Custom keyboard function..."
[KeyboardSend]::SendKeyCombination(@(${virtualKeyCodesStr}))
Start-Sleep -Milliseconds 500

# Method 2: Use SendKeys as a backup
Write-Host "Trying method 2: SendKeys..."
[System.Windows.Forms.SendKeys]::SendWait('${sendKeysFormat}')

# Verify the keys were sent
Write-Host "Keyboard shortcut has been sent"
`;

    return new Promise((resolve, reject) => {
      // Create a PowerShell process
      const ps = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy', 'Bypass',
        '-Command', psScript
      ]);

      // Handle process events
      ps.stdout.on('data', (data) => {
        console.log(`${data}`);
      });

      ps.stderr.on('data', (data) => {
        console.error(`${data}`);
      });

      ps.on('close', (code) => {
        if (code === 0) {
          console.log(`Keyboard shortcut ${hotkeyConfig.accelerator} executed successfully`);
          resolve(true);
        } else {
          console.error(`PowerShell process exited with code ${code}`);
          reject(new Error(`PowerShell process exited with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error('执行快捷键时出错:', error);
    return Promise.reject(error);
  }
}

// Export the function for use in other modules
export { executeCtrlShiftL };
