import { initEyetracker, initComponents } from "../src/index";

describe("components", () => {
  let eye: any;
  let comp: any;

  beforeEach(() => {
    global.alert = jest.fn();
    eye = initEyetracker();
    comp = initComponents(eye);
  });

  test("landing page generated and customizable", () => {
    document.body.innerHTML = `<div id="test"></div>`;
    let landing = comp.createLanding("test-land", "Landing page.");
    document.getElementById("test")!.appendChild(landing);

    let innerLanding = document.getElementById("test-land");
    expect(innerLanding).toBeTruthy();
    expect(innerLanding!.innerHTML).toEqual(`<p>Landing page.</p>`);
  });
});
