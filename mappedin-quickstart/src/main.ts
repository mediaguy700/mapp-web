import { getMapData, show3dMap } from '@mappedin/mappedin-js';

// See Demo API key Terms and Conditions
// https://developer.mappedin.com/docs/demo-keys-and-maps
const options = {
  key: 'mik_yeBk0Vf0nNJtpesfu560e07e5',
  secret: 'mis_2g9ST8ZcSFb5R9fPnsvYhrX3RyRwPtDGbMGweCYKEq385431022',
  mapId: '660c0c3aae0596d87766f2da',
};

async function init() {
  const mapData = await getMapData(options);
  await show3dMap(
    document.getElementById('mappedin-map') as HTMLDivElement,
    mapData
  );
}

init();
