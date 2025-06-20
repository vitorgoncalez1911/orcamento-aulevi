import { initializeApp } from "firebase/app";
import { getFirestore, doc, runTransaction } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function gerarNumeroSequencial() {
  const docRef = doc(db, "controle", "sequencial");

  const novoNumero = await runTransaction(db, async (transaction) => {
    const docSnapshot = await transaction.get(docRef);
    const atual = docSnapshot.exists() ? docSnapshot.data().ultimo : 0;
    const proximo = atual + 1;
    transaction.set(docRef, { ultimo: proximo });
    return proximo;
  });

  return "OF" + String(novoNumero).padStart(3, "0");
}