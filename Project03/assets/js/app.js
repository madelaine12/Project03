let studentName = '';
let quizId = '';
let currentQuestionIndex = 0;
let score = 0;
let totalQuestions = 0;
let startTime;
let timerInterval;
let elapsedSeconds = 0;

const app = document.getElementById('app');

Handlebars.registerPartial('start', document.getElementById('partial-start').innerHTML);

function render(templateId, context = {}) {
  const src = document.getElementById(templateId).innerHTML;
  const template = Handlebars.compile(src);
  app.innerHTML = template(context);
}

async function fetchQuestion(quizId, index) {
  const response = await fetch(`https://my-json-server.typicode.com/madelaine12/quiz-app/${quizId}/${index}`);
  if (!response.ok) throw new Error('Question fetch failed');
  return await response.json();
}

function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  totalQuestions = 0;
  elapsedSeconds = 0;
  startTime = new Date();
  startTimer();
  loadNextQuestion();
}


async function loadNextQuestion() {
  if (timerInterval) {
    clearInterval(timerInterval); 
  }

  try {
    const question = await fetchQuestion(quizId, currentQuestionIndex);
    renderQuiz(question);  

    setTimeout(() => {
      startTimer();  
    }, 100);
  } catch (err) {
    clearInterval(timerInterval);
    showResult();
  }
}



function startTimer() {
  const timerEl = document.getElementById('timer');
  const baseTime = new Date() - elapsedSeconds * 1000;

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const now = new Date();
    elapsedSeconds = Math.floor((now - baseTime) / 1000);
    if (timerEl) timerEl.textContent = `Time: ${elapsedSeconds}s`;
  }, 1000);
}



function renderQuiz(question) {
  fetch('/templates/quiz.hbs')
    .then(res => res.text())
    .then(tpl => {
      Handlebars.registerPartial('quiz', tpl);
      render('quiz-template', {
        question,
        index: currentQuestionIndex + 1,
        score,
        total: totalQuestions
      });

      startTimer(); 
      document.getElementById('submitAnswer').addEventListener('click', () => {
        const answer = document.querySelector('input[name="answer"]:checked')?.value || document.querySelector('#textAnswer')?.value;
        handleAnswer(answer, question);
      });
    });
}



function handleAnswer(answer, question) {
  totalQuestions++;

  if (
    answer &&
    answer.trim().toLowerCase() === String(question.correct).trim().toLowerCase()
  ) {
    score++;
    showCorrect();
  } else {
    showIncorrect(question.explanation);
  }
}



function showCorrect() {
  fetch('/templates/correct.hbs')
    .then(res => res.text())
    .then(tpl => {
      Handlebars.registerPartial('correct', tpl);
      render('correct-template');
      setTimeout(() => {
        currentQuestionIndex++;
        loadNextQuestion();
      }, 1000);
    });
}

function showIncorrect(explanation) {
  fetch('/templates/incorrect.hbs')
    .then(res => res.text())
    .then(tpl => {
      Handlebars.registerPartial('incorrect', tpl);
      render('incorrect-template', { explanation });

      document.getElementById('gotItBtn').addEventListener('click', () => {
        currentQuestionIndex++;
        loadNextQuestion();
      });
    });
}

function showResult() {
  const passed = (score / totalQuestions) >= 0.8;
  fetch('/templates/result.hbs')
    .then(res => res.text())
    .then(tpl => {
      Handlebars.registerPartial('result', tpl);
      render('result-template', {
        studentName,
        passed,
        score,
        total: totalQuestions
      });

      document.getElementById('retakeBtn').addEventListener('click', startQuiz);
      document.getElementById('homeBtn').addEventListener('click', () => render('start-template'));
    });
}

document.addEventListener('DOMContentLoaded', () => {
  render('start-template');

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'start-form') {
      e.preventDefault();
      studentName = document.getElementById('studentName').value.trim();
      quizId = document.getElementById('quizSelect').value;
      if (studentName && quizId) {
        startQuiz();
      }
    }
  });
});