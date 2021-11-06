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
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MODEL_IMAGE_WIDTH,
  MODEL_IMAGE_HEIGHT,
  RESET_DEFAULTS,
  REFRESH_DOM,
} from "./constants";
import { Communicator } from "./communicator";
import { Predictor } from "./predictor";
import { Cropper } from "./cropper";

let videoStream: MediaStream;
let doLoop = false;
let video: HTMLVideoElement = document.createElement("video");
let canvas: HTMLCanvasElement = document.createElement("canvas");

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
    if (result && Object.keys(result).length != 0) {
      console.log(`sending msg:${JSON.stringify(result)}`);
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
      Communicator.sendMessageToPopup({ [REFRESH_DOM]: true });
      break;
    case RESET_DEFAULTS:
      await handleModelUrlUpdate(DEFAULT_TMMODEL_URL);
      console.log("resetting toggles");
      handleFeatureToggle({ [MUTE_MIC]: true });
      handleFeatureToggle({ [MUTE_VIDEO]: true });
      handleFeatureToggle({ [RAISE_HAND]: true });
      handleFeatureToggle({ [THRESHOLD]: 0.98 });
      showNotification({ message: "Reset Defaults Succesfully" });
      Communicator.sendMessageToPopup({ [REFRESH_DOM]: true });
    default:
      break;
  }
});

async function handleModelUrlUpdate(url: string) {
  try {
    chrome.storage.local.set({ [MODEL_URL]: url });
    await Predictor.loadModel(url);
    showNotification({
      message: `Loaded Model successfully.`,
    });
  } catch (error) {
    chrome.storage.local.get([MODEL_URL], async (items) => {
      if (DEFAULT_TMMODEL_URL !== items[MODEL_URL]) {
        console.debug("Reloading default model.");
        await handleModelUrlUpdate(DEFAULT_TMMODEL_URL);
      }
    });
    showNotification({
      message: `Model Load Failed. Attempting to revert to default`,
    });
  }
}

function handleFeatureToggle(message: any) {
  console.log(`message: ${JSON.stringify(message)}`)
  let copy = message;
  delete copy.type;
  console.log(`copy: ${JSON.stringify(message)}`)
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
  sendLocalStorageInfoForKeyToPopup(MODEL_URL);
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
    video.playsInline = true;
    video.autoplay = true;
    video.srcObject = videoStream;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    if (doLoop) {
      setTimeout(async () => await loop(), 1000);
    }
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

async function loop() {
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  let squareImageBitmap = await Cropper.crop(canvas, 1 / 1);
  let scaledImageBitmap = await Cropper.resize(
    squareImageBitmap,
    MODEL_IMAGE_WIDTH,
    MODEL_IMAGE_HEIGHT
  );
  const prediction = await Predictor.predict(scaledImageBitmap);
  Communicator.sendMessageToTab({ action: PREDICTION, prediction }, MEET_URL);
  if (doLoop) {
    setTimeout(async () => await loop(), 500);
  }
}

async function destroyCam() {
  videoStream.getTracks().forEach(function (track: { stop: () => void }) {
    track.stop();
  });
}
