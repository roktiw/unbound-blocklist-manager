export function parseLine(line: string, format: string): string | null {
  line = line.trim();
  
  // Ignore comments, HTML elements, and empty lines
  if (!line || line.startsWith("#") || line.startsWith("!") || line.startsWith("[")) {
    return null;
  }

  // Remove trailing comments after space or specific chars
  line = line.split("#")[0].split("!")[0].trim();

  let domain = "";

  switch (format) {
    case "hosts":
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        if (parts[0] === "0.0.0.0" || parts[0] === "127.0.0.1") {
          domain = parts[1];
        } else {
          domain = parts[0]; // fallback
        }
      } else {
        domain = line; // some hosts files only list domains
      }
      break;

    case "adblock":
      // AdBlock network filter syntax: ||domain.com^$options
      if (!line.startsWith("||")) return null;
      
      let raw = line.slice(2); // Remove ||
      
      // Extract hostname before any modifier or path
      const modifierIndex = raw.indexOf("^");
      if (modifierIndex !== -1) {
        raw = raw.slice(0, modifierIndex);
      } else {
        const optionIndex = raw.indexOf("$");
        if (optionIndex !== -1) {
             raw = raw.slice(0, optionIndex);
        }
      }
      
      // If the leftover still contains a slash, it's a URL path rule.
      // DNS firewalls cannot block specific paths, so we safely ignore this rule to avoid FP.
      if (raw.includes("/")) {
        return null;
      }
      
      domain = raw;
      break;

    case "domains_wildcard":
    case "domains_plain":
      if (line.startsWith("*.")) {
        domain = line.slice(2);
      } else {
        domain = line;
      }
      break;
    
    default:
      domain = line;
  }

  domain = domain.toLowerCase();
  
  // Strict regex check for valid domain name
  const validDomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
  if (validDomainRegex.test(domain)) {
    return domain;
  }

  return null;
}
