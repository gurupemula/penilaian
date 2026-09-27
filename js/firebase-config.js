// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkWy9OT21bMR3YvX5UR-WV_-ULs4L7srY",
  authDomain: "gurupemula-6315d.firebaseapp.com",
  projectId: "gurupemula-6315d",
  storageBucket: "gurupemula-6315d.firebasestorage.app",
  messagingSenderId: "162972580364",
  appId: "1:162972580364:web:69f958cbecdef8793b4c29"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export auth & firestore for convenience
const auth = firebase.auth();
const db = firebase.firestore();
