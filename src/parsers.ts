export function parseLine(line: string, format: string): string | null {
  line = line.trim();
  
  // Ignore comments and empty lines
  if (!line || line.startsWith("#") || line.startsWith("!")) {
    return null;
  }

  // Remove trailing comments after space or specific chars
  line = line.split("#")[0].split("!")[0].trim();

  let domain = "";

  switch (format) {
    case "hosts":
      // Format: 0.0.0.0 example.com or 127.0.0.1 example.com
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        if (parts[0] === "0.0.0.0" || parts[0] === "127.0.0.1") {
          domain = parts[1];
        } else {
          domain = parts[0];
        }
      } else {
        domain = line;
      }
      break;

    case "adblock":
      // simplified adblock to domain (e.g., ||example.com^ )
      if (line.startsWith("||") && line.endsWith("^")) {
        domain = line.slice(2, -1);
      } else if (line.startsWith("||")) {
          domain = line.slice(2);
      } else {
          return null; // Not a basic domain block
      }
      break;

    case "domains_wildcard":
    case "domains_plain":
      // e.g. *.example.com or just example.com
      if (line.startsWith("*.")) {
        domain = line.slice(2);
      } else {
        domain = line;
      }
      break;
    
    default:
      domain = line;
  }

  // Final cleanup: lowercase
  domain = domain.toLowerCase();
  
  // rudimentary domain check (at least one dot and no slashes)
  if (domain.includes(".") && !domain.includes("/") && !domain.includes(":")) {
    return domain;
  }

  return null;
}
