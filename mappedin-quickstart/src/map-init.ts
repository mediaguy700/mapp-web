import '@mappedin/mappedin-js/lib/index.css';
import { getMapData, show3dMap } from '@mappedin/mappedin-js';
import { api } from './api.ts';
import { setupQrScanDialog } from './qr-dialog.ts';

const pinSvg = (fill = '#2563eb') => `<svg viewBox="0 0 24 36" fill="${fill}" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"/>
</svg>`;

const readerPin = pinSvg('transparent');
const childPin = pinSvg('#16a34a');

import type { Reader, ReadersResponse, Child, BLEEvent, EventsResponse } from './types.ts';

// Event Space Demo: SDK mapId is 660c0c3aae0596d87766f2da (URL venue id 660439dd7c0c4fe5b4cc478d differs)
const mappedinOptions = {
  key: 'mik_yeBk0Vf0nNJtpesfu560e07e5',
  secret: 'mis_2g9ST8ZcSFb5R9fPnsvYhrX3RyRwPtDGbMGweCYKEq385431022',
  mapId: '660c0c3aae0596d87766f2da',
};

function addReadersToOutdoorMap(
  outdoorMap: NonNullable<ReturnType<Awaited<ReturnType<typeof show3dMap>>['Outdoor']['map']>>,
  readers: Reader[]
) {
  const geojson = {
    type: 'FeatureCollection' as const,
    features: readers.map((r) => ({
      type: 'Feature' as const,
      properties: { name: r.display_name },
      geometry: {
        type: 'Point' as const,
        coordinates: [r.longitude, r.latitude],
      },
    })),
  };

  try {
    const src = outdoorMap.getSource('readers') as { setData?: (d: unknown) => void } | undefined;
    if (src?.setData) {
      src.setData(geojson);
      return;
    }
    if (outdoorMap.getSource('readers')) return;
    outdoorMap.addSource('readers', { type: 'geojson', data: geojson });
    outdoorMap.addLayer({
      id: 'readers-circles',
      type: 'circle',
      source: 'readers',
      paint: {
        'circle-radius': 20,
        'circle-color': 'rgba(37, 99, 235, 0)',
        'circle-stroke-width': 0,
        'circle-stroke-color': 'rgba(255,255,255,0)',
      },
    });
    outdoorMap.addLayer({
      id: 'readers-labels',
      type: 'symbol',
      source: 'readers',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 14,
        'text-offset': [0, 1.5],
      },
      paint: {
        'text-color': '#fff',
        'text-halo-color': 'rgba(37, 99, 235, 0)',
        'text-halo-width': 2,
      },
    });
  } catch (e) {
    console.error('Error adding readers to outdoor map:', e);
  }
}

async function loadChildrenFromEvents(readers: Reader[]): Promise<Child[]> {
  try {
    const res = await api.get<EventsResponse>('events');
    const events = res?.events ?? [];
    const readerMap = new Map(readers.map((r) => [r.reader_name, r]));
    const seen = new Map<string, { last: BLEEvent }>();
    for (const ev of events) {
      const key = `${ev.reader_name}:${ev.name}:${ev.mac}`;
      const existing = seen.get(key);
      if (!existing || new Date(ev.date_time) > new Date(existing.last.date_time)) {
        seen.set(key, { last: ev });
      }
    }
    const byReader = new Map<string, { last: BLEEvent }[]>();
    for (const { last } of seen.values()) {
      const list = byReader.get(last.reader_name) ?? [];
      list.push({ last });
      byReader.set(last.reader_name, list);
    }
    const children: Child[] = [];
    for (const [readerName, list] of byReader) {
      const r = readerMap.get(readerName);
      const baseLat = r?.latitude ?? 0;
      const baseLng = r?.longitude ?? 0;
      list.forEach(({ last }, i) => {
        const offset = 0.00003;
        const angle = (i / Math.max(1, list.length)) * 2 * Math.PI;
        children.push({
          name: last.name,
          reader_name: last.reader_name,
          latitude: baseLat + Math.cos(angle) * offset,
          longitude: baseLng + Math.sin(angle) * offset,
          last_seen: last.date_time,
        });
      });
    }
    return children;
  } catch (err) {
    console.error('Failed to load events:', err);
    return [];
  }
}

