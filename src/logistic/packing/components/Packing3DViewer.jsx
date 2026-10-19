import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Camera, Ruler, Grid, Eye } from 'lucide-react';

/**
 * Procedural wood texture matching show.blade.php in backend-admin/resources/views/packaging
 */
function makeWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#c99657');
  gradient.addColorStop(0.5, '#d9ad70');
  gradient.addColorStop(1, '#b77c3e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let seed = 8128;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let y = 8; y < canvas.height; y += 12) {
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 8) {
      const wave = Math.sin((x + y * 3) * 0.035) * 2.2;
      const noise = (random() - 0.5) * 2.1;
      const py = y + wave + noise;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.strokeStyle = `rgba(87, 47, 19, ${0.12 + random() * 0.1})`;
    ctx.lineWidth = 1 + random();
    ctx.stroke();
  }

  for (let i = 0; i < 9; i += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const r = 3 + random() * 8;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 2, r, random() * Math.PI, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(92, 50, 20, 0.24)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function roundRect(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y + w, x, y, r);
  ctx.closePath();
}

function makeTextSprite(text, maxDim = 2) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = 30;
  ctx.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
  const width = Math.ceil(ctx.measureText(text).width + 30);
  canvas.width = width;
  canvas.height = 54;

  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(255, 255, 255, 0.94)';
  context.strokeStyle = 'rgba(31, 103, 199, 0.32)';
  context.lineWidth = 2;
  roundRect(context, 1, 1, canvas.width - 2, canvas.height - 2, 12);
  context.fill();
  context.stroke();

  context.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
  context.fillStyle = '#0f2747';
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  const scale = Math.max(0.15, maxDim) * 0.0006;
  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);
  sprite.renderOrder = 999;
  return sprite;
}

