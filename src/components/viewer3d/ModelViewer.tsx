import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { StandardViews, CameraViewPreset } from './StandardViews';
import { RenderingControls, RenderMode } from './RenderingControls';
import { ModelInformation, ModelStats } from './ModelInformation';
import { ModelUploader } from './ModelUploader';
import { AlertCircle } from 'lucide-react';

export const ModelViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const wireframeGroupRef = useRef<THREE.Group | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('solid');
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [activeView, setActiveView] = useState<CameraViewPreset | null>('ISO');
  const [defaultDistance, setDefaultDistance] = useState(250);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    camera.position.set(160, 140, 200);
    cameraRef.current = camera;

    // 3. Renderer
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(container.clientWidth || 800, container.clientHeight || 500);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 4. OrbitControls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;
    } catch (err) {
      setLoadError('WebGL 3D rendering context unavailable in this environment.');
      return;
    }

    // 5. Lighting (Engineering studio lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(150, 200, 150);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00e5ff, 0.4);
    dirLight2.position.set(-150, -100, -150);
    scene.add(dirLight2);

    // 6. Grid & Axes Helpers
    const gridHelper = new THREE.GridHelper(300, 30, 0x00e5ff, 0x1f293d);
    gridHelper.position.y = -10;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const axesHelper = new THREE.AxesHelper(80);
    (axesHelper.material as THREE.Material).depthTest = false;
    axesHelper.renderOrder = 1;
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // 7. Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Load initial bundled apparatus model
    loadDefaultApparatus();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Compute mesh statistics from loaded group
  const calculateModelStatistics = (group: THREE.Group, filename: string): ModelStats => {
    let vertexCount = 0;
    let triangleCount = 0;
    let faceCount = 0;

    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geom = child.geometry;
        if (geom.index) {
          triangleCount += geom.index.count / 3;
          faceCount += geom.index.count / 3;
        } else if (geom.attributes.position) {
          triangleCount += geom.attributes.position.count / 3;
          faceCount += geom.attributes.position.count / 3;
        }
        if (geom.attributes.position) {
          vertexCount += geom.attributes.position.count;
        }
      }
    });

    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    box.getSize(size);

    return {
      filename,
      vertexCount,
      faceCount,
      triangleCount,
      dimensions: { x: size.x, y: size.y, z: size.z },
    };
  };

  // Center model and fit camera to bounding box
  const fitModelToView = useCallback((group: THREE.Group) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Center geometry to origin
    group.position.x -= center.x;
    group.position.y -= center.y;
    group.position.z -= center.z;

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.8;
    cameraDistance = Math.max(cameraDistance, 100);
    setDefaultDistance(cameraDistance);

    cameraRef.current.position.set(cameraDistance * 0.7, cameraDistance * 0.6, cameraDistance * 0.8);
    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, []);

  // Apply rendering modes (solid, wireframe, solid-wire)
  const applyRenderMode = useCallback((mode: RenderMode) => {
    const group = currentModelGroupRef.current;
    const scene = sceneRef.current;
    if (!group || !scene) return;

    // Remove previous wireframe overlay if existing
    if (wireframeGroupRef.current) {
      scene.remove(wireframeGroupRef.current);
      wireframeGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      wireframeGroupRef.current = null;
    }

    if (mode === 'solid') {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.visible = true;
          if (child.material) {
            child.material.wireframe = false;
          }
        }
      });
    } else if (mode === 'wireframe') {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.visible = true;
          if (child.material) {
            child.material.wireframe = true;
          }
        }
      });
    } else if (mode === 'solid-wire') {
      // Solid base + wireframe overlay
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.visible = true;
          if (child.material) {
            child.material.wireframe = false;
          }
        }
      });

      const wireGroup = new THREE.Group();
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            wireframe: true,
            transparent: true,
            opacity: 0.6,
          });
          const wireMesh = new THREE.Mesh(child.geometry.clone(), wireMaterial);
          wireMesh.position.copy(child.position);
          wireMesh.rotation.copy(child.rotation);
          wireMesh.scale.copy(child.scale);
          wireGroup.add(wireMesh);
        }
      });
      wireGroup.position.copy(group.position);
      scene.add(wireGroup);
      wireframeGroupRef.current = wireGroup;
    }
  }, []);

  // Display raw OBJ parsed group in scene
  const displayModel = useCallback((objGroup: THREE.Group, filename: string) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Dispose old model if present
    if (currentModelGroupRef.current) {
      scene.remove(currentModelGroupRef.current);
      currentModelGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      currentModelGroupRef.current = null;
    }

    // Default professional scientific material for OBJ elements without MTL
    objGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.material || (child.material as THREE.Material).type === 'MeshBasicMaterial') {
          // Color code components nicely based on name
          const name = child.name.toLowerCase();
          let color = 0x94a3b8; // default slate
          let metalness = 0.2;
          let roughness = 0.4;
          let opacity = 1.0;
          let transparent = false;

          if (name.includes('base') || name.includes('stage')) {
            color = 0x1e293b;
            metalness = 0.6;
          } else if (name.includes('reference') && name.includes('container')) {
            color = 0x64748b; // Glass/acrylic vessel
            opacity = 0.6;
            transparent = true;
          } else if (name.includes('test') && name.includes('container')) {
            color = 0x64748b;
            opacity = 0.6;
            transparent = true;
          } else if (name.includes('jacket') || name.includes('insulation')) {
            color = 0x06b6d4; // Cyan polymer insulation sleeve
            metalness = 0.1;
            roughness = 0.8;
          } else if (name.includes('probe')) {
            color = 0xd97706; // Copper/stainless DS18B20 probe sheath
            metalness = 0.8;
            roughness = 0.2;
          }

          child.material = new THREE.MeshStandardMaterial({
            color,
            metalness,
            roughness,
            opacity,
            transparent,
          });
        }
      }
    });

    scene.add(objGroup);
    currentModelGroupRef.current = objGroup;

    // Center & position
    fitModelToView(objGroup);

    // Compute stats
    const computedStats = calculateModelStatistics(objGroup, filename);
    setStats(computedStats);

    // Apply active render mode
    applyRenderMode(renderMode);
  }, [fitModelToView, applyRenderMode, renderMode]);

  // Load bundled apparatus model from /models/apparatus.obj
  const loadDefaultApparatus = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch('/models/apparatus.obj');
      if (!res.ok) {
        throw new Error(`Failed to load default apparatus (HTTP ${res.status})`);
      }
      const text = await res.text();
      const loader = new OBJLoader();
      const objGroup = loader.parse(text);
      displayModel(objGroup, 'apparatus_dual_rig.obj');
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [displayModel]);

  // Load custom OBJ text uploaded by user
  const handleLoadObjContent = useCallback((content: string, filename: string) => {
    try {
      setLoading(true);
      setLoadError(null);
      const loader = new OBJLoader();
      const objGroup = loader.parse(content);
      displayModel(objGroup, filename);
    } catch (err) {
      setLoadError(`Failed to parse OBJ file: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [displayModel]);

  // Standard Views navigation
  const setStandardView = useCallback((view: CameraViewPreset) => {
    if (!cameraRef.current || !controlsRef.current) return;
    setActiveView(view);
    const d = defaultDistance;

    switch (view) {
      case 'ISO':
        cameraRef.current.position.set(d * 0.7, d * 0.6, d * 0.8);
        break;
      case 'FRONT':
        cameraRef.current.position.set(0, 0, d);
        break;
      case 'BACK':
        cameraRef.current.position.set(0, 0, -d);
        break;
      case 'LEFT':
        cameraRef.current.position.set(-d, 0, 0);
        break;
      case 'RIGHT':
        cameraRef.current.position.set(d, 0, 0);
        break;
      case 'TOP':
        cameraRef.current.position.set(0, d, 0);
        break;
      case 'BOTTOM':
        cameraRef.current.position.set(0, -d, 0);
        break;
    }

    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [defaultDistance]);

  const handleRenderModeChange = (mode: RenderMode) => {
    setRenderMode(mode);
    applyRenderMode(mode);
  };

  const handleToggleGrid = () => {
    const next = !showGrid;
    setShowGrid(next);
    if (gridHelperRef.current) gridHelperRef.current.visible = next;
  };

  const handleToggleAxes = () => {
    const next = !showAxes;
    setShowAxes(next);
    if (axesHelperRef.current) axesHelperRef.current.visible = next;
  };

  const handleFitView = () => {
    if (currentModelGroupRef.current) {
      fitModelToView(currentModelGroupRef.current);
    }
  };

  const handleResetCamera = () => {
    setStandardView('ISO');
  };

  const handleZoom = (factor: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  const handleToggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top action bar: Upload & Views */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModelUploader
          onLoadObjContent={handleLoadObjContent}
          onResetToDefault={loadDefaultApparatus}
          disabled={loading}
        />
        <StandardViews onSelectView={setStandardView} activeView={activeView} />
      </div>

      {/* 3D Canvas Container */}
      <div className="relative flex-1 min-h-[460px] rounded border border-dark-700 bg-dark-950 overflow-hidden shadow-2xl">
        <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Floating Top Toolbar */}
        <div className="absolute top-3 left-3 right-3 pointer-events-none flex flex-wrap items-center justify-between gap-2">
          <div className="pointer-events-auto">
            <RenderingControls
              renderMode={renderMode}
              onRenderModeChange={handleRenderModeChange}
              showGrid={showGrid}
              onToggleGrid={handleToggleGrid}
              showAxes={showAxes}
              onToggleAxes={handleToggleAxes}
              onFitView={handleFitView}
              onResetCamera={handleResetCamera}
              onZoomIn={() => handleZoom(0.85)}
              onZoomOut={() => handleZoom(1.15)}
              onToggleFullscreen={handleToggleFullscreen}
            />
          </div>
        </div>

        {/* Floating Bottom Left: Model Stats */}
        <div className="absolute bottom-3 left-3 pointer-events-auto max-w-sm">
          <ModelInformation stats={stats} loading={loading} />
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center font-mono text-sm text-cyan-400 gap-3">
            <span className="animate-spin h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full" />
            <span>Processing 3D Geometry Mesh...</span>
          </div>
        )}

        {/* Error Overlay */}
        {loadError && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-danger-500/10 border border-danger-500/40 text-danger-300 px-4 py-2.5 rounded font-mono text-xs flex items-center gap-2 max-w-md shadow-xl backdrop-blur">
            <AlertCircle size={16} className="text-danger-400 flex-shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Technical Coordinate Convention Badge */}
        <div className="absolute bottom-3 right-3 pointer-events-none font-mono text-[10px] text-dark-500 bg-dark-900/60 px-2 py-1 rounded border border-dark-800">
          COORDINATES: X-Right (Red) • Y-Up (Green) • Z-Depth (Blue)
        </div>
      </div>
    </div>
  );
};
