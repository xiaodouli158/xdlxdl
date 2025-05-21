/**
 * OBS Configuration Handlers Module
 *
 * This module provides functions to:
 * 1. Check and install fonts required for OBS
 * 2. Configure OBS profiles and scene collections using manage-profile-scene.js
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import os from 'os';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { getSoftwarePath } from '../utils/Findsoftpaths.js';
import {
  ensureAndConnectToOBS,
  closeOBSProcess,
  startOBSProcess,
  getOBSWebSocketInstance
} from './obsWebSocketHandlers.js';

// Import font installation modules
import {
  installFonts as installFontsModule,
  checkFontsInstalled
} from './obsset_modules/install-fonts.js';

// Import OBS configuration modules
import {
  configureOBSWithName,
  manageProfileAndSceneCollection
} from './obsset_modules/manage-profile-scene.js';

import {
  configureSourceTransform
} from './obsset_modules/set-source-position.js';

// Import encoder configuration modules
import {
  configureEncoder
} from './obsset_modules/obsEncoderConfig.js';


// Get current file directory path (ES module __dirname alternative)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert callback functions to Promises
const execAsync = promisify(exec);
const fsExists = promisify(fs.exists);

/**
 * Get application path
 * @returns {string} Application root path
 */
const getAppPath = () => {
  return path.resolve(path.join(__dirname, '..', '..'));
};

/**
 * Get fonts directory path
 * @returns {string} Path to fonts directory
 */
const getFontsPath = () => {
  const appPath = getAppPath();
  return path.join(appPath, 'public', 'fonts');
};

/**
 * Check if OBS is running
 * @returns {Promise<boolean>} True if OBS is running
 */
async function checkIfOBSIsRunning() {
  try {
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq obs64.exe" /NH');
    return stdout.includes('obs64.exe');
  } catch (error) {
    console.error('Error checking if OBS is running:', error);
    return false;
  }
}

/**
 * Check and install fonts
 * @returns {Promise<{success: boolean, needsInstall: boolean, message: string}>} Result of the operation
 */
async function checkAndInstallFonts() {
  try {
    console.log('Checking font installation status...');

    // Check if fonts directory exists
    const fontsPath = getFontsPath();
    console.log('Fonts directory path:', fontsPath);

    const fontsExists = await fsExists(fontsPath);
    if (!fontsExists) {
      console.error('Fonts directory does not exist:', fontsPath);
      return {
        success: false,
        needsInstall: false,
        message: 'Fonts directory does not exist'
      };
    }

    // Check if fonts are installed
    const fontCheckResult = await checkFontsInstalled(fontsPath);

    if (!fontCheckResult.success) {
      console.error('Error checking font installation status:', fontCheckResult.error);
      return {
        success: false,
        needsInstall: false,
        message: 'Error checking font installation status: ' + fontCheckResult.error
      };
    }

    if (fontCheckResult.needsInstall) {
      console.log('Fonts not installed, installation needed');
      return {
        success: true,
        needsInstall: true,
        message: `Fonts need to be installed (Installed: ${fontCheckResult.installed}, Not installed: ${fontCheckResult.notInstalled})`
      };
    } else {
      console.log('All fonts already installed');
      return {
        success: true,
        needsInstall: false,
        message: 'All fonts already installed'
      };
    }
  } catch (error) {
    console.error('Error checking font installation status:', error);
    return {
      success: false,
      needsInstall: false,
      message: 'Error checking font installation status: ' + error.message
    };
  }
}

/**
 * Install fonts
 * @returns {Promise<{success: boolean, message: string, error?: string}>} Result of the operation
 */
