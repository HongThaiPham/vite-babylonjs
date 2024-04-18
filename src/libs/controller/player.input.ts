import {
  ActionManager,
  ArcRotateCamera,
  ExecuteCodeAction,
  Scalar,
  Scene,
  VirtualJoystick,
} from "@babylonjs/core";

export default class PlayerInput {
  private _keys: { [key: string]: boolean } = {};

  //simple movement
  public horizontal: number = 0;
  public vertical: number = 0;
  //tracks whether or not there is movement in that axis
  public horizontalAxis: number = 0;
  public verticalAxis: number = 0;
  public jumpKeyDown: boolean = false;

  private _leftJoystick?: VirtualJoystick;
  private _rightJoystick?: VirtualJoystick;
  private _joystickMaxDelta: number = 0.02;

  constructor(private _scene: Scene, private camera: ArcRotateCamera) {
    this._scene.actionManager = new ActionManager(this._scene);
    this._scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
        this._keys[evt.sourceEvent.key.toLowerCase()] = true;
      })
    );
    this._scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
        this._keys[evt.sourceEvent.key.toLowerCase()] = false;
      })
    );

    if (this.isMobile) {
      this._leftJoystick = new VirtualJoystick(true, {
        limitToContainer: true,
        color: "#ffffffbb",
        containerSize: 42,
        puckSize: 20,
      });

      this._leftJoystick.setJoystickSensibility(0.5);
      VirtualJoystick.Canvas!.style.zIndex = "4";

      this._rightJoystick = new VirtualJoystick(false, {
        limitToContainer: true,
        color: "#ffffffbb",
        containerSize: 42,
        puckSize: 20,
      });

      this._rightJoystick.setJoystickSensibility(0.5);
      VirtualJoystick.Canvas!.style.zIndex = "4";

      // this._prepareJumpButton();
    }

    const addObservableCallback = () => {
      this._updateFromKeyboard();
      this._updateFromJoystick();
    };
    this._scene.onBeforeRenderObservable.add(addObservableCallback);
  }

  public isKeyPressed(key: string): boolean {
    const keyIndex = key.toLowerCase();
    return !!this._keys[keyIndex];
  }

  private _updateFromJoystick(): void {
    if (!this._leftJoystick || !this._rightJoystick) {
      return;
    }

    if (this._leftJoystick.pressed) {
      const deltaPosition = this._leftJoystick.deltaPosition;
      const maxDelta = this._joystickMaxDelta;
      // Horizontal movement
      if (deltaPosition.x > maxDelta / 2 || deltaPosition.x < -maxDelta / 2) {
        const horizontalAxis = deltaPosition.x > 0 ? 1 : -1;
        this.horizontal = Scalar.Lerp(this.horizontal, horizontalAxis, 0.2);
        this.horizontalAxis = horizontalAxis;
      } else {
        this.horizontal = 0;
        this.horizontalAxis = 0;
      }
      // Vertical movement
      if (deltaPosition.y > maxDelta / 2 || deltaPosition.y < -maxDelta / 2) {
        const verticalAxis = deltaPosition.y > 0 ? 1 : -1;
        this.vertical = Scalar.Lerp(this.vertical, verticalAxis, 0.2);
        this.verticalAxis = verticalAxis;
      } else {
        this.vertical = 0;
        this.verticalAxis = 0;
      }
    } else {
      this.horizontal = 0;
      this.horizontalAxis = 0;
      this.vertical = 0;
      this.verticalAxis = 0;
    }

    if (this._rightJoystick.pressed) {
      this.camera.inertialAlphaOffset -=
        this._rightJoystick.deltaPosition.x / 5;
      this.camera.inertialBetaOffset += this._rightJoystick.deltaPosition.y / 5;
    }
  }

  private _updateFromKeyboard(): void {
    // Vertical movement (W/S)
    if (this.isKeyPressed("w") || this.isKeyPressed("ArrowUp")) {
      this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
      this.verticalAxis = 1;
    } else if (this.isKeyPressed("s") || this.isKeyPressed("ArrowDown")) {
      this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
      this.verticalAxis = -1;
    } else {
      this.vertical = 0;
      this.verticalAxis = 0;
    }

    // Horizontal movement (A/D)
    if (this.isKeyPressed("a") || this.isKeyPressed("ArrowLeft")) {
      this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
      this.horizontalAxis = 1;
    } else if (this.isKeyPressed("d") || this.isKeyPressed("ArrowRight")) {
      this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
      this.horizontalAxis = -1;
    } else {
      this.horizontal = 0;
      this.horizontalAxis = 0;
    }

    // Jump (SPACE)
    if (this.isKeyPressed(" ")) {
      this.jumpKeyDown = true;
    } else {
      this.jumpKeyDown = false;
    }
  }

  public get isMoving(): boolean {
    return this.horizontal !== 0 || this.vertical !== 0;
  }

  public get isRunning(): boolean {
    return this.isKeyPressed("Shift");
  }

  // private _prepareJumpButton(): void {
  //   if (document.getElementById("jump-button")) {
  //     return;
  //   }
  //   console.log("prepare jump button");
  //   const onJump = () => {
  //     this.jumpKeyDown = true;
  //   };
  //   const onJumpEnd = () => {
  //     this.jumpKeyDown = false;
  //   };
  //   const jumpButton = document.createElement("button");
  //   jumpButton.id = "jump-button";
  //   document.body.appendChild(jumpButton);
  //   jumpButton.addEventListener("touchstart", onJump, {
  //     passive: false,
  //   });
  //   jumpButton.addEventListener("mousedown", onJump);
  //   jumpButton.addEventListener("mouseup", onJumpEnd);
  //   jumpButton.addEventListener("touchend", onJumpEnd);
  // }

  private _isAndroid(): boolean {
    return navigator.userAgent.toLowerCase().indexOf("android") > -1;
  }

  private _isIos(): boolean {
    return (
      (navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/iPad/i) ||
        navigator.userAgent.match(/iPod/i)) !== null
    );
  }

  public get isMobile(): boolean {
    return this._isAndroid() || this._isIos();
  }
}
