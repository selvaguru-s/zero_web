import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Replace with your Firebase config
const firebaseConfig = {

}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export default app
