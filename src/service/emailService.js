const nodemailer = require('nodemailer')

exports.sendEmail = async (email, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.privateemail.com',
      port: 587,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    })

    const message = {
      from: 'Fidroth Support',
      to: email,
      subject,
      html
    }

    await transporter.sendMail(message)
  } catch (error) {
    console.log(error)
  }
}

exports.sendEmailConfirmationOtp = async (email, firstName, otp) => {
  const subject = 'Email Confirmation OTP'
  const html = `
    <h1>Hello ${firstName},</h1>
    <h4>Your NatCycle OTP is <br /> <br />
    <strong
      style="font-size: 24px; color: #333;"
    >${otp}</strong></h4>
    <p>Use this OTP to verify your email address</p>

    <p>Thanks, <br /> NatCycle Team</p>

    <p style="font-size: 12px; color: #333;">
      If you didn't request this, please ignore this email.
    </p>
    </p>
  `

  await this.sendEmail(email, subject, html)
}