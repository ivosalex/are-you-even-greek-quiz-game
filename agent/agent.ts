import { voice, llm } from '@livekit/agents';
import { z } from 'zod';

// ── Question bank, categorised by difficulty ──────────────────────────────────

const EASY_QUESTIONS = [
  { question: 'Who was the king of the Olympian gods?', answer: 'Zeus' },
  { question: 'Who was the goddess of wisdom and war strategy?', answer: 'Athena' },
  { question: 'Who was the god of the sea?', answer: 'Poseidon' },
  { question: 'Who was the god of the underworld?', answer: 'Hades' },
  { question: 'Who was the goddess of love and beauty?', answer: 'Aphrodite' },
  { question: 'Who was the god of the sun, music, and poetry?', answer: 'Apollo' },
  { question: 'Who was the god of wine and celebration?', answer: 'Dionysus' },
  { question: 'Who was the queen of the Olympian gods?', answer: 'Hera' },
  { question: 'Who was the messenger god with winged sandals?', answer: 'Hermes' },
  { question: 'Who completed the twelve labors as penance to the gods?', answer: 'Heracles' },
  { question: 'Who was the hero of Homer\'s Odyssey?', answer: 'Odysseus' },
  { question: 'What three-headed dog guarded the entrance to the Underworld?', answer: 'Cerberus' },
  { question: 'What creature had living snakes for hair and turned people to stone?', answer: 'Medusa' },
  { question: 'What was the half-man, half-bull monster kept in the Cretan Labyrinth?', answer: 'Minotaur' },
  { question: 'What winged horse sprang from the blood of Medusa?', answer: 'Pegasus' },
  { question: 'What wooden structure did the Greeks use to secretly infiltrate Troy?', answer: 'Trojan Horse' },
  { question: 'What temple dedicated to Athena stands atop the Acropolis in Athens?', answer: 'Parthenon' },
  { question: 'What ancient Greek games honored Zeus and were held every four years?', answer: 'Olympic Games' },
  { question: 'Which philosopher was sentenced to death by drinking hemlock?', answer: 'Socrates' },
  { question: 'Who killed the Minotaur in the Labyrinth of Crete?', answer: 'Theseus' },
  { question: 'Which Trojan prince abducted Helen and triggered the Trojan War?', answer: 'Paris' },
  { question: 'What king had the power to turn everything he touched to gold?', answer: 'Midas' },
  { question: 'Who was the son of Daedalus who flew too close to the sun?', answer: 'Icarus' },
  { question: 'Which hero slew Medusa with a mirrored shield?', answer: 'Perseus' },
  { question: 'Who was the greatest Greek warrior in the Trojan War?', answer: 'Achilles' },
  { question: 'Which Greek city-state is credited with inventing democracy?', answer: 'Athens' },
  { question: 'Which Greek city-state was renowned for its extreme military discipline?', answer: 'Sparta' },
  { question: 'What woman opened a jar unleashing all the world\'s evils upon humanity?', answer: 'Pandora' },
  { question: 'What giant was blinded by Odysseus by thrusting a stake into his eye?', answer: 'Polyphemus' },
  { question: 'Which philosopher wrote The Republic and founded the Academy in Athens?', answer: 'Plato' },
];

