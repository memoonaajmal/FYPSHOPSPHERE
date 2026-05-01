const express = require('express');
let io;
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const http = require("http");
const { Server } = require("socket.io");
dotenv.config();

const PORT = process.env.PORT || 4000;

const connectDB = require('./utils/connectDB');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
const productsRoutes = require('./routes/products.routes');
const facetsRoutes = require('./routes/facets.routes');
const storeRoutes = require('./routes/store.routes');
const orderRoutes = require('./routes/orderRoutes');
const jazzcashRoutes = require('./routes/jazzcashRoutes');
const { notFound, errorHandler } = require('./middleware/errors');
const adminRoutes = require('./routes/admin.routes');
const sellerRoutes = require('./routes/seller.routes');
const uploadRoutes = require("./routes/uploadRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const streamRoutes = require("./routes/streamRoutes");
const chatbotRoutes = require("./routes/chatbot.routes");
const chatRoutes = require("./routes/chat.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const stripeRoutes = require('./routes/stripe.routes');

const cartRouter = require ("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");


const app = express();

// Make io accessible globally before routes
app.use((req, res, next) => {
  req.io = io;
  next();
});


// Security & middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());

// CORS setup
const cors = require('cors');
const corsOrigins = (process.env.CORS_ORIGINS || '').trim();
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (corsOrigins === '*' || !corsOrigins) return callback(null, true);
    const allowed = corsOrigins.split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Serve images with proper cross-origin headers
const imagesPath = path.join(__dirname, "../data/images");

app.use("/images", (req, res, next) => {
  // Allow all origins to access images
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Prevent browser from cancelling image load
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  next();
});

app.use("/images", express.static(imagesPath));

const uploadsPath = path.join(__dirname, "../uploads");
app.use("/uploads", (req, res, next) => {
  // Allow cross-origin access
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
app.use("/uploads", express.static(uploadsPath));

// Add this logger before store routes
app.use("/api/stores", (req, res, next) => {
  console.log("🧾 Incoming request to /api/stores:", req.method, req.path);
  next();
});


app.use('/api/stripe/webhook', (req, res, next) => {
  console.log('HEADERS:', JSON.stringify(req.headers, null, 2));
  next();
});
app.use('/api/stripe', stripeRoutes);


// Mount store routes (multer handles multipart form data here)
app.use("/api/stores", storeRoutes);

// Now enable JSON parsing for other routes
app.use(express.json({ limit: '2mb' }));

// Mount the rest
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/facets', facetsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/jazzcash', jazzcashRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use('/api/streams', streamRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/recommendation", recommendationRoutes);
app.use("/api/wishlist", wishlistRoutes); 

app.use("/api/cart", cartRouter); 
     

// Swagger docs (optional)
try {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./utils/swaggerSpec');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} catch (e) {
  logger.warn('Swagger UI not available: ' + e.message);
}

// Healthcheck
const Product = require('./models/Product');
app.get('/api/health', async (req, res) => {
  const total = await Product.estimatedDocumentCount().catch(() => 0);
  res.json({
    status: 'ok',
    db: require('./utils/getDBStatus')(),
    counts: { products: total }
  });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
connectDB()
  .then(() => {
    const server = http.createServer(app);

io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Import and apply socket logic
const { setupSocket } = require("./socket");
setupSocket(io);
  
    server.listen(PORT, () => {
      logger.info(`Server (HTTP + WebSocket) running on port ${PORT}`);
      console.log(`Server (HTTP + WebSocket) running on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Startup error', err);
    process.exit(1);
  });

