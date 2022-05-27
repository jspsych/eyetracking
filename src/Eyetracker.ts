import {
  SupportedModels,
  MediaPipeFaceMeshTfjsModelConfig,
  createDetector,
} from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";

export class Eyetracker {
  async init() {
    const model = SupportedModels.MediaPipeFaceMesh;

    const detectorConfig: MediaPipeFaceMeshTfjsModelConfig = {
      runtime: "tfjs",
      refineLandmarks: true,
    };

    const detector = await createDetector(model, detectorConfig);

    console.log(detector);
  }

  /**
   * This is a function to add two numbers together.
   *
   * @param a A number to add
   * @param b A number to add
   * @returns The sum of both numbers
   */
  add(a: number, b: number): number {
    return a + b;
  }

  async getCameraPermission(): Promise<any> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    return stream
  }

  async getListOfCameras(): Promise<any> {
    navigator.mediaDevices.enumerateDevices()
    .then((devices) => {
      console.log(devices)
      const vidStreams = (devices.filter((d) => {
        d.kind === "videoinput"
      }))
      console.log(vidStreams)
    })
  }
}
