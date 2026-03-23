import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Real-World API Proxy: OpenFDA
  app.get("/api/fda/drug", async (req, res) => {
    const { query } = req.query;
    try {
      const response = await axios.get(`https://api.fda.gov/drug/label.json?search=description:"${query}"&limit=1`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data from OpenFDA" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", engine: "AetherMed Real-World Pipeline" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
