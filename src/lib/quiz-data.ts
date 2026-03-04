export type Difficulty = "easy" | "intermediate" | "hard";

export interface Question {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: Difficulty;
}

export interface QuizResult {
  id: string;
  username: string;
  subject: string;
  correct: number;
  incorrect: number;
  total: number;
  date: string;
  difficulty: Difficulty;
}

export const subjects = [
  { id: "biology", name: "Biology", icon: "🧬" },
  { id: "chemistry", name: "Chemistry", icon: "⚗️" },
  { id: "physics", name: "Physics", icon: "⚛️" },
  { id: "english", name: "English Grammar", icon: "📖" },
  { id: "reasoning", name: "Logical Reasoning", icon: "🧠" },
];

export const sampleQuestions: Question[] = [
  // Biology
  { id: "b1", subject: "biology", question: "Which of the following organelles is known as the \"powerhouse of the cell\"?", options: ["Ribosome", "Nucleus", "Mitochondria", "Endoplasmic Reticulum"], correctAnswer: 2, difficulty: "easy" },
  { id: "b2", subject: "biology", question: "DNA replication occurs during which phase?", options: ["G1 Phase", "S Phase", "G2 Phase", "M Phase"], correctAnswer: 1, difficulty: "easy" },
  { id: "b3", subject: "biology", question: "Which enzyme unwinds the DNA double helix during replication?", options: ["DNA Polymerase", "Helicase", "Ligase", "Primase"], correctAnswer: 1, difficulty: "intermediate" },
  { id: "b4", subject: "biology", question: "The process of mRNA formation from DNA is called?", options: ["Translation", "Transcription", "Replication", "Transduction"], correctAnswer: 1, difficulty: "easy" },
  { id: "b5", subject: "biology", question: "Which blood group is known as the universal donor?", options: ["A", "B", "AB", "O"], correctAnswer: 3, difficulty: "easy" },
  { id: "b6", subject: "biology", question: "Krebs cycle occurs in which part of the cell?", options: ["Cytoplasm", "Nucleus", "Mitochondrial matrix", "Ribosome"], correctAnswer: 2, difficulty: "intermediate" },
  { id: "b7", subject: "biology", question: "Which hormone regulates blood sugar levels?", options: ["Thyroxine", "Insulin", "Adrenaline", "Glucagon"], correctAnswer: 1, difficulty: "easy" },
  { id: "b8", subject: "biology", question: "What is the basic structural and functional unit of the kidney?", options: ["Neuron", "Nephron", "Alveoli", "Villi"], correctAnswer: 1, difficulty: "intermediate" },
  { id: "b9", subject: "biology", question: "Which nitrogenous base is not found in RNA?", options: ["Adenine", "Thymine", "Uracil", "Cytosine"], correctAnswer: 1, difficulty: "hard" },
  { id: "b10", subject: "biology", question: "Crossing over occurs during which stage of meiosis?", options: ["Prophase I", "Metaphase I", "Anaphase II", "Telophase II"], correctAnswer: 0, difficulty: "hard" },

  // Chemistry
  { id: "c1", subject: "chemistry", question: "What is the pH of pure water at 25°C?", options: ["5", "7", "8", "14"], correctAnswer: 1, difficulty: "easy" },
  { id: "c2", subject: "chemistry", question: "Which element has the highest electronegativity?", options: ["Oxygen", "Chlorine", "Fluorine", "Nitrogen"], correctAnswer: 2, difficulty: "easy" },
  { id: "c3", subject: "chemistry", question: "The shape of methane molecule is?", options: ["Linear", "Trigonal planar", "Tetrahedral", "Octahedral"], correctAnswer: 2, difficulty: "easy" },
  { id: "c4", subject: "chemistry", question: "Which type of bond is formed between Na and Cl in NaCl?", options: ["Covalent", "Ionic", "Metallic", "Hydrogen"], correctAnswer: 1, difficulty: "easy" },
  { id: "c5", subject: "chemistry", question: "Avogadro's number is approximately?", options: ["6.022 × 10²³", "3.14 × 10²³", "6.022 × 10²²", "1.602 × 10⁻¹⁹"], correctAnswer: 0, difficulty: "intermediate" },
  { id: "c6", subject: "chemistry", question: "Which gas is produced when zinc reacts with hydrochloric acid?", options: ["Oxygen", "Hydrogen", "Nitrogen", "Chlorine"], correctAnswer: 1, difficulty: "intermediate" },
  { id: "c7", subject: "chemistry", question: "The hybridization of carbon in ethylene (C₂H₄) is?", options: ["sp", "sp²", "sp³", "sp³d"], correctAnswer: 1, difficulty: "hard" },
  { id: "c8", subject: "chemistry", question: "Le Chatelier's principle is related to?", options: ["Thermodynamics", "Chemical equilibrium", "Electrochemistry", "Nuclear chemistry"], correctAnswer: 1, difficulty: "intermediate" },
  { id: "c9", subject: "chemistry", question: "Which quantum number determines the shape of an orbital?", options: ["Principal (n)", "Azimuthal (l)", "Magnetic (ml)", "Spin (ms)"], correctAnswer: 1, difficulty: "hard" },
  { id: "c10", subject: "chemistry", question: "The functional group present in aldehydes is?", options: ["-OH", "-COOH", "-CHO", "-CO-"], correctAnswer: 2, difficulty: "easy" },

  // Physics
  { id: "p1", subject: "physics", question: "What is the SI unit of force?", options: ["Joule", "Newton", "Watt", "Pascal"], correctAnswer: 1, difficulty: "easy" },
  { id: "p2", subject: "physics", question: "The speed of light in vacuum is approximately?", options: ["3 × 10⁶ m/s", "3 × 10⁸ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"], correctAnswer: 1, difficulty: "easy" },
  { id: "p3", subject: "physics", question: "Which law states that F = ma?", options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Gravitation"], correctAnswer: 1, difficulty: "easy" },
  { id: "p4", subject: "physics", question: "The unit of electrical resistance is?", options: ["Volt", "Ampere", "Ohm", "Watt"], correctAnswer: 2, difficulty: "easy" },
  { id: "p5", subject: "physics", question: "Total internal reflection occurs when light travels from?", options: ["Rarer to denser medium", "Denser to rarer medium", "Vacuum to air", "Air to glass"], correctAnswer: 1, difficulty: "intermediate" },
  { id: "p6", subject: "physics", question: "The time period of a simple pendulum depends on?", options: ["Mass", "Amplitude", "Length and gravity", "Color"], correctAnswer: 2, difficulty: "intermediate" },
  { id: "p7", subject: "physics", question: "In photoelectric effect, increasing intensity increases?", options: ["Kinetic energy", "Number of electrons", "Frequency", "Wavelength"], correctAnswer: 1, difficulty: "hard" },
  { id: "p8", subject: "physics", question: "Which quantity is conserved in an elastic collision?", options: ["Only momentum", "Only kinetic energy", "Both momentum and kinetic energy", "Neither"], correctAnswer: 2, difficulty: "intermediate" },
  { id: "p9", subject: "physics", question: "The dimension of Planck's constant is?", options: ["ML²T⁻¹", "ML²T⁻²", "MLT⁻¹", "ML²T⁻³"], correctAnswer: 0, difficulty: "hard" },
  { id: "p10", subject: "physics", question: "Lenz's law is related to?", options: ["Electrostatics", "Electromagnetic induction", "Thermodynamics", "Optics"], correctAnswer: 1, difficulty: "intermediate" },

  // English Grammar
  { id: "e1", subject: "english", question: "Which of the following is a correct sentence?", options: ["He go to school.", "He goes to school.", "He going to school.", "He gone to school."], correctAnswer: 1, difficulty: "easy" },
  { id: "e2", subject: "english", question: "The past tense of 'write' is?", options: ["Writed", "Written", "Wrote", "Writing"], correctAnswer: 2, difficulty: "easy" },
  { id: "e3", subject: "english", question: "Choose the correct preposition: She is fond ___ music.", options: ["in", "of", "at", "on"], correctAnswer: 1, difficulty: "easy" },
  { id: "e4", subject: "english", question: "Which is the synonym of 'Abundant'?", options: ["Scarce", "Plentiful", "Rare", "Limited"], correctAnswer: 1, difficulty: "intermediate" },
  { id: "e5", subject: "english", question: "The antonym of 'Benevolent' is?", options: ["Kind", "Generous", "Malevolent", "Charitable"], correctAnswer: 2, difficulty: "intermediate" },
  { id: "e6", subject: "english", question: "Identify the part of speech of 'quickly' in: She runs quickly.", options: ["Adjective", "Adverb", "Noun", "Verb"], correctAnswer: 1, difficulty: "easy" },
  { id: "e7", subject: "english", question: "Which sentence is in passive voice?", options: ["She wrote a letter.", "A letter was written by her.", "She is writing a letter.", "She writes letters."], correctAnswer: 1, difficulty: "intermediate" },
  { id: "e8", subject: "english", question: "'To burn the midnight oil' means?", options: ["To waste oil", "To work late at night", "To cook at night", "To sleep early"], correctAnswer: 1, difficulty: "hard" },
  { id: "e9", subject: "english", question: "Choose the correctly spelled word:", options: ["Accomodation", "Accommodation", "Acomodation", "Acommodation"], correctAnswer: 1, difficulty: "easy" },
  { id: "e10", subject: "english", question: "The plural of 'phenomenon' is?", options: ["Phenomenons", "Phenomena", "Phenomenas", "Phenomeni"], correctAnswer: 1, difficulty: "hard" },

  // Logical Reasoning
  { id: "l1", subject: "reasoning", question: "If A = 1, B = 2, C = 3, then CAB = ?", options: ["312", "321", "123", "213"], correctAnswer: 0, difficulty: "easy" },
  { id: "l2", subject: "reasoning", question: "Complete the series: 2, 6, 12, 20, ?", options: ["28", "30", "32", "24"], correctAnswer: 1, difficulty: "intermediate" },
  { id: "l3", subject: "reasoning", question: "If APPLE is coded as 50, what is MANGO coded as?", options: ["52", "55", "57", "60"], correctAnswer: 0, difficulty: "hard" },
  { id: "l4", subject: "reasoning", question: "Which number comes next: 1, 1, 2, 3, 5, 8, ?", options: ["10", "11", "12", "13"], correctAnswer: 3, difficulty: "easy" },
  { id: "l5", subject: "reasoning", question: "Find the odd one out: Dog, Cat, Cow, Rose", options: ["Dog", "Cat", "Cow", "Rose"], correctAnswer: 3, difficulty: "easy" },
  { id: "l6", subject: "reasoning", question: "If Monday = 1, then Friday = ?", options: ["4", "5", "6", "7"], correctAnswer: 1, difficulty: "easy" },
  { id: "l7", subject: "reasoning", question: "A is B's brother. C is B's mother. D is C's father. How is A related to D?", options: ["Grandfather", "Grandson", "Son", "Father"], correctAnswer: 1, difficulty: "intermediate" },
  { id: "l8", subject: "reasoning", question: "Mirror image of 'AMBULANCE' appears as?", options: ["ECNALUBMA", "AMBULANCE (reversed)", "ECNALUBMA", "None"], correctAnswer: 0, difficulty: "intermediate" },
  { id: "l9", subject: "reasoning", question: "If 3 × 4 = 15, 5 × 6 = 33, then 7 × 8 = ?", options: ["55", "57", "59", "63"], correctAnswer: 2, difficulty: "hard" },
  { id: "l10", subject: "reasoning", question: "What is the next letter: A, C, E, G, ?", options: ["H", "I", "J", "K"], correctAnswer: 1, difficulty: "easy" },
];

export function getQuestionsBySubject(subject: string, difficulty?: Difficulty): Question[] {
  const customQuestions: Question[] = JSON.parse(localStorage.getItem("mdcat_custom_questions") || "[]");
  const allQuestions = [...sampleQuestions, ...customQuestions];
  let questions = allQuestions.filter(q => q.subject === subject);
  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  return questions;
}
