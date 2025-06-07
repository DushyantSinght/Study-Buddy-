import { db, auth } from './firebase.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { logAction } from './logger.js';

auth.onAuthStateChanged(user => {
  if (!user) window.location.href = 'login.html';
  else {
    loadProfile(user);
    document.getElementById('adminLink')?.classList.toggle('hidden', user.email !== 'admin@sports.com');
  }
});

const profileForm = document.getElementById('profileForm');
const loadingSpinner = document.getElementById('loadingSpinner');

async function loadProfile(user) {
  try {
    const docRef = doc(db, 'profiles', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      document.getElementById('name').value = docSnap.data().name || '';
      document.getElementById('bio').value = docSnap.data().bio || '';
    }
  } catch (error) {
    await logAction(user.email, 'load_profile_error', error.message, 'error');
    alert('Failed to load profile: ' + error.message);
  }
}

profileForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const bio = document.getElementById('bio').value.trim();

  if (name.length < 2) {
    alert('Name must be at least 2 characters');
    return;
  }

  try {
    profileForm.classList.add('opacity-50', 'pointer-events-none');
    loadingSpinner.classList.remove('hidden');

    await setDoc(doc(db, 'profiles', auth.currentUser.uid), {
      name: sanitizeInput(name),
      bio: sanitizeInput(bio),
      email: auth.currentUser.email
    });

    await logAction(auth.currentUser.email, 'update_profile', `Updated profile: ${name}`);
    alert('Profile updated successfully');
  } catch (error) {
    await logAction(auth.currentUser.email, 'update_profile_error', error.message, 'error');
    alert('Failed to update profile: ' + error.message);
  } finally {
    profileForm.classList.remove('opacity-50', 'pointer-events-none');
    loadingSpinner.classList.add('hidden');
  }
});

function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}