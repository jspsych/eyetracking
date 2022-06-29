import { Eyetracker } from "./Eyetracker";

export class Components {
  private Eyetracker: Eyetracker | undefined;
  private currentComponents: Array<String> = [];

  constructor(et: Eyetracker) {
    this.Eyetracker = et;
  }

  init() {
    // is this even necessary?
  }

  //TODO: figure out how to put CSS in here shorthand without giving me a stroke
  createLanding(id: string, message: string): HTMLDivElement {
    this.currentComponents.push(id);
    if (message === undefined) {
      message = `Welcome to an experiment that uses eye tracking.
             In a few moments you will be asked for permission to use your camera in order to complete the experiment.`;
    }
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

  // defaults to true: will bypass if there is only one camera
  // TODO: what type is the return????
  async generateSelector(
    id: string,
    message: string,
    bypass: boolean
  ): Promise<any> {
    this.currentComponents.push(id);
    let selector = document.createElement("select");
    selector.id = id;
    if (message === undefined) message = "Select a camera";
    if (bypass === undefined) bypass = true;

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
      } else {
        alert("Please select a camera.");
      }
    });

    // but like why tho
    //@ts-ignore
    return new Array(selector, btn);
  }
}
