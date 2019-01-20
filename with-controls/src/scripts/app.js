import 'styles/index.scss';

export default class App {
  init() {
    this.group = new THREE.Object3D();
    this.bgColor = window.getComputedStyle(document.body, null).getPropertyValue('background-color');
    this.gui = new dat.GUI();
    this.gui.closed = true;
    this.gridSize = 40;
    this.buildings = [];
    this.fogConfig = {
      color: '#373435',
      near: 1,
      far: 208
    };

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.createScene();
    this.createCamera();
    this.addAmbientLight();
    this.addSpotLight();
    this.addCameraControls();
    this.addFloor();
    this.addTiltEvent();
    this.loadModels('https://raw.githubusercontent.com/iondrimba/images/master/buildings.obj', this.onLoadModelsComplete.bind(this));

    this.animate();

    const fogGUI = this.gui.addFolder('Fog');

    fogGUI.addColor(this.fogConfig, 'color').onChange((color) => {
      this.scene.fog.color = new THREE.Color(color);
      document.body.style.backgroundColor = color;
    });

    fogGUI.add(this.fogConfig, 'far', 1, 1000).onChange((far) => {
      this.scene.fog.far = far;
    });

    this.pointLightObj = {
      color: '#5f5157',
      intensity: 4,
      position: {
        x: -15,
        y: 29,
        z: 43,
      }
    };

    this.addPointLight(this.pointLightObj, 'First light');

    this.pointLightObj1 = {
      color: '#848484',
      intensity: 2.2,
      position: {
        x: -7,
        y: 100,
        z: -100,
      }
    };

    this.addPointLight(this.pointLightObj1, 'Second light');

    this.pointLightObj2 = {
      color: '#271c41',
      intensity: 1.8,
      position: {
        x: -30,
        y: -20,
        z: -51,
      }
    };

    this.addPointLight(this.pointLightObj2, 'Third light');

    this.pointLightObj3 = {
      color: '#0000ff',
      intensity: 2.1,
      position: {
        x: 5,
        y: 53,
        z: -13,
      }
    };

    this.addPointLight(this.pointLightObj3, 'Fourth light');
  }

  addPointLight(params, name) {
    const pointLight = new THREE.PointLight(params.color, params.intensity);
    pointLight.position.set(params.position.x, params.position.y, params.position.z);

    this.scene.add(pointLight);

    const lightGui = this.gui.addFolder(name);
    lightGui.add(params, 'intensity', 1, 10).onChange((intensity) => {
      pointLight.intensity = intensity;
    });

    lightGui.addColor(params, 'color').onChange((color) => {
      pointLight.color = this.hexToRgbTreeJs(color);
    });

    lightGui.add(params.position, 'x', -100, 100).onChange((x) => {
      pointLight.position.x = x;
    });

    lightGui.add(params.position, 'y', -100, 100).onChange((y) => {
      pointLight.position.y = y;
    });

    lightGui.add(params.position, 'z', -100, 100).onChange((z) => {
      pointLight.position.z = z;
    });
  }

  getRandomBuiding() {
    return this.models[Math.floor(Math.random() * Math.floor(this.models.length))].clone();
  }

  onLoadModelsComplete(obj) {
    this.models = [...obj.children].map((model) => {
      const scale = .01;

      model.scale.set(scale, scale, scale);
      model.position.set(0, -14, 0);
      model.matrixAutoUpdate = false;
      model.visible = false;

      return model;
    });

    this.removeLoader();

    this.draw();

    setTimeout(() => {
      this.showBuildings();

      window.addEventListener('resize', this.onResize.bind(this));
    }, 1000);
  }

  removeLoader() {
    document.querySelector('.loader').remove();
  }

