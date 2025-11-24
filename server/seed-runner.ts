import { db } from "../drizzle/db";
import { sql } from "drizzle-orm";
import { seedDatabase } from "./seed";

async function runSeeding() {
  try {
    console.log("🗑️  Clearing database...");
    
    // TRUNCATE all tables and reset identity sequences to ensure deterministic IDs
    await db.execute(sql`
      TRUNCATE TABLE 
        investigation_artifacts,
        call_notes,
        payer_communications,
        agent_feedback,
        agent_actions,
        agent_thoughts,
        agent_sessions,
        next_best_actions,
        territory_plans,
        ai_insights,
        detected_signals,
        prescription_history,
        clinical_events,
        switching_events,
        patients,
        hcps
      RESTART IDENTITY CASCADE
    `);
    
    console.log("✅ Database cleared successfully");
    console.log("🌱 Starting database seeding...");
    
    // Run the actual seeding
    await seedDatabase();
    
    console.log("🎉 Database seeding complete! HCP IDs reset: Dr. Smith=1, Dr. Chen=2, Dr. Wilson=3");
    process.exit(0);
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  }
}

// Run when executed directly
runSeeding();
