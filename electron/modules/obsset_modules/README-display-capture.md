# OBS Display Capture Script

This script allows you to create and configure a display capture source in OBS Studio using the OBS WebSocket protocol.

## Features

- Creates a display capture source in the current scene
- Automatically detects available monitors
- Selects the primary monitor by default
- Configures the display capture source with optimal settings

## Prerequisites

- Node.js installed on your system
- OBS Studio with WebSocket plugin enabled
- `obs-websocket-js` Node.js package installed

## Installation

1. Make sure you have Node.js installed on your system.
2. Install the required dependencies:

```bash
npm install obs-websocket-js
```

3. Configure OBS WebSocket:
   - Open OBS Studio
   - Go to Tools > WebSocket Server Settings
   - Enable the WebSocket server
   - Set a password if needed (update the script with your password)

## Usage

Run the script with Node.js:

```bash
node create-display-capture.js [sourceName]
```

### Parameters

- `sourceName` (optional): The name for the display capture source. If not provided, defaults to "显示器采集" (Display Capture in Chinese).

### Examples

```bash
# Create a display capture source with the default name
node create-display-capture.js

# Create a display capture source with a custom name
node create-display-capture.js "My Monitor"
```

## How It Works

1. The script connects to OBS via WebSocket
2. It checks if a display capture source with the specified name already exists
3. If the source doesn't exist, it creates a new display capture source
4. It retrieves the list of available monitors
5. It automatically selects the primary monitor (or the first available monitor if primary cannot be identified)
6. It configures the display capture source to capture the selected monitor

## Troubleshooting

If you encounter issues:

1. Make sure OBS Studio is running
2. Verify WebSocket server is enabled in OBS (Tools > WebSocket Server Settings)
3. Check that the port is correct (default is 4455)
4. Verify the password is correct
5. Check the console output for detailed error messages

## Integration with Other Scripts

This script can be used alongside other OBS WebSocket scripts in this project:

- `create-text-source.js` - For adding text sources
- `create-image-source.js` - For adding image sources
- `video-capture-device.js` - For adding video capture devices
- `set-source-position.js` - For positioning sources in the scene

## License

This script is provided as-is under the same license as the main project.
