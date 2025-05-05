/**
 * Cloudflare R2 Upload Script
 *
 * This script uploads the packaged exe installer to Cloudflare R2 for software version updates.
 * It uses the AWS SDK since Cloudflare R2 is S3-compatible.
 */

import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load package.json to get the current version
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const { version, build } = packageJson;
const productName = build?.productName || "Webcast Mate";

// Configuration for Cloudflare R2 - 凭据直接硬编码在代码中
const R2_ACCOUNT_ID = '84794ee73142290fa69ac64ae8fc7bee';
const R2_ACCESS_KEY_ID = '50ff0db943697b84c9386513d45fabb9';
const R2_SECRET_ACCESS_KEY = '3a33b9b6f3d8bcc1a05aea230d447af20db97f3cbe3776f1aecfbd8c39ccf579';
const R2_BUCKET_NAME = 'xiaodouliupdates';

// Configure the S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Path to the installer file
const installerFileName = `WebcastMate-Setup-${version}.exe`;
// Get the output directory from package.json
const outputDir = packageJson.build?.directories?.output || 'dist-electron';
const installerPath = path.join(rootDir, outputDir, installerFileName);

// Check if installer file exists
if (!fs.existsSync(installerPath)) {
  console.error(`Error: Installer file not found at ${installerPath}`);
  console.error('Please build the installer first using "npm run build"');
  process.exit(1);
}

// Create version info file
const versionInfo = {
  version,
  productName,
  releaseDate: new Date().toISOString(),
  downloadUrl: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${installerFileName}`,
  fileName: installerFileName,
  sha512: '', // We could add a hash here if needed
};

const versionInfoPath = path.join(rootDir, outputDir, 'latest-version.json');
fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2));

// Upload the installer file
async function uploadFile(filePath, key, contentType) {
  const fileStream = fs.createReadStream(filePath);

  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
        CacheControl: 'max-age=31536000', // Cache for 1 year
      },
    });

    upload.on('httpUploadProgress', (progress) => {
      console.log(`Uploading ${key}: ${Math.round((progress.loaded / progress.total) * 100)}%`);
    });

    await upload.done();
    console.log(`Successfully uploaded ${key} to ${R2_BUCKET_NAME}`);
    return true;
  } catch (error) {
    console.error(`Error uploading ${key}:`, error);
    return false;
  }
}

// Main function to upload both files
async function main() {
  console.log(`Uploading ${productName} version ${version} to Cloudflare R2...`);

  // Upload the installer
  const installerUploaded = await uploadFile(
    installerPath,
    installerFileName,
    'application/vnd.microsoft.portable-executable'
  );

  // Upload the version info file
  const versionInfoUploaded = await uploadFile(
    versionInfoPath,
    'latest-version.json',
    'application/json'
  );

  if (installerUploaded && versionInfoUploaded) {
    console.log('Upload completed successfully!');
    console.log(`Installer URL: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${installerFileName}`);
    console.log(`Version info URL: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/latest-version.json`);
  } else {
    console.error('Upload failed.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
