import { Scene, SceneLoader } from "@babylonjs/core";

export function importModel(scene: Scene, model: string) {
  return SceneLoader.ImportMeshAsync(null, "/resources/models/", model, scene);
}
