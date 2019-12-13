import 'styles/index.css';

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
    this.addFloor();
    this.addBackgroundShape();
    this.loadModels('https://raw.githubusercontent.com/iondrimba/images/master/buildings.obj', this.onLoadModelsComplete.bind(this));
    this.animate();

    this.pointLightObj3 = {
      color: '#d3263a',
      intensity: 8.2,
      position: {
        x: 16,
        y: 100,
        z: -68,
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
    this.camera = new THREE.PerspectiveCamera(20, this.width / this.height, 1, 1000);
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

  addBackgroundShape() {
    const planeGeometry = new THREE.PlaneGeometry(400, 100);
    const planeMaterial = new THREE.MeshPhysicalMaterial({ color: '#fff' });
    this.backgroundShape = new THREE.Mesh(planeGeometry, planeMaterial);

    this.backgroundShape.position.y = 10;
    this.backgroundShape.position.z = -150;

    this.scene.add(this.backgroundShape);

    this.mouseX = 3;
    this.lastMouseX = 3;
    this.lastMouseY = 65;
    this.lastScale = 155;
    this.tiltFx = {
      body: document.body,
      docEl: document.documentElement,
      getMousePos: (e, docScrolls) => {
        let posx = 0;
        let posy = 0;
        if (!e) { e = window.event; }
        if (e.pageX || e.pageY) {
          posx = e.pageX;
          posy = e.pageY;
        }
        else if (e.clientX || e.clientY) {
          posx = e.clientX + docScrolls.left;
          posy = e.clientY + docScrolls.top;
        }
        return { x: posx, y: posy }
      },
      lerp: (a, b, n) => (1 - n) * a + n * b,
      lineEq: (y2, y1, x2, x1, currentVal) => {
        let m = (y2 - y1) / (x2 - x1);
        let b = y1 - m * x1;
        return m * currentVal + b;
      }
    };

    this.docheight = Math.max(this.tiltFx.body.scrollHeight, this.tiltFx.body.offsetHeight, this.tiltFx.docEl.clientHeight, this.tiltFx.docEl.scrollHeight, this.tiltFx.docEl.offsetHeight);

    this.requestId = requestAnimationFrame(() => this.tilt());

    window.addEventListener('mousemove', (ev) => {
      const docScrolls = { left: this.tiltFx.body.scrollLeft + this.tiltFx.docEl.scrollLeft, top: this.tiltFx.body.scrollTop + this.tiltFx.docEl.scrollTop };
      const mp = this.tiltFx.getMousePos(ev, docScrolls);
      this.mouseX = mp.x - docScrolls.left;
    });

    window.addEventListener('resize', () => this.docheight = Math.max(this.tiltFx.body.scrollHeight, this.tiltFx.body.offsetHeight, this.tiltFx.docEl.clientHeight,
      this.tiltFx.docEl.scrollHeight, this.tiltFx.docEl.offsetHeight));

    window.onbeforeunload = () => {
      window.cancelAnimationFrame(this.requestId);
      window.scrollTo(0, 0);
    };
  }

  tilt() {
    this.lastMouseX = this.tiltFx.lerp(this.lastMouseX, this.tiltFx.lineEq(6, 0, this.width, 0, this.mouseX), 0.05);
    const newScrollingPos = window.pageYOffset;
    this.lastMouseY = this.tiltFx.lerp(this.lastMouseY, this.tiltFx.lineEq(0, 65, this.docheight, 0, newScrollingPos), 0.05);
    this.lastScale = this.tiltFx.lerp(this.lastScale, this.tiltFx.lineEq(0, 158, this.docheight, 0, newScrollingPos), 0.05);
    this.camera.position.set(this.lastMouseX, this.lastMouseY, this.lastScale);
    this.requestId = requestAnimationFrame(() => this.tilt());
  }

  addFloor() {
    const floor = { color: '#000000' };
    const planeGeometry = new THREE.PlaneGeometry(200, 200);
    const planeMaterial = new THREE.MeshStandardMaterial({
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
      model.receiveShadow = true;
      model.castShadow = true;

      return model;
    });

    this.draw();

    setTimeout(() => {
      this.removeLoader();
      this.showBuildings();
    }, 500);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  removeLoader() {
    document.querySelector('.loader').classList.add('loader--done');
  }

  showBuildings() {
    this.sortBuildingsByDistance();

    this.buildings.forEach((building, index) => {
      TweenMax.to(building.position, .6 + (index / 4000), { y: 1, ease: Quint.easeOut, delay: index / 4000 });
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
    this.controls.update();

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.animate.bind(this));
  }
}
