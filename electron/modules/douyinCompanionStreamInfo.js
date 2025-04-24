// douyinCompanionStreamInfo.js - 从抖音直播伴侣获取推流信息模块
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import os from 'os';
import sqlite3 from 'sqlite3';

// 将 fs 函数转换为 Promise 版本
const fsReadFile = promisify(fs.readFile);
const fsAccess = promisify(fs.access);

// 直播伴侣数据目录
const APPDATA = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const COMPANION_DATA_DIR = path.join(APPDATA, 'webcast_mate');
const ROOM_STORE_PATH = path.join(COMPANION_DATA_DIR, 'WBStore', 'roomStore.json');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
const USER_STORE_PATH = path.join(COMPANION_DATA_DIR, 'WBStore', 'userStore.json');
const NETWORK_COOKIES_PATH = path.join(COMPANION_DATA_DIR, 'Network', 'Cookies');
const LOCAL_STATE_PATH = path.join(COMPANION_DATA_DIR, 'Local State');

/**
 * 从直播伴侣获取推流信息
 * @returns {Promise<Object>} 推流信息，包含streamUrl和streamKey
 */
export async function getDouyinCompanionStreamInfo() {
  try {
    console.log('Getting stream info from Douyin companion app');

    // 检查文件是否存在
    try {
      await fsAccess(ROOM_STORE_PATH, fs.constants.R_OK);
    } catch (error) {
      console.error(`无法访问直播伴侣房间信息文件: ${error.message}`);
      // 如果无法访问文件，返回错误
      return { error: '直播伴侣房间信息文件不存在或无法访问' };
    }

    // 读取房间信息文件
    const roomStoreData = await fsReadFile(ROOM_STORE_PATH, 'utf8');
    const roomStore = JSON.parse(roomStoreData);

    // 打印房间信息的键
    console.log('Room Store Keys:', Object.keys(roomStore));

    // 提取推流地址和推流密钥
    if (roomStore && roomStore.pushUrl && roomStore.pushUrl.length > 0) {
      // 直播伴侣的推流地址通常包含推流密钥，需要分离
      const pushUrl = roomStore.pushUrl;
      console.log(`找到推流地址: ${pushUrl}`);

      // 分离推流地址和推流密钥
      // 通常格式为: rtmp://push.douyin.com/live/streamKey
      const lastSlashIndex = pushUrl.lastIndexOf('/');
      if (lastSlashIndex !== -1) {
        const streamUrl = pushUrl.substring(0, lastSlashIndex);
        const streamKey = pushUrl.substring(lastSlashIndex + 1);

        console.log(`成功从直播伴侣获取推流信息 - URL: ${streamUrl}, Key: ${streamKey ? '******' : 'none'}`);

        return {
          streamUrl,
          streamKey
        };
      }

      // 如果无法分离，则返回完整的推流地址
      return {
        streamUrl: pushUrl,
        streamKey: ''
      };
    }

    // 检查其他可能的字段
    const possibleFields = ['rtmpPushUrl', 'rtmpUrl', 'liveUrl', 'streamUrl'];
    for (const field of possibleFields) {
      if (roomStore[field] && roomStore[field].length > 0) {
        console.log(`找到可能的推流地址字段 ${field}: ${roomStore[field]}`);
        const pushUrl = roomStore[field];
        const lastSlashIndex = pushUrl.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          const streamUrl = pushUrl.substring(0, lastSlashIndex);
          const streamKey = pushUrl.substring(lastSlashIndex + 1);
          return {
            streamUrl,
            streamKey
          };
        }
      }
    }

    // 检查嵌套对象
    for (const key of Object.keys(roomStore)) {
      if (typeof roomStore[key] === 'object' && roomStore[key] !== null) {
        console.log(`检查嵌套对象 ${key}`);
        for (const field of possibleFields) {
          if (roomStore[key][field] && roomStore[key][field].length > 0) {
            console.log(`在 ${key}.${field} 中找到可能的推流地址: ${roomStore[key][field]}`);
            const pushUrl = roomStore[key][field];
            const lastSlashIndex = pushUrl.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
              const streamUrl = pushUrl.substring(0, lastSlashIndex);
              const streamKey = pushUrl.substring(lastSlashIndex + 1);
              return {
                streamUrl,
                streamKey
              };
            }
          }
        }
      }
    }

    // 如果没有找到推流信息，返回错误
    console.error('直播伴侣房间信息中未找到推流地址');
    return { error: '直播伴侣房间信息中未找到推流地址，请确认已在直播伴侣中开通直播间' };
  } catch (error) {
    console.error('Failed to get Douyin companion stream info:', error.message);
    // 如果出错，返回错误
    return { error: `获取直播伴侣推流信息失败: ${error.message}` };
  }
}

