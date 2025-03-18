const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer"); // For sending emails
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Student Schema
const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    classAppearingFor: { type: String, required: true },
    previousSchool: { type: String, required: true },
    mobileNumber: { type: String, required: true, match: /^[0-9]{10}$/ },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use any email service (e.g., Gmail, Outlook)
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

// // Function to Send Email with Student Details
// const sendEmail = async (studentData) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER, // Sender email
//     to: process.env.EMAIL_USER, // Replace with your email ID
//     subject: `New Student Submission - ${studentData.name}`,
//     text: `
//       New student details submitted:
//       Name: ${studentData.name}
//       Address: ${studentData.address}
//       Class Appearing For: ${studentData.classAppearingFor}
//       Previous School: ${studentData.previousSchool}
//       Mobile Number: ${studentData.mobileNumber}
//       Submitted At: ${new Date(studentData.createdAt).toLocaleString()}
//     `,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log("Email sent successfully");
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// };

// API Endpoint to Save Student Data and Send Email
app.post(
  "/api/students",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("classAppearingFor")
      .trim()
      .notEmpty()
      .withMessage("Class is required"),
    body("previousSchool")
      .trim()
      .notEmpty()
      .withMessage("Previous School is required"),
    body("mobileNumber")
      .trim()
      .notEmpty()
      .withMessage("Mobile Number is required")
      .matches(/^[0-9]{10}$/)
      .withMessage("Mobile Number must be a valid 10-digit number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, address, classAppearingFor, previousSchool, mobileNumber } =
        req.body;
      const student = new Student({
        name,
        address,
        classAppearingFor,
        previousSchool,
        mobileNumber,
      });
      await student.save();

      // Send Email with student details
      // await sendEmail(student);

      res.status(201).json({
        message: "Student data saved and email sent successfully",
        data: student,
      });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

app.get("/", (req, res) => {
  res.send("Backend Server is Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
