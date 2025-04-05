import React from 'react';
import { Link } from 'react-router-dom';

function DevicesPage() {
  // 模拟设备数据
  const devices = [
    { 
      id: 1, 
      name: 'Logitech C922 Pro', 
      category: '摄像头',
      price: '699',
      image: '/path/to/camera.jpg', 
      description: '高清网络摄像头，支持1080p/30fps或720p/60fps视频通话和录制' 
    },
    { 
      id: 2, 
      name: 'Blue Yeti X', 
      category: '麦克风',
      price: '1299',
      image: '/path/to/mic.jpg', 
      description: '专业电容麦克风，四种拾音模式，适合游戏直播和播客录制' 
    },
    { 
      id: 3, 
      name: 'Elgato Stream Deck MK.2', 
      category: '控制器',
      price: '1499',
      image: '/path/to/streamdeck.jpg', 
      description: '直播控制器，15个LCD按键，可自定义快捷操作' 
    },
    { 
      id: 4, 
      name: 'Corsair HS70 Pro', 
      category: '耳机',
      price: '699',
      image: '/path/to/headphone.jpg', 
      description: '无线游戏耳机，7.1环绕声，低延迟，舒适耳罩设计' 
    },
    { 
      id: 5, 
      name: 'Elgato Key Light', 
      category: '灯光',
      price: '1699',
      image: '/path/to/light.jpg', 
      description: '专业直播补光灯，可调色温，亮度高，无频闪' 
    },
    { 
      id: 6, 
      name: 'NVIDIA RTX 4060 Ti', 
      category: '显卡',
      price: '3499',
      image: '/path/to/gpu.jpg', 
      description: '适合直播和游戏的中端显卡，支持NVENC编码' 
    }
  ];

  return (
    <div className="min-h-full bg-gray-900 text-white p-2 flex flex-col h-full gap-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-indigo-400">设备推荐</h1>
        <Link to="/app" className="text-indigo-400 hover:text-indigo-300 text-sm">返回首页</Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(device => (
          <div 
            key={device.id} 
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-indigo-900/30 shadow-lg overflow-hidden hover:border-indigo-700/50 transition-colors"
          >
            <div className="h-48 bg-gray-800 flex items-center justify-center">
              {/* 图片占位符 */}
              <div className="text-gray-600 text-sm">[设备图片: {device.name}]</div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-indigo-300">{device.name}</h2>
                  <span className="inline-block bg-indigo-900/50 text-indigo-300 text-xs px-2 py-0.5 rounded mt-1">
                    {device.category}
                  </span>
                </div>
                <div className="text-indigo-400 font-medium">￥{device.price}</div>
              </div>
              <p className="text-sm text-gray-300 mt-3 mb-4">{device.description}</p>
              <div className="flex justify-between">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">
                  了解详情
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DevicesPage; 