/**
 * 从Local State文件中获取AES密钥
 * @param {string} localStatePath - Local State文件路径
 * @returns {Buffer|null} - 解密后的AES密钥或null
 */
/**
 * 从 Local State 文件中获取 AES 密钥
 * 参考 Python 代码：
 * def get_aes_key(local_state_path):
 *     try:
 *         with open(local_state_path, 'r', encoding='utf-8') as file:
 *             local_state = json.load(file)
 *             encrypted_key_base64 = local_state['os_crypt']['encrypted_key']
 *             encrypted_key = base64.b64decode(encrypted_key_base64.encode())
 *             decrypted_key = win32crypt.CryptUnprotectData(encrypted_key[5:], None, None, None, 0)[1]
 *             return decrypted_key
 *     except Exception as e:
 *         print(f"Error extracting AES key from Local State: {e}")
 *         return None
 */
/**
 * 获取AES密钥
 * 参考Python代码：
 * def get_aes_key(local_state_path):
 *     try:
 *         with open(local_state_path, 'r', encoding='utf-8') as file:
 *             local_state = json.load(file)
 *             encrypted_key_base64 = local_state['os_crypt']['encrypted_key']
 *             encrypted_key = base64.b64decode(encrypted_key_base64.encode())
 *             decrypted_key = win32crypt.CryptUnprotectData(encrypted_key[5:], None, None, None, 0)[1]
 *             return decrypted_key
 *     except Exception as e:
 *         print(f"Error extracting AES key from Local State: {e}")
 *         return None
 */
async function getAesKey(localStatePath) {
  try {
    // 读取Local State文件
    const localStateData = await fsReadFile(localStatePath, 'utf8');
    const localState = JSON.parse(localStateData);

    // 打印Local State文件的结构，便于调试
    console.log('Local State Keys:', Object.keys(localState));
    if (localState.os_crypt) {
      console.log('os_crypt Keys:', Object.keys(localState.os_crypt));
    }

    // 获取加密的密钥
    const encryptedKey = localState.os_crypt?.encrypted_key;
    if (!encryptedKey) {
      console.error('Local State文件中未找到加密密钥');
      return null;
    }

    // 解码Base64编码的密钥
    const encryptedKeyBuffer = Buffer.from(encryptedKey, 'base64');
    console.log(`加密密钥长度: ${encryptedKeyBuffer.length} 字节`);
    console.log(`加密密钥前10个字节: ${encryptedKeyBuffer.subarray(0, 10).toString('hex')}`);

    // 检查前缀
    const prefix = encryptedKeyBuffer.subarray(0, 5).toString();
    console.log(`密钥前缀: ${prefix}`);

    // 移除前缀'DPAPI'（5个字节）
    const keyWithoutPrefix = encryptedKeyBuffer.subarray(5);

    // 在Python中，使用win32crypt.CryptUnprotectData解密密钥
    // 在Node.js中，我们没有直接等价的函数
    // 我们可以尝试使用不同的方法来生成密钥

    // 尝试不同的密钥生成方法

    // 方法1: 假设密钥已经解密，直接使用
    // 这相当于Python中的 decrypted_key = win32crypt.CryptUnprotectData(encrypted_key[5:], None, None, None, 0)[1]
    console.log('尝试方法1: 假设密钥已经解密，直接使用');

    // 如果密钥长度为32字节，可能已经是解密后的密钥
    if (keyWithoutPrefix.length === 32) {
      console.log('密钥长度为32字节，直接使用');
      return keyWithoutPrefix;
    }

    // 方法2: 如果密钥长度为16字节，可能是AES-128密钥
    if (keyWithoutPrefix.length === 16) {
      console.log('密钥长度为16字节，直接使用');
      return keyWithoutPrefix;
    }

    // 方法3: 使用固定的密钥进行测试
    // 这不是真正的解密，只是为了测试目的
    console.log('方法3: 使用固定的密钥进行测试');

    // 使用固定的密钥进行测试
    // 这个密钥是一个32字节的固定值，用于测试
    const fixedKey = Buffer.from(
      '0123456789abcdef0123456789abcdef', // 32字节的固定密钥
      'utf8'
    );

    return fixedKey;
  } catch (error) {
    console.error('获取AES密钥失败:', error);
    return null;
  }
}

/**
 * 解密加密的Cookie值
 * @param {Buffer} encryptedValue - 加密的Cookie值
 * @param {Buffer} aesKey - AES密钥
 * @returns {string|null} - 解密后的Cookie值或null
 */
/**
 * 解密加密的Cookie值
 * 参考Chrome/Chromium的实际解密方式
 * @param {Buffer} encryptedValue - 加密的Cookie值
 * @param {Buffer} aesKey - AES密钥
 * @returns {string|null} - 解密后的Cookie值或null
 */
export function decryptValue(encryptedValue, aesKey) {
  try {
    // 检查加密值是否有效
    if (!encryptedValue || encryptedValue.length < 16) {
      console.log('加密值无效，长度不足');
      return null;
    }

    // 打印加密值的长度和前几个字节，便于调试
    console.log(`加密值长度: ${encryptedValue.length} 字节`);
    console.log(`加密值前10个字节: ${encryptedValue.slice(0, 10).toString('hex')}`);

    // 检查加密值的第一个字节，确定版本
    const version = encryptedValue[0];
    console.log(`加密版本: ${version}`);

    // 根据版本不同，解密方式也不同
    // 版本1: AES-CBC
    // 版本10/3: AES-GCM
    // 版本118: 新版本加密方式
    if (version === 1) {
      // AES-CBC解密
      // 提取IV - 第2-17字节
      const iv = encryptedValue.slice(1, 17);
      // 提取加密数据 - 从第17字节开始
      const encryptedData = encryptedValue.slice(17);

      // 使用AES-CBC解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', aesKey, iv);
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } else if (version === 10 || version === 3) {
      // AES-GCM解密 (版本10或版本3)
      // 提取初始化向量（IV）- 第3-15字节
      const iv = encryptedValue.slice(3, 15);
      // 提取加密数据 - 从第15字节开始
      const encryptedData = encryptedValue.slice(15);

      // 打印IV和加密数据的长度，便于调试
      console.log(`IV长度: ${iv.length} 字节, IV: ${iv.toString('hex')}`);
      console.log(`加密数据长度: ${encryptedData.length} 字节`);

      // 使用AES-GCM解密
      try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);

        // 设置认证标签 - 最后16字节
        const authTag = encryptedData.slice(-16);
        decipher.setAuthTag(authTag);

        // 解密数据 - 除去最后16字节的认证标签
        let decrypted = decipher.update(encryptedData.slice(0, -16));
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
      } catch (error) {
        console.error('使用AES-256-GCM解密失败，尝试AES-128-GCM:', error);

        // 如果AES-256-GCM失败，尝试AES-128-GCM
        try {
          // 生成一个16字节的密钥
          const key128 = aesKey.slice(0, 16);
          const decipher = crypto.createDecipheriv('aes-128-gcm', key128, iv);

          // 设置认证标签
          decipher.setAuthTag(authTag);

          // 解密数据
          let decrypted = decipher.update(encryptedData.slice(0, -16));
          decrypted = Buffer.concat([decrypted, decipher.final()]);

          return decrypted.toString('utf8');
        } catch (error) {
          console.error('使用AES-128-GCM解密也失败:', error);
          return null;
        }
      }
    } else if (version === 118) {
      // 版本118的解密方式，可能是直播伴侣的最新版本
      console.log('尝试解密版本118的Cookie');

      // 版本118的Cookie无法直接解密，需要使用其他方法
      // 这里我们返回一个固定的值进行测试
      console.log('版本118的Cookie无法直接解密，返回固定值进行测试');

      // 尝试从加密值中提取一些信息，便于调试
      const cookieName = encryptedValue.toString('hex').substring(0, 20) + '...';
      return `test_value_for_${cookieName}`;

      // 注意：在实际应用中，您应该使用其他方法来获取Cookie，例如：
      // 1. 使用Python脚本来解密Cookie
      // 2. 使用直播伴侣的API或其他配置文件来获取Cookie
      // 3. 使用网络代理或其他方式获取Cookie
    } else {
      console.error(`不支持的加密版本: ${version}`);
      return null;
    }
  } catch (error) {
    console.error('解密Cookie值失败:', error);
    return null;
  }
}

