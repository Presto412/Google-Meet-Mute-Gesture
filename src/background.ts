import "babel-polyfill";
import { CustomMobileNet, load } from "@teachablemachine/image";
import {
  DEFAULT_TMMODEL_URL,
  CAM_ACCESS,
  CANVAS_WIDTH,
  PAGE_LOADED,
  WELCOME_PAGE,
  CANVAS_HEIGHT,
  PREDICTION,
  MODEL_EXT,
  METADATA_EXT,
  THRESHOLD,
  MEET_URL,
  NOTIFICATION,
  POPUP_LOADED,
  FEATURE_TOGGLES,
  RAISE_HAND,
  MUTE_VIDEO,
  MUTE_MIC,
  MODEL_URL,
} from "./constants";

let model: CustomMobileNet, videoStream: MediaStream;
let video = document.createElement("video");
let canvas = document.createElement("canvas");
let doLoop = false;

chrome.runtime.onConnect.addListener(function (port) {
  sendLocalStorageInfoForKeyToPopup(port, THRESHOLD);
  port.onMessage.addListener(async function (msg) {
    switch (msg.type) {
      case POPUP_LOADED:
        sendLocalStorageInfoForKeyToPopup(port, THRESHOLD);
        sendLocalStorageInfoForKeyToPopup(port, MUTE_MIC);
        sendLocalStorageInfoForKeyToPopup(port, MUTE_VIDEO);
        sendLocalStorageInfoForKeyToPopup(port, RAISE_HAND);
        break;
      case FEATURE_TOGGLES:
        let copy = msg;
        delete copy.type;
        sendMessageToActiveMeetTab({
          action: FEATURE_TOGGLES,
          ...copy,
        });
        chrome.storage.local.set({ ...copy });
        break;
      case MODEL_URL:
        const {url} = msg;
        await loadModel(url);
        chrome.storage.local.set({[MODEL_URL]: url});
      default:
        break;
    }
  });
});

chrome.storage.local.get([CAM_ACCESS, MODEL_URL], async (items) => {
  if (items[CAM_ACCESS]) {
    console.debug("cam access already exists");
    if(items[MODEL_URL]) {
      await loadModel(items[MODEL_URL]);
    } else {
      await loadModel(DEFAULT_TMMODEL_URL);
    }
  }
});

chrome.storage.onChanged.addListener(async (changes, _namespace) => {
  if (CAM_ACCESS in changes) {
    console.debug("cam access granted");
    await loadModel(DEFAULT_TMMODEL_URL);
  }
});

// Do first-time setup to gain access to webcam, if necessary.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason.search(/install/g) === -1) {
    return;
  }
  chrome.tabs.create({
    url: chrome.extension.getURL(WELCOME_PAGE),
    active: true,
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.message === PAGE_LOADED) {
    doLoop = true;
    setupCam();
    sendLocalStorageInfoForKeyToContentScript(THRESHOLD);
    sendLocalStorageInfoForKeyToContentScript(MUTE_MIC);
    sendLocalStorageInfoForKeyToContentScript(MUTE_VIDEO);
    sendLocalStorageInfoForKeyToContentScript(RAISE_HAND);
  } else if (message && message.type && message.type === NOTIFICATION) {
    showNotification(message);
  } else {
    doLoop = false;
    destroyCam();
  }
});

function sendLocalStorageInfoForKeyToPopup(
  port: chrome.runtime.Port,
  key: string | any
) {
  chrome.storage.local.get(key, (result) => {
    if (result) {
      port.postMessage({ [key]: result[key] });
    }
  });
}

function sendLocalStorageInfoForKeyToContentScript(key: string | any) {
  chrome.storage.local.get(key, (result) => {
    if (result) {
      sendMessageToActiveMeetTab({
        action: FEATURE_TOGGLES,
        [key]: result[key],
      });
    }
  });
}

function showNotification(message: { message: any }) {
  chrome.notifications.create(
    "",
    {
      type: "basic",
      title: "Google Meet Gesture Mute",
      message: message.message,
      iconUrl: "/mute.png",
      eventTime: 500,
    },
    () => {}
  );
}

async function setupCam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
    })
    .then((mediaStream) => {
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
      video.srcObject = mediaStream;
      videoStream = mediaStream;
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      console.debug("src assigned");
    })
    .catch((error) => {
      console.warn(error);
    });
  if (doLoop) {
    setTimeout(async () => await loop(), 1000);
  }
}

async function loop() {
  const prediction = await predict(video);
  sendMessageToActiveMeetTab({ action: PREDICTION, prediction });
  if (doLoop) {
    setTimeout(async () => await loop(), 250);
  }
}

async function destroyCam() {
  videoStream.getTracks().forEach(function (track: { stop: () => void }) {
    track.stop();
  });
}

async function loadModel(url) {
  console.debug("Loading model...");
  const modelURL = url + MODEL_EXT;
  const metadataURL = url + METADATA_EXT;
  try {
    model = await load(modelURL, metadataURL);
    let maxPredictions = model.getTotalClasses();
    console.debug(`Max predictions:${maxPredictions}`);
  } catch (err) {
    console.error(
      `Unable to load model from URL: ${url}. Error: ${JSON.stringify(
        err
      )}`
    );
  }
}

async function predict(video: CanvasImageSource) {
  console.debug("Predicting...");
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  const prediction = await model.predict(canvas);
  return prediction;
}

const sendMessageToActiveMeetTab = (message: {
  [x: number]: any;
  action: string;
  prediction?: any;
}) => {
  chrome.tabs.query({}, function (tabs) {
    if (!tabs) {
      return;
    }
    let meetTabs = tabs.filter((tab) => tab.url.includes(MEET_URL));
    meetTabs[0] && chrome.tabs.sendMessage(meetTabs[0].id, message);
  });
};
