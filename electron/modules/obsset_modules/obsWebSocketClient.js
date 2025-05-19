/**
 * OBS WebSocket Client
 *
 * This module provides a shared OBS WebSocket client instance.
 * It ensures that only one connection is established to OBS WebSocket server.
 */

import OBSWebSocket from 'obs-websocket-js';
import { ensureAndConnectToOBS } from '../obsWebSocketHandlers.js';

// Shared OBS WebSocket client instance
let obsWebSocketClient = null;

/**
 * Get the shared OBS WebSocket client instance
 * If the client doesn't exist, it creates a new one
 * @returns {OBSWebSocket} The shared OBS WebSocket client instance
 */
function getOBSWebSocketClient() {
  if (!obsWebSocketClient) {
    obsWebSocketClient = new OBSWebSocket();
  }
  return obsWebSocketClient;
}

/**
 * Connect to OBS WebSocket server
 * If already connected, it returns the existing connection
 * @param {Object} connectionParams - Connection parameters
 * @param {string} connectionParams.address - WebSocket address
 * @param {string} connectionParams.password - WebSocket password
 * @returns {Promise<Object>} Result of the connection
 */
async function connectToOBS(connectionParams = {}) {
  try {
    // Get the shared client
    const obs = getOBSWebSocketClient();

    // If already connected, return success
    if (obs.identified) {
      console.log('Already connected to OBS WebSocket server');
      return {
        success: true,
        message: 'Already connected to OBS WebSocket server'
      };
    }

    // Use the ensureAndConnectToOBS function from obsWebSocketHandlers.js
    // This function handles all the connection logic, including checking if OBS is running

    // 打印连接参数，用于调试
    console.log('连接参数:', connectionParams);

    // 确保地址格式正确
    let address = '';
    if (connectionParams.address) {
      // 移除 'ws://' 前缀（如果存在）
      address = connectionParams.address.replace(/^ws:\/\//, '');
      console.log('处理后的地址:', address);
    }

    const result = await ensureAndConnectToOBS(
      address,
      connectionParams.password || ''
    );

    return result;
  } catch (error) {
    console.error('Error connecting to OBS WebSocket server:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to connect to OBS WebSocket server'
    };
  }
}

/**
 * Disconnect from OBS WebSocket server
 * @returns {Promise<Object>} Result of the disconnection
 */
async function disconnectFromOBS() {
  try {
    // Get the shared client
    const obs = getOBSWebSocketClient();

    // If not connected, return success
    if (!obs.identified) {
      console.log('Not connected to OBS WebSocket server');
      return {
        success: true,
        message: 'Not connected to OBS WebSocket server'
      };
    }

    // Disconnect
    await obs.disconnect();
    console.log('Disconnected from OBS WebSocket server');

    return {
      success: true,
      message: 'Disconnected from OBS WebSocket server'
    };
  } catch (error) {
    console.error('Error disconnecting from OBS WebSocket server:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to disconnect from OBS WebSocket server'
    };
  }
}

// Export functions
export {
  getOBSWebSocketClient,
  connectToOBS,
  disconnectFromOBS
};
