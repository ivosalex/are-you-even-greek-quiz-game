import { voice, llm } from '@livekit/agents';
import { z } from 'zod';

const QUESTIONS = [
  { question: 'Who was the king of the Greek gods?', answer: 'Zeus' },
  {
    question: 'What is the name of the Homer epic poem about the Trojan War?',
    answer: 'Iliad',
  },
  {
    question: 'Which Greek city-state was famous for its military discipline?',
    answer: 'Sparta',
  },
  {
    question: 'Who is the goddess of wisdom in Greek mythology?',
    answer: 'Athena',
  },
  {
    question: 'What war was fought between Athens and Sparta from 431 to 404 BC?',
    answer: 'Peloponnesian War',
  },
];

function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ');
}

function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  const norm = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);
  if (norm === correct) return true;
  if (norm.includes(correct) || correct.includes(norm)) return true;
  // Accept partial word matches for multi-word answers
  const correctWords = correct.split(' ').filter((w) => w.length > 3);
  const matchedWords = correctWords.filter((w) => norm.includes(w));
  return correctWords.length > 0 && matchedWords.length === correctWords.length;
}

/**
 * Creates a new QuizAgent instance with fresh quiz state.
 * Each session gets its own agent instance so state is not shared.
 */
export function createQuizAgent(): voice.Agent {
  // Mutable state captured by closure — each agent instance has its own copy
  const state = {
    score: 0,
  };

  return new voice.Agent({
    instructions: `You are an enthusiastic Greek history quiz master hosting a voice quiz game.

The quiz has ${QUESTIONS.length} questions. Here are ALL questions and correct answers:
${QUESTIONS.map((q, i) => `  Q${i + 1}: "${q.question}" → Answer: "${q.answer}"`).join('\n')}

Your exact flow:
1. Greet the user and announce the quiz format, then immediately ask Question 1.
2. After the user speaks, call the submit_answer tool with the question number and what they said.
3. Based on the tool result:
   - If correct: say "Correct!" and their updated score.
   - If wrong: say "Not quite — the answer is [correct answer]."
4. Ask the next question (or announce final score if game is over).

Important rules:
- Speak naturally and concisely — no markdown, no bullet points, no asterisks.
- Never reveal the answer before the user guesses.
- Be warm and encouraging throughout.
- After all ${QUESTIONS.length} questions, give an enthusiastic final score summary.`,
    tools: {
      submitAnswer: llm.tool({
        description: `Check the user's spoken answer for a quiz question.
Call this immediately after the user gives their answer.
Returns: correct (bool), correctAnswer, currentScore, isGameOver, nextQuestionNumber.`,
        parameters: z.object({
          questionNumber: z
            .number()
            .int()
            .min(1)
            .max(QUESTIONS.length)
            .describe('The 1-based index of the question just answered'),
          userAnswer: z
            .string()
            .describe("The user's spoken answer, verbatim"),
        }),
        execute: async ({ questionNumber, userAnswer }) => {
          const idx = questionNumber - 1;
          if (idx < 0 || idx >= QUESTIONS.length) {
            return { error: `Invalid question number: ${questionNumber}` };
          }

          const q = QUESTIONS[idx];
          const isCorrect = checkAnswer(userAnswer, q.answer);
          if (isCorrect) state.score++;

          return {
            correct: isCorrect,
            correctAnswer: q.answer,
            currentScore: state.score,
            totalQuestions: QUESTIONS.length,
            questionsAnswered: questionNumber,
            isGameOver: questionNumber === QUESTIONS.length,
            nextQuestionNumber:
              questionNumber < QUESTIONS.length ? questionNumber + 1 : null,
          };
        },
      }),
    },
  });
}
