import { db } from './firebase.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Sample data generation script for development use only
// To run: Include this script in a test HTML file or run it via Node.js with Firebase Admin SDK
// Ensure Firestore rules allow writes for the user running this script

async function generateSampleData() {
  try {
    // Sample Events
    const events = [
      {
        user: 'test@sports.com',
        sportName: 'Soccer',
        location: 'Central Park',
        coordinates: { lat: 40.7829, lng: -73.9654 },
        datetime: new Date(Date.now() + 86400000).toISOString()
      },
      {
        user: 'test@sports.com',
        sportName: 'Basketball',
        location: 'Community Center',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        datetime: new Date(Date.now() + 2 * 86400000).toISOString()
      },
      {
        user: 'test@sports.com',
        sportName: 'Tennis',
        location: 'City Courts',
        coordinates: { lat: 40.7306, lng: -73.9352 },
        datetime: new Date(Date.now() + 3 * 86400000).toISOString()
      }
    ];

    for (const event of events) {
      await addDoc(collection(db, 'events'), event);
      console.log(`Added event: ${event.sportName}`);
    }

    // Sample Categories
    const categories = [
      { category: 'Soccer' },
      { category: 'Basketball' },
      { category: 'Tennis' },
      { category: 'Volleyball' }
    ];

    for (const category of categories) {
      await addDoc(collection(db, 'categories'), category);
      console.log(`Added category: ${category.category}`);
    }

    console.log('Sample data generation complete.');
  } catch (error) {
    console.error('Failed to generate sample data:', error);
  }
}

// Run only in development environment
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  generateSampleData();
} else {
  console.warn('Sample data generation is disabled in production.');
}