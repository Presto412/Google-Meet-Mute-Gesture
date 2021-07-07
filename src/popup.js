import {
  RAISE_HAND,
  POPUP_LOADED,
  THRESHOLD,
  FEATURE_TOGGLES,
  MUTE_MIC,
  MUTE_VIDEO,
  ENABLED,
  DISABLED,
} from "./constants";

var port = chrome.extension.connect({
  name: "GestureMeetPopupToBackground",
});

window.addEventListener("DOMContentLoaded", function () {
  port.postMessage({ type: POPUP_LOADED, [POPUP_LOADED]: true });
  handleCheckboxToggle("muteMic", MUTE_MIC);
  handleCheckboxToggle("muteVideo", MUTE_VIDEO);
  handleCheckboxToggle("raiseHand", RAISE_HAND);
  let element = document.getElementById("threshold");
  element.addEventListener("input", function (e) {
    let value = e.target.value;
    document.getElementById("result").innerHTML = value;
    port.postMessage({ type: FEATURE_TOGGLES, [THRESHOLD]: value });
  });
});

port.onMessage.addListener(function (msg) {
  console.log(`msg:${JSON.stringify(msg)}`);
  if (msg[THRESHOLD]) {
    document.getElementById("result").innerHTML = msg.THRESHOLD;
    document.getElementById("threshold").value = msg.THRESHOLD;
  } else if (msg[MUTE_MIC]) {
    document.getElementById("muteMic").checked = msg[MUTE_MIC] === ENABLED;
  } else if (msg[MUTE_VIDEO]) {
    document.getElementById("muteVideo").checked = msg[MUTE_VIDEO] === ENABLED;
  } else if (msg[RAISE_HAND]) {
    document.getElementById("raiseHand").checked = msg[RAISE_HAND] === ENABLED;
  }
});

function handleCheckboxToggle(id, inputMsg) {
  let checkbox = document.getElementById(id);
  checkbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      port.postMessage({ type: FEATURE_TOGGLES, [inputMsg]: ENABLED });
    } else {
      port.postMessage({ type: FEATURE_TOGGLES, [inputMsg]: DISABLED });
    }
  });
}
