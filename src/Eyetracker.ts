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
    let stream = null;
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    return stream;
  }

  async getListOfCameras(): Promise<Array<MediaDeviceInfo>> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    // const cameraList: Array<String> = []
    // for (let i = 0; i < devices.length; i++) {
    //   if (devices[i].kind === "videoinput") {
    //     cameraList.push(devices[i].deviceId)
    //   }
    // }
    // return cameraList
    // Take this approach? Where return type are 
    const videoDevices = devices.filter((d) => {
      d.kind === 'videoinput'
      return d.kind === 'videoinput'
    })

    return videoDevices
  }

  async setCamera(device: MediaDeviceInfo): Promise<MediaStream> {
    //console.log(device.deviceId)
    // If getListOfCameras uses strings, then deviceId would just be set equal to the parameters
    const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: device.deviceId } })
    return stream
  }

  async createVideo(height: number, width: number, Id: string, stream: MediaStream): Promise<any> {
    let video = document.createElement('video')
    video.setAttribute('id', Id)
    document.body.appendChild(video)
    video.style.transform = 'scaleX(-1)'
    // video.style.height = `${height.toString()}px`
    // video.style.width = `${width.toString()}px`
    video.srcObject = stream;
    video.autoplay = true;
    video.style.visibility = 'hidden';
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            video.width = video.videoWidth;
            video.height = video.videoHeight;
            resolve(video);
        };
    });
  }

  createDisplay(video: HTMLVideoElement, Id: string): CanvasRenderingContext2D | null { //could combine createDisplay and setDisplay with optional params
    let canvas = document.createElement("canvas")
    canvas.setAttribute('id', Id);
    document.body.appendChild(canvas);
    // canvas.style.height = `${video.height.toString()}px`
    // canvas.style.width = `${video.width.toString()}px`
    canvas.height = video.height;
    canvas.width = video.width;
    //const ctx = canvas.getContext('2d')
    var ctx = canvas.getContext('2d');
    if (ctx != null) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.fillStyle = "green";
    }
    return ctx;
  }

  setDisplay(video: HTMLVideoElement, canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    canvas.height = video.height
    canvas.width = video.width
    var ctx = canvas.getContext('2d');
    if (ctx != null) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.fillStyle = "green";
    }
    return ctx;
  }

  showDisplay(ctx: CanvasRenderingContext2D, video: HTMLVideoElement) {
    ctx.drawImage(video, 0, 0)
  }

  async createOverlay(ctx: CanvasRenderingContext2D, detector: FaceLandmarksDetector, video: HTMLVideoElement): Promise<any> {
    const coordinates = (await detector.estimateFaces(video))[0]
    
    if (coordinates) {
      const boxCoords = coordinates.box
      const keypoints = coordinates.keypoints
      this.showDisplay(ctx, video)
      ctx.beginPath()
      ctx.lineWidth = 6
      ctx.rect(boxCoords.xMin, boxCoords.yMin, (boxCoords.xMax - boxCoords.xMin), (boxCoords.yMax - boxCoords.yMin))
      ctx.stroke()
      window.requestAnimationFrame(await this.createOverlay(ctx, detector, video));
    } else {
      this.showDisplay(ctx, video)
      window.requestAnimationFrame(await this.createOverlay(ctx, detector, video));
    }
  }

  // async setFaceLandmarkDetectionModel() {
  //   const model = SupportedModels.MediaPipeFaceMesh;
  //   const detectorConfig = {
  //     runtime: 'mediapipe',
  //     refineLandmarks: true,
  //     maxFaces: 1,
  //     solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
  //                   // or 'base/node_modules/@mediapipe/face_mesh' in npm.
  //   };
  //   // @ts-ignore
  //   return detector = await createDetector(model, detectorConfig);
  // }

  async faceLandmarkDetection() {
    const model = SupportedModels.MediaPipeFaceMesh;
    const detectorConfig: MediaPipeFaceMeshTfjsModelConfig = {
      runtime: "tfjs",
      maxFaces: 1,
      refineLandmarks: true,
    };

    const detector = await createDetector(model, detectorConfig);
    return detector
  }

  async isFaceValid(video: HTMLVideoElement, detector: any): Promise<any> {
    const faces = await detector.estimateFaces(video, { flipHorizontal: true })
    if (faces.length > 0) {
      console.log('FACE DETECTED');
      console.log(faces)
    }
    else { console.log('Waiting for faces...') }
    window.requestAnimationFrame(await this.isFaceValid(video, detector));
  }
}
