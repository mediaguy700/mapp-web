import { Html5Qrcode } from 'html5-qrcode';

const readerEl = document.getElementById('qr-reader');
const resultEl = document.getElementById('qr-result');
const resultTextEl = document.getElementById('qr-result-text');
const errorEl = document.getElementById('qr-error');
const btnStart = document.getElementById('btn-start') as HTMLButtonElement | null;
const btnStop = document.getElementById('btn-stop') as HTMLButtonElement | null;

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
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        showResult(decodedText);
        stopScanning();
        btnStart?.removeAttribute('disabled');
        if (btnStop) btnStop.disabled = true;
      },
      () => {
        // Ignore scan errors (no QR in frame)
      }
    );

    isScanning = true;
    if (btnStart) btnStart.disabled = true;
    if (btnStop) btnStop.disabled = false;
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
  if (btnStart) btnStart.disabled = false;
  if (btnStop) btnStop.disabled = true;
}

btnStart?.addEventListener('click', startScanning);
btnStop?.addEventListener('click', stopScanning);

// Auto-start on load
startScanning();