const Packing3DViewer = forwardRef(function Packing3DViewer(
  {
    dimensions = { panjang: 1000, lebar: 800, tinggi: 800 },
    clearance = { jarakAtas: 300, jarakBawah: 300, celahAtas: 0, celahBawah: 0 },
    timberConfig = {
      skidWidth: 80,
      skidHeight: 80,
      skidCount: 3,
      pygSize: 60,
      boardWidth: 140,
      boardThickness: 20,
      boardGap: 15,
      postWidth: 70,
      postThickness: 50,
      postsPerSide: 3
    },
    assemblyStep = 0, // 0 = Utuh, 1..6 = Steps, 9 = Exploded
    onCalculateSummary = null,
    className = 'h-[550px]',
    isPalletEnabled = true
  },
  ref
) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const modelGroupRef = useRef(null);
  const dimensionGroupRef = useRef(null);
  const gridRef = useRef(null);
  const materialsRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Floating Toolbar 1: Visibility states (matching backend show.blade.php)
  const [visPenyanggaAtas, setVisPenyanggaAtas] = useState(true);
  const [visPenutupAtas, setVisPenutupAtas] = useState(true);
  const [visPenyanggaBawah, setVisPenyanggaBawah] = useState(true);
  const [visPenutupBawah, setVisPenutupBawah] = useState(true);
  const [visKakiBalok, setVisKakiBalok] = useState(true);

  // Floating Toolbar 2: Expand / Explosion states (matching backend show.blade.php)
  const [expPenyanggaAtas, setExpPenyanggaAtas] = useState(false);
  const [expPenutupAtas, setExpPenutupAtas] = useState(false);
  const [expKakiBalok, setExpKakiBalok] = useState(false);
  const [expPenyanggaBawah, setExpPenyanggaBawah] = useState(false);
  const [expPenutupBawah, setExpPenutupBawah] = useState(false);

  // View & Display Toggles
  const [currentView, setCurrentView] = useState('iso');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Sync assemblyStep prop to visibilities and expand states
  useEffect(() => {
    if (assemblyStep === 0) {
      // Hasil Akhir Rakitan Utuh: all visible, no expansion
      setVisPenyanggaAtas(true);
      setVisPenutupAtas(true);
      setVisPenyanggaBawah(true);
      setVisPenutupBawah(true);
      setVisKakiBalok(true);
      setExpPenyanggaAtas(false);
      setExpPenutupAtas(false);
      setExpKakiBalok(false);
      setExpPenyanggaBawah(false);
      setExpPenutupBawah(false);
    } else if (assemblyStep === 1) {
      // Step 1: Kaki Balok & Pyg Bawah only
      setVisPenyanggaAtas(false);
      setVisPenutupAtas(false);
      setVisPenyanggaBawah(true);
      setVisPenutupBawah(false);
      setVisKakiBalok(true);
      setExpPenyanggaAtas(false);
      setExpPenutupAtas(false);
      setExpKakiBalok(false);
      setExpPenyanggaBawah(false);
      setExpPenutupBawah(false);
    } else if (assemblyStep === 2) {
      // Step 2: + Penutup Bawah
      setVisPenyanggaAtas(false);
      setVisPenutupAtas(false);
      setVisPenyanggaBawah(true);
      setVisPenutupBawah(true);
      setVisKakiBalok(true);
      setExpPenyanggaAtas(false);
      setExpPenutupAtas(false);
      setExpKakiBalok(false);
      setExpPenyanggaBawah(false);
      setExpPenutupBawah(false);
    } else if (assemblyStep === 3) {
      // Step 3: + Pntp Depan Belakang
      setVisPenyanggaAtas(false);
      setVisPenutupAtas(false);
      setVisPenyanggaBawah(true);
      setVisPenutupBawah(true);
      setVisKakiBalok(true);
    } else if (assemblyStep === 4) {
      // Step 4: + Pntp Kanan Kiri
      setVisPenyanggaAtas(false);
      setVisPenutupAtas(false);
      setVisPenyanggaBawah(true);
      setVisPenutupBawah(true);
      setVisKakiBalok(true);
    } else if (assemblyStep === 5) {
      // Step 5: + Penyangga Atas
      setVisPenyanggaAtas(true);
      setVisPenutupAtas(false);
      setVisPenyanggaBawah(true);
      setVisPenutupBawah(true);
      setVisKakiBalok(true);
    } else if (assemblyStep === 6) {
      // Step 6: + Penutup Atas
      setVisPenyanggaAtas(true);
      setVisPenutupAtas(true);
      setVisPenyanggaBawah(true);
      setVisPenutupBawah(true);
      setVisKakiBalok(true);
    } else if (assemblyStep === 9) {
      // Hasil Posisi Semua Terexpand: all visible and expanded!
      setVisPenyanggaAtas(true);
      setVisPenutupAtas(true);
      setVisPenyanggaBawah(true);
      setVisPenutupBawah(true);
      setVisKakiBalok(true);
      setExpPenyanggaAtas(true);
      setExpPenutupAtas(true);
      setExpKakiBalok(true);
      setExpPenyanggaBawah(true);
      setExpPenutupBawah(true);
    }
  }, [assemblyStep]);

  // Setup Three.js Scene matching show.blade.php
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 550;

    // Scene & Sky / CAD Background matching show.blade.php (0xf3f7fc)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f7fc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // Lighting matching show.blade.php
    scene.add(new THREE.HemisphereLight(0xffffff, 0x637184, 1.25));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(6, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbfd8ff, 0.55);
    fillLight.position.set(-7, 4, -5);
    scene.add(fillLight);

    // Ground plane matching show.blade.php (ShadowMaterial opacity 0.15)
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.15 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper matching show.blade.php
    const grid = new THREE.GridHelper(30, 30, 0xaab7c8, 0xd5dde8);
    grid.position.y = 0.002;
    grid.material.transparent = true;
    grid.material.opacity = 0.45;
    scene.add(grid);
    gridRef.current = grid;

    const modelGroup = new THREE.Group();
    const dimensionGroup = new THREE.Group();
    scene.add(modelGroup);
    scene.add(dimensionGroup);
    modelGroupRef.current = modelGroup;
    dimensionGroupRef.current = dimensionGroup;

    // Procedural Materials matching show.blade.php
    const woodTexture = makeWoodTexture();
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: woodTexture,
      roughness: 0.69,
      metalness: 0.0
    });
    // Darker warm wood brown tint for supports / vertical posts & crossbeams
    const supportMaterial = frameMaterial.clone();
    supportMaterial.color = new THREE.Color('#94714f');

    // Warm amber wood for cover boards
    const coverMaterial = frameMaterial.clone();
    coverMaterial.color = new THREE.Color('#d59a59');
    coverMaterial.roughness = 0.76;

    // Light natural timber for skids / kaki balok
    const skidMaterial = frameMaterial.clone();
    skidMaterial.color = new THREE.Color('#e0ba87');
    skidMaterial.roughness = 0.65;

    // Fastener / Nails matching show.blade.php
    const nailMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      metalness: 0.85,
      roughness: 0.2
    });

    materialsRef.current = {
      frameMaterial,
      supportMaterial,
      coverMaterial,
      skidMaterial,
      nailMaterial,
      woodTexture
    };

    function animate() {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!mount || !renderer || !camera) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Camera presets matching setCameraView() from show.blade.php
  const setCameraView = (view) => {
    setCurrentView(view);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const L = (dimensions.panjang || 1000) / 1000;
    const W = (dimensions.lebar || 800) / 1000;
    const H = (dimensions.tinggi || 800) / 1000;
    const maxDim = Math.max(L, W, H);
    const d = maxDim * 2.2 + 0.9;
    const centerY = H / 2;

    let targetPos;
    if (view === 'front') targetPos = new THREE.Vector3(0, centerY, d);
    else if (view === 'right') targetPos = new THREE.Vector3(d, centerY, 0);
    else if (view === 'top') targetPos = new THREE.Vector3(0, d, 0.001);
    else targetPos = new THREE.Vector3(d * 0.86, d * 0.66, d * 0.86);

    controls.target.set(0, centerY, 0);
    camera.position.copy(targetPos);
    camera.near = 0.01;
    camera.far = Math.max(100, d * 20);
    camera.updateProjectionMatrix();
    controls.update();
  };

  // Re-build 3D Crate with 100% fidelity to show.blade.php logic!
  useEffect(() => {
    const scene = sceneRef.current;
    const modelGroup = modelGroupRef.current;
    const dimensionGroup = dimensionGroupRef.current;
    const materials = materialsRef.current;
    if (!scene || !modelGroup || !dimensionGroup || !materials) return;

    // Clear previous objects
    while (modelGroup.children.length) {
      const child = modelGroup.children.pop();
      if (child.geometry) child.geometry.dispose();
    }
    while (dimensionGroup.children.length) {
      const child = dimensionGroup.children.pop();
      if (child.geometry) child.geometry.dispose();
      if (child.material && child.material.map) child.material.map.dispose();
    }

    const P = parseFloat(dimensions.panjang) || 1000;
    const L_w = parseFloat(dimensions.lebar) || 800;
    const T = parseFloat(dimensions.tinggi) || 800;

    const l_m = P / 1000; // length in meters (X)
    const w_m = L_w / 1000; // width in meters (Z)
    const h_m = T / 1000; // height in meters (Y)
    const maxDim = Math.max(l_m, w_m, h_m);

    const { frameMaterial, supportMaterial, coverMaterial, skidMaterial, nailMaterial, woodTexture } = materials;
    if (woodTexture) {
      woodTexture.repeat.set(Math.max(1, l_m * 2.2), 1);
      woodTexture.needsUpdate = true;
    }

    // Default timber dimensions (matching engineering standards in show.blade.php)
    const balok_t = (timberConfig.skidWidth || 80) / 1000; // skid thickness (0.08m)
    const balok_w = (timberConfig.skidHeight || 80) / 1000; // skid height (0.08m)
    const skidQty = timberConfig.skidCount || 3;

    const pDimBawah = { t: 0.06, w: 0.06, ht: 0.03, hw: 0.03 }; // Penyangga bawah crossbeam
    const pDimPost = { t: 0.05, w: 0.07, ht: 0.025, hw: 0.035 }; // Penyangga vertikal side posts
    const pDimTop = { t: 0.05, w: 0.07, ht: 0.025, hw: 0.035 }; // Penyangga atas crossbeams

    const t_penutup_b = 0.02; // 20mm tebal papan penutup bawah
    const w_penutup_b = 0.14; // 140mm lebar papan penutup bawah
    const t_penutup_s = 0.02; // 20mm tebal papan penutup samping
    const w_penutup_s = 0.14; // 140mm lebar papan penutup samping
    const t_penutup_a = 0.02; // 20mm tebal papan penutup atas
    const w_penutup_a = 0.14; // 140mm lebar papan penutup atas

    // Explosion offsets matching show.blade.php (0.2m = 200mm)
    const offExpKakiBalok = expKakiBalok ? 0.2 : 0;
    const offExpPenyanggaBawah = expPenyanggaBawah ? 0.2 : 0;
    const offExpPenutupBawah = expPenutupBawah ? 0.2 : 0;
    const offExpPenyanggaAtas = expPenyanggaAtas ? 0.2 : 0;
    const offExpPenutupAtas = expPenutupAtas ? 0.2 : 0;

    // Side offsets during step 9 (full explosion)
    const offExpSides = assemblyStep === 9 ? 0.2 : 0;

    const cuttingList = [];
    let totalNailsCount = 0;

    // Reusable nail geometries
    const nailPinGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.03, 6);
    const nailHeadGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.003, 8);

    const addNail = (pos, normalAxis = 'y') => {
      totalNailsCount++;
      const nailGroup = new THREE.Group();
      const pin = new THREE.Mesh(nailPinGeo, nailMaterial);
      const head = new THREE.Mesh(nailHeadGeo, nailMaterial);
      head.position.y = 0.015;
      nailGroup.add(pin, head);

      if (normalAxis === 'y') {
        nailGroup.rotation.x = 0;
      } else if (normalAxis === '-y') {
        nailGroup.rotation.x = Math.PI;
      } else if (normalAxis === 'z') {
        nailGroup.rotation.x = Math.PI / 2;
      } else if (normalAxis === '-z') {
        nailGroup.rotation.x = -Math.PI / 2;
      } else if (normalAxis === 'x') {
        nailGroup.rotation.z = -Math.PI / 2;
      } else if (normalAxis === '-x') {
        nailGroup.rotation.z = Math.PI / 2;
      }

      nailGroup.position.copy(pos);
      modelGroup.add(nailGroup);
    };

    const addBeam = (size, pos, mat, name, category, offsetExp = new THREE.Vector3()) => {
      const geom = new THREE.BoxGeometry(size.x, size.y, size.z);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos).add(offsetExp);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = name;
      modelGroup.add(mesh);

      cuttingList.push({
        name,
        category,
        lengthMm: Math.round(Math.max(size.x, size.y, size.z) * 1000),
        widthMm: Math.round(size.x * 1000),
        thickMm: Math.round(size.y * 1000),
        volumeM3: size.x * size.y * size.z
      });
      return mesh;
    };

    // Calculate Y references (matching show.blade.php)
    const maxBawahThk = Math.max(t_penutup_b, pDimBawah.t);
    const floorY = 0; // Baseline floor is at Y = 0
    const topKakiBalokY = floorY;
    const yKakiBalok = topKakiBalokY - balok_w / 2 - offExpKakiBalok - (offExpPenyanggaBawah || offExpPenutupBawah ? 0.05 : 0);

    // ==========================================
    // 1. KAKI BALOK (SKIDS / PALLET RUNNERS)
    // ==========================================
    if (isPalletEnabled && visKakiBalok) {
      const spanZ = w_m;
      const lengthX = l_m;
      let positionsZ = [];

      if (skidQty === 1) {
        positionsZ = [0];
      } else {
        const startZ = -spanZ / 2 + balok_t / 2;
        const endZ = spanZ / 2 - balok_t / 2;
        for (let i = 0; i < skidQty; i++) {
          positionsZ.push(startZ + (endZ - startZ) * (i / (skidQty - 1)));
        }
      }

      positionsZ.forEach((zPos, idx) => {
        addBeam(
          new THREE.Vector3(lengthX, balok_w, balok_t),
          new THREE.Vector3(0, yKakiBalok, zPos),
          skidMaterial,
          `Kaki Balok #${idx + 1}`,
          'Kaki Balok'
        );
      });
    }

    // ==========================================
    // 2. PENYANGGA BAWAH (BOTTOM CROSSBEAM)
    // ==========================================
    if (visPenyanggaBawah) {
      const yPenyBawah = floorY + pDimBawah.t / 2 - offExpPenyanggaBawah;
      const beamMesh = addBeam(
        new THREE.Vector3(pDimBawah.w, pDimBawah.t, w_m),
        new THREE.Vector3(0, yPenyBawah, 0),
        supportMaterial,
        'Penyangga Bawah Melintang',
        'Penyangga Bawah'
      );

      // Add nails at each skid intersection
      if (visKakiBalok) {
        [-w_m / 2 + balok_t / 2, 0, w_m / 2 - balok_t / 2].forEach((nz) => {
          addNail(new THREE.Vector3(0, yPenyBawah + pDimBawah.t / 2, nz), 'y');
        });
      }
    }

    // ==========================================
    // 3. PENUTUP BAWAH (FLOOR BOARDS)
    // ==========================================
    if (visPenutupBawah) {
      const gapBawahM = (clearance.celahBawah || 15) / 1000;
      const numFloorBoards = Math.max(2, Math.floor((w_m + gapBawahM) / (w_penutup_b + gapBawahM)));
      const actFloorW = Math.min(w_penutup_b, (w_m - (numFloorBoards - 1) * gapBawahM) / numFloorBoards);
      const yPenutupB = floorY + t_penutup_b / 2 + offExpPenutupBawah;

      for (let i = 0; i < numFloorBoards; i++) {
        const z = -w_m / 2 + actFloorW / 2 + i * (actFloorW + gapBawahM);
        addBeam(
          new THREE.Vector3(l_m, t_penutup_b, actFloorW),
          new THREE.Vector3(0, yPenutupB, z),
          coverMaterial,
          `Papan Penutup Bawah #${i + 1}`,
          'Penutup Bawah'
        );

        // Nails on floor boards driving into skids
        [-l_m / 2 + 0.05, 0, l_m / 2 - 0.05].forEach((nx) => {
          addNail(new THREE.Vector3(nx, yPenutupB + t_penutup_b / 2, z), 'y');
        });
      }
    }

    // ==========================================
    // 4. PENUTUP & PENYANGGA SISI (DEPAN & BELAKANG)
    // Sesuai show.blade.php: Tiang vertikal + Papan horizontal
    // ==========================================
    const showFrontBack = assemblyStep === 0 || assemblyStep >= 3;
    if (showFrontBack) {
      const postsCount = timberConfig.postsPerSide || 3;
      const gapSideM = 15 / 1000;
      const numSideBoards = Math.max(1, Math.floor((h_m + gapSideM) / (w_penutup_s + gapSideM)));
      const actSideW = Math.min(w_penutup_s, (h_m - (numSideBoards - 1) * gapSideM) / numSideBoards);

      ['front', 'back'].forEach((side) => {
        const isFront = side === 'front';
        const zSign = isFront ? 1 : -1;
        const curOffZ = isFront ? offExpSides : -offExpSides;
        const zPost = zSign * (w_m / 2 - pDimPost.t / 2);
        const zBoard = zSign * (w_m / 2 + t_penutup_s / 2);

        // Vertical Posts
        for (let i = 0; i < postsCount; i++) {
          const x = -l_m / 2 + pDimPost.w / 2 + (i / Math.max(1, postsCount - 1)) * (l_m - pDimPost.w);
          addBeam(
            new THREE.Vector3(pDimPost.w, h_m, pDimPost.t),
            new THREE.Vector3(x, floorY + h_m / 2, zPost),
            supportMaterial,
            `Tiang ${isFront ? 'Depan' : 'Belakang'} #${i + 1}`,
            'Penyangga Samping',
            new THREE.Vector3(0, 0, curOffZ)
          );
        }

        // Horizontal Boards
        for (let j = 0; j < numSideBoards; j++) {
          const y = floorY + actSideW / 2 + j * (actSideW + gapSideM);
          addBeam(
            new THREE.Vector3(l_m, actSideW, t_penutup_s),
            new THREE.Vector3(0, y, zBoard),
            coverMaterial,
            `Papan ${isFront ? 'Depan' : 'Belakang'} #${j + 1}`,
            'Penutup Samping',
            new THREE.Vector3(0, 0, curOffZ)
          );

          // Nails at intersections of boards with vertical posts
          for (let i = 0; i < postsCount; i++) {
            const x = -l_m / 2 + pDimPost.w / 2 + (i / Math.max(1, postsCount - 1)) * (l_m - pDimPost.w);
            addNail(
              new THREE.Vector3(x, y, zBoard + zSign * (t_penutup_s / 2) + curOffZ),
              isFront ? 'z' : '-z'
            );
          }
        }
      });
    }

    // ==========================================
    // 5. PENUTUP & PENYANGGA SISI (KANAN & KIRI)
    // ==========================================
    const showLeftRight = assemblyStep === 0 || assemblyStep >= 4;
    if (showLeftRight) {
      const postsCount = 2; // End posts on left and right
      const gapSideM = 15 / 1000;
      const numSideBoards = Math.max(1, Math.floor((h_m + gapSideM) / (w_penutup_s + gapSideM)));
      const actSideW = Math.min(w_penutup_s, (h_m - (numSideBoards - 1) * gapSideM) / numSideBoards);

      ['right', 'left'].forEach((side) => {
        const isRight = side === 'right';
        const xSign = isRight ? 1 : -1;
        const curOffX = isRight ? offExpSides : -offExpSides;
        const xPost = xSign * (l_m / 2 - pDimPost.t / 2);
        const xBoard = xSign * (l_m / 2 + t_penutup_s / 2);

        // Vertical Posts
        for (let i = 0; i < postsCount; i++) {
          const z = -w_m / 2 + pDimPost.w / 2 + (i / Math.max(1, postsCount - 1)) * (w_m - pDimPost.w);
          addBeam(
            new THREE.Vector3(pDimPost.t, h_m, pDimPost.w),
            new THREE.Vector3(xPost, floorY + h_m / 2, z),
            supportMaterial,
            `Tiang ${isRight ? 'Kanan' : 'Kiri'} #${i + 1}`,
            'Penyangga Samping',
            new THREE.Vector3(curOffX, 0, 0)
          );
        }

        // Horizontal Boards
        for (let j = 0; j < numSideBoards; j++) {
          const y = floorY + actSideW / 2 + j * (actSideW + gapSideM);
          addBeam(
            new THREE.Vector3(t_penutup_s, actSideW, w_m),
            new THREE.Vector3(xBoard, y, 0),
            coverMaterial,
            `Papan ${isRight ? 'Kanan' : 'Kiri'} #${j + 1}`,
            'Penutup Samping',
            new THREE.Vector3(curOffX, 0, 0)
          );

          // Nails at intersections
          for (let i = 0; i < postsCount; i++) {
            const z = -w_m / 2 + pDimPost.w / 2 + (i / Math.max(1, postsCount - 1)) * (w_m - pDimPost.w);
            addNail(
              new THREE.Vector3(xBoard + xSign * (t_penutup_s / 2) + curOffX, y, z),
              isRight ? 'x' : '-x'
            );
          }
        }
      });
    }

    // ==========================================
    // 6. PENYANGGA ATAS (TOP CROSSBEAMS)
    // Sesuai show.blade.php: balok penyangga melintang di atas
    // ==========================================
    const showTopBeams = (assemblyStep === 0 || assemblyStep >= 5) && visPenyanggaAtas;
    const topBeamsCount = 3;
    const yTopPeny = floorY + h_m - pDimTop.t / 2 + offExpPenyanggaAtas;

    if (showTopBeams) {
      for (let i = 0; i < topBeamsCount; i++) {
        const x = -l_m / 2 + pDimTop.w / 2 + (i / Math.max(1, topBeamsCount - 1)) * (l_m - pDimTop.w);
        addBeam(
          new THREE.Vector3(pDimTop.w, pDimTop.t, w_m),
          new THREE.Vector3(x, yTopPeny, 0),
          supportMaterial,
          `Balok Penyangga Atas #${i + 1}`,
          'Penyangga Atas'
        );

        // Nails
        [-w_m / 2 + 0.05, 0, w_m / 2 - 0.05].forEach((nz) => {
          addNail(new THREE.Vector3(x, yTopPeny + pDimTop.t / 2, nz), 'y');
        });
      }
    }

    // ==========================================
    // 7. PENUTUP ATAS (TOP COVER BOARDS)
    // ==========================================
    const showTopCovers = (assemblyStep === 0 || assemblyStep >= 6) && visPenutupAtas;
    if (showTopCovers) {
      const gapAtasM = (clearance.celahAtas || 15) / 1000;
      const numTopBoards = Math.max(2, Math.floor((w_m + gapAtasM) / (w_penutup_a + gapAtasM)));
      const actTopW = Math.min(w_penutup_a, (w_m - (numTopBoards - 1) * gapAtasM) / numTopBoards);
      const yTopPenutup = floorY + h_m + t_penutup_a / 2 + offExpPenutupAtas + (offExpPenyanggaAtas ? 0.05 : 0);

      for (let i = 0; i < numTopBoards; i++) {
        const z = -w_m / 2 + actTopW / 2 + i * (actTopW + gapAtasM);
        addBeam(
          new THREE.Vector3(l_m, t_penutup_a, actTopW),
          new THREE.Vector3(0, yTopPenutup, z),
          coverMaterial,
          `Papan Penutup Atas #${i + 1}`,
          'Penutup Atas'
        );

        // Nails driving down through top board into top beams
        for (let k = 0; k < topBeamsCount; k++) {
          const x = -l_m / 2 + pDimTop.w / 2 + (k / Math.max(1, topBeamsCount - 1)) * (l_m - pDimTop.w);
          addNail(new THREE.Vector3(x, yTopPenutup + t_penutup_a / 2, z), 'y');
        }
      }
    }

    // ==========================================
    // DIMENSIONS (Matching addDimensions in show.blade.php)
    // ==========================================
    if (showDimensions && assemblyStep === 0) {
      const addDimLine = (start, end, label, labelOffset) => {
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x1f67c7,
          transparent: true,
          opacity: 0.88,
          depthTest: false
        });
        const points = [start.clone(), end.clone()];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geom, lineMat);
        line.renderOrder = 990;
        dimensionGroup.add(line);

        const dir = end.clone().sub(start).normalize();
        const len = start.distanceTo(end);
        const tickSize = Math.max(maxDim * 0.02, len * 0.022);
        const upCandidate = Math.abs(dir.y) < 0.8 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const tickDir = new THREE.Vector3().crossVectors(dir, upCandidate).normalize().multiplyScalar(tickSize);

        [start, end].forEach((p) => {
          const tGeo = new THREE.BufferGeometry().setFromPoints([
            p.clone().sub(tickDir),
            p.clone().add(tickDir)
          ]);
          const tick = new THREE.Line(tGeo, lineMat.clone());
          tick.renderOrder = 990;
          dimensionGroup.add(tick);
        });

        const sprite = makeTextSprite(label, maxDim);
        sprite.position.copy(start.clone().add(end).multiplyScalar(0.5).add(labelOffset));
        dimensionGroup.add(sprite);
      };

      const gap = maxDim * 0.08;
      const offD = 0.08 * 1.65 + gap;
      const labelGap = maxDim * 0.075;

      addDimLine(
        new THREE.Vector3(-l_m / 2, 0, w_m / 2 + offD),
        new THREE.Vector3(l_m / 2, 0, w_m / 2 + offD),
        `Panjang ${Math.round(P)} mm`,
        new THREE.Vector3(0, labelGap, 0)
      );
      addDimLine(
        new THREE.Vector3(l_m / 2 + offD, 0, -w_m / 2),
        new THREE.Vector3(l_m / 2 + offD, 0, w_m / 2),
        `Lebar ${Math.round(L_w)} mm`,
        new THREE.Vector3(0, labelGap, 0)
      );
      addDimLine(
        new THREE.Vector3(l_m / 2 + offD, 0, -w_m / 2),
        new THREE.Vector3(l_m / 2 + offD, h_m, -w_m / 2),
        `Tinggi ${Math.round(T)} mm`,
        new THREE.Vector3(labelGap, 0, 0)
      );

      dimensionGroup.visible = true;
    } else {
      dimensionGroup.visible = false;
    }

    // ==========================================
    // REKAP ENGINEERING CALCULATION
    // ==========================================
    const totalVolumeM3 = cuttingList.reduce((acc, item) => acc + item.volumeM3, 0);
    const totalLengthM = cuttingList.reduce((acc, item) => acc + item.lengthMm / 1000, 0);
    const areaKerjaM2 = 2 * (l_m * w_m + l_m * h_m + w_m * h_m);

    const groupedParts = {};
    cuttingList.forEach((item) => {
      const key = `${item.category}_${item.thickMm}x${item.widthMm}x${item.lengthMm}`;
      if (!groupedParts[key]) {
        groupedParts[key] = {
          name: item.name.replace(/#\d+/, '').trim(),
          category: item.category,
          thickMm: item.thickMm,
          widthMm: item.widthMm,
          lengthMm: item.lengthMm,
          qty: 0,
          totalLengthM: 0,
          totalVolumeM3: 0
        };
      }
      groupedParts[key].qty += 1;
      groupedParts[key].totalLengthM += item.lengthMm / 1000;
      groupedParts[key].totalVolumeM3 += item.volumeM3;
    });

    const boxOuterVolumeM3 = l_m * w_m * h_m;

    if (onCalculateSummary) {
      onCalculateSummary({
        cuttingList,
        groupedParts: Object.values(groupedParts),
        totalPieces: cuttingList.length,
        totalLengthM,
        totalVolumeM3,
        boxOuterVolumeM3,
        areaKerjaM2,
        totalNailsCount: totalNailsCount || cuttingList.length * 4,
        estimatedNailsKg: ((totalNailsCount || cuttingList.length * 4) * 0.025).toFixed(2),
        estimatedLaborCost: Math.round(totalVolumeM3 * 450000)
      });
    }
  }, [
    dimensions,
    clearance,
    timberConfig,
    assemblyStep,
    visPenyanggaAtas,
    visPenutupAtas,
    visPenyanggaBawah,
    visPenutupBawah,
    visKakiBalok,
    expPenyanggaAtas,
    expPenutupAtas,
    expKakiBalok,
    expPenyanggaBawah,
    expPenutupBawah,
    showDimensions,
    isPalletEnabled
  ]);

  useEffect(() => {
    if (gridRef.current) gridRef.current.visible = showGrid;
  }, [showGrid]);

  const handleScreenshot = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    renderer.render(scene, camera);
    const link = document.createElement('a');
    link.download = `packaging-kayu-${dimensions.panjang}x${dimensions.lebar}x${dimensions.tinggi}-${Date.now()}.png`;
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
  };

  useImperativeHandle(ref, () => ({
    setCameraView,
    handleScreenshot
  }));

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm select-none bg-[#f8fafc]">
      <div ref={mountRef} className={`w-full ${className} cursor-grab active:cursor-grabbing`} />

      {/* LINE 1: FLOATING CAD-STYLE GLASSMORHPIC TOOLBAR (VISIBILITAS & VIEW PRESETS) */}
      <div
        className="absolute top-3 left-3 right-3 z-10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-1.5 px-3 rounded-xl border border-blue-100 shadow-sm backdrop-blur-md"
        style={{ background: 'rgba(240, 245, 255, 0.88)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* GRUP ATAS */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-200 shadow-xs"
            style={{ background: 'rgba(230, 245, 255, 0.85)' }}
          >
            <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
              GRUP ATAS
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVisPenyanggaAtas(!visPenyanggaAtas)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                  visPenyanggaAtas
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Penyangga
              </button>
              <button
                type="button"
                onClick={() => setVisPenutupAtas(!visPenutupAtas)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                  visPenutupAtas
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Penutup
              </button>
            </div>
          </div>

          {/* GRUP BAWAH */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 shadow-xs"
            style={{ background: 'rgba(235, 250, 235, 0.85)' }}
          >
            <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
              GRUP BAWAH
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVisPenyanggaBawah(!visPenyanggaBawah)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                  visPenyanggaBawah
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Penyangga
              </button>
              <button
                type="button"
                onClick={() => setVisPenutupBawah(!visPenutupBawah)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                  visPenutupBawah
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Penutup
              </button>
              <button
                type="button"
                onClick={() => setVisKakiBalok(!visKakiBalok)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                  visKakiBalok
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Kaki Balok
              </button>
            </div>
          </div>
        </div>

        {/* CAMERA PRESETS & SCREENSHOT */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200 shadow-xs"
          style={{ background: 'rgba(255, 255, 255, 0.7)' }}
        >
          {['iso', 'front', 'right', 'top'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setCameraView(v)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                currentView === v
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              {v === 'iso' ? 'Iso' : v === 'front' ? 'Depan' : v === 'right' ? 'Kanan' : 'Atas'}
            </button>
          ))}
          <button
            type="button"
            title="Download Screenshot (.png)"
            onClick={handleScreenshot}
            className="p-1 rounded bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:text-emerald-700 transition-all flex items-center justify-center"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* LINE 2: FLOATING CAD-STYLE GLASSMORHPIC TOOLBAR (EXPAND ANIMATION / EXPLODED) */}
      <div
        className="absolute top-16 left-3 right-3 z-10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 py-1.5 px-3 rounded-xl border border-slate-200/80 shadow-sm backdrop-blur-md"
        style={{ background: 'rgba(255, 255, 255, 0.75)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* EXPAND ATAS */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-200 shadow-xs"
            style={{ background: 'rgba(255, 245, 235, 0.85)' }}
          >
            <span className="text-[11px] font-black uppercase text-amber-700 tracking-wider">
              EXPAND ATAS
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpPenyanggaAtas(!expPenyanggaAtas)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                  expPenyanggaAtas
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Penyangga
              </button>
              <button
                type="button"
                onClick={() => setExpPenutupAtas(!expPenutupAtas)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                  expPenutupAtas
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Penutup
              </button>
            </div>
          </div>

          {/* EXPAND BAWAH */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-200 shadow-xs"
            style={{ background: 'rgba(245, 235, 250, 0.85)' }}
          >
            <span className="text-[11px] font-black uppercase text-purple-700 tracking-wider">
              EXPAND BAWAH
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpKakiBalok(!expKakiBalok)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                  expKakiBalok
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Kaki Balok
              </button>
              <button
                type="button"
                onClick={() => setExpPenyanggaBawah(!expPenyanggaBawah)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                  expPenyanggaBawah
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Penyangga
              </button>
              <button
                type="button"
                onClick={() => setExpPenutupBawah(!expPenutupBawah)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all border ${
                  expPenutupBawah
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Penutup
              </button>
            </div>
          </div>
        </div>

        {/* TOGGLES: DIMENSI & GRID */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200 shadow-xs"
          style={{ background: 'rgba(255, 255, 255, 0.7)' }}
        >
          <button
            type="button"
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all border flex items-center gap-1 ${
              showDimensions
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Ruler className="w-3 h-3" />
            <span>Dimensi</span>
          </button>
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all border flex items-center gap-1 ${
              showGrid
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* BOTTOM LEGEND & STATUS (MATCHING show.blade.php) */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs pointer-events-none z-10 px-1">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-slate-600 font-medium pointer-events-auto">
          <strong className="text-slate-800">Kontrol 3D:</strong> klik kiri untuk memutar, scroll untuk zoom, klik kanan untuk menggeser.
        </div>

        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-slate-800 font-mono font-bold flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            Model: {dimensions.panjang} × {dimensions.lebar} × {dimensions.tinggi} mm
          </span>
        </div>
      </div>
    </div>
  );
});

export default Packing3DViewer;
