# Google Meet Gesture Mute - Chrome Extension

This project is a chrome extension that allows you to mute the audio/video on Google Meet based on a gesture.

![demo](static/handgesture-screenrecord.gif)

## Building the project

```sh
yarn
yarn build
```

To install the unpacked extension in chrome, follow the [instructions here](https://developer.chrome.com/extensions/getstarted).  Briefly, navigate to `chrome://extensions`, make sure that the `Developer mode` switch is turned on in the upper right, and click `Load Unpacked`.  Then select the appropriate directory (the `dist` directory containing `manifest.json`);

Also, if you'd like to use your own training model from google [teachable machine](https://teachablemachine.withgoogle.com/) (the model has training images of only my face at this point), do replace the URL in `src/constants.js` and make sure to have the gesture classes match the values(MUTE_MIC and MUTE_VIDEO constants in `src/constants.js`).


Using the extension
----
Once the extension is installed, a popup will appear to grant access to the camera. After which you can use the extension however you like.


TODO
----
- Configurable model URL from popup/setup page

Removing the extension
----
To remove the extension, click `Remove` on the extension page, or use the `Remove from Chrome...` menu option when right clicking the icon.