const MEDIUM_QUESTIONS = [
  { question: 'Who led the Argonauts in search of the Golden Fleece?', answer: 'Jason' },
  { question: 'Which Titan was condemned to hold up the sky for eternity?', answer: 'Atlas' },
  { question: 'Which Titan stole fire from the gods to give to humanity?', answer: 'Prometheus' },
  { question: 'Who was the goddess of the hunt and the moon?', answer: 'Artemis' },
  { question: 'Who was the god of war?', answer: 'Ares' },
  { question: 'Who was the god of fire and the forge?', answer: 'Hephaestus' },
  { question: 'Who was the goddess of the harvest and agriculture?', answer: 'Demeter' },
  { question: 'What epic poem by Homer tells of the Trojan War?', answer: 'Iliad' },
  { question: 'Which Spartan king led 300 soldiers at the Battle of Thermopylae?', answer: 'Leonidas' },
  { question: 'Which philosopher founded the Lyceum and tutored Alexander the Great?', answer: 'Aristotle' },
  { question: 'At which battle in 490 BC did Athens defeat Persia on Greek soil?', answer: 'Marathon' },
  { question: 'Which Persian king led the massive invasion of Greece in 480 BC?', answer: 'Xerxes' },
  { question: 'What was the open central marketplace and public space of a Greek city called?', answer: 'Agora' },
  { question: 'Which daughter of Demeter was abducted to the Underworld by Hades?', answer: 'Persephone' },
  { question: 'Who was the craftsman who built the Labyrinth and fashioned wings of feathers and wax?', answer: 'Daedalus' },
  { question: 'What creature posed riddles and destroyed those who answered wrongly?', answer: 'Sphinx' },
  { question: 'What nine-headed water serpent was one of the twelve labors of Heracles?', answer: 'Hydra' },
  { question: 'What creatures were half woman, half bird and lured sailors to their deaths with song?', answer: 'Sirens' },
  { question: 'What was the tight rectangular military formation of Greek soldiers called?', answer: 'Phalanx' },
  { question: 'Which scientist discovered water displacement while stepping into his bath, shouting Eureka?', answer: 'Archimedes' },
  { question: 'Who fell so in love with his own reflection that he wasted away?', answer: 'Narcissus' },
  { question: 'What river of the Underworld caused forgetfulness in those who drank from it?', answer: 'Lethe' },
  { question: 'What river did the dead cross by paying Charon, the ferryman?', answer: 'Styx' },
  { question: 'Which Greek playwright wrote the Oedipus cycle of tragedies?', answer: 'Sophocles' },
  { question: 'What was the island associated with King Minos, the Labyrinth, and the Minotaur?', answer: 'Crete' },
  { question: 'Which Greek physician is considered the father of medicine?', answer: 'Hippocrates' },
  { question: 'What mortal weaver was transformed into a spider by Athena?', answer: 'Arachne' },
  { question: 'Who was the greatest warrior of the Trojan side, slain by Achilles?', answer: 'Hector' },
  { question: 'What famous mountain pass did 300 Spartans defend against the Persian army in 480 BC?', answer: 'Thermopylae' },
  { question: 'What was the name of Alexander the Great\'s famous black horse?', answer: 'Bucephalus' },
  { question: 'What Greek term describes a self-governing city and its surrounding territory?', answer: 'Polis' },
  { question: 'What was the fast Greek warship with three rows of oarsmen called?', answer: 'Trireme' },
  { question: 'Which mortal hero rode Pegasus and defeated the Chimera?', answer: 'Bellerophon' },
];

