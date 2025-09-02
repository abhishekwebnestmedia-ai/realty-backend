const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan'); 

dotenv.config();
connectDB();

const app = express();


app.use(express.json());      
app.use(morgan('dev'));      

const authRoutes = require('./routes/authroute');
const contactRoutes = require('./routes/contactroute');
const leadRoutes = require('./routes/leadroute');

app.use('/api/auth', authRoutes);
app.use("/api/submitform",contactRoutes);
app.use("/api/realtleads",leadRoutes);


app.get('/', (req, res) => {
  res.send('CRM backend server is running');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
