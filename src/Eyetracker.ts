import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import { MediaPipeFaceMesh } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";

export class Eyetracker {
  /** The camera stream used for video input. */
  private stream: MediaStream | undefined;
  /** A video element that represents the camera stream. */
  private video: HTMLVideoElement | undefined;
  /** A canvas element that represents both the camera stream and various overlays painted on it. */
  private canvas: HTMLCanvasElement | undefined;
  /** The rendering context used to paint things on the canvas. */
  private ctx: CanvasRenderingContext2D | undefined;
  /** The points in form {x, y} that are used to calibrate for gaze detection. */
  private calibrationPoints: Array<any> = []; //Should be changed to calibration point object
  /** Contains calibration points that have already been processed. */
  private processedCalibrationPoints: Array<any> = []; //should be changed to processed point object
  /** Points on the screen that indicate to various facial features. */
  private facialLandmarks: Array<Array<number>> = [[]];
  /** Points that delineate a box that contains the face. */
  private boundingBox: Array<Array<number>> = [[]];
  /** The detection model provided by tfjs/mediapipe that will be used to gather face data. */
  private model: MediaPipeFaceMesh | undefined;
  /** Shows whether or not the overlay should be displayed. */
  private overlay: boolean = true;
  /** */
  private frames: Array<{
    imageData: ImageData;
    timestamp: DOMHighResTimeStamp;
  }> = [];
  /** */
  public onFrameUpdateCallbackList: Array<VoidFunction> = [];
  /** */
  public frameUpdatePaused: boolean = false;

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
   * This is a function that asks a user for permission to use the camera
   * through the web browser.
   */
  async getCameraPermission(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }

  /**
   * This is a function to generate a list of available cameras.
   * Acquiring the device IDs requires prior permission, so call getCameraPermission() first.
   * @returns The list of available video Media Devices
   */
  async getListOfCameras(): Promise<Array<MediaDeviceInfo>> {
    const devices: MediaDeviceInfo[] =
      await navigator.mediaDevices.enumerateDevices();

    const videoDevices: MediaDeviceInfo[] = devices.filter((d) => {
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
  createDisplayCanvas(Id: string): HTMLCanvasElement | undefined {
    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.setAttribute("id", Id);
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
  setDisplayCanvas(canvas: HTMLCanvasElement): void {
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
   * @param canvas An existing canvas where the image should be drawn
   * @param video A video object for the source of the image
   */
  paintVideoOnCanvas(
    canvas: HTMLCanvasElement = this.canvas!,
    video: HTMLVideoElement = this.video!
  ): void {
    let ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (ctx != undefined && video != undefined) {
      ctx.drawImage(video, 0, 0);
    } else {
      console.log('"this.ctx", "this.video" Undefined');
    }
  }

  /**
   * This function hides a canvas element provided.
   * @param canvas The HTMLCanvasElement that will be hidden
   */
  hideDisplayCanvas(canvas: HTMLCanvasElement): void {
    canvas.style.visibility = "hidden";
  }

  /**
   * A function that generates an array of facial landmark coordinates from an input video
   * and then sets these values to class field values to be used by other functions.
   */
  async detectFace(): Promise<void> {
    const predictions: Array<any> = await this.model!.estimateFaces({
      input: this.frames[this.frames.length - 1].imageData,
    });

    // if there is no face detected, prevent accessing an empty array
    if (predictions.length > 0) {
      this.facialLandmarks = predictions[0].scaledMesh;
      this.boundingBox = predictions[0].boundingBox;
    } else {
      this.facialLandmarks = [];
    }
  }

  /**
   * A function that creates an overlay from the MediaPipe model by
   * drawing points over specific facial landmarks through
   * coordinates generated by the detectFace() method
   * @param options an option specifying which parts of the predicitions should be drawn
   * @param canvas a canvas where the overlay should be drawn
   */
  createOverlay(
    options: {
      face: boolean;
      iris: boolean;
      boundingBox: boolean;
    },
    canvas: HTMLCanvasElement = this.canvas!
  ): void {
    try {
      let ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");

      if (this.overlay && this.facialLandmarks.length > 0 && ctx != undefined) {
        const keypoints: Array<Array<number>> = this.facialLandmarks;
        const boundingBox: any = this.boundingBox;

        if (options.face == true) {
          for (let i = 0; i < keypoints.length - 10; i++) {
            let x = keypoints[i][0];
            let y = keypoints[i][1];
            ctx.beginPath();
            ctx.rect(x, y, 2, 2);
            ctx.stroke();
          }
        }
        if (options.iris == true) {
          for (let i = keypoints.length - 10; i < keypoints.length; i++) {
            let x = keypoints[i][0];
            let y = keypoints[i][1];
            ctx.beginPath();
            ctx.rect(x, y, 2, 2);
            ctx.stroke();
          }
        }
        if (options.boundingBox == true) {
          ctx.beginPath();
          ctx.rect(
            boundingBox.topLeft[0],
            boundingBox.topLeft[1],
            boundingBox.bottomRight[0] - boundingBox.topLeft[0],
            boundingBox.bottomRight[1] - boundingBox.topLeft[1]
          );
          ctx.stroke();
        }
      } else if (this.facialLandmarks.length === 0) {
        console.log("No face detected");
      } else {
        console.log('"this.detector", "this.video", "this.ctx" Undefined');
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Turns the facemesh overlay on or off
   */
  toggleOverlay(): void {
    this.overlay = !this.overlay;
  }

  /**
   * A function that combines the steps of detecting a face
   * and drawing an image and overlay onto a canvas.
   */
  async generateFaceMesh(): Promise<void> {
    await this.detectFace();
    this.paintVideoOnCanvas(this.canvas!, this.video!);
    this.createOverlay(
      {
        face: true,
        iris: true,
        boundingBox: true,
      },
      this.canvas
    );
    window.requestAnimationFrame(this.generateFaceMesh.bind(this));
  }

  /**
   * A function that creates calibration points to make associations
   * between eye movement and potential gaze location
   * @param x The x-coordinate of a calibration point
   * @param y The y-coordinate of a calibration point
   * @returns A point object that associates a set of coordinates with facial landmark coordinates
   */
  calibratePoint(x: number, y: number): object {
    let index = this.frames.length - 1;
    let point: object = {
      x: x,
      y: y,
      imageData: this.frames[index].imageData,
    };
    this.calibrationPoints.push(point);
    return point;
  }

  async processCalibrationPoints(): Promise<void> {
    let processedPoints = [];
    for (let i = 0; i < this.calibrationPoints.length; i++) {
      let predictions = await this.model!.estimateFaces({
        //should this be changed to run detectFace through params?
        input: this.calibrationPoints[i].imageData,
      });

      processedPoints.push({
        x: this.calibrationPoints[i].x,
        y: this.calibrationPoints[i].y,
        facialLandmarks: predictions[0].scaledMesh,
      });
    }
    this.processedCalibrationPoints = processedPoints;
  }

  /**
   * A function that clears the list of current calibration points.
   */
  clearCalibration(): void {
    this.calibrationPoints = [];
  }

  /**
   * Helper function in order to automatically detect a face and draw an overlay.
   * @param draw A boolean that determines whether the calibration points should be drawn
   */
  async detectAndDraw(draw: boolean): Promise<void> {
    await this.detectFace();
    if (draw) {
      this.createOverlay(
        {
          face: true,
          iris: true,
          boundingBox: true,
        },
        this.canvas
      );
    }
  }

  /**
   * A helper function that uses rAF callbacks to display and update the overlay.
   * @param draw A boolean that determines whether the calibration points should be drawn
   */
  async keypointsAnimation(draw: boolean): Promise<void> {
    await this.detectAndDraw(draw);
    requestAnimationFrame(() => this.keypointsAnimation(draw));
  }

  /**
   * Paints a video image onto a canvas and adds the ImageData to the frames array at the framerate
   * @param video The video for the sources of the images
   * @param canvas The canvas which the images will be painted onto
   */
  async initVideoFrameLoop(
    video: HTMLVideoElement = this.video!,
    canvas: HTMLCanvasElement = this.canvas!
  ) {
    let ctx = canvas.getContext("2d");
    let frames = this.frames;
    let Eyetracker = this;
    async function repeatDetection(now: DOMHighResTimeStamp, metadata: object) {
      if (!Eyetracker.frameUpdatePaused) {
        Eyetracker.paintVideoOnCanvas();
        let imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        Eyetracker.frames.push({ imageData: imageData, timestamp: now });

        for (let func of Eyetracker.onFrameUpdateCallbackList) {
          func();
        }
        // @ts-ignore
        video.requestVideoFrameCallback(repeatDetection);
      } else {
        console.log("loop is paused");
        // @ts-ignore
        video.requestVideoFrameCallback(repeatDetection);
      }
    }
    // @ts-ignore
    video.requestVideoFrameCallback(repeatDetection);
  }
}
