import "dotenv/config";
import { Database } from "../src/common/database";
import { seedData } from "./seed-data";
if (
  process.env.NODE_ENV === "production" ||
  process.env.DEMO_ENABLED !== "true"
)
  throw new Error(
    "Demo seeding requires DEMO_ENABLED=true outside production.",
  );
const db = new Database();
db.$transaction(seedData, { timeout: 60000 })
  .then(() => console.log("Demo seed complete."))
  .finally(() => db.$disconnect());
