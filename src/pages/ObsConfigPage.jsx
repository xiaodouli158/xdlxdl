import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tabletModels, phoneModels } from '../data/deviceModels';

function ObsConfigPage() {
  const [deviceType, setDeviceType] = useState('tablet'); // 'tablet', 'computer', 'phone', 或 'custom'
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [appleiPadResolution, setAppleiPadResolution] = useState('');
  const [androidTabletResolution, setAndroidTabletResolution] = useState('');
  const [applePhoneResolution, setApplePhoneResolution] = useState('');
  const [androidPhoneResolution, setAndroidPhoneResolution] = useState('');
  const [customResolution, setCustomResolution] = useState('1920x1080');
  const [customName, setCustomName] = useState('自定义设备');

  // 初始化选择第一个设备
  useEffect(() => {
    if (deviceType === 'tablet' && tabletModels.length > 0) {
      const appleDevice = tabletModels.find(d => d.brand === 'Apple');
      if (appleDevice) {
        setSelectedDevice(appleDevice);
        setAppleiPadResolution(appleDevice.resolution);
      } else {
        setSelectedDevice(tabletModels[0]);
      }
    } else if (deviceType === 'phone' && phoneModels.length > 0) {
      const applePhone = phoneModels.find(d => d.brand === 'Apple');
      const androidPhone = phoneModels.find(d => d.brand !== 'Apple');

      if (applePhone) {
        setSelectedDevice(applePhone);
        setApplePhoneResolution(applePhone.resolution);
      } else if (androidPhone) {
        setSelectedDevice(androidPhone);
        setAndroidPhoneResolution(androidPhone.resolution);
      } else {
        setSelectedDevice(phoneModels[0]);
      }
    } else if (deviceType === 'computer') {
      // 电脑模式暂无设备数据
      setSelectedDevice(null);
    } else if (deviceType === 'custom') {
      // 创建自定义设备对象
      const customDevice = {
        id: 'custom',
        name: customName,
        brand: '自定义',
        resolution: customResolution,
        aspectRatio: getAspectRatioFromResolution(customResolution),
        os: '自定义系统',
        screenSize: '自定义尺寸',
        category: 'custom'
      };
      setSelectedDevice(customDevice);
    }
  }, [deviceType, customName, customResolution]);

  // 从分辨率字符串计算宽高比
  const getAspectRatioFromResolution = (resolution) => {
    try {
      const [width, height] = resolution.split('x').map(Number);
      if (width && height) {
        // 计算最大公约数
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        return `${width/divisor}:${height/divisor}`;
      }
    } catch (e) {
      console.error('分辨率格式错误', e);
    }
    return '16:9'; // 默认宽高比
  };



  // 获取Apple iPad分辨率选项
  const getAppleiPadResolutions = () => {
    const appleDevices = tabletModels.filter(device => device.brand === 'Apple');
    return appleDevices.map(device => ({
      value: device.resolution,
      label: `${device.name} - ${device.resolution}`
    }));
  };

  // 获取Android平板分辨率选项
  const getAndroidTabletResolutions = () => {
    const androidDevices = tabletModels.filter(device => device.brand !== 'Apple');
    return androidDevices.map(device => ({
      value: device.resolution,
      label: `${device.name} - ${device.resolution}`
    }));
  };

  // 获取Apple手机分辨率选项
  const getApplePhoneResolutions = () => {
    const appleDevices = phoneModels.filter(device => device.brand === 'Apple');
    return appleDevices.map(device => ({
      value: device.resolution,
      label: `${device.name} - ${device.resolution}`
    }));
  };

  // 获取Android手机分辨率选项
  const getAndroidPhoneResolutions = () => {
    const androidDevices = phoneModels.filter(device => device.brand !== 'Apple');
    return androidDevices.map(device => ({
      value: device.resolution,
      label: `${device.name} - ${device.resolution}`
    }));
  };

  // 处理机型选择
  const handleResolutionSelect = (resolution, type) => {
    let device;

    // 重置所有选择框，然后只设置当前选择的值
    if (type === 'apple-tablet') {
      setAndroidTabletResolution(''); // 重置另一个选择框
      setApplePhoneResolution('');
      setAndroidPhoneResolution('');

      device = tabletModels.find(d => d.brand === 'Apple' && d.resolution === resolution);
      setAppleiPadResolution(resolution);
    } else if (type === 'android-tablet') {
      setAppleiPadResolution(''); // 重置另一个选择框
      setApplePhoneResolution('');
      setAndroidPhoneResolution('');

      device = tabletModels.find(d => d.brand !== 'Apple' && d.resolution === resolution);
      setAndroidTabletResolution(resolution);
    } else if (type === 'apple-phone') {
      setAppleiPadResolution(''); // 重置平板选择框
      setAndroidTabletResolution('');
      setAndroidPhoneResolution(''); // 重置另一个手机选择框

      device = phoneModels.find(d => d.brand === 'Apple' && d.resolution === resolution);
      setApplePhoneResolution(resolution);
    } else if (type === 'android-phone') {
      setAppleiPadResolution(''); // 重置平板选择框
      setAndroidTabletResolution('');
      setApplePhoneResolution(''); // 重置另一个手机选择框

      device = phoneModels.find(d => d.brand !== 'Apple' && d.resolution === resolution);
      setAndroidPhoneResolution(resolution);
    }

    if (device) {
      setSelectedDevice(device);
    }
  };

  return (
    <div className="min-h-full bg-gray-900 text-white p-2 flex flex-col h-full gap-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-indigo-400">设备模型</h1>
        <Link to="/app" className="text-indigo-400 hover:text-indigo-300 text-sm">返回首页</Link>
      </div>

      {/* 设备类型选择 - 标签页设计 */}
      <div className="mb-6">
        <div className="flex border-b border-gray-700">
          <button
            className={`px-6 py-2 text-sm font-medium transition-colors ${
              deviceType === 'tablet'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
            onClick={() => {
              setDeviceType('tablet');
              // 重置所有选择框
              setAppleiPadResolution('');
              setAndroidTabletResolution('');
              setApplePhoneResolution('');
              setAndroidPhoneResolution('');
            }}
          >
            平板
          </button>
          <button
            className={`px-6 py-2 text-sm font-medium transition-colors ${
              deviceType === 'phone'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
            onClick={() => {
              setDeviceType('phone');
              // 重置所有选择框
              setAppleiPadResolution('');
              setAndroidTabletResolution('');
              setApplePhoneResolution('');
              setAndroidPhoneResolution('');
            }}
          >
            手机
          </button>
          <button
            className={`px-6 py-2 text-sm font-medium transition-colors ${
              deviceType === 'computer'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
            onClick={() => {
              setDeviceType('computer');
              // 重置所有选择框
              setAppleiPadResolution('');
              setAndroidTabletResolution('');
              setApplePhoneResolution('');
              setAndroidPhoneResolution('');
            }}
          >
            电脑
          </button>
          <button
            className={`px-6 py-2 text-sm font-medium transition-colors ${
              deviceType === 'custom'
                ? 'bg-indigo-600 text-white rounded-t-lg'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
            onClick={() => {
              setDeviceType('custom');
              // 重置所有选择框
              setAppleiPadResolution('');
              setAndroidTabletResolution('');
              setApplePhoneResolution('');
              setAndroidPhoneResolution('');
            }}
          >
            自定义
          </button>
        </div>

        {/* 平板设备选择 */}
        {deviceType === 'tablet' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">苹果 iPad:</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={appleiPadResolution}
                onChange={(e) => handleResolutionSelect(e.target.value, 'apple-tablet')}
              >
                <option value="">请选择机型</option>
                {getAppleiPadResolutions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">安卓平板:</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={androidTabletResolution}
                onChange={(e) => handleResolutionSelect(e.target.value, 'android-tablet')}
              >
                <option value="">请选择机型</option>
                {getAndroidTabletResolutions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 电脑设备选择 */}
        {deviceType === 'computer' && (
          <div className="mt-4 p-4 bg-gray-800 rounded-md">
            <p className="text-gray-300">电脑设备配置选项将在此显示</p>
          </div>
        )}

        {/* 自定义设备选择 */}
        {deviceType === 'custom' && (
          <div className="mt-4 p-4 bg-gray-800 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">设备名称:</label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="输入设备名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">分辨率 (宽x高):</label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={customResolution}
                  onChange={(e) => setCustomResolution(e.target.value)}
                  placeholder="例如: 1920x1080"
                />
              </div>
            </div>
          </div>
        )}

        {/* 手机设备选择 - 使用下拉选择框 */}
        {deviceType === 'phone' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">苹果手机:</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={applePhoneResolution}
                onChange={(e) => handleResolutionSelect(e.target.value, 'apple-phone')}
              >
                <option value="">请选择机型</option>
                {getApplePhoneResolutions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">安卓手机:</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={androidPhoneResolution}
                onChange={(e) => handleResolutionSelect(e.target.value, 'android-phone')}
              >
                <option value="">请选择机型</option>
                {getAndroidPhoneResolutions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 选中设备展示区域 - 移至底部 */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-indigo-900/30 shadow-lg mt-4">
        <h2 className="text-lg font-semibold text-indigo-300 mb-3">已选设备</h2>
        {selectedDevice ? (
          <div className="flex flex-col md:flex-row gap-4">
            {/* 设备框架可视化 */}
            <div className="flex-shrink-0 flex items-center justify-center bg-gray-800 rounded-lg p-4 w-full md:w-1/3">
              <div
                className={`border-4 border-gray-600 rounded-lg flex items-center justify-center ${
                  deviceType === 'tablet'
                    ? 'w-64 h-48'
                    : 'w-24 h-48'
                }`}
                style={{
                  aspectRatio: selectedDevice.aspectRatio.replace(':', '/'),
                  boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="text-center">
                  <div className="text-indigo-300 font-semibold">{selectedDevice.name}</div>
                  <div className="text-gray-400 text-xs">{selectedDevice.resolution}</div>
                </div>
              </div>
            </div>

            {/* 设备详细信息 */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400 text-xs">品牌</div>
                <div className="text-white">{selectedDevice.brand}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400 text-xs">操作系统</div>
                <div className="text-white">{selectedDevice.os}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400 text-xs">分辨率</div>
                <div className="text-white">{selectedDevice.resolution}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400 text-xs">屏幕尺寸</div>
                <div className="text-white">{selectedDevice.screenSize}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-800 rounded-lg text-center">
            {deviceType === 'computer' ? (
              <p className="text-gray-300">电脑模式暂无设备数据</p>
            ) : (
              <p className="text-gray-300">请选择一个设备</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ObsConfigPage;