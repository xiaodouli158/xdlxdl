/**
 * Update Checker Module
 *
 * This module checks for software updates from Cloudflare R2.
 *
 * It can be used in two ways:
 * 1. As a module imported by the main process to check for updates
 * 2. As a standalone script to manually check for updates (node build/update-checker.js)
 */

import { app, dialog, BrowserWindow } from 'electron';
import fetch from 'node-fetch';
import { shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import S3 from 'aws-sdk/clients/s3.js';

// No need for __dirname or __filename in ES modules

// Configuration
const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60 * 24; // Check once per day
// Configuration for Cloudflare R2
const R2_ACCOUNT_ID = '84794ee73142290fa69ac64ae8fc7bee';
const R2_ACCESS_KEY_ID = '50ff0db943697b84c9386513d45fabb9';
const R2_SECRET_ACCESS_KEY = '3a33b9b6f3d8bcc1a05aea230d447af20db97f3cbe3776f1aecfbd8c39ccf579';
const R2_BUCKET_NAME = 'xiaodouliupdates';

// Initialize S3 client for R2
const s3Client = new S3({
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'auto' // R2 uses 'auto' as the region
});



// Last check timestamp storage
let lastUpdateCheck = 0;
const updateConfigPath = path.join(app.getPath('userData'), 'update-config.json');
const downloadsPath = path.join(app.getPath('downloads'));

// Load last check time
function loadUpdateConfig() {
  try {
    if (fs.existsSync(updateConfigPath)) {
      const config = JSON.parse(fs.readFileSync(updateConfigPath, 'utf8'));
      lastUpdateCheck = config.lastUpdateCheck || 0;
    }
  } catch (error) {
    console.error('Error loading update config:', error);
  }
}

// Save last check time
function saveUpdateConfig() {
  try {
    const config = { lastUpdateCheck };
    fs.writeFileSync(updateConfigPath, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving update config:', error);
  }
}

// Compare versions (simple semver comparison)
function isNewerVersion(current, latest) {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) {
      return true;
    } else if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
}

// Show update dialog
async function showUpdateDialog(versionInfo) {
  // 从package.json获取软件的实际版本和产品名称
  let currentVersion = '2.0.0'; // Default version
  let productName = "Webcast Mate"; // Default product name

  try {
    // Try to get version from app
    currentVersion = app.getVersion();
    console.log(`Got version from app.getVersion(): ${currentVersion}`);
  } catch (error) {
    console.error('Error getting version from app:', error);

    try {
      // Fallback: try to read package.json directly
      const packageJsonPath = path.join(process.resourcesPath, 'app.asar', 'package.json');
      console.log(`Trying to read package.json from: ${packageJsonPath}`);

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        currentVersion = packageJson.version || currentVersion;
        productName = packageJson.build?.productName || productName;
        console.log(`Got version from package.json: ${currentVersion}`);
      } else {
        console.log('package.json not found, using default values');
      }
    } catch (packageError) {
      console.error('Error reading package.json:', packageError);
    }
  }

  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: `${productName} 更新可用`,
    message: `新版本 ${versionInfo.version} 已可用`,
    detail: `您当前的版本是 ${currentVersion}。\n\n是否要下载新版本？`,
    buttons: ['下载', '稍后'],
    defaultId: 0,
    cancelId: 1
  });

  return response === 0;
}

