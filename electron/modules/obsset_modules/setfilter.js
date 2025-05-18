/**
 * OBS WebSocket - Add Scale/Aspect Ratio and Crop Filters to Video Capture Device
 *
 * This script adds "Scale/Aspect Ratio" and "Crop/Pad" filters to a video capture device source in OBS:
 * 1. Connects to OBS WebSocket
 * 2. Gets the video capture device source
 * 3. Gets the current resolution of the device
 * 4. Calculates the aspect ratio
 * 5. Adds a "Scale/Aspect Ratio" filter with appropriate settings based on the aspect ratio:
 *    - If aspect ratio > 16/9, scale based on width
 *    - If aspect ratio <= 16/9, scale based on height
 * 6. Adds a "Crop/Pad" filter with appropriate settings based on the same calculation
 */

// Import the OBS WebSocket library
import OBSWebSocket from 'obs-websocket-js';
import os from 'os';

// Create a new instance of the OBS WebSocket client
const obs = new OBSWebSocket();

// Connection parameters - adjust these as needed
const connectionParams = {
  address: 'ws://localhost:4455', // Default OBS WebSocket address and port
  password: 'OwuWIvIyVGFwcL01', // OBS WebSocket password (change if needed)
};

// Source name for the video capture device
const sourceName = '视频采集设备'; // "Video Capture Device" in Chinese
const scaleFilterName = '缩放/宽高比'; // "Scale/Aspect Ratio" in Chinese
const scaleFilterKind = 'scale_filter'; // Filter kind for Scale/Aspect Ratio
const cropFilterName = '裁剪/填充'; // "Crop/Pad" in Chinese
const cropFilterKind = 'crop_filter'; // Filter kind for Crop/Pad
const colorFilterName = '色彩校正'; // "Color Correction" in Chinese
const colorFilterKind = 'color_filter_v2'; // Filter kind for Color Correction
const lutFilterName = '应用 LUT'; // "Apply LUT" in Chinese
const lutFilterKind = 'clut_filter'; // Filter kind for Apply LUT
const sharpnessFilterName = '锐化'; // "Sharpness" in Chinese
const sharpnessFilterKind = 'sharpness_filter_v2'; // Filter kind for Sharpness

// Color correction filter settings
const colorFilterSettings = {
  brightness: 0.0000,
  contrast: 0.20,
  gamma: -0.13,
  hue_shift: 0.00,
  saturation: 0.30
};

// LUT filter settings
const lutFilterSettings = {
  image_path: 'C:/Program Files/obs-studio/data/obs-plugins/obs-filters/LUTs/original.cube'
};

// Sharpness filter settings
const sharpnessFilterSettings = {
  sharpness: 0.16
};

// Register event handlers
obs.on('ConnectionOpened', () => {
  console.log('Event: Connection to OBS WebSocket server opened');
});

obs.on('ConnectionClosed', () => {
  console.log('Event: Connection to OBS WebSocket server closed');
});

obs.on('ConnectionError', (err) => {
  console.error('Event: Connection to OBS WebSocket server failed:', err);
});

/**
 * Get the appropriate input kind for video capture devices based on OS
 * @returns {string} The input kind for video capture devices
 */
function getVideoCaptureInputKind() {
  const platform = os.platform();
  if (platform === 'win32') {
    return 'dshow_input';
  } else if (platform === 'darwin') {
    return 'avfoundation_input';
  } else {
    return 'v4l2_input'; // Linux
  }
}

/**
 * Get the resolution of a video capture device
 * @param {string} inputName - The name of the input source
 * @returns {Promise<{width: number, height: number}>} The resolution of the device
 */