function addChildrenToOutdoorMap(
  outdoorMap: NonNullable<ReturnType<Awaited<ReturnType<typeof show3dMap>>['Outdoor']['map']>>,
  children: Child[]
) {
  if (children.length === 0) return;
  const geojson = {
    type: 'FeatureCollection' as const,
    features: children.map((c) => ({
      type: 'Feature' as const,
      properties: { name: c.name },
      geometry: {
        type: 'Point' as const,
        coordinates: [c.longitude, c.latitude],
      },
    })),
  };
  try {
    const src = outdoorMap.getSource('children') as { setData?: (d: unknown) => void } | undefined;
    if (src?.setData) {
      src.setData(geojson);
      return;
    }
    if (outdoorMap.getSource('children')) return;
    outdoorMap.addSource('children', { type: 'geojson', data: geojson });
    outdoorMap.addLayer({
      id: 'children-circles',
      type: 'circle',
      source: 'children',
      paint: {
        'circle-radius': 14,
        'circle-color': '#16a34a',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
    outdoorMap.addLayer({
      id: 'children-labels',
      type: 'symbol',
      source: 'children',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-offset': [0, 1.2],
      },
      paint: {
        'text-color': '#fff',
        'text-halo-color': '#16a34a',
        'text-halo-width': 2,
      },
    });
  } catch (e) {
    console.error('Error adding children to outdoor map:', e);
  }
}

async function loadReaders(mapView: Awaited<ReturnType<typeof show3dMap>>) {
  try {
    const data = await api.get<ReadersResponse>('readers');
    const children = await loadChildrenFromEvents(data.readers);

    const listEl = document.getElementById('readers-list');
    const panelEl = document.getElementById('readers-panel');
    if (listEl && panelEl) {
      listEl.innerHTML = data.readers
        .map((r) => {
          const lobbyChildren = children.filter((c) => c.reader_name === r.reader_name);
          return `<div class="lobby-area-group">
            <div class="reader-row" data-reader-name="${r.reader_name}" data-display-name="${r.display_name.replace(/"/g, '&quot;')}" role="button" tabindex="0" title="View lobby">
              <span class="marker">${readerPin}</span>
              <span>${r.display_name}</span>
              <span class="coords">${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}</span>
            </div>
            ${lobbyChildren.length > 0 ? `<div class="lobby-children-list">${lobbyChildren.map((c) => `<div class="reader-row child-row"><span class="marker">${childPin}</span><span>${c.name}</span></div>`).join('')}</div>` : ''}
          </div>`;
        })
        .join('');
      setupReaderDialog(children);
      panelEl.style.display = 'block';
      setupCollapsibleReadersPanel();
    }

    const addToOutdoor = () => {
      const outdoorMap = mapView.Outdoor.map;
      if (outdoorMap) {
        addReadersToOutdoorMap(outdoorMap, data.readers);
        addChildrenToOutdoorMap(outdoorMap, children);
      }
    };

    const pinMarkerHtml = (fill: string) => `<div style="width:28px;height:36px">${pinSvg(fill)}</div>`;
    const addMarker = (lat: number, lng: number, fill: string) => {
      const coord = mapView.createCoordinate(lat, lng);
      mapView.Markers.add(coord, pinMarkerHtml(fill), {
        placement: 'center',
        rank: 'always-visible',
      });
    };
    for (const reader of data.readers) {
      addMarker(reader.latitude, reader.longitude, 'transparent');
    }
    for (const child of children) {
      addMarker(child.latitude, child.longitude, '#16a34a');
    }

    if (mapView.Outdoor.map) {
      if (mapView.Outdoor.map.isStyleLoaded()) addToOutdoor();
      else mapView.Outdoor.map.on('load', addToOutdoor);
    } else {
      mapView.on('outdoor-view-loaded', addToOutdoor);
    }

    const allCoordinates = [
      ...data.readers.map((r) => mapView.createCoordinate(r.latitude, r.longitude)),
      ...children.map((c) => mapView.createCoordinate(c.latitude, c.longitude)),
    ];
    if (allCoordinates.length > 0) {
      await mapView.Camera.focusOn(allCoordinates, {
        screenOffsets: { top: 80, right: 80, bottom: 80, left: 80 },
        duration: 800,
        maxZoomLevel: 18,
        minZoomLevel: 10,
      });
    }
  } catch (err) {
    console.error('Failed to load readers:', err);
  }
}

function setupReaderDialog(children: Child[]) {
  const dialog = document.getElementById('reader-dialog') as HTMLDialogElement | null;
  const titleEl = document.getElementById('reader-dialog-title');
  const childrenEl = document.getElementById('reader-dialog-children');
  const closeBtn = dialog?.querySelector('.reader-dialog-close');
  if (!dialog || !titleEl || !childrenEl) return;

  const openForReader = (readerName: string, displayName: string) => {
    const lobbyChildren = children.filter((c) => c.reader_name === readerName);
    titleEl.textContent = displayName;
    childrenEl.innerHTML =
      lobbyChildren.length > 0
        ? `<h3>Children</h3>${lobbyChildren
            .map(
              (c) =>
                `<div class="reader-dialog-child">
                  <span class="marker">${childPin}</span>
                  <div>
                    <span class="child-name">${c.name}</span>
                    ${c.last_seen ? `<div class="child-meta">Last seen: ${new Date(c.last_seen).toLocaleString()}</div>` : ''}
                  </div>
                </div>`
            )
            .join('')}`
        : '<h3>Children</h3><p style="color:#64748b;font-size:14px;">No children at this lobby.</p>';
    dialog.showModal();
  };

  document.addEventListener(
    'click',
    (e) => {
      const x = e.clientX;
      const y = e.clientY;
      const rows = document.querySelectorAll<HTMLElement>('.reader-row[data-reader-name]');
      for (const row of rows) {
        const r = row.getBoundingClientRect();
        if (r.left <= x && x <= r.right && r.top <= y && y <= r.bottom) {
          e.preventDefault();
          e.stopPropagation();
          const readerName = row.getAttribute('data-reader-name');
          const displayName = row.getAttribute('data-display-name') ?? readerName ?? '';
          if (readerName) openForReader(readerName, displayName);
          return;
        }
      }
    },
    true
  );

  closeBtn?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}

function setupCollapsibleReadersPanel() {
  const panel = document.getElementById('readers-panel');
  const header = document.getElementById('readers-panel-header');
  const toggleBtn = document.getElementById('readers-panel-toggle');
  if (!panel || !header || !toggleBtn) return;

  const toggle = () => {
    panel.classList.toggle('collapsed');
    toggleBtn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
  };

  const hitTest = (e: MouseEvent) => {
    const toggleBtnEl = document.getElementById('readers-panel-toggle');
    const scanBtnEl = document.getElementById('btn-scan-qr');
    const headerEl = document.getElementById('readers-panel-header');
    if (!toggleBtnEl || !headerEl) return;
    const x = e.clientX;
    const y = e.clientY;
    const inRect = (r: DOMRect) => r.left <= x && x <= r.right && r.top <= y && y <= r.bottom;
    if (scanBtnEl && inRect(scanBtnEl.getBoundingClientRect())) return;
    if (inRect(toggleBtnEl.getBoundingClientRect())) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      toggle();
    } else if (inRect(headerEl.getBoundingClientRect())) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    }
  };
  document.addEventListener('click', hitTest, true);
}

export async function initMap() {
  const container = document.getElementById('mappedin-map');
  if (!container) throw new Error('Map container #mappedin-map not found');

  container.textContent = 'Fetching map data…';
  const mapData = await Promise.race([
    getMapData(mappedinOptions),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Map data fetch timed out (15s). Check network/CORS.')), 15000)
    ),
  ]);

  container.textContent = 'Rendering map…';
  const mapView = await show3dMap(container, mapData, {
    outdoorView: {
      enabled: true,
      style: 'https://tiles-cdn.mappedin.com/styles/midnightblue/style.json',
    },
  });

  loadReaders(mapView).catch((err) => console.error('Failed to load readers:', err));
  if (mapView.Outdoor.enabled && !mapView.Outdoor.visible) {
    mapView.Outdoor.show();
  }
  setupQrScanDialog();
}
