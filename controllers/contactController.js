const Contact = require('../models/contact');
const nodemailer = require('nodemailer');

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, area, message } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || email.trim() === '') {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (phone && !/^\d{7,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }
    if (area && area.length > 100) {
      return res.status(400).json({ success: false, message: 'Area value too long' });
    }
    if (message && message.length > 500) {
      return res.status(400).json({ success: false, message: 'Message too long' });
    }

    // Save to DB
    const contact = new Contact({ name, email, phone, area, message });
    await contact.save();

    // Email sending logic...
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'fullstackdeveloperabhi1@gmail.com',
        pass: 'geoe oqaq ngth kpfm',
      },
    });

    const mailOptions = {
      from: email,
      to: 'fullstackdeveloperabhi1@gmail.com',
      subject: 'New Contact Form Submission',
      html: `
        <h3>New Contact Request</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Area:</strong> ${area}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ success: true, message: 'Message sent and email delivered.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
