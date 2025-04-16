import React, { useState, useEffect } from 'react';
import { User, Check, AlertCircle, Link, Key, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { useStreaming } from '../context/StreamingContext';
// import { workspaceStreamInfo, configureAndStartOBS } from '../utils/obsUtils';

// 使用真实的 Electron API 获取软件版本


const HomePage = () => {
  const navigate = useNavigate();

  // 模拟数据，实际中这些会来自上下文

  const [autoMode, setAutoMode] = useState(true);
  const [platform, setPlatform] = useState('抖音');
  const [streamMethod, setStreamMethod] = useState('直播伴侣');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');

  // Add missing state variables for OBS and companion versions
  const [obsVersion, setObsVersion] = useState('检测中');
  const [companionVersion, setCompanionVersion] = useState('检测中');

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamInfoSuccess, setStreamInfoSuccess] = useState(false);
  const [error, setError] = useState(null);

  // 用于跟踪操作是否可以被中止
  const [abortController, setAbortController] = useState(null);
  const [operationInProgress, setOperationInProgress] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // 页面加载时自动检测OBS和伴侣版本
  useEffect(() => {
    // 定义异步函数
    const fetchVersions = async () => {
      try {
        // 检查本地存储中是否已有版本信息
        const storedObsVersion = localStorage.getItem('obsVersion');
        const storedCompanionVersion = localStorage.getItem('companionVersion');
        
        // 如果已经有存储的版本信息且不是"检测中"或"未识别"，则使用存储的版本
        if (storedObsVersion && storedObsVersion !== '检测中' && storedObsVersion !== '未识别') {
          setObsVersion(storedObsVersion);
        } else {
          // 首先显示"检测中"状态
          setObsVersion('检测中');
          
          // 检查 Electron 环境
          if (typeof window !== 'undefined' && window.electron) {
            // 获取OBS版本
            const obsVer = await window.electron.getOBSVersion();
            setObsVersion(obsVer || '未识别');
            // 存储到本地存储
            localStorage.setItem('obsVersion', obsVer || '未识别');
          } else {
            // 如果不在 Electron 环境中，显示未识别
            setObsVersion('未识别');
            localStorage.setItem('obsVersion', '未识别');
          }
        }

        if (storedCompanionVersion && storedCompanionVersion !== '检测中' && storedCompanionVersion !== '未识别') {
          setCompanionVersion(storedCompanionVersion);
        } else {
          // 首先显示"检测中"状态
          setCompanionVersion('检测中');
          
          // 检查 Electron 环境
          if (typeof window !== 'undefined' && window.electron) {
            // 获取伴侣版本
            const compVer = await window.electron.getCompanionVersion();
            setCompanionVersion(compVer || '未识别');
            // 存储到本地存储
            localStorage.setItem('companionVersion', compVer || '未识别');
          } else {
            // 如果不在 Electron 环境中，显示未识别
            setCompanionVersion('未识别');
            localStorage.setItem('companionVersion', '未识别');
          }
        }
      } catch (error) {
        // 发生错误时显示未识别
        setObsVersion('未识别');
        setCompanionVersion('未识别');
        localStorage.setItem('obsVersion', '未识别');
        localStorage.setItem('companionVersion', '未识别');
      }
    };

    // 执行异步函数
    fetchVersions();
  }, []); // 空依赖数组确保只在组件挂载时执行一次

  // 模拟操作
  const toggleMode = () => setAutoMode(!autoMode);
  const handlePlatformChange = (newPlatform) => setPlatform(newPlatform);
  const handleMethodChange = (newMethod) => setStreamMethod(newMethod);

  // 获取推流码按钮点击处理
  const getStreamInfo = async () => {
    // 如果操作正在进行中，则中止当前操作
    if (operationInProgress && abortController) {
      abortController.abort();
      setOperationInProgress(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    // 创建新的 AbortController
    const controller = new AbortController();
    setAbortController(controller);
    setOperationInProgress(true);
    setIsLoading(true);
    setError(null);
    setStreamInfoSuccess(false);

    try {
      // 模拟异步操作
      const timeoutPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          // 检查是否已经被中止
          if (controller.signal.aborted) {
            reject(new Error('操作已被用户取消'));
            return;
          }

          resolve({
            streamUrl: 'rtmp://push.douyin.com/live',
            streamKey: 'mock_key_' + Date.now()
          });
        }, 2000); // 模拟 2 秒的延迟

        // 如果被中止，清除定时器
        controller.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('操作已被用户取消'));
        });
      });

      // 等待异步操作完成
      const result = await timeoutPromise;

      // 设置推流信息
      setStreamUrl(result.streamUrl);
      setStreamKey(result.streamKey);
      setStreamInfoSuccess(true);
    } catch (err) {
      if (err.message !== '操作已被用户取消') {
        setError(`获取推流信息失败: ${err.message}`);
      }
    } finally {
      setOperationInProgress(false);
      setIsLoading(false);
      setAbortController(null);
    }
  };

  // 自动推流按钮点击处理
  const startAutoStreaming = async () => {
    // 如果已经在推流中，则停止推流
    if (isStreaming) {
      await stopStreaming();
      return;
    }

    // 如果操作正在进行中，则中止当前操作
    if (operationInProgress && abortController) {
      abortController.abort();
      setOperationInProgress(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    // 创建新的 AbortController
    const controller = new AbortController();
    setAbortController(controller);
    setOperationInProgress(true);
    setIsLoading(true);
    setError(null);
    setStreamInfoSuccess(false);

    try {
      // 模拟异步操作 - 获取推流信息
      const timeoutPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          // 检查是否已经被中止
          if (controller.signal.aborted) {
            reject(new Error('操作已被用户取消'));
            return;
          }

          resolve({
            streamUrl: 'rtmp://push.douyin.com/live',
            streamKey: 'mock_key_' + Date.now()
          });
        }, 2000); // 模拟 2 秒的延迟

        // 如果被中止，清除定时器
        controller.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('操作已被用户取消'));
        });
      });

      // 等待异步操作完成
      const result = await timeoutPromise;

      // 设置推流信息
      setStreamUrl(result.streamUrl);
      setStreamKey(result.streamKey);
      setStreamInfoSuccess(true);

      // 模拟配置 OBS 并启动推流
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsStreaming(true);
    } catch (err) {
      if (err.message !== '操作已被用户取消') {
        setError(`自动推流失败: ${err.message}`);
      }
    } finally {
      setOperationInProgress(false);
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const stopStreaming = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsStreaming(false);
      setStreamInfoSuccess(false); // 移除成功图标
      setIsLoading(false);
    }, 1000);
  };

  const login = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setUserInfo({
        nickname: '抖音用户',
        avatar: null,
        likeCount: 1000,
        fansCount: 500
      });
      setIsLoading(false);
    }, 1000);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
  };

  // 复制文本到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // 可以添加一个提示，表示复制成功
        console.log('复制成功');
      })
      .catch(err => {
        console.error('复制失败:', err);
      });
  };

  // 本地状态
  const [showObsSettings, setShowObsSettings] = useState(false);
  const [obsConfigs, setObsConfigs] = useState(['配置1.json', '配置2.json', '配置3.json']);
  const [selectedConfig, setSelectedConfig] = useState('OBS备份');
  const [obsSettings, setObsSettings] = useState({
    deviceType: 'phone',
    deviceSize: '11寸'
  });

  // 示例视频文件
  const videoFiles = ['视频1.mp4', '视频2.mp4', '视频3.mp4', '视频4.mp4', '视频5.mp4', '视频6.mp4', '视频7.mp4'];


  // 处理登录/退出按钮点击
  const handleLoginClick = async () => {
    if (isLoggedIn) {
      logout();
    } else {
      await login();
    }
  };

  return (
    <div className="min-h-full bg-gray-900 text-white p-2 flex flex-col h-full gap-1">
      {/* 上部区域：直播设置 */}
      <div className="flex flex-row gap-3">
        {/* 左侧功能区域 - 自动推流组件 */}
        <div className="w-2/3 h-45 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg overflow-auto relative">
          {/* 顶部控制区域 */}
          <div className="flex justify-between items-start">

            <div className="flex flex-row items-center">
              <span className="text-slate-300 text-xs">OBS：</span>
              <span className={`text-sm font-medium ${obsVersion === '检测中' ? 'text-blue-300 animate-pulse' : obsVersion === '未识别' ? 'text-red-300' : 'text-yellow-300'}`}>
                {obsVersion}
              </span>
            </div>

            <div className="flex flex-row items-center">
              <span className="text-slate-300 text-xs">伴侣：</span>
              <span className={`text-sm font-medium ${companionVersion === '检测中' ? 'text-blue-300 animate-pulse' : companionVersion === '未识别' ? 'text-red-300' : 'text-yellow-300'}`}>
                {companionVersion}
              </span>
            </div>

            <div className="flex flex-row items-center">
              <div className="relative inline-flex items-center cursor-pointer" onClick={toggleMode}>
                <input type="checkbox" value="" className="sr-only peer" checked={autoMode} readOnly />
                <div className="w-10 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </div>
          </div>

          {/* 中央显示区域 - 自动推流按钮或推流码显示 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '40px' }}>
            {autoMode ? (
              <button
                onClick={startAutoStreaming}
                className={`pointer-events-auto w-[340px] py-1.5 rounded-md border border-slate-600/50 text-lg font-bold text-slate-200 transition-colors relative mb-10
                  ${isStreaming ? 'bg-red-700/70 hover:bg-red-600/90' :
                    operationInProgress ? 'bg-blue-600/70 hover:bg-blue-500/90' :
                      'bg-slate-800/90 hover:bg-slate-700/90'}`}
              >
                {operationInProgress ? '获取中...' : '自动推流'}

                {/* 成功图标 */}
                {streamInfoSuccess && !operationInProgress && (
                  <span className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                    <Check size={16} />
                  </span>
                )}

                {/* 加载动画 */}
                {operationInProgress && (
                  <span className="absolute top-1 right-1 flex">
                    <span className="animate-ping absolute h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </button>


            ) : (
              <div className="pointer-events-auto w-[340px] flex flex-col gap-1.5 max-h-[140px] mb-10">
                {/* 推流地址输入框 */}
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Link size={14} />
                  </div>
                  <input
                    type="text"
                    value={streamUrl}
                    readOnly
                    placeholder="推流地址"
                    className="w-full bg-slate-800/90 text-white pl-9 pr-9 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-600/50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(streamUrl)}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    title="复制推流地址"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                {/* 推流密钥输入框 */}
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Key size={14} />
                  </div>
                  <input
                    type="text"
                    value={streamKey ? '********' : ''}
                    readOnly
                    placeholder="推流密钥"
                    className="w-full bg-slate-800/90 text-white pl-9 pr-9 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-600/50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(streamKey)}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    title="复制推流密钥"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                {/* 获取推流码按钮 */}
                <button
                  onClick={getStreamInfo}
                  className={`w-full py-1.5 rounded-md text-sm font-medium transition-colors relative
                    ${operationInProgress ? 'bg-blue-500 hover:bg-blue-400' : 'bg-blue-600 hover:bg-blue-500'} text-white`}
                >
                  {operationInProgress ? '获取中...' : '获取推流码'}

                  {/* 成功图标 */}
                  {streamInfoSuccess && !operationInProgress && (
                    <span className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                      <Check size={16} />
                    </span>
                  )}

                  {/* 加载动画 */}
                  {operationInProgress && (
                    <span className="absolute top-1/2 right-4 transform -translate-y-1/2 flex">
                      <span className="animate-ping absolute h-2 w-2 rounded-full bg-white opacity-75"></span>
                      <span className="relative rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                </button>
                {error && (
                  <div className="mt-2 text-red-400 text-sm flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部控制区域 - 绝对定位在左下角和右下角 */}
          <div className="absolute bottom-3 left-3 z-10">
            <button
              className="w-auto py-1 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-center text-xs font-medium transition-colors border border-slate-600"
              onClick={() => navigate('/app/obs-config')}
            >
              OBS一键配置
            </button>
          </div>

          <div className="absolute bottom-3 right-3 z-10">
            <select
              className="w-auto bg-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-left pl-3 pr-8 border border-slate-600 relative"
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em" }}
            >
              <option value="OBS备份">OBS备份</option>
              <option value="配置1.json">配置1</option>
              <option value="配置2.json">配置2</option>
              {obsConfigs.map((config, index) => (
                <option key={index} value={config}>{config}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 右侧区域：直播设置和平台信息 */}
        <div className="w-2/3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg overflow-auto">
          {/* 包装两个主要部分在水平布局中 */}
          <div className="flex flex-row gap-4">
            {/* 左侧：平台和直播方式选择 */}
            <div className="w-1/2">
              <div className="flex flex-col gap-4 mb-4">
                <div>
                  <div className="flex flex-row justify-between items-center mb-2">
                    <label className="text-gray-300 text-sm font-medium">选择平台</label>
                    {(platform === '抖音' && (streamMethod === '手机开播' || streamMethod === '自动开播')) && (
                      <button
                        onClick={handleLoginClick}
                        className={`py-1 px-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${isLoggedIn ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        <span>{isLoggedIn ? '退出登录' : '登录平台'}</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={platform}
                    onChange={(e) => handlePlatformChange(e.target.value)}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-600"
                  >
                    <option value="抖音">抖音</option>
                    <option value="Bilibili">Bilibili</option>
                  </select>
                </div>

                {platform === '抖音' && (
                  <div>
                    <label className="block text-gray-300 mb-2 text-sm font-medium">直播方式</label>
                    <select
                      value={streamMethod}
                      onChange={(e) => handleMethodChange(e.target.value)}
                      className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-600"
                    >
                      <option value="直播伴侣">直播伴侣</option>
                      <option value="手机开播">手机开播</option>
                      <option value="自动开播">自动开播</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：平台信息和用户信息 */}
            <div className="w-1/2 bg-slate-700/30 rounded-lg p-2 pt-1 border border-slate-600/40 backdrop-blur-sm">
              <div className="flex items-center justify-center mt-0">
                {isLoggedIn && userInfo ? (
                  <div className="flex flex-col items-center">
                    <div className="w-15 h-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden border-2 border-white/20 mb-3">
                      {userInfo.avatar ? (
                        <img
                          src={userInfo.avatar}
                          alt="用户头像"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-white font-medium text-sm mb-2">{userInfo.nickname || '未知用户'}</p>
                      <div className="flex gap-2">
                        {userInfo.likeCount && (
                          <div className="bg-slate-600/60 rounded-lg px-3 py-1 text-center border border-slate-500/30">
                            <p className="text-xs text-blue-200">点赞: {userInfo.likeCount}</p>
                          </div>
                        )}
                        {userInfo.fansCount && (
                          <div className="bg-slate-600/60 rounded-lg px-3 py-1 text-center border border-slate-500/30">
                            <p className="text-xs text-blue-200">粉丝: {userInfo.fansCount}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-3">
                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-300 text-sm mt-2 font-medium">请先登录</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*中间区域：广告位置*/}
      <div className="w-full my-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-indigo-900/30 shadow-lg overflow-hidden">
        {/* 广告容器 - 固定宽高比例 */}
        <div className="w-full" style={{ height: '100px' }}>
          {/* 图片广告示例 */}
          <img
            src="/path/to/your/ad-image.jpg"
            alt="广告内容"
            className="w-full h-full object-cover"
          />

          {/* 视频广告示例 - 默认隐藏，需要时取消注释 */}
          {/* <video
            className="w-full h-full object-cover"
            controls={false}
            autoPlay
            muted
            loop
          >
            <source src="/path/to/your/ad-video.mp4" type="video/mp4" />
            您的浏览器不支持视频标签
          </video> */}

          {/* 可选：广告标识和关闭按钮 */}
          {/* <div className="absolute top-2 right-2 flex items-center gap-2">
            <span className="bg-indigo-600/70 text-white text-xs px-2 py-0.5 rounded">广告</span>
            <button className="bg-gray-800/60 hover:bg-gray-700/80 p-1 rounded-full text-white text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div> */}
        </div>
      </div>

      {/* 下部区域：主页热门推荐 */}
      <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4  border border-slate-700 shadow-lg overflow-hidden">
        {/* 导航栏 进一步减小顶部边距，可以使用负边距，*/}
        <div className="flex justify-between items-center mt-[-10px] mb-2">
          <h2 className="text-lg font-semibold text-blue-300">热门推荐</h2>
          <nav className="flex space-x-4">
            <button
              className="text-sm text-gray-300 hover:text-white"
              onClick={() => navigate('/app/plugins')}
            >
              插件
            </button>
            <button
              className="text-sm text-gray-300 hover:text-white"
              onClick={() => navigate('/app/devices')}
            >
              设备推荐
            </button>
            <button
              className="text-sm text-gray-300 hover:text-white"
              onClick={() => navigate('/app/tutorials')}
            >
              直播教程
            </button>
            <button
              className="text-sm text-gray-300 hover:text-white"
              onClick={() => navigate('/app/more')}
            >
              更多
            </button>
          </nav>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {videoFiles.slice(0, 7).map((file, index) => (
            <div
              key={index}
              className="bg-slate-700/50 rounded-lg overflow-hidden cursor-pointer hover:bg-slate-700 transition-colors border border-slate-600/40"
            >
              <div className="aspect-video bg-slate-800 flex items-center justify-center">
                <span className="text-xs text-slate-400">{file}</span>
              </div>
              <div className="p-2">
                <p className="text-xs truncate text-slate-300">{file}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OBS Settings Modal - 只有在需要时才显示 */}
      {showObsSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">参数设置</h2>

            <div className="mb-4">
              <h3 className="text-gray-300 mb-2 font-medium">直播设备</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className={`py-2 rounded-lg font-medium transition-colors ${obsSettings.deviceType === 'phone' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'}`}
                >
                  手机
                </button>
                <button
                  className={`py-2 rounded-lg font-medium transition-colors ${obsSettings.deviceType === 'tablet' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'}`}
                >
                  平板
                </button>
                <button
                  className={`py-2 rounded-lg font-medium transition-colors ${obsSettings.deviceType === 'computer' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'}`}
                >
                  电脑
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-gray-300 mb-2 font-medium">设备尺寸</h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button
                  className={`py-2 rounded-lg font-medium transition-colors ${obsSettings.deviceSize === '11寸' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'}`}
                >
                  11寸
                </button>
                <button
                  className={`py-2 rounded-lg font-medium transition-colors ${obsSettings.deviceSize === '12.9寸' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'}`}
                >
                  12.9寸
                </button>
                <button
                  className={`py-2 rounded-lg font-medium transition-colors ${obsSettings.deviceSize === '1080x1920' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'}`}
                >
                  1080x1920
                </button>
                <button
                  className={`py-2 rounded-lg font-medium transition-colors ${obsSettings.deviceSize === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'}`}
                >
                  自定义
                </button>
              </div>

              {obsSettings.deviceSize === 'custom' && (
                <div className="flex space-x-3 mb-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-1 font-medium">宽度</label>
                    <input
                      type="number"
                      value={1080}
                      readOnly
                      className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1 font-medium">高度</label>
                    <input
                      type="number"
                      value={1920}
                      readOnly
                      className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white font-medium transition-colors border border-slate-600"
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
              >
                应用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;