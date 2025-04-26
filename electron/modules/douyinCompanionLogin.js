// douyinCompanionLogin.js - 抖音直播伴侣登录模块
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { getSoftwareVersion, getSoftwarePath } from '../../src/utils/Findsoftpaths.js';
import { getDouyinCookies } from './getDouyinCompanion_cookies.js';

// 将回调函数转换为 Promise
const fsAccess = promisify(fs.access);
const fsReadFile = promisify(fs.readFile);

// 直播伴侣用户数据文件路径
const APPDATA = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const USER_STORE_PATH = path.join(APPDATA, 'webcast_mate', 'WBStore', 'userStore.json');

/**
 * 递归查找对象中的用户数据
 * @param {Object} obj 要搜索的对象
 * @param {Array} foundObjects 找到的包含用户数据的对象数组
 * @param {Number} depth 当前搜索深度
 * @param {Number} maxDepth 最大搜索深度
 * @returns {Array} 找到的包含用户数据的对象数组
 */
function findUserDataObjects(obj, foundObjects = [], depth = 0, maxDepth = 3) {
  // 防止过深递归
  if (depth > maxDepth || !obj || typeof obj !== 'object') {
    return foundObjects;
  }

  // 检查当前对象是否包含用户数据的关键字段
  // 优先检查我们需要的字段: nickname, avatar_url, following_count, follower_count
  const hasUserFields = obj.nickname !== undefined ||
                        obj.avatar_url !== undefined ||
                        obj.following_count !== undefined ||
                        obj.follower_count !== undefined;

  // 如果找到了用户数据字段，添加到结果数组
  if (hasUserFields) {
    // 计算对象包含的用户数据字段数量，用于排序
    let fieldCount = 0;
    if (obj.nickname !== undefined) fieldCount++;
    if (obj.avatar_url !== undefined) fieldCount++;
    if (obj.following_count !== undefined) fieldCount++;
    if (obj.follower_count !== undefined) fieldCount++;

    // 添加字段计数，以便后续可以优先使用包含更多字段的对象
    foundObjects.push({
      ...obj,
      _fieldCount: fieldCount
    });
  }

  // 递归搜索子对象
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      findUserDataObjects(obj[key], foundObjects, depth + 1, maxDepth);
    }
  }

  // 按照字段数量排序，优先返回包含更多用户数据字段的对象
  return foundObjects.sort((a, b) => (b._fieldCount || 0) - (a._fieldCount || 0));
}

/**
 * 打开抖音直播伴侣并处理登录流程
 * @returns {Promise<Object>} 登录结果，包含用户信息和cookies
 */
