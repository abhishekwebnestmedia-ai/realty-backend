const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Import your auth routes
const authRoutes = require('./routes/authroute');

// Use auth routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('CRM backend server is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
