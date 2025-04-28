// Check if cookie files exist
import fs from 'fs';
import path from 'path';
import os from 'os';

const userProfile = process.env.USERPROFILE || process.env.HOME;
const cookiesPath = path.join(userProfile, "AppData", "Roaming", "webcast_mate", "Network", "Cookies");
const localStatePath = path.join(userProfile, "AppData", "Roaming", "webcast_mate", "Local State");
const userStorePath = path.join(userProfile, "AppData", "Roaming", "webcast_mate", "WBStore", "userStore.json");

console.log("Checking paths...");
console.log(`Cookies path: ${cookiesPath} - Exists: ${fs.existsSync(cookiesPath)}`);
console.log(`Local State path: ${localStatePath} - Exists: ${fs.existsSync(localStatePath)}`);
console.log(`User Store path: ${userStorePath} - Exists: ${fs.existsSync(userStorePath)}`);

// If the cookies file exists, try to list its size
if (fs.existsSync(cookiesPath)) {
  try {
    const stats = fs.statSync(cookiesPath);
    console.log(`Cookies file size: ${stats.size} bytes`);
  } catch (error) {
    console.error(`Error getting file stats: ${error.message}`);
  }
}

// Check if the output file exists
const outputPath = path.join(process.cwd(), 'electron', 'modules', 'douyin_cookies.txt');
console.log(`Output path: ${outputPath} - Exists: ${fs.existsSync(outputPath)}`);

// If the output file exists, try to read its content
if (fs.existsSync(outputPath)) {
  try {
    const content = fs.readFileSync(outputPath, 'utf8');
    console.log(`Output file content length: ${content.length} characters`);
    console.log(`First 100 characters: ${content.substring(0, 100)}`);
  } catch (error) {
    console.error(`Error reading output file: ${error.message}`);
  }
}
