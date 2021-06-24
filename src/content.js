import {
  MUTE_MIC,
  MUTE_VIDEO,
  PAGE_LOADED,
  PAGE_UNLOADED,
  PREDICTION,
  THRESHOLD,
} from "./constants";

window.threshold = 0.98;

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
        muteIfEligible("Turn off microphone");
        break;
      case MUTE_VIDEO:
        muteIfEligible("Turn off camera");
      default:
        break;
    }
  }
}

function muteIfEligible(searchString) {
  let elem = [...document.querySelectorAll("[aria-label]")].filter((item) =>
    item.getAttribute("aria-label").includes(searchString)
  )[0];

  if (elem) {
    elem.click();
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
    default:
      break;
  }
});

window.onload = (e) => {
  chrome.runtime.sendMessage({ message: PAGE_LOADED }, function (response) {});
};
window.onunload = (e) => {
  chrome.runtime.sendMessage(
    { message: PAGE_UNLOADED },
    function (response) {}
  );
};
