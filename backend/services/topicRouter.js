const ALIASES = {
  "algebra": ["linear equations", "simultaneous equations", "quadratic equations", "inequalities", "indices", "logarithms", "sequences", "functions"],
  "geometry": ["angles", "triangles", "circles", "polygons", "coordinate geometry", "vectors", "mensuration"],
  "statistics": ["statistics", "data handling", "probability", "permutation and combination"],
  "mechanics": ["motion", "forces", "work energy power", "momentum", "projectile motion"],
  "electricity": ["current electricity", "electrostatics", "electric fields", "magnetism", "electromagnetism"],
  "waves": ["waves", "sound", "light", "optics"],
  "matter": ["matter", "atomic structure", "periodic table", "chemical bonding", "states of matter"],
  "life science": ["cells", "nutrition", "respiration", "reproduction", "genetics", "ecology", "human body"]
};

function normalizeTopic(topic) {
  return String(topic || "").toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function routeTopic(subject, topic) {
  const s = normalizeTopic(subject);
  const t = normalizeTopic(topic);
  for (const [route, aliases] of Object.entries(ALIASES)) {
    if (t === route || aliases.some(a => t === a || t.includes(a) || a.includes(t))) return route;
  }
  if (s.includes("physics")) return "mechanics";
  if (s.includes("chemistry")) return "matter";
  if (s.includes("biology")) return "life science";
  return t;
}

module.exports = { normalizeTopic, routeTopic, ALIASES };
