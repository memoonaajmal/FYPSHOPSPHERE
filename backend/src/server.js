const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 4000;
const IMAGES_BASE_URL = process.env.IMAGES_BASE_URL || '/static/images';
const IMAGES_DIR = process.env.IMAGES_DIR || './public/images';

const connectDB = require('./utils/connectDB');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
const productsRoutes = require('./routes/products.routes');
const facetsRoutes = require('./routes/facets.routes');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// CORS handling: support CORS_ORIGINS="*" or comma list
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

// Static images with long cache
const imagesDir = path.resolve(IMAGES_DIR);
app.use(IMAGES_BASE_URL, express.static(imagesDir, {
  setHeaders: (res, filePath) => {
    if (/(jpg|jpeg|png|gif|webp)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/facets', facetsRoutes);

// Swagger (basic)
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
  res.json({ status: 'ok', db: require('./utils/getDBStatus')(), counts: { products: total } });
});

// 404 + error
app.use(notFound);
app.use(errorHandler);

// Start
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Startup error', err);
    process.exit(1);
  });
