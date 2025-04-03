import express from 'express';
import session from 'express-session';
import memorystore from 'memorystore';
import { registerRoutes } from './routes.js';
import { log, setupVite, serveStatic } from './vite.js';

// Create MemoryStore constructor
const MemoryStore = memorystore(session);

// Create Express app
async function startServer() {
  const app = express();
  const port = process.env.PORT || 5000;
  
  // Parse JSON request bodies
  app.use(express.json());
  
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'secure-transfer-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
      },
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
    })
  );
  
  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });
  
  // Start the server
  const server = app.listen(port, '127.0.0.1', () => {
    log(`Server running on port ${port}`);
  });
  
  // Register API routes
  await registerRoutes(app);
  
  // Setup Vite in development mode
  if (process.env.NODE_ENV !== 'production') {
    await setupVite(app, server);
  } else {
    // Serve static files in production
    serveStatic(app);
  }
  
  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  });
  
  return server;
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});