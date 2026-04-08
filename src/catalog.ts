import fs from "fs";
import yaml from "js-yaml";
import { Catalog, CatalogSchema } from "./models";

export function loadCatalog(path: string): Catalog {
  const fileContents = fs.readFileSync(path, "utf8");
  const data = yaml.load(fileContents);
  return CatalogSchema.parse(data);
}
