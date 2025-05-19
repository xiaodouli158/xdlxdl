/**
 * Font Installation Utility
 *
 * This module provides functions to install fonts using direct Windows API calls through PowerShell.
 * It skips fonts that are already installed to avoid unnecessary reinstallation.
 * Requires administrator privileges to run properly.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

/**
 * Check if the script is running with administrator privileges
 * @returns {boolean} True if running as administrator, false otherwise
 */
function isRunningAsAdmin() {
  if (os.platform() !== 'win32') {
    return false;
  }

  try {
    execSync('net session >nul 2>&1', { windowsHide: true });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get font files from a path
 * @param {string} fontPath - Path to a font file or directory containing font files
 * @returns {Object} Object containing font files and any errors
 */
function getFontFiles(fontPath) {
  // Check if path exists
  if (!fs.existsSync(fontPath)) {
    return {
      success: false,
      error: `Path not found: ${fontPath}`,
      fontFiles: []
    };
  }

  // Check if path is a file or directory
  const stats = fs.statSync(fontPath);
  let fontFiles = [];

  if (stats.isFile()) {
    // Check if file is a font file
    const ext = path.extname(fontPath).toLowerCase();
    if (ext !== '.ttf' && ext !== '.otf') {
      return {
        success: false,
        error: `File is not a supported font type: ${fontPath}`,
        fontFiles: []
      };
    }
    fontFiles.push(fontPath);
  } else if (stats.isDirectory()) {
    // Get all font files in the directory
    const files = fs.readdirSync(fontPath);
    fontFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.ttf' || ext === '.otf';
      })
      .map(file => path.join(fontPath, file));

    if (fontFiles.length === 0) {
      return {
        success: false,
        error: `No font files found in directory: ${fontPath}`,
        fontFiles: []
      };
    }
  } else {
    return {
      success: false,
      error: `Invalid path type: ${fontPath}`,
      fontFiles: []
    };
  }

  return {
    success: true,
    fontFiles,
    count: fontFiles.length
  };
}

/**
 * Create a PowerShell script to install fonts
 * @param {Array<string>} fontFiles - Array of font file paths
 * @returns {string} PowerShell script
 */