async function getDeviceResolution(inputName) {
  try {
    // Get the current settings of the input
    const { inputSettings } = await obs.call('GetInputSettings', {
      inputName: inputName
    });

    // Check if resolution is directly available in settings
    if (inputSettings.resolution && typeof inputSettings.resolution === 'string') {
      const [width, height] = inputSettings.resolution.split('x').map(Number);
      return { width, height };
    }

    // If resolution is not directly available, try to get it from available resolutions
    const resolutionResponse = await obs.call('GetInputPropertiesListPropertyItems', {
      inputName: inputName,
      propertyName: 'resolution'
    });

    const resolutions = resolutionResponse.propertyItems || [];

    // If there are available resolutions, use the active one
    if (resolutions.length > 0) {
      // Find the active resolution (the one that matches the current settings)
      const activeResolution = resolutions.find(res => res.itemEnabled) || resolutions[0];
      const [width, height] = activeResolution.itemValue.split('x').map(Number);
      return { width, height };
    }

    // If we can't determine the resolution, use a default
    console.log('Could not determine device resolution, using default 1280x720');
    return { width: 1280, height: 720 };
  } catch (error) {
    console.error('Error getting device resolution:', error);
    // Return a default resolution if there's an error
    return { width: 1280, height: 720 };
  }
}


/**
 * Calculate scaling and cropping values based on aspect ratio
 * @param {number} width - The width of the source
 * @param {number} height - The height of the source
 * @returns {Object} Object containing scaling and cropping values
 */
function calculateScalingAndCropping(width, height) {
  // Calculate aspect ratio
  const aspectRatio = width / height;
  const standardRatio = 16 / 9; // 16:9 aspect ratio

  console.log(`Device resolution: ${width}x${height}`);
  console.log(`Device aspect ratio: ${aspectRatio.toFixed(3)}`);
  console.log(`Standard aspect ratio (16:9): ${standardRatio.toFixed(3)}`);

  let scaleWidth, scaleHeight, cropLeft, cropRight, cropTop, cropBottom;

  // Determine scaling based on aspect ratio comparison
  if (aspectRatio > standardRatio) {
    // If wider than 16:9, scale based on width
    console.log('Device is wider than 16:9, scaling based on width');
    scaleWidth = width;
    scaleHeight = Math.round(width / standardRatio);

    // Calculate crop values (crop top and bottom)
    cropLeft = 0;
    cropRight = 0;
    const cropVertical = Math.round((scaleHeight - height) / 2);
    cropTop = cropVertical;
    cropBottom = cropVertical;
  } else {
    // If narrower than or equal to 16:9, scale based on height
    console.log('Device is narrower than or equal to 16:9, scaling based on height');
    scaleHeight = height;
    scaleWidth = Math.round(height * standardRatio);

    // Calculate crop values (crop left and right)
    cropTop = 0;
    cropBottom = 0;
    const cropHorizontal = Math.round((scaleWidth - width) / 2);
    cropLeft = cropHorizontal;
    cropRight = cropHorizontal;
  }

  console.log(`Scale resolution: ${scaleWidth}x${scaleHeight}`);
  console.log(`Crop values: Left=${cropLeft}, Right=${cropRight}, Top=${cropTop}, Bottom=${cropBottom}`);

  return {
    scaleWidth,
    scaleHeight,
    cropLeft,
    cropRight,
    cropTop,
    cropBottom
  };
}

/**
 * Add or update a Scale/Aspect Ratio filter to a source
 * @param {string} sourceName - The name of the source
 * @param {string} filterName - The name of the filter
 * @param {number} width - The width of the source
 * @param {number} height - The height of the source
 * @returns {Promise<void>}
 */
