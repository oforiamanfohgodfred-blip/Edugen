/* Ghana NaCCA CCP JHS Integrated Science structure.
   Source: NaCCA Science curriculum / scope and sequence.
   The same sub-strands recur across B7-B9, while indicators and depth
   increase by grade. Grade-specific objectives will be layered here next.
*/

const JHS_SCIENCE_STRANDS = {
  "Diversity of Matter": [
    "Materials",
    "Living Cells",
  ],
  Cycles: [
    "Earth Science",
    "Life Cycle of Organisms",
    "Crop Production",
    "Animal Production",
  ],
  Systems: [
    "The Human Body Systems",
    "The Solar System",
    "Ecosystem",
    "Farming Systems",
  ],
  "Forces and Energy": [
    "Energy",
    "Electricity and Electronics",
    "Force and Motion",
    "Agricultural Tools",
  ],
  "Humans and the Environment": [
    "Waste Management",
    "Human Health",
  ],
};

const JHS_SCIENCE_GRADES = {
  JHS1: JHS_SCIENCE_STRANDS,
  JHS2: JHS_SCIENCE_STRANDS,
  JHS3: JHS_SCIENCE_STRANDS,
};

function getJhsScienceStrands(grade) {
  return JHS_SCIENCE_GRADES[grade] || null;
}

function getJhsScienceTopics(grade) {
  const strands = getJhsScienceStrands(grade);
  if (!strands) return [];
  return Object.values(strands).flat();
}

module.exports = {
  JHS_SCIENCE_STRANDS,
  JHS_SCIENCE_GRADES,
  getJhsScienceStrands,
  getJhsScienceTopics,
};
