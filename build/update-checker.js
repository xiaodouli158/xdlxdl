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
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// No need for __dirname or __filename in ES modules

// Configuration
const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60 * 6; // Check every 6 hours
// Configuration for Cloudflare R2
const R2_ACCOUNT_ID = '84794ee73142290fa69ac64ae8fc7bee';
const R2_ACCESS_KEY_ID = '50ff0db943697b84c9386513d45fabb9';
const R2_SECRET_ACCESS_KEY = '3a33b9b6f3d8bcc1a05aea230d447af20db97f3cbe3776f1aecfbd8c39ccf579';
const R2_BUCKET_NAME = 'xiaodouliupdates';

// Initialize S3 client for R2
const s3Client = new S3Client({
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  },
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

// Show update dialog (now just logs the update info and returns true to download)
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

  // 不显示对话框，直接记录日志并返回true表示应该下载更新
  console.log(`发现新版本 ${versionInfo.version}，当前版本 ${currentVersion}，正在自动下载更新...`);

  // 直接返回true表示应该下载更新
  return true;
}

// Show download progress dialog
function showProgressDialog(versionInfo) {
  const progressWindow = new BrowserWindow({
    width: 500,
    height: 320,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false, // 移除标准窗口框架（包括标题栏和菜单栏）
    titleBarStyle: 'hidden',
    title: '下载更新',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false
  });

  // Create a more detailed HTML content for the progress window with improved UI
  const progressHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>下载更新</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
        }

        body {
          padding: 0;
          user-select: none;
          background-color: #ffffff;
          color: #333;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .title-bar {
          background-color: #f8f8f8;
          padding: 12px 15px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #e0e0e0;
        }

        .title-icon {
          width: 24px;
          height: 24px;
          background-color: #0078d7;
          border-radius: 50%;
          margin-right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }

        .title-text {
          font-size: 16px;
          font-weight: 500;
        }

        .content {
          padding: 20px;
        }

        .header {
          margin-bottom: 20px;
        }

        .title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #0078d7;
        }

        .subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }

        .progress-container {
          margin: 20px 0;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .progress-label {
          font-size: 14px;
          color: #333;
        }

        .progress-percent {
          font-size: 14px;
          font-weight: bold;
          color: #0078d7;
        }

        progress {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          background-color: #f0f0f0;
        }

        progress::-webkit-progress-bar {
          background-color: #f0f0f0;
          border-radius: 4px;
        }

        progress::-webkit-progress-value {
          background: linear-gradient(to right, #0078d7, #00a1ff);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .download-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          font-size: 14px;
        }

        .status {
          color: #555;
        }

        .speed {
          color: #0078d7;
          font-weight: 500;
        }

        .buttons-container {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 25px;
        }

        .button {
          padding: 8px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .button:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }

        .button:active {
          transform: translateY(1px);
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .primary-button {
          background-color: #0078d7;
          color: white;
        }

        .secondary-button {
          background-color: #f0f0f0;
          color: #333;
        }

        .button-icon {
          margin-right: 6px;
          font-size: 16px;
        }

        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #888;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="title-bar">
        <div class="title-icon">↓</div>
        <div class="title-text">下载更新</div>
      </div>

      <div class="content">
        <div class="header">
          <div class="title">正在下载 ${versionInfo.productName} ${versionInfo.version}</div>
          <div class="subtitle">新版本将在下载完成后自动安装</div>
        </div>

        <div class="progress-container">
          <div class="progress-header">
            <span class="progress-label">下载进度</span>
            <span class="progress-percent" id="progress-percent">0%</span>
          </div>
          <progress id="progress" value="0" max="100"></progress>

          <div class="download-info">
            <div class="status" id="status">准备下载...</div>
            <div class="speed" id="speed"></div>
          </div>
        </div>

        <div class="buttons-container">
          <button class="button secondary-button" id="manual-download">
            <span class="button-icon">📥</span>手动下载
          </button>
          <button class="button primary-button" id="visit-website">
            <span class="button-icon">🌐</span>访问官网
          </button>
        </div>

        <div class="footer">
          如果下载失败，您可以点击上方按钮手动下载或访问官方网站
        </div>
      </div>

      <script>
        // Update progress function
        window.updateProgress = function(percent, status) {
          // Update progress bar
          document.getElementById('progress').value = percent;

          // Update percentage display
          document.getElementById('progress-percent').textContent = percent + '%';

          if (status) {
            // Extract speed information if present
            const parts = status.split(' - ');
            if (parts.length > 1) {
              document.getElementById('status').textContent = parts[0];
              document.getElementById('speed').textContent = parts[1];
            } else {
              document.getElementById('status').textContent = status;
              document.getElementById('speed').textContent = '';
            }
          }
        };

        // Button event listeners
        document.getElementById('manual-download').addEventListener('click', function() {
          window.electron.manualDownload();
        });

        document.getElementById('visit-website').addEventListener('click', function() {
          window.electron.visitWebsite();
        });
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

  // 设置窗口始终置顶
  progressWindow.setAlwaysOnTop(true);

  // 禁用窗口关闭按钮
  progressWindow.on('close', (event) => {
    // 阻止窗口关闭
    event.preventDefault();
  });

  // 在渲染进程中暴露访问官网和手动下载的功能
  progressWindow.webContents.on('did-finish-load', () => {
    progressWindow.webContents.executeJavaScript(`
      window.electron = {
        manualDownload: function() {
          const event = new CustomEvent('manual-download-requested');
          document.dispatchEvent(event);
        },
        visitWebsite: function() {
          const event = new CustomEvent('visit-website-requested');
          document.dispatchEvent(event);
        }
      };
    `);
  });

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

  // 生成预签名下载URL（在外部定义，以便在事件处理程序中使用）
  let downloadUrl;
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName
    });

    downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // 添加手动下载按钮事件监听
    progressWindow.webContents.executeJavaScript(`
      document.addEventListener('manual-download-requested', function() {
        console.log('手动下载请求');
        require('electron').shell.openExternal('${downloadUrl}');
      });
    `);

    // 添加访问官网按钮事件监听
    progressWindow.webContents.executeJavaScript(`
      document.addEventListener('visit-website-requested', function() {
        console.log('访问官网请求');
        require('electron').shell.openExternal('https://www.xdlwebcast.com');
      });
    `);

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

    // Variables for speed calculation
    let lastUpdateTime = Date.now();
    let lastDownloadedSize = 0;
    let currentSpeed = 0; // Speed in bytes per second

    // Setup progress tracking
    const updateProgress = (chunk) => {
      downloadedSize += chunk.length;
      const percent = totalSize ? Math.round((downloadedSize / totalSize) * 100) : 0;
      const downloaded = (downloadedSize / 1048576).toFixed(2); // Convert to MB
      const total = (totalSize / 1048576).toFixed(2); // Convert to MB

      // Calculate download speed
      const now = Date.now();
      const timeDiff = now - lastUpdateTime; // Time difference in milliseconds

      // Update speed every 500ms for smoother display
      if (timeDiff >= 500) {
        const bytesDownloadedSinceLastUpdate = downloadedSize - lastDownloadedSize;
        currentSpeed = (bytesDownloadedSinceLastUpdate / timeDiff) * 1000; // Bytes per second

        // Reset for next calculation
        lastUpdateTime = now;
        lastDownloadedSize = downloadedSize;
      }

      // Format speed for display - always in KB/s as requested
      const speedInKB = currentSpeed / 1024;
      const speedText = `${speedInKB.toFixed(1)} KB/s`;

      // Update progress in the UI
      progressWindow.webContents.executeJavaScript(
        `updateProgress(${percent}, "已下载 ${downloaded} MB / ${total} MB - ${speedText}")`
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

    // 不关闭进度窗口，而是更新状态信息
    if (!progressWindow.isDestroyed()) {
      // 更新进度窗口状态，显示下载失败信息
      progressWindow.webContents.executeJavaScript(`
        document.getElementById('status').textContent = '下载失败，请使用下方按钮手动下载或访问官网';
        document.getElementById('status').style.color = '#e74c3c';
        document.getElementById('speed').textContent = '';

        // 突出显示按钮
        document.getElementById('manual-download').style.animation = 'pulse 1.5s infinite';
        document.getElementById('manual-download').style.backgroundColor = '#4caf50';
        document.getElementById('manual-download').style.color = 'white';

        // 添加脉动动画
        const style = document.createElement('style');
        style.textContent = \`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        \`;
        document.head.appendChild(style);
      `);

      // 确保手动下载按钮使用正确的URL
      progressWindow.webContents.executeJavaScript(`
        document.addEventListener('manual-download-requested', function() {
          console.log('手动下载请求（下载失败后）');
          require('electron').shell.openExternal('${downloadUrl}');
        });
      `);
    }

    console.error('下载更新失败，等待用户手动操作');

    // 添加一个关闭按钮，允许用户关闭更新窗口并继续使用应用程序
    progressWindow.webContents.executeJavaScript(`
      // 添加关闭按钮
      if (!document.getElementById('close-button')) {
        const buttonsContainer = document.querySelector('.buttons-container');
        const closeButton = document.createElement('button');
        closeButton.id = 'close-button';
        closeButton.className = 'button secondary-button';
        closeButton.innerHTML = '<span class="button-icon">✖</span>关闭';
        closeButton.style.backgroundColor = '#e74c3c';
        closeButton.style.color = 'white';
        buttonsContainer.appendChild(closeButton);

        // 添加关闭按钮的事件监听
        closeButton.addEventListener('click', function() {
          const event = new CustomEvent('close-window-requested');
          document.dispatchEvent(event);
        });
      }
    `);

    // 添加关闭窗口的事件监听
    progressWindow.webContents.executeJavaScript(`
      document.addEventListener('close-window-requested', function() {
        console.log('用户请求关闭更新窗口');
        require('electron').ipcRenderer.send('close-update-window');
      });
    `);

    // 监听来自渲染进程的关闭窗口请求
    const { ipcMain } = require('electron');
    ipcMain.once('close-update-window', () => {
      console.log('关闭更新窗口，重新启用主窗口');
      if (!progressWindow.isDestroyed()) {
        progressWindow.destroy(); // 强制关闭窗口
      }
      enableMainWindow(); // 重新启用主窗口
    });

    // 返回一个Promise，但允许用户通过关闭按钮来中断更新过程
    return new Promise(() => {
      // 这个Promise永远不会解决
      // 我们通过ipcMain事件来处理用户关闭窗口的请求
    });
  }
}

// Automatically install update without showing prompt
async function showInstallPrompt(filePath) {
  console.log('更新已下载完成，正在自动安装...');

  try {
    // Open the installer
    await shell.openPath(filePath);

    // Exit the app after a short delay to allow the installer to start
    setTimeout(() => {
      console.log('正在退出应用以完成更新安装...');
      app.exit(0);
    }, 1000);
  } catch (error) {
    console.error('启动安装程序时出错:', error);

    // 如果自动安装失败，显示一个错误对话框
    await dialog.showMessageBox({
      type: 'error',
      title: '安装更新失败',
      message: '无法自动安装更新',
      detail: `启动安装程序时出错: ${error.message}\n\n请手动运行安装程序: ${filePath}`,
      buttons: ['确定']
    });
  }
}

// 获取主窗口的引用
function getMainWindow() {
  const allWindows = BrowserWindow.getAllWindows();
  // 主窗口通常是第一个创建的窗口，但为了安全起见，我们排除掉明确是更新窗口的窗口
  return allWindows.find(win =>
    win.title !== '下载更新' &&
    !win.isDestroyed() &&
    win.webContents &&
    !win.webContents.isDestroyed()
  );
}

// 禁用主窗口交互
function disableMainWindow() {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    console.log('禁用主窗口交互');
    // 设置窗口为不可交互
    mainWindow.setEnabled(false);
    // 可选：添加一个覆盖层表明窗口被禁用
    mainWindow.webContents.executeJavaScript(`
      if (!document.getElementById('update-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'update-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = 'white';
        overlay.style.fontSize = '18px';
        overlay.style.fontWeight = 'bold';
        overlay.innerHTML = '<div>正在更新软件，请稍候...</div>';
        document.body.appendChild(overlay);
      }
    `).catch(err => console.error('添加覆盖层失败:', err));
  }
}