const HARD_QUESTIONS = [
  { question: 'Who was the leader of the Titans before Zeus overthrew him?', answer: 'Cronus' },
  { question: 'Who was the sun Titan who drove the solar chariot before Apollo?', answer: 'Helios' },
  { question: 'Who was the Titan goddess of the moon?', answer: 'Selene' },
  { question: 'Which Athenian statesman established Athenian democracy around 508 BC?', answer: 'Cleisthenes' },
  { question: 'Which Athenian lawgiver created the first written code of laws, known for their severity?', answer: 'Draco' },
  { question: 'Which statesman reformed Athenian law and cancelled debt slavery around 594 BC?', answer: 'Solon' },
  { question: 'Who was the great Athenian statesman who led Athens during its Golden Age?', answer: 'Pericles' },
  { question: 'What war was fought between Athens and Sparta from 431 to 404 BC?', answer: 'Peloponnesian War' },
  { question: 'Which 480 BC naval battle saw the Greeks destroy the Persian fleet?', answer: 'Salamis' },
  { question: 'Which Athenian general masterminded the naval strategy that won at Salamis?', answer: 'Themistocles' },
  { question: 'Which Persian king sent heralds demanding earth and water from Greek city-states?', answer: 'Darius' },
  { question: 'Who was Alexander the Great\'s father, the king who first unified Macedon?', answer: 'Philip II' },
  { question: 'Which Athenian general led the Greeks to victory at the Battle of Marathon?', answer: 'Miltiades' },
  { question: 'What famous knot did Alexander cut with his sword in Phrygia?', answer: 'Gordian Knot' },
  { question: 'Which Persian king was ultimately defeated by Alexander the Great?', answer: 'Darius III' },
  { question: 'What theorem about right triangles is named after a famous Greek mathematician?', answer: 'Pythagorean theorem' },
  { question: 'Who is considered the father of geometry, author of Elements?', answer: 'Euclid' },
  { question: 'Which ancient Greek first proposed that the Earth orbits the Sun?', answer: 'Aristarchus' },
  { question: 'Who is known as the father of history for his accounts of the Persian Wars?', answer: 'Herodotus' },
  { question: 'Who wrote the famous history of the Peloponnesian War?', answer: 'Thucydides' },
  { question: 'Which philosopher lived in a barrel and founded the school of Cynicism?', answer: 'Diogenes' },
  { question: 'Who founded the Epicurean school of philosophy, teaching pleasure as the highest good?', answer: 'Epicurus' },
  { question: 'What method of questioning and dialogue is named after Socrates?', answer: 'Socratic method' },
  { question: 'Who founded Stoicism, teaching in the Stoa Poikile in Athens?', answer: 'Zeno' },
  { question: 'Which hero descended into the underworld to rescue Eurydice?', answer: 'Orpheus' },
  { question: 'Which Greek playwright wrote the Oresteia trilogy?', answer: 'Aeschylus' },
  { question: 'Which playwright wrote the tragedy Medea?', answer: 'Euripides' },
  { question: 'Which playwright wrote the comedies The Clouds and The Birds?', answer: 'Aristophanes' },
  { question: 'What was the heavily armed infantry citizen-soldier of ancient Greece called?', answer: 'Hoplite' },
  { question: 'What style of Greek column has a scroll-like capital?', answer: 'Ionic' },
  { question: 'What style of Greek column has a capital decorated with acanthus leaves?', answer: 'Corinthian' },
  { question: 'What king was punished in the Underworld by standing in water that receded when he tried to drink?', answer: 'Tantalus' },
  { question: 'What nymph could only repeat the last words spoken to her?', answer: 'Echo' },
  { question: 'Who was the Trojan prophetess whose warnings were never believed?', answer: 'Cassandra' },
  { question: 'What eternal punishment did Sisyphus receive in the Underworld?', answer: 'rolling a boulder uphill' },
  { question: 'Which kingdom was Alexander the Great from?', answer: 'Macedon' },
  { question: 'What ethical oath taken by doctors is named after a Greek physician?', answer: 'Hippocratic oath' },
];

export type Difficulty = 'easy' | 'medium' | 'hard';

const QUESTIONS_PER_GAME = 10;

function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ');
}

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  const norm = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);
  if (norm === correct) return true;
  if (norm.includes(correct) || correct.includes(norm)) return true;
  const correctWords = correct.split(' ').filter((w) => w.length > 3);
  const matchedWords = correctWords.filter((w) => norm.includes(w));
  if (correctWords.length > 0 && matchedWords.length === correctWords.length) return true;
  const maxEdits = correct.length <= 5 ? 1 : 2;
  if (editDistance(norm, correct) <= maxEdits) return true;
  for (const word of correctWords) {
    const userWords = norm.split(' ');
    if (userWords.some((uw) => editDistance(uw, word) <= 1)) return true;
  }
  return false;
}

