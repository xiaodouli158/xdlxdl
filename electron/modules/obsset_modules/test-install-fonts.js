/**
 * Test script for install-fonts.js ES module
 *
 * This script tests the converted ES module to ensure it works correctly
 * in both development and production environments.
 */

import { app } from 'electron';
import { getFontPath, installFonts, filesAreEqual } from './install-fonts.js';
import fs from 'fs';

// Mock app.isPackaged for testing
let originalIsPackaged;

function mockDevelopmentEnvironment() {
  originalIsPackaged = app.isPackaged;
  Object.defineProperty(app, 'isPackaged', {
    value: false,
    writable: true,
    configurable: true
  });
}

function mockProductionEnvironment() {
  Object.defineProperty(app, 'isPackaged', {
    value: true,
    writable: true,
    configurable: true
  });
}

function restoreEnvironment() {
  if (originalIsPackaged !== undefined) {
    Object.defineProperty(app, 'isPackaged', {
      value: originalIsPackaged,
      writable: true,
      configurable: true
    });
  }
}

async function testFontPaths() {
  console.log('Testing font path resolution...\n');

  // Test development environment
  console.log('1. Testing development environment:');
  mockDevelopmentEnvironment();
  const devPath = getFontPath();
  console.log(`   Development path: ${devPath}`);
  console.log(`   File exists: ${fs.existsSync(devPath)}`);

  // Test production environment
  console.log('\n2. Testing production environment:');
  mockProductionEnvironment();
  const prodPath = getFontPath();
  console.log(`   Production path: ${prodPath}`);
  console.log(`   File would be at: ${prodPath}`);

  // Restore original environment
  restoreEnvironment();
  console.log('\n3. Restored original environment');
  console.log(`   Current app.isPackaged: ${app.isPackaged}`);
  console.log(`   Current path: ${getFontPath()}`);

  // Test installFonts function
  console.log('\n4. Testing installFonts function:');
  try {
    const result = installFonts();
    console.log(`   Install result:`, result);
    console.log(`   Success: ${result.success}`);
    console.log(`   Message: ${result.message}`);
  } catch (error) {
    console.error(`   Error testing installFonts:`, error.message);
  }
}

// Export test function for use in other modules
export { testFontPaths };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFontPaths().catch(console.error);
}
