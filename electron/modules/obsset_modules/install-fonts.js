/**
 * Font Installation Utility (Skip Existing Version)
 *
 * This script installs fonts using direct Windows API calls through PowerShell.
 * It skips fonts that are already installed to avoid unnecessary reinstallation.
 * Requires administrator privileges to run properly.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

// Check if running on Windows
if (os.platform() !== 'win32') {
  console.error('Error: This script only works on Windows operating systems.');
  process.exit(1);
}

// Check if running as administrator
try {
  execSync('net session >nul 2>&1', { windowsHide: true });
} catch (error) {
  console.error('Error: This script requires administrator privileges.');
  console.error('Please run this script as administrator.');
  process.exit(1);
}

// Get the path argument
const fontPath = process.argv[2];

if (!fontPath) {
  console.error('Error: No path specified.');
  console.log('\nUsage:');
  console.log('  node install-fonts-skip.js <path>');
  console.log('\nWhere <path> is a path to a font file or directory containing font files.');
  process.exit(1);
}

// Check if path exists
if (!fs.existsSync(fontPath)) {
  console.error(`Error: Path not found: ${fontPath}`);
  process.exit(1);
}

// Check if path is a file or directory
const stats = fs.statSync(fontPath);
let fontFiles = [];

if (stats.isFile()) {
  // Check if file is a font file
  const ext = path.extname(fontPath).toLowerCase();
  if (ext !== '.ttf' && ext !== '.otf') {
    console.error(`Error: File is not a supported font type: ${fontPath}`);
    process.exit(1);
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
    console.error(`Error: No font files found in directory: ${fontPath}`);
    process.exit(1);
  }
} else {
  console.error(`Error: Invalid path type: ${fontPath}`);
  process.exit(1);
}

console.log(`Found ${fontFiles.length} font file(s) to process.`);

// Create a PowerShell script to install the fonts
const psScript = `
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

// Save the PowerShell script to a temporary file
const tempScriptPath = path.join(os.tmpdir(), 'install-fonts-skip.ps1');
fs.writeFileSync(tempScriptPath, psScript);

// Run the PowerShell script with administrator privileges
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
    }
  } catch (parseError) {
    // Ignore JSON parsing errors
  }

  // Clean up
  fs.unlinkSync(tempScriptPath);

  console.log('\nFont processing completed.');
} catch (error) {
  console.error(`Error running PowerShell script: ${error.message}`);

  // Clean up
  if (fs.existsSync(tempScriptPath)) {
    fs.unlinkSync(tempScriptPath);
  }

  process.exit(1);
}
