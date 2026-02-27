/**
 * Minimal bootstrap - loads map module dynamically so page responds immediately.
 */

function showError(msg: string) {
  const el = document.getElementById('mappedin-map');
  if (el) {
    el.innerHTML = `<div style="padding:24px;color:#ef4444;font-family:sans-serif;font-size:14px;white-space:pre-wrap">${msg.replace(/</g, '&lt;')}</div>`;
  }
  console.error(msg);
}

async function init() {
  const container = document.getElementById('mappedin-map');
  if (!container) {
    showError('Map container #mappedin-map not found');
    return;
  }
  try {
    container.textContent = 'Loading map SDK…';
    const { initMap } = await import('./map-init.ts');
    await initMap();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    showError(`Map failed to load:\n\n${msg}`);
  }
}

init();
