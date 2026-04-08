import axios from "axios";
import fs from "fs";
import path from "path";
import { Source } from "./models";

const SOURCES_DIR = path.resolve(__dirname, "../sources");
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export class IngestFetcher {
  
  /**
   * Fetches the source blob from URL. If it was downloaded recently, it reads from the local cache.
   * Returns the string content of the blocklist.
   */
  async fetchSource(source: Source): Promise<string> {
    // Note: this assumes format like stevenblack_hosts
    const providerDir = path.join(SOURCES_DIR, source.id);
    const blobPath = path.join(providerDir, "blob.txt");

    // Ensure the specific provider directory exists
    if (!fs.existsSync(providerDir)) {
      fs.mkdirSync(providerDir, { recursive: true });
    }

    // Check if cache exists and is fresh
    if (fs.existsSync(blobPath)) {
      const stats = fs.statSync(blobPath);
      const ageMs = Date.now() - stats.mtimeMs;
      if (ageMs < CACHE_TTL_MS) {
        console.log(`[CACHE HIT] 📦 Using local cached blob for ${source.name} (Age: ${(ageMs / 1000 / 60 / 60).toFixed(2)}h)`);
        return fs.readFileSync(blobPath, "utf-8");
      }
    }

    console.log(`[CACHE MISS] 📡 Downloading newest payload for ${source.name} from ${source.url}...`);
    try {
      const response = await axios.get(source.url, { responseType: 'text' });
      const data = response.data;
      
      // Save it local to the cache file
      fs.writeFileSync(blobPath, data, "utf-8");
      
      return data;
    } catch (err: any) {
      console.error(`❌ Fetcher failed for source ${source.name}: ${err.message}`);
      
      // Fallback to cache if available despite being stale
      if (fs.existsSync(blobPath)) {
        console.warn(`[FALLBACK] ⚠️ Using stale cache for ${source.name} due to fetch error.`);
        return fs.readFileSync(blobPath, "utf-8");
      }
      
      throw new Error(`Cannot retrieve data for ${source.id} and no local cache was found.`);
    }
  }
}
