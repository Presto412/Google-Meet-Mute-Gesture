import "babel-polyfill";
import {
  DEFAULT_TMMODEL_URL,
  CAM_ACCESS,
  PAGE_LOADED,
  WELCOME_PAGE,
  PREDICTION,
  THRESHOLD,
  MEET_URL,
  NOTIFICATION,
  POPUP_LOADED,
  FEATURE_TOGGLES,
  RAISE_HAND,
  MUTE_VIDEO,
  MUTE_MIC,
  MODEL_URL,
  PAGE_UNLOADED,
} from "./constants";
import { Communicator } from "./communicator";
import { Predictor } from "./predictor";

let videoStream: MediaStream, imageCapture: ImageCapture;
let doLoop = false;

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

sendLocalStorageInfoForKeyToPopup(THRESHOLD);
chrome.storage.local.get([CAM_ACCESS, MODEL_URL], async (items) => {
  if (items[CAM_ACCESS]) {
    console.debug("cam access already exists");
    if (items[MODEL_URL]) {
      await Predictor.loadModel(items[MODEL_URL]);
    } else {
      await Predictor.loadModel(DEFAULT_TMMODEL_URL);
    }
  }
});

function sendLocalStorageInfoForKeyToPopup(key: string | any) {
  chrome.storage.local.get(key, (result) => {
    if (result) {
      Communicator.sendMessageToPopup({ [key]: result[key] });
    }
  });
}

chrome.storage.onChanged.addListener(async (changes, _namespace) => {
  if (CAM_ACCESS in changes) {
    console.debug("cam access granted");
    await Predictor.loadModel(DEFAULT_TMMODEL_URL);
  }
});

chrome.runtime.onMessage.addListener(async (message, _sender) => {
  if (message.receiver !== "background" || !message) {
    return;
  }
  switch (message.type) {
    case PAGE_LOADED:
      handlePageLoad();
      break;
    case PAGE_UNLOADED:
      handlePageUnload();
      break;
    case NOTIFICATION:
      showNotification(message);
      break;
    case POPUP_LOADED:
      handlePopupLoaded();
      break;
    case FEATURE_TOGGLES:
      handleFeatureToggle(message);
      break;
    case MODEL_URL:
      await handleModelUrlUpdate(message.url);
      break;
    default:
      break;
  }
});

async function handleModelUrlUpdate(url: string) {
  await Predictor.loadModel(url);
  chrome.storage.local.set({ [MODEL_URL]: url });
}

function handleFeatureToggle(message: any) {
  let copy = message;
  delete copy.type;
  Communicator.sendMessageToTab(
    {
      action: FEATURE_TOGGLES,
      ...copy,
    },
    MEET_URL
  );
  chrome.storage.local.set({ ...copy });
}

function handlePopupLoaded() {
  sendLocalStorageInfoForKeyToPopup(THRESHOLD);
  sendLocalStorageInfoForKeyToPopup(MUTE_MIC);
  sendLocalStorageInfoForKeyToPopup(MUTE_VIDEO);
  sendLocalStorageInfoForKeyToPopup(RAISE_HAND);
}

function handlePageUnload() {
  doLoop = false;
  destroyCam();
}

function handlePageLoad() {
  doLoop = true;
  setupCam();
  sendLocalStorageInfoForKeyToContentScript(THRESHOLD);
  sendLocalStorageInfoForKeyToContentScript(MUTE_MIC);
  sendLocalStorageInfoForKeyToContentScript(MUTE_VIDEO);
  sendLocalStorageInfoForKeyToContentScript(RAISE_HAND);
}

function sendLocalStorageInfoForKeyToContentScript(key: string | any) {
  chrome.storage.local.get(key, (result) => {
    if (result) {
      Communicator.sendMessageToTab(
        {
          action: FEATURE_TOGGLES,
          [key]: result[key],
        },
        MEET_URL
      );
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
      eventTime: Date.now() + 500,
    },
    () => {}
  );
}

async function setupCam() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    imageCapture = new ImageCapture(videoStream.getVideoTracks()[0]);
    if (doLoop) {
      setTimeout(async () => await loop(), 1000);
    }
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function loop() {
  if (
    !(
      imageCapture.track.readyState != "live" ||
      !imageCapture.track.enabled ||
      imageCapture.track.muted
    )
  ) {
    const prediction = await Predictor.predict(await imageCapture.grabFrame());
    Communicator.sendMessageToTab({ action: PREDICTION, prediction }, MEET_URL);
    if (doLoop) {
      setTimeout(async () => await loop(), 250);
    }
  }
}

async function destroyCam() {
  videoStream.getTracks().forEach(function (track: { stop: () => void }) {
    track.stop();
  });
}
