import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

new_finally = """    } finally {
      setIsSyncing(false);
      syncLockRef.current = false;
    }"""

content = re.sub(r"    } finally \{\n      setIsSyncing\(false\);\n    \}", new_finally, content)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
