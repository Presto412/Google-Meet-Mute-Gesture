import { Communicator } from "./communicator";
import {
  RAISE_HAND,
  POPUP_LOADED,
  THRESHOLD,
  FEATURE_TOGGLES,
  MUTE_MIC,
  MUTE_VIDEO,
  MODEL_URL,
} from "./constants";

chrome.runtime.onMessage.addListener((message, _sender) => {
  if (!message || message.receiver !== "popup") return;
  if (message[THRESHOLD]) {
    getElementByIdAsHTMLInputElement("result").innerHTML = message.THRESHOLD;
    getElementByIdAsHTMLInputElement("threshold").value = message.THRESHOLD;
  } else if (message[MUTE_MIC]) {
    getElementByIdAsHTMLInputElement("muteMic").checked = message[MUTE_MIC];
  } else if (message[MUTE_VIDEO]) {
    getElementByIdAsHTMLInputElement("muteVideo").checked = message[MUTE_VIDEO];
  } else if (message[RAISE_HAND]) {
    getElementByIdAsHTMLInputElement("raiseHand").checked = message[RAISE_HAND];
  }
});

window.addEventListener("DOMContentLoaded", function () {
  Communicator.sendMessageToBackground({
    type: POPUP_LOADED,
    [POPUP_LOADED]: true,
  });
  handleCheckboxToggle("muteMic", MUTE_MIC);
  handleCheckboxToggle("muteVideo", MUTE_VIDEO);
  handleCheckboxToggle("raiseHand", RAISE_HAND);
  document.getElementById("threshold").addEventListener("input", (e) => {
    let value = (<HTMLInputElement>e.target).value;
    document.getElementById("result").innerHTML = value;
    Communicator.sendMessageToBackground({
      type: FEATURE_TOGGLES,
      [THRESHOLD]: value,
    });
  });
  document.getElementById("urlButton").onclick = (e) => {
    const url = getElementByIdAsHTMLInputElement("url").value;
    Communicator.sendMessageToBackground({ type: MODEL_URL, url });
  };
});

function getElementByIdAsHTMLInputElement(id: string) {
  return <HTMLInputElement>document.getElementById(id);
}

function handleCheckboxToggle(id: string, inputMsg: string) {
  let checkbox = document.getElementById(id);
  checkbox.addEventListener("change", (e) => {
    if ((<HTMLInputElement>e.target).checked) {
      Communicator.sendMessageToBackground({
        type: FEATURE_TOGGLES,
        [inputMsg]: true,
      });
    } else {
      Communicator.sendMessageToBackground({
        type: FEATURE_TOGGLES,
        [inputMsg]: false,
      });
    }
  });
}
