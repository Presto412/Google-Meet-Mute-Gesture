import {
  MUTE_MIC,
  MUTE_VIDEO,
  PAGE_LOADED,
  PAGE_UNLOADED,
  PREDICTION,
  THRESHOLD,
  RAISE_HAND,
  NOTIFICATION,
  FEATURE_TOGGLES,
  ENABLED,
} from "./constants";

let threshold = 0.98;
let muteMicEnabled = false;
let muteVideoEnabled = false;
let raiseHandEnabled = false;

function handlePrediction(predictions: any) {
  let maxProb = -1;
  let className: any;
  for (const prediction of predictions) {
    if (prediction.probability >= maxProb) {
      maxProb = prediction.probability;
      className = prediction.className;
    }
  }
  console.debug(`prediction:${className}, maxProb:${maxProb}`);
  console.log(`threshold:${threshold}`);
  if (maxProb >= threshold) {
    switch (className) {
      case MUTE_MIC:
        if (muteMicEnabled) {
          findElementByAriaLabelAndClick(
            "Turn off microphone",
            "Muted Microphone"
          );
        }
        break;
      case MUTE_VIDEO:
        if (muteVideoEnabled) {
          findElementByAriaLabelAndClick("Turn off camera", "Muted Video");
        }
        break;
      case RAISE_HAND:
        if (raiseHandEnabled) {
          findElementByAriaLabelAndClick("Raise hand", "Raised Hand");
        }
      default:
        break;
    }
  }
}

function findElementByAriaLabelAndClick(searchString: string, msg: string) {
  let elem: HTMLElement = Array.from(
    document.querySelectorAll("[aria-label]")
  ).filter((item) =>
    item.getAttribute("aria-label").includes(searchString)
  )[0] as HTMLElement;

  if (elem) {
    elem.click();
    msg && chrome.runtime.sendMessage({ type: NOTIFICATION, message: msg });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case PREDICTION:
      handlePrediction(message.prediction);
      break;
    case THRESHOLD:
      threshold = message.value;
      break;
    case FEATURE_TOGGLES:
      if (message[MUTE_MIC]) {
        if (message[MUTE_MIC] === ENABLED) {
          muteMicEnabled = true;
        } else {
          muteMicEnabled = false;
        }
      }
      if (message[MUTE_VIDEO]) {
        if (message[MUTE_VIDEO] === ENABLED) {
          muteVideoEnabled = true;
        } else {
          muteVideoEnabled = false;
        }
      }
      if (message[RAISE_HAND]) {
        if (message[RAISE_HAND] === ENABLED) {
          raiseHandEnabled = true;
        } else {
          raiseHandEnabled = false;
        }
      }
      if (message[THRESHOLD]) {
        threshold = message[THRESHOLD];
      }
    default:
      break;
  }
});

onload = (e) => {
  chrome.runtime.sendMessage({ message: PAGE_LOADED });
};
onunload = (e) => {
  chrome.runtime.sendMessage({ message: PAGE_UNLOADED });
};