function shuffleAndPick(
  arr: { question: string; answer: string }[],
  n: number
): { question: string; answer: string }[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  const picked: { question: string; answer: string }[] = [];
  const seenAnswers = new Set<string>();
  for (const item of shuffled) {
    if (picked.length >= n) break;
    const key = normalizeAnswer(item.answer);
    if (!seenAnswers.has(key)) {
      seenAnswers.add(key);
      picked.push(item);
    }
  }
  return picked;
}

function getQuestionPool(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':   return EASY_QUESTIONS;
    case 'hard':   return HARD_QUESTIONS;
    default:       return MEDIUM_QUESTIONS;
  }
}

export function createQuizAgent(difficulty: Difficulty = 'medium'): voice.Agent {
  const questions = shuffleAndPick(getQuestionPool(difficulty), QUESTIONS_PER_GAME);
  const state = {
    score: 0,
    // Track which question numbers have already been scored to prevent double-counting
    scoredQuestions: new Set<number>(),
  };

  const difficultyLabel = difficulty === 'easy' ? 'EASY' : difficulty === 'hard' ? 'HARD' : 'MEDIUM';

  return new voice.Agent({
    allowInterruptions: false,
    instructions: `You are Athena, goddess of wisdom, hosting a Greek mythology and history quiz on ${difficultyLabel} difficulty.

The quiz has ${QUESTIONS_PER_GAME} questions. Here they are for this session:
${questions.map((q, i) => `  Q${i + 1}: "${q.question}" → Answer: "${q.answer}"`).join('\n')}

Your flow:
1. When you first speak, greet the mortal as Athena — regal, warm, theatrical. Announce ${QUESTIONS_PER_GAME} questions on ${difficultyLabel} difficulty await them. Tell them to press the "Begin the Trial" button when they are ready. Do NOT ask questions yet.
2. When the user signals they are ready (says "ready", "begin", "start", "I'm ready", or similar), immediately ask Question 1.
3. After the player answers (by voice or text), call submit_answer with the question number and their exact answer verbatim.
4. Based on the result:
   - Correct: say something like "By the gods, correct!" then state their score.
   - Wrong: say "Alas! The answer was [correct answer]."
5. Ask the next question immediately. No delays.
6. After all ${QUESTIONS_PER_GAME} questions, deliver a theatrical final verdict on their score out of ${QUESTIONS_PER_GAME}.

Rules:
- Speak as Athena: wise, regal, theatrical. Use "By Zeus!", "Indeed, mortal!", "Impressive!" occasionally.
- Keep responses short and snappy between questions — do not ramble.
- No markdown, bullet points, or asterisks in speech.
- Never reveal an answer before the player guesses.
- Accept both spoken and typed answers equally.
- Call submit_answer EXACTLY ONCE per question — do not call it again for the same question.`,

    tools: {
      submitAnswer: llm.tool({
        description: `Check the player's answer. Call this ONCE per question, immediately after they answer.`,
        parameters: z.object({
          questionNumber: z
            .number()
            .int()
            .min(1)
            .max(QUESTIONS_PER_GAME)
            .describe('1-based question number'),
          userAnswer: z.string().describe("The player's answer verbatim"),
        }),
        execute: async ({ questionNumber, userAnswer }) => {
          const idx = questionNumber - 1;
          if (idx < 0 || idx >= questions.length) {
            return { error: `Invalid question number: ${questionNumber}` };
          }
          const q = questions[idx];
          const isCorrect = checkAnswer(userAnswer, q.answer);
          // Only score once per question — prevents double-counting
          if (isCorrect && !state.scoredQuestions.has(questionNumber)) {
            state.score++;
          }
          state.scoredQuestions.add(questionNumber);
          return {
            correct: isCorrect,
            correctAnswer: q.answer,
            currentScore: state.score,
            totalQuestions: QUESTIONS_PER_GAME,
            questionsAnswered: state.scoredQuestions.size,
            isGameOver: state.scoredQuestions.size >= QUESTIONS_PER_GAME,
            nextQuestionNumber: questionNumber < QUESTIONS_PER_GAME ? questionNumber + 1 : null,
          };
        },
      }),
    },
  });
}
