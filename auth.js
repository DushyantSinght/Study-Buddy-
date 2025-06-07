import { auth } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { logAction } from './logger.js';

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('adminLink')?.classList.toggle('hidden', user.email !== 'admin@sports.com');
  }
});

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? null : 'Invalid email format';
}

function validatePassword(password) {
  return password.length >= 6 ? null : 'Password must be at least 6 characters';
}

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError || passwordError) {
    alert(emailError || passwordError);
    return;
  }

  try {
    document.getElementById('registerForm').classList.add('opacity-50', 'pointer-events-none');
    await createUserWithEmailAndPassword(auth, email, password);
    await logAction(email, 'register', 'User registered successfully');
    window.location.href = 'dashboard.html';
  } catch (error) {
    await logAction(email, 'register_error', error.message, 'error');
    alert('Registration failed: ' + error.message);
  } finally {
    document.getElementById('registerForm').classList.remove('opacity-50', 'pointer-events-none');
  }
});

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError || passwordError) {
    alert(emailError || passwordError);
    return;
  }

  try {
    document.getElementById('loginForm').classList.add('opacity-50', 'pointer-events-none');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await logAction(email, 'login', 'User logged in successfully');
    if (email === "admin@sports.com") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    await logAction(email, 'login_error', error.message, 'error');
    alert('Login failed: ' + error.message);
  } finally {
    document.getElementById('loginForm').classList.remove('opacity-50', 'pointer-events-none');
  }
});