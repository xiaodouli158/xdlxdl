import React from 'react';
import { User } from 'lucide-react';

const HomePage = () => {
  // 模拟数据，实际中这些会来自API或state
  const streamSettings = {
    platform: '抖音',
    streamMethod: '直播伴侣',
    autoFlow: true
  };
  
  const obsSettings = {
    deviceType: 'phone',
    deviceSize: '11寸',
    selectedConfig: 'OBS备份'
  };
  
  const isLoggedIn = false;
  const userAvatar = null;
  const username = null;
  const userStats = {
    followCount: null,
    fansCount: null,
    likeCount: null
  };
  
  const videoFiles = ['视频1.mp4', '视频2.mp4', '视频3.mp4', '视频4.mp4', '视频5.mp4', '视频6.mp4', '视频7.mp4'];
  const obsConfigs = ['配置1.json', '配置2.json', '配置3.json'];
  const showObsSettings = false;

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
              <span className="text-yellow-300 text-sm font-medium">30.2.2</span>
            </div>

            <div className="flex flex-row items-center">
              <span className="text-slate-300 text-xs">伴侣：</span>
              <span className="text-yellow-300 text-sm font-medium">9.6.3</span>
            </div>

            <div className="flex flex-row items-center">
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" checked={streamSettings.autoFlow} readOnly />
                <div className="w-10 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </div>
          </div>

          {/* 中央显示区域 - 自动推流按钮 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button className="pointer-events-auto bg-slate-800/70 hover:bg-slate-700/90 px-8 py-3 rounded-lg border border-slate-600 text-3xl font-bold text-slate-200 transition-colors">
              自动推流
            </button>
          </div>

          {/* 底部控制区域 - 绝对定位在左下角和右下角 */}
          <div className="absolute bottom-4 left-4">
            <button
              className="w-auto py-1 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-center text-xs font-medium transition-colors border border-slate-600"
            >
              OBS一键配置
            </button>
          </div>
          
          <div className="absolute bottom-4 right-4">
            <select
              className="w-auto bg-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-left pl-3 pr-8 border border-slate-600 relative"
              value={obsSettings.selectedConfig}
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
                    <button
                      className={`py-1 px-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${isLoggedIn ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      <span>{isLoggedIn ? '退出登录' : '登录平台'}</span>
                    </button>
                  </div>
                  <select
                    value={streamSettings.platform}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-600"
                  >
                    <option value="抖音">抖音</option>
                    <option value="快手">快手</option>
                    <option value="拼多多">拼多多</option>
                    <option value="小红书">小红书</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">直播方式</label>
                  <select
                    value={streamSettings.streamMethod}
                    className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-600"
                  >
                    <option value="直播伴侣">直播伴侣</option>
                    <option value="手机开播">手机开播</option>
                    <option value="自动开播">自动开播</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 右侧：平台信息和用户信息 */}
            <div className="w-1/2 bg-slate-700/30 rounded-lg p-2 pt-1 border border-slate-600/40 backdrop-blur-sm">
              <div className="flex items-center justify-center mt-0">
                {isLoggedIn ? (
                  <div className="flex flex-col items-center">
                    <div className="w-15 h-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden border-2 border-white/20 mb-3">
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt="用户头像"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-white font-medium text-sm mb-2">{username || '未知用户'}</p>
                      <div className="flex gap-2">
                        {userStats.likeCount && (
                          <div className="bg-slate-600/60 rounded-lg px-3 py-1 text-center border border-slate-500/30">
                            <p className="text-xs text-blue-200">{userStats.likeCount}</p>
                          </div>
                        )}
                        {userStats.fansCount && (
                          <div className="bg-slate-600/60 rounded-lg px-3 py-1 text-center border border-slate-500/30">
                            <p className="text-xs text-blue-200">{userStats.fansCount}</p>
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
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <span className="bg-indigo-600/70 text-white text-xs px-2 py-0.5 rounded">广告</span>
            <button className="bg-gray-800/60 hover:bg-gray-700/80 p-1 rounded-full text-white text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 下部区域：主页热门推荐 */}
      <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4  border border-slate-700 shadow-lg overflow-auto">
        {/* 导航栏 进一步减小顶部边距，可以使用负边距，*/}
        <div className="flex justify-between items-center mt-[-10px] mb-2"> 
          <h2 className="text-lg font-semibold text-blue-300">推荐视频</h2>
          <nav className="flex space-x-4">
            <button className="text-sm text-gray-300 hover:text-white">热门</button>
            <button className="text-sm text-gray-300 hover:text-white">插件</button>
            <button className="text-sm text-gray-300 hover:text-white">设备推荐</button>
            <button className="text-sm text-gray-300 hover:text-white">直播教程</button>
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