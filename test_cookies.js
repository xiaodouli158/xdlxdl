// Test script to run the cookie extraction
import { getDouyinCookies } from './electron/modules/getDouyinCompanion_cookies.js';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    console.log("Starting cookie extraction test...");
    const result = await getDouyinCookies();
    console.log("Result:", JSON.stringify(result, null, 2));

    // Explicitly save cookies to a file
    if (result.success && result.cookieString) {
      const outputPath = path.join(process.cwd(), 'douyin_cookies.txt');
      fs.writeFileSync(outputPath, result.cookieString, 'utf8');
      console.log(`Cookies saved to: ${outputPath}`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
