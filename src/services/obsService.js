/**
 * OBS Service - Handles OBS integration and WebSocket communication
 */

class OBSService {
  constructor() {
    this.obsVersion = null;
    this.companionVersion = null;
    this.isConnected = false;
    this.websocket = null;
  }

  /**
   * Connect to OBS via WebSocket
   * @param {string} address - WebSocket address (default: localhost:4455)
   * @param {string} password - WebSocket password (if required)
   * @returns {Promise<boolean>} Connection success
   */
  async connectToOBS(address = 'localhost:4455', password = '') {
    try {
      if (window.electron) {
        // This would be implemented in the preload script
        const result = await window.electron.connectToOBS(address, password);
        this.isConnected = result.success;
        return result.success;
      }

      // Mock connection for development
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to OBS:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Check if OBS WebSocket is enabled and configure if needed
   * @returns {Promise<boolean>} Success status
   */
  async ensureWebSocketEnabled() {
    try {
      if (window.electron) {
        return await window.electron.ensureOBSWebSocketEnabled();
      }

      // Mock success for development
      return true;
    } catch (error) {
      console.error('Failed to ensure OBS WebSocket is enabled:', error);
      return false;
    }
  }

  /**
   * Configure OBS stream settings
   * @param {string} streamUrl - Stream URL
   * @param {string} streamKey - Stream key
   * @returns {Promise<boolean>} Success status
   */
  async configureStreamSettings(streamUrl, streamKey) {
    try {
      if (!this.isConnected) {
        await this.connectToOBS();
      }

      if (window.electron) {
        return await window.electron.setOBSStreamSettings(streamUrl, streamKey);
      }

      // Mock success for development
      console.log('Configured OBS with:', { streamUrl, streamKey: '***' });
      return true;
    } catch (error) {
      console.error('Failed to configure OBS stream settings:', error);
      return false;
    }
  }

  /**
   * Start streaming in OBS
   * @returns {Promise<boolean>} Success status
   */
  async startStreaming() {
    try {
      if (!this.isConnected) {
        await this.connectToOBS();
      }

      if (window.electron) {
        return await window.electron.startOBSStreaming();
      }

      // Mock success for development
      console.log('Started OBS streaming');
      return true;
    } catch (error) {
      console.error('Failed to start OBS streaming:', error);
      return false;
    }
  }

  /**
   * Stop streaming in OBS
   * @returns {Promise<boolean>} Success status
   */
  async stopStreaming() {
    try {
      if (!this.isConnected) {
        return false;
      }

      if (window.electron) {
        return await window.electron.stopOBSStreaming();
      }

      // Mock success for development
      console.log('Stopped OBS streaming');
      return true;
    } catch (error) {
      console.error('Failed to stop OBS streaming:', error);
      return false;
    }
  }
}

// Create singleton instance
const obsService = new OBSService();
export default obsService;
