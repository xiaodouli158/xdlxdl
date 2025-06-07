import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getIconConfig, getBestIcon, availableSizes } from './icon-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Testing icon configuration...\n');

// Test 1: Check if all extracted icons exist
console.log('1. Checking extracted icon files:');
const iconsDir = path.join(rootDir, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  console.log('❌ Icons directory not found:', iconsDir);
  process.exit(1);
}

let allIconsExist = true;
availableSizes.forEach(size => {
  // 256x256 is PNG, others are ICO
  const iconFile = size === '256x256' ? `icon-${size}.png` : `icon-${size}.ico`;
  const iconPath = path.join(iconsDir, iconFile);

  if (fs.existsSync(iconPath)) {
    const stats = fs.statSync(iconPath);
    console.log(`✅ ${iconFile} (${stats.size} bytes)`);
  } else {
    console.log(`❌ ${iconFile} - NOT FOUND`);
    allIconsExist = false;
  }
});

if (!allIconsExist) {
  console.log('\n❌ Some icon files are missing. Run: node build/extract-icons.js');
  process.exit(1);
}

// Test 2: Check icon configuration
console.log('\n2. Testing icon configuration:');
const winConfig = getIconConfig('win');
console.log('Windows configuration:');
console.log(`  App icon: ${winConfig.icon}`);
console.log(`  Installer icon: ${winConfig.nsis.installerIcon}`);
console.log(`  Uninstaller icon: ${winConfig.nsis.uninstallerIcon}`);

// Test 3: Check if configured icons exist
console.log('\n3. Verifying configured icon paths:');
const configuredIcons = [
  { name: 'App icon', path: winConfig.icon },
  { name: 'Installer icon', path: winConfig.nsis.installerIcon },
  { name: 'Uninstaller icon', path: winConfig.nsis.uninstallerIcon }
];

configuredIcons.forEach(({ name, path: iconPath }) => {
  const fullPath = path.join(rootDir, iconPath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`✅ ${name}: ${iconPath} (${stats.size} bytes)`);
  } else {
    console.log(`❌ ${name}: ${iconPath} - NOT FOUND`);
  }
});

// Test 4: Check getBestIcon function
console.log('\n4. Testing getBestIcon function:');
const useCases = [
  'window', 'taskbar', 'desktop-shortcut', 'start-menu', 
  'installer', 'app-icon', 'notification', 'system-tray'
];

useCases.forEach(useCase => {
  const iconPath = getBestIcon(useCase);
  if (fs.existsSync(iconPath)) {
    const relativePath = path.relative(rootDir, iconPath);
    console.log(`✅ ${useCase}: ${relativePath}`);
  } else {
    console.log(`❌ ${useCase}: ${iconPath} - NOT FOUND`);
  }
});

// Test 5: Generate icon usage report
console.log('\n5. Icon usage report:');
const iconUsage = {};

// Count usage of each icon file
configuredIcons.forEach(({ name, path: iconPath }) => {
  const fileName = path.basename(iconPath);
  if (!iconUsage[fileName]) {
    iconUsage[fileName] = [];
  }
  iconUsage[fileName].push(name);
});

useCases.forEach(useCase => {
  const iconPath = getBestIcon(useCase);
  const fileName = path.basename(iconPath);
  if (!iconUsage[fileName]) {
    iconUsage[fileName] = [];
  }
  iconUsage[fileName].push(`getBestIcon('${useCase}')`);
});

Object.entries(iconUsage).forEach(([fileName, uses]) => {
  console.log(`📄 ${fileName}:`);
  uses.forEach(use => {
    console.log(`   - ${use}`);
  });
});

console.log('\n✅ Icon configuration test completed!');
console.log('\n📋 Summary:');
console.log(`   - ${availableSizes.length + 1} icon files available`);
console.log(`   - ${configuredIcons.length} icons configured for build`);
console.log(`   - ${useCases.length} use cases covered`);
console.log('\n🚀 Ready to build with optimized icons!');
