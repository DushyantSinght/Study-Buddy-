const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.notifyNewEvent = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    const payload = {
      notification: {
        title: 'New Sports Event!',
        body: `${event.sportName} at ${event.location} on ${new Date(event.datetime).toLocaleString()}`
      }
    };

    const tokens = [];
    const snapshot = await admin.firestore().collection('notifications').get();
    snapshot.forEach(doc => tokens.push(doc.data().token));

    if (tokens.length > 0) {
      await admin.messaging().sendMulticast({ tokens, ...payload });
    }
    return null;
  });