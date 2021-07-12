import { imag } from "@tensorflow/tfjs";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";

export class Cropper {
  static crop = async (
    imageBitMap: ImageBitmap | HTMLCanvasElement,
    aspectRatio: number
  ): Promise<ImageBitmap> => {
    const inputWidth = imageBitMap.width;
    const inputHeight = imageBitMap.height;
    const inputImageAspectRatio = inputWidth / inputHeight;

    let outputWidth = inputWidth;
    let outputHeight = inputHeight;
    if (inputImageAspectRatio > aspectRatio) {
      outputWidth = inputHeight * aspectRatio;
    } else if (inputImageAspectRatio < aspectRatio) {
      outputHeight = inputWidth / aspectRatio;
    }
    const outputX = (outputWidth - inputWidth) * 0.5;
    const outputY = (outputHeight - inputHeight) * 0.5;
    const canvas = new OffscreenCanvas(outputWidth, outputHeight);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitMap, outputX, outputY);
    return canvas.transferToImageBitmap();
  };

  static resize = async (
    imageBitMap: ImageBitmap,
    width: number,
    height: number
  ): Promise<ImageBitmap> => {
    const sourceWidth = imageBitMap.width;
    const destWidth = imageBitMap.height;
    const canvas = new OffscreenCanvas(width, height);
    canvas
      .getContext("2d")
      .drawImage(
        imageBitMap,
        0,
        0,
        sourceWidth,
        destWidth,
        0,
        0,
        width,
        height
      );
    return canvas.transferToImageBitmap();
  };
}
