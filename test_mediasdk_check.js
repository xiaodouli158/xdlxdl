// Test script to verify MediaSDK_Server.exe process check before retrieving rtmp_push_url
// This is a manual test guide, not an automated test

/*
To test the implementation:

1. Start the application normally

2. Test Case 1: MediaSDK_Server.exe is NOT running
   - Make sure MediaSDK_Server.exe is not running
   - Click on the "Auto Stream" button with "抖音" platform and "直播伴侣" method selected
   - Observe the logs in the console:
     * You should see a message "检查MediaSDK_Server.exe进程是否正在运行..."
     * You should see "MediaSDK_Server.exe进程未运行，无法获取推流信息"
   - Verify that:
     * The application shows an error message about MediaSDK_Server.exe not running
     * The application does NOT attempt to access roomStore.json

3. Test Case 2: MediaSDK_Server.exe IS running
   - Start the MediaSDK_Server.exe process (this might happen automatically when using the Douyin Companion app)
   - Click on the "Auto Stream" button with "抖音" platform and "直播伴侣" method selected
   - Observe the logs in the console:
     * You should see a message "检查MediaSDK_Server.exe进程是否正在运行..."
     * You should see "检测到MediaSDK_Server.exe进程正在运行"
     * You should see "Getting Douyin companion info from roomStore.json"
     * You should see the roomStore.json being accessed to get the rtmp_push_url
   - Verify that:
     * The rtmp_push_url is successfully retrieved from roomStore.json and displayed in the UI

Note: This implementation ensures that the application only attempts to retrieve rtmp_push_url
from roomStore.json if the MediaSDK_Server.exe process is running. If the process is not running,
the application will return an error message without attempting to access roomStore.json.
*/

console.log('This is a manual test guide. Please follow the instructions in the comments.');
