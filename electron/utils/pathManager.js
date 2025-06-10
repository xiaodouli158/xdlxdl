/**
 * Path Manager - Centralized path management for the application
 *
 * This module provides standardized access to application paths using Electron's
 * app.getPath() API to ensure consistent path handling across different platforms
 * and installation locations.
 */

import pkg from 'electron';
const { app } = pkg;
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
  WEBSTORE: 'webstore',            // Web store directory
  DOUYIN_COOKIES: 'douyinCookies', // Douyin cookies file

  // Application paths (relative to the application directory)
  APP_DATA: 'appData',             // Application data directory
  MODULES: 'modules',              // Modules directory
  TEMP: 'temp',                    // Temporary files
  LOGS: 'logs',                    // Log files
};

/**
 * Get the path for a specific path type
 * @param {string} pathType - The type of path to get (use PathType enum)
 * @returns {string} The resolved path
 */
export function getPath(pathType) {
  // Check if we're in an Electron environment
  if (!app || typeof app.getPath !== 'function') {
    console.warn('pathManager: Not in Electron environment, returning empty path');
    return '';
  }

  // Base paths
  const userData = app.getPath('userData');
  const appPath = app.getAppPath();
  const tempPath = app.getPath('temp');
  const logsPath = app.getPath('logs');

  // Web store directory within user data
  const webStoreDir = path.join(userData, 'WBStore');

  // Modules directory within app
  // 在开发环境和生产环境中，modulesDir 的路径可能不同
  // 在开发环境中，它是 app.getAppPath() + '/electron/modules'
  // 在生产环境中，它是 app.getAppPath() + '/resources/app/electron/modules' 或类似路径
  let modulesDir;
  if (app.isPackaged) {
    // 生产环境 - 使用相对于可执行文件的路径
    modulesDir = path.join(path.dirname(app.getPath('exe')), 'resources', 'app', 'electron', 'modules');
  } else {
    // 开发环境
    modulesDir = path.join(appPath, 'electron', 'modules');
  }

  // Temporary directory for the app
  const appTempDir = path.join(tempPath, 'webcast_mate');

  // Map path types to actual paths
  const pathMap = {
    // User data paths
    [PathType.USER_DATA]: userData,
    [PathType.WEBSTORE]: webStoreDir,
    // 将 DOUYIN_COOKIES 保存到用户数据目录的 Network 目录中，文件名为 Network_cookies
    [PathType.DOUYIN_COOKIES]: path.join(userData, 'Network', 'Network_cookies'),

    // Application paths
    [PathType.APP_DATA]: appPath,
    [PathType.MODULES]: modulesDir,
    [PathType.TEMP]: appTempDir,
    [PathType.LOGS]: logsPath,
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
    // Check if we're in an Electron environment
    if (!app || typeof app.getPath !== 'function') {
      console.warn('pathManager: Not in Electron environment, skipping path initialization');
      return false;
    }

    // 打印环境信息，便于调试
    console.log('Application environment:');
    console.log(`- app.isPackaged: ${app.isPackaged}`);
    console.log(`- app.getAppPath(): ${app.getAppPath()}`);
    console.log(`- app.getPath('userData'): ${app.getPath('userData')}`);
    console.log(`- app.getPath('temp'): ${app.getPath('temp')}`);
    console.log(`- app.getPath('logs'): ${app.getPath('logs')}`);

    // 打印所有路径，便于调试
    console.log('Application paths:');
    for (const type in PathType) {
      console.log(`- ${type}: ${getPath(PathType[type])}`);
    }

    // Ensure all necessary directories exist
    const dirsToEnsure = [
      getPath(PathType.WEBSTORE),
      getPath(PathType.TEMP),
      getPath(PathType.LOGS),
      path.dirname(getPath(PathType.DOUYIN_COOKIES)) // Network 目录
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
