/**
 * Hardware Information Module
 *
 * This module provides functions to get detailed hardware information:
 * - CPU (model, cores, speed)
 * - GPU (model, VRAM)
 * - Memory (total, free, used)
 * - System (OS, platform, architecture)
 * - Storage (disks, size, free space)
 * - Network (interfaces, MAC addresses)
 *
 * Uses the systeminformation package for comprehensive hardware detection
 */

import si from 'systeminformation';

/**
 * Get basic system information
 * @returns {Promise<Object>} Object containing system information
 */
export async function getSystemInfo() {
  try {
    const [system, osInfo, bios, baseboard, chassis] = await Promise.all([
      si.system(),
      si.osInfo(),
      si.bios(),
      si.baseboard(),
      si.chassis()
    ]);

    return {
      system: {
        manufacturer: system.manufacturer,
        model: system.model,
        version: system.version,
        serial: system.serial,
        uuid: system.uuid,
        sku: system.sku
      },
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        codename: osInfo.codename,
        kernel: osInfo.kernel,
        arch: osInfo.arch,
        hostname: osInfo.hostname,
        fqdn: osInfo.fqdn,
        codepage: osInfo.codepage,
        logofile: osInfo.logofile,
        build: osInfo.build
      },
      bios: {
        vendor: bios.vendor,
        version: bios.version,
        releaseDate: bios.releaseDate,
        revision: bios.revision,
        serial: bios.serial
      },
      baseboard: {
        manufacturer: baseboard.manufacturer,
        model: baseboard.model,
        version: baseboard.version,
        serial: baseboard.serial,
        assetTag: baseboard.assetTag
      },
      chassis: {
        manufacturer: chassis.manufacturer,
        model: chassis.model,
        type: chassis.type,
        version: chassis.version,
        serial: chassis.serial,
        assetTag: chassis.assetTag,
        sku: chassis.sku
      }
    };
  } catch (error) {
    console.error('Error getting system information:', error);
    return {
      error: 'Failed to retrieve system information',
      message: error.message
    };
  }
}

/**
 * Get detailed CPU information
 * @returns {Promise<Object>} Object containing CPU information
 */
export async function getCpuInfo() {
  try {
    const [cpu, cpuTemp, cpuCurrentSpeed] = await Promise.all([
      si.cpu(),
      si.cpuTemperature(),
      si.cpuCurrentSpeed()
    ]);

    return {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      vendor: cpu.vendor,
      family: cpu.family,
      model: cpu.model,
      stepping: cpu.stepping,
      revision: cpu.revision,
      voltage: cpu.voltage,
      speed: cpu.speed,
      speedMin: cpu.speedMin,
      speedMax: cpu.speedMax,
      governor: cpu.governor,
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      efficiencyCores: cpu.efficiencyCores,
      performanceCores: cpu.performanceCores,
      processors: cpu.processors,
      socket: cpu.socket,
      flags: cpu.flags,
      virtualization: cpu.virtualization,
      cache: cpu.cache,
      temperature: {
        main: cpuTemp.main,
        cores: cpuTemp.cores,
        max: cpuTemp.max,
        socket: cpuTemp.socket,
        chipset: cpuTemp.chipset
      },
      currentSpeed: {
        avg: cpuCurrentSpeed.avg,
        min: cpuCurrentSpeed.min,
        max: cpuCurrentSpeed.max,
        cores: cpuCurrentSpeed.cores
      }
    };
  } catch (error) {
    console.error('Error getting CPU information:', error);
    return {
      error: 'Failed to retrieve CPU information',
      message: error.message
    };
  }
}

/**
 * Get GPU/Graphics information
 * @returns {Promise<Object>} Object containing graphics information
 */
export async function getGraphicsInfo() {
  try {
    const graphics = await si.graphics();

    return {
      controllers: graphics.controllers.map(controller => ({
        vendor: controller.vendor,
        subVendor: controller.subVendor,
        vendorId: controller.vendorId,
        model: controller.model,
        deviceId: controller.deviceId,
        bus: controller.bus,
        vram: controller.vram,
        vramDynamic: controller.vramDynamic,
        external: controller.external,
        cores: controller.cores,
        metalVersion: controller.metalVersion,
        driverVersion: controller.driverVersion
      })),
      displays: graphics.displays.map(display => ({
        vendor: display.vendor,
        vendorId: display.vendorId,
        model: display.model,
        productionYear: display.productionYear,
        serial: display.serial,
        displayId: display.displayId,
        main: display.main,
        builtin: display.builtin,
        connection: display.connection,
        sizeX: display.sizeX,
        sizeY: display.sizeY,
        pixelDepth: display.pixelDepth,
        resolutionX: display.resolutionX,
        resolutionY: display.resolutionY,
        currentResX: display.currentResX,
        currentResY: display.currentResY,
        positionX: display.positionX,
        positionY: display.positionY,
        currentRefreshRate: display.currentRefreshRate
      }))
    };
  } catch (error) {
    console.error('Error getting graphics information:', error);
    return {
      error: 'Failed to retrieve graphics information',
      message: error.message
    };
  }
}

/**
 * Detect dedicated GPU from available graphics controllers
 * @returns {Promise<Object|null>} Dedicated GPU information or null if not found
 */
export async function detectDedicatedGPU() {
  try {
    const graphics = await si.graphics();

    if (!graphics.controllers || graphics.controllers.length === 0) {
      console.log('No graphics controllers detected');
      return null;
    }

    // Common dedicated GPU vendors
    const dedicatedGPUVendors = [
      'nvidia', 'amd', 'ati', 'advanced micro devices', 'radeon',
      'geforce', 'quadro', 'firepro', 'radeon pro'
    ];

    // First, look for controllers with external=true (usually means dedicated)
    const externalGPUs = graphics.controllers.filter(gpu => gpu.external === true);
    if (externalGPUs.length > 0) {
      console.log('Found external/dedicated GPU:', externalGPUs[0].model);
      return {
        ...externalGPUs[0],
        isDedicated: true,
        reason: 'external'
      };
    }

    // Next, look for controllers with significant VRAM (likely dedicated)
    // But exclude Intel integrated GPUs which may report high VRAM but are not dedicated
    const highVramGPUs = graphics.controllers.filter(gpu => {
      const vendorLower = (gpu.vendor || '').toLowerCase();
      const modelLower = (gpu.model || '').toLowerCase();

      // Check if it's an Intel integrated GPU
      const isIntelIntegrated = vendorLower.includes('intel') &&
        (modelLower.includes('hd graphics') ||
         modelLower.includes('uhd graphics') ||
         modelLower.includes('iris') ||
         modelLower.includes('integrated'));

      // Only include GPUs with high VRAM that are not Intel integrated
      return gpu.vram && gpu.vram >= 1024 && !isIntelIntegrated;
    });

    if (highVramGPUs.length > 0) {
      console.log('Found high VRAM dedicated GPU:', highVramGPUs[0].model);
      return {
        ...highVramGPUs[0],
        isDedicated: true,
        reason: 'high_vram'
      };
    }

    // If we didn't find a dedicated GPU but we have an Intel GPU with high VRAM,
    // return it but mark it as not truly dedicated
    const intelHighVramGPUs = graphics.controllers.filter(gpu => {
      const vendorLower = (gpu.vendor || '').toLowerCase();
      return vendorLower.includes('intel') && gpu.vram && gpu.vram >= 1024;
    });

    if (intelHighVramGPUs.length > 0) {
      console.log('Found Intel GPU with high VRAM:', intelHighVramGPUs[0].model);
      return {
        ...intelHighVramGPUs[0],
        isDedicated: false,
        isIntegrated: true,
        reason: 'intel_integrated'
      };
    }

    // Finally, check by vendor name
    for (const gpu of graphics.controllers) {
      const vendorLower = (gpu.vendor || '').toLowerCase();
      const modelLower = (gpu.model || '').toLowerCase();

      // Check if the vendor or model contains any of the dedicated GPU vendor names
      const isDedicatedByVendor = dedicatedGPUVendors.some(vendor =>
        vendorLower.includes(vendor) || modelLower.includes(vendor)
      );

      // Exclude integrated Intel GPUs
      const isIntelIntegrated = vendorLower.includes('intel') &&
        (modelLower.includes('hd graphics') ||
         modelLower.includes('uhd graphics') ||
         modelLower.includes('iris') ||
         modelLower.includes('integrated'));

      if (isDedicatedByVendor && !isIntelIntegrated) {
        console.log('Found dedicated GPU by vendor/model:', gpu.model);
        return {
          ...gpu,
          isDedicated: true,
          reason: 'vendor'
        };
      }
    }

    console.log('No dedicated GPU detected');
    return null;
  } catch (error) {
    console.error('Error detecting dedicated GPU:', error);
    return null;
  }
}

/**
 * Get recommended encoder for OBS based on available hardware
 * @returns {Promise<Object>} Recommended encoder information
 */
export async function getRecommendedEncoder() {
  try {
    const dedicatedGPU = await detectDedicatedGPU();

    // Default encoder (software x264)
    let encoder = {
      name: 'obs_x264',
      type: 'software',
      quality: 'medium',
      preset: 'veryfast',
      gpu: null
    };

    if (dedicatedGPU) {
      const vendorLower = (dedicatedGPU.vendor || '').toLowerCase();
      const modelLower = (dedicatedGPU.model || '').toLowerCase();

      // Check if it's an integrated GPU or explicitly marked as not dedicated
      const isIntegrated = dedicatedGPU.isIntegrated === true || dedicatedGPU.isDedicated === false;
      const isIntelGPU = vendorLower.includes('intel');

      // For Intel GPUs or integrated GPUs, use software encoding
      if (isIntelGPU || isIntegrated) {
        encoder = {
          name: 'obs_x264',
          type: 'software',
          quality: 'medium',
          preset: 'veryfast',
          gpu: dedicatedGPU,
          note: isIntelGPU
            ? 'Intel GPU detected, using software encoding for better quality'
            : 'Integrated GPU detected, using software encoding for better quality'
        };
      }
      // NVIDIA NVENC
      else if (vendorLower.includes('nvidia')) {
        encoder = {
          name: 'jim_nvenc',  // New NVENC encoder in OBS
          type: 'hardware',
          quality: 'high',
          preset: 'p5', // Quality preset
          gpu: dedicatedGPU
        };
      }
      // AMD AMF
      else if (vendorLower.includes('amd') || vendorLower.includes('ati') || modelLower.includes('radeon')) {
        encoder = {
          name: 'amd_amf_h264',
          type: 'hardware',
          quality: 'high',
          preset: 'quality',
          gpu: dedicatedGPU
        };
      }
    }

    console.log(`Recommended encoder: ${encoder.name} (${encoder.type})`);
    if (encoder.gpu) {
      console.log(`Using GPU: ${encoder.gpu.model} with ${encoder.gpu.vram}MB VRAM`);
    }

    return encoder;
  } catch (error) {
    console.error('Error determining recommended encoder:', error);
    return {
      name: 'obs_x264',
      type: 'software',
      quality: 'medium',
      preset: 'veryfast',
      gpu: null
    };
  }
}

/**
 * Check if OBS is using a specific GPU
 * @param {string} obsProfilePath - Path to OBS profile directory
 * @returns {Promise<Object>} Information about the GPU being used by OBS
 */
export async function checkOBSGPUUsage(obsProfilePath) {
  try {
    // Get dedicated GPU
    const dedicatedGPU = await detectDedicatedGPU();

    // Default result
    const result = {
      usingDedicatedGPU: false,
      currentGPU: null,
      recommendedGPU: dedicatedGPU,
      encoderType: 'software'
    };

    // If no dedicated GPU found, return default result
    if (!dedicatedGPU) {
      console.log('No dedicated GPU detected for OBS');
      return result;
    }

    // Try to determine which GPU OBS is using based on profile settings
    // This is a simplified approach and may not be 100% accurate
    try {
      // Check if OBS profile path exists
      if (obsProfilePath) {
        const basicIniPath = path.join(obsProfilePath, 'basic.ini');

        if (fs.existsSync(basicIniPath)) {
          const basicIniContent = fs.readFileSync(basicIniPath, 'utf8');

          // Check for hardware encoder settings
          const usingNVENC = basicIniContent.includes('jim_nvenc') || basicIniContent.includes('ffmpeg_nvenc');
          const usingAMF = basicIniContent.includes('amd_amf_h264') || basicIniContent.includes('h264_amf');

          if (usingNVENC || usingAMF) {
            result.usingDedicatedGPU = true;
            result.encoderType = 'hardware';
            result.currentGPU = dedicatedGPU;
          }
        }
      }
    } catch (error) {
      console.error('Error checking OBS profile settings:', error);
    }

    return result;
  } catch (error) {
    console.error('Error checking OBS GPU usage:', error);
    return {
      usingDedicatedGPU: false,
      currentGPU: null,
      recommendedGPU: null,
      encoderType: 'unknown'
    };
  }
}

/**
 * Get memory information
 * @returns {Promise<Object>} Object containing memory information
 */
export async function getMemoryInfo() {
  try {
    const [memory, memLayout] = await Promise.all([
      si.mem(),
      si.memLayout()
    ]);

    return {
      memory: {
        total: memory.total,
        free: memory.free,
        used: memory.used,
        active: memory.active,
        available: memory.available,
        buffcache: memory.buffcache,
        buffers: memory.buffers,
        cached: memory.cached,
        slab: memory.slab,
        swaptotal: memory.swaptotal,
        swapused: memory.swapused,
        swapfree: memory.swapfree,
        writeback: memory.writeback,
        dirty: memory.dirty,
        total_formatted: formatBytes(memory.total),
        free_formatted: formatBytes(memory.free),
        used_formatted: formatBytes(memory.used)
      },
      layout: memLayout.map(module => ({
        size: module.size,
        bank: module.bank,
        type: module.type,
        clockSpeed: module.clockSpeed,
        formFactor: module.formFactor,
        manufacturer: module.manufacturer,
        partNum: module.partNum,
        serialNum: module.serialNum,
        voltageConfigured: module.voltageConfigured,
        voltageMin: module.voltageMin,
        voltageMax: module.voltageMax
      }))
    };
  } catch (error) {
    console.error('Error getting memory information:', error);
    return {
      error: 'Failed to retrieve memory information',
      message: error.message
    };
  }
}

/**
 * Get disk and storage information
 * @returns {Promise<Object>} Object containing disk information
 */
export async function getDiskInfo() {
  try {
    const [diskLayout, fsSize, blockDevices] = await Promise.all([
      si.diskLayout(),
      si.fsSize(),
      si.blockDevices()
    ]);

    return {
      disks: diskLayout.map(disk => ({
        device: disk.device,
        type: disk.type,
        name: disk.name,
        vendor: disk.vendor,
        size: disk.size,
        bytesPerSector: disk.bytesPerSector,
        totalCylinders: disk.totalCylinders,
        totalHeads: disk.totalHeads,
        totalSectors: disk.totalSectors,
        totalTracks: disk.totalTracks,
        tracksPerCylinder: disk.tracksPerCylinder,
        sectorsPerTrack: disk.sectorsPerTrack,
        firmwareRevision: disk.firmwareRevision,
        serialNum: disk.serialNum,
        interfaceType: disk.interfaceType,
        smartStatus: disk.smartStatus,
        temperature: disk.temperature,
        size_formatted: formatBytes(disk.size)
      })),
      filesystems: fsSize.map(fs => ({
        fs: fs.fs,
        type: fs.type,
        size: fs.size,
        used: fs.used,
        available: fs.available,
        use: fs.use,
        mount: fs.mount,
        rw: fs.rw,
        size_formatted: formatBytes(fs.size),
        used_formatted: formatBytes(fs.used),
        available_formatted: formatBytes(fs.available)
      })),
      blockDevices: blockDevices.map(device => ({
        name: device.name,
        type: device.type,
        fsType: device.fsType || (device['fstype'] || ''), // Handle both property names
        mount: device.mount,
        size: device.size,
        physical: device.physical,
        uuid: device.uuid,
        label: device.label,
        model: device.model,
        serial: device.serial,
        removable: device.removable,
        protocol: device.protocol,
        group: device.group,
        device: device.device,
        size_formatted: formatBytes(device.size)
      }))
    };
  } catch (error) {
    console.error('Error getting disk information:', error);
    return {
      error: 'Failed to retrieve disk information',
      message: error.message
    };
  }
}

