import {
  AnimationGroup,
  ArcRotateCamera,
  Mesh,
  PhysicsAggregate,
  PhysicsMotionType,
  PhysicsShapeType,
  Quaternion,
  Scene,
  Vector3,
} from "@babylonjs/core";
import PlayerInput from "./player.input";

export default class CharacterController {
  private _velocity: number = 0.2;
  private _gravity: number = 0.003;
  private _jumpHeight: number = 0.5; // 0.9
  private _jumping: boolean = false;
  private _jumpingTime: number = 0;
  private _jumpingMaxTime: number = 0.9;
  private _speed: number = 0.1; // 0.1
  // private _speedMultiplier: number = 1;
  // private _friction: number = 0.8;
  private _camera: ArcRotateCamera;
  private _player: Mesh;
  private _input: PlayerInput;
  private _scene: Scene;
  private _idleAnimation?: AnimationGroup;
  private _walkAnimation?: AnimationGroup;
  private _runAnimation?: AnimationGroup;
  // private _allAnimations?: AnimationGroup;
  private _prevAnimationName?: "IDLE" | "WALKING" | "RUNNING";
  private _prevAnimationGroup?: AnimationGroup;
  private _capsuleAggregate: PhysicsAggregate;
  constructor(scene: Scene, player: Mesh, camera: ArcRotateCamera) {
    this._scene = scene;
    this._player = player;
    this._camera = camera;
    this._input = new PlayerInput(this._scene, this._camera);
    this._idleAnimation = this._scene.getAnimationGroupByName("IDLE")!;
    this._walkAnimation = this._scene.getAnimationGroupByName("WALKING")!;
    this._runAnimation = this._scene.getAnimationGroupByName("RUNNING")!;

    this._camera.rotationQuaternion = Quaternion.Identity();
    this._player.rotationQuaternion = Quaternion.FromEulerAngles(
      0,
      -Math.PI / 2,
      0
    );

    this._capsuleAggregate = new PhysicsAggregate(
      this._player,
      PhysicsShapeType.CAPSULE,
      { mass: 1, friction: 0.5, restitution: 0 },
      scene
    );
    this._capsuleAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
    this._capsuleAggregate.body.disablePreStep = false;
    this._capsuleAggregate.body.setMassProperties({
      inertia: new Vector3(0, 0, 0),
    });
    this._capsuleAggregate.body.setCollisionCallbackEnabled(true);
  }

  private get playerSpeed() {
    return this._input.isRunning ? this._speed * 2 : this._speed;
  }

  public update(deltaTime: number) {
    this._checkJumpAndUpdateVelocity(deltaTime);
    this._updatePlayerRotation();
    this._movePlayerForward();
    this._updatePlayerAnimation();
  }

  private _movePlayerForward() {
    const moveAxis = this._input.isMoving ? Vector3.Forward() : Vector3.Zero();
    const forward = this._player.getDirection(moveAxis);
    const forwardMovement = forward.scale(this.playerSpeed);

    forwardMovement.y = this._velocity;
    this._player.moveWithCollisions(forwardMovement);
    this._player.physicsBody?.setLinearVelocity(forwardMovement);
    // this._capsuleAggregate.body.setLinearVelocity(forwardMovement);
  }

  private _updatePlayerRotation() {
    const targetRotation = Quaternion.RotationYawPitchRoll(
      this.targetPlayerRotation,
      0,
      0
    );
    const relativeRotation = Quaternion.Inverse(
      this._camera.rotationQuaternion
    ).multiply(targetRotation);
    const newRotation = Quaternion.Slerp(
      this._player.rotationQuaternion!,
      relativeRotation,
      0.1
    );
    this._player.rotationQuaternion = newRotation;
  }

  private get targetPlayerRotation() {
    const cameraAlpha = this._camera.alpha;
    const forwardAlpha = -cameraAlpha - Math.PI / 2;
    const leftAlpha = forwardAlpha + Math.PI / 2;
    const rightAlpha = forwardAlpha - Math.PI / 2;
    const backwardAlpha = forwardAlpha + Math.PI;

    if (this._input.horizontalAxis === 1 && this._input.verticalAxis === 1) {
      return forwardAlpha - Math.PI / 4;
    }

    if (this._input.horizontalAxis === -1 && this._input.verticalAxis === 1) {
      return forwardAlpha + Math.PI / 4;
    }

    if (this._input.horizontalAxis === -1 && this._input.verticalAxis === -1) {
      return backwardAlpha - Math.PI / 4;
    }

    if (this._input.horizontalAxis === 1 && this._input.verticalAxis === -1) {
      return backwardAlpha + Math.PI / 4;
    }

    if (this._input.horizontalAxis === 1) {
      return rightAlpha;
    }

    if (this._input.horizontalAxis === -1) {
      return leftAlpha;
    }

    if (this._input.verticalAxis === 1) {
      return forwardAlpha;
    }

    if (this._input.verticalAxis === -1) {
      return backwardAlpha;
    }

    return this._player.rotationQuaternion!.toEulerAngles().y;
  }

  private _checkJumpAndUpdateVelocity(deltaTime: number) {
    if (this._input.jumpKeyDown && !this._jumping) {
      console.log("jump");
      this._jumping = true;
      this._jumpingTime = 0;
      this._velocity = this._jumpHeight;
    }

    if (this._jumping) {
      this._jumpingTime += deltaTime / 1000;
      if (this._jumpingTime >= this._jumpingMaxTime) {
        this._jumpingTime = 0;
        this._jumping = false;
      }
    }

    if (this._jumping) {
      this._velocity -= this._gravity * deltaTime;
    } else {
      this._velocity = -this._gravity * deltaTime;
    }
  }

  private _updatePlayerAnimation() {
    // if (this._input.isMoving) {
    //   this._idleAnimation.stop();
    //   this._walkAnimation.play(true);
    // } else {
    //   this._idleAnimation.play(true);
    //   this._walkAnimation.stop();
    // }
    // Animation split one by one
    if (this._idleAnimation || this._walkAnimation || this._runAnimation) {
      if (
        this._input.isRunning &&
        this._prevAnimationGroup !== this._runAnimation
      ) {
        console.log("Start running animation");
        this._prevAnimationName = "RUNNING";
        this._prevAnimationGroup?.stop();
        this._prevAnimationGroup = this._runAnimation;
        this._runAnimation?.play(true);
        return;
      }
      if (
        !this._input.isRunning &&
        this._input.isMoving &&
        this._prevAnimationName !== "WALKING"
      ) {
        console.log("Start walking animation");
        this._prevAnimationName = "WALKING";
        this._prevAnimationGroup?.stop();
        this._prevAnimationGroup = this._walkAnimation;
        this._walkAnimation?.play(true);
        return;
      }
      if (!this._input.isMoving && this._prevAnimationName !== "IDLE") {
        console.log("Start idle animation");
        this._prevAnimationName = "IDLE";
        this._prevAnimationGroup?.stop();
        this._prevAnimationGroup = this._idleAnimation;
        this._idleAnimation?.play(true);
        return;
      }
    }
  }
}
