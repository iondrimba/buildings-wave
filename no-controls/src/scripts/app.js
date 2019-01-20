import 'styles/index.scss';

export default class App {
  init() {
    this.group = new THREE.Object3D();
    this.bgColor = window.getComputedStyle(document.body, null).getPropertyValue('background-color');
    this.gridSize = 40;
    this.buildings = [];
    this.fogConfig = {
      color: '#353c3c',
      near: 1,
      far: 208
    };

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.createScene();
    this.createCamera();
    this.addCameraControls();
    this.addAmbientLight();
    this.addSpotLight();
    this.addFloor();
    this.addTiltEvent();
    this.loadModels('https://raw.githubusercontent.com/iondrimba/images/master/buildings.obj', this.onLoadModelsComplete.bind(this));

    this.animate();

    this.pointLightObj = {
      color: '#ff0000',
      intensity: 7.5,
      position: {
        x: -15,
        y: 46,
        z: 43,
      }
    };

    this.addPointLight(this.pointLightObj);

    this.pointLightObj1 = {
      color: '#131dca',
      intensity: 2.8,
      position: {
        x: -7,
        y: 100,
        z: 7,
      }
    };

    this.addPointLight(this.pointLightObj1);

    this.pointLightObj2 = {
      color: '#ed1831',
      intensity: 8.3,
      position: {
        x: 16,
        y: 100,
        z: -68,
      }
    };

    this.addPointLight(this.pointLightObj2);

    this.pointLightObj3 = {
      color: '#00ffd1',
      intensity: 4.7,
      position: {
        x: 5,
        y: 53,
        z: -13,
      }
    };

    this.addPointLight(this.pointLightObj3);
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

    this.controls.enabled = false;
  }

  addSpotLight() {
    const light = { color: '#ff0000', x: 641, y: -462, z: 509 };
    const spotLight = new THREE.SpotLight(light.color, 1);

    spotLight.position.set(light.x, light.y, light.z);
    spotLight.castShadow = true;

    this.scene.add(spotLight);
  }

  addAmbientLight() {
    const light = { color: '#a00a0a' };
    const ambientLight = new THREE.AmbientLight(light.color);

    this.scene.add(ambientLight);
  }

  addTiltEvent() {
    this.mouseX = 3;
    this.mouseY = 50;
    this.lastMouseX = 3;
    this.lastMouseY = 50;

    window.addEventListener('mousemove', (ev) => {
      this.mouseX = ev.pageX;
      this.mouseY = ev.pageY;
    });
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
  }

  addFloor() {
    const floor = { color: '#000000' };
    const planeGeometry = new THREE.PlaneBufferGeometry(200, 200);
    const planeMaterial = new THREE.MeshLambertMaterial({
      color: floor.color,
      metalness: 0,
      emissive: '#000000',
      roughness: 0,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    planeGeometry.rotateX(- Math.PI / 2);
    plane.position.y = 0;

    this.scene.add(plane);
  }

  addPointLight(params) {
    const pointLight = new THREE.PointLight(params.color, params.intensity);

    pointLight.position.set(params.position.x, params.position.y, params.position.z);

    this.scene.add(pointLight);
  }

  getRandomBuiding() {
    return this.models[Math.floor(Math.random() * Math.floor(this.models.length))];
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

    setTimeout(this.showBuildings.bind(this), 1000);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  removeLoader() {
    document.querySelector('.loader').remove();
  }

  showBuildings() {
    this.sortBuildingsByDistance();

    this.buildings.forEach((building, index) => {
      TweenMax.to(building.position, .6 + (index / 3500), {
        y: 1, ease: Expo.easeInOut, delay: index / 3500, onComplete: (building) => {
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

  draw() {
    const boxSize = 3;
    const meshParams = {
      color: '#000',
      metalness: 0,
      emissive: '#000',
      roughness: .77,
    };

    const max = .009;
    const min = .001;
    const material = new THREE.MeshPhysicalMaterial(meshParams);

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const building = this.getRandomBuiding().clone();

        building.material = material;
        building.visible = true;
        building.matrixAutoUpdate = true;
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

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    this.tilt();

    this.controls.update();

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.animate.bind(this));
  }
}
