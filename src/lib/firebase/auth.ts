import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseAuth, firebaseAuthReady } from "./app";

export type FirebaseUserView = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

export function userView(user: User | null): FirebaseUserView | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth(), cb);
}

export async function currentUserReady(): Promise<User | null> {
  await firebaseAuthReady();
  return firebaseAuth().currentUser;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<FirebaseUserView | null> {
  await firebaseAuthReady();
  const result = await signInWithEmailAndPassword(
    firebaseAuth(),
    email.trim(),
    password,
  );
  return userView(result.user);
}

export async function signOutCurrent(): Promise<void> {
  await firebaseAuthReady();
  await signOut(firebaseAuth());
}
