import { Eyetracker } from "./Eyetracker";

export class Components {
  private Eyetracker: Eyetracker | undefined;
  private currentComponents: Array<string> = [];
  private calDivUsed: HTMLDivElement | undefined;

  private DEFAULT_MESSAGE = `Welcome to an experiment that uses eye tracking.
  In a few moments you will be asked for permission to use your camera in order to complete the experiment.`;
  private DEFAULT_POINTS: Array<Array<number>> = [
    [10, 10],
    [10, 50],
    [10, 90],
    [50, 10],
    [50, 50],
    [50, 90],
    [90, 10],
    [90, 50],
    [90, 90],
  ];

  constructor(et: Eyetracker) {
    this.Eyetracker = et;
  }

  async preload(): Promise<object> {
    console.log("checK");
    let detector = await this.Eyetracker!.init();
    console.log("checK");
    let video = await this.Eyetracker!.createVideo();
    console.log("checK");
    let canvas = this.Eyetracker!.createDisplayCanvas();
    return { detector, video, canvas };
  }

  //TODO: figure out how to put CSS in here shorthand without giving me a stroke
  createLanding(
    id: string = "landing",
    message: string = this.DEFAULT_MESSAGE
  ): HTMLDivElement {
    this.currentComponents.push(id);
    let landing = document.createElement("div");
    landing.id = id;
    landing.classList.add("landing");
    landing.innerHTML = `
            <div class="landing-message">
                <p>${message}</p>
            </div>
        `;
    return landing;
  }

  // TODO: what type is the return???? Array<???>
  async createSelector(
    id: string = "selector",
    message: string = "Select a camera"
  ): Promise<Array<any>> {
    this.currentComponents.push(id);
    let selector = document.createElement("select");
    selector.id = id;

    await this.Eyetracker!.getCameraPermission();
    const devices = await this.Eyetracker!.getListOfCameras();

    const blank = document.createElement("option");
    blank.style.display = "none";
    selector.appendChild(blank);

    devices.forEach((d) => {
      let option = document.createElement("option");
      option.value = d.deviceId;
      option.innerHTML = d.label;
      selector.appendChild(option);
    });

    const btn = document.createElement("button");
    btn.id = `${id}-btn`;
    this.currentComponents.push(btn.id);
    btn.innerHTML = `${message}`;
    btn.addEventListener("click", async () => {
      const cam = selector.options[selector.selectedIndex].value;
      if (id !== "") {
        await this.Eyetracker!.setCamera(
          //@ts-ignore
          await navigator.mediaDevices.getUserMedia({
            video: { deviceId: cam },
          })
        );
        this.clearComponents();
      } else {
        alert("Please select a camera.");
      }
    });
    return new Array<any>(selector, btn);
  }
  //TODO: these instructions-
  /*
  DONE: Pass in a DIV with the calibration points being other Div elements 
  DONE: New coordinate system absolutely (%) on the new element
  - Calibrate based off of that (let's adapt calibrate point to take absolute coords)
  - Different fixation points???
  */
  async calibrate(
    div: HTMLDivElement,
    points: Array<Array<number>> = this.DEFAULT_POINTS
  ): Promise<Array<object>> {
    if (div === null) {
      div = document.createElement("div");
      div.id = "cal-div";
    } else {
      div.innerHTML = "";
    }
    this.calDivUsed = div;

    let finishedPoints: Array<object> = [];

    if (points.length < 4) {
      console.warn(
        "There are not a lot of points to calibrate, consider adding more or using the DEFAULT_POINTS."
      );
    }
    await this.Eyetracker!.initVideoFrameLoop();

    let calibrateLoop = setInterval(async () => {
      div.innerHTML = "";
      let point = points.shift();
      if (point === undefined) {
        clearInterval(calibrateLoop);
        //TODO- what exactly should we return?
        console.log(await this.Eyetracker!.processCalibrationPoints()); // facial landmarks
        return finishedPoints; // imageData + onset time
      }
      this.drawFixation(point[0], point[1], div);
      let onsetTime = performance.now();

      setTimeout(async () => {
        await this.Eyetracker!.detectFace();
        let currentPoint = this.Eyetracker!.calibratePoint(
          point![0],
          point![1]
        );
        //TODO- let's find a way to prevent throwing this error, maybe explicitly defining?
        //@ts-ignore
        currentPoint.onsetTime = onsetTime;
        finishedPoints.push(currentPoint);
      }, 1500);
    }, 3000);
    console.warn("This shouldn't be accessible.");
    return finishedPoints;
  }

  clearComponents() {
    this.currentComponents.forEach((c) => {
      let el = document.getElementById(c);
      if (el !== null) {
        el.remove();
      } else {
        console.log(`${c} not found`);
      }
    });
    this.currentComponents = [];
  }

  // TODO- add different fixations: CROSS, FUNNY THING, SQUARE
  drawFixation(x: number, y: number, div: HTMLDivElement) {
    const circle = document.createElement("div");
    circle.style.width = "10px";
    circle.style.height = "10px";
    circle.style.borderRadius = "50%";
    circle.style.backgroundColor = "red";
    circle.style.position = "absolute";
    circle.style.left = `calc(${x}% - 5px)`;
    circle.style.top = `calc(${y}% - 5px)`;
    div.appendChild(circle);
  }

  translateToStandard(points: Array<object>): Array<object> {
    if (this.calDivUsed === null || this.calDivUsed === undefined) {
      throw new Error(
        "No calibration div was used, please use the calibrate function."
      );
    }
    let newPoints: Array<object> = [];
    points.forEach((p) => {
      let newPoint = {
        //@ts-ignore
        x: p.x * this.calDivUsed!.offsetWidth,
        //@ts-ignore
        y: p.y * this.calDivUsed!.offsetWidth,
        //@ts-ignore
        onsetTime: p.onsetTime,
      }; // TODO- we should really set a type to these points
      newPoints.push(newPoint);
    });
    return newPoints;
  }
}
