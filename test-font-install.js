// 测试字体安装功能
import { app } from 'electron';
import { installFonts, getFontPath } from './electron/modules/obsset_modules/install-fonts.js';
import fs from 'fs';

// 模拟Electron app环境
const mockApp = {
  isPackaged: true,
  getPath: (name) => {
    if (name === 'exe') {
      return 'C:\\Users\\fjweoijf\\AppData\\Local\\Programs\\xiaodoulizhibozhu\\小斗笠直播助手.exe';
    }
    return '';
  },
  getAppPath: () => 'C:\\Users\\fjweoijf\\AppData\\Local\\Programs\\xiaodoulizhibozhu\\resources\\app'
};

// 设置全局app对象
global.app = mockApp;

async function testFontInstallation() {
  console.log('开始测试字体安装功能...');
  
  try {
    // 测试获取字体路径
    const fontPath = getFontPath();
    console.log('字体文件路径:', fontPath);
    
    // 检查字体文件是否存在
    const fontExists = fs.existsSync(fontPath);
    console.log('字体文件存在:', fontExists);
    
    if (!fontExists) {
      console.error('字体文件不存在，请检查打包配置');
      return;
    }
    
    // 测试字体安装
    const result = await installFonts();
    console.log('字体安装结果:', result);
    
    if (result.success) {
      console.log('✅ 字体安装测试成功');
    } else {
      console.log('❌ 字体安装测试失败:', result.message);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
testFontInstallation();
