// /app/services/auth.ts
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';


//import { auth } from '../../firebase/FirebaseConfigg';
//import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar persistencia si es necesario
// ...

export {
    createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut
};

    export type { User };
