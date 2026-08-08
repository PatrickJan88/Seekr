import re
with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("() => setShowImportModal(false);\n                  syncLockRef.current = false;}", "() => { setShowImportModal(false); syncLockRef.current = false; }}")

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
