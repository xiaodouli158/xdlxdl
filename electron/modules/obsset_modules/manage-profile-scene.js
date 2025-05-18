/**
 * OBS WebSocket - Profile and Scene Collection Manager
 *
 * This script checks if a profile and scene collection named "aaaa" exist in OBS.
 * If they exist, it switches to them. If they don't exist, it creates them.
 */

// Import the OBS WebSocket library
import OBSWebSocket from 'obs-websocket-js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Create a new instance of the OBS WebSocket client
const obs = new OBSWebSocket();

// Connection parameters - adjust these as needed
const connectionParams = {
  address: 'ws://localhost:4455', // Default OBS WebSocket address and port
  password: 'OwuWIvIyVGFwcL01', // OBS WebSocket password (change if needed)
};

// Flag to try connecting without password if initial connection fails
let tryWithoutPassword = false;

// Profile and scene collection name to check/create
const targetName = 'aaaaa';
const targetSceneCollection = 'aaaaa';

// Resolution variables - adjust these for different resolutions
const baseWidth = 1920;
const baseHeight = 1080;
// If aspect ratio is less than 1 (portrait), set heightAdjustmentFactor to 0, otherwise use 52/1080
const heightAdjustmentFactor = (baseWidth / baseHeight < 1) ? 0 : 52/1080;

// Calculate actual dimensions
const actualBaseWidth = baseWidth;
const actualBaseHeight = Math.round(baseHeight * (1 + heightAdjustmentFactor));
const actualOutputWidth = baseWidth;
const actualOutputHeight = Math.round(baseHeight * (1 + heightAdjustmentFactor));

// Format dimensions as strings for OBS API
const baseWidthStr = String(actualBaseWidth);
const baseHeightStr = String(actualBaseHeight);
const outputWidthStr = String(actualOutputWidth);
const outputHeightStr = String(actualOutputHeight);
const rescaleResStr = `${actualBaseWidth}x${actualBaseHeight}`;

// Register event handlers
obs.on('ConnectionOpened', () => {
  console.log('Event: Connection to OBS WebSocket server opened');
});

obs.on('ConnectionClosed', () => {
  console.log('Event: Connection to OBS WebSocket server closed');
});

obs.on('ConnectionError', (error) => {
  console.error('Event: Connection error:', error);
});

