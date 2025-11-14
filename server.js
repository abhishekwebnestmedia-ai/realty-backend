
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const morgan = require("morgan");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");

dotenv.config();
connectDB();

const app = express();

// ----------------------------------------
// ✅ CORS Configuration
// ----------------------------------------
const allowedOrigins = [
  "https://realtyxpo.in",
  "https://crm.realtyxpo.in",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow server-to-server or curl
      if (!allowedOrigins.includes(origin)) {
        const msg = `❌ CORS blocked: ${origin}`;
        console.warn(msg);
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// ----------------------------------------
// ✅ Routes
// ----------------------------------------

app.use("/api/auth", require("./routes/authroute"));
app.use("/api/submitform", require("./routes/contactroute"));
app.use("/api/realtleads", require("./routes/leadroute"));
app.use("/api/inventry", require("./routes/inventryroute"));
app.use("/api/dailytask", require("./routes/dailyroute"));
app.use("/api/projects", require("./routes/projectroute"));
app.use("/api/broker", require("./routes/brokeroute"));
app.use("/api/dailyreport", require("./routes/dailyreportroute"));
app.use("/api/groups", require("./routes/grouproute"));
app.use("/api/broadcasts", require("./routes/broadcastroute"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/card", require("./routes/card"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/learn", require("./routes/learnroute"));
app.use("/api/database", require("./routes/databaseRoutes"));



// ----------------------------------------
// ✅ Root Route
// ----------------------------------------
app.get("/", (req, res) => {
  res.send("CRM backend server is running 🚀");
});

// ----------------------------------------
// ✅ SOCKET.IO SETUP
// ----------------------------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 60000,
});

app.set("io", io);
global.io = io;

// ----------------------------------------
// 🧠 SOCKET CONNECTION HANDLERS
// ----------------------------------------
io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  //
  // 🧠 register_user — accepts string OR object with userId + role
  //
  socket.on("register_user", (data) => {
    let userId = null;
    let role = null;

    // Accept string or object
    if (typeof data === "string") {
      userId = data;
    } else if (data && typeof data === "object") {
      userId = data.userId || data._id || data.id;
      role = data.role;
    }

    if (!userId) {
      console.warn("⚠️ register_user called without valid userId:", data);
      return;
    }

    socket.join(userId); // optional personal room
    socket.join(`notif_${userId}`); // notification room
    
    // ✅ Join admin room if user is admin
    if (role === 'admin') {
      socket.join('notif_admin');
      console.log(`👑 Admin ${userId} joined rooms: ${userId}, notif_${userId}, notif_admin`);
    } else {
      console.log(`👤 User ${userId} joined rooms: ${userId}, notif_${userId}`);
    }

    // confirm registration
    socket.emit("registered_success", { message: `Joined notif_${userId}` });
  });

  //
  // 🔔 subscribe_notifications — optional explicit subscription with role support
  //
  socket.on("subscribe_notifications", (data) => {
    let userId = null;
    let role = null;
    
    if (typeof data === "string") {
      userId = data;
    } else if (data && typeof data === "object") {
      userId = data.userId || data._id || data.id;
      role = data.role;
    }

    if (!userId) {
      console.warn("⚠️ subscribe_notifications called without valid userId:", data);
      return;
    }

    socket.join(`notif_${userId}`);
    
    // ✅ Join admin room if user is admin
    if (role === 'admin') {
      socket.join('notif_admin');
      console.log(`🔔👑 Admin ${userId} subscribed to notif_${userId} and notif_admin`);
    } else {
      console.log(`🔔 User ${userId} subscribed to notif_${userId}`);
    }
  });

  //
  // 🟢 Group broadcast room join/leave
  //
  socket.on("join_group", ({ groupId }) => {
    if (!groupId) return;
    socket.join(`broadcast_${groupId}`);
    console.log(`📡 Socket ${socket.id} joined broadcast_${groupId}`);
  });

  socket.on("leave_group", ({ groupId }) => {
    if (!groupId) return;
    socket.leave(`broadcast_${groupId}`);
    console.log(`🚪 Socket ${socket.id} left broadcast_${groupId}`);
  });

  // Optional aliases for frontend compatibility
  socket.on("broadcast:join", ({ groupId }) => {
    if (!groupId) return;
    socket.join(`broadcast_${groupId}`);
  });

  socket.on("broadcast:leave", ({ groupId }) => {
    if (!groupId) return;
    socket.leave(`broadcast_${groupId}`);
  });

  //
  // 🔄 Ping test
  //
  socket.on("ping_test", (msg) => {
    console.log("Ping from client:", msg);
    socket.emit("pong_test", "Pong working fine 👌");
  });

  //
  // ❌ Disconnect handler
  //
  socket.on("disconnect", (reason) => {
    console.log(`❌ Socket disconnected (${socket.id}): ${reason}`);
  });
});

// ----------------------------------------
// ✅ FOLLOW-UP CRON SERVICE
// ----------------------------------------
require("./services/followupCronService");
require("./services/autoDeleteOldNotifications");

// ----------------------------------------
// ✅ TEST SOCKET ENDPOINTS (manual trigger)
// ----------------------------------------
app.get("/api/test-socket", (req, res) => {
  res.set("Cache-Control", "no-store"); // prevents 304 caching

  if (global.io) {
    console.log("📢 Manual test emit triggered");
    global.io.emit("followup_notification", {
      type: "Test",
      message: "Manual test notification from /api/test-socket endpoint",
      createdAt: new Date().toISOString(),
    });
    return res.json({
      success: true,
      message: "Test notification emitted ✅",
    });
  }

  res
    .status(500)
    .json({ success: false, message: "Socket.IO not initialized ❌" });
});

// ✅ Test admin notifications specifically
app.get("/api/test-admin-notification", (req, res) => {
  res.set("Cache-Control", "no-store");

  if (global.io) {
    console.log("📢👑 Admin notification test triggered");
    const payload = {
      type: "Admin Test",
      message: "Test notification for admins only - from /api/test-admin-notification",
      createdAt: new Date().toISOString(),
    };
    
    global.io.to("notif_admin").emit("notification_received", payload);
    
    return res.json({
      success: true,
      message: "Admin notification emitted to notif_admin room ✅",
      payload,
    });
  }

  res.status(500).json({ 
    success: false, 
    message: "Socket.IO not initialized ❌" 
  });
});

// ----------------------------------------
// ✅ START SERVER
// ----------------------------------------
const PORT = process.env.PORT || 5000;
server
  .listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️ Port ${PORT} in use, trying ${PORT + 1}...`);
      server.listen(PORT + 1);
    } else {
      console.error("❌ Server error:", err);
    }
  });

  

  