// Show download progress dialog
function showProgressDialog(versionInfo) {
  const progressWindow = new BrowserWindow({
    width: 400,
    height: 150,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: '下载更新',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false
  });

  // Create a simple HTML content for the progress window
  const progressHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>下载更新</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          user-select: none;
        }
        .progress-container {
          margin-top: 15px;
        }
        progress {
          width: 100%;
          height: 20px;
        }
        .status {
          margin-top: 10px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <h3>正在下载 ${versionInfo.productName} ${versionInfo.version}</h3>
      <div class="progress-container">
        <progress id="progress" value="0" max="100"></progress>
      </div>
      <div class="status" id="status">准备下载...</div>
      <script>
        // This will be called from the main process
        window.updateProgress = function(percent, status) {
          document.getElementById('progress').value = percent;
          if (status) {
            document.getElementById('status').textContent = status;
          }
        };
      </script>
    </body>
    </html>
  `;

  // Save the HTML to a temporary file
  const tempHtmlPath = path.join(app.getPath('temp'), 'update-progress.html');
  fs.writeFileSync(tempHtmlPath, progressHtml);

  // Load the HTML file
  progressWindow.loadFile(tempHtmlPath);

  // 增加最大监听器数量，避免 MaxListenersExceededWarning
  progressWindow.webContents.setMaxListeners(30);

  // Show window when ready
  progressWindow.once('ready-to-show', () => {
    progressWindow.show();
  });

  return progressWindow;
}

// Download the update file
async function downloadUpdate(versionInfo) {
  const fileName = versionInfo.fileName;
  const filePath = path.join(downloadsPath, fileName);

  console.log(`Preparing to download update: ${fileName}`);
  console.log(`Saving to: ${filePath}`);

  // Create progress window
  const progressWindow = showProgressDialog(versionInfo);

  try {
    // Generate a presigned URL for the file in the R2 bucket
    const params = {
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Expires: 3600 // URL expires in 1 hour
    };

    const downloadUrl = await s3Client.getSignedUrlPromise('getObject', params);
    console.log(`Generated download URL: ${downloadUrl}`);

    // Start the download
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Failed to download update: ${response.status} ${response.statusText}`);
    }

    // Get the total size for progress calculation
    const totalSize = parseInt(response.headers.get('content-length') || '0', 10);
    let downloadedSize = 0;

    // Create write stream
    const fileStream = createWriteStream(filePath);

    // Setup progress tracking
    const updateProgress = (chunk) => {
      downloadedSize += chunk.length;
      const percent = totalSize ? Math.round((downloadedSize / totalSize) * 100) : 0;
      const downloaded = (downloadedSize / 1048576).toFixed(2); // Convert to MB
      const total = (totalSize / 1048576).toFixed(2); // Convert to MB

      // Update progress in the UI
      progressWindow.webContents.executeJavaScript(
        `updateProgress(${percent}, "已下载 ${downloaded} MB / ${total} MB")`
      ).catch(err => console.error('Error updating progress:', err));
    };

    // Process the download stream
    response.body.on('data', updateProgress);

    try {
      // Use pipeline to handle the download
      await pipeline(response.body, fileStream);

      // 确保文件流已关闭
      fileStream.end();

      // 验证文件是否已成功下载
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        console.log(`Update file successfully downloaded to: ${filePath}`);

        // Close the progress window
        if (!progressWindow.isDestroyed()) {
          progressWindow.close();
        }

        // Show installation prompt
        await showInstallPrompt(filePath);
        return true;
      } else {
        throw new Error('Downloaded file is empty or does not exist');
      }
    } catch (pipelineError) {
      console.error('Pipeline error:', pipelineError);
      throw pipelineError;
    }
  } catch (error) {
    console.error('Download error:', error);

    // 尝试关闭文件流（如果存在）
    if (fileStream && typeof fileStream.close === 'function') {
      try {
        fileStream.close();
      } catch (closeError) {
        console.error('Error closing file stream:', closeError);
      }
    }

    // 尝试删除不完整的下载文件
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Removed incomplete download file: ${filePath}`);
      } catch (unlinkError) {
        console.error('Error removing incomplete download file:', unlinkError);
      }
    }

    // Close the progress window if it's still open
    if (!progressWindow.isDestroyed()) {
      progressWindow.close();
    }

    // 准备详细的错误信息
    let errorDetail = `无法下载更新: ${error.message}`;
    if (error.cause) {
      errorDetail += `\n\n原因: ${error.cause}`;
    }

    // 添加网络连接提示
    errorDetail += '\n\n请检查您的网络连接并重试。';

    // Show error dialog
    await dialog.showMessageBox({
      type: 'error',
      title: '下载失败',
      message: '更新下载失败',
      detail: errorDetail,
      buttons: ['确定']
    });

    return false;
  }
}

// Show installation prompt
async function showInstallPrompt(filePath) {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: '安装更新',
    message: '更新已下载完成',
    detail: '更新已下载完成，是否立即安装？\n\n安装过程中应用将会关闭。',
    buttons: ['立即安装', '稍后安装'],
    defaultId: 0,
    cancelId: 1
  });

  if (response === 0) {
    // Open the installer
    await shell.openPath(filePath);

    // Exit the app after a short delay to allow the installer to start
    setTimeout(() => {
      app.exit(0);
    }, 1000);
  }
}

// Check for updates
export async function checkForUpdates(force = false) {
  console.log(`Starting update check. Force update: ${force}`);

  // Load config first
  loadUpdateConfig();

  // Check if we should check for updates
  const now = Date.now();
  if (!force && lastUpdateCheck && now - lastUpdateCheck < UPDATE_CHECK_INTERVAL) {
    console.log('Skipping update check - checked recently');
    return;
  }

  console.log('Proceeding with update check...');

  // Update last check time
  lastUpdateCheck = now;
  saveUpdateConfig();

  // Check if R2 account ID is configured
  if (!R2_ACCOUNT_ID) {
    console.log('Skipping update check - R2_ACCOUNT_ID not configured');
    return;
  }

  try {
    // Fetch latest version info using S3 client
    console.log(`Checking for updates from R2 bucket: ${R2_BUCKET_NAME}`);

    // Get the latest-version.json object from the bucket
    const params = {
      Bucket: R2_BUCKET_NAME,
      Key: 'latest-version.json'
    };

    const data = await s3Client.getObject(params).promise();
    if (!data || !data.Body) {
      throw new Error('Failed to fetch version info: No data returned');
    }

    // Parse the JSON content
    const versionInfo = JSON.parse(data.Body.toString('utf-8'));

    // 从package.json获取软件的实际版本
    let currentVersion = '2.0.0'; // Default version
    let productName = "Webcast Mate"; // Default product name

    try {
      // Try to get version from app
      currentVersion = app.getVersion();
      console.log(`Got version from app.getVersion(): ${currentVersion}`);
    } catch (error) {
      console.error('Error getting version from app:', error);

      try {
        // Fallback: try to read package.json directly
        const packageJsonPath = path.join(process.resourcesPath, 'app.asar', 'package.json');
        console.log(`Trying to read package.json from: ${packageJsonPath}`);

        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          currentVersion = packageJson.version || currentVersion;
          productName = packageJson.build?.productName || productName;
          console.log(`Got version from package.json: ${currentVersion}`);
        } else {
          console.log('package.json not found, using default values');
        }
      } catch (packageError) {
        console.error('Error reading package.json:', packageError);
      }
    }

    console.log(`Current version: ${currentVersion}, Latest version: ${versionInfo.version}`);

    if (isNewerVersion(currentVersion, versionInfo.version)) {
      console.log('New version available');
      const shouldDownload = await showUpdateDialog(versionInfo);

      if (shouldDownload) {
        // Download the update
        await downloadUpdate(versionInfo);
      }
    } else {
      console.log('No new version available');
      // 只在强制检查时显示"已是最新版本"对话框
      if (force) {
        await dialog.showMessageBox({
          type: 'info',
          title: `${productName} 检查更新`,
          message: '已是最新版本',
          detail: `当前版本 ${currentVersion} 已是最新版本。`,
          buttons: ['确定']
        });
      }
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
    console.error('Error details:', error.message);

    // 只在强制检查时显示错误对话框
    if (force) {
      await dialog.showMessageBox({
        type: 'error',
        title: `${productName} 检查更新失败`,
        message: '无法检查更新',
        detail: `检查更新时出错: ${error.message}\n\n请检查网络连接后重试。`,
        buttons: ['确定']
      });
    }
  }
}

// Initialize update checker
export function initUpdateChecker() {
  // Check for updates on startup (with a delay)
  setTimeout(() => checkForUpdates(true), 10000);

  // Set up periodic update checks
  setInterval(() => checkForUpdates(), UPDATE_CHECK_INTERVAL);
}

// CLI functionality for manual checks
// This code will only run if this file is executed directly (node build/update-checker.js)
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check if Electron app is available
  if (typeof app === 'undefined') {
    console.error('This script must be run in an Electron context for interactive dialogs.');
    console.log('Running in CLI mode with limited functionality...');

    // Simple CLI version that just checks the version without UI
    try {
      // Load fs and path modules if not in Electron context
      const fs = await import('fs');
      const path = await import('path');

      // Get package.json path relative to this file
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const packageJsonPath = path.join(__dirname, '..', 'package.json');

      // Default version in case we can't read the file
      let currentVersion = '2.0.0';

      try {
        // Read package.json
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          currentVersion = packageJson.version || currentVersion;
        } else {
          console.log(`package.json not found at ${packageJsonPath}, using default version`);
        }
      } catch (error) {
        console.error('Error reading package.json:', error);
        console.log('Using default version:', currentVersion);
      }

      console.log(`Current version: ${currentVersion}`);
      console.log('Checking for updates...');

      // Create S3 client
      const params = {
        Bucket: R2_BUCKET_NAME,
        Key: 'latest-version.json'
      };

      // Get latest version info
      const data = await s3Client.getObject(params).promise();
      if (!data || !data.Body) {
        throw new Error('Failed to fetch version info: No data returned');
      }

      // Parse the JSON content
      const versionInfo = JSON.parse(data.Body.toString('utf-8'));
      console.log(`Latest version: ${versionInfo.version}`);

      // Compare versions
      if (isNewerVersion(currentVersion, versionInfo.version)) {
        console.log('A new version is available!');
        console.log(`Download URL: ${versionInfo.downloadUrl}`);
      } else {
        console.log('You have the latest version.');
      }

      process.exit(0);
    } catch (error) {
      console.error('Error checking for updates:', error);
      process.exit(1);
    }
  } else {
    // Run the update check with force=true in Electron context
    checkForUpdates(true)
      .then(() => {
        console.log('Update check completed');
        setTimeout(() => {
          process.exit(0);
        }, 5000); // Give some time for dialogs to be shown
      })
      .catch(error => {
        console.error('Error checking for updates:', error);
        process.exit(1);
      });
  }
}
