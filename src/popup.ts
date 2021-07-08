import {
  RAISE_HAND,
  POPUP_LOADED,
  THRESHOLD,
  FEATURE_TOGGLES,
  MUTE_MIC,
  MUTE_VIDEO,
  ENABLED,
  DISABLED,
  MODEL_URL,
} from "./constants";

let port = chrome.runtime.connect({
  name: "GestureMeetPopupToBackground",
});

window.addEventListener("DOMContentLoaded", function () {
  port.postMessage({ type: POPUP_LOADED, [POPUP_LOADED]: true });
  handleCheckboxToggle("muteMic", MUTE_MIC);
  handleCheckboxToggle("muteVideo", MUTE_VIDEO);
  handleCheckboxToggle("raiseHand", RAISE_HAND);
  document.getElementById("threshold").addEventListener("input", (e) => {
      let value = (<HTMLInputElement>e.target).value;
      document.getElementById("result").innerHTML = value;
      port.postMessage({ type: FEATURE_TOGGLES, [THRESHOLD]: value });
    });
  document.getElementById("urlButton").onclick = (e) => {
    const url = getElementByIdAsHTMLInputElement("url").value;
    port.postMessage({ type: MODEL_URL, url });
  };
});

port.onMessage.addListener(function (msg) {
  if (msg[THRESHOLD]) {
    getElementByIdAsHTMLInputElement("result").innerHTML = msg.THRESHOLD;
    getElementByIdAsHTMLInputElement("threshold").value = msg.THRESHOLD;
  } else if (msg[MUTE_MIC]) {
    getElementByIdAsHTMLInputElement("muteMic").checked =
      msg[MUTE_MIC] === ENABLED;
  } else if (msg[MUTE_VIDEO]) {
    getElementByIdAsHTMLInputElement("muteVideo").checked =
      msg[MUTE_VIDEO] === ENABLED;
  } else if (msg[RAISE_HAND]) {
    getElementByIdAsHTMLInputElement("raiseHand").checked =
      msg[RAISE_HAND] === ENABLED;
  }
});

function getElementByIdAsHTMLInputElement(id: string) {
  return <HTMLInputElement>document.getElementById(id);
}

function handleCheckboxToggle(id: string, inputMsg: string) {
  let checkbox = document.getElementById(id);
  checkbox.addEventListener("change", (e) => {
    if ((<HTMLInputElement>e.target).checked) {
      port.postMessage({ type: FEATURE_TOGGLES, [inputMsg]: ENABLED });
    } else {
      port.postMessage({ type: FEATURE_TOGGLES, [inputMsg]: DISABLED });
    }
  });
}
