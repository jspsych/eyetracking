import {
  SupportedModels,
  MediaPipeFaceMeshTfjsModelConfig,
  createDetector,
  FaceLandmarksDetector,
} from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import DemoWorker from "web-worker:./Worker.js";

export class Eyetracker {
  private stream: MediaStream | undefined;
  private video: HTMLVideoElement | undefined;
  private canvas: HTMLCanvasElement | undefined;
  private detector: FaceLandmarksDetector | undefined;
  private ctx: CanvasRenderingContext2D | undefined;
  private worker: Worker | undefined;

  constructor() {
    this.worker = new DemoWorker();
    this.worker.addEventListener("message", (e) => {
      console.log(e.data);
    });
  }

  foo() {
    this.worker?.postMessage({ cmd: "foo" });
  }

  private faces: Array<any> | undefined;


  bar() {
    this.worker?.postMessage({ cmd: "bar" });
  }

  async getCameraPermission() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }

  async getListOfCameras(): Promise<Array<MediaDeviceInfo>> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => {
      d.kind === "videoinput";
      return d.kind === "videoinput";
    });

    return videoDevices;
  }

  async setCamera(device: MediaDeviceInfo) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: device.deviceId },
    });
  }

  async createVideo(Id: string) {
    let video = document.createElement("video");
    video.setAttribute("id", Id);
    document.body.appendChild(video);
    video.style.transform = "scaleX(-1)";
    (video.srcObject as undefined | MediaProvider | null) = this.stream;
    video.autoplay = true;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        resolve(video);
      };
      this.video = video;
    });
  }

  createDisplay(Id: string) {
    let canvas = document.createElement("canvas");
    canvas.setAttribute("id", Id);
    document.body.appendChild(canvas);
    this.canvas = canvas;
    if (this.video != null) {
      canvas.height = this.video.height;
      canvas.width = this.video.width;
      this.canvas = canvas;
      var ctx = canvas.getContext("2d");
      if (ctx != null) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.fillStyle = "green";
        (this.ctx as undefined | CanvasRenderingContext2D | null) = ctx;
        return canvas;
      } else {
        console.log("canvas.getContext('2d') return null");
        return canvas;
      }
    } else {
      console.log('Undefined Property "this.video"');
    }
  }

  // Need to test this out
  setDisplay(canvas: HTMLCanvasElement) {
    let video = this.video;
    this.canvas = canvas;
    if (canvas != undefined && video != undefined) {
      canvas.height = video.height;
      canvas.width = video.width;
      var ctx = canvas.getContext("2d");
      if (ctx != null) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.fillStyle = "green";
      }
      (this.ctx as undefined | CanvasRenderingContext2D | null) = ctx;
    } else {
      console.log('/"this.canvas/", /"this.video/" Undefined');
    }
  }


  hideDisplay(canvas: HTMLCanvasElement) {
    canvas.style.visibility = 'hidden';
  }

  async createOverlay(): Promise<void> {
    if ((this.video != undefined) && (this.ctx != undefined) && (this.faces != undefined)) {
      this.ctx.drawImage(this.video, 0, 0)
      if (this.faces.length > 0) {
        const coordinates = this.faces[0];
        const keypoints = coordinates.keypoints;
        for (let keypoint = 0; keypoint < keypoints.length; keypoint++) {
          const x = keypoints[keypoint]['x']
          const y = keypoints[keypoint]['y']
          this.ctx.beginPath();
          this.ctx.rect(x, y, 2, 2);
          this.ctx.stroke();
        }
      }
    }
  }

  async detectFaces(): Promise<void> {
    if ((this.video != undefined) && (this.detector != undefined)) {
      this.faces = await this.detector.estimateFaces(this.video);
    }
  }

  async detectAndDraw(draw: boolean): Promise<void> {
    await this.detectFaces();
    if (draw) { await this.createOverlay(); }
  }

  async keypointsAnimation(draw: boolean): Promise<void> {
    await this.detectAndDraw(draw);
    requestAnimationFrame(() => this.keypointsAnimation(draw));
  }

  async init() {
    const model = SupportedModels.MediaPipeFaceMesh;
    const detectorConfig: MediaPipeFaceMeshTfjsModelConfig = {
      runtime: "tfjs",
      maxFaces: 1,
      refineLandmarks: true,
    };
    const detector = await createDetector(model, detectorConfig);
    this.detector = detector;
    return detector;
  }

}
