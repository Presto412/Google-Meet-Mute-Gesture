import {
  MUTE_MIC,
  MUTE_VIDEO,
  PAGE_LOADED,
  PAGE_UNLOADED,
  PREDICTION,
  THRESHOLD,
  MUTED,
  RAISE_HAND,
  NOTIFICATION,
  FEATURE_TOGGLES,
  ENABLED,
} from "./constants";

window.threshold = 0.98;
window.muteMicEnabled = false;
window.window.muteVideoEnabled = false;
window.wraiseHandEnabled = false;

function handlePrediction(predictions) {
  let maxProb = -1;
  let className;
  for (const prediction of predictions) {
    if (prediction.probability >= maxProb) {
      maxProb = prediction.probability;
      className = prediction.className;
    }
  }
  console.debug(`prediction:${className}, maxProb:${maxProb}`);
  console.log(`threshold:${window.threshold}`);
  if (maxProb >= window.threshold) {
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
        if (window.muteVideoEnabled) {
          findElementByAriaLabelAndClick("Turn off camera", "Muted Video");
        }
        break;
      case RAISE_HAND:
        if (wraiseHandEnabled) {
          findElementByAriaLabelAndClick("Raise hand", "Raised Hand");
        }
      default:
        break;
    }
  }
}

function findElementByAriaLabelAndClick(searchString, msg) {
  let elem = [...document.querySelectorAll("[aria-label]")].filter((item) =>
    item.getAttribute("aria-label").includes(searchString)
  )[0];

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
      window.threshold = message.value;
      break;
    case FEATURE_TOGGLES:
      if (message[MUTE_MIC]) {
        if (message[MUTE_MIC] === ENABLED) {
          window.muteMicEnabled = true;
        } else {
          window.muteMicEnabled = false;
        }
      }
      if (message[MUTE_VIDEO]) {
        if (message[MUTE_VIDEO] === ENABLED) {
          window.muteVideoEnabled = true;
        } else {
          window.muteVideoEnabled = false;
        }
      }
      if (message[RAISE_HAND]) {
        if (message[RAISE_HAND] === ENABLED) {
          window.raiseHandEnabled = true;
        } else {
          window.raiseHandEnabled = false;
        }
      }
      if (message[THRESHOLD]) {
        window.threshold = message[THRESHOLD];
      }
    default:
      break;
  }
});

window.onload = (e) => {
  chrome.runtime.sendMessage({ message: PAGE_LOADED });
};
window.onunload = (e) => {
  chrome.runtime.sendMessage({ message: PAGE_UNLOADED });
};
