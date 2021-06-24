var port = chrome.extension.connect({
  name: "GestureMeetPopupToBackground",
});

window.addEventListener("DOMContentLoaded", function () {
  let element = document.getElementById("threshold");
  element.addEventListener("input", function (e) {
    let value = e.target.value;
    document.getElementById("result").innerHTML = value;
    port.postMessage(value);
  });
});

port.onMessage.addListener(function (msg) {
  console.log("message recieved" + msg);
});
