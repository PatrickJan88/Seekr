const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({
  projectId: 'ai-studio-careerdashboard-466a1dfe-d8a5-404b-9007-ad83a46a7434'
});
const db = getFirestore(app);

async function run() {
  try {
    const snapshot = await db.collection('applications').get();
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(data.company, "-> interview:", data.nextInterviewDate, "reminder:", data.reminder, "reminderSent:", data.reminderSent);
    });
  } catch (e) {
    console.error(e);
  }
}
run();
