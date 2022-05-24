import { add } from "../src/index";

test("test adds two numbers", () => {
  expect(add(2, 2)).toEqual(4);
});
