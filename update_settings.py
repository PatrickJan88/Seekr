import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Remove isSettingsOpen state and effect
content = re.sub(r'  const \[isSettingsOpen, setIsSettingsOpen\] = useState\(false\);\n', '', content)
content = content.replace('isFormOpen || showClearConfirm || isSettingsOpen || !!deleteConfirmId', 'isFormOpen || showClearConfirm || !!deleteConfirmId')
content = content.replace('[isFormOpen, showClearConfirm, isSettingsOpen, deleteConfirmId]', '[isFormOpen, showClearConfirm, deleteConfirmId]')

# Import SettingsPage
if 'import { SettingsPage }' not in content:
    content = content.replace("import { NotificationsPage } from './NotificationsPage';", "import { NotificationsPage } from './NotificationsPage';\nimport { SettingsPage } from './SettingsPage';")

# Change settings button
content = content.replace("onClick={() => setIsSettingsOpen(true)}", "onClick={() => setView('settings')}")

# Add view render
if "if (view === 'settings') {" not in content:
    content = content.replace("  if (view === 'notifications') {\n    return <NotificationsPage onBack={() => setView('sankey')} />;\n  }", "  if (view === 'notifications') {\n    return <NotificationsPage onBack={() => setView('sankey')} />;\n  }\n\n  if (view === 'settings') {\n    return <SettingsPage onBack={() => setView('sankey')} onClearData={handleClearData} isSyncing={isSyncing} />;\n  }")

# Remove modal
modal_pattern = re.compile(r'\{isSettingsOpen && \(\s*<div className="fixed inset-0 bg-slate-900/40.*?</div>\s*\)\}', re.DOTALL)
content = re.sub(modal_pattern, '', content)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
