// 测试cookie合并功能
import fs from 'fs';
import path from 'path';

console.log('测试Cookie合并功能:');
console.log('='.repeat(50));

// 模拟cookie文件路径
const testCookiePath = './test_cookies.txt';

// 模拟现有cookies（网页登录的）
const existingCookies = 'sessionid=web123; tt_webid=web456; passport_csrf_token=web789';

// 模拟新cookies（直播伴侣的）
const newCookies = 'sessionid=companion123; live_id=companion456; stream_token=companion789';

console.log('现有cookies (网页登录):', existingCookies);
console.log('新cookies (直播伴侣):', newCookies);
console.log('');

// 模拟合并逻辑
function mergeCookies(existing, newCookieString) {
    // 去重处理：解析现有cookies和新cookies，合并去重
    const existingCookieMap = new Map();
    const newCookieMap = new Map();
    
    // 解析现有cookies
    if (existing.trim()) {
        existing.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                existingCookieMap.set(name.trim(), value.trim());
            }
        });
    }
    
    // 解析新cookies
    newCookieString.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            newCookieMap.set(name.trim(), value.trim());
        }
    });
    
    // 合并cookies（新的覆盖旧的）
    const mergedCookieMap = new Map([...existingCookieMap, ...newCookieMap]);
    return Array.from(mergedCookieMap.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
}

// 测试合并
const mergedResult = mergeCookies(existingCookies, newCookies);

console.log('合并结果:');
console.log(mergedResult);
console.log('');

console.log('分析:');
console.log('- sessionid: 新值覆盖旧值 (companion123 覆盖 web123)');
console.log('- tt_webid: 保留网页登录的值 (web456)');
console.log('- passport_csrf_token: 保留网页登录的值 (web789)');
console.log('- live_id: 新增直播伴侣的值 (companion456)');
console.log('- stream_token: 新增直播伴侣的值 (companion789)');
console.log('');

console.log('Cookie合并功能测试完成！');
console.log('现在两种登录方式的cookie都会保存到同一个文件中。');