// Main function
async function manageProfileAndSceneCollection() {
  try {
    // Connect to OBS WebSocket with timeout
    console.log('Connecting to OBS WebSocket...');

    try {
      // Create a promise that rejects after a timeout
      const connectPromise = obs.connect(connectionParams.address, connectionParams.password);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
      });

      // Race the connection against the timeout
      await Promise.race([connectPromise, timeoutPromise]);

      console.log('Successfully connected to OBS WebSocket!');
    } catch (connectionError) {
      // If connection with password fails, try without password
      if (connectionError.message.includes('Authentication') || tryWithoutPassword) {
        console.log('Authentication failed. Trying to connect without password...');

        // Create a new promise that rejects after a timeout
        const connectPromiseNoPassword = obs.connect(connectionParams.address);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
        });

        // Race the connection against the timeout
        await Promise.race([connectPromiseNoPassword, timeoutPromise]);

        console.log('Successfully connected to OBS WebSocket without password!');
      } else {
        // Re-throw the error if it's not an authentication error
        throw connectionError;
      }
    }

    // Get OBS version
    const { obsVersion } = await obs.call('GetVersion');
    console.log(`OBS Studio Version: ${obsVersion}`);

    // Step 1: Handle profile
    console.log('\n--- Profile Management ---');
    const profileResponse = await obs.call('GetProfileList');
    const profiles = profileResponse.profiles || [];
    const currentProfile = profileResponse.currentProfileName;

    console.log(`Current profile: ${currentProfile}`);
    console.log(`Available profiles: ${profiles.join(', ')}`);

    if (profiles.includes(targetName)) {
      console.log(`Profile "${targetName}" exists.`);

      if (currentProfile !== targetName) {
        console.log(`Switching to profile "${targetName}"...`);
        await obs.call('SetCurrentProfile', { profileName: targetName });
        console.log(`Successfully switched to profile "${targetName}"`);
      } else {
        console.log(`Already using profile "${targetName}"`);
      }
    } else {
      console.log(`Profile "${targetName}" does not exist. Creating...`);
      await obs.call('CreateProfile', { profileName: targetName });
      console.log(`Successfully created profile "${targetName}"`);

      // Switch to the newly created profile
      await obs.call('SetCurrentProfile', { profileName: targetName });
      console.log(`Switched to the newly created profile "${targetName}"`);
    }

    // Step 2: Handle scene collection
    console.log('\n--- Scene Collection Management ---');
    const sceneCollectionResponse = await obs.call('GetSceneCollectionList');
    const sceneCollections = sceneCollectionResponse.sceneCollections || [];
    const currentSceneCollection = sceneCollectionResponse.currentSceneCollectionName;

    console.log(`Current scene collection: ${currentSceneCollection}`);
    console.log(`Available scene collections: ${sceneCollections.join(', ')}`);

    if (sceneCollections.includes(targetSceneCollection)) {
      console.log(`Scene collection "${targetSceneCollection}" exists.`);

      if (currentSceneCollection !== targetSceneCollection) {
        console.log(`Switching to scene collection "${targetSceneCollection}"...`);
        await obs.call('SetCurrentSceneCollection', { sceneCollectionName: targetSceneCollection });
        console.log(`Successfully switched to scene collection "${targetSceneCollection}"`);
      } else {
        console.log(`Already using scene collection "${targetSceneCollection}"`);
      }
    } else {
      console.log(`Scene collection "${targetSceneCollection}" does not exist. Creating...`);
      await obs.call('CreateSceneCollection', { sceneCollectionName: targetSceneCollection });
      console.log(`Successfully created scene collection "${targetSceneCollection}"`);

      // The OBS WebSocket API automatically switches to the newly created scene collection
      console.log(`Switched to the newly created scene collection "${targetSceneCollection}"`);
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
      parameterValue: rescaleResStr
    });

    // Set video settings
    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'BaseCX',
      parameterValue: baseWidthStr
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'BaseCY',
      parameterValue: baseHeightStr
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'OutputCX',
      parameterValue: outputWidthStr
    });

    await obs.call('SetProfileParameter', {
      parameterCategory: 'Video',
      parameterName: 'OutputCY',
      parameterValue: outputHeightStr
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
      // Get current profile
      const globalIniPath = path.join(configDir, 'global.ini');
      let currentProfile = targetName;

      if (fs.existsSync(globalIniPath)) {
        try {
          const globalIniContent = fs.readFileSync(globalIniPath, 'utf8');
          const profileMatch = globalIniContent.match(/CurrentProfile=(.+)/);
          if (profileMatch && profileMatch[1]) {
            currentProfile = profileMatch[1].trim();
          }
        } catch (error) {
          console.error('Error reading global.ini:', error);
        }
      }

      console.log(`Current profile: ${currentProfile}`);
      const streamEncoderPath = path.join(configDir, 'basic', 'profiles', currentProfile, 'streamEncoder.json');

      // Define x264 encoder settings
      const x264Settings = {
        "streaming": {
          "encoder": "obs_x264",
          "rate_control": "CBR",
          "bitrate": 6000,
          "preset": "medium",
          "profile": "high",
          "tune": "film",
          "x264opts": "merange=32:ref=16:bframes=16:b-adapt=2:direct=auto:me=tesa:subme=11:trellis=2:rc-lookahead=60"
        }
      };

      // Write settings to file
      fs.writeFileSync(streamEncoderPath, JSON.stringify(x264Settings, null, 2));
      console.log(`✓ Encoder settings written to: ${streamEncoderPath}`);

      console.log('\nAll settings have been applied!');
      console.log('\nSummary of applied settings:');
      console.log(`- Output Mode: Advanced`);
      console.log(`- Encoder: obs_x264`);
      console.log(`- Rescale: Enabled with Lanczos filter at ${rescaleResStr}`);
      console.log(`- Base Resolution: ${actualBaseWidth}x${actualBaseHeight} (${baseWidth}x${baseHeight} with ${heightAdjustmentFactor.toFixed(5)} height adjustment)`);
      console.log(`- Output Resolution: ${actualOutputWidth}x${actualOutputHeight} (${baseWidth}x${baseHeight} with ${heightAdjustmentFactor.toFixed(5)} height adjustment)`);
      console.log(`- Scale Type: bilinear`);
      console.log(`- FPS: 65`);
      console.log('- x264 Settings: CBR at 6000 kbps, medium preset, high profile, film tune');

      console.log('\nPlease restart OBS to ensure all settings are applied correctly.');
    } else {
      console.error('Could not find OBS configuration directory');
    }

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
  } finally {
    // Disconnect from OBS WebSocket
    if (obs.identified) {
      await obs.disconnect();
      console.log('\nDisconnected from OBS WebSocket.');
    }
  }
}

// Run the main function
manageProfileAndSceneCollection();
