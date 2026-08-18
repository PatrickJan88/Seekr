import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { CVEvaluation } from '../types';

const COLLECTION_NAME = 'evaluations';

export const getEvaluations = async (userId: string): Promise<CVEvaluation[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const evals = snapshot.docs.map(doc => doc.data() as CVEvaluation);
  return evals.sort((a, b) => b.createdAt - a.createdAt);
};

export const addEvaluation = async (evaluation: Omit<CVEvaluation, 'id' | 'createdAt'>): Promise<CVEvaluation> => {
  const newRef = doc(collection(db, COLLECTION_NAME));
  const now = Date.now();
  const newEval: CVEvaluation = {
    ...evaluation,
    id: newRef.id,
    createdAt: now,
  };
  
  // Remove any undefined values
  Object.keys(newEval).forEach(key => {
    if ((newEval as any)[key] === undefined) {
      delete (newEval as any)[key];
    }
  });

  await setDoc(newRef, newEval);
  return newEval;
};
