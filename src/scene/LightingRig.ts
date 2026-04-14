import {
  Scene,
  DirectionalLight,
  SpotLight,
  Color,
} from 'three';

export class LightingRig {
  private lights: (DirectionalLight | SpotLight)[] = [];

  constructor(scene: Scene) {
    // Key light — warm, upper front-right, strong for cinematic contrast
    const keyLight = new DirectionalLight(new Color(0xfff5e8), 2.4);
    keyLight.position.set(0.25, 0.5, 0.25);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.01;
    keyLight.shadow.camera.far = 2;
    keyLight.shadow.camera.left = -0.35;
    keyLight.shadow.camera.right = 0.35;
    keyLight.shadow.camera.top = 0.35;
    keyLight.shadow.camera.bottom = -0.35;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.normalBias = 0.002;
    keyLight.shadow.radius = 4;
    scene.add(keyLight);
    this.lights.push(keyLight);

    // Fill light — cool blue, left, soft (keeps shadows from going pure black)
    const fillLight = new DirectionalLight(new Color(0xdce4f5), 0.3);
    fillLight.position.set(-0.35, 0.25, 0.15);
    scene.add(fillLight);
    this.lights.push(fillLight);

    // Rim light — sharp backlight, creates silhouette separation
    const rimLight = new DirectionalLight(new Color(0xffffff), 2.0);
    rimLight.position.set(-0.05, 0.4, -0.4);
    rimLight.castShadow = true;
    rimLight.shadow.mapSize.set(1024, 1024);
    rimLight.shadow.bias = -0.0001;
    rimLight.shadow.normalBias = 0.002;
    rimLight.shadow.radius = 2;
    rimLight.shadow.camera.near = 0.01;
    rimLight.shadow.camera.far = 2;
    rimLight.shadow.camera.left = -0.3;
    rimLight.shadow.camera.right = 0.3;
    rimLight.shadow.camera.top = 0.3;
    rimLight.shadow.camera.bottom = -0.3;
    scene.add(rimLight);
    this.lights.push(rimLight);

    // Top spot — tight overhead pool, main drama light
    const topSpot = new SpotLight(new Color(0xfff0d6), 3.5, 1.0, Math.PI / 8, 0.6, 1.5);
    topSpot.position.set(0.05, 0.65, 0.08);
    topSpot.target.position.set(0, 0, 0);
    topSpot.castShadow = true;
    topSpot.shadow.mapSize.set(2048, 2048);
    topSpot.shadow.bias = -0.0001;
    topSpot.shadow.normalBias = 0.002;
    topSpot.shadow.radius = 5;
    scene.add(topSpot);
    scene.add(topSpot.target);
    this.lights.push(topSpot);

    // Low grazing — reveals surface texture
    const grazingLight = new SpotLight(new Color(0xf0e8d8), 0.5, 0.8, Math.PI / 4, 0.9, 2);
    grazingLight.position.set(0.3, 0.01, 0.25);
    grazingLight.target.position.set(0, 0.05, 0);
    scene.add(grazingLight);
    scene.add(grazingLight.target);
    this.lights.push(grazingLight);
  }

  setIntensityMultiplier(multiplier: number) {
    this.lights.forEach((light) => {
      light.intensity *= multiplier;
    });
  }
}
