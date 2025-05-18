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
    <div className="min-h-full bg-gray-900 text-white p-2 pt-0 flex flex-col h-full gap-2">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-xl font-bold text-indigo-400"></h1>
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
          <Link
            to="/app"
            className="px-6 py-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 ml-auto"
          >
            返回首页
          </Link>
        </div>

        {/* 平板设备选择 */}
        {deviceType === 'tablet' && (
          <div className="mt-4 flex flex-col md:flex-row gap-6">
            {/* 左侧选择区域 */}
            <div className="flex-1 flex flex-col gap-4">
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

            {/* 右侧预览框 - 简洁设计 - 平板样式 */}
            <div className="flex items-center justify-center md:w-1/3">
              {(appleiPadResolution || androidTabletResolution) && selectedDevice ? (
                <div
                  className="border border-gray-600 rounded-lg flex flex-col items-center justify-center p-4"
                  style={{
                    width: '240px',
                    height: '180px',
                    aspectRatio: selectedDevice.aspectRatio.replace(':', '/'),
                    background: 'rgba(22, 24, 29, 0.7)'
                  }}
                >
                  <div className="text-center w-full overflow-hidden px-2">
                    <div className="text-gray-300 text-xs mb-2 truncate">
                      {selectedDevice.brand}({selectedDevice.os}/{selectedDevice.screenSize})
                    </div>
                    <div className="text-indigo-300 font-semibold text-xs mb-2 truncate">
                      {selectedDevice.name}
                    </div>
                    <div className="text-gray-400 text-xs truncate">
                      {selectedDevice.resolution}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">请选择设备以查看预览</div>
              )}
            </div>
          </div>
        )}

        {/* 电脑设备选择 */}
        {deviceType === 'computer' && (
          <div className="mt-4 flex flex-col md:flex-row gap-6">
            {/* 左侧选择区域 */}
            <div className="flex-1">
              <div className="p-4 bg-gray-800 rounded-md">
                <p className="text-gray-300">电脑设备配置选项将在此显示</p>
              </div>
            </div>

            {/* 右侧预览框 - 简洁设计 - 电脑样式 */}
            <div className="flex items-center justify-center md:w-1/3">
              <div
                className="border border-gray-600 rounded-lg flex flex-col items-center justify-center p-4"
                style={{
                  width: '240px',
                  height: '135px', // 16:9 宽高比
                  aspectRatio: '16/9',
                  background: 'rgba(22, 24, 29, 0.7)'
                }}
              >
                <div className="text-center w-full overflow-hidden px-2">
                  <div className="text-gray-300 text-xs mb-1 truncate">
                    电脑(Windows/自定义尺寸)
                  </div>
                  <div className="text-indigo-300 font-semibold text-xs mb-1 truncate">
                    电脑设备
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    1920 x 1080
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 自定义设备选择 */}
        {deviceType === 'custom' && (
          <div className="mt-4 flex flex-col md:flex-row gap-6">
            {/* 左侧选择区域 */}
            <div className="flex-1">
              <div className="p-4 bg-gray-800 rounded-md">
                <div className="flex flex-col gap-4">
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
            </div>

            {/* 右侧预览框 - 简洁设计 - 自定义样式 */}
            <div className="flex items-center justify-center md:w-1/3">
              {customName && customResolution && selectedDevice ? (
                <div
                  className="border border-gray-600 rounded-lg flex flex-col items-center justify-center p-4"
                  style={{
                    width: '240px',
                    height: '180px',
                    aspectRatio: selectedDevice.aspectRatio.replace(':', '/'),
                    background: 'rgba(22, 24, 29, 0.7)'
                  }}
                >
                  <div className="text-center w-full overflow-hidden px-2">
                    <div className="text-gray-300 text-xs mb-2 truncate">
                      {selectedDevice.brand}({selectedDevice.os}/{selectedDevice.screenSize})
                    </div>
                    <div className="text-indigo-300 font-semibold text-xs mb-2 truncate">
                      {selectedDevice.name}
                    </div>
                    <div className="text-gray-400 text-xs truncate">
                      {selectedDevice.resolution}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">请输入设备名称和分辨率以查看预览</div>
              )}
            </div>
          </div>
        )}

        {/* 手机设备选择 - 使用下拉选择框 */}
        {deviceType === 'phone' && (
          <div className="mt-4 flex flex-col md:flex-row gap-6">
            {/* 左侧选择区域 */}
            <div className="flex-1 flex flex-col gap-4">
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

            {/* 右侧预览框 - 简洁设计 - 手机样式 */}
            <div className="flex items-center justify-center md:w-1/3">
              {(applePhoneResolution || androidPhoneResolution) && selectedDevice ? (
                <div
                  className="border border-gray-600 rounded-lg flex flex-col items-center justify-center p-3"
                  style={{
                    width: '100px',
                    height: '180px',
                    aspectRatio: selectedDevice.aspectRatio.replace(':', '/'),
                    background: 'rgba(22, 24, 29, 0.7)'
                  }}
                >
                  <div className="text-center w-full overflow-hidden px-1">
                    <div className="text-gray-300 text-[10px] mb-1 truncate">
                      {selectedDevice.brand}({selectedDevice.os}/{selectedDevice.screenSize})
                    </div>
                    <div className="text-indigo-300 font-semibold text-[10px] mb-1 truncate">
                      {selectedDevice.name}
                    </div>
                    <div className="text-gray-400 text-[10px] truncate">
                      {selectedDevice.resolution}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">请选择设备以查看预览</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* OBS配置管理区域 */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-indigo-900/30 shadow-lg mt-4">
        <h2 className="text-lg font-semibold text-indigo-300 mb-3">OBS配置管理</h2>

        {/* 左右布局容器 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 一键配置区域 - 左侧 */}
          <div>
            <h3 className="text-md font-medium text-indigo-200 mb-2">一键配置</h3>
            <div className="bg-gray-800/50 p-4 rounded-lg h-full">
              <p className="text-gray-300 text-sm mb-3">
                根据已选设备自动配置OBS场景、来源和设置，优化直播效果。
              </p>
              <div className="flex justify-center">
                <button
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center"
                  onClick={() => {
                    // 一键配置OBS的逻辑
                    alert('开始配置OBS...');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  一键配置OBS
                </button>
              </div>
            </div>
          </div>

          {/* 备份与还原区域 - 右侧 */}
          <div>
            <h3 className="text-md font-medium text-indigo-200 mb-2">备份与还原</h3>
            <div className="bg-gray-800/50 p-4 rounded-lg h-full">
              <p className="text-gray-300 text-sm mb-3">
                备份您的OBS配置文件，或从之前的备份中还原设置。
              </p>

              {/* 备份文件选择框 */}
              <div className="mb-4">
                <select
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  defaultValue=""
                >
                  <option value="" disabled>请选择备份文件</option>
                  <option value="backup_20230601">备份 2023-06-01 (10:30)</option>
                  <option value="backup_20230530">备份 2023-05-30 (15:45)</option>
                  <option value="backup_20230525">备份 2023-05-25 (09:15)</option>
                  <option value="backup_20230520">备份 2023-05-20 (14:20)</option>
                </select>
              </div>

              {/* 云备份和云还原按钮 */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center text-sm"
                  onClick={() => {
                    // OBS云备份逻辑
                    alert('开始OBS云备份...');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
                  </svg>
                  OBS云备份
                </button>
                <button
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center text-sm"
                  onClick={() => {
                    // OBS云还原逻辑
                    alert('开始OBS云还原...');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm5.25-9.25a.75.75 0 00-1.5 0v4.59l-1.95-2.1a.75.75 0 10-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V7.75z" clipRule="evenodd" />
                  </svg>
                  OBS云还原
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ObsConfigPage;