export function loginDouyinCompanion() {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Getting Douyin companion login info');

      // 检测直播伴侣版本
      const companionVersion = await getSoftwareVersion('直播伴侣');
      if (!companionVersion || companionVersion === '未检测到') {
        return resolve({ success: false, error: '未检测到直播伴侣，请先安装直播伴侣' });
      }

      // 获取直播伴侣安装路径
      const companionPath = await getSoftwarePath('直播伴侣');
      console.log('Douyin companion path:', companionPath);

      if (!companionPath) {
        return resolve({ success: false, error: '无法获取直播伴侣路径，请确认安装正确' });
      }

      // 启动直播伴侣
      console.log('正在启动直播伴侣...');

      // 使用child_process启动直播伴侣
      exec(`"${companionPath}"`, (error) => {
        if (error) {
          console.error(`启动直播伴侣错误: ${error}`);
          return resolve({ success: false, error: `启动直播伴侣失败: ${error.message}` });
        }

        console.log('直播伴侣已启动');

        // 检查userStore.json文件是否存在，如果不存在则每隔1秒检测一次
        console.log('开始检查userStore.json文件是否存在...');

        const checkUserStoreFile = () => {
          return new Promise((resolveCheck) => {
            const checkFileExists = async () => {
              try {
                // 检查文件是否存在
                await fsAccess(USER_STORE_PATH, fs.constants.R_OK);
                console.log('找到userStore.json文件');

                // 读取用户信息文件
                const userStoreData = await fsReadFile(USER_STORE_PATH, 'utf8');
                let userData;

                try {
                  const userStore = JSON.parse(userStoreData);
                  console.log('成功解析userStore.json文件');

                  // 设置默认用户数据，仅在找不到真实数据时使用
                  // 使用指定的字段名称: avatar_url, nickname, following_count, follower_count
                  const defaultUserData = {
                    id: 'douyin_user_' + Date.now(),
                    nickname: '抖音用户',
                    avatar_url: null,
                    following_count: 200,
                    follower_count: 800,
                    like_Count: 3000
                  };

                  // 初始化userData为null，稍后会尝试从文件中获取真实数据
                  userData = null;

                  // 打印userStore的结构，便于调试
                  console.log('User Store Keys:', Object.keys(userStore));

                  // 直接尝试从顶层提取用户数据
                  console.log('尝试直接从userStore.json提取用户数据...');

                  // 打印完整的userStore内容，便于调试
                  console.log('userStore内容:', JSON.stringify(userStore, null, 2).substring(0, 1000) + '...');

                  // 使用递归函数查找所有可能包含用户数据的对象
                  const userDataObjects = findUserDataObjects(userStore);
                  console.log(`找到 ${userDataObjects.length} 个可能包含用户数据的对象`);

                  // 如果找到了用户数据对象，打印它们的内容
                  if (userDataObjects.length > 0) {
                    userDataObjects.forEach((obj, index) => {
                      if (index < 3) { // 只打印前3个，避免日志过长
                        console.log(`用户数据对象 #${index + 1}:`, JSON.stringify(obj, null, 2));
                      }
                    });
                  }

                  // 尝试查找用户数据的可能位置
                  if (userStore.user) {
                    console.log('找到顶层user字段:', Object.keys(userStore.user));
                  }

                  if (userStore.userData) {
                    console.log('找到顶层userData字段:', Object.keys(userStore.userData));
                  }

                  // 尝试从不同位置获取用户信息
                  let user = null;

                  // 首先尝试使用递归找到的第一个用户数据对象（已按字段数量排序）
                  if (userDataObjects.length > 0) {
                    console.log('使用递归找到的第一个用户数据对象');
                    user = userDataObjects[0];
                  }
                  // 如果没有找到，则尝试其他可能的位置
                  else {
                    // 检查是否有userStore字段
                    if (userStore.userStore) {
                      console.log('User Store Sub Keys:', Object.keys(userStore.userStore));

                      if (userStore.userStore.userData) {
                        console.log('找到userStore.userData字段:', Object.keys(userStore.userStore.userData));
                      }

                      if (userStore.userStore.user) {
                        console.log('从userStore.userStore.user获取用户数据');
                        user = userStore.userStore.user;
                      } else if (userStore.userStore.userData) {
                        console.log('从userStore.userStore.userData获取用户数据');
                        user = userStore.userStore.userData;
                      }
                    }

                    if (!user && userStore.user) {
                      console.log('从userStore.user获取用户数据');
                      user = userStore.user;
                    } else if (!user && userStore.userData) {
                      console.log('从userStore.userData获取用户数据');
                      user = userStore.userData;
                    }
                  }

                  // 如果找到了用户数据，则更新userData
                  if (user) {
                    // 检查是否有follow_info嵌套对象
                    const followInfo = user.follow_info || {};

                    userData = {
                      id: user.id || defaultUserData.id,
                      nickname: user.nickname || defaultUserData.nickname,
                      avatar_url: user.avatar_url || user.avatar || defaultUserData.avatar_url,
                      following_count: followInfo.following_count || user.following_count || user.followCount || defaultUserData.following_count,
                      follower_count: followInfo.follower_count || user.follower_count || user.fansCount || defaultUserData.follower_count,
                      like_Count: user.like_Count || user.likeCount || defaultUserData.like_Count
                    };

                    // 打印follow_info对象，便于调试
                    if (user.follow_info) {
                      console.log('找到follow_info对象:', JSON.stringify(user.follow_info, null, 2));
                    }

                    // 打印找到的用户数据，便于调试
                    console.log('找到用户数据:', JSON.stringify(userData, null, 2));
                  } else {
                    console.log('未找到用户数据，使用默认值');
                    userData = { ...defaultUserData };
                  }

                  // 如果userData仍然为null，则使用默认值
                  if (userData === null) {
                    console.log('未能从userStore.json中提取用户数据，使用默认值');
                    userData = { ...defaultUserData };
                  }

                  resolveCheck(userData);
                } catch (parseError) {
                  console.error('解析userStore.json文件失败:', parseError);
                  // 使用默认用户数据
                  userData = {
                    id: 'douyin_user_' + Date.now(),
                    nickname: '抖音用户',
                    avatar_url: null,
                    following_count: 200,
                    follower_count: 800,
                    like_Count: 3000
                  };
                  resolveCheck(userData);
                }
              } catch (error) {
                console.log('userStore.json文件不存在，1秒后重试...');
                // 文件不存在，1秒后重试
                setTimeout(checkFileExists, 1000);
              }
            };

            // 开始检查
            checkFileExists();
          });
        };

        // 使用异步立即执行函数
        (async () => {
          try {
            // 等待用户数据文件存在并获取用户数据
            const userData = await checkUserStoreFile();
            console.log('获取到用户数据:', userData);

            // 获取Cookie
            console.log('正在从webcast_mate获取抖音Cookie...');
            const cookieResult = await getDouyinCookies();

            if (!cookieResult.success) {
              console.error('获取Cookie失败:', cookieResult.error);
              return resolve({
                success: false,
                error: `获取Cookie失败: ${cookieResult.error}`
              });
            }

            console.log(`成功获取 ${cookieResult.cookies.length} 个Cookie`);

            // 返回成功结果，包含用户信息和真实Cookie
            resolve({
              success: true,
              user: userData,
              cookies: cookieResult.cookies,
              cookieString: cookieResult.cookieString
            });
          } catch (error) {
            console.error('从直播伴侣获取信息失败:', error);
            resolve({ success: false, error: `从直播伴侣获取信息失败: ${error.message}` });
          }
        })();
      });

    } catch (error) {
      console.error('Failed to login with Douyin companion:', error);
      reject({ success: false, error: error.message });
    }
  });
}

export default loginDouyinCompanion;
