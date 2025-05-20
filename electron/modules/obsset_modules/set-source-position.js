/**
 * OBS WebSocket - Set Source Position, Alignment, and Auto-Scale
 *
 * This script connects to OBS via WebSocket and adjusts the position and alignment of a source in the canvas.
 * It can also automatically scale the source so that its height becomes 52/1080 of the canvas height,
 * while maintaining the original aspect ratio.
 *
 * The scaling is applied relative to the current scale of the source, not as an absolute value.
 * This means if the source is already scaled, the script will adjust that scale to achieve the target height.
 *
 * Usage:
 *   node set-source-position.js [sourceName] [x] [y] [alignment] [useScale]
 *
 * Parameters:
 *   sourceName: The name of the source to transform
 *   x: The X coordinate (horizontal position)
 *   y: The Y coordinate (vertical position)
 *   alignment: The alignment value (0-8)
 *   useScale: Whether to apply automatic scaling (true/1) or keep current scale (false/0)
 *
 * Alignment values:
 *   0: Top Left     1: Top Center     2: Top Right
 *   3: Center Left  4: Center         5: Center Right
 *   6: Bottom Left  7: Bottom Center  8: Bottom Right
 *
 * Examples:
 *   node set-source-position.js "文本" 100 200                # Sets position and auto-scales
 *   node set-source-position.js "文本" 100 200 5              # Sets position with right-center alignment (5) and auto-scales
 *   node set-source-position.js "文本" 0 1080 6 true          # Sets position to bottom-left corner with auto-scaling
 *   node set-source-position.js "文本" 0 1080 6 false         # Sets position to bottom-left corner without scaling
 */

// Import the OBS WebSocket library
import OBSWebSocket from 'obs-websocket-js';
import { exec } from 'child_process';

// Create a new instance of the OBS WebSocket client
const obs = new OBSWebSocket();

// Connection parameters - adjust these as needed
const connectionParams = {
  address: 'ws://localhost:4455', // Default OBS WebSocket address and port
  password: 'OwuWIvIyVGFwcL01', // OBS WebSocket password (change if needed)
};

// Function to check if OBS is running
function isOBSRunning() {
  return new Promise((resolve) => {
    console.log('Checking if OBS is running...');

    // Use a more detailed command to check for OBS process
    const command = 'tasklist /FI "IMAGENAME eq obs64.exe" /FO CSV /NH';

    console.log('Executing command:', command);

    exec(command, (error, stdout, stderr) => {
      console.log('Command output:', stdout);

      if (error) {
        console.error('Command error:', error);
        console.error('Command stderr:', stderr);
        resolve(false);
        return;
      }

      if (stdout && stdout.includes('obs64.exe')) {
        console.log('OBS is running');
        resolve(true);
      } else {
        console.log('OBS is not running');
        resolve(false);
      }
    });
  });
}

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

/**
 * Sets the position, alignment, and optionally applies automatic scaling to a source in the current OBS scene
 * @param {string} sourceName - The name of the source to transform
 * @param {number|null} x - The X coordinate (horizontal position), null to keep current value
 * @param {number|null} y - The Y coordinate (vertical position), null to keep current value
 * @param {number|null} alignment - The alignment value (0-8), null to keep current value
 *                                 0: Top Left, 1: Top Center, 2: Top Right
 *                                 3: Center Left, 4: Center, 5: Center Right
 *                                 6: Bottom Left, 7: Bottom Center, 8: Bottom Right
 * @param {boolean} useScale - Whether to apply automatic scaling (true) or keep current scale (false)
 */
