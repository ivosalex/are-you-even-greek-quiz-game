const readline = require('readline');

const questions = [
    { question: "Who was the king of the Greek gods?", answer: "Zeus" },
    { question: "What is the name of the epic poem attributed to Homer that tells the story of the Trojan War?", answer: "Iliad" },
    { question: "Which city-state was known for its military discipline and society?", answer: "Sparta" },
    { question: "Who is the goddess of wisdom in Greek mythology?", answer: "Athena" },
    { question: "What war was fought between Athens and Sparta?", answer: "Peloponnesian War" }
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let score = 0;
let index = 0;

function askQuestion() {
    if (index === questions.length) {
        console.log(`Quiz complete! Your score is ${score} out of ${questions.length}.`);
        rl.close();
        return;
    }
    rl.question(questions[index].question + ' ', (userAnswer) => {
        if (userAnswer.trim().toLowerCase() === questions[index].answer.toLowerCase()) {
            console.log('Correct!');
            score++;
        } else {
            console.log(`Wrong. The correct answer is ${questions[index].answer}.`);
        }
        index++;
        askQuestion();
    });
}

askQuestion();