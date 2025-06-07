import { db } from './firebase.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export async function logAction(userId, action, details, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${userId} -> ${action}: ${details}`;
  console.log(logMessage);

  try {
    await addDoc(collection(db, 'logs'), {
      userId,
      action,
      details,
      level,
      timestamp
    });
  } catch (error) {
    console.error('Failed to save log to Firestore:', error);
  }
}