async function setSourceTransform(sourceName, x, y, alignment=5, useScale = true) {
  try {
    // Check if OBS is running
    const obsRunning = await isOBSRunning();
    if (!obsRunning) {
      console.error('OBS is not running. Please start OBS first.');
      console.log('Troubleshooting tips:');
      console.log('1. Start OBS Studio manually');
      console.log('2. Make sure WebSocket server is enabled in OBS (Tools > WebSocket Server Settings)');
      return;
    }

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
    } catch (error) {
      console.error('Failed to connect to OBS WebSocket:', error.message);
      return;
    }

    try {
      // Get current scene
      const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
      console.log(`Current Scene: ${currentProgramSceneName}`);

      // Get scene items to find the item ID for the source
      const { sceneItems } = await obs.call('GetSceneItemList', {
        sceneName: currentProgramSceneName
      });

      // Find the scene item with the matching source name
      const sceneItem = sceneItems.find(item => item.sourceName === sourceName);

      if (!sceneItem) {
        throw new Error(`Source "${sourceName}" not found in scene "${currentProgramSceneName}"`);
      }

      console.log(`Found source "${sourceName}" with item ID: ${sceneItem.sceneItemId}`);

      // Get current transform to preserve other properties
      const { sceneItemTransform } = await obs.call('GetSceneItemTransform', {
        sceneName: currentProgramSceneName,
        sceneItemId: sceneItem.sceneItemId
      });

      console.log('Current transform:', sceneItemTransform);

      // Create a new transform object, only updating the provided values
      const newTransform = { ...sceneItemTransform };

      // Update position if provided
      if (x !== null) newTransform.positionX = parseFloat(x);
      if (y !== null) newTransform.positionY = parseFloat(y);

      // Update alignment if provided
      if (alignment !== null) {
        // Ensure alignment is a valid value (0-8)
        const alignmentValue = parseInt(alignment);
        if (alignmentValue >= 0 && alignmentValue <= 9) {
          newTransform.alignment = alignmentValue;
          console.log(`Setting alignment to ${alignmentValue}`);
        } else {
          console.warn(`Invalid alignment value: ${alignment}. Must be between 0 and 8.`);
        }
      }

      // Apply automatic scaling if useScale is true
      if (useScale) {
        try {
          // Get current video settings to determine canvas height
          const videoSettings = await obs.call('GetVideoSettings');
          const canvasHeight = videoSettings.baseHeight;
          console.log(`Canvas height: ${canvasHeight}`);

          // Calculate target height (55/1080 of canvas height)
          const targetHeight = 55 / 1080 * canvasHeight;
          console.log(`Target height: ${targetHeight} (55/1080 of canvas height)`);

          // Get current source height in the canvas
          const currentHeight = sceneItemTransform.height;
          console.log(`Current source height: ${currentHeight}`);

          // Calculate scale factor as ratio of target height to current height
          const scaleFactor = targetHeight / currentHeight;
          console.log(`Scale factor: ${scaleFactor} (${targetHeight}/${currentHeight})`);

          // Apply the scale factor to both dimensions to maintain aspect ratio
          newTransform.scaleX = sceneItemTransform.scaleX * scaleFactor;
          newTransform.scaleY = sceneItemTransform.scaleY * scaleFactor;
          console.log(`Setting scaleX to ${newTransform.scaleX} and scaleY to ${newTransform.scaleY}`);
        } catch (error) {
          console.error('Error getting video settings:', error.message);
        }
      } else {
        console.log('Automatic scaling is disabled. Keeping current scale.');
      }

      // Fix for bounds-related errors - always ensure boundsWidth and boundsHeight are at least 1
      // This is required by OBS WebSocket API even when boundsType is 'OBS_BOUNDS_NONE'
      newTransform.boundsWidth = Math.max(1, newTransform.boundsWidth || 0);
      newTransform.boundsHeight = Math.max(1, newTransform.boundsHeight || 0);

      // Set the new transform
      console.log('Setting new transform:', newTransform);
      console.log('Original transform:', sceneItemTransform);
      console.log('Changes: ' +
        (newTransform.width !== sceneItemTransform.width ? `width ${sceneItemTransform.width} -> ${newTransform.width}, ` : '') +
        (newTransform.height !== sceneItemTransform.height ? `height ${sceneItemTransform.height} -> ${newTransform.height}, ` : '') +
        (newTransform.scaleX !== sceneItemTransform.scaleX ? `scaleX ${sceneItemTransform.scaleX} -> ${newTransform.scaleX}, ` : '') +
        (newTransform.scaleY !== sceneItemTransform.scaleY ? `scaleY ${sceneItemTransform.scaleY} -> ${newTransform.scaleY}, ` : '') +
        (newTransform.positionX !== sceneItemTransform.positionX ? `positionX ${sceneItemTransform.positionX} -> ${newTransform.positionX}, ` : '') +
        (newTransform.positionY !== sceneItemTransform.positionY ? `positionY ${sceneItemTransform.positionY} -> ${newTransform.positionY}, ` : '') +
        (newTransform.rotation !== sceneItemTransform.rotation ? `rotation ${sceneItemTransform.rotation} -> ${newTransform.rotation}` : '')
      );

      try {
        await obs.call('SetSceneItemTransform', {
          sceneName: currentProgramSceneName,
          sceneItemId: sceneItem.sceneItemId,
          sceneItemTransform: newTransform
        });

        // Verify the transform was applied
        const { sceneItemTransform: updatedTransform } = await obs.call('GetSceneItemTransform', {
          sceneName: currentProgramSceneName,
          sceneItemId: sceneItem.sceneItemId
        });

        console.log('Transform after update:', updatedTransform);
        console.log('Verification: ' +
          (updatedTransform.width === newTransform.width ? 'width applied ✓, ' : 'width not applied ✗, ') +
          (updatedTransform.height === newTransform.height ? 'height applied ✓, ' : 'height not applied ✗, ') +
          (updatedTransform.scaleX === newTransform.scaleX ? 'scaleX applied ✓, ' : 'scaleX not applied ✗, ') +
          (updatedTransform.scaleY === newTransform.scaleY ? 'scaleY applied ✓, ' : 'scaleY not applied ✗, ') +
          (updatedTransform.positionX === newTransform.positionX ? 'positionX applied ✓, ' : 'positionX not applied ✗, ') +
          (updatedTransform.positionY === newTransform.positionY ? 'positionY applied ✓, ' : 'positionY not applied ✗, ') +
          (updatedTransform.rotation === newTransform.rotation ? 'rotation applied ✓' : 'rotation not applied ✗')
        );
      } catch (error) {
        console.error('Error setting transform:', error.message);
        throw error;
      }

      console.log(`Successfully transformed source "${sourceName}"`);
      console.log(`Position: X=${newTransform.positionX}, Y=${newTransform.positionY}`);
      console.log(`Scale: X=${newTransform.scaleX}, Y=${newTransform.scaleY}`);
      if (alignment !== null) {
        console.log(`Alignment: ${newTransform.alignment}`);
      }
    } catch (error) {
      console.error('Error during source transformation:', error.message);
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
  } finally {
    // Disconnect from OBS WebSocket
    if (obs.identified) {
      await obs.disconnect();
      console.log('Disconnected from OBS WebSocket');
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let sourceName = '文本'; // Default source name
let x = null;
let y = null;
let alignment = null;
let useScale = true; // Default to using automatic scaling

// Check if arguments were provided
if (args.length >= 1) {
  sourceName = args[0];
}
if (args.length >= 2) {
  x = args[1];
}
if (args.length >= 3) {
  y = args[2];
}
if (args.length >= 4) {
  alignment = args[3];
}
if (args.length >= 5) {
  // Parse useScale as boolean
  useScale = args[4].toLowerCase() === 'true' || args[4] === '1';
}

// Run the main function
console.log('Starting source transform...');
console.log('Script version: 3.2.0');
console.log(`Source name: "${sourceName}"`);
console.log(`Transform parameters:`);
console.log(`- Position: ${x !== null ? 'X=' + x : 'X=unchanged'}, ${y !== null ? 'Y=' + y : 'Y=unchanged'}`);
console.log(`- Alignment: ${alignment !== null ? alignment : 'unchanged'}`);
console.log(`- Auto-scale: ${useScale ? 'Enabled (55/1080 of canvas height)' : 'Disabled (keeping current scale)'}`);

// Add more debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

setSourceTransform(sourceName, x, y, alignment, useScale).catch(error => {
  console.error('Error in main function:', error);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting from OBS WebSocket...');
  if (obs.identified) {
    obs.disconnect();
  }
  process.exit(0);
});
