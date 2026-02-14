'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await' in the caller if you want non-blocking behavior.
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  // CRITICAL: Call createUserWithEmailAndPassword directly. 
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  // CRITICAL: Call signInWithEmailAndPassword directly.
  return signInWithEmailAndPassword(authInstance, email, password);
}
