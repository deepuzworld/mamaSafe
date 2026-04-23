import axios from 'axios';
import twilio from 'twilio';
const esl = require('modesl');

// Kannel Configuration
const KANNEL_HOST = process.env.KANNEL_HOST || 'http://localhost:13013';
const KANNEL_USER = process.env.KANNEL_USER || 'kannel_user';
const KANNEL_PASS = process.env.KANNEL_PASS || 'kannel_password';
const KANNEL_SMC = process.env.KANNEL_SMC || 'kannel_smsc'; // Optional depending on setup

// FreeSWITCH Configuration
const FS_HOST = process.env.FS_HOST || '127.0.0.1';
const FS_PORT = parseInt(process.env.FS_PORT || '8021');
const FS_PASS = process.env.FS_PASS || 'ClueCon';

// Twilio Fallback Configuration
const { 
    TWILIO_ACCOUNT_SID, 
    TWILIO_AUTH_TOKEN, 
    TWILIO_MESSAGING_SERVICE_SID,
    TWILIO_PHONE_NUMBER
} = process.env;

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) 
    : null;

/**
 * Send SMS via Kannel or Twilio Fallback
 */
export const sendSMS = async (to: string, message: string) => {
    // 1. Try Twilio if configured (for real-world testing)
    if (twilioClient && TWILIO_MESSAGING_SERVICE_SID) {
        try {
            const twilioRes = await twilioClient.messages.create({
                body: message,
                messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID,
                to: to
            });
            console.log(`[TWILIO SMS] Sent to ${to}. SID:`, twilioRes.sid);
            return { success: true, provider: 'twilio', sid: twilioRes.sid };
        } catch (err: any) {
            console.error(`[TWILIO SMS ERROR]`, err.message);
            // Fall through to Kannel if Twilio fails
        }
    }

    // 2. Fallback to Kannel (Simulated or via Modem)
    try {
        const response = await axios.get(`${KANNEL_HOST}/cgi-bin/sendsms`, {
            params: {
                username: KANNEL_USER,
                password: KANNEL_PASS,
                to: to,
                text: message,
                smsc: KANNEL_SMC
            }
        });
        console.log(`[KANNEL SMS] Sent to ${to}. Response:`, response.data);
        return { success: true, provider: 'kannel', data: response.data };
    } catch (error: any) {
        console.error(`[KANNEL SMS ERROR]`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Trigger Voice Call via Twilio or FreeSWITCH Fallback
 */
export const triggerCall = async (to: string, motherName: string) => {
    // 1. Try Twilio if configured (for real-world testing)
    if (twilioClient) {
        try {
            const callRes = await twilioClient.calls.create({
                twiml: `
                <Response>
                    <Pause length="1"/>
                    <Say voice="Google.en-IN-Standard-A" speed="0.9">
                        This is an urgent emergency alert from Mama Safe. 
                        Your partner, ${motherName}, has activated her emergency pulse. 
                        She requires immediate assistance. Please check on her now.
                    </Say>
                    <Pause length="1"/>
                    <Say voice="Google.en-IN-Standard-A">I repeat. Emergency alert for ${motherName}.</Say>
                </Response>`,
                to: to,
                from: TWILIO_PHONE_NUMBER || ''
            });
            console.log(`[TWILIO CALL] Triggered to ${to}. SID:`, callRes.sid);
            return { success: true, provider: 'twilio', sid: callRes.sid };
        } catch (err: any) {
            console.error(`[TWILIO CALL ERROR]`, err.message);
            // Fall through to FreeSWITCH
        }
    }

    // 2. Fallback to FreeSWITCH (Simulated or via Modem)
    return new Promise((resolve, reject) => {
        const conn = new esl.Connection(FS_HOST, FS_PORT, FS_PASS, () => {
            const message = `Emergency alert from MamaSafe. Your partner ${motherName} has activated the Red Button.`;
            const command = `originate {origination_caller_id_number=MamaSafe}sofia/gateway/gsm_modem/${to} &speak(flite|slt|'${message}')`;

            conn.api(command, (res: any) => {
                const result = res.getBody();
                console.log(`[FREESWITCH CALL] Result for ${to}:`, result);
                conn.disconnect();
                resolve({ success: true, provider: 'freeswitch', result });
            });
        });

        conn.on('error', (err: any) => {
            console.error('[FREESWITCH ERROR]', err);
            resolve({ success: false, error: err });
        });
    });
};
