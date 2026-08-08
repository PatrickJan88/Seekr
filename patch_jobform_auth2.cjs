const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

const oldHandler = `onChange={async (e) => {
                  const checked = e.target.checked;
                  if (checked && !sessionStorage.getItem('google_access_token')) {
                    try {
                      await googleSignIn();
                      setSyncCalendar(true);
                    } catch (err) {
                      console.error("Failed to get calendar permission:", err);
                      setSyncCalendar(false);
                    }
                  } else {
                    setSyncCalendar(checked);
                  }
                }}`;

const newHandler = `onChange={async (e) => {
                  const checked = e.target.checked;
                  if (checked) {
                    if (!sessionStorage.getItem('google_access_token') || saveError?.includes('Calendar permission')) {
                       try {
                         await googleSignIn();
                         setSyncCalendar(true);
                         setSaveError(null);
                       } catch (err) {
                         console.error("Failed to get calendar permission:", err);
                         setSyncCalendar(false);
                       }
                    } else {
                       setSyncCalendar(true);
                    }
                  } else {
                    setSyncCalendar(false);
                  }
                }}`;

content = content.replace(oldHandler, newHandler);

fs.writeFileSync('src/components/JobForm.tsx', content);
