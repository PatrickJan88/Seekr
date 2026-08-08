const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

content = content.replace('googleProvider.addScope("https://www.googleapis.com/auth/calendar.events");\ngoogleProvider.setCustomParameters({ prompt: \'consent\' });', '');

content = content.replace(
  `export const googleSignIn = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential && credential.accessToken) {
    sessionStorage.setItem('google_access_token', credential.accessToken);
  }
  return result;
};`,
  `export const googleSignIn = async () => {
  return signInWithPopup(auth, googleProvider);
};`
);

content = content.replace(
  `export const getAccessToken = async () => {
  return sessionStorage.getItem('google_access_token');
};`,
  ``
);

fs.writeFileSync('src/lib/firebase.ts', content);
