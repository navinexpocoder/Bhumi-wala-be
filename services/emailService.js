const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

const canSendEmail = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

class EmailService {
  async sendOfflineMessageNotification({
    receiverEmail,
    receiverName,
    senderName,
    propertyTitle,
    previewMessage,
  }) {
    if (!canSendEmail()) {
      logger.warn('SMTP environment variables are missing. Skipping offline email notification.');
      return false;
    }

    try {
      const mailer = getTransporter();
      await mailer.sendMail({
        from: process.env.SMTP_FROM,
        to: receiverEmail,
        subject: `New message from ${senderName}`,
        text: `Hi ${receiverName || 'there'},\n\nYou have a new message about "${propertyTitle || 'a property'}".\n\nMessage: "${previewMessage}"\n\nPlease log in to your Bhumi account to reply.\n`,
      });

      logger.info(`Offline message email sent to ${receiverEmail}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send offline message email: ${error.message}`);
      return false;
    }
  }
}

module.exports = new EmailService();
