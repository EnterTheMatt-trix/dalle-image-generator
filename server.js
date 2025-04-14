const express = require('express');
const axios = require('axios');
require('dotenv').config();
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
// Use environment PORT, fallback to 8080, with dynamic port finding if needed
let PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint for image generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size = '1024x1024' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log(`Processing image generation request for prompt: "${prompt.substring(0, 30)}..."`);

    // Make request to OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract image URL from the response
    if (response.data && response.data.data && response.data.data.length > 0) {
      console.log("Image generated successfully");
      return res.json({ imageUrl: response.data.data[0].url });
    } else {
      console.log("No image data returned from API");
      return res.status(500).json({ error: 'No image data returned from API' });
    }
  } catch (error) {
    console.error('Error generating image:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data || error.message
    });
  }
});

// Simple status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running', port: PORT });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Function to find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = require('http').createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // Port is in use, try the next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

// Start the server with dynamic port finding if needed
const startServer = async () => {
  try {
    // Try the configured port first
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running successfully on port ${PORT}`);
      console.log(`📋 API Status: http://localhost:${PORT}/api/status`);
      
      // If port is different than what's in package.json proxy, show warning
      if (PORT !== 8080) {
        console.log(`⚠️  Warning: Server running on port ${PORT}, but package.json proxy might be set to a different port.`);
        console.log(`   If you encounter connection issues, update your package.json proxy to: "http://localhost:${PORT}"`);
      }
    });
    
    server.on('error', async (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${PORT} is in use. Trying to find an available port...`);
        PORT = await findAvailablePort(PORT + 1);
        
        app.listen(PORT, () => {
          console.log(`🚀 Server running on alternative port ${PORT}`);
          console.log(`📋 API Status: http://localhost:${PORT}/api/status`);
          console.log(`⚠️  Important: Your package.json proxy needs to be updated to: "http://localhost:${PORT}"`);
        });
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();