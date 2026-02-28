/**
 * QR Scan dialog - opens from the readers panel, scans QR codes in a popup.
 */
import { Html5Qrcode } from 'html5-qrcode';

let html5QrCode: Html5Qrcode | null = null;

export function setupQrScanDialog() {
  const btnScan = document.getElementById('btn-scan-qr');
  const dialog = document.getElementById('qr-scan-dialog') as HTMLDialogElement | null;
  const btnClose = document.getElementById('qr-scan-close');
  const readerEl = document.getElementById('qr-reader-dialog');
  const resultBox = document.getElementById('qr-result-box');
  const resultText = document.getElementById('qr-result-text');
  const errorBox = document.getElementById('qr-error-box');

  if (!btnScan || !dialog || !readerEl) return;

  function hideResult() {
    resultBox?.classList.remove('show');
  }

  function hideError() {
    errorBox?.classList.remove('show');
  }

  function showResult(text: string) {
    if (resultText) resultText.textContent = text;
    resultBox?.classList.add('show');
  }

  function showError(msg: string) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.add('show');
    }
  }

  async function startScanner() {
    if (!readerEl || html5QrCode) return;
    hideResult();
    hideError();

    try {
      html5QrCode = new Html5Qrcode('qr-reader-dialog');
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras?.length) {
        showError('No camera found.');
        return;
      }

      await html5QrCode.start(
        cameras[0].id,
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1,
        },
        (decodedText) => {
          showResult(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg.includes('NotAllowedError') || msg.includes('Permission')
        ? 'Camera access denied.'
        : `Failed: ${msg}`);
    }
  }

  async function stopScanner() {
    if (!html5QrCode) return;
    try {
      await html5QrCode.stop();
    } catch {
      /* ignore */
    }
    html5QrCode.clear();
    html5QrCode = null;
  }

  btnScan.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dialog.showModal();
    startScanner();
  });

  const closeDialog = () => {
    stopScanner();
    dialog.close();
  };

  btnClose?.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });
  dialog.addEventListener('close', stopScanner);
}
