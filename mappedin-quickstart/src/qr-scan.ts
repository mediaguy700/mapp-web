import { Html5Qrcode } from 'html5-qrcode';

const readerEl = document.getElementById('qr-reader');
const resultEl = document.getElementById('qr-result');
const resultTextEl = document.getElementById('qr-result-text');
const errorEl = document.getElementById('qr-error');

let html5QrCode: Html5Qrcode | null = null;
let isScanning = false;

function showError(msg: string) {
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.add('show');
  }
}

function hideError() {
  errorEl?.classList.remove('show');
}

function showResult(text: string) {
  if (resultEl && resultTextEl) {
    resultTextEl.textContent = text;
    resultEl.classList.add('show');
  }
}

function hideResult() {
  resultEl?.classList.remove('show');
}

async function startScanning() {
  if (!readerEl || isScanning) return;
  hideError();
  hideResult();

  try {
    html5QrCode = new Html5Qrcode('qr-reader');

    const cameras = await Html5Qrcode.getCameras();
    if (!cameras?.length) {
      showError('No camera found. Please allow camera access.');
      return;
    }

    const cameraId = cameras[0].id;

    await html5QrCode.start(
      cameraId,
      {
        fps: 10,
        qrbox: { width: 180, height: 180 },
      },
      (decodedText) => {
        const mac = decodedText.trim();
        showResult(mac);
        stopScanning();
        window.location.href = `./index.html?mac=${encodeURIComponent(mac)}`;
      },
      () => {
        // Ignore scan errors (no QR in frame)
      }
    );

    isScanning = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    showError(msg.includes('NotAllowedError') || msg.includes('Permission')
      ? 'Camera access denied. Please allow camera permissions and try again.'
      : `Failed to start camera: ${msg}`);
  }
}

async function stopScanning() {
  if (!html5QrCode || !isScanning) return;
  try {
    await html5QrCode.stop();
  } catch {
    // Ignore stop errors
  }
  html5QrCode.clear();
  html5QrCode = null;
  isScanning = false;
}

// Auto-start on load
startScanning();
