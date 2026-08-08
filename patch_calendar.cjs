const fs = require('fs');
let content = fs.readFileSync('src/lib/calendar.ts', 'utf8');

content = content.replace(
  `    if (!res.ok) {
      const err = await res.json();
      console.error('Calendar API Error:', err);
      return null;
    }`,
  `    if (!res.ok) {
      const err = await res.json();
      console.error('Calendar API Error:', err);
      if (err.error?.code === 401 || err.error?.code === 403) {
        throw new Error("Calendar permission denied. Please re-authenticate and ensure you check the box to grant Google Calendar access.");
      }
      throw new Error("Failed to create calendar event.");
    }`
);

fs.writeFileSync('src/lib/calendar.ts', content);
