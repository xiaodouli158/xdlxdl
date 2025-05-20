// Generic interface for closing any program using AutoHotkey
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory of the current module (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(__filename);

// Path to sndkey.exe from public/resources directory
const autoHotkeyPath = path.join(process.cwd(), 'public', 'resources', 'sndkey.exe');

// Base directory for AHK scripts
const scriptsDir = path.join(scriptDir, 'ahk_scripts');

// Ensure the scripts directory exists
if (!fs.existsSync(scriptsDir)) {
  try {
    fs.mkdirSync(scriptsDir, { recursive: true });
    console.log(`Created scripts directory at ${scriptsDir}`);
  } catch (err) {
    console.error(`Error creating scripts directory: ${err.message}`);
  }
}

/**
 * Generate an AHK script to close a specific program
 * @param {string} exeName - The executable name to close (e.g., 'obs64.exe')
 * @param {string} windowTitle - Optional window title to match (can be partial)
 * @param {string[]} confirmDialogTitles - Optional array of possible confirmation dialog titles
 * @returns {string} The generated AHK script content
 */
const generateCloseScript = (exeName, windowTitle = '', confirmDialogTitles = []) => {
  // Default confirmation dialog handling if none provided
  const dialogTitles = confirmDialogTitles.length > 0
    ? confirmDialogTitles.map(title => `WinExist("${title}")`).join(' or ')
    : `WinExist("Exit") or WinExist("退出") or WinExist("关闭") or WinExist("Close")`;

  return `#Requires AutoHotkey v2.0
#SingleInstance force

; Script to gracefully close ${exeName}
; This script will:
; 1. Check if the program is running
; 2. First try to send WM_CLOSE message (0x0010) to close it gracefully
; 3. If that fails, fall back to Alt+F4 method
; 4. Wait for confirmation dialog and click "Yes" if it appears

; Define WM_CLOSE constant
WM_CLOSE := 0x0010

; Check if the program is running
if hwnd := WinExist("ahk_exe ${exeName}")${windowTitle ? ` or hwnd := WinExist("${windowTitle}")` : ''}
{
    ; First attempt: Send WM_CLOSE message to window
    PostMessage WM_CLOSE, 0, 0, , "ahk_id " hwnd

    ; Wait briefly to see if program responds to WM_CLOSE
    Sleep 1000

    ; Check if program is still running
    if WinExist("ahk_id " hwnd)
    {
        ; WM_CLOSE failed, try Alt+F4 method as fallback
        WinActivate "ahk_id " hwnd
        Send "!{F4}"
    }

    ; Wait for the confirmation dialog (if any)
    Sleep 500

    ; If confirmation dialog appears, click "Yes"
    if ${dialogTitles}
    {
        WinActivate
        Send "{Enter}"  ; Press Enter to confirm (usually selects "Yes")
    }

    ; Wait a bit more to ensure program has time to close
    Sleep 1000

    ; Check if program is still running
    if WinExist("ahk_id " hwnd)
    {
        ; Both WM_CLOSE and Alt+F4 methods failed
        ExitApp 2  ; Exit with code 2 indicating both methods failed
    }
    else
    {
        ; Success - exit with code 0
        ExitApp 0
    }
}
else
{
    ; Program not running - exit with code 1
    ExitApp 1
}`;
};



/**
 * Close a program using AutoHotkey
 * @param {Object} options - Configuration options
 * @param {string} options.exeName - The executable name to close (e.g., 'obs64.exe')
 * @param {string} [options.windowTitle] - Optional window title to match (can be partial)
 * @param {string[]} [options.confirmDialogTitles] - Optional array of possible confirmation dialog titles
 * @param {boolean} [options.updateScript=false] - Whether to update the script file even if it exists
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
const closeProgram = async (options) => {
  // Default options
  const {
    exeName,
    windowTitle = '',
    confirmDialogTitles = [],
    updateScript = false
  } = options;

  if (!exeName) {
    return {
      success: false,
      message: 'Error: No executable name provided'
    };
  }

  try {
    // Check if sndkey.exe exists
    if (!fs.existsSync(autoHotkeyPath)) {
      console.error(`Error: sndkey.exe not found at ${autoHotkeyPath}`);
      return {
        success: false,
        message: `Error: sndkey.exe not found at ${autoHotkeyPath}`
      };
    }

    // Get the script path
    const safeFileName = exeName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const scriptPath = path.join(scriptsDir, `close_${safeFileName}.ahk`);

    // If the script doesn't exist or we need to update it
    if (!fs.existsSync(scriptPath) || updateScript) {
      const scriptContent = generateCloseScript(exeName, windowTitle, confirmDialogTitles);
      fs.writeFileSync(scriptPath, scriptContent, 'utf8');
      console.log(`${updateScript ? 'Updated' : 'Created'} AHK script at ${scriptPath}`);
    }

    console.log(`Attempting to close ${exeName} using AutoHotkey...`);

    // Execute the AutoHotkey script and handle the result with a Promise
    const result = await new Promise((resolve, reject) => {
      execFile(autoHotkeyPath, [scriptPath], (error, stdout, stderr) => {
        if (error) {
          // Check the exit code
          if (error.code === 1) {
            console.log(`${exeName} is not currently running.`);
            resolve({
              success: false,
              message: `${exeName} is not currently running.`
            });
          } else if (error.code === 2) {
            console.log(`Both WM_CLOSE and Alt+F4 methods failed to close ${exeName}.`);
            resolve({
              success: false,
              message: `Both WM_CLOSE and Alt+F4 methods failed to close ${exeName}.`
            });
          } else {
            console.error(`Error executing AutoHotkey: ${error.message}`);
            reject(error);
          }
          return;
        }

        if (stderr) {
          console.error(`AutoHotkey stderr: ${stderr}`);
        }

        if (stdout) {
          console.log(`AutoHotkey output: ${stdout}`);
        }

        console.log(`${exeName} has been closed successfully.`);
        resolve({
          success: true,
          message: `${exeName} has been closed successfully.`
        });
      });
    });

    return result;
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`
    };
  }
};

// For backward compatibility - close OBS specifically
const closeOBS = async () => {
  const result = await closeProgram({
    exeName: 'obs64.exe',
    confirmDialogTitles: ['Exit OBS', 'OBS Studio']
  });
  return result.success;
};

// Export the functions for use in other modules
export { closeProgram, closeOBS };
export default closeOBS;
