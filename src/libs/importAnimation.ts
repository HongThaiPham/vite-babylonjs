import { Scene, SceneLoader } from "@babylonjs/core";

export function importAnimation(scene: Scene, animation: string) {
  return SceneLoader.ImportAnimationsAsync(
    "/resources/animations/",
    animation,
    scene
  );
}
