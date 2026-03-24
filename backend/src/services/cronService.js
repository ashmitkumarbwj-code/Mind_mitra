import cron from 'node-cron';
import { getInactiveUsers } from './dbService.js';
import { sendProactiveEmail } from './emailService.js';

export const initCronJobs = () => {
    console.log("Cron jobs initialized.");
    
    // Accelerate for Demo: Runs every MINUTE instead of daily
    cron.schedule('* * * * *', async () => {
        console.log('[CRON] Running Demo-Mode Inactivity Tracker (1m cycle)...');
        
        const { saveAlert } = await import('./dbService.js');

        // Check for 24-hour inactivity
        const inactive24h = await getInactiveUsers(24);
        inactive24h.forEach(user => {
            sendProactiveEmail(user, '24_HOUR_REMINDER');
        });

        // Check for 15-day escalation
        const inactive15Days = await getInactiveUsers(15 * 24);
        inactive15Days.forEach(user => {
            if (user.emergency_contact_phone) {
                console.log(`[CRON] ESCALATION: Notifying contact for ${user.email}`);
                saveAlert(user.id, 'INACTIVITY_ESCALATION', `User inactive for 15+ days. Attempting contact: ${user.emergency_contact_phone}`);
                sendProactiveEmail(user, 'INACTIVITY_ESCALATION');
            }
        });
    });
};
