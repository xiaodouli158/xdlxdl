import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ObsConfigPage() {
  const [activeTab, setActiveTab] = useState('basic');
  
  // 模拟配置数据
  const basicSettings = {
    resolution: '1920x1080',
    fps: '60',
    bitrateVideo: '6000',
    bitrateAudio: '160',
    encoder: 'x264'
  };
  
  const templates = [
    { id: 1, name: '游戏直播', description: '适合各类游戏直播的高性能配置' },
    { id: 2, name: '桌面应用演示', description: '适合软件教程和桌面应用演示' },
    { id: 3, name: '1080p标准', description: '标准1080p60fps直播配置' },
    { id: 4, name: '720p流畅', description: '网络不稳定时的备用配置' },
    { id: 5, name: '手机直播', description: '针对手机画面优化的配置' }
  ];
  
  const scenes = [
    { id: 1, name: '开场等待', sources: ['倒计时', '背景音乐', '文字提示'] },
    { id: 2, name: '全屏游戏', sources: ['游戏捕获', '摄像头小窗', '弹幕显示'] },
    { id: 3, name: '桌面+摄像头', sources: ['桌面捕获', '摄像头', '聊天框'] }
  ];

  return (
    <div className="min-h-full bg-gray-900 text-white p-2 flex flex-col h-full gap-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-indigo-400">OBS 一键配置</h1>
        <Link to="/app" className="text-indigo-400 hover:text-indigo-300 text-sm">返回首页</Link>
      </div>
      
      {/* 标签页导航 */}
      <div className="flex border-b border-gray-700 mb-4">
        <button 
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'basic' 
              ? 'text-indigo-400 border-b-2 border-indigo-400' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('basic')}
        >
          基础设置
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'templates' 
              ? 'text-indigo-400 border-b-2 border-indigo-400' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('templates')}
        >
          配置模板
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'scenes' 
              ? 'text-indigo-400 border-b-2 border-indigo-400' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('scenes')}
        >
          场景设置
        </button>
      </div>
      
      {/* 基础设置内容 */}
      {activeTab === 'basic' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-indigo-900/30 shadow-lg">
            <h2 className="text-lg font-semibold text-indigo-300 mb-4">输出设置</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">视频分辨率</label>
                <select className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-600" value={basicSettings.resolution}>
                  <option value="1920x1080">1920x1080 (1080p)</option>
                  <option value="1280x720">1280x720 (720p)</option>
                  <option value="2560x1440">2560x1440 (1440p)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">帧率 (FPS)</label>
                <select className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-600" value={basicSettings.fps}>
                  <option value="30">30 FPS</option>
                  <option value="60">60 FPS</option>
                  <option value="120">120 FPS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">视频比特率</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="1000" 
                    max="10000" 
                    step="500" 
                    value={basicSettings.bitrateVideo}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-gray-300 text-sm min-w-[70px]">{basicSettings.bitrateVideo} Kbps</span>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">音频比特率</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="96" 
                    max="320" 
                    step="32" 
                    value={basicSettings.bitrateAudio}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-gray-300 text-sm min-w-[70px]">{basicSettings.bitrateAudio} Kbps</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-indigo-900/30 shadow-lg">
            <h2 className="text-lg font-semibold text-indigo-300 mb-4">编码器设置</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">编码器</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className={`py-2 px-3 rounded-lg text-sm ${basicSettings.encoder === 'x264' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    软件 (x264)
                  </button>
                  <button className={`py-2 px-3 rounded-lg text-sm ${basicSettings.encoder === 'nvenc' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    NVIDIA NVENC
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">预设</label>
                <select className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-600">
                  <option value="veryfast">很快 (低 CPU 使用率)</option>
                  <option value="faster">较快</option>
                  <option value="fast">快速</option>
                  <option value="medium">中等质量 (推荐)</option>
                  <option value="slow">慢速 (更好的质量)</option>
                </select>
              </div>
              
              <div className="pt-4">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  应用基础设置
                </button>
                <p className="text-gray-400 text-xs mt-2">
                  注意：应用设置将会重启 OBS，请确保已保存直播内容
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 配置模板内容 */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div 
              key={template.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-indigo-900/30 shadow-lg hover:border-indigo-600/50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-indigo-300 mb-2">{template.name}</h3>
              <p className="text-gray-300 text-sm mb-4">{template.description}</p>
              <div className="flex justify-between">
                <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                  查看详情
                </button>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                  应用模板
                </button>
              </div>
            </div>
          ))}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-dashed border-gray-600 shadow-lg flex flex-col items-center justify-center min-h-[180px]">
            <div className="text-4xl text-gray-600 mb-2">+</div>
            <p className="text-gray-400 text-sm text-center">创建自定义模板</p>
          </div>
        </div>
      )}
      
      {/* 场景设置内容 */}
      {activeTab === 'scenes' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-indigo-900/30 shadow-lg">
            <h2 className="text-lg font-semibold text-indigo-300 mb-4">场景预设</h2>
            
            {scenes.map(scene => (
              <div key={scene.id} className="mb-4 border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-medium text-indigo-200">{scene.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {scene.sources.map((source, index) => (
                        <span key={index} className="bg-gray-700/60 text-gray-300 text-xs px-2 py-1 rounded">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors">
                      编辑
                    </button>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs transition-colors">
                      应用
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button className="w-full mt-4 border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 py-2 rounded-lg text-sm transition-colors">
              + 添加新场景
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-indigo-900/30 shadow-lg">
            <h2 className="text-lg font-semibold text-indigo-300 mb-4">一键应用全套配置</h2>
            <p className="text-gray-300 text-sm mb-4">
              此操作会将所有设置一次性应用到 OBS，包括输出设置、编码器设置和场景预设。请确保已保存直播内容。
            </p>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              一键配置 OBS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ObsConfigPage; 