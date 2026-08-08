import re

with open('src/components/SettingsPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('<h3 className="text-base font-semibold text-slate-900 mb-1">Account Integration</h3>', '<h3 className="text-base font-semibold text-slate-900 mb-1">Account</h3>')
content = content.replace('''<p className="text-sm text-slate-500 mb-4">
                  Manage your connected Google account and authentication settings.
                </p>''', '')

with open('src/components/SettingsPage.tsx', 'w') as f:
    f.write(content)
