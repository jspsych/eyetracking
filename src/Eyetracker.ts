import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import { MediaPipeFaceMesh } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";

export class Eyetracker {
  private stream: MediaStream | undefined;
  private video: HTMLVideoElement | undefined;
  private canvas: HTMLCanvasElement | undefined;
  private ctx: CanvasRenderingContext2D | undefined;
  private calibrationPoints: Array<object> = [];
  private facialLandmarks: Array<Array<number>> = [[]];
  private model: any | undefined;
  private overlay: boolean = true;

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

  /**
   * This is a function to ask a user to get camera permissions
   */
  async getCameraPermission(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }

  /**
   * This is a function to generate a list of available cameras
   * Getting cameras with DeviceID labels requires prior user permission
   * @returns The list of available video Media Devices
   */
  async getListOfCameras(): Promise<Array<MediaDeviceInfo>> {
    const devices: MediaDeviceInfo[] =
      await navigator.mediaDevices.enumerateDevices();
    const videoDevices: MediaDeviceInfo[] = devices.filter((d) => {
      d.kind === "videoinput";
      return d.kind === "videoinput";
    });

    return videoDevices;
  }

  /**
   * This is a function that specifies a particular camera as the source for the video
   * @param device A video device object to be used as the video stream source
   */
  async setCamera(device: MediaDeviceInfo): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: device.deviceId },
    });
  }

  /**
   * This is a function to create a video element which will display the stream from the camera
   * @param Id An id attribute to which can be used to identify the video later
   * @returns An HTMLVideoElement whose source is the stream from the previously selected camera
   */
  async createVideo(Id: string): Promise<HTMLVideoElement> {
    let video: HTMLVideoElement = document.createElement("video");
    video.setAttribute("id", Id);
    document.body.appendChild(video); // could be removed for more DOM flexibility
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

  /**
   * This is a function to create a canvas element proportional to the previously created video
   * @param Id An id attribute to which can be used to identify the video later
   * @returns A mirrored HTMLCanvasElement with matching proportions to the created video
   */
  createDisplay(Id: string): HTMLCanvasElement | undefined {
    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.setAttribute("id", Id);
    document.body.appendChild(canvas); // could be removed for more DOM flexibility
    this.canvas = canvas;
    if (this.video != null) {
      canvas.height = this.video.height;
      canvas.width = this.video.width;
      this.canvas = canvas;
      var ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
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
  /**
   * This function mirrors an existing canvas and makes it proportional to the previously created video
   * @param canvas An existing canvas whose proprotions should match the video
   */
  setDisplay(canvas: HTMLCanvasElement): void {
    let video: HTMLVideoElement | undefined = this.video;
    this.canvas = canvas;
    if (canvas != undefined && video != undefined) {
      canvas.height = video.height;
      canvas.width = video.width;
      var ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
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

  /**
   * A function that draws the video contents onto a previously selected canvas
   */
  showDisplay(): void {
    let ctx: CanvasRenderingContext2D | undefined = this.ctx;
    let video: HTMLVideoElement | undefined = this.video;
    if (ctx != undefined && video != undefined) {
      ctx.drawImage(video, 0, 0);
    } else {
      console.log('"this.ctx", "this.video" Undefined');
    }
  }

  /**
   * A function hides a canvas from being viewed
   * @param canvas An HTMLCanvasElement that whose visibility should be hidden
   */
  hideDisplay(canvas: HTMLCanvasElement): void {
    canvas.style.visibility = "hidden";
  }

  /**
   * A function to initialize the model for facial landmark detection
   * @returns A MediaPipeFaceMesh model that can estimate the facial coordinates of one face
   */
  async init(): Promise<MediaPipeFaceMesh> {
    let model: MediaPipeFaceMesh = await faceLandmarksDetection.load(
      faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
      { maxFaces: 1 }
    );
    this.model = model;
    return model;
  }

  /**
   * A function that generates an array of facial landmark coordinates from an input video
   * and then sets these values to class field values to be used by other functions
   */
  async detectFace(): Promise<void> {
    const predictions: Array<any> = await this.model.estimateFaces({
      input: this.video, //can also be canvas
    });

    function isFaceValid(): boolean {
      if (predictions.length > 0) {
        return true;
      }
      return false;
    }

    // Might not be needed
    if (isFaceValid()) {
      this.facialLandmarks = predictions[0].scaledMesh;
    } else {
      this.facialLandmarks = [];
    }
  }

  /**
   * A function that creates an overlay from the MediaPipe model
   * This function draws points over specific facial landmarks through
   * coordinates generated by the detectFace() method
   */
  createOverlay(): void {
    try {
      let ctx: CanvasRenderingContext2D | undefined = this.ctx;
      let video: HTMLVideoElement | undefined = this.video;

      if (
        this.overlay &&
        this.facialLandmarks.length > 0 &&
        video != undefined &&
        ctx != undefined
      ) {
        const keypoints: Array<Array<number>> = this.facialLandmarks;
        for (let i = 0; i < keypoints.length; i++) {
          let x = keypoints[i][0];
          let y = keypoints[i][1];
          ctx.beginPath();
          ctx.rect(x, y, 2, 2);
          ctx.stroke();
        }
      } else {
        console.log('"this.detector", "this.video", "this.ctx" Undefined');
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Turns the overlay on or off
   */
  toggleOverlay(): void {
    this.overlay = !this.overlay;
  }

  /**
   * A function that combines the steps of detecting a face, and drawing an image and overlay onto a canvas
   */
  async generateFaceMesh(time: any, metadata: any): Promise<void> {
    try {
      let video: HTMLVideoElement | undefined = this.video;
      await this.detectFace();
      this.showDisplay();
      this.createOverlay();

      // hacking together a nice little way to display the metadata
      // push metadata to paragraph element id'd as metadata
      let metadataElement: HTMLElement | null =
        document.getElementById("metadata");
      if (metadataElement != null) {
        metadataElement.innerHTML = JSON.stringify(metadata);
      }
      if (this.stream != null) {
        let fps: number | undefined = this.stream
          .getVideoTracks()[0]
          .getSettings().frameRate;
        if (fps != undefined && metadata != undefined) {
          // THIS NUMBER DIFFERS WILDLY FROM PRESENTEDFRAMES
          let counter = Math.round(metadata.mediaTime * fps);
          let counterElement: HTMLElement | null =
            document.getElementById("frameCounter");
          if (counterElement != null) {
            counterElement.innerHTML = counter.toString();
          }
        }
      }

      if (video != undefined) {
        // @ts-ignore
        video.requestVideoFrameCallback(this.generateFaceMesh.bind(this));
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * A function that creates calibration points to make associations between eye movement and potential gaze location
   * @param x The x-coordinate of a calibration point
   * @param y The y-coordinate of a calibration point
   * @returns A point object that associates a set of coordinates with facial landmark coordinates
   */
  calibratePoint(x: number, y: number): object {
    let point: object = { x: x, y: y, facialCoordinates: this.facialLandmarks };
    this.calibrationPoints.push(point);
    return point;
  }

  /**
   * A function that clears the list of calibration points
   */
  clearCalibration(): void {
    this.calibrationPoints = [];
  }

  async detectAndDraw(draw: boolean): Promise<void> {
    await this.detectFace();
    if (draw) {
      await this.createOverlay();
    }
  }

  async keypointsAnimation(draw: boolean): Promise<void> {
    await this.detectAndDraw(draw);
    requestAnimationFrame(() => this.keypointsAnimation(draw));
  }
}
