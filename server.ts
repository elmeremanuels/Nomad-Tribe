import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  /**
   * ADVANCED MATCHMAKING API
   * Calculates overlaps between families based on fuzzy logic and geospatial proximity.
   */
  app.post("/api/matches", (req, res) => {
    const { userId, userTrips, allProfiles, allTrips } = req.body;
    
    // In a real app, this would query the DB
    // Here we implement the logic for the backend response
    const results = [];
    
    for (const uTrip of userTrips) {
      for (const oTrip of allTrips) {
        if (oTrip.familyId === userId) continue;
        
        const otherProfile = allProfiles.find((p: any) => p.id === oTrip.familyId);
        const userProfile = allProfiles.find((p: any) => p.id === userId);
        
        if (otherProfile && userProfile) {
          // Weighted Compatibility Logic
          let score = 0;
          const reasons = [];
          
          // Geospatial Radius (Haversine)
          const dist = calculateDistance(
            uTrip.coordinates.lat, uTrip.coordinates.lng,
            oTrip.coordinates.lat, oTrip.coordinates.lng
          );
          
          if (dist < 30) {
            score += 40;
            reasons.push("Nearby Match");
          }
          
          // Date Overlap
          const overlap = checkDateOverlap(uTrip.startDate, uTrip.endDate, oTrip.startDate, oTrip.endDate);
          if (overlap.isOverlapping) {
            score += 30;
            reasons.push("Date Overlap");
          } else if (overlap.isBriefCrossover) {
            score += 15;
            reasons.push("Brief Crossover");
          }
          
          // Kids Age
          const hasAgeMatch = userProfile.kids.some((uk: any) => 
            otherProfile.kids.some((ok: any) => Math.abs(uk.age - ok.age) <= 1)
          );
          if (hasAgeMatch) {
            score += 20;
            reasons.push("Kids Age Match");
          }
          
          if (score > 0) {
            results.push({
              matchId: `${uTrip.id}-${oTrip.id}`,
              family: otherProfile,
              score: Math.min(score, 100),
              reasons
            });
          }
        }
      }
    }
    
    res.json(results);
  });

  /**
   * MARKETPLACE RESERVATION LOGIC
   */
  app.post("/api/marketplace/reserve", (req, res) => {
    const { itemId, userId } = req.body;
    // 1. Check if item is available
    // 2. Update status to 'Reserved'
    // 3. Set expiration (48h)
    // 4. Return success and trigger notification logic
    res.json({ success: true, reservedUntil: new Date(Date.now() + 48 * 60 * 60 * 1000) });
  });

  // Helper functions for the server
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function checkDateOverlap(s1: string, e1: string, s2: string, e2: string) {
    const start1 = new Date(s1);
    const end1 = new Date(e1);
    const start2 = new Date(s2);
    const end2 = new Date(e2);
    
    const isOverlapping = start1 <= end2 && start2 <= end1;
    const gap = Math.abs(end1.getTime() - start2.getTime()) / (1000 * 60 * 60 * 24);
    const isBriefCrossover = !isOverlapping && gap <= 2;
    
    return { isOverlapping, isBriefCrossover };
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
