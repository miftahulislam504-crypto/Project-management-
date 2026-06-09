import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCazJ_3dPQa0JYh6F0B1JWnTlv_fbWmZ0c",
  authDomain: "civilengineering-platform.firebaseapp.com",
  projectId: "civilengineering-platform",
  storageBucket: "civilengineering-platform.firebasestorage.app",
  messagingSenderId: "558154630499",
  appId: "1:558154630499:web:c9162689449435bce8bf56",
  measurementId: "G-NN879148S1"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app