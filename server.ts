import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  // Player state
  const players: Record<string, any> = {};
  
  // Cores disponíveis para os jogadores
  const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ffffff', '#000000'];

  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);
    
    if (Object.keys(players).length >= 3) {
      console.log("Server full, disconnecting:", socket.id);
      socket.emit("serverFull");
      socket.disconnect();
      return;
    }
    
    // Assign a random color
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    players[socket.id] = {
      id: socket.id,
      x: 0, 
      y: 0, 
      z: 25,
      rotation: 0,
      action: 'Idle',
      color: color
    };

    // Send current players to the new player
    socket.emit("currentPlayers", players);
    // Tell others about the new player
    socket.broadcast.emit("newPlayer", players[socket.id]);

    socket.on("playerMovement", (data) => {
      if (players[socket.id]) {
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        players[socket.id].z = data.z;
        players[socket.id].rotation = data.rotation;
        players[socket.id].action = data.action;
        // Broadcast to others
        socket.broadcast.emit("playerMoved", players[socket.id]);
      }
    });

    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);
      delete players[socket.id];
      io.emit("playerDisconnected", socket.id);
    });
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