function createPowerShellScript(fontFiles) {
  return `
# Font installation script

# Windows API functions for font installation
$signature = @'
[DllImport("gdi32.dll", CharSet = CharSet.Unicode)]
public static extern int AddFontResource(string lpszFilename);

[DllImport("user32.dll")]
public static extern int SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
'@

Add-Type -MemberDefinition $signature -Name FontUtils -Namespace Win32Utils;

# Constants
$HWND_BROADCAST = [IntPtr]0xffff;
$WM_FONTCHANGE = 0x001D;
$fontsFolder = [System.IO.Path]::Combine($env:windir, "Fonts");

# Function to check if a font is already installed
function Test-FontInstalled {
    param (
        [string]$fontFilename
    )

    # Check if the font file exists in the Windows Fonts folder
    $fontPath = [System.IO.Path]::Combine($fontsFolder, $fontFilename);
    if (!(Test-Path $fontPath)) {
        return $false;
    }

    # Get font name for registry check
    $fontName = [System.IO.Path]::GetFileNameWithoutExtension($fontFilename);
    $fontExt = [System.IO.Path]::GetExtension($fontFilename).ToLower();

    if ($fontExt -eq ".ttf") {
        $fontName = "$fontName (TrueType)";
    } elseif ($fontExt -eq ".otf") {
        $fontName = "$fontName (OpenType)";
    }

    # Check if the font is registered in the registry
    $registryPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts";
    $fontRegistered = Get-ItemProperty -Path $registryPath -Name $fontName -ErrorAction SilentlyContinue;

    return ($fontRegistered -ne $null);
}

# Function to install a font
function Install-Font {
    param (
        [string]$fontPath
    )

    $fontFilename = [System.IO.Path]::GetFileName($fontPath);
    $fontDest = [System.IO.Path]::Combine($fontsFolder, $fontFilename);

    # Check if font is already installed
    if (Test-FontInstalled -fontFilename $fontFilename) {
        Write-Host "Font already installed: $fontFilename" -ForegroundColor Green;
        return $true;
    }

    Write-Host "Installing font: $fontFilename" -ForegroundColor Cyan;

    # Copy the font file
    try {
        Copy-Item -Path $fontPath -Destination $fontDest -Force;

        if (!(Test-Path $fontDest)) {
            Write-Host "  Failed to copy font file to $fontDest" -ForegroundColor Red;
            return $false;
        }

        # Get font name
        $fontName = [System.IO.Path]::GetFileNameWithoutExtension($fontFilename);
        $fontExt = [System.IO.Path]::GetExtension($fontFilename).ToLower();

        if ($fontExt -eq ".ttf") {
            $fontName = "$fontName (TrueType)";
        } elseif ($fontExt -eq ".otf") {
            $fontName = "$fontName (OpenType)";
        }

        # Add to registry
        New-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts" -Name $fontName -PropertyType String -Value $fontFilename -Force | Out-Null;

        # Add font resource
        [Win32Utils.FontUtils]::AddFontResource($fontDest);

        Write-Host "  Font installed successfully" -ForegroundColor Green;
        return $true;
    }
    catch {
        Write-Host "  Error installing font: $_" -ForegroundColor Red;
        return $false;
    }
}

# Process each font
$installedCount = 0;
$skippedCount = 0;
$failedCount = 0;

${fontFiles.map(file => `
$fontFilename = [System.IO.Path]::GetFileName("${file.replace(/\\/g, '\\\\')}");
if (Test-FontInstalled -fontFilename $fontFilename) {
    Write-Host "Font already installed: $fontFilename" -ForegroundColor Green;
    $skippedCount++;
} elseif (Install-Font -fontPath "${file.replace(/\\/g, '\\\\')}") {
    $installedCount++;
} else {
    $failedCount++;
}
`).join('\n')}

# Notify all windows of the font change if any fonts were installed
if ($installedCount -gt 0) {
    [Win32Utils.FontUtils]::SendMessage($HWND_BROADCAST, $WM_FONTCHANGE, [IntPtr]::Zero, [IntPtr]::Zero);
}

# Print summary
Write-Host "";
Write-Host "Font processing complete." -ForegroundColor Cyan;
Write-Host "  Total: ${fontFiles.length}" -ForegroundColor Cyan;
Write-Host "  Installed: $installedCount" -ForegroundColor $(if ($installedCount -gt 0) { "Green" } else { "Cyan" });
Write-Host "  Skipped (already installed): $skippedCount" -ForegroundColor Cyan;
Write-Host "  Failed: $failedCount" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Red" });

# Return success count for the Node.js script
return @{
    Total = ${fontFiles.length};
    Installed = $installedCount;
    Skipped = $skippedCount;
    Failed = $failedCount;
} | ConvertTo-Json;
`;
}

/**
 * Install fonts from a path
 * @param {string} fontPath - Path to a font file or directory containing font files
 * @returns {Promise<Object>} Result of the operation
 */
