import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";

const googleProvider = new GoogleAuthProvider();

export async function registrarseConEmail(
  nombre: string,
  email: string,
  password: string
): Promise<User> {
  const credencial = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credencial.user, { displayName: nombre });
  return credencial.user;
}

export async function iniciarSesionConEmail(email: string, password: string): Promise<User> {
  const credencial = await signInWithEmailAndPassword(auth, email, password);
  return credencial.user;
}

export async function iniciarSesionConGoogle(): Promise<User> {
  const credencial = await signInWithPopup(auth, googleProvider);
  return credencial.user;
}

export async function cerrarSesion(): Promise<void> {
  await signOut(auth);
}
