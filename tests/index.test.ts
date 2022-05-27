import { initEyetracker } from "../src/index";

test("test adds two numbers", () => {
  const eye = initEyetracker();
  expect(eye.add(2, 2)).toEqual(4);
});
