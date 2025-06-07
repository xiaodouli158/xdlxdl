// 测试资源文件是否正确打包
import fs from 'fs';
import path from 'path';

// 模拟生产环境路径
const appPath = 'C:\\Users\\fjweoijf\\AppData\\Local\\Programs\\xiaodouli';

function testResourcePaths() {
  console.log('测试资源文件打包情况...\n');
  
  // 测试字体文件
  console.log('=== 字体文件测试 ===');
  const fontPaths = [
    path.join(appPath, 'resources', 'app', 'public', 'fonts', 'CangErShuYuanTiW04-2.ttf'),
    path.join(appPath, 'resources', 'public', 'fonts', 'CangErShuYuanTiW04-2.ttf'),
  ];
  
  fontPaths.forEach((fontPath, index) => {
    const exists = fs.existsSync(fontPath);
    console.log(`字体路径 ${index + 1}: ${exists ? '✅' : '❌'} ${fontPath}`);
  });
  
  // 测试图片文件
  console.log('\n=== 图片文件测试 ===');
  const imagePaths = [
    path.join(appPath, 'resources', 'app', 'public', 'images', 'winer.gif'),
    path.join(appPath, 'resources', 'public', 'images', 'winer.gif'),
  ];
  
  imagePaths.forEach((imagePath, index) => {
    const exists = fs.existsSync(imagePath);
    console.log(`图片路径 ${index + 1}: ${exists ? '✅' : '❌'} ${imagePath}`);
  });
  
  // 测试图标文件
  console.log('\n=== 图标文件测试 ===');
  const iconPaths = [
    path.join(appPath, 'resources', 'app', 'public', 'icons', 'icon-32x32.ico'),
    path.join(appPath, 'resources', 'public', 'icons', 'icon-32x32.ico'),
    path.join(appPath, 'resources', 'app', 'public', 'xdllogo.ico'),
    path.join(appPath, 'resources', 'public', 'xdllogo.ico'),
  ];
  
  iconPaths.forEach((iconPath, index) => {
    const exists = fs.existsSync(iconPath);
    console.log(`图标路径 ${index + 1}: ${exists ? '✅' : '❌'} ${iconPath}`);
  });
  
  // 检查resources目录结构
  console.log('\n=== Resources目录结构 ===');
  const resourcesPath = path.join(appPath, 'resources');
  if (fs.existsSync(resourcesPath)) {
    console.log('Resources目录存在 ✅');
    try {
      const items = fs.readdirSync(resourcesPath);
      console.log('Resources目录内容:', items);
      
      // 检查public目录
      const publicPath = path.join(resourcesPath, 'public');
      if (fs.existsSync(publicPath)) {
        console.log('Public目录存在 ✅');
        const publicItems = fs.readdirSync(publicPath);
        console.log('Public目录内容:', publicItems);
      } else {
        console.log('Public目录不存在 ❌');
      }
      
      // 检查app/public目录
      const appPublicPath = path.join(resourcesPath, 'app', 'public');
      if (fs.existsSync(appPublicPath)) {
        console.log('App/Public目录存在 ✅');
        const appPublicItems = fs.readdirSync(appPublicPath);
        console.log('App/Public目录内容:', appPublicItems);
      } else {
        console.log('App/Public目录不存在 ❌');
      }
    } catch (error) {
      console.error('读取目录时出错:', error.message);
    }
  } else {
    console.log('Resources目录不存在 ❌');
  }
}

// 运行测试
testResourcePaths();
