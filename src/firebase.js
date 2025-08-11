import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDxHgXvAxNhkj1IPCoW9uKrLZeIUz-nyx8",
  authDomain: "selvaguru-e613b.firebaseapp.com",
  projectId: "selvaguru-e613b",
  storageBucket: "selvaguru-e613b.firebasestorage.app",
  messagingSenderId: "914201586585",
  appId: "1:914201586585:web:c1a2685c3d259e7167c108",
  measurementId: "G-0X0F50JRT8"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export default app