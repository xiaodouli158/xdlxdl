/**
 * Utilities for handling multi-platform login functionality
 */
import { loadDouyinUserData } from './douyinLoginUtils';

/**
 * Load user data based on selected platform
 * @param {string} platform - The selected platform
 * @returns {Object|null} User data or null if not found
 */
export const loadPlatformUserData = (platform) => {
  try {
    switch (platform) {
      case '抖音':
        return loadDouyinUserData();
      case 'Bilibili':
        // 从本地存储加载B站用户数据
        const bilibiliData = localStorage.getItem('bilibiliAuth');
        return bilibiliData ? JSON.parse(bilibiliData) : null;
      default:
        console.warn(`Unsupported platform: ${platform}`);
        return null;
    }
  } catch (error) {
    console.error(`Failed to load ${platform} user data:`, error);
    return null;
  }
};

/**
 * Check if user is logged in for the specified platform
 * @param {string} platform - The platform to check
 * @returns {boolean} Whether the user is logged in
 */
export const isPlatformLoggedIn = (platform) => {
  const userData = loadPlatformUserData(platform);
  return !!userData;
};

/**
 * Clear user data for the specified platform
 * @param {string} platform - The platform to clear data for
 */
export const clearPlatformUserData = (platform) => {
  try {
    switch (platform) {
      case '抖音':
        // 导入并使用抖音的清除函数
        const { clearDouyinUserData } = require('./douyinLoginUtils');
        clearDouyinUserData();
        break;
      case 'Bilibili':
        // 清除B站用户数据
        localStorage.removeItem('bilibiliAuth');
        break;
      default:
        console.warn(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    console.error(`Failed to clear ${platform} user data:`, error);
  }
};
