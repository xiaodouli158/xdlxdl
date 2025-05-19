/**
 * OBS WebSocket - Create Display Capture Source
 *
 * This script connects to OBS via WebSocket and creates a display capture source:
 * 1. Connects to OBS WebSocket
 * 2. Checks if a display capture source already exists
 * 3. Creates a new display capture source if it doesn't exist
 * 4. Gets the list of available monitors
 * 5. Configures the source to capture the primary monitor (or specified monitor)
 *
 * Usage:
 *   node create-display-capture.js [sourceName]
 *
 * Examples:
 *   node create-display-capture.js                # Creates "显示器采集" (Display Capture in Chinese)
 *   node create-display-capture.js "My Monitor"   # Creates "My Monitor" display capture source
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

// Function to create and configure a display capture source in OBS
async function createDisplayCaptureSource() {
  // Get source name from command line arguments or use default
  const sourceName = process.argv[2] || '显示器采集'; // Default: "Display Capture" in Chinese

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

    // Get available input kinds to confirm monitor_capture is available
    const { inputKinds } = await obs.call('GetInputKindList');

    // Check if monitor_capture is available
    if (!inputKinds.includes('monitor_capture')) {
      throw new Error('monitor_capture input kind is not available in this OBS version');
    }

    console.log('Display capture is supported in this OBS version');

    // Check if the source already exists
    const { inputs } = await obs.call('GetInputList');
    const existingSource = inputs.find(input =>
      input.inputName === sourceName && input.inputKind === 'monitor_capture'
    );

    // Create the source if it doesn't exist
    if (!existingSource) {
      console.log(`Creating new display capture source: ${sourceName}`);

      await obs.call('CreateInput', {
        sceneName: currentProgramSceneName,
        inputName: sourceName,
        inputKind: 'monitor_capture'
      });

      console.log(`Successfully created display capture source: ${sourceName}`);
    } else {
      console.log(`Display capture source already exists: ${sourceName}`);
    }

    // Get the list of available monitors
    console.log('\n--- Getting Available Monitors ---');
    const monitorListResponse = await obs.call('GetInputPropertiesListPropertyItems', {
      inputName: sourceName,
      propertyName: 'monitor_id'
    });

    const monitorList = monitorListResponse.propertyItems || [];

    if (monitorList.length === 0) {
      console.log('No monitors found');
      return;
    }

    console.log(`Found ${monitorList.length} monitors:`);
    monitorList.forEach((monitor, index) => {
      console.log(`${index + 1}. ${monitor.itemName} (ID: ${monitor.itemValue})`);
    });

    // Find the primary monitor (usually contains "Primary" or "0,0" in the name)
    let primaryMonitor = monitorList.find(monitor =>
      monitor.itemName.includes('Primary') ||
      monitor.itemName.includes('主显示器') ||
      monitor.itemName.includes('0,0')
    );

    // If no primary monitor is found, use the first one
    if (!primaryMonitor && monitorList.length > 0) {
      primaryMonitor = monitorList[0];
    }

    if (primaryMonitor) {
      console.log(`\nSelecting primary monitor: ${primaryMonitor.itemName}`);

      // Configure the display capture source to use the primary monitor
      await obs.call('SetInputSettings', {
        inputName: sourceName,
        inputSettings: {
          monitor_id: primaryMonitor.itemValue
        }
      });

      console.log(`Successfully configured ${sourceName} to capture ${primaryMonitor.itemName}`);
    } else {
      console.log('No monitors available to capture');
    }

    console.log('\nDisplay capture source setup completed successfully!');
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

// Run the display capture source creation function
createDisplayCaptureSource();
