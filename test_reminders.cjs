const now = new Date();
console.log("now:", now.toString(), now.getTime());
const interviewTimeStr = "2026-08-07T12:00"; // Assuming they set today 12:00
const interviewTime = new Date(interviewTimeStr).getTime();
console.log("interviewTime:", new Date(interviewTimeStr).toString(), interviewTime);
let reminderTime = interviewTime;
reminderTime -= 60 * 60 * 1000;
console.log("reminderTime:", new Date(reminderTime).toString(), reminderTime);

if (now.getTime() >= reminderTime && now.getTime() <= interviewTime) {
  console.log("SHOULD TRIGGER");
} else {
  console.log("WILL NOT TRIGGER");
}
if (now.getTime() > interviewTime) {
  console.log("IS PAST INTERVIEW");
}
