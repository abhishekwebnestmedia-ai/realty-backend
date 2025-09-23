const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  'https://realtyxpo.in',
  'https://crm.realtyxpo.in',
  'http://localhost:3000',  
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // enable if cookies or auth headers are used
}));

app.use(express.json());
app.use(morgan('dev'));


const authRoutes = require('./routes/authroute');
const contactRoutes = require('./routes/contactroute');
const leadRoutes = require('./routes/leadroute');
const inventryRoutes = require('./routes/inventryroute');
const DailyTaskRoute = require("./routes/dailyroute");


app.use('/api/auth', authRoutes);
app.use('/api/submitform', contactRoutes);
app.use('/api/realtleads', leadRoutes);
app.use('/api/inventry', inventryRoutes);
app.use('/api/dailytask',DailyTaskRoute );


app.get('/', (req, res) => {
  res.send('CRM backend server is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});




