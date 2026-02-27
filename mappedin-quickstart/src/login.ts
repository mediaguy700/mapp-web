import { authApi, setToken } from './auth';

const form = document.getElementById('login-form') as HTMLFormElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const passwordTextInput = document.getElementById('password-text') as HTMLInputElement;
const errorEl = document.getElementById('login-error');
const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement;
const togglePasswordBtn = document.getElementById('toggle-password');

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

togglePasswordBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!passwordInput || !passwordTextInput) return;
  const showingText = !passwordTextInput.classList.contains('pass-hidden');
  if (showingText) {
    passwordInput.value = passwordTextInput.value;
    passwordTextInput.classList.add('pass-hidden');
    passwordInput.classList.remove('pass-hidden');
    passwordTextInput.removeAttribute('required');
    passwordInput.setAttribute('required', '');
    passwordInput.focus();
    togglePasswordBtn.setAttribute('aria-label', 'Show password');
    togglePasswordBtn.setAttribute('title', 'Show password');
    togglePasswordBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  } else {
    passwordTextInput.value = passwordInput.value;
    passwordInput.classList.add('pass-hidden');
    passwordTextInput.classList.remove('pass-hidden');
    passwordInput.removeAttribute('required');
    passwordTextInput.setAttribute('required', '');
    passwordTextInput.focus();
    togglePasswordBtn.setAttribute('aria-label', 'Hide password');
    togglePasswordBtn.setAttribute('title', 'Hide password');
    togglePasswordBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  }
});

passwordTextInput?.addEventListener('input', () => {
  if (passwordInput) passwordInput.value = passwordTextInput.value;
});
passwordTextInput?.addEventListener('blur', () => {
  if (passwordInput) passwordInput.value = passwordTextInput.value;
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  const username = usernameInput?.value?.trim();
  const password = passwordInput?.value ?? passwordTextInput?.value;
  if (!username || !password) {
    showError('Please enter username and password.');
    return;
  }
  setLoading(true);
  try {
    const res = await authApi.login(username, password);
    const token = res.token ?? res.access_token;
    if (token) {
      setToken(token);
      window.location.replace('./index.html');
    } else {
      showError('Invalid response from server.');
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
});
