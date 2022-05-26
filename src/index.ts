// import faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

// export async function init() {
//   const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
//   const detectorConfig = {
//     runtime: "mediapipe", // or 'tfjs'
//     solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
//     refineLandmarks: true,
//   };

//   const detector = await faceLandmarksDetection.createDetector(
//     model,
//     // @ts-expect-error
//     detectorConfig
//   );

//   console.log(detector);
// }

/**
 * This is a function to add two numbers together.
 *
 * @param a A number to add
 * @param b A number to add
 * @returns The sum of both numbers
 */
export function add(a: number, b: number): number {
  return a + b;
}
