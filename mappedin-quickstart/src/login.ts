import { authApi, setToken } from './auth';

const form = document.getElementById('login-form') as HTMLFormElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const errorEl = document.getElementById('login-error');
const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement;

function showError(msg: string): void {
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
}

function hideError(): void {
  if (errorEl) errorEl.style.display = 'none';
}

function setLoading(loading: boolean): void {
  if (submitBtn) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Signing in...' : 'Sign in';
  }
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  const username = usernameInput?.value?.trim();
  const password = passwordInput?.value;
  if (!username || !password) {
    showError('Please enter username and password.');
    return;
  }
  setLoading(true);
  try {
    const res = await authApi.login(username, password);
    const token = res.token;
    if (token) {
      setToken(token);
      window.location.href = './index.html';
    } else {
      showError('Invalid response from server.');
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
});
