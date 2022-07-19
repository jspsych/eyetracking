import { Eyetracker } from "./Eyetracker";
import { Components } from "./Components";

/**
 * Create a new instance of the eye tracker.
 * @returns A new instance of the eye tracker.
 */
export function initEyetracker() {
  if (!("requestVideoFrameCallback" in HTMLVideoElement.prototype)) {
    window.alert(
      "This browser does not support requestVideoFrameCallback, please use a more recent version of Chrome, Safari, or Opera."
    );
  }
  return new Eyetracker();
}

export function initComponents(et: Eyetracker) {
  return new Components(et);
}
