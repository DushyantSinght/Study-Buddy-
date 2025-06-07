import { db, auth } from './firebase.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { logAction } from './logger.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js';

window.logout = async function () {
  await logAction(auth.currentUser?.email || 'anonymous', 'logout', 'User logged out');
  auth.signOut().then(() => window.location.href = 'login.html');
};

const eventForm = document.getElementById('eventForm');
const eventList = document.getElementById('eventList');
const filterInput = document.getElementById('eventFilter');
const loadingSpinner = document.getElementById('loadingSpinner');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editEventForm');
const notificationToggle = document.getElementById('notificationToggle');

auth.onAuthStateChanged(async user => {
  if (!user) window.location.href = 'login.html';
  else {
    setupNotifications(user);
    document.getElementById('adminLink').classList.toggle('hidden', user.email !== 'admin@sports.com');
  }
});

function validateEventForm(sportName, location, datetime) {
  if (!sportName || sportName.length < 2) return 'Sport name must be at least 2 characters';
  if (!location || location.length < 3) return 'Location must be at least 3 characters';
  if (!datetime || new Date(datetime) < new Date()) return 'Date must be in the future';
  return null;
}

function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

eventForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const sportName = document.getElementById('sportName').value.trim();
  const location = document.getElementById('location').value.trim();
  const datetime = document.getElementById('datetime').value;
  const coordinates = document.getElementById('coordinates').value;

  const error = validateEventForm(sportName, location, datetime);
  if (error) {
    alert(error);
    return;
  }

  try {
    eventForm.classList.add('opacity-50', 'pointer-events-none');
    loadingSpinner.classList.remove('hidden');

    await addDoc(collection(db, 'events'), {
      user: auth.currentUser.email,
      sportName: sanitizeInput(sportName),
      location: sanitizeInput(location),
      coordinates: coordinates ? JSON.parse(coordinates) : null,
      datetime
    });

    await logAction(auth.currentUser.email, 'add_event', `Added event: ${sportName} at ${location}`);
    eventForm.reset();
  } catch (error) {
    await logAction(auth.currentUser.email, 'add_event_error', error.message, 'error');
    alert('Failed to add event: ' + error.message);
  } finally {
    eventForm.classList.remove('opacity-50', 'pointer-events-none');
    loadingSpinner.classList.add('hidden');
  }
});

editForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const eventId = document.getElementById('editEventId').value;
  const sportName = document.getElementById('editSportName').value.trim();
  const location = document.getElementById('editLocation').value.trim();
  const datetime = document.getElementById('editDatetime').value;
  const coordinates = document.getElementById('editCoordinates').value;

  const error = validateEventForm(sportName, location, datetime);
  if (error) {
    alert(error);
    return;
  }

  try {
    editForm.classList.add('opacity-50', 'pointer-events-none');
    loadingSpinner.classList.remove('hidden');

    await updateDoc(doc(db, 'events', eventId), {
      sportName: sanitizeInput(sportName),
      location: sanitizeInput(location),
      coordinates: coordinates ? JSON.parse(coordinates) : null,
      datetime
    });

    await logAction(auth.currentUser.email, 'edit_event', `Edited event: ${sportName} at ${location}`);
    editModal.classList.add('hidden');
  } catch (error) {
    await logAction(auth.currentUser.email, 'edit_event_error', error.message, 'error');
    alert('Failed to edit event: ' + error.message);
  } finally {
    editForm.classList.remove('opacity-50', 'pointer-events-none');
    loadingSpinner.classList.add('hidden');
  }
});

const q = query(collection(db, 'events'), orderBy('datetime'));
onSnapshot(q, snapshot => {
  eventList.innerHTML = '';
  const map = L.map('eventMap').setView([51.505, -0.09], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement('li');
    li.className = 'py-2 px-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors flex justify-between items-center';
    li.setAttribute('data-sport', data.sportName.toLowerCase());
    li.innerHTML = `
      ${data.sportName} at ${data.location} on ${new Date(data.datetime).toLocaleString()}
      <div>
        <button onclick="editEvent('${doc.id}', '${data.sportName}', '${data.location}', '${data.datetime}', '${JSON.stringify(data.coordinates || {})}')" class="text-blue-600 hover:underline mr-2">Edit</button>
        <button onclick="deleteEvent('${doc.id}')" class="text-red-600 hover:underline">Delete</button>
      </div>
    `;
    eventList.appendChild(li);

    if (data.coordinates) {
      L.marker([data.coordinates.lat, data.coordinates.lng])
        .addTo(map)
        .bindPopup(`${data.sportName} at ${data.location}`);
    }
  });

  if (snapshot.size > 0 && snapshot.docs[0].data().coordinates) {
    map.setView([snapshot.docs[0].data().coordinates.lat, snapshot.docs[0].data().coordinates.lng], 13);
  }
});

window.editEvent = function (id, sportName, location, datetime, coordinates) {
  document.getElementById('editEventId').value = id;
  document.getElementById('editSportName').value = sportName;
  document.getElementById('editLocation').value = location;
  document.getElementById('editDatetime').value = datetime;
  document.getElementById('editCoordinates').value = coordinates;
  editModal.classList.remove('hidden');
};

window.deleteEvent = async function (id) {
  if (!confirm('Are you sure you want to delete this event?')) return;
  try {
    await deleteDoc(doc(db, 'events', id));
    await logAction(auth.currentUser.email, 'delete_event', `Deleted event with ID: ${id}`);
  } catch (error) {
    await logAction(auth.currentUser.email, 'delete_event_error', error.message, 'error');
    alert('Failed to delete event: ' + error.message);
  }
};

filterInput?.addEventListener('input', (e) => {
  const filter = e.target.value.toLowerCase();
  const events = eventList.getElementsByTagName('li');
  Array.from(events).forEach(event => {
    const sport = event.getAttribute('data-sport');
    event.style.display = sport.includes(filter) ? '' : 'none';
  });
});

async function setupNotifications(user) {
  const messaging = getMessaging();
  notificationToggle?.addEventListener('change', async (e) => {
    if (e.target.checked) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
          await addDoc(collection(db, 'notifications'), { userId: user.uid, token });
          await logAction(user.email, 'enable_notifications', 'Notifications enabled');
        } else {
          e.target.checked = false;
          alert('Notification permission denied');
        }
      } catch (error) {
        await logAction(user.email, 'notification_error', error.message, 'error');
        alert('Failed to enable notifications: ' + error.message);
      }
    }
  });

  onMessage(messaging, (payload) => {
    new Notification(payload.notification.title, { body: payload.notification.body });
  });
}