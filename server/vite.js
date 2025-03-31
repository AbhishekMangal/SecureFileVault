import path from 'path';
import fs from 'fs';
import express from 'express';

// Logger function
export function log(message, source = "express") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

// Set up Vite in development mode
export async function setupVite(app, server) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Configure Vite
    const { createServer: createViteServer } = await import('vite');
    const viteServer = await createViteServer({
      root: path.resolve(process.cwd()),
      server: {
        middlewareMode: true,
        hmr: {
          server
        }
      },
      appType: 'spa'
    });

    // Use Vite middleware
    app.use(viteServer.middlewares);

    // Handle HTML requests
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      
      // Skip API requests
      if (url.startsWith('/api')) {
        return next();
      }

      try {
        const htmlPath = path.resolve(process.cwd(), 'client/index.html');
        let template = fs.readFileSync(htmlPath, 'utf-8');
        template = await viteServer.transformIndexHtml(url, template);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        viteServer.ssrFixStacktrace(e);
        console.error('Vite error:', e);
        next(e);
      }
    });
  } catch (e) {
    console.error('Vite setup error:', e);
  }
}

// Serve static files in production
export function serveStatic(app) {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
}