/**
 * OBS WebSocket - Profile and Scene Collection Manager
 *
 * This module provides functions to manage OBS profiles and scene collections.
 * It can check if a profile and scene collection exist, switch to them, or create them if they don't exist.
 * It also configures video settings based on the provided resolution.
 */

// Import the OBS WebSocket library
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getOBSWebSocketClient } from './obsWebSocketClient.js';

/**
 * Calculate dimensions based on the provided resolution and adjustment factor
 * @param {number} width - The base width
 * @param {number} height - The base height
 * @returns {Object} The calculated dimensions
 */
function calculateDimensions(width, height) {
  // If aspect ratio is less than 1 (portrait), set heightAdjustmentFactor to 0, otherwise use 52/1080
  const heightAdjustmentFactor = (width / height < 1) ? 0 : 52/1080;

  // Calculate actual dimensions
  const actualBaseWidth = width;
  const actualBaseHeight = Math.round(height * (1 + heightAdjustmentFactor));
  const actualOutputWidth = width;
  const actualOutputHeight = Math.round(height * (1 + heightAdjustmentFactor));

  // Format dimensions as strings for OBS API
  const baseWidthStr = String(actualBaseWidth);
  const baseHeightStr = String(actualBaseHeight);
  const outputWidthStr = String(actualOutputWidth);
  const outputHeightStr = String(actualOutputHeight);
  const rescaleResStr = `${actualBaseWidth}x${actualBaseHeight}`;

  return {
    actualBaseWidth,
    actualBaseHeight,
    actualOutputWidth,
    actualOutputHeight,
    baseWidthStr,
    baseHeightStr,
    outputWidthStr,
    outputHeightStr,
    rescaleResStr,
    heightAdjustmentFactor
  };
}

/**
 * Manage OBS profile and scene collection
 * @param {Object} options - Configuration options
 * @param {string} options.profileName - Profile name to check/create
 * @param {string} options.sceneCollectionName - Scene collection name to check/create
 * @param {number} options.width - Base width for video settings
 * @param {number} options.height - Base height for video settings
 * @param {Object} options.obs - OBS WebSocket client (optional)
 * @returns {Promise<Object>} Result of the operation
 */
async function manageProfileAndSceneCollection(options) {
  // Set default options
  const {
    profileName,
    sceneCollectionName,
    width = 1920,
    height = 1080,
    obs = getOBSWebSocketClient() // Use the shared client by default
  } = options;

  // Calculate dimensions
  const dimensions = calculateDimensions(width, height);

  try {
    // Check if the client is connected
    if (!obs.identified) {
      throw new Error('OBS WebSocket client is not connected');
    }

    // Get OBS version
    const { obsVersion } = await obs.call('GetVersion');
    console.log(`OBS Studio Version: ${obsVersion}`);

    // Step 1: Handle profile with retry mechanism
    console.log('\n--- Profile Management ---');

    // 实现配置文件处理的重试机制
    const maxProfileRetries = 3;
    let profileRetryCount = 0;
    let profileSuccess = false;
    let profileCreated = false;

    while (!profileSuccess && profileRetryCount < maxProfileRetries) {
      try {
        // 获取当前配置文件列表
        const profileResponse = await obs.call('GetProfileList');
        const profiles = profileResponse.profiles || [];
        const currentProfile = profileResponse.currentProfileName;

        console.log(`Current profile: ${currentProfile}`);
        console.log(`Available profiles: ${profiles.join(', ')}`);

        if (profiles.includes(profileName)) {
          console.log(`Profile "${profileName}" exists.`);

          if (currentProfile !== profileName) {
            console.log(`Switching to profile "${profileName}"...`);
            await obs.call('SetCurrentProfile', { profileName });
            console.log(`Successfully switched to profile "${profileName}"`);

            // 添加较长延迟，确保配置文件切换完成
            console.log('Waiting for profile switch to complete...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.log(`Already using profile "${profileName}"`);
          }
        } else {
          console.log(`Profile "${profileName}" does not exist. Creating...`);
          await obs.call('CreateProfile', { profileName });
          console.log(`Successfully created profile "${profileName}"`);
          profileCreated = true;

          // 添加较长延迟，确保配置文件创建完成
          console.log('Waiting for profile creation to complete...');
          await new Promise(resolve => setTimeout(resolve, 3000));

          // 切换到新创建的配置文件
          console.log(`Switching to the newly created profile "${profileName}"...`);
          await obs.call('SetCurrentProfile', { profileName });
          console.log(`Switched to the newly created profile "${profileName}"`);

          // 再次添加延迟，确保配置文件切换完成
          console.log('Waiting for profile switch to complete...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 验证配置文件是否已成功应用
        const verifyProfileResponse = await obs.call('GetProfileList');
        const currentProfileAfterSwitch = verifyProfileResponse.currentProfileName;

        if (currentProfileAfterSwitch !== profileName) {
          throw new Error(`Profile switch verification failed. Expected "${profileName}", got "${currentProfileAfterSwitch}"`);
        } else {
          console.log(`Profile verification successful: Using "${profileName}"`);
          profileSuccess = true;
        }
      } catch (error) {
        profileRetryCount++;
        console.log(`Profile attempt ${profileRetryCount}/${maxProfileRetries} failed: ${error.message}`);

        if (profileRetryCount < maxProfileRetries) {
          console.log(`Waiting before profile retry ${profileRetryCount + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 3000 * profileRetryCount));
        } else {
          console.error(`Failed to handle profile after ${maxProfileRetries} attempts`);
          throw error;
        }
      }
    }

    // 在配置文件处理完成后，添加额外的延迟
    console.log('Profile setup complete. Adding extra delay before scene collection setup...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Handle scene collection with improved retry mechanism
    console.log('\n--- Scene Collection Management ---');

    // 实现更健壮的场景集合处理重试机制
    const maxSceneRetries = 5; // 增加最大重试次数
    let sceneRetryCount = 0;
    let sceneCollectionSuccess = false;

    // 在开始处理场景集合前，先刷新OBS WebSocket连接
    try {
      console.log('Refreshing OBS WebSocket connection before scene collection setup...');
      // 获取OBS版本信息，确认连接正常
      const { obsVersion, obsWebSocketVersion } = await obs.call('GetVersion');
      console.log(`Confirmed connection to OBS version: ${obsVersion}, WebSocket version: ${obsWebSocketVersion}`);
    } catch (error) {
      console.log(`Connection check failed: ${error.message}. Continuing anyway...`);
    }

    while (!sceneCollectionSuccess && sceneRetryCount < maxSceneRetries) {
      try {
        // 每次尝试前重新获取场景集合列表
        const sceneCollectionResponse = await obs.call('GetSceneCollectionList');
        const sceneCollections = sceneCollectionResponse.sceneCollections || [];
        const currentSceneCollection = sceneCollectionResponse.currentSceneCollectionName;

        console.log(`Current scene collection: ${currentSceneCollection}`);
        console.log(`Available scene collections: ${sceneCollections.join(', ')}`);

        if (sceneCollections.includes(sceneCollectionName)) {
          console.log(`Scene collection "${sceneCollectionName}" exists.`);

          if (currentSceneCollection !== sceneCollectionName) {
            console.log(`Switching to scene collection "${sceneCollectionName}"...`);
            await obs.call('SetCurrentSceneCollection', { sceneCollectionName });
            console.log(`Successfully switched to scene collection "${sceneCollectionName}"`);

            // 添加较长延迟，确保场景集合切换完成
            console.log('Waiting for scene collection switch to complete...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            console.log(`Already using scene collection "${sceneCollectionName}"`);
          }
        } else {
          console.log(`Scene collection "${sceneCollectionName}" does not exist. Creating...`);

          // 添加较长延迟，确保OBS准备好创建新场景集合
          console.log('Preparing to create new scene collection...');
          await new Promise(resolve => setTimeout(resolve, 4000));

          // 使用try-catch单独处理创建场景集合的操作
          try {
            await obs.call('CreateSceneCollection', { sceneCollectionName });
            console.log(`Successfully created scene collection "${sceneCollectionName}"`);

            // 添加较长延迟，确保场景集合创建完成
            console.log('Waiting for scene collection creation to complete...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          } catch (createError) {
            console.error(`Error creating scene collection: ${createError.message}`);

            if (createError.code === 600) {
              console.log('Received error code 600. This usually means OBS is busy. Waiting longer...');
              await new Promise(resolve => setTimeout(resolve, 6000));

              // 尝试再次创建
              console.log('Trying to create scene collection again...');
              await obs.call('CreateSceneCollection', { sceneCollectionName });
              console.log(`Successfully created scene collection "${sceneCollectionName}" on second attempt`);

              // 添加更长延迟
              await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
              throw createError; // 重新抛出其他错误
            }
          }

          console.log(`Switched to the newly created scene collection "${sceneCollectionName}"`);
        }

        // 验证场景集合是否已成功应用
        console.log('Verifying scene collection...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 验证前添加延迟

        const verifySceneCollectionResponse = await obs.call('GetSceneCollectionList');
        const currentSceneCollectionAfterSwitch = verifySceneCollectionResponse.currentSceneCollectionName;

        if (currentSceneCollectionAfterSwitch === sceneCollectionName) {
          console.log(`Scene collection verification successful: Using "${sceneCollectionName}"`);
          sceneCollectionSuccess = true;

          // 成功后添加额外延迟，确保OBS完全加载场景集合
          console.log('Scene collection setup successful. Adding final delay...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          throw new Error(`Scene collection switch verification failed. Expected "${sceneCollectionName}", got "${currentSceneCollectionAfterSwitch}"`);
        }
      } catch (error) {
        sceneRetryCount++;
        console.log(`Scene collection attempt ${sceneRetryCount}/${maxSceneRetries} failed: ${error.message}`);

        if (sceneRetryCount < maxSceneRetries) {
          const waitTime = 3000 * sceneRetryCount;
          console.log(`Waiting ${waitTime}ms before scene collection retry ${sceneRetryCount + 1}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.error(`Failed to handle scene collection after ${maxSceneRetries} attempts`);
          throw error;
        }
      }
    }

    console.log('\nProfile and scene collection management completed successfully!');

    // Step 3: Enable default audio sources
    console.log('\n--- Audio Sources Management ---');

    // Get current inputs to check if audio sources already exist
    const { inputs } = await obs.call('GetInputList');

    // Check for desktop audio source
    const desktopAudioName = '桌面音频'; // "Desktop Audio" in Chinese
    const desktopAudioExists = inputs.some(input =>
      input.inputName === desktopAudioName && input.inputKind === 'wasapi_output_capture'
    );

    // Check for microphone/AUX audio source
    const micAudioName = '麦克风/Aux'; // "Microphone/Aux" in Chinese
    const micAudioExists = inputs.some(input =>
      input.inputName === micAudioName && input.inputKind === 'wasapi_input_capture'
    );

    // Get current scene
    const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');

    // Create desktop audio source if it doesn't exist
    if (!desktopAudioExists) {
      console.log(`Creating desktop audio source: ${desktopAudioName}`);
      try {
        await obs.call('CreateInput', {
          sceneName: currentProgramSceneName,
          inputName: desktopAudioName,
          inputKind: 'wasapi_output_capture',
          inputSettings: {
            'device_id': 'default'
          }
        });
        console.log(`Successfully created desktop audio source: ${desktopAudioName}`);
      } catch (error) {
        console.error(`Error creating desktop audio source: ${error.message}`);
      }
    } else {
      console.log(`Desktop audio source already exists: ${desktopAudioName}`);
    }

    // Create microphone/AUX audio source if it doesn't exist
    if (!micAudioExists) {
      console.log(`Creating microphone/AUX audio source: ${micAudioName}`);
      try {
        await obs.call('CreateInput', {
          sceneName: currentProgramSceneName,
          inputName: micAudioName,
          inputKind: 'wasapi_input_capture',
          inputSettings: {
            'device_id': 'default'
          }
        });
        console.log(`Successfully created microphone/AUX audio source: ${micAudioName}`);
      } catch (error) {
        console.error(`Error creating microphone/AUX audio source: ${error.message}`);
      }
    } else {
      console.log(`Microphone/AUX audio source already exists: ${micAudioName}`);
    }

    // Apply noise suppression filter to desktop audio (optional)
    if (desktopAudioExists || !desktopAudioExists) {
      try {
        // Check if the filter already exists
        const { filters } = await obs.call('GetSourceFilterList', {
          sourceName: desktopAudioName
        });

        const noiseSuppressFilterExists = filters.some(filter =>
          filter.filterName === '噪声抑制' && filter.filterKind === 'noise_suppress_filter_v2'
        );

        if (!noiseSuppressFilterExists) {
          console.log(`Adding noise suppression filter to ${desktopAudioName}`);
          await obs.call('CreateSourceFilter', {
            sourceName: desktopAudioName,
            filterName: '噪声抑制',
            filterKind: 'noise_suppress_filter_v2',
            filterSettings: {}
          });
          console.log(`Successfully added noise suppression filter to ${desktopAudioName}`);
        } else {
          console.log(`Noise suppression filter already exists for ${desktopAudioName}`);
        }
      } catch (error) {
        console.error(`Error configuring noise suppression filter: ${error.message}`);
      }
    }

    console.log('Audio sources setup completed successfully!');

    // Step 4: Configure x264 settings for the profile
    console.log('\n--- x264 Configuration ---');
    console.log('Configuring x264 encoder settings for the profile...');

    // Set output mode to Advanced
    await obs.call('SetProfileParameter', {
      parameterCategory: 'Output',
      parameterName: 'Mode',
      parameterValue: 'Advanced'
    });

    // Set encoder to x264
    await obs.call('SetProfileParameter', {
      parameterCategory: 'AdvOut',
      parameterName: 'Encoder',
      parameterValue: 'obs_x264'
    });

    // Set rescale settings
    await obs.call('SetProfileParameter', {
      parameterCategory: 'AdvOut',
      parameterName: 'Rescale',
      parameterValue: 'true'
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'AdvOut',
      parameterName: 'RescaleFilter',
      parameterValue: '4' // Lanczos
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'AdvOut',
      parameterName: 'RescaleRes',
      parameterValue: dimensions.rescaleResStr
    });

    // Set video settings
    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'BaseCX',
      parameterValue: dimensions.baseWidthStr
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'BaseCY',
      parameterValue: dimensions.baseHeightStr
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'OutputCX',
      parameterValue: dimensions.outputWidthStr
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'OutputCY',
      parameterValue: dimensions.outputHeightStr
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'ScaleType',
      parameterValue: 'bilinear'
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'FPSType',
      parameterValue: '1'
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'FPSInt',
      parameterValue: '65'
    });

    console.log('✓ Basic parameters configured via WebSocket');

    // Find OBS configuration directory and modify streamEncoder.json

    // Find OBS configuration directory
    const possibleLocations = [
      // Windows
      path.join(os.homedir(), 'AppData', 'Roaming', 'obs-studio'),
      // macOS
      path.join(os.homedir(), 'Library', 'Application Support', 'obs-studio'),
      // Linux
      path.join(os.homedir(), '.config', 'obs-studio')
    ];

    let configDir = null;
    for (const location of possibleLocations) {
      if (fs.existsSync(location)) {
        console.log(`Found OBS configuration directory: ${location}`);
        configDir = location;
        break;
      }
    }

    if (configDir) {
      // We're using the profileName parameter directly for all operations
      // No need to read the current profile from global.ini

      // Optional: Configure x264 encoder settings via streamEncoder.json
      // const streamEncoderPath = path.join(configDir, 'basic', 'profiles', profileName, 'streamEncoder.json');
      // const x264Settings = {
      //   "streaming": {
      //     "encoder": "obs_x264",
      //     "rate_control": "CBR",
      //     "bitrate": 6000,
      //     "preset": "medium",
      //     "profile": "high",
      //     "tune": "film",
      //     "x264opts": "merange=32:ref=16:bframes=16:b-adapt=2:direct=auto:me=tesa:subme=11:trellis=2:rc-lookahead=60"
      //   }
      // };
      // fs.writeFileSync(streamEncoderPath, JSON.stringify(x264Settings, null, 2));
      // console.log(`✓ Encoder settings written to: ${streamEncoderPath}`);

      console.log('\nAll settings have been applied!');
      console.log('\nSummary of applied settings:');
      console.log(`- Output Mode: Advanced`);
      console.log(`- Encoder: obs_x264`);
      console.log(`- Rescale: Enabled with Lanczos filter at ${dimensions.rescaleResStr}`);
      console.log(`- Base Resolution: ${dimensions.actualBaseWidth}x${dimensions.actualBaseHeight} (${width}x${height} with ${dimensions.heightAdjustmentFactor.toFixed(5)} height adjustment)`);
      console.log(`- Output Resolution: ${dimensions.actualOutputWidth}x${dimensions.actualOutputHeight} (${width}x${height} with ${dimensions.heightAdjustmentFactor.toFixed(5)} height adjustment)`);
      console.log(`- Scale Type: bilinear`);
      console.log(`- FPS: 65`);
      console.log('- x264 Settings: CBR at 6000 kbps, medium preset, high profile, film tune');

      console.log('\nPlease restart OBS to ensure all settings are applied correctly.');
    } else {
      console.error('Could not find OBS configuration directory');
    }

    // Return success result
    return {
      success: true,
      profileName,
      sceneCollectionName,
      dimensions,
      message: 'OBS profile and scene collection configured successfully'
    };

  } catch (error) {
    console.error('\n--- ERROR ---');
    console.error(`Error message: ${error.message}`);

    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }

    if (error.message.includes('timeout')) {
      console.error('Connection timed out. OBS might not be running or WebSocket server might be disabled.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('Connection refused. OBS is not running or WebSocket server is not enabled.');
    } else if (error.message.includes('Authentication')) {
      console.error('Authentication failed. The password is incorrect.');
    }

    // Provide troubleshooting tips
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure OBS Studio is running');
    console.log('2. Verify that the WebSocket server is enabled in OBS (Tools > WebSocket Server Settings)');
    console.log('3. Check that the port is correct (default is 4455)');
    console.log('4. Verify that the password is correct (or try with no password)');
    console.log('5. Check if there are any firewall issues blocking the connection');
    console.log('6. Try restarting OBS');

    // Return error result
    return {
      success: false,
      error: error.message,
      message: 'Failed to configure OBS profile and scene collection'
    };
  }
  // We don't disconnect here since we're using a shared client
}

/**
 * Simple function to create or switch to a profile and scene collection with the same name
 * @param {string} name - Name to use for both profile and scene collection
 * @param {string} resolution - Resolution in format "widthxheight" (e.g., "1920x1080")
 * @param {Object} obs - OBS WebSocket client (optional)
 * @returns {Promise<Object>} Result of the operation
 */
async function configureOBSWithName(name, resolution, obs = getOBSWebSocketClient()) {
  // Parse resolution
  let width = 1920;
  let height = 1080;

  if (resolution) {
    const match = resolution.replace(/\s+/g, '').match(/(\d+)[xX×](\d+)/);
    if (match) {
      width = parseInt(match[1], 10);
      height = parseInt(match[2], 10);
    }
  }

  return manageProfileAndSceneCollection({
    profileName: name,
    sceneCollectionName: name,
    width,
    height,
    obs
  });
}

// Export functions
export {
  manageProfileAndSceneCollection,
  configureOBSWithName,
  calculateDimensions
};
