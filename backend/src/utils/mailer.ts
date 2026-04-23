import nodemailer from 'nodemailer';

export const sendPartnerInvite = async (partnerEmail: string, tempPassword: string, partnerName: string) => {
    try {
        let transporter;
        
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.ethereal.email',
                port: parseInt(process.env.SMTP_PORT || '587'),
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log('-----------------------------------');
            console.log(`[MAILER] No SMTP credentials found for Partner. Using Ethereal: ${testAccount.user}`);
        }

        const info = await transporter.sendMail({
            from: '"MamaSafe" <noreply@mamasafe.com>',
            to: partnerEmail,
            subject: 'You have been invited to MamaSafe!',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #0d9488;">Hello ${partnerName}!</h2>
                    <p>You have been invited as a partner on MamaSafe.</p>
                    <p>Please use the following credentials for your first login:</p>
                    <div style="background: #f0fdfa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Email:</strong> ${partnerEmail}</p>
                        <p><strong>Temporary Password:</strong> <span style="font-size: 1.2em; color: #0d9488; font-weight: bold;">${tempPassword}</span></p>
                    </div>
                    <p style="color: #be123c; font-weight: bold;">Security Action Required:</p>
                    <p>For your protection, you must reset your password immediately after logging in. You will not be able to access the dashboard until this is done.</p>
                    <p>Regards,<br/>MamaSafe Team</p>
                </div>
            `
        });

        console.log(`[EMAIL] Partner Invite sent to ${partnerEmail}`);
        if (!process.env.SMTP_USER) {
            console.log(`[PREVIEW URL] ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        console.error('Error sending partner invite email:', error);
    }
};

export const sendExpertInvite = async (email: string, tempPassword: string, name: string) => {
    try {
        let transporter;
        
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.ethereal.email',
                port: parseInt(process.env.SMTP_PORT || '587'),
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // Create test account for Ethereal if no creds provided
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log('-----------------------------------');
            console.log(`[MAILER] No SMTP credentials found. Using Ethereal test account: ${testAccount.user}`);
        }

        const info = await transporter.sendMail({
            from: '"MamaSafe" <noreply@mamasafe.com>',
            to: email,
            subject: 'Welcome to MamaSafe Expert Panel',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #059669;">Welcome to MamaSafe, Dr. ${name}!</h2>
                    <p>You have been added as a medical expert to our postpartum safety platform.</p>
                    <p>Please use the following credentials for your first login:</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>One-Time Password:</strong> <span style="font-size: 1.2em; color: #059669; font-weight: bold;">${tempPassword}</span></p>
                    </div>
                    <p style="color: #dc2626; font-weight: bold;">Important:</p>
                    <p>For security reasons, you will be required to change your password immediately after logging in. You will not be able to access patient sessions until this is completed.</p>
                    <p>Regards,<br/>MamaSafe Administration</p>
                </div>
            `
        });

        console.log(`[EMAIL] Expert Invite sent to ${email}`);
        if (!process.env.SMTP_USER) {
            console.log(`[PREVIEW URL] ${nodemailer.getTestMessageUrl(info)}`);
        }
        console.log('-----------------------------------');
    } catch (error) {
        console.error('Error sending expert invite email:', error);
    }
};


