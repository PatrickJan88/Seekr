const fs = require('fs');
let content = fs.readFileSync('src/components/JobForm.tsx', 'utf8');

if (!content.includes("import { toast }")) {
    content = content.replace("import { auth, googleSignIn } from '../lib/firebase';", "import { auth, googleSignIn } from '../lib/firebase';\nimport { toast } from 'sonner';");
}

const oldHandler = `} catch (err) {
                         console.error("Failed to get calendar permission:", err);
                         setSyncCalendar(false);
                       }`;

const newHandler = `} catch (err: any) {
                         if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
                           console.log("Calendar permission popup closed.");
                         } else {
                           console.error("Failed to get calendar permission:", err);
                           toast.error("Failed to get calendar permission.");
                         }
                         setSyncCalendar(false);
                       }`;

content = content.replace(oldHandler, newHandler);

fs.writeFileSync('src/components/JobForm.tsx', content);
