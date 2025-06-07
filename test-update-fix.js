// 测试更新检查修复
console.log('测试版本比较函数...');

// 模拟 isNewerVersion 函数
function isNewerVersion(current, latest) {
  // 验证输入参数
  if (!current || !latest) {
    console.warn('isNewerVersion: Invalid version parameters', { current, latest });
    return false;
  }

  // 确保参数是字符串
  const currentStr = String(current);
  const latestStr = String(latest);

  try {
    const currentParts = currentStr.split('.').map(Number);
    const latestParts = latestStr.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (latestPart > currentPart) {
        return true;
      } else if (latestPart < currentPart) {
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('Error comparing versions:', error.message, { current, latest });
    return false;
  }
}

// 测试用例
const testCases = [
  // 正常情况
  { current: '2.0.0', latest: '2.1.0', expected: true },
  { current: '2.1.0', latest: '2.0.0', expected: false },
  { current: '2.0.0', latest: '2.0.0', expected: false },
  
  // 边界情况 - 这些会导致原来的错误
  { current: undefined, latest: '2.1.0', expected: false },
  { current: '2.0.0', latest: undefined, expected: false },
  { current: null, latest: '2.1.0', expected: false },
  { current: '2.0.0', latest: null, expected: false },
  { current: '', latest: '2.1.0', expected: false },
  { current: '2.0.0', latest: '', expected: false },
];

console.log('\n开始测试...\n');

testCases.forEach((testCase, index) => {
  try {
    const result = isNewerVersion(testCase.current, testCase.latest);
    const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
    console.log(`测试 ${index + 1}: ${status}`);
    console.log(`  输入: current="${testCase.current}", latest="${testCase.latest}"`);
    console.log(`  期望: ${testCase.expected}, 实际: ${result}`);
    console.log('');
  } catch (error) {
    console.log(`测试 ${index + 1}: ❌ ERROR`);
    console.log(`  输入: current="${testCase.current}", latest="${testCase.latest}"`);
    console.log(`  错误: ${error.message}`);
    console.log('');
  }
});

console.log('测试完成！');
