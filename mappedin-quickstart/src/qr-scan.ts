import { Html5Qrcode } from 'html5-qrcode';

const readerEl = document.getElementById('qr-reader');
const resultEl = document.getElementById('qr-result');
const resultTextEl = document.getElementById('qr-result-text');
const errorEl = document.getElementById('qr-error');
const scannerInput = document.getElementById('qr-scanner-input') as HTMLInputElement | null;
const modeCamera = document.getElementById('qr-mode-camera');
const modeUsb = document.getElementById('qr-mode-usb');
const headerDesc = document.getElementById('qr-header-desc');
const choiceCamera = document.getElementById('qr-choice-camera');
const choiceUsb = document.getElementById('qr-choice-usb');

let html5QrCode: Html5Qrcode | null = null;
let isScanning = false;
type ScanMode = 'camera' | 'usb' | null;
let currentMode: ScanMode = null;

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

function handleAttachedScanner(value: string) {
  const mac = value.trim();
  if (!mac) return;
  showResult(mac);
  stopScanning();
  window.location.href = `./index.html?mac=${encodeURIComponent(mac)}`;
}

function switchMode(mode: ScanMode) {
  if (mode === currentMode) return;
  currentMode = mode;

  choiceCamera?.classList.toggle('active', mode === 'camera');
  choiceUsb?.classList.toggle('active', mode === 'usb');
  modeCamera?.classList.toggle('active', mode === 'camera');
  modeUsb?.classList.toggle('active', mode === 'usb');

  if (headerDesc) {
    headerDesc.textContent =
      mode === 'camera'
        ? 'Position a QR code within the frame to scan'
        : mode === 'usb'
          ? 'Scan with attached scanner'
          : '';
  }

  if (mode === 'camera') {
    startScanning();
  } else {
    stopScanning();
    if (mode === 'usb') {
      scannerInput?.focus();
    }
  }
}

choiceCamera?.addEventListener('click', () => switchMode('camera'));
choiceUsb?.addEventListener('click', () => switchMode('usb'));

scannerInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const value = scannerInput.value.trim();
    if (value) {
      handleAttachedScanner(value);
      scannerInput.value = '';
    }
  }
});
