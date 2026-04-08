import axios from "axios";
import fs from "fs";
import { loadCatalog } from "./catalog";
import { CompileConfig, Catalog } from "./models";
import { parseLine } from "./parsers";

export class CompilerPipeline {
  private catalog: Catalog;

  constructor(catalogPath: string) {
    this.catalog = loadCatalog(catalogPath);
  }

  async compile(config: CompileConfig): Promise<string> {
    const finalSet = new Set<string>();

    console.log("🚀 Rozpoczynam kompilację...");
    
    // 1. Fetch and Parse Sources
    for (const sourceId of config.activeSourceIds) {
      const source = this.catalog.sources.find(s => s.id === sourceId);
      if (!source) {
        console.warn(`[WARN] Zródło ${sourceId} nie znalezione w katalogu.`);
        continue;
      }

      console.log(`📡 Pobieranie ${source.name} [${source.format}] z ${source.url}...`);
      try {
        const response = await axios.get(source.url, { responseType: 'text' });
        const lines = response.data.split('\n');
        
        let count = 0;
        for (const line of lines) {
           const parsed = parseLine(line, source.format);
           if (parsed) {
             finalSet.add(parsed);
             count++;
           }
        }
        console.log(`✅ ${source.name}: Zmapowano ${count} domen.`);
      } catch (err: any) {
        console.error(`❌ Błąd pobierania ${source.name}: ${err.message}`);
      }
    }

    // 2. Apply Whitelists / Exceptions
    console.log(`\n🛡️ Stosowanie wyjątków (Whitelisting)...`);
    for (const groupId of config.activeExceptionGroupIds) {
      const group = this.catalog.exceptions_groups.find(g => g.id === groupId);
      if (group) {
        for (const domain of group.domains) {
          if (finalSet.has(domain)) {
            finalSet.delete(domain);
          }
        }
        console.log(`✅ Wyjątek zaaplikowany: ${group.name} (${group.domains.length} reguł)`);
      }
    }

    console.log(`\n🎉 Finalna wielkość ujednoliconego Setu: ${finalSet.size} unikalnych domen.`);

    // 3. Render Output
    console.log(`\n⚙️ Generowanie docelowego formatu: ${config.outputFormat}...`);
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


