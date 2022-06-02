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

  async getCameraPermission() {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }

  async getListOfCameras(): Promise<Array<MediaDeviceInfo>> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    // const cameraList: Array<String> = []
    // for (let i = 0; i < devices.length; i++) {
    //   if (devices[i].kind === "videoinput") {
    //     cameraList.push(devices[i].deviceId)
    //   }
    // }
    // return cameraList
    // Take this approach? Where return type are 
    const videoDevices = devices.filter((d) => {
      d.kind === 'videoinput';
      return d.kind === 'videoinput';
    })

    return videoDevices;
  }

  async setCamera(device: MediaDeviceInfo) {
    //console.log(device.deviceId)
    // If getListOfCameras uses strings, then deviceId would just be set equal to the parameters
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: device.deviceId } });
  }


  // async createVideo(height: number, width: number, Id: string) {
  async createVideo(Id: string) {
    let video = document.createElement('video');
    video.setAttribute('id', Id);
    document.body.appendChild(video);
    video.style.transform = 'scaleX(-1)';
    // video.style.height = `${height.toString()}px`
    // video.style.width = `${width.toString()}px`
    (video.srcObject as (undefined | MediaProvider | null)) = this.stream;
    video.autoplay = true;
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        resolve(video);
      };
      this.video = video;
    });
  }

  createDisplay(Id: string) { //could combine createDisplay and setDisplay with optional params
    let canvas = document.createElement("canvas")
    canvas.setAttribute('id', Id);
    document.body.appendChild(canvas);
    // canvas.style.height = `${video.height.toString()}px`
    // canvas.style.width = `${video.width.toString()}px`
    if (this.video != null) {
      canvas.height = this.video.height;
      canvas.width = this.video.width;
      this.canvas = canvas;
      //const ctx = canvas.getContext('2d')
      var ctx = canvas.getContext('2d');
      if (ctx != null) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.fillStyle = "green";
        (this.ctx as (undefined | CanvasRenderingContext2D | null)) = ctx;
      }
      else { console.log('canvas.getContext(\'2d\') return null'); }
    }
    else { console.log('Undefined Property \"this.video\"'); }
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

  showDisplay() {
    let ctx = this.ctx;
    let video = this.video;
    if ((ctx != undefined) && (video != undefined)) {
      ctx.drawImage(video, 0, 0)
    }
    else { console.log('\"this.ctx\", \"this.video\" Undefined') }
  }

  async createOverlay(): Promise<any> {

    try {
      let ctx = this.ctx;
      let video = this.video;
      let detector = this.detector;

      if ((detector != undefined) && (video != undefined) && (ctx != undefined)) {
        const coordinates = (await detector.estimateFaces(video))[0];
        const boxCoords = coordinates.box;
        const keypoints = coordinates.keypoints;
        this.showDisplay();
        ctx.beginPath();;
        ctx.rect(boxCoords.xMin, boxCoords.yMin, (boxCoords.xMax - boxCoords.xMin), (boxCoords.yMax - boxCoords.yMin));
        ctx.stroke();
        window.requestAnimationFrame(await this.createOverlay());
      }
      else { console.log('\"this.detector\", \"this.video\", \"this.ctx\" Undefined'); }
    }
    catch (err) { this.showDisplay(); window.requestAnimationFrame(await this.createOverlay()); }
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
    this.detector = await createDetector(model, detectorConfig);
  }

  async isFaceValid(): Promise<any> {
    let detector = this.detector;
    let video = this.video;
    if ((detector != undefined) && (video != undefined)) {
      const faces = await detector.estimateFaces(video, { flipHorizontal: true })
      if (faces.length > 0) {
        console.log('FACE DETECTED');
        console.log(faces)
      }
      else { console.log('Waiting for faces...') }
      window.requestAnimationFrame(await this.isFaceValid());
    }
    else { console.log('\"this.detector\", \"this.video\" Undefined') }
  }
}