async function installFonts(fontPath) {
  // Check if running on Windows
  if (os.platform() !== 'win32') {
    return {
      success: false,
      error: 'This function only works on Windows operating systems.'
    };
  }

  // Check if running as administrator
  if (!isRunningAsAdmin()) {
    return {
      success: false,
      error: 'This function requires administrator privileges.'
    };
  }

  // Get font files
  const fontFilesResult = getFontFiles(fontPath);
  if (!fontFilesResult.success) {
    return {
      success: false,
      error: fontFilesResult.error
    };
  }

  const fontFiles = fontFilesResult.fontFiles;
  console.log(`Found ${fontFiles.length} font file(s) to process.`);

  // Create PowerShell script
  const psScript = createPowerShellScript(fontFiles);

  // Save the PowerShell script to a temporary file
  const tempScriptPath = path.join(os.tmpdir(), 'install-fonts-skip.ps1');
  fs.writeFileSync(tempScriptPath, psScript);

  try {
    console.log('Processing fonts...');
    const result = execSync(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`, {
      windowsHide: true,
      encoding: 'utf8'
    });

    console.log(result);

    // Parse the JSON result if available
    try {
      const jsonStartIndex = result.lastIndexOf('{');
      const jsonEndIndex = result.lastIndexOf('}') + 1;
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        const jsonStr = result.substring(jsonStartIndex, jsonEndIndex);
        const stats = JSON.parse(jsonStr);

        console.log('\nFont processing summary:');
        console.log(`  Total fonts: ${stats.Total}`);
        console.log(`  Newly installed: ${stats.Installed}`);
        console.log(`  Skipped (already installed): ${stats.Skipped}`);
        console.log(`  Failed: ${stats.Failed}`);

        // Clean up
        fs.unlinkSync(tempScriptPath);

        return {
          success: true,
          total: stats.Total,
          installed: stats.Installed,
          skipped: stats.Skipped,
          failed: stats.Failed,
          message: 'Font processing completed.'
        };
      }
    } catch (parseError) {
      // Ignore JSON parsing errors
    }

    // Clean up
    fs.unlinkSync(tempScriptPath);

    return {
      success: true,
      message: 'Font processing completed, but could not parse detailed results.'
    };
  } catch (error) {
    console.error(`Error running PowerShell script: ${error.message}`);

    // Clean up
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }

    return {
      success: false,
      error: `Error running PowerShell script: ${error.message}`
    };
  }
}

/**
 * Check if fonts are installed
 * @param {string} fontPath - Path to a font file or directory containing font files
 * @returns {Promise<Object>} Result of the operation
 */
async function checkFontsInstalled(fontPath) {
  // Check if running on Windows
  if (os.platform() !== 'win32') {
    return {
      success: false,
      error: 'This function only works on Windows operating systems.'
    };
  }

  // Get font files
  const fontFilesResult = getFontFiles(fontPath);
  if (!fontFilesResult.success) {
    return {
      success: false,
      error: fontFilesResult.error
    };
  }

  const fontFiles = fontFilesResult.fontFiles;
  console.log(`Found ${fontFiles.length} font file(s) to check.`);

  // Create a simple PowerShell script to check if fonts are installed
  const checkScript = `
$fontsFolder = [System.IO.Path]::Combine($env:windir, "Fonts");
$registryPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts";

function Test-FontInstalled {
    param (
        [string]$fontFilename
    )

    # Check if the font file exists in the Windows Fonts folder
    $fontPath = [System.IO.Path]::Combine($fontsFolder, $fontFilename);
    if (!(Test-Path $fontPath)) {
        return $false;
    }

    # Get font name for registry check
    $fontName = [System.IO.Path]::GetFileNameWithoutExtension($fontFilename);
    $fontExt = [System.IO.Path]::GetExtension($fontFilename).ToLower();

    if ($fontExt -eq ".ttf") {
        $fontName = "$fontName (TrueType)";
    } elseif ($fontExt -eq ".otf") {
        $fontName = "$fontName (OpenType)";
    }

    # Check if the font is registered in the registry
    $fontRegistered = Get-ItemProperty -Path $registryPath -Name $fontName -ErrorAction SilentlyContinue;

    return ($fontRegistered -ne $null);
}

$results = @{
    Total = ${fontFiles.length};
    Installed = 0;
    NotInstalled = 0;
    FontStatus = @{};
}

${fontFiles.map(file => `
$fontFilename = [System.IO.Path]::GetFileName("${file.replace(/\\/g, '\\\\')}");
$isInstalled = Test-FontInstalled -fontFilename $fontFilename;
$results.FontStatus["$fontFilename"] = $isInstalled;
if ($isInstalled) {
    $results.Installed++;
} else {
    $results.NotInstalled++;
}
`).join('\n')}

return $results | ConvertTo-Json;
`;

  // Save the PowerShell script to a temporary file
  const tempScriptPath = path.join(os.tmpdir(), 'check-fonts.ps1');
  fs.writeFileSync(tempScriptPath, checkScript);

  try {
    console.log('Checking fonts...');
    const result = execSync(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`, {
      windowsHide: true,
      encoding: 'utf8'
    });

    // Clean up
    fs.unlinkSync(tempScriptPath);

    try {
      const stats = JSON.parse(result);

      return {
        success: true,
        total: stats.Total,
        installed: stats.Installed,
        notInstalled: stats.NotInstalled,
        fontStatus: stats.FontStatus,
        needsInstall: stats.NotInstalled > 0
      };
    } catch (parseError) {
      return {
        success: false,
        error: `Error parsing PowerShell output: ${parseError.message}`
      };
    }
  } catch (error) {
    console.error(`Error running PowerShell script: ${error.message}`);

    // Clean up
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }

    return {
      success: false,
      error: `Error running PowerShell script: ${error.message}`
    };
  }
}

// Handle command line arguments if script is run directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fontPath = process.argv[2];

  if (!fontPath) {
    console.error('Error: No path specified.');
    console.log('\nUsage:');
    console.log('  node install-fonts.js <path>');
    console.log('\nWhere <path> is a path to a font file or directory containing font files.');
    process.exit(1);
  }

  installFonts(fontPath)
    .then(result => {
      if (!result.success) {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

// Export functions
export {
  installFonts,
  checkFontsInstalled,
  isRunningAsAdmin,
  getFontFiles
};
