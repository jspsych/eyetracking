import { initEyetracker, initComponents } from "../src/index";

test("test adds two numbers", () => {
  global.alert = jest.fn(); // TODO: figure out a way to implement alert or just remove it!
  const eye = initEyetracker();
  expect(eye.add(2, 2)).toEqual(4);
});
