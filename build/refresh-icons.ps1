# PowerShell script to refresh Windows icon cache
# This script helps resolve issues where shortcuts show default icons instead of custom icons

Write-Host "Refreshing Windows icon cache..." -ForegroundColor Green

# Method 1: Use SHChangeNotify to refresh shell
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class Shell32 {
    [DllImport("shell32.dll")]
    public static extern void SHChangeNotify(uint wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
    
    public const uint SHCNE_ASSOCCHANGED = 0x08000000;
    public const uint SHCNF_IDLIST = 0x0000;
}
"@

try {
    [Shell32]::SHChangeNotify([Shell32]::SHCNE_ASSOCCHANGED, [Shell32]::SHCNF_IDLIST, [IntPtr]::Zero, [IntPtr]::Zero)
    Write-Host "✓ Shell notification sent" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to send shell notification: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 2: Clear icon cache files
Write-Host "Clearing icon cache files..." -ForegroundColor Yellow

$iconCachePaths = @(
    "$env:LOCALAPPDATA\IconCache.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*.db"
)

foreach ($path in $iconCachePaths) {
    $files = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        try {
            Remove-Item -Path $file.FullName -Force -ErrorAction Stop
            Write-Host "✓ Removed: $($file.Name)" -ForegroundColor Green
        } catch {
            Write-Host "✗ Could not remove: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Method 3: Restart Windows Explorer
Write-Host "Restarting Windows Explorer..." -ForegroundColor Yellow

try {
    # Kill explorer process
    Stop-Process -Name "explorer" -Force -ErrorAction Stop
    Write-Host "✓ Explorer process stopped" -ForegroundColor Green
    
    # Wait a moment
    Start-Sleep -Seconds 2
    
    # Start explorer again
    Start-Process "explorer.exe"
    Write-Host "✓ Explorer process restarted" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to restart Explorer: $($_.Exception.Message)" -ForegroundColor Red
    # Try to start explorer anyway
    try {
        Start-Process "explorer.exe" -ErrorAction SilentlyContinue
    } catch {
        Write-Host "Please manually restart Windows Explorer or reboot your computer." -ForegroundColor Red
    }
}

Write-Host "Icon cache refresh completed!" -ForegroundColor Green
Write-Host "If icons still don't appear correctly, please:" -ForegroundColor Yellow
Write-Host "1. Reboot your computer" -ForegroundColor Yellow
Write-Host "2. Or manually delete shortcuts and reinstall the application" -ForegroundColor Yellow
