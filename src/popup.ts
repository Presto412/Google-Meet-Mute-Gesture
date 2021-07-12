import { Communicator } from "./communicator";
import {
  RAISE_HAND,
  POPUP_LOADED,
  THRESHOLD,
  FEATURE_TOGGLES,
  MUTE_MIC,
  MUTE_VIDEO,
  MODEL_URL,
  RESET_DEFAULTS,
  REFRESH_DOM,
} from "./constants";

let muteMicCheckbox: HTMLInputElement,
  muteVideoCheckbox: HTMLInputElement,
  raiseHandCheckBox: HTMLInputElement,
  thresholdSlider: HTMLInputElement,
  thresholdValue: HTMLInputElement,
  urlForm: HTMLFormElement,
  urlInput: HTMLInputElement,
  urlButton: HTMLInputElement,
  urlDisplay: HTMLLinkElement,
  defaultButton: HTMLInputElement;
chrome.runtime.onMessage.addListener((message, _sender) => {
  if (!message || message.receiver !== "popup") return;
  console.log(`recd: ${JSON.stringify(message)}`);
  if (message[REFRESH_DOM]) window.location.reload();
  muteMicCheckbox.checked = message[MUTE_MIC] ?? muteMicCheckbox.checked;
  muteVideoCheckbox.checked = message[MUTE_VIDEO] ?? muteVideoCheckbox.checked;
  raiseHandCheckBox.checked = message[RAISE_HAND] ?? raiseHandCheckBox.checked;
  thresholdSlider.value = message[THRESHOLD] ?? thresholdSlider.value;
  thresholdValue.innerHTML = message[THRESHOLD] ?? thresholdValue.innerHTML;
  urlDisplay.href = message[MODEL_URL] ?? urlDisplay.href;
});

window.addEventListener("DOMContentLoaded", function () {
  Communicator.sendMessageToBackground({
    type: POPUP_LOADED,
    [POPUP_LOADED]: true,
  });
  muteMicCheckbox = getElementByIdAsHTMLInputElement("muteMic");
  muteVideoCheckbox = getElementByIdAsHTMLInputElement("muteVideo");
  raiseHandCheckBox = getElementByIdAsHTMLInputElement("raiseHand");
  thresholdSlider = getElementByIdAsHTMLInputElement("threshold");
  thresholdValue = getElementByIdAsHTMLInputElement("result");
  urlForm = <HTMLFormElement>document.getElementById("urlForm");
  urlInput = getElementByIdAsHTMLInputElement("url");
  urlButton = getElementByIdAsHTMLInputElement("urlButton");
  defaultButton = getElementByIdAsHTMLInputElement("defaultButton");
  urlDisplay = <HTMLLinkElement>document.getElementById("modelUrlDisplay");
  handleCheckboxToggle(muteMicCheckbox, MUTE_MIC);
  handleCheckboxToggle(muteVideoCheckbox, MUTE_VIDEO);
  handleCheckboxToggle(raiseHandCheckBox, RAISE_HAND);
  thresholdSlider.addEventListener("input", (e) => {
    let value = (<HTMLInputElement>e.target).value;
    thresholdValue.innerHTML = value;
    Communicator.sendMessageToBackground({
      type: FEATURE_TOGGLES,
      [THRESHOLD]: value,
    });
  });
  urlForm.onsubmit = (e) => {
    e.preventDefault();
    const url = urlInput.value;
    Communicator.sendMessageToBackground({ type: MODEL_URL, url });
    urlButton.classList.add("is-loading");
  };
  defaultButton.onclick = (e) => {
    e.preventDefault();
    Communicator.sendMessageToBackground({ type: RESET_DEFAULTS });
    defaultButton.classList.add("is-loading");
  };
});

function getElementByIdAsHTMLInputElement(id: string) {
  return <HTMLInputElement>document.getElementById(id);
}

function handleCheckboxToggle(checkbox: HTMLInputElement, inputMsg: string) {
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
