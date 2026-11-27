// Remotion CLI / Studio configuration.
// Programmatic renders (scripts/render.mjs) read the same env variables.
import { Config } from "@remotion/cli/config";

// "angle" uses the GPU on macOS (Intel Iris/AMD). Use "swangle" (software) on
// headless Linux / CI machines without a GPU.
const gl = (process.env.RENDER_GL ?? "angle") as "angle" | "swangle" | "egl" | "swiftshader";
Config.setChromiumOpenGlRenderer(gl);
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
if (process.env.BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.BROWSER_EXECUTABLE);
}