async function addScaleFilter(sourceName, filterName, width, height) {
  try {
    // Calculate scaling values
    const { scaleWidth, scaleHeight } = calculateScalingAndCropping(width, height);

    // Check if the filter already exists
    const { filters } = await obs.call('GetSourceFilterList', {
      sourceName: sourceName
    });

    const existingFilter = filters.find(filter => filter.filterName === filterName);

    if (existingFilter) {
      // Update existing filter
      console.log(`Updating existing filter: ${filterName}`);
      await obs.call('SetSourceFilterSettings', {
        sourceName: sourceName,
        filterName: filterName,
        filterSettings: {
          resolution: `${scaleWidth}x${scaleHeight}`
        }
      });
    } else {
      // Create Scale filter
      console.log(`Creating new filter: ${filterName}`);
      await obs.call('CreateSourceFilter', {
        sourceName: sourceName,
        filterName: filterName,
        filterKind: scaleFilterKind,
        filterSettings: {
          resolution: `${scaleWidth}x${scaleHeight}`
        }
      });
    }

    console.log(`Successfully applied ${filterName} filter to ${sourceName}`);
  } catch (error) {
    console.error(`Error adding/updating scale filter:`, error);
  }
}

/**
 * Add or update a Crop/Pad filter to a source
 * @param {string} sourceName - The name of the source
 * @param {string} filterName - The name of the filter
 * @param {number} width - The width of the source
 * @param {number} height - The height of the source
 * @returns {Promise<void>}
 */
async function addCropFilter(sourceName, filterName, width, height) {
  try {
    // Calculate crop values
    const { cropLeft, cropRight, cropTop, cropBottom } = calculateScalingAndCropping(width, height);

    // Check if the filter already exists
    const { filters } = await obs.call('GetSourceFilterList', {
      sourceName: sourceName
    });

    const existingFilter = filters.find(filter => filter.filterName === filterName);

    if (existingFilter) {
      // Update existing filter
      console.log(`Updating existing filter: ${filterName}`);
      await obs.call('SetSourceFilterSettings', {
        sourceName: sourceName,
        filterName: filterName,
        filterSettings: {
          left: cropLeft,
          right: cropRight,
          top: cropTop,
          bottom: cropBottom
        }
      });
    } else {
      // Create Crop filter
      console.log(`Creating new filter: ${filterName}`);
      await obs.call('CreateSourceFilter', {
        sourceName: sourceName,
        filterName: filterName,
        filterKind: cropFilterKind,
        filterSettings: {
          left: cropLeft,
          right: cropRight,
          top: cropTop,
          bottom: cropBottom
        }
      });
    }

    console.log(`Successfully applied ${filterName} filter to ${sourceName}`);
  } catch (error) {
    console.error(`Error adding/updating crop filter:`, error);
  }
}

/**
 * Add or update a Color Correction filter to a source
 * @param {string} sourceName - The name of the source
 * @param {string} filterName - The name of the filter
 * @returns {Promise<void>}
 */
async function addColorCorrectionFilter(sourceName, filterName) {
  try {
    // Check if the filter already exists
    const { filters } = await obs.call('GetSourceFilterList', {
      sourceName: sourceName
    });

    const existingFilter = filters.find(filter => filter.filterName === filterName);

    if (existingFilter) {
      // Update existing filter
      console.log(`Updating existing filter: ${filterName}`);
      await obs.call('SetSourceFilterSettings', {
        sourceName: sourceName,
        filterName: filterName,
        filterSettings: colorFilterSettings
      });
    } else {
      // Create Color Correction filter
      console.log(`Creating new filter: ${filterName}`);
      await obs.call('CreateSourceFilter', {
        sourceName: sourceName,
        filterName: filterName,
        filterKind: colorFilterKind,
        filterSettings: colorFilterSettings
      });
    }

    console.log(`Successfully applied ${filterName} filter to ${sourceName}`);
  } catch (error) {
    console.error(`Error adding/updating color correction filter:`, error);
  }
}

/**
 * Add or update a LUT filter to a source
 * @param {string} sourceName - The name of the source
 * @param {string} filterName - The name of the filter
 * @returns {Promise<void>}
 */
async function addLUTFilter(sourceName, filterName) {
  try {
    // Check if the filter already exists
    const { filters } = await obs.call('GetSourceFilterList', {
      sourceName: sourceName
    });

    const existingFilter = filters.find(filter => filter.filterName === filterName);

    if (existingFilter) {
      // Update existing filter
      console.log(`Updating existing filter: ${filterName}`);
      await obs.call('SetSourceFilterSettings', {
        sourceName: sourceName,
        filterName: filterName,
        filterSettings: lutFilterSettings
      });
    } else {
      // Create LUT filter
      console.log(`Creating new filter: ${filterName}`);
      await obs.call('CreateSourceFilter', {
        sourceName: sourceName,
        filterName: filterName,
        filterKind: lutFilterKind,
        filterSettings: lutFilterSettings
      });
    }

    console.log(`Successfully applied ${filterName} filter to ${sourceName}`);
  } catch (error) {
    console.error(`Error adding/updating LUT filter:`, error);
  }
}

/**
 * Add or update a Sharpness filter to a source
 * @param {string} sourceName - The name of the source
 * @param {string} filterName - The name of the filter
 * @returns {Promise<void>}
 */
async function addSharpnessFilter(sourceName, filterName) {
  try {
    // Check if the filter already exists
    const { filters } = await obs.call('GetSourceFilterList', {
      sourceName: sourceName
    });

    const existingFilter = filters.find(filter => filter.filterName === filterName);

    if (existingFilter) {
      // Update existing filter
      console.log(`Updating existing filter: ${filterName}`);
      await obs.call('SetSourceFilterSettings', {
        sourceName: sourceName,
        filterName: filterName,
        filterSettings: sharpnessFilterSettings
      });
    } else {
      // Create Sharpness filter
      console.log(`Creating new filter: ${filterName}`);
      await obs.call('CreateSourceFilter', {
        sourceName: sourceName,
        filterName: filterName,
        filterKind: sharpnessFilterKind,
        filterSettings: sharpnessFilterSettings
      });
    }

    console.log(`Successfully applied ${filterName} filter to ${sourceName}`);
  } catch (error) {
    console.error(`Error adding/updating sharpness filter:`, error);
  }
}

/**
 * Main function to add all filters to video capture device
 */
async function addFiltersToVideoCaptureDevice() {
  try {
    // Connect to OBS WebSocket with timeout
    console.log('Connecting to OBS WebSocket...');
    console.log(`Address: ${connectionParams.address}`);
    console.log(`Password: ${connectionParams.password ? '(set)' : '(not set)'}`);

    const connectPromise = obs.connect(connectionParams.address, connectionParams.password);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
    });

    await Promise.race([connectPromise, timeoutPromise]);
    console.log('Successfully connected to OBS WebSocket!');

    // Get OBS version
    const { obsVersion } = await obs.call('GetVersion');
    console.log(`OBS Studio Version: ${obsVersion}`);

    // Check if the video capture device source exists
    const { inputs } = await obs.call('GetInputList');
    const videoCaptureInputKind = getVideoCaptureInputKind();

    console.log(`Using input kind for video capture: ${videoCaptureInputKind}`);

    // Find if our source already exists
    const existingSource = inputs.find(input =>
      input.inputName === sourceName && input.inputKind === videoCaptureInputKind
    );

    if (!existingSource) {
      console.error(`Video capture device source "${sourceName}" not found`);
      return;
    }

    console.log(`Found video capture device source: ${sourceName}`);

    // Get the resolution of the device
    const { width, height } = await getDeviceResolution(sourceName);

    // Add or update the scale filter
    await addScaleFilter(sourceName, scaleFilterName, width, height);

    // Add or update the crop filter
    await addCropFilter(sourceName, cropFilterName, width, height);

    // Add or update the color correction filter
    await addColorCorrectionFilter(sourceName, colorFilterName);

    // Add or update the LUT filter
    await addLUTFilter(sourceName, lutFilterName);

    // Add or update the sharpness filter
    await addSharpnessFilter(sourceName, sharpnessFilterName);

    console.log('All filters applied successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect when done
    try {
      obs.disconnect();
      console.log('Disconnected from OBS WebSocket');
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError.message);
    }
  }
}

// Run the main function
addFiltersToVideoCaptureDevice();
