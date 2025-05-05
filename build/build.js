const builder = require('electron-builder');
const path = require('path');

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

// Build the app
builder.build({
  targets: builder.Platform.WINDOWS.createTarget(),
  config: config
})
.then(() => {
  console.log('Build completed successfully!');
})
.catch((error) => {
  console.error('Error during build:', error);
});
