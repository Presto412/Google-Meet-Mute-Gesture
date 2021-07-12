import {
  ClassifierInputSource,
  CustomMobileNet,
  load,
} from "@teachablemachine/image";
import { METADATA_EXT, MODEL_EXT } from "./constants";

export class Predictor {
  private static model: CustomMobileNet;

  static async loadModel(url: string) {
    console.debug("Loading model...");
    const modelURL = url + MODEL_EXT;
    const metadataURL = url + METADATA_EXT;
    try {
      this.model = await load(modelURL, metadataURL);
      let maxPredictions = this.model.getTotalClasses();
      console.debug(`Max predictions:${maxPredictions}`);
    } catch (err) {
      console.error(
        `Unable to load model from URL: ${url}. Error: ${JSON.stringify(err)}`
      );
      throw err;
    }
  }

  static async predict(source: ClassifierInputSource) {
    if (!Predictor.model) {
      console.error("Model not loaded");
      return;
    }
    return await Predictor.model.predict(source);
  }
}