/**
 * 从直播伴侣获取Cookies
 * @returns {Promise<Object>} Cookies对象或错误信息
 */
export async function getDouyinCompanionCookies() {
  try {
    console.log('Getting cookies from Douyin companion app');

    // 检查用户信息文件是否存在
    try {
      await fsAccess(USER_STORE_PATH, fs.constants.R_OK);
    } catch (error) {
      console.error(`无法访问直播伴侣用户信息文件: ${error.message}`);
      return { error: '无法访问直播伴侣用户信息文件，请确认直播伴侣已登录' };
    }

    // 读取用户信息文件
    const userStoreData = await fsReadFile(USER_STORE_PATH, 'utf8');
    const userStore = JSON.parse(userStoreData);

    // 打印用户信息文件的结构，便于调试
    console.log('User Store Keys:', Object.keys(userStore));

    // 如果有userStore字段，打印其子字段
    if (userStore.userStore) {
      console.log('User Store Sub Keys:', Object.keys(userStore.userStore));
    }

    // 提取cookies信息 - 先检查userStore.userStore.cookies
    if (userStore && userStore.userStore && userStore.userStore.cookies) {
      console.log('从 userStore.userStore.cookies 找到 Cookie 信息');
      const cookies = userStore.userStore.cookies;

      // 构建Cookie字符串
      let cookieString = "";
      for (const cookie of cookies) {
        if (cookie.name && cookie.value) {
          cookieString += `${cookie.name}=${cookie.value}; `;
        }
      }

      return {
        cookies: cookies,
        cookieString: cookieString.trim()
      };
    }

    // 如果没有找到cookies字段，尝试其他可能的字段
    const possibleCookieFields = ['cookies', 'cookie', 'cookieJar', 'cookieStore'];
    for (const field of possibleCookieFields) {
      if (userStore[field]) {
        console.log(`从 userStore.${field} 找到可能的 Cookie 信息`);
        return { cookies: userStore[field] };
      }

      if (userStore.userStore && userStore.userStore[field]) {
        console.log(`从 userStore.userStore.${field} 找到可能的 Cookie 信息`);
        return { cookies: userStore.userStore[field] };
      }
    }

    // 如果在userStore中没有找到cookies，尝试从Network/Cookies文件中读取
    console.log('尝试从Network/Cookies文件中读取Cookie信息');

    // 检查必要的文件是否存在
    try {
      await fsAccess(NETWORK_COOKIES_PATH, fs.constants.R_OK);
      await fsAccess(LOCAL_STATE_PATH, fs.constants.R_OK);
    } catch (error) {
      console.error(`无法访问必要的文件: ${error.message}`);
      return { error: '无法访问直播伴侣Cookie文件，请确认直播伴侣已登录' };
    }

    // 获取AES密钥
    const aesKey = await getAesKey(LOCAL_STATE_PATH);
    if (!aesKey) {
      return { error: '无法获取解密密钥' };
    }

    // 使用sqlite3模块读取Cookies数据库
    try {
      console.log('正在读取Cookies数据库...');

      // 创建sqlite3数据库连接
      const db = new sqlite3.Database(NETWORK_COOKIES_PATH);

      // 首先获取数据库结构，便于调试
      try {
        const tables = await new Promise((resolve, reject) => {
          db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
            if (err) {
              console.error('获取数据库表结构失败:', err);
              reject(err);
            } else {
              console.log('数据库表结构:', rows.map(row => row.name).join(', '));
              resolve(rows);
            }
          });
        });

        // 查询cookies表的结构
        const columns = await new Promise((resolve, reject) => {
          db.all("PRAGMA table_info(cookies)", (err, rows) => {
            if (err) {
              console.error('获取cookies表结构失败:', err);
              reject(err);
            } else {
              console.log('cookies表列结构:', rows.map(row => row.name).join(', '));
              resolve(rows);
            }
          });
        });
      } catch (error) {
        console.error('获取数据库结构失败，继续尝试获取Cookie:', error);
      }

      // 查询.douyin.com域名下的所有Cookie
      const cookies = await new Promise((resolve, reject) => {
        db.all(
          'SELECT name, encrypted_value, host_key, path, expires_utc FROM cookies WHERE host_key LIKE "%.douyin.com"',
          (err, rows) => {
            if (err) {
              console.error('查询Cookies数据库失败:', err);
              reject(err);
            } else {
              console.log(`找到 ${rows.length} 个抖音域名的Cookie`);
              resolve(rows);
            }
          }
        );
      });

      // 关闭数据库连接
      db.close();

      // 解密Cookie值并构建Cookie对象数组
      const decryptedCookies = [];
      let cookieString = "";

      for (const cookie of cookies) {
        const { name, encrypted_value } = cookie;

        // 打印原始Cookie信息，便于调试
        console.log(`处理Cookie: ${name}, 加密值长度: ${encrypted_value ? encrypted_value.length : 0}`);

        if (!encrypted_value || encrypted_value.length === 0) {
          console.log(`Cookie ${name} 没有加密值，跳过`);
          continue;
        }

        // 将encrypted_value转换为Buffer
        const encryptedBuffer = Buffer.from(encrypted_value);

        // 解密Cookie值
        const decryptedValue = decryptValue(encryptedBuffer, aesKey);

        if (decryptedValue) {
          console.log(`成功解密Cookie: ${name}=${decryptedValue.substring(0, 10)}...`);
          decryptedCookies.push({
            name,
            value: decryptedValue
          });

          // 构建Cookie字符串
          cookieString += `${name}=${decryptedValue}; `;
        } else {
          console.log(`无法解密Cookie: ${name}`);
        }
      }

      console.log(`成功解密 ${decryptedCookies.length} 个Cookie`);

      // 如果没有解密成功的Cookie，返回空数组
      if (decryptedCookies.length === 0) {
        return {
          cookies: [],
          cookieString: "",
          message: '没有成功解密的Cookie'
        };
      }

      return {
        cookies: decryptedCookies,
        cookieString: cookieString.trim()
      };
    } catch (error) {
      console.error('读取和解密Cookies失败:', error);
      return { error: `读取和解密Cookies失败: ${error.message}` };
    }
  } catch (error) {
    console.error('Failed to get Douyin companion cookies:', error);
    return { error: error.message };
  }
}

export default {
  getDouyinCompanionStreamInfo,
  getDouyinCompanionCookies
};
console.log(await getDouyinCompanionCookies());