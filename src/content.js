import { MUTE_MIC, MUTE_VIDEO, PAGE_LOADED, PAGE_UNLOADED } from "./constants";

function handlePrediction(predictions) {
  let maxProb = -1;
  let className;
  for (const prediction of predictions) {
    if (prediction.probability >= maxProb) {
      maxProb = prediction.probability;
      className = prediction.className;
    }
  }
  console.log(`prediction:${className}`);
  if (className === MUTE_MIC) {
    let elem = [...document.querySelectorAll("[data-tooltip]")].filter((item) =>
      item.getAttribute("aria-label").toString().includes("microphone")
    )[0];
    if (elem && elem.getAttribute("aria-label").includes("off")) {
      elem.click();
    }
  } else if (className === MUTE_VIDEO) {
    let elem = [...document.querySelectorAll("[data-tooltip]")].filter((item) =>
      item.getAttribute("aria-label").toString().includes("camera")
    )[0];
    if (elem && elem.getAttribute("aria-label").includes("off")) {
      elem.click();
    }
  }
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.prediction) {
    handlePrediction(message.prediction);
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
