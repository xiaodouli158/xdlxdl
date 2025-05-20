/**
 * Test script to check the getRecommendedEncoder function
 */

import { getRecommendedEncoder, detectDedicatedGPU } from './electron/utils/hardware-info.js';

async function testEncoder() {
  try {
    console.log('Testing GPU detection and encoder recommendation...');

    // First, get the dedicated GPU info
    console.log('Detecting dedicated GPU...');
    const gpu = await detectDedicatedGPU();
    console.log('GPU detection result:');
    console.log(JSON.stringify(gpu, null, 2));

    // Then get the recommended encoder
    console.log('\nGetting recommended encoder...');
    const encoder = await getRecommendedEncoder();
    console.log('Recommended encoder details:');
    console.log(JSON.stringify(encoder, null, 2));
  } catch (error) {
    console.error('Error testing encoder:', error);
    console.error(error.stack);
  }
}

// Run the test
testEncoder()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));
