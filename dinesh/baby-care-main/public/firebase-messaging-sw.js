// public/firebase-messaging-sw.js

// Import Firebase App and Messaging from the CDN
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBUqLVDlNGP6uzDBoxPkxUWFLVY7y5ICtM",
  authDomain: "baby--care.firebaseapp.com",
  projectId: "baby--care",
  storageBucket: "baby--care.firebasestorage.app",
  messagingSenderId: "400476054080",
  appId: "1:400476054080:web:ea2912f6dc561430c535a5"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'System Alert';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/vite.svg', // Use an icon from your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});