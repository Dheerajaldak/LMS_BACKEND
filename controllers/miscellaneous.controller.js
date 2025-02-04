// controllers/miscellaneous.controller.js
import { validationResult } from 'express-validator';
import nodemailer from 'nodemailer'; // For sending emails

export const contactUs = async (req, res) => {
  const { name, email, message } = req.body;

  // Input validation (basic example)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Check if all fields are provided
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are mandatory 💬"
    });
  }

  // Check if the email format is valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format 🚫"
    });
  }

  try {
    // Optionally, send the contact form to an email address using nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // Set to true if using port 465 for SSL/TLS
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,  // Sender's email address
      to: process.env.CONTACT_US_EMAIL,  // Recipient's email address (your email)
      subject: 'New Contact Form Submission',
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Return a success response
    return res.status(200).json({
      success: true,
      message: "Form submitted successfully"
    });
  } catch (error) {
    console.error("Error while submitting contact form: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while submitting the form"
    });
  }
};