async function installFonts() {
  try {
    console.log('Starting font installation...');

    const fontsPath = getFontsPath();
    console.log('Fonts directory path:', fontsPath);

    // Check if OBS is running, if so, need to close it first
    const obsRunning = await checkIfOBSIsRunning();
    if (obsRunning) {
      console.log('OBS is running, need to close it first');
      await closeOBSProcess();
    }

    // Check fonts installation status
    const fontCheckResult = await checkFontsInstalled(fontsPath);

    if (fontCheckResult.success && fontCheckResult.needsInstall) {
      const installResult = await installFontsModule(fontsPath);
      return {
        success: installResult.success,
        message: installResult.message || 'Fonts installed successfully',
        error: installResult.error
      };
    }

    return {
      success: true,
      message: 'Fonts already installed, no need to reinstall'
    };
  } catch (error) {
    console.error('Error installing fonts:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Configure OBS profile and scene collection
 * @param {object} options Configuration options
 * @param {string} options.deviceName Device name to use for profile and scene collection
 * @param {string} options.resolution Resolution in format "widthxheight"
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
async function configureOBSProfile(options) {
  try {
    console.log('Starting OBS profile and scene collection configuration...');
    console.log('Configuration options:', options);

    // Use the configureOBSWithName function from manage-profile-scene.js
    const profileResult = await configureOBSWithName(
      options.deviceName,
      options.resolution
    );

    if (!profileResult.success) {
      console.error('Error configuring OBS profile and scene collection:', profileResult.error);
      return {
        success: false,
        message: 'Error configuring OBS profile and scene collection: ' + profileResult.error
      };
    }

    console.log('OBS profile and scene collection configuration result:', profileResult);

    return {
      success: true,
      message: profileResult.message || 'OBS profile and scene collection configured successfully'
    };
  } catch (error) {
    console.error('Error configuring OBS profile and scene collection:', error);
    return {
      success: false,
      message: 'Error configuring OBS profile and scene collection: ' + error.message
    };
  }
}

/**
 * Configure OBS encoder settings
 * @param {object} options Encoder configuration options
 * @param {string} options.encoderType Type of encoder (x264, nvenc, amf)
 * @param {object} options.settings Encoder specific settings
 * @param {string} options.profileName OBS profile name
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
async function configureOBSEncoder(options) {
  try {
    console.log('Starting OBS encoder configuration...');
    console.log('Configuration options:', options);

    const { encoderType, settings, profileName } = options;

    // Configure encoder based on type
    let result;
    if (encoderType) {
      console.log(`Using encoder type: ${encoderType}`);
      result = await configureEncoder(encoderType, profileName);
    } else {
      console.log('No encoder type specified, using default');
      result = await configureEncoder('obs_x264', profileName);
    }

    return result;
  } catch (error) {
    console.error('Error configuring OBS encoder:', error);
    return {
      success: false,
      message: 'Error configuring OBS encoder: ' + error.message
    };
  }
}



/**
 * One-click OBS configuration
 * @param {object} options Configuration options
 * @param {string} options.deviceName Device name
 * @param {string} options.resolution Resolution in format "widthxheight"
 * @returns {Promise<{success: boolean, message: string, steps: Array}>} Result of the operation
 */
async function oneClickConfigureOBS(options) {
  console.log('Starting one-click OBS configuration...');
  console.log('Configuration options:', options);

  const results = {
    success: true,
    message: 'One-click OBS configuration completed',
    steps: []
  };

  try {
    // Step 1: Check and install fonts
    console.log('Step 1: Check and install fonts');
    const fontCheckResult = await checkAndInstallFonts();

    if (fontCheckResult.needsInstall) {
      console.log('Fonts need to be installed');
      const fontInstallResult = await installFonts();

      results.steps.push({
        name: 'Install fonts',
        success: fontInstallResult.success,
        message: fontInstallResult.message || fontInstallResult.error
      });

      if (!fontInstallResult.success) {
        results.success = false;
        results.message = 'One-click OBS configuration failed: Font installation failed';
        return results;
      }

      // If fonts were installed, need to restart OBS
      console.log('Fonts installed successfully, need to restart OBS');
      await closeOBSProcess();
      await startOBSProcess();

      // Wait for OBS to start
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      results.steps.push({
        name: 'Check fonts',
        success: true,
        message: fontCheckResult.message
      });
    }

    // Step 2: Connect to OBS WebSocket
    console.log('Step 2: Connect to OBS WebSocket');
    const connectResult = await ensureAndConnectToOBS();

    results.steps.push({
      name: 'Connect to OBS',
      success: connectResult.success,
      message: connectResult.message
    });

    if (!connectResult.success) {
      results.success = false;
      results.message = 'One-click OBS configuration failed: Failed to connect to OBS';
      return results;
    }

    // Step 3: Configure OBS profile and scene collection
    console.log('Step 3: Configure OBS profile and scene collection');
    const profileResult = await configureOBSProfile(options);
    if (!profileResult.success) {
      results.success = false;
      results.message = 'One-click OBS configuration failed: Failed to configure OBS profile';
      return results;
    }
    // Step 4: Configure source transform
    const configResult = await configureSourceTransform();

    // 将配置结果添加到 results 对象中，以便后续使用
    results.profileName = configResult.profileName;
    results.Encodername = configResult.Encodername;

    results.steps.push({
      name: 'Configure source transform',
      success: configResult.success,
      message: configResult.message
    });

    if (!configResult.success) {
      results.success = false;
      results.message = 'One-click OBS configuration failed: Failed to configure OBS profile';
      return results;
    }

    // Step 5: Configure OBS encoder
    console.log('Closing OBS process...');
    await closeOBSProcess();

    // 添加2秒延迟，确保OBS进程完全关闭
    console.log('Waiting 2 seconds for OBS process to fully close...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Step 5: Configure OBS encoder');
    console.log(`Using encoder: ${results.Encodername}, profile: ${results.profileName}`);
    const encoderResult = await configureEncoder(results.Encodername, results.profileName);

    console.log('Starting OBS process...');
    await startOBSProcess();

    // 添加额外延迟，确保OBS进程完全启动
    console.log('Waiting 2 seconds for OBS process to fully start...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    results.steps.push({
      success: encoderResult.success,
      message: encoderResult.message
    });

    console.log('One-click OBS configuration completed successfully');
    return results;
  } catch (error) {
    console.error('Error during one-click OBS configuration:', error);

    results.success = false;
    results.message = 'One-click OBS configuration failed: ' + error.message;

    results.steps.push({
      name: 'Error',
      success: false,
      message: error.message
    });

    return results;
  }
}

/**
 * Register OBS configuration related IPC handlers
 * @param {Electron.IpcMain} ipcMain Electron's IPC main process object
 */
function registerOBSConfigHandlers(ipcMain) {
  console.log('Registering OBS configuration related IPC handlers...');

  // Check and install fonts
  ipcMain.handle('check-install-fonts', async () => {
    try {
      return await checkAndInstallFonts();
    } catch (error) {
      console.error('Failed to check and install fonts:', error);
      return {
        needsInstall: false,
        message: 'Failed to check and install fonts: ' + error.message
      };
    }
  });

  // Install fonts
  ipcMain.handle('install-fonts', async () => {
    try {
      return await installFonts();
    } catch (error) {
      console.error('Failed to install fonts:', error);
      return {
        success: false,
        error: 'Failed to install fonts: ' + error.message
      };
    }
  });

  // Configure OBS profile
  ipcMain.handle('configure-obs-profile', async (_, options) => {
    try {
      return await configureOBSProfile(options);
    } catch (error) {
      console.error('Failed to configure OBS profile:', error);
      return {
        success: false,
        message: 'Failed to configure OBS profile: ' + error.message
      };
    }
  });

  // One-click configure OBS
  ipcMain.handle('one-click-configure-obs', async (_, options) => {
    try {
      return await oneClickConfigureOBS(options);
    } catch (error) {
      console.error('Failed to one-click configure OBS:', error);
      return {
        success: false,
        message: 'Failed to one-click configure OBS: ' + error.message,
        steps: [{
          name: 'Error',
          success: false,
          message: error.message
        }]
      };
    }
  });

  // Configure OBS encoder
  ipcMain.handle('configure-obs-encoder', async (_, options) => {
    try {
      return await configureOBSEncoder(options);
    } catch (error) {
      console.error('Failed to configure OBS encoder:', error);
      return {
        success: false,
        message: 'Failed to configure OBS encoder: ' + error.message
      };
    }
  });
}

// Export functions
export {
  registerOBSConfigHandlers,
  checkAndInstallFonts,
  installFonts,
  configureOBSProfile,
  configureOBSEncoder,
  oneClickConfigureOBS
};