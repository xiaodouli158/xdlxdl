/**
 * 设备模型数据
 * 包含主流平板和手机的机型、系统、分辨率等信息
 */

// 平板设备数据
export const tabletModels = [
  {
    id: 't1',
    brand: 'Apple',
    name: 'iPad Pro 12.9 (2022)',
    os: 'iPadOS 16',
    resolution: '2732 x 2048',
    aspectRatio: '4:3',
    screenSize: '12.9 英寸',
    processor: 'Apple M2',
    ram: '8GB/16GB',
    storage: '128GB/256GB/512GB/1TB/2TB',
    releaseYear: 2022,
    category: 'tablet',
    popular: true
  },
  {
    id: 't2',
    brand: 'Apple',
    name: 'iPad Pro 11 (2022)',
    os: 'iPadOS 16',
    resolution: '2388 x 1668',
    aspectRatio: '4:3',
    screenSize: '11 英寸',
    processor: 'Apple M2',
    ram: '8GB/16GB',
    storage: '128GB/256GB/512GB/1TB/2TB',
    releaseYear: 2022,
    category: 'tablet',
    popular: true
  },
  {
    id: 't3',
    brand: 'Apple',
    name: 'iPad Air (2022)',
    os: 'iPadOS 16',
    resolution: '2360 x 1640',
    aspectRatio: '4:3',
    screenSize: '10.9 英寸',
    processor: 'Apple M1',
    ram: '8GB',
    storage: '64GB/256GB',
    releaseYear: 2022,
    category: 'tablet',
    popular: true
  },
  {
    id: 't4',
    brand: 'Samsung',
    name: 'Galaxy Tab S9 Ultra',
    os: 'Android 13',
    resolution: '2960 x 1848',
    aspectRatio: '16:10',
    screenSize: '14.6 英寸',
    processor: 'Snapdragon 8 Gen 2',
    ram: '12GB/16GB',
    storage: '256GB/512GB/1TB',
    releaseYear: 2023,
    category: 'tablet',
    popular: true
  },
  {
    id: 't5',
    brand: 'Samsung',
    name: 'Galaxy Tab S9+',
    os: 'Android 13',
    resolution: '2800 x 1752',
    aspectRatio: '16:10',
    screenSize: '12.4 英寸',
    processor: 'Snapdragon 8 Gen 2',
    ram: '12GB',
    storage: '256GB/512GB',
    releaseYear: 2023,
    category: 'tablet',
    popular: true
  },
  {
    id: 't6',
    brand: 'Samsung',
    name: 'Galaxy Tab S9',
    os: 'Android 13',
    resolution: '2560 x 1600',
    aspectRatio: '16:10',
    screenSize: '11 英寸',
    processor: 'Snapdragon 8 Gen 2',
    ram: '8GB/12GB',
    storage: '128GB/256GB',
    releaseYear: 2023,
    category: 'tablet',
    popular: true
  },
  {
    id: 't7',
    brand: 'Xiaomi',
    name: 'Pad 6 Pro',
    os: 'Android 13 (MIUI 14)',
    resolution: '2880 x 1800',
    aspectRatio: '16:10',
    screenSize: '11 英寸',
    processor: 'Snapdragon 8+ Gen 1',
    ram: '8GB/12GB',
    storage: '128GB/256GB/512GB',
    releaseYear: 2023,
    category: 'tablet',
    popular: true
  },
  {
    id: 't8',
    brand: 'Xiaomi',
    name: 'Pad 6',
    os: 'Android 13 (MIUI 14)',
    resolution: '2880 x 1800',
    aspectRatio: '16:10',
    screenSize: '11 英寸',
    processor: 'Snapdragon 870',
    ram: '6GB/8GB',
    storage: '128GB/256GB',
    releaseYear: 2023,
    category: 'tablet',
    popular: true
  },
  {
    id: 't9',
    brand: 'Huawei',
    name: 'MatePad Pro 13.2',
    os: 'HarmonyOS 4.0',
    resolution: '2880 x 1920',
    aspectRatio: '3:2',
    screenSize: '13.2 英寸',
    processor: 'Kirin 9000S',
    ram: '12GB',
    storage: '256GB/512GB',
    releaseYear: 2023,
    category: 'tablet',
    popular: true
  },
  {
    id: 't10',
    brand: 'Huawei',
    name: 'MatePad Pro 12.2',
    os: 'HarmonyOS 3.0',
    resolution: '2560 x 1600',
    aspectRatio: '16:10',
    screenSize: '12.2 英寸',
    processor: 'Snapdragon 870',
    ram: '8GB',
    storage: '128GB/256GB',
    releaseYear: 2022,
    category: 'tablet',
    popular: false
  }
];