  draw() {
    const boxSize = 3;
    const meshParams = {
      color: '#161616',
      metalness: .79,
      emissive: '#000000',
      roughness: .8,
    };

    const max = .009;
    const min = .001;

    const material = new THREE.MeshPhysicalMaterial(meshParams);

    const materialGUI = this.gui.addFolder('Building Material');

    materialGUI.addColor(meshParams, 'color').onChange((color) => {
      material.color = this.hexToRgbTreeJs(color);
    });

    materialGUI.addColor(meshParams, 'emissive').onChange((emissive) => {
      material.emissive = this.hexToRgbTreeJs(emissive);
    });

    materialGUI.add(meshParams, 'metalness', 0, 1).onChange((metalness) => {
      material.metalness = metalness;
    });

    materialGUI.add(meshParams, 'roughness', 0, 1).onChange((roughness) => {
      material.roughness = roughness;
    });

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const building = this.getRandomBuiding();

        building.material = material;
        building.matrixAutoUpdate = true;
        building.visible = true;
        building.scale.y = Math.random() * (max - min + .01);
        building.position.x = (i * boxSize);
        building.position.z = (j * boxSize);

        this.group.add(building);

        this.buildings.push(building);
      }
    }

    this.scene.add(this.group);
    this.group.position.set(-this.gridSize - 10, 1, -this.gridSize - 10);
  }

  showBuildings() {
    this.sortBuildingsByDistance();

    this.buildings.forEach((building, index) => {
      TweenMax.to(building.position, .6 + (index / 3500), {
        y: 1, ease: Expo.easeOut, delay: index / 3500, onComplete: (building) => {
          building.matrixAutoUpdate = false;
        }, onCompleteParams: [building]
      });
    });
  }

  sortBuildingsByDistance() {
    this.buildings.sort((a, b) => {
      if (a.position.z > b.position.z) {
        return 1;
      }
      if (a.position.z < b.position.z) {
        return -1;
      }
      return 0;
    }).reverse();
  }

  loadModels(name, callback) {
    const objLoader = new THREE.OBJLoader();

    objLoader.load(name, callback);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  createScene() {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.querySelector('.canvas-wrapper').appendChild(this.renderer.domElement);

    this.scene.fog = new THREE.Fog(this.fogConfig.color, this.fogConfig.near, this.fogConfig.far);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(20, this.width / this.height, 90, 1000);
    this.camera.position.set(3, 50, 155);

    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
  }

  addSpotLight() {
    const light = { color: '#b1b1b1', x: 100, y: 150, z: 100 };
    const lightGUI = this.gui.addFolder('Spot Light');
    const spotLight = new THREE.SpotLight(light.color, 1);

    lightGUI.addColor(light, 'color').onChange((color) => {
      spotLight.color = this.hexToRgbTreeJs(color);
    });

    lightGUI.add(light, 'x', -1000, 1000).onChange((x) => {
      spotLight.position.x = x;
    });

    lightGUI.add(light, 'y', -1000, 1000).onChange((y) => {
      spotLight.position.y = y;
    });

    lightGUI.add(light, 'z', -1000, 1000).onChange((z) => {
      spotLight.position.z = z;
    });

    spotLight.position.set(light.x, light.y, light.z);
    spotLight.castShadow = true;

    this.scene.add(spotLight);
  }

  addAmbientLight() {
    const light = { color: '#fff' };
    const lightGUI = this.gui.addFolder('Ambient Light');
    const ambientLight = new THREE.AmbientLight(light.color);

    lightGUI.addColor(light, 'color').onChange((color) => {
      ambientLight.color = this.hexToRgbTreeJs(color);
    });

    this.scene.add(ambientLight);
  }

  addTiltEvent() {
    /*
    this.mouseX = 3;
    this.mouseY = 50;
    this.lastMouseX = 3;
    this.lastMouseY = 50;
    requestAnimationFrame(() => this.tilt());
    window.addEventListener('mousemove', (ev) => {
      this.mouseX = ev.pageX;
      this.mouseY = ev.pageY;
    });*/
  }

  tilt() {
    const lerp = (a, b, n) => (1 - n) * a + n * b;
    const lineEq = (y2, y1, x2, x1, currentVal) => {
      let m = (y2 - y1) / (x2 - x1);
      let b = y1 - m * x1;
      return m * currentVal + b;
    };
    this.lastMouseX = lerp(this.lastMouseX, lineEq(0, 6, this.width, 0, this.mouseX), 0.05);
    this.lastMouseY = lerp(this.lastMouseY, lineEq(48, 52, this.height, 0, this.mouseY), 0.05);
    this.camera.position.set(this.lastMouseX, this.lastMouseY, 155);

    requestAnimationFrame(() => this.tilt());
  }

  addFloor() {
    const floor = { color: '#000' };
    const planeGeometry = new THREE.PlaneBufferGeometry(200, 200);
    const planeMaterial = new THREE.MeshLambertMaterial({
      color: floor.color,
      emissive: '#000000',
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    planeGeometry.rotateX(- Math.PI / 2);
    plane.position.y = 0;

    this.scene.add(plane);

    const floorGUI = this.gui.addFolder('Floor');

    floorGUI.addColor(floor, 'color').onChange((color) => {
      planeMaterial.color = this.hexToRgbTreeJs(color);
    });
  }

  animate() {
    this.controls.update();

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.animate.bind(this));
  }

  hexToRgbTreeJs(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : null;
  }

}
