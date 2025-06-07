import { db } from './firebase.js';
import { collection, addDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { logAction } from './logger.js';

const categoryForm = document.getElementById('categoryForm');
const categoryList = document.getElementById('categoryList');
const loadingSpinner = document.getElementById('loadingSpinner');

function validateCategory(category) {
  if (!category || category.length < 2) return 'Category name must be at least 2 characters';
  return null;
}

categoryForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const category = document.getElementById('categoryName').value.trim();

  const error = validateCategory(category);
  if (error) {
    alert(error);
    return;
  }

  try {
    categoryForm.classList.add('opacity-50', 'pointer-events-none');
    loadingSpinner.classList.remove('hidden');

    await addDoc(collection(db, 'categories'), { category: sanitizeInput(category) });
    await logAction('admin@sports.com', 'add_category', `Added category: ${category}`);
    categoryForm.reset();
  } catch (error) {
    await logAction('admin@sports.com', 'add_category_error', error.message, 'error');
    alert('Failed to add category: ' + error.message);
  } finally {
    categoryForm.classList.remove('opacity-50', 'pointer-events-none');
    loadingSpinner.classList.add('hidden');
  }
});

function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

onSnapshot(collection(db, 'categories'), snapshot => {
  categoryList.innerHTML = '';
  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement('li');
    li.className = 'py-2 px-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors';
    li.textContent = data.category;
    categoryList.appendChild(li);
  });
});