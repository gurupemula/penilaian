// Firebase configuration — project gurupemula-6315d
const firebaseConfig = {
  apiKey: "AIzaSyCkWy9OT21bMR3YvX5UR-WV_-ULs4L7srY",
  authDomain: "gurupemula-6315d.firebaseapp.com",
  projectId: "gurupemula-6315d",
  storageBucket: "gurupemula-6315d.firebasestorage.app",
  messagingSenderId: "162972580364",
  appId: "1:162972580364:web:69f958cbecdef8793b4c29"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