/**
 * Get network information
 * @returns {Promise<Object>} Object containing network information
 */
export async function getNetworkInfo() {
  try {
    const [networkInterfaces, networkStats] = await Promise.all([
      si.networkInterfaces(),
      si.networkStats()
    ]);

    return {
      interfaces: networkInterfaces.map(iface => ({
        iface: iface.iface,
        ifaceName: iface.ifaceName,
        default: iface.default,
        ip4: iface.ip4,
        ip4subnet: iface.ip4subnet,
        ip6: iface.ip6,
        ip6subnet: iface.ip6subnet,
        mac: iface.mac,
        internal: iface.internal,
        virtual: iface.virtual,
        operstate: iface.operstate,
        type: iface.type,
        duplex: iface.duplex,
        mtu: iface.mtu,
        speed: iface.speed,
        dhcp: iface.dhcp,
        dnsSuffix: iface.dnsSuffix,
        ieee8021xAuth: iface.ieee8021xAuth,
        ieee8021xState: iface.ieee8021xState,
        carrierChanges: iface.carrierChanges
      })),
      stats: networkStats.map(stat => ({
        iface: stat.iface,
        operstate: stat.operstate,
        rx_bytes: stat.rx_bytes,
        rx_dropped: stat.rx_dropped,
        rx_errors: stat.rx_errors,
        tx_bytes: stat.tx_bytes,
        tx_dropped: stat.tx_dropped,
        tx_errors: stat.tx_errors,
        rx_sec: stat.rx_sec,
        tx_sec: stat.tx_sec,
        ms: stat.ms
      }))
    };
  } catch (error) {
    console.error('Error getting network information:', error);
    return {
      error: 'Failed to retrieve network information',
      message: error.message
    };
  }
}

/**
 * Get all hardware information
 * @returns {Promise<Object>} Object containing all hardware information
 */
export async function getAllHardwareInfo() {
  try {
    const [system, cpu, graphics, memory, disk, network] = await Promise.all([
      getSystemInfo(),
      getCpuInfo(),
      getGraphicsInfo(),
      getMemoryInfo(),
      getDiskInfo(),
      getNetworkInfo()
    ]);

    return {
      system,
      cpu,
      graphics,
      memory,
      disk,
      network
    };
  } catch (error) {
    console.error('Error getting all hardware information:', error);
    return {
      error: 'Failed to retrieve hardware information',
      message: error.message
    };
  }
}

/**
 * Format bytes to a human-readable string
 * @param {number} bytes - The number of bytes
 * @param {number} decimals - The number of decimal places
 * @returns {string} Formatted string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Default export for easy importing
export default {
  getAllHardwareInfo,
  getSystemInfo,
  getCpuInfo,
  getGraphicsInfo,
  getMemoryInfo,
  getDiskInfo,
  getNetworkInfo,
  detectDedicatedGPU,
  getRecommendedEncoder,
  checkOBSGPUUsage
};
