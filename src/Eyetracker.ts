import {
  SupportedModels,
  MediaPipeFaceMeshTfjsModelConfig,
  createDetector,
  FaceLandmarksDetector,
} from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";


export class Eyetracker {

  private stream: MediaStream | undefined;
  private video: HTMLVideoElement | undefined;
  private canvas: HTMLCanvasElement | undefined;
  private detector: FaceLandmarksDetector | undefined;
  private ctx: CanvasRenderingContext2D | undefined;
  private faces: Array<any> | undefined;

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

  async getCameraPermission() {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }

  async getListOfCameras(): Promise<Array<MediaDeviceInfo>> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => {
      d.kind === 'videoinput';
      return d.kind === 'videoinput';
    })

    return videoDevices;
  }

  async setCamera(device: MediaDeviceInfo) {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: device.deviceId } });
  }

  async createVideo(Id: string) {
    let video = document.createElement('video');
    video.setAttribute('id', Id);
    document.body.appendChild(video);
    video.style.transform = 'scaleX(-1)';
    (video.srcObject as (undefined | MediaProvider | null)) = this.stream;
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
    let canvas = document.createElement("canvas")
    canvas.setAttribute('id', Id);
    document.body.appendChild(canvas);
    this.canvas = canvas
    if (this.video != null) {
      canvas.height = this.video.height;
      canvas.width = this.video.width;
      this.canvas = canvas;
      var ctx = canvas.getContext('2d');
      if (ctx != null) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.fillStyle = "green";
        (this.ctx as (undefined | CanvasRenderingContext2D | null)) = ctx;
        return canvas
      }
      else {
        console.log('canvas.getContext(\'2d\') return null');
        return canvas
      }
    }
    else { console.log('Undefined Property \"this.video\"'); }
  }

  // Need to test this out
  setDisplay(canvas: HTMLCanvasElement) {
    let video = this.video;
    this.canvas = canvas;
    if ((canvas != undefined) && (video != undefined)) {
      canvas.height = video.height
      canvas.width = video.width
      var ctx = canvas.getContext('2d');
      if (ctx != null) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.fillStyle = "green";
      }
      (this.ctx as (undefined | CanvasRenderingContext2D | null)) = ctx;
    }
    else { console.log('/"this.canvas/", /"this.video/" Undefined'); }
  }

  hideDisplay(canvas: HTMLCanvasElement) {
    canvas.style.visibility = 'hidden'
  }

  async createOverlay(ctx: CanvasRenderingContext2D | undefined, video: HTMLVideoElement | undefined, detector: FaceLandmarksDetector | undefined): Promise<any> {
    if(this.faces != undefined) {
      if ((detector != undefined) && (video != undefined) && (ctx != undefined)) {
        const coordinates = this.faces[0];
        // const boxCoords = coordinates.box;
        const keypoints = coordinates.keypoints;
        ctx.drawImage(video, 0, 0)
        for (let keypoint = 468; keypoint < keypoints.length; keypoint++) {
          const x = keypoints[keypoint]['x']
          const y = keypoints[keypoint]['y']

          ctx.beginPath();
          ctx.rect(x, y, 2, 2);
          ctx.stroke();
        };
      }
      else { console.log('\"this.detector\", \"this.video\", \"this.ctx\" Undefined'); }
    }
    else {
      if ((ctx != undefined) && (video != undefined)) {
        ctx.drawImage(video, 0, 0);
      }
      else { console.log('\"this.video\", \"this.ctx\" Undefined'); }
    }
    console.log('createOverlay() is called');
  }

  async detectFaces(video: HTMLVideoElement | undefined, detector: FaceLandmarksDetector | undefined): Promise<any> {
    if ((video != undefined) && (detector != undefined)) {
      this.faces = await detector.estimateFaces(video);
    }
    else {
      this.faces = undefined;
      console.log('\"this.detector\", \"this.video\" Undefined');
    }
    console.log('detectFaces() is called')
  }

  async detectAndDraw(ctx: CanvasRenderingContext2D | undefined, video: HTMLVideoElement | undefined, detector: FaceLandmarksDetector | undefined, draw: boolean) {
    await this.detectFaces(video, detector);
    if (draw) {
      if ((ctx != undefined) && (video != undefined) && (detector != undefined)) {
        await this.createOverlay(ctx, video, detector);
      } else {
        console.log('\"this.ctx\", \"this.video\", \"this.detector\" Undefined');
      }
    }
  }

  async keypointsAnimation(draw: boolean) {
    let ctx = this.ctx;
    let video = this.video;
    let detector = this.detector;
    if ((ctx != undefined) && (video != undefined) && (detector != undefined)) {
      try {
      requestAnimationFrame(async () => { return await this.detectAndDraw(ctx, video, detector, draw) });
      }
      catch(err) { console.log('fa')}
    }
    else { console.log('\"this.ctx\", \"this.video\", \"this.detector\" Undefined'); }
  }

  async init() {
    const model = SupportedModels.MediaPipeFaceMesh;
    const detectorConfig: MediaPipeFaceMeshTfjsModelConfig = {
      runtime: "tfjs",
      maxFaces: 1,
      refineLandmarks: true,
    };
    const detector = await createDetector(model, detectorConfig);
    this.detector = detector
    return detector
  }
}
