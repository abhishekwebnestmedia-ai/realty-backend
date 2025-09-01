const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan'); // <-- import Morgan

dotenv.config();
connectDB();

const app = express();

// --- Middlewares ---
app.use(express.json());      // parse JSON bodies
app.use(morgan('dev'));       // <-- log requests in dev format

// --- Routes ---
const authRoutes = require('./routes/authroute');
app.use('/api/auth', authRoutes);

// --- Test route ---
app.get('/', (req, res) => {
  res.send('CRM backend server is running');
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
