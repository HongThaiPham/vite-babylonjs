import "@babylonjs/loaders/glTF";
import "@babylonjs/inspector";
import "@babylonjs/core/Debug/debugLayer";
import HavokPhysics from "@babylonjs/havok";
import "./App.css";
import SceneComponent from "babylonjs-hook";
import {
  Vector3,
  HemisphericLight,
  Scene,
  ArcRotateCamera,
  Tools,
  HavokPlugin,
  PhysicsAggregate,
  PhysicsShapeType,
  MeshBuilder,
  SceneLoader,
} from "@babylonjs/core";
import { importModel } from "./libs/importModel";
import { importAnimation } from "./libs/importAnimation";
import CharacterController from "./libs/controller/character.controller";

let havokInstance: Awaited<ReturnType<typeof HavokPhysics>>;
const promise = HavokPhysics().then((instance) => {
  havokInstance = instance;
});

declare global {
  interface Window {
    d: () => void;
  }
}

const onSceneReady = async (scene: Scene) => {
  window.d = () => scene.debugLayer.show();

  // This creates and positions a free camera (non-mesh)
  const camera = new ArcRotateCamera(
    "camera",
    Tools.ToRadians(0), // -90 because we want to look from above
    Tools.ToRadians(65), // 65 because we want to look from above
    6,
    Vector3.Zero(),
    scene
  );

  await promise;

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  const canvas = scene.getEngine().getRenderingCanvas();

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  const havokPlugin = new HavokPlugin(true, havokInstance);
  scene.enablePhysics(null, havokPlugin);
  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  scene.onPointerDown = (_, pickResult) => {
    if (pickResult?.pickedMesh) {
      console.log(pickResult.pickedMesh.name);
    }
  };

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;
  const ground = await importModel(scene, "startupweekend.glb");

  // new PhysicsAggregate(
  //   ground.meshes[0],
  //   PhysicsShapeType.BOX,
  //   { mass: 0 },
  //   scene
  // );
  const collisionMeshes = ["sofa", "chair"];
  const colissionBoxes = ["ground", "box", "cube", "plane"];
  ground.meshes.forEach((mesh) => {
    mesh.checkCollisions = true;
    // mesh.isPickable = false;
    // if (index > 0) {
    //   new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0 }, scene);
    // }

    if (
      colissionBoxes.some((name) =>
        mesh.name.toLowerCase().includes(name.toLocaleLowerCase())
      )
    ) {
      mesh.checkCollisions = true;
      new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0 }, scene);
    }
    if (
      collisionMeshes.some((name) =>
        mesh.name.toLowerCase().includes(name.toLocaleLowerCase())
      )
    ) {
      new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0 }, scene);
    }
  });

  // const player = await importModel(scene, "player.glb");
  const player = await SceneLoader.ImportMeshAsync(
    null,
    "https://models.readyplayer.me/",
    "661a1b5d8106a27608ba6b5f.glb",
    scene
  );

  const capsule = MeshBuilder.CreateCapsule(
    "player",
    {
      height: 2,
      radius: 0.4,
      tessellation: 16,

      capSubdivisions: 16,
    },
    scene
  );

  capsule.visibility = 0.2;
  // player.ellipsoid = new Vector3(0.4, 1.6, 0.4);
  capsule.position.y = 1;
  capsule.isPickable = false;
  capsule.checkCollisions = true;
  capsule.addChild(player.meshes[0]);

  // const capsuleAggregate = new PhysicsAggregate(
  //   capsule,
  //   PhysicsShapeType.CAPSULE,
  //   { mass: 1, friction: 0.5, restitution: 0 },
  //   scene
  // );
  // capsuleAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
  // capsuleAggregate.body.disablePreStep = false;
  // capsuleAggregate.body.setMassProperties({
  //   inertia: new Vector3(0, 0, 0),
  // });
  // capsuleAggregate.body.setCollisionCallbackEnabled(true);

  // setInterval(() => {
  //   capsuleAggregate.body.setLinearVelocity(new Vector3(1, 0, 0));
  // }, 10);

  await importAnimation(scene, "animated-m.glb");

  scene.stopAllAnimations();
  camera.setTarget(capsule);

  const characterController = new CharacterController(scene, capsule, camera);

  scene.registerBeforeRender(() => {
    const deltaTime = scene.getEngine().getDeltaTime();
    characterController.update(deltaTime);
  });

  // Our built-in 'ground' shape.
  // const gm = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
  // gm.position.y = -1;
  // new PhysicsAggregate(gm, PhysicsShapeType.BOX, { mass: 0 }, scene);
};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
// const onRender = (scene: Scene) => {
//   // const player = scene.getMeshByName("player");
//   // if (player) {
//   //   player.position.x += 0.01;
//   // }
// };

function App() {
  return (
    <main>
      <SceneComponent
        antialias
        onSceneReady={onSceneReady}
        // onRender={onRender}
        id="my-canvas"
      />
    </main>
  );
}

export default App;
