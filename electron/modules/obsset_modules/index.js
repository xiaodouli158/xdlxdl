/**
 * OBS Configuration Modules
 *
 * This module exports all the functions from the OBS configuration modules.
 * It provides a unified interface for configuring OBS.
 */

// Import shared OBS WebSocket client
import {
  getOBSWebSocketClient,
  connectToOBS,
  disconnectFromOBS
} from './obsWebSocketClient.js';

// Import all modules
import {
  manageProfileAndSceneCollection,
  configureOBSWithName,
  calculateDimensions
} from './manage-profile-scene.js';

import {
  enableAudioSources,
  enableDefaultAudioSources,
  DEFAULT_AUDIO_SOURCES
} from './enable-audio-sources.js';

import {
  manageVideoCaptureDevice,
  addDefaultVideoCaptureDevice,
  getVideoCaptureInputKind,
  getBasicSystemInfo,
  identifyCaptureCard,
  DEFAULT_SOURCE_NAME
} from './video-capture-device.js';

import {
  installFonts,
  checkFontsInstalled,
  isRunningAsAdmin,
  getFontFiles
} from './install-fonts.js';

// Default connection parameters
const DEFAULT_CONNECTION_PARAMS = {
  address: 'ws://localhost:4455',
  password: 'OwuWIvIyVGFwcL01'
};

/**
 * Configure OBS with a single function call
 * @param {Object} options - Configuration options
 * @param {string} options.profileName - Profile name
 * @param {string} options.resolution - Resolution in format "widthxheight"
 * @param {string} options.fontsPath - Path to fonts directory
 * @param {Object} options.connectionParams - Connection parameters
 * @returns {Promise<Object>} Result of the operation
 */
async function configureOBS(options = {}) {
  const {
    profileName = 'Default',
    resolution = '1920x1080',
    fontsPath,
    connectionParams = DEFAULT_CONNECTION_PARAMS
  } = options;

  const results = {
    success: true,
    steps: []
  };

  // Step 1: Check and install fonts if needed
  if (fontsPath) {
    console.log('Step 1: Checking fonts...');
    const fontCheckResult = await checkFontsInstalled(fontsPath);

    if (fontCheckResult.success && fontCheckResult.needsInstall) {
      console.log('Installing missing fonts...');
      const fontInstallResult = await installFonts(fontsPath);
      results.steps.push({
        name: 'fonts',
        success: fontInstallResult.success,
        message: fontInstallResult.success ? 'Fonts installed successfully' : fontInstallResult.error
      });

      if (!fontInstallResult.success) {
        results.success = false;
      }
    } else {
      results.steps.push({
        name: 'fonts',
        success: true,
        message: 'All fonts already installed'
      });
    }
  }

  // Step 2: Get or connect to OBS WebSocket
  console.log('Step 2: Getting OBS WebSocket client...');

  // Get the shared OBS WebSocket client
  const obs = getOBSWebSocketClient();

  // Check if already connected
  let connectResult;
  if (obs.identified) {
    console.log('Already connected to OBS WebSocket');
    connectResult = {
      success: true,
      message: 'Already connected to OBS WebSocket'
    };
  } else {
    // Connect to OBS WebSocket
    console.log('Connecting to OBS WebSocket...');
    connectResult = await connectToOBS(connectionParams);
  }

  results.steps.push({
    name: 'connect',
    success: connectResult.success,
    message: connectResult.success ? 'Connected to OBS WebSocket successfully' : connectResult.error
  });

  if (!connectResult.success) {
    results.success = false;
    return results;
  }

  // Step 3: Configure profile and scene collection
  console.log('Step 3: Configuring profile and scene collection...');
  const profileResult = await manageProfileAndSceneCollection({
    profileName,
    sceneCollectionName: profileName,
    width: parseInt(resolution.split(/[xX×]/)[0], 10) || 1920,
    height: parseInt(resolution.split(/[xX×]/)[1], 10) || 1080,
    obs // Pass the shared OBS WebSocket client
  });

  results.steps.push({
    name: 'profile',
    success: profileResult.success,
    message: profileResult.success ? 'Profile and scene collection configured successfully' : profileResult.error
  });

  if (!profileResult.success) {
    results.success = false;
    return results;
  }

  // Step 4: Configure audio sources
  console.log('Step 4: Configuring audio sources...');
  const audioResult = await enableAudioSources({
    obs // Pass the shared OBS WebSocket client
  });

  results.steps.push({
    name: 'audio',
    success: audioResult.success,
    message: audioResult.success ? 'Audio sources configured successfully' : audioResult.error
  });

  if (!audioResult.success) {
    results.success = false;
  }

  // Step 5: Configure video capture device
  console.log('Step 5: Configuring video capture device...');
  const videoResult = await manageVideoCaptureDevice({
    obs // Pass the shared OBS WebSocket client
  });

  results.steps.push({
    name: 'video',
    success: videoResult.success,
    message: videoResult.success ? 'Video capture device configured successfully' : videoResult.error
  });

  if (!videoResult.success) {
    results.success = false;
  }

  return results;
}

// Export all functions
export {
  // Main configuration function
  configureOBS,

  // OBS WebSocket client
  getOBSWebSocketClient,
  connectToOBS,
  disconnectFromOBS,

  // Profile and scene collection management
  manageProfileAndSceneCollection,
  configureOBSWithName,
  calculateDimensions,

  // Audio sources
  enableAudioSources,
  enableDefaultAudioSources,
  DEFAULT_AUDIO_SOURCES,

  // Video capture device
  manageVideoCaptureDevice,
  addDefaultVideoCaptureDevice,
  getVideoCaptureInputKind,
  getBasicSystemInfo,
  identifyCaptureCard,
  DEFAULT_SOURCE_NAME,

  // Fonts
  installFonts,
  checkFontsInstalled,
  isRunningAsAdmin,
  getFontFiles,

  // Default connection parameters
  DEFAULT_CONNECTION_PARAMS
};
