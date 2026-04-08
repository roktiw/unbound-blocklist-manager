import { z } from "zod";

export const SourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  format: z.enum(["domains_wildcard", "domains_plain", "hosts", "adblock"]),
  category: z.array(z.string()),
  region: z.string(),
  description: z.string().optional(),
  recommended: z.boolean().default(false),
});

export const ExceptionGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  domains: z.array(z.string()),
});

export const CatalogSchema = z.object({
  categories: z.array(z.object({ id: z.string(), name: z.string() })),
  sources: z.array(SourceSchema),
  exceptions_groups: z.array(ExceptionGroupSchema),
});

export type Source = z.infer<typeof SourceSchema>;
export type ExceptionGroup = z.infer<typeof ExceptionGroupSchema>;
export type Catalog = z.infer<typeof CatalogSchema>;

export interface CompileConfig {
  activeSourceIds: string[];
  activeExceptionGroupIds: string[];
  outputFormat: "unbound" | "pihole";
}
