import { build, Platform } from 'electron-builder';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define build configuration
const config = {
  appId: 'com.xdlwebcast.app',
  productName: 'XDLWebcast',
  asar: true,
  compression: 'maximum',
  directories: {
    buildResources: 'build',
    output: 'dist'
  },
  win: {
    target: ['nsis'],
    signAndEditExecutable: false,
    requestedExecutionLevel: 'requireAdministrator'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'XDLWebcast',
    include: 'build/installer.nsh',
    artifactName: 'XDLWebcast-Setup-${version}.${ext}'
  }
};

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
