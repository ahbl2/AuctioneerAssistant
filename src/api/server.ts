import { app } from "./routes";
import { ensureSchema } from "../db/schema";
import { startScheduler } from "../jobs/schedule";

ensureSchema();
startScheduler();

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
