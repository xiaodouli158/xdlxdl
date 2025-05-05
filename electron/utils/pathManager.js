/**
 * Path Manager - Centralized path management for the application
 * 
 * This module provides standardized access to application paths using Electron's
 * app.getPath() API to ensure consistent path handling across different platforms
 * and installation locations.
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

// Promisify fs functions
const fsAccess = promisify(fs.access);
const fsMkdir = promisify(fs.mkdir);

/**
 * Path types enum
 * @readonly
 * @enum {string}
 */
export const PathType = {
  // User data paths (stored in standard user data directory)
  USER_DATA: 'userData',           // Base user data directory
  COOKIES: 'cookies',              // Browser cookies
  LOCAL_STATE: 'localState',       // Browser local state
  WEBSTORE: 'webstore',            // Web store directory
  USER_STORE: 'userStore',         // User store file
  ROOM_STORE: 'roomStore',         // Room store file
  HOTKEY_STORE: 'hotkeyStore',     // Hotkey configuration
  DOUYIN_COOKIES: 'douyinCookies', // Douyin cookies file
  
  // Application paths (relative to the application directory)
  APP_DATA: 'appData',             // Application data directory
  MODULES: 'modules',              // Modules directory
  TEMP: 'temp',                    // Temporary files
  LOGS: 'logs',                    // Log files
  
  // External application paths
  OBS_CONFIG: 'obsConfig',         // OBS WebSocket configuration
};

/**
 * Get the path for a specific path type
 * @param {string} pathType - The type of path to get (use PathType enum)
 * @returns {string} The resolved path
 */
export function getPath(pathType) {
  // Base paths
  const userData = app.getPath('userData');
  const appPath = app.getAppPath();
  const tempPath = app.getPath('temp');
  const logsPath = app.getPath('logs');
  
  // Web store directory within user data
  const webStoreDir = path.join(userData, 'WBStore');
  
  // Network directory within user data
  const networkDir = path.join(userData, 'Network');
  
  // Modules directory within app
  const modulesDir = path.join(appPath, 'electron', 'modules');
  
  // Temporary directory for the app
  const appTempDir = path.join(tempPath, 'webcast_mate');
  
  // Map path types to actual paths
  const pathMap = {
    // User data paths
    [PathType.USER_DATA]: userData,
    [PathType.COOKIES]: path.join(networkDir, 'Cookies'),
    [PathType.LOCAL_STATE]: path.join(userData, 'Local State'),
    [PathType.WEBSTORE]: webStoreDir,
    [PathType.USER_STORE]: path.join(webStoreDir, 'userStore.json'),
    [PathType.ROOM_STORE]: path.join(webStoreDir, 'roomStore.json'),
    [PathType.HOTKEY_STORE]: path.join(webStoreDir, 'hotkeyStore.json'),
    [PathType.DOUYIN_COOKIES]: path.join(modulesDir, 'douyin_cookies.txt'),
    
    // Application paths
    [PathType.APP_DATA]: appPath,
    [PathType.MODULES]: modulesDir,
    [PathType.TEMP]: appTempDir,
    [PathType.LOGS]: logsPath,
    
    // External application paths
    [PathType.OBS_CONFIG]: path.join(app.getPath('appData'), 'obs-studio', 'plugin_config', 'obs-websocket', 'config.json'),
  };
  
  return pathMap[pathType] || '';
}

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dirPath - The directory path to ensure
 * @returns {Promise<boolean>} True if the directory exists or was created
 */
export async function ensureDir(dirPath) {
  try {
    await fsAccess(dirPath, fs.constants.F_OK);
    return true;
  } catch (error) {
    // Directory doesn't exist, create it
    try {
      await fsMkdir(dirPath, { recursive: true });
      return true;
    } catch (createError) {
      console.error(`Failed to create directory ${dirPath}:`, createError);
      return false;
    }
  }
}

/**
 * Initialize all required directories
 * @returns {Promise<boolean>} True if all directories were initialized successfully
 */
export async function initializePaths() {
  try {
    // Ensure all necessary directories exist
    const dirsToEnsure = [
      path.dirname(getPath(PathType.COOKIES)),
      getPath(PathType.WEBSTORE),
      getPath(PathType.TEMP),
      getPath(PathType.LOGS),
      path.dirname(getPath(PathType.DOUYIN_COOKIES))
    ];
    
    // Create all directories
    for (const dir of dirsToEnsure) {
      await ensureDir(dir);
    }
    
    console.log('All application directories initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize application directories:', error);
    return false;
  }
}

/**
 * Get the path for a file within a specific directory
 * @param {string} basePathType - The base path type (use PathType enum)
 * @param {string} fileName - The file name to append to the base path
 * @returns {string} The resolved file path
 */
export function getFilePath(basePathType, fileName) {
  const basePath = getPath(basePathType);
  return path.join(basePath, fileName);
}

// Export default object for easier imports
export default {
  PathType,
  getPath,
  ensureDir,
  initializePaths,
  getFilePath
};
