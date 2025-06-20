import { initializeApp } from "firebase/app";
import { getFirestore, doc, runTransaction } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8QKN_IwzUEQVwNzfyG9VLAdeGsnDbdog",
  authDomain: "orcamento-aulevi.firebaseapp.com",
  projectId: "orcamento-aulevi",
  storageBucket: "orcamento-aulevi.appspot.com",
  messagingSenderId: "15287240368",
  appId: "1:15287240368:web:7c8a8a3f305eac97a51d75"
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
