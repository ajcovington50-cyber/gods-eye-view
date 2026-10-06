import * as Cesium from 'cesium';

/** Create the standard globe viewer in caller-owned, visible containers. */
export function createApplicationViewer({ container, creditContainer }) {
  if (!container || !creditContainer)
    throw new TypeError('Viewer and credit containers are required');
  const viewer = new Cesium.Viewer(container, {
    timeline: false,
    animation: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    vrButton: false,
    selectionIndicator: false,
    infoBox: false,
    baseLayer: false,
    creditContainer,
    msaaSamples: 4,
    contextOptions: { webgl: { preserveDrawingBuffer: true } },
  });
  try {
    viewer.targetFrameRate = 60;
    viewer.scene.globe.show = false;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.skyAtmosphere.atmosphereLightIntensity = 18;
    viewer.scene.skyAtmosphere.saturationShift = -0.12;
    viewer.scene.skyAtmosphere.brightnessShift = -0.08;
    // Stock Cesium's wheel/drag momentum decays to a stop within ~0.3-0.5s
    // (inertia constant 0.8-0.9 means exp(-tau*t) with tau=(1-k)*25). That
    // reads as an abrupt stop next to Google Earth's longer glide. These
    // values roughly double-to-triple the coast duration without making the
    // globe feel uncontrollable or slow to settle on a precise target.
    const camera = viewer.scene.screenSpaceCameraController;
    camera.inertiaZoom = 0.92;
    camera.inertiaTranslate = 0.94;
    camera.inertiaSpin = 0.94;
    return viewer;
  } catch (error) {
    viewer.destroy();
    throw error;
  }
}
