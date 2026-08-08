import re

with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

new_config = """const firebaseConfig = {
  apiKey: "AIzaSyDn3miN-Urzh6pk5Wmyqxry7RmysdCHTaE",
  authDomain: "seekr-37311.firebaseapp.com",
  projectId: "seekr-37311",
  storageBucket: "seekr-37311.firebasestorage.app",
  messagingSenderId: "524936950392",
  appId: "1:524936950392:web:9d31d164b838e4178ef38d",
  measurementId: "G-2WKHY5F4B3"
};"""

old_config_pattern = r'const firebaseConfig = {.*?};'
content = re.sub(old_config_pattern, new_config, content, flags=re.DOTALL)

content = content.replace('export const db = getFirestore(app, "ai-studio-careerdashboard-466a1dfe-d8a5-404b-9007-ad83a46a7434");', 'export const db = getFirestore(app);')

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
