/**
 * QR Scan dialog - opens from the readers panel, scans QR codes in a popup.
 * On success, saves the value and opens the active-ble dialog.
 * Dialog fields match POST /active-ble: mac, fname, lname, parent_fname, parent_lname, parent_phone, duration.
 */
import { Html5Qrcode } from 'html5-qrcode';
import { api } from './api.ts';

let html5QrCode: Html5Qrcode | null = null;

export function setupQrScanDialog() {
  const btnScan = document.getElementById('btn-scan-qr');
  const dialog = document.getElementById('qr-scan-dialog') as HTMLDialogElement | null;
  const btnClose = document.getElementById('qr-scan-close');
  const readerEl = document.getElementById('qr-reader-dialog');
  const resultBox = document.getElementById('qr-result-box');
  const resultText = document.getElementById('qr-result-text');
  const errorBox = document.getElementById('qr-error-box');
  const activeBleDialog = document.getElementById('active-ble-dialog') as HTMLDialogElement | null;
  const activeBleClose = document.getElementById('active-ble-close');
  const activeBleMac = document.getElementById('active-ble-mac') as HTMLInputElement | null;
  const activeBleFname = document.getElementById('active-ble-fname') as HTMLInputElement | null;
  const activeBleLname = document.getElementById('active-ble-lname') as HTMLInputElement | null;
  const activeBleParentFname = document.getElementById('active-ble-parent-fname') as HTMLInputElement | null;
  const activeBleParentLname = document.getElementById('active-ble-parent-lname') as HTMLInputElement | null;
  const activeBleParentPhone = document.getElementById('active-ble-parent-phone') as HTMLInputElement | null;
  const activeBleDuration = document.getElementById('active-ble-duration') as HTMLInputElement | null;
  const activeBleSubmit = document.getElementById('active-ble-submit');
  const activeBleError = document.getElementById('active-ble-error');

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

  function openActiveBleDialog(mac: string) {
    if (activeBleMac) activeBleMac.value = mac.slice(0, 17);
    if (activeBleFname) activeBleFname.value = '';
    if (activeBleLname) activeBleLname.value = '';
    if (activeBleParentFname) activeBleParentFname.value = '';
    if (activeBleParentLname) activeBleParentLname.value = '';
    if (activeBleParentPhone) activeBleParentPhone.value = '';
    if (activeBleDuration) activeBleDuration.value = '';
    if (activeBleError) {
      activeBleError.textContent = '';
      activeBleError.classList.remove('show');
    }
    if (dialog) dialog.close();
    activeBleDialog?.showModal();
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
          const mac = decodedText.trim();
          showResult(mac);
          stopScanner();
          openActiveBleDialog(mac);
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

  activeBleClose?.addEventListener('click', () => activeBleDialog?.close());
  activeBleDialog?.addEventListener('click', (e) => {
    if (e.target === activeBleDialog) activeBleDialog.close();
  });

  activeBleSubmit?.addEventListener('click', async () => {
    const mac = activeBleMac?.value?.trim();
    const fname = activeBleFname?.value?.trim();
    const lname = activeBleLname?.value?.trim();
    const parent_fname = activeBleParentFname?.value?.trim();
    const parent_lname = activeBleParentLname?.value?.trim();
    const parent_phone = activeBleParentPhone?.value?.trim();
    const durationVal = activeBleDuration?.value?.trim();

    if (!mac) {
      if (activeBleError) {
        activeBleError.textContent = 'MAC address is required.';
        activeBleError.classList.add('show');
      }
      return;
    }

    if (mac.length > 17) {
      if (activeBleError) {
        activeBleError.textContent = 'MAC address must be 17 characters or less.';
        activeBleError.classList.add('show');
      }
      return;
    }

    if (activeBleError) {
      activeBleError.textContent = '';
      activeBleError.classList.remove('show');
    }

    const payload: Record<string, string | number> = { mac };
    if (fname) payload.fname = fname;
    if (lname) payload.lname = lname;
    if (parent_fname) payload.parent_fname = parent_fname;
    if (parent_lname) payload.parent_lname = parent_lname;
    if (parent_phone) payload.parent_phone = parent_phone;
    if (durationVal) {
      const n = parseInt(durationVal, 10);
      if (!isNaN(n) && n >= 0) payload.duration = n;
    }

    if (activeBleSubmit instanceof HTMLButtonElement) activeBleSubmit.disabled = true;

    try {
      await api.post('active-ble', payload);
      if (activeBleDialog) activeBleDialog.close();
    } catch (err) {
      if (activeBleError) {
        activeBleError.textContent = err instanceof Error ? err.message : String(err);
        activeBleError.classList.add('show');
      }
    } finally {
      if (activeBleSubmit instanceof HTMLButtonElement) activeBleSubmit.disabled = false;
    }
  });
}
