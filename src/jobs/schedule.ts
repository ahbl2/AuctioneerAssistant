import schedule from "node-schedule";
import { runDiscoveryOnce } from "../scraper/discovery";
import { enrichChangedItems } from "../scraper/detail";
import { log } from "../utils/logging";

export function startScheduler() {
  const interval = Number(process.env.SCAN_INTERVAL_MINUTES || 7);

  schedule.scheduleJob(`*/${interval} * * * *`, async () => {
    const t0 = Date.now();
    log.info("Discovery start");
    try {
      await runDiscoveryOnce();
      await enrichChangedItems();
      const ms = Date.now() - t0;
      log.info("Discovery+Detail finished", { duration_ms: ms });
    } catch (e) {
      log.error("Scheduler cycle error", e);
    }
  });
}
