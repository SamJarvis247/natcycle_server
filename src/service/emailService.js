const nodemailer = require('nodemailer')

exports.sendEmail = async (email, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.privateemail.com',
      port: 587,
      auth: {
        user: 'noreply@vennloop.com',
        pass: 'venn23pass'
      }
    })

    const message = {
      from: 'noreply@vennloop.com',
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
  const subject = 'Natcycle OTP'

  const html = `
    <h2>Hello ${firstName},</h2>
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

exports.sendWelcomeEmail = async (email, firstName) => {
  const subject = 'Welcome to NatCycle'

  const html = `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Our Platform</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #204C27;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      text-align: center;
    }
    .content h2 {
      color: #333333;
    }
    .content p {
      color: #666666;
      font-size: 16px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #204C27;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      font-size: 16px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999999;
      font-size: 12px;
    }
    .footer a {
      color: #4CAF50;
      text-decoration: none;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="header">
      <h1>Welcome to Natcycle</h1>
    </div>

    <div class="content">
      <h2>Hello ${firstName},</h2>
      <p>
        We’re excited to have you on board! Thank you for signing up with us. 
      </p>
      <p>
        Whether you’re here to recycle, earn rewards, or make the world a better place, 
        we’re here to support you every step of the way.
      </p>
      <a href="#" class="button">Get Started</a>
    </div>

    <div class="footer">
      <p>Need help? <a href="#">Contact Support</a></p>
      <p>&copy; 2024 NatCycle. All rights reserved.</p>
    </div>
  </div>

</body>
</html>

  `

  await this.sendEmail(email, subject, html)
}
