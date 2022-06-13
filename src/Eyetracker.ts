import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";

export class Eyetracker {

  private stream: MediaStream | undefined;
  private video: HTMLVideoElement | undefined;
  private canvas: HTMLCanvasElement | undefined;
  // private detector: FaceLandmarksDetector | undefined;
  private ctx: CanvasRenderingContext2D | undefined;
  private facialLandmarks: Array<any> = [{box: Object, keypoints: Array}];
  private model: any | undefined;
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

  showDisplay() {
    let ctx = this.ctx;
    let video = this.video;
    if ((ctx != undefined) && (video != undefined)) {
      ctx.drawImage(video, 0, 0)
      //window.requestAnimationFrame(this.showDisplay.bind(this));
    }
    else { console.log('\"this.ctx\", \"this.video\" Undefined') }
  }

  hideDisplay(canvas: HTMLCanvasElement) {
      canvas.style.visibility = 'hidden'
  }

  createOverlay(): void {
    try {
      let ctx = this.ctx;
      let video = this.video;
      //let detector = this.detector;

      if (/*(detector != undefined) &&*/this.facialLandmarks.length > 0 && (video != undefined) && (ctx != undefined)) {
        const coordinates = this.facialLandmarks;
        //const boxCoords = coordinates.box;
        const keypoints = coordinates;
        //console.log('overlay')
        for(let i = 468; i < 478; i++) {
          let x = keypoints[i][0];
          let y = keypoints[i][1];
 
          ctx.beginPath();
          ctx.rect(x, y, 2, 2);
          ctx.stroke();
        }
        //window.requestAnimationFrame(this.createOverlay.bind(this));
      }
      else { console.log('\"this.detector\", \"this.video\", \"this.ctx\" Undefined'); }
    }
    catch (err) { console.log(err); /*window.requestAnimationFrame(this.createOverlay.bind(this));*/ }
  }

  async init() {
    let model = await faceLandmarksDetection
          .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
            { maxFaces: 1 })
        this.model = model
        return model
  }

  async detectFace(): Promise<any> {
    const predictions = await this.model.estimateFaces({
      input: this.video //can also be canvas -> might have to use canvas in our model, compare performance
    });

    console.log(predictions)
    if(predictions.length > 0) {
      this.facialLandmarks = predictions[0].scaledMesh
    } else {
      this.facialLandmarks = []
    }
  }

  // async isFaceValid(): Promise<any> {
  //   let detector = this.detector;
  //   let video = this.video;
  //   if ((detector != undefined) && (video != undefined)) {
  //     const faces = await detector.estimateFaces(video, { flipHorizontal: true })
  //     if (faces.length > 0) {
  //       console.log('FACE DETECTED');
  //       console.log(faces)
  //     }
  //     else { console.log('Waiting for faces...') }
  //     window.requestAnimationFrame(await this.isFaceValid());
  //   }
  //   else { console.log('\"this.detector\", \"this.video\" Undefined') }
  // }
}
