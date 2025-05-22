function formatProfileName(deviceName) {
  if (!deviceName) return '';
  let formatted = deviceName.replace(/\s+/g, '_');
  formatted = formatted.replace(/[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffa-zA-Z0-9_]/g, '');
  return formatted;
}

// Quick tests
const tests = [
  '小米14 Pro！@#￥%',
  'MatePad Pro 13.2',
  '华为Mate60 Pro+（512GB）',
  'iPhone 15 Pro (256GB)',
  'Test_Device-2023@#$%^&*()',
  'Xiaomi 13T Pro 12GB+256GB'
];

console.log('Quick test results:');
tests.forEach(test => {
  console.log(`"${test}" -> "${formatProfileName(test)}"`);
});
