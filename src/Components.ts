import { Eyetracker } from "./Eyetracker";

/** The properties of any fixation that will be drawn. */
type fixationProps = {
  /** The diameter of the fixation used. */
  diameter: string;
  /** The color of the fixation used. */
  color: string;
  /** The shape of the fixation used. (ACCEPTED: circle, reticule, cross, square) */
  shape: string;
  /** The thickness of a cross fixation. */
  crossThickness: string;
};

export class Components {
  /** The eyetracker object that will be used to carry out most underlying work. */
  private Eyetracker: Eyetracker | undefined;
  /** The current components created
   * and displayed by this class and will be cleared on {@link clearComponents()} */
  private currentComponents: Array<string> = [];
  /** The calibration div used in the {@link calibrate()} function. */
  private calDivUsed: HTMLDivElement | undefined;
  /** The properties of the fixation that will be created by {@link drawFixation()}. */
  private props: fixationProps = {
    diameter: "10px",
    color: "red",
    shape: "circle",
    crossThickness: "4px",
  };

  /** The default message that will be used for the landing page. */
  private DEFAULT_MESSAGE = `Welcome to an experiment that uses eye tracking.
  In a few moments you will be asked for permission to use your camera in order to complete the experiment.`;
  /** The default 9 points that will be used for calibration. */
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

  /**
   * @constructor
   * @param et The eyetracker object that will be used to carry out most underlying work.
   */
  constructor(et: Eyetracker) {
    if (et === undefined || et === null) {
      throw new Error("Eyetracker cannot be undefined or null.");
    }
    this.Eyetracker = et;
  }

  /**
   * Initializes core components of the Eyetracker class. This must be called AFTER the
   * camera is selected, either through the {@link createSelector()} function or
   * by manually setting the camera.
   * @returns An object containing the Eyetracker's detector, video, and canvas.
   */
  async preload(): Promise<object> {
    let detector = await this.Eyetracker!.init();
    let video = await this.Eyetracker!.createVideo();
    let canvas = this.Eyetracker!.createDisplayCanvas();
    return { detector, video, canvas };
  }

  //TODO: maybe allow multiple lines instead of forcing user to put one big one?
  /**
   * This will create a landing page that will inform the user of the nature
   *  of the usage of the Eyetracking software. The landing page is contained
   *  inside of a wrapper div with flex capabilities.
   *
   * @param id The id of the div that will be used to display the landing page.
   * @param message The message that will be displayed on the landing page.
   * @returns The landing page div.
   */
  createLanding(
    id: string = "landing",
    message: string = this.DEFAULT_MESSAGE
  ): HTMLDivElement {
    this.currentComponents.push(id);
    this.currentComponents.push(`${id}-wrapper`);
    let landing = document.createElement("div");
    landing.id = id;
    landing.classList.add("landing");
    landing.innerHTML = `
            <div class="landing-message">
                <p>${message}</p>
            </div>
        `;

    let wrapper = document.createElement("div");
    wrapper.id = `${id}-wrapper`;
    wrapper.append(landing);
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.textAlign = "center";

    return wrapper;
  }

  /**
   * This will create a selector that will allow for one to select a camera.
   * This will automatically ask for permission and once finished, use
   * {@link Eyetracker.setCamera()}.
   *
   * @param id The id of the selector.
   * @param message The message that will be displayed on the button.
   * @returns An array containing the selector and the button, in that order.
   */
  async createSelector(
    id: string = "selector",
    message: string = "Select a camera"
  ): Promise<Array<HTMLElement>> {
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
    return new Array<HTMLElement>(selector, btn);
  }

  /**
   * Calibrate the eyetracker. This will automatically cycle through the points
   * in 3s intervals, taking facial landmark data 1.5s into the point's appearance.
   *
   * PLEASE NOTE: To increase calibration accuracy, use more than 4 points. 9 is preferred.
   *
   * @param div The div that will be used to display the calibration.
   * @param points A list of points denoted in absolute coordinates that will be used in calibration.
   * @returns An object containing the x and y coordinates of the calibration point,
   *  along with associated facial landmark data.
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
        let currentPoint: any = this.Eyetracker!.calibratePoint(
          point![0],
          point![1]
        );
        //TODO- let's find a way to prevent throwing this error, maybe explicitly defining?
        currentPoint.onsetTime = onsetTime;
        finishedPoints.push(currentPoint);
      }, 1500);
    }, 3000);
    return finishedPoints;
  }

  /**
   * This will clear all components that were created by this class.
   */
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

