const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const importNotification = `import { addNotification } from '../lib/notifications';\nimport { toast } from 'sonner';`;
content = content.replace(`import { toast } from 'sonner';`, importNotification);

const reminderEffect = `  useEffect(() => {
    if (!applications.length || !auth.currentUser) return;
    
    let isChecking = false;
    const checkReminders = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const now = new Date();
        let updated = false;
        
        for (const app of applications) {
          if (!app.nextInterviewDate || app.reminder === 'none' || app.reminderSent || !app.reminder) {
            continue;
          }

          const interviewTime = new Date(app.nextInterviewDate).getTime();
          let reminderTime = interviewTime;

          if (app.reminder === '15 mins') reminderTime -= 15 * 60 * 1000;
          else if (app.reminder === '1 hour') reminderTime -= 60 * 60 * 1000;
          else if (app.reminder === '2 hours') reminderTime -= 2 * 60 * 60 * 1000;
          else if (app.reminder === '1 day') reminderTime -= 24 * 60 * 60 * 1000;
          else if (app.reminder === '2 days') reminderTime -= 2 * 24 * 60 * 60 * 1000;
          else if (app.reminder === 'custom') {
            if (app.customReminderDate) {
              // Custom start date (midnight local time)
              const customStart = new Date(app.customReminderDate);
              reminderTime = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate()).getTime();
            }
          }

          // Trigger reminder if current time is past reminderTime and not yet past interviewTime
          // For custom reminders with end date, we trigger if within the date range.
          let shouldTrigger = false;
          
          if (app.reminder === 'custom') {
             if (app.customReminderDate) {
               const customStart = new Date(app.customReminderDate);
               const start = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate()).getTime();
               let end = interviewTime;
               if (app.customReminderEndDate) {
                 const customEnd = new Date(app.customReminderEndDate);
                 end = new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate(), 23, 59, 59, 999).getTime();
               } else {
                 end = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate(), 23, 59, 59, 999).getTime();
               }
               
               if (now.getTime() >= start && now.getTime() <= end) {
                 shouldTrigger = true;
               }
             }
          } else {
            if (now.getTime() >= reminderTime && now.getTime() <= interviewTime) {
              shouldTrigger = true;
            }
          }

          if (shouldTrigger) {
            let msg = \`Upcoming interview with \${app.company} at \${new Date(app.nextInterviewDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\`;
            if (now.getTime() > interviewTime) {
               // Ignore if it's already past the interview
               continue;
            }
            if (app.reminder !== 'custom') {
               msg = \`Upcoming interview with \${app.company} in \${app.reminder}\`;
            } else {
               msg = \`Reminder: Interview with \${app.company} is scheduled on \${new Date(app.nextInterviewDate).toLocaleDateString()}\`;
            }
            
            toast(msg, {
              icon: '⏰',
            });
            
            await updateApplication(app.id, { reminderSent: true });
            await addNotification(auth.currentUser.uid, 'reminder', \`Interview Reminder: \${app.company}\`, msg);
            updated = true;
          }
        }
        
        if (updated) {
           loadData();
        }
      } catch (err) {
        console.error("Reminder check failed", err);
      } finally {
        isChecking = false;
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [applications]);

  const loadData = async () => {`;

content = content.replace(`  const loadData = async () => {`, reminderEffect);

fs.writeFileSync('src/components/Dashboard.tsx', content);
