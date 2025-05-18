# OBS Audio Sources Script

This script allows you to enable and configure default audio sources in OBS Studio using the OBS WebSocket protocol.

## Features

- Creates desktop audio source (wasapi_output_capture) if it doesn't exist
- Creates microphone/AUX audio source (wasapi_input_capture) if it doesn't exist
- Applies noise suppression filter to desktop audio
- Configures audio sources with default device settings

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
node enable-audio-sources.js
```

Or use the npm script:

```bash
npm run enable-audio
```

## How It Works

1. The script connects to OBS via WebSocket
2. It checks if desktop audio and microphone/AUX sources already exist
3. If they don't exist, it creates them with default settings
4. It adds a noise suppression filter to the desktop audio source

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
- `create-display-capture.js` - For adding display capture sources
- `set-source-position.js` - For positioning sources in the scene

## License

This script is provided as-is under the same license as the main project.
