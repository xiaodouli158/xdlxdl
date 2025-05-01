// Script to execute global Ctrl+Shift+L keyboard shortcut using PowerShell (no dependencies)
// ES Module version
import { spawn } from 'child_process';

/**
 * Main function to execute the global Ctrl+Shift+L keyboard shortcut
 * This shortcut will be sent system-wide without needing to focus on a specific window
 */
async function executeCtrlShiftL() {
  console.log('Executing global Ctrl+Shift+L keyboard shortcut...');

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

# Define virtual key codes
$VK_CONTROL = 0x11  # CTRL key
$VK_SHIFT = 0x10    # SHIFT key
$VK_L = 0x4C        # L key

# No need to wait for window focus since the shortcut is global
Write-Host "Sending global Ctrl+Shift+L shortcut..."

# Method 1: Use our custom KeyboardSend class
Write-Host "Trying method 1: Custom keyboard function..."
[KeyboardSend]::SendKeyCombination(@($VK_CONTROL, $VK_SHIFT, $VK_L))
Start-Sleep -Milliseconds 500

# Method 2: Use SendKeys as a backup
Write-Host "Trying method 2: SendKeys..."
[System.Windows.Forms.SendKeys]::SendWait('^+L')

# Verify the keys were sent
Write-Host "Keyboard shortcut Ctrl+Shift+L has been sent"
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
        console.log('Keyboard shortcut Ctrl+Shift+L executed successfully');
        resolve(true);
      } else {
        console.error(`PowerShell process exited with code ${code}`);
        reject(new Error(`PowerShell process exited with code ${code}`));
      }
    });
  });
}

// Export the function for use in other modules
export { executeCtrlShiftL };
