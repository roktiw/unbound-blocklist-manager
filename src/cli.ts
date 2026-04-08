import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { CompilerPipeline } from "./pipeline";
import { CompileConfig } from "./models";

async function main() {
  console.log("=========================================");
  console.log("🔵 Unbound Blocklist Generator (UBG) CLI");
  console.log("=========================================\n");

  const catalogPath = path.join(__dirname, "../catalog.yaml");
  const profilesDir = path.join(__dirname, "../profiles");
  const outDir = path.join(__dirname, "../dist_out");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const compiler = new CompilerPipeline(catalogPath);

  const files = fs.readdirSync(profilesDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  
  if (files.length === 0) {
    console.log("❌ Nie znaleziono żadnych profili konfiguracyjnych w folderze profiles/");
    process.exit(1);
  }

  for (const file of files) {
    console.log(`\n\n--- 🚀 Kompilacja Profilu: ${file} ---`);
    const profilePath = path.join(profilesDir, file);
    const profileContent = fs.readFileSync(profilePath, "utf8");
    const rawConfig = yaml.load(profileContent) as CompileConfig & { name?: string };

    const start = Date.now();
    try {
      const outputString = await compiler.compile({
        activeSourceIds: rawConfig.activeSourceIds || [],
        activeExceptionGroupIds: rawConfig.activeExceptionGroupIds || [],
        outputFormat: rawConfig.outputFormat || "unbound"
      });

      const ext = rawConfig.outputFormat === "pihole" ? "txt" : "conf";
      const outFileName = `${path.basename(file, path.extname(file))}.${ext}`;
      const outputPath = path.join(outDir, outFileName);
      fs.writeFileSync(outputPath, outputString);
      
      const end = Date.now();
      console.log(`\n✅ Profil [${rawConfig.name || file}] zapisany do: ${outputPath} w ${((end - start)/1000).toFixed(2)}s\n`);
    } catch (e: any) {
        console.error(`❌ Błąd podczas kompilacji profilu ${file}: ${e.message}`);
    }
  }
}

main().catch(console.error);
