import fs from "fs";
import { loadCatalog } from "./catalog";
import { CompileConfig, Catalog } from "./models";
import { parseLine } from "./parsers";
import { IngestFetcher } from "./fetcher";

export class CompilerPipeline {
  private catalog: Catalog;
  private fetcher: IngestFetcher;

  constructor(catalogPath: string) {
    this.catalog = loadCatalog(catalogPath);
    this.fetcher = new IngestFetcher();
  }

  async compile(config: CompileConfig): Promise<string> {
    const finalSet = new Set<string>();

    console.log("🚀 Starting compilation process...");
    
    // 1. Fetch and Parse Sources using smart caching engine
    for (const sourceId of config.activeSourceIds) {
      const source = this.catalog.sources.find(s => s.id === sourceId);
      if (!source) {
        console.warn(`[WARN] Source ${sourceId} not found in catalog.`);
        continue;
      }

      try {
        const rawData = await this.fetcher.fetchSource(source);
        const lines = rawData.split('\n');
        
        let count = 0;
        for (const line of lines) {
           const parsed = parseLine(line, source.format);
           if (parsed) {
             finalSet.add(parsed);
             count++;
           }
        }
        console.log(`✅ ${source.name}: Extracted and mapped ${count} valid domains.`);
      } catch (err: any) {
        console.error(`❌ Failed to process ${source.name}: ${err.message}`);
      }
    }

    // 2. Apply Whitelists / Exceptions
    console.log(`\n🛡️ Applying exceptions and whitelists...`);
    for (const groupId of config.activeExceptionGroupIds) {
      const group = this.catalog.exceptions_groups.find(g => g.id === groupId);
      if (group) {
        for (const domain of group.domains) {
          if (finalSet.has(domain)) {
            finalSet.delete(domain);
          }
        }
        console.log(`✅ Exception group applied: ${group.name} (${group.domains.length} override rules)`);
      }
    }

    console.log(`\n🎉 Final unified set size: ${finalSet.size} unique domains.`);

    // 3. Render Output format
    console.log(`\n⚙️ Generating output format: ${config.outputFormat}...`);
    let output = "";

    if (config.outputFormat === "unbound") {
      output += "server:\n";
      for (const domain of finalSet) {
        output += `local-zone: "${domain}" always_nxdomain\n`;
      }
    } else if (config.outputFormat === "pihole") {
      for (const domain of finalSet) {
        output += `0.0.0.0 ${domain}\n`;
      }
    } 

    return output;
  }
}
