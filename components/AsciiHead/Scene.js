"use client";

import * as THREE from "three";
import { GLTFLoader, OrbitControls } from "three-stdlib";
import AsciiRenderer from "./AsciiRenderer";

export default class SceneManager {
  constructor(container) {
    this.container = container;

    // ------------------------
    // Scene
    // ------------------------
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // ------------------------
    // Camera
    // ------------------------
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    this.camera.position.set(0, 0, 3);

    // ------------------------
    // Renderer
    // ------------------------
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    this.renderer.setSize(
      container.clientWidth,
      container.clientHeight
    );

    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0";
    this.renderer.domElement.style.left = "0";
    this.renderer.domElement.style.zIndex = "1";

    container.appendChild(this.renderer.domElement);

    // ------------------------
    // ASCII Renderer
    // ------------------------
    this.ascii = new AsciiRenderer(container);

    // ------------------------
    // Render Target
    // ------------------------
    this.renderTarget = new THREE.WebGLRenderTarget(
      container.clientWidth,
      container.clientHeight,
      {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
      }
    );

    this.pixelBuffer = new Uint8Array(
      container.clientWidth *
        container.clientHeight *
        4
    );

    // ------------------------
    // Orbit Controls
    // ------------------------
    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    this.controls.enableDamping = true;

    // ------------------------
    // Lights
    // ------------------------
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      0.8
    );

    this.scene.add(ambientLight);

    const directionalLight =
      new THREE.DirectionalLight(
        0xffffff,
        2
      );

    directionalLight.position.set(
      3,
      2,
      5
    );

    this.scene.add(directionalLight);

    // ------------------------
    // Load Model
    // ------------------------
    this.loader = new GLTFLoader();

    this.loader.load(
      "/models/head.glb",

      (gltf) => {
        this.head = gltf.scene;

        this.head.scale.set(1, 1, 1);

        const box =
          new THREE.Box3().setFromObject(
            this.head
          );

        const center =
          box.getCenter(
            new THREE.Vector3()
          );

        this.head.position.sub(center);
        this.head.position.y -= 0.5;

        this.head.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.scene.add(this.head);
      },

      undefined,

      (error) => {
        console.error(error);
      }
    );

    // ------------------------
    // Clock
    // ------------------------
    this.clock = new THREE.Clock();

    // ------------------------
    // Bind Methods
    // ------------------------
    this.animate =
      this.animate.bind(this);

    this.resize =
      this.resize.bind(this);

    window.addEventListener(
      "resize",
      this.resize
    );

    this.animate();
  }

  animate() {
    requestAnimationFrame(
      this.animate
    );

    const elapsed =
      this.clock.getElapsedTime();

    // ------------------------
    // Head Animation
    // ------------------------
    if (this.head) {
      this.head.rotation.y =
        Math.sin(elapsed * 0.4) *
        0.35;

      this.head.rotation.x =
        Math.sin(elapsed * 0.4) *
        0.04;
    }

    this.controls.update();

    // ------------------------
    // Render Offscreen
    // ------------------------
    this.renderer.setRenderTarget(
      this.renderTarget
    );

    this.renderer.render(
      this.scene,
      this.camera
    );

    // ------------------------
    // Read Pixels
    // ------------------------
    this.renderer.readRenderTargetPixels(
      this.renderTarget,
      0,
      0,
      this.renderTarget.width,
      this.renderTarget.height,
      this.pixelBuffer
    );

    // ------------------------
    // Render to Screen
    // ------------------------
    this.renderer.setRenderTarget(
      null
    );

    this.renderer.render(
      this.scene,
      this.camera
    );

    // ------------------------
    // ASCII Conversion
    // ------------------------
    const ascii =
      this.ascii.convert(
        this.pixelBuffer,
        this.renderTarget.width,
        this.renderTarget.height
      );

    this.ascii.render(ascii);
  }

  resize() {
    const width =
      this.container.clientWidth;

    const height =
      this.container.clientHeight;

    this.camera.aspect =
      width / height;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      width,
      height
    );

    this.renderTarget.setSize(
      width,
      height
    );

    this.pixelBuffer =
      new Uint8Array(
        width * height * 4
      );
  }

  destroy() {
    window.removeEventListener(
      "resize",
      this.resize
    );

    this.controls.dispose();

    this.renderTarget.dispose();

    this.renderer.dispose();

    if (
      this.renderer.domElement
        .parentNode ===
      this.container
    ) {
      this.container.removeChild(
        this.renderer.domElement
      );
    }
  }
}