// 启用主窗口交互
function enableMainWindow() {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    console.log('启用主窗口交互');
    // 重新启用窗口交互
    mainWindow.setEnabled(true);
    // 移除覆盖层
    mainWindow.webContents.executeJavaScript(`
      const overlay = document.getElementById('update-overlay');
      if (overlay) {
        overlay.parentNode.removeChild(overlay);
      }
    `).catch(err => console.error('移除覆盖层失败:', err));
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

    // Get the latest.yml object from the bucket
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: 'latest.yml'
    });

    const response = await s3Client.send(command);
    if (!response || !response.Body) {
      throw new Error('Failed to fetch version info: No data returned');
    }

    // Convert the readable stream to a string
    const bodyContents = await response.Body.transformToString();

    // Parse the JSON content
    const versionInfo = JSON.parse(bodyContents);

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

      // 禁用主窗口交互
      disableMainWindow();

      // 不显示对话框，直接下载更新
      // 由于我们已经修改了showUpdateDialog函数，它现在总是返回true
      const shouldDownload = await showUpdateDialog(versionInfo);

      if (shouldDownload) {
        try {
          // 下载更新
          await downloadUpdate(versionInfo);
          // 下载成功后，主窗口会关闭，所以不需要重新启用
        } catch (error) {
          // 如果下载失败，重新启用主窗口
          console.error('下载更新失败，重新启用主窗口:', error);
          enableMainWindow();
          throw error; // 重新抛出错误，让外层错误处理来处理
        }
      } else {
        // 如果用户取消下载，重新启用主窗口
        enableMainWindow();
      }
    } else {
      console.log('No new version available');
      // 不显示任何对话框，直接继续使用应用程序
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
    console.error('Error details:', error.message);

    // 确保在出错时重新启用主窗口
    enableMainWindow();

    // 不显示错误对话框，只记录错误
    // 应用程序将继续正常运行
  }
}

// Initialize update checker
export function initUpdateChecker() {
  // Check for updates immediately on startup with force=true to show dialog
  console.log('Initializing update checker - checking for updates immediately with force=true');

  // Small delay to allow app to finish loading, but force the check
  setTimeout(() => checkForUpdates(true), 3000);

  // Set up periodic update checks
  setInterval(() => checkForUpdates(true), UPDATE_CHECK_INTERVAL);

  // Log when periodic checks are scheduled
  console.log(`Scheduled periodic update checks every ${UPDATE_CHECK_INTERVAL / (1000 * 60 * 60)} hours (forced checks)`);
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

      // Create S3 client command
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: 'latest.yml'
      });

      // Get latest version info
      const response = await s3Client.send(command);
      if (!response || !response.Body) {
        throw new Error('Failed to fetch version info: No data returned');
      }

      // Convert the readable stream to a string
      const bodyContents = await response.Body.transformToString();

      // Parse the JSON content
      const versionInfo = JSON.parse(bodyContents);
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
