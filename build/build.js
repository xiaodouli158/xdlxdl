import { build, Platform } from 'electron-builder';
import path from 'path';
import { fileURLToPath } from 'url';
import { getIconConfig } from './icon-config.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get optimized icon configuration
const iconConfig = getIconConfig('win');

// Define build configuration
const config = {
  appId: 'com.xdlwebcast.app',
  productName: '小斗笠直播助手',
  executableName: '小斗笠直播助手',
  asar: true,
  compression: 'maximum',
  directories: {
    buildResources: 'build',
    output: 'dist'
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'public/icons/**/*',
    'public/xdllogo.ico',
    'package.json'
  ],
  extraResources: [
    {
      from: 'public/icons',
      to: 'public/icons',
      filter: ['**/*']
    },
    {
      from: 'public/xdllogo.ico',
      to: 'public/xdllogo.ico'
    }
  ],
  win: {
    target: ['nsis'],
    signAndEditExecutable: false,
    requestedExecutionLevel: 'requireAdministrator',
    icon: iconConfig.icon,
    verifyUpdateCodeSignature: false
  },
  nsis: {
    oneClick: true,  // 启用一键安装（带进度条的静默安装）
    allowToChangeInstallationDirectory: false,  // 不允许更改安装目录
    perMachine: false,
    // 禁用默认快捷方式创建，我们在自定义脚本中创建
    createDesktopShortcut: false,
    createStartMenuShortcut: false,
    shortcutName: '小斗笠直播助手',
    include: 'build/installer.nsh',
    artifactName: '小斗笠直播助手-Setup-${version}.${ext}',
    installerIcon: iconConfig.nsis.installerIcon,
    uninstallerIcon: iconConfig.nsis.uninstallerIcon,
    deleteAppDataOnUninstall: false,
    runAfterFinish: true,  // 安装完成后启动应用程序
    displayLanguageSelector: false,
    // 带进度条的静默安装选项
    allowElevation: true,
    warningsAsErrors: false,
    // 支持静默安装参数
    installerHeaderIcon: iconConfig.nsis.installerIcon,
    // 进度条和界面设置
    installerSidebar: iconConfig.nsis.installerIcon,  // 安装侧边栏图标
    uninstallerSidebar: iconConfig.nsis.uninstallerIcon  // 卸载侧边栏图标
  }
};

// Run icon check before build
console.log('Checking icon configuration...');
try {
  const { execSync } = await import('child_process');
  execSync('node build/check-icon.js', { stdio: 'inherit' });
} catch (error) {
  console.warn('Icon check failed:', error.message);
}

// Log build start
console.log('Starting Electron build with configuration:', JSON.stringify(config, null, 2));

// Build the app
build({
  targets: Platform.WINDOWS.createTarget(),
  config: config
})
.then(() => {
  console.log('Build completed successfully!');
  console.log('Build output directory: ' + config.directories.output);
})
.catch((error) => {
  console.error('Error during build:', error);
  process.exit(1);
});
