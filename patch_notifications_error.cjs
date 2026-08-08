const fs = require('fs');
let content = fs.readFileSync('src/lib/notifications.ts', 'utf8');

content = content.replace(
  `    data.sort((a, b) => b.timestamp - a.timestamp);
    callback(data);
  });`,
  `    data.sort((a, b) => b.timestamp - a.timestamp);
    callback(data);
  }, (error) => {
    console.warn("Notification listener error:", error);
  });`
);

fs.writeFileSync('src/lib/notifications.ts', content);
