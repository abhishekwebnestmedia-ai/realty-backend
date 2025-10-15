// const express = require('express');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const morgan = require('morgan');
// const cors = require('cors');
// const { Server } = require("socket.io");
// const http = require('http');
// const path = require('path');

// dotenv.config();
// connectDB();

// const app = express();

// const allowedOrigins = [
//   'https://realtyxpo.in',
//   'https://crm.realtyxpo.in',
//   'http://localhost:3000', 
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.indexOf(origin) === -1) {
//       const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   },
//   credentials: true // enable if cookies or auth headers are used
// }));

// app.use(express.json());
// app.use(morgan('dev'));


// const authRoutes = require('./routes/authroute');
// const contactRoutes = require('./routes/contactroute');
// const leadRoutes = require('./routes/leadroute');
// const inventryRoutes = require('./routes/inventryroute');
// const DailyTaskRoute = require("./routes/dailyroute");
// const projectRoutes = require('./routes/projectroute');
// const brokerRoutes = require('./routes/brokeroute');



// // Routes
// const groupRoutes = require("./routes/grouproute");
// const broadcastRoutes = require("./routes/broadcastroute");
// const dailyReportRoutes = require('./routes/dailyreportroute');

// const notificationRoutes = require("./routes/notificationRoutes");

// const dashboardRoutes = require("./routes/card");


// app.use('/api/auth', authRoutes);
// app.use('/api/submitform', contactRoutes);
// app.use('/api/realtleads', leadRoutes);
// app.use('/api/inventry', inventryRoutes);
// app.use('/api/dailytask',DailyTaskRoute );
// app.use('/api/projects', projectRoutes);
// app.use('/api/broker', brokerRoutes);


// app.use('/api/dailyreport', dailyReportRoutes);

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));



// app.use("/api/groups", groupRoutes);
// app.use("/api/broadcasts", broadcastRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/card", dashboardRoutes);



// app.get('/', (req, res) => {
//   res.send('CRM backend server is running');
// });






// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" },
// });
// app.set("io", io); 

// global.io = io; // ✅ <-- IMPORTANT: allows cron service to send socket events

// io.on("connection", (socket) => {
//   console.log("✅ Socket connected:", socket.id);
//   socket.on("disconnect", () => console.log("❌ Socket disconnected:", socket.id));
// });

// // ----------------------------------------
// // ✅ START FOLLOW-UP CRON SERVICE
// // ----------------------------------------
// require("./services/followupCronService"); // <--- ADD THIS LINE

// // ----------------------------------------
// // ✅ START SERVER
// // ----------------------------------------
// // const PORT = process.env.PORT || 5000;
// // server.listen(PORT, () => {
// //   console.log(` Server running on http://localhost:${PORT}`);
// // });


// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
//   .on('error', (err) => {
//     if (err.code === 'EADDRINUSE') {
//       console.log(`⚠️ Port ${PORT} is in use, trying ${PORT + 1}...`);
//       server.listen(PORT + 1);
//     }
//   });


const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');
const { Server } = require("socket.io");
const http = require('http');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

// ----------------------------------------
// ✅ CORS Configuration
// ----------------------------------------
const allowedOrigins = [
  'https://realtyxpo.in',
  'https://crm.realtyxpo.in',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow server-to-server or curl
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

// ----------------------------------------
// ✅ Routes
// ----------------------------------------
app.use('/api/auth', require('./routes/authroute'));
app.use('/api/submitform', require('./routes/contactroute'));
app.use('/api/realtleads', require('./routes/leadroute'));
app.use('/api/inventry', require('./routes/inventryroute'));
app.use('/api/dailytask', require("./routes/dailyroute"));
app.use('/api/projects', require('./routes/projectroute'));
app.use('/api/broker', require('./routes/brokeroute'));
app.use('/api/dailyreport', require('./routes/dailyreportroute'));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/groups", require("./routes/grouproute"));
app.use("/api/broadcasts", require("./routes/broadcastroute"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/card", require("./routes/card"));

// ----------------------------------------
// ✅ Root Route
// ----------------------------------------
app.get('/', (req, res) => {
  res.send('CRM backend server is running 🚀');
});

// ----------------------------------------
// ✅ SOCKET.IO SETUP
// ----------------------------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // for now allow all; tighten later
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
global.io = io; // ✅ allows emits from other files (like cron or controllers)

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ----------------------------------------
// ✅ FOLLOW-UP CRON SERVICE (import AFTER io is ready)
// ----------------------------------------
require("./services/followupCronService");

// ----------------------------------------
// ✅ TEST SOCKET ENDPOINT (for manual verification)
// ----------------------------------------
app.get("/test-socket", (req, res) => {
  if (global.io) {
    console.log("📢 Manual test emit triggered");
    global.io.emit("followup_notification", {
      type: "Test",
      message: "Manual test notification from /test-socket endpoint",
    });
    res.json({ success: true, message: "Test notification emitted" });
  } else {
    res.status(500).json({ success: false, message: "Socket.IO not initialized" });
  }
});

// ----------------------------------------
// ✅ START SERVER
// ----------------------------------------
const PORT = process.env.PORT || 5000;
server
  .listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${PORT} is in use, trying ${PORT + 1}...`);
      server.listen(PORT + 1);
    } else {
      console.error('❌ Server error:', err);
    }
  });