  /**
   * This will create a fixation based off of the given coordinates, placing it in the div.
   * The properties of the fixation are customizable through the {@link props} field.
   *
   * @param x The x coordinate of the fixation.
   * @param y The y coordinate of the fixation.
   * @param div The div that the fixation will be placed in.
   */
  drawFixation(x: number, y: number, div: HTMLDivElement) {
    if (div === null || div === undefined) {
      throw new Error("Please provide a div to draw the fixation in.");
    }
    if (div.parentElement === null || div.parentElement === undefined) {
      throw new Error("Div cannot be document.body.");
    }

    switch (this.props.shape) {
      case "circle":
        const adjustCircle = parseInt(this.props.diameter) / 2;
        const circle = document.createElement("div");
        circle.style.width = this.props.diameter;
        circle.style.height = this.props.diameter;
        circle.style.borderRadius = "50%";
        circle.style.backgroundColor = this.props.color;
        circle.style.position = "absolute";
        circle.style.left = `calc(${x}% - ${adjustCircle}px)`;
        circle.style.top = `calc(${y}% - ${adjustCircle}px)`;
        div.appendChild(circle);
        break;

      case "cross":
        const adjustCross = parseInt(this.props.crossThickness) / 2;
        const cross1 = document.createElement("div");
        cross1.style.width = this.props.crossThickness;
        cross1.style.height = this.props.diameter;
        cross1.style.backgroundColor = this.props.color;
        cross1.style.position = "absolute";
        cross1.style.left = `calc(${x}% - ${adjustCross}px)`;
        cross1.style.top = `calc(${y}% - ${
          parseInt(this.props.diameter) / 2
        }px)`;

        const cross2 = document.createElement("div");
        cross2.style.width = this.props.diameter;
        cross2.style.height = this.props.crossThickness;
        cross2.style.backgroundColor = this.props.color;
        cross2.style.position = "absolute";
        cross2.style.left = `calc(${x}% - ${
          parseInt(this.props.diameter) / 2
        }px)`;
        cross2.style.top = `calc(${y}% - ${adjustCross}px)`;
        div.appendChild(cross1);
        div.appendChild(cross2);
        break;

      case "square":
        const adjustSquare = parseInt(this.props.diameter) / 2;
        const square = document.createElement("div");
        square.style.width = this.props.diameter;
        square.style.height = this.props.diameter;
        square.style.borderRadius = "50%";
        square.style.backgroundColor = this.props.color;
        square.style.position = "absolute";
        square.style.left = `calc(${x}% - ${adjustSquare}px)`;
        square.style.top = `calc(${y}% - ${adjustSquare}px)`;
        div.appendChild(square);
        break;

      case "reticule":
        if (parseInt(this.props.diameter) <= 10) {
          console.warn("Reticule diameter is small and will look odd.");
        }
        const adjustReticule = parseInt(this.props.diameter) / 2;
        const outerCircle = document.createElement("div");
        outerCircle.style.width = this.props.diameter;
        outerCircle.style.height = this.props.diameter;
        outerCircle.style.borderRadius = "50%";
        outerCircle.style.backgroundColor = this.props.color;
        outerCircle.style.position = "absolute";
        outerCircle.style.left = `calc(${x}% - ${adjustReticule}px)`;
        outerCircle.style.top = `calc(${y}% - ${adjustReticule}px)`;
        outerCircle.style.zIndex = "1";
        div.appendChild(outerCircle);

        const adjustInner = adjustReticule / 2;
        const innerCircle = document.createElement("div");
        const innerSize = `${parseInt(this.props.diameter) / 2}px`;
        innerCircle.style.width = innerSize;
        innerCircle.style.height = innerSize;
        innerCircle.style.borderRadius = "50%";
        innerCircle.style.backgroundColor = this.props.color;
        innerCircle.style.position = "absolute";
        innerCircle.style.left = `calc(${x}% - ${adjustInner}px)`;
        innerCircle.style.top = `calc(${y}% - ${adjustInner}px)`;
        innerCircle.style.zIndex = "3";
        div.appendChild(innerCircle);

        const eraseColor =
          div.parentElement.style.backgroundColor === ""
            ? "white"
            : div.parentElement.style.backgroundColor;
        const eraseThickness = parseInt(this.props.diameter) / 4;
        const eraseSize = `${eraseThickness}px`;
        const adjustErase = eraseThickness / 2;

        const eCross1 = document.createElement("div");
        eCross1.style.width = eraseSize;
        eCross1.style.height = this.props.diameter;
        eCross1.style.backgroundColor = eraseColor;
        eCross1.style.position = "absolute";
        eCross1.style.left = `calc(${x}% - ${adjustErase}px)`;
        eCross1.style.top = `calc(${y}% - ${
          parseInt(this.props.diameter) / 2
        }px)`;
        eCross1.style.zIndex = "2";

        const eCross2 = document.createElement("div");
        eCross2.style.width = this.props.diameter;
        eCross2.style.height = eraseSize;
        eCross2.style.backgroundColor = eraseColor;
        eCross2.style.position = "absolute";
        eCross2.style.left = `calc(${x}% - ${
          parseInt(this.props.diameter) / 2
        }px)`;
        eCross2.style.top = `calc(${y}% - ${adjustErase}px)`;
        eCross2.style.zIndex = "2";
        div.appendChild(eCross1);
        div.appendChild(eCross2);
        break;

      default:
        throw new Error("Invalid shape.");
    }
  }

  //TODO- update this if we need it or not
  /**
   * This is a helper function that will translate given absolute coordinates to standard coordinates.
   * @param points Points in absolute coordinates, generated by the {@link calibrate()} function.
   * @returns
   */
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
