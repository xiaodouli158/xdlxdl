/**
 * OBS WebSocket - Enable Default Audio Sources
 *
 * This script connects to OBS via WebSocket and enables default audio sources:
 * 1. Desktop Audio (wasapi_output_capture)
 * 2. Microphone/AUX (wasapi_input_capture)
 *
 * It also adds a noise suppression filter to the desktop audio source.
 */

// Import the OBS WebSocket library
import OBSWebSocket from 'obs-websocket-js';

// Create a new instance of the OBS WebSocket client
const obs = new OBSWebSocket();

// Connection parameters - adjust these as needed
const connectionParams = {
  address: 'ws://localhost:4455', // Default OBS WebSocket address and port
  password: 'OwuWIvIyVGFwcL01', // OBS WebSocket password (change if needed)
};

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

// Function to enable default audio sources
async function enableAudioSources() {
  try {
    console.log('Connecting to OBS WebSocket...');

    // Create a promise that rejects after a timeout
    const connectPromise = obs.connect(connectionParams.address, connectionParams.password);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
    });

    // Race the connection against the timeout
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('Connected to OBS WebSocket!');

    // Get OBS version
    const { obsVersion } = await obs.call('GetVersion');
    console.log(`OBS Studio Version: ${obsVersion}`);

    // Get current scene
    const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
    console.log(`Current Scene: ${currentProgramSceneName}`);

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

    // Apply noise suppression filter to desktop audio
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

    console.log('\nAudio sources setup completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);

    // Provide troubleshooting tips
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure OBS Studio is running');
    console.log('2. Verify WebSocket server is enabled in OBS (Tools > WebSocket Server Settings)');
    console.log('3. Check that the port is correct (default is 4455)');
    console.log('4. Verify the password is correct');
  } finally {
    // Disconnect from OBS WebSocket
    try {
      await obs.disconnect();
      console.log('Disconnected from OBS WebSocket');
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
  }
}

// Run the function to enable audio sources
enableAudioSources();