// 手机设备数据
export const phoneModels = [
  {
    id: 'p1',
    brand: 'Apple',
    name: 'iPhone 15 Pro Max',
    os: 'iOS 17',
    resolution: '2796 x 1290',
    aspectRatio: '19.5:9',
    screenSize: '6.7 英寸',
    processor: 'Apple A17 Pro',
    ram: '8GB',
    storage: '256GB/512GB/1TB',
    releaseYear: 2023,
    category: 'phone',
    popular: true
  },
  {
    id: 'p2',
    brand: 'Apple',
    name: 'iPhone 15 Pro',
    os: 'iOS 17',
    resolution: '2556 x 1179',
    aspectRatio: '19.5:9',
    screenSize: '6.1 英寸',
    processor: 'Apple A17 Pro',
    ram: '8GB',
    storage: '128GB/256GB/512GB/1TB',
    releaseYear: 2023,
    category: 'phone',
    popular: true
  },
  {
    id: 'p3',
    brand: 'Apple',
    name: 'iPhone 15',
    os: 'iOS 17',
    resolution: '2556 x 1179',
    aspectRatio: '19.5:9',
    screenSize: '6.1 英寸',
    processor: 'Apple A16 Bionic',
    ram: '6GB',
    storage: '128GB/256GB/512GB',
    releaseYear: 2023,
    category: 'phone',
    popular: true
  },
  {
    id: 'p4',
    brand: 'Samsung',
    name: 'Galaxy S24 Ultra',
    os: 'Android 14 (One UI 6.1)',
    resolution: '3120 x 1440',
    aspectRatio: '19.5:9',
    screenSize: '6.8 英寸',
    processor: 'Snapdragon 8 Gen 3',
    ram: '12GB',
    storage: '256GB/512GB/1TB',
    releaseYear: 2024,
    category: 'phone',
    popular: true
  },
  {
    id: 'p5',
    brand: 'Samsung',
    name: 'Galaxy S24+',
    os: 'Android 14 (One UI 6.1)',
    resolution: '3120 x 1440',
    aspectRatio: '19.5:9',
    screenSize: '6.7 英寸',
    processor: 'Snapdragon 8 Gen 3',
    ram: '12GB',
    storage: '256GB/512GB',
    releaseYear: 2024,
    category: 'phone',
    popular: true
  },
  {
    id: 'p6',
    brand: 'Samsung',
    name: 'Galaxy S24',
    os: 'Android 14 (One UI 6.1)',
    resolution: '2340 x 1080',
    aspectRatio: '19.5:9',
    screenSize: '6.2 英寸',
    processor: 'Snapdragon 8 Gen 3',
    ram: '8GB',
    storage: '128GB/256GB',
    releaseYear: 2024,
    category: 'phone',
    popular: true
  },
  {
    id: 'p7',
    brand: 'Xiaomi',
    name: 'Xiaomi 14 Ultra',
    os: 'Android 14 (MIUI 15)',
    resolution: '3200 x 1440',
    aspectRatio: '20:9',
    screenSize: '6.73 英寸',
    processor: 'Snapdragon 8 Gen 3',
    ram: '12GB/16GB',
    storage: '256GB/512GB/1TB',
    releaseYear: 2024,
    category: 'phone',
    popular: true
  },
  {
    id: 'p8',
    brand: 'Xiaomi',
    name: 'Xiaomi 14 Pro',
    os: 'Android 14 (MIUI 15)',
    resolution: '3200 x 1440',
    aspectRatio: '20:9',
    screenSize: '6.73 英寸',
    processor: 'Snapdragon 8 Gen 3',
    ram: '12GB/16GB',
    storage: '256GB/512GB/1TB',
    releaseYear: 2023,
    category: 'phone',
    popular: true
  },
  {
    id: 'p9',
    brand: 'Huawei',
    name: 'Mate 60 Pro+',
    os: 'HarmonyOS 4.0',
    resolution: '2720 x 1260',
    aspectRatio: '19.5:9',
    screenSize: '6.82 英寸',
    processor: 'Kirin 9000S',
    ram: '12GB/16GB',
    storage: '512GB/1TB',
    releaseYear: 2023,
    category: 'phone',
    popular: true
  },
  {
    id: 'p10',
    brand: 'Huawei',
    name: 'P60 Pro',
    os: 'HarmonyOS 3.1',
    resolution: '2700 x 1220',
    aspectRatio: '19.5:9',
    screenSize: '6.67 英寸',
    processor: 'Snapdragon 8+ Gen 1',
    ram: '8GB/12GB',
    storage: '256GB/512GB',
    releaseYear: 2023,
    category: 'phone',
    popular: true
  }
];

// 所有设备数据合并
export const allDevices = [...tabletModels, ...phoneModels];

// 按品牌获取设备
export const getDevicesByBrand = (brand) => {
  return allDevices.filter(device => device.brand === brand);
};

// 按类别获取设备
export const getDevicesByCategory = (category) => {
  return allDevices.filter(device => device.category === category);
};

// 获取所有品牌
export const getAllBrands = () => {
  const brands = new Set();
  allDevices.forEach(device => brands.add(device.brand));
  return Array.from(brands);
};

// 获取特定设备
export const getDeviceById = (id) => {
  return allDevices.find(device => device.id === id);
};
