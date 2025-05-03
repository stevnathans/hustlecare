export function parseRequirements(raw: string) {
    const categories = raw.split(/\n(?=[A-Z])/g);
    const parsed: { [key: string]: string[] } = {};
  
    categories.forEach((section) => {
      const [title, ...items] = section.split('\n').filter(Boolean);
      parsed[title.trim()] = items.map((item) => item.replace(/^- /, '').trim());
    });
  
    return parsed;
  }
  