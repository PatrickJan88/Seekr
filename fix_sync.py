import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Add syncLockRef
if 'const syncLockRef = useRef(false);' not in content:
    content = content.replace('const [isSyncing, setIsSyncing] = useState(false);', 'const [isSyncing, setIsSyncing] = useState(false);\n  const syncLockRef = useRef(false);')

# Update handleDataImport
new_handle = """  const handleDataImport = async (file: File) => {
    if (syncLockRef.current) return;
    syncLockRef.current = true;
    setIsSyncing(true);
    setSyncError(null);"""

content = re.sub(r"  const handleDataImport = async \(file: File\) => \{\n    setIsSyncing\(true\);\n    setSyncError\(null\);", new_handle, content)

# Reset syncLockRef when modal closes
new_modal_close = """setShowImportModal(false);
                  syncLockRef.current = false;"""
content = content.replace('setShowImportModal(false)', new_modal_close)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
