/**
 * Direct PowerShell method to close OBS from Node.js
 * This script doesn't require the batch file and directly uses PowerShell commands
 */

const { exec } = require('child_process');

/**
 * Function to check if OBS is running
 * @returns {Promise<boolean>} Promise that resolves to true if OBS is running
 */
function isOBSRunning() {
  return new Promise((resolve) => {
    exec('powershell -command "Get-Process obs64 -ErrorAction SilentlyContinue"', (error) => {
      // If there's an error, OBS is not running
      resolve(!error);
    });
  });
}

/**
 * Function to gracefully close OBS
 * @returns {Promise} Promise that resolves when the command completes
 */
function closeOBSGracefully() {
  return new Promise((resolve, reject) => {
    exec('powershell -command "Get-Process obs64 | ForEach-Object { $_.CloseMainWindow() }"', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Function to force close OBS
 * @returns {Promise} Promise that resolves when the command completes
 */
function forceCloseOBS() {
  return new Promise((resolve, reject) => {
    exec('powershell -command "Get-Process obs64 -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Main function to close OBS
 * @returns {Promise} Promise that resolves when OBS is closed
 */
async function closeOBS() {
  console.log('Checking if OBS is running...');
  const running = await isOBSRunning();
  
  if (!running) {
    console.log('OBS is not running. No action needed.');
    return { status: 'not_running' };
  }
  
  console.log('OBS is running. Attempting to close it gracefully...');
  await closeOBSGracefully();
  
  // Wait a moment for OBS to close
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check if OBS is still running
  console.log('Checking if OBS is still running...');
  const stillRunning = await isOBSRunning();
  
  if (stillRunning) {
    console.log('OBS is still running. Forcing it to close...');
    await forceCloseOBS();
    return { status: 'force_closed' };
  } else {
    console.log('OBS has been closed gracefully.');
    return { status: 'gracefully_closed' };
  }
}

// If this script is run directly (not imported as a module)
if (require.main === module) {
  closeOBS()
    .then((result) => {
      console.log(`OBS close operation completed with status: ${result.status}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to close OBS:', error);
      process.exit(1);
    });
}

// Export the function so it can be used in other Node.js scripts
module.exports = { closeOBS, isOBSRunning };
