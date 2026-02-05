
// Games Lab - High fidelity educational games and simulators

const GAME_DATA = {
    'quiz-arena': {
        title: 'Quiz Arena',
        icon: 'fas fa-trophy',
        artClass: 'gradient-bg-5',
        description: 'Compete solo or local multiplayer with AI-generated MCQs. Topic selection, difficulty control, and time-based scoring.',
        meta: ['AI MCQs', 'Solo or Multiplayer', 'Time-based scoring'],
        sections: [
            {
                title: 'How It Works',
                text: 'Pick a topic, difficulty, and number of questions. The AI generates an MCQ set with answers. Points are higher for faster correct answers.'
            },
            {
                title: 'Game Modes',
                text: 'Solo for practice or local multiplayer on one device. Each player answers every question. Live leaderboard updates after each round.'
            },
            {
                title: 'Scoring',
                text: 'Correct answers earn base points plus a speed bonus based on remaining time.'
            }
        ]
    },
    'simulators': {
        title: 'Simulators',
        icon: 'fas fa-cube',
        artClass: 'gradient-bg-3',
        description: 'Goated 3D simulations across Physics, Chemistry, and Maths. Real-time controls, clean visuals, deep intuition.',
        meta: ['Three.js', 'Physics + Chem + Math', 'Interactive 3D'],
        sections: [
            {
                title: 'Physics',
                text: 'Projectile motion, vector addition, relative motion, laws of motion, and a roller coaster energy lab.'
            },
            {
                title: 'Chemistry',
                text: 'Atomic orbitals, VSEPR molecular geometry, and hybridization in true 3D.'
            },
            {
                title: 'Maths',
                text: '3D coordinate geometry and plane-line interactions with live updates.'
            }
        ]
    },
    'memory-formulas': {
        title: 'Memory Match',
        icon: 'fas fa-brain',
        artClass: 'gradient-bg-2',
        description: 'AI generates formula/value pairs. Flip cards to find equivalent matches and level up recall.',
        meta: ['AI Card Deck', 'Rapid Recall', 'Timed Rounds'],
        sections: [
            {
                title: 'Deck Generation',
                text: 'Provide a topic and difficulty. The AI builds a set of equivalent pairs (expressions and results).'
            },
            {
                title: 'Objective',
                text: 'Find all matching pairs with minimal moves. Faster clears earn higher ranks.'
            }
        ]
    },
    'mental-math': {
        title: 'Mental Math',
        icon: 'fas fa-bolt',
        artClass: 'gradient-bg-4',
        description: 'Enter a topic, question count, and difficulty. The AI generates a speed drill set.',
        meta: ['Speed Drill', 'Custom Topics', 'Adaptive Difficulty'],
        sections: [
            {
                title: 'Performance',
                text: 'Answer quickly and accurately. Track streaks and accuracy at the end.'
            },
            {
                title: 'Perfect for Exams',
                text: 'Train speed, accuracy, and confidence with targeted drills.'
            }
        ]
    }
};

const GAME_STATE = {
    currentGame: null,
    cleanup: null
};

function initGames() {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    gamesGrid.addEventListener('click', (event) => {
        const playBtn = event.target.closest('[data-action="play"]');
        const detailsBtn = event.target.closest('[data-action="details"]');
        if (playBtn) {
            event.stopPropagation();
            openGamePlay(playBtn.getAttribute('data-game'));
            return;
        }

        if (detailsBtn) {
            event.stopPropagation();
            openGameDetail(detailsBtn.getAttribute('data-game'));
            return;
        }

        const card = event.target.closest('.game-card');
        if (card) {
            openGameDetail(card.getAttribute('data-game'));
        }
    });

    document.querySelectorAll('[data-action="play"][data-game]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            openGamePlay(btn.getAttribute('data-game'));
        });
    });
}

function openGameDetail(gameId) {
    const data = GAME_DATA[gameId];
    if (!data) return;

    const view = document.getElementById('gameDetailView');
    const title = document.getElementById('gameDetailTitle');
    const art = document.getElementById('gameDetailArt');
    const desc = document.getElementById('gameDetailDescription');
    const meta = document.getElementById('gameDetailMeta');
    const sections = document.getElementById('gameDetailSections');
    const playBtn = document.getElementById('gameDetailPlayBtn');

    title.innerHTML = `<i class="${data.icon}"></i> ${data.title}`;
    art.className = `game-detail-art ${data.artClass}`;
    art.innerHTML = `<i class="${data.icon}"></i>`;
    desc.textContent = data.description;
    meta.innerHTML = data.meta.map(item => `<span class="game-meta-chip">${item}</span>`).join('');
    sections.innerHTML = data.sections.map(section => `
        <div class="game-detail-section glass-premium">
            <h3>${section.title}</h3>
            <p>${section.text}</p>
        </div>
    `).join('');

    playBtn.onclick = () => {
        closeGameDetail();
        openGamePlay(gameId);
    };

    view.style.display = 'block';
}

function closeGameDetail() {
    const view = document.getElementById('gameDetailView');
    if (view) view.style.display = 'none';
}

function openGamePlay(gameId) {
    const data = GAME_DATA[gameId];
    if (!data) return;

    cleanupGamePlay();
    GAME_STATE.currentGame = gameId;

    const view = document.getElementById('gamePlayView');
    const title = document.getElementById('gamePlayTitle');
    const body = document.getElementById('gamePlayBody');

    title.innerHTML = `<i class="${data.icon}"></i> ${data.title}`;
    body.innerHTML = '';

    if (gameId === 'quiz-arena') {
        GAME_STATE.cleanup = renderQuizArena(body);
    } else if (gameId === 'simulators') {
        GAME_STATE.cleanup = renderSimulators(body);
    } else if (gameId === 'memory-formulas') {
        GAME_STATE.cleanup = renderMemoryMatch(body);
    } else if (gameId === 'mental-math') {
        GAME_STATE.cleanup = renderMentalMath(body);
    }

    view.style.display = 'block';
}

function closeGamePlay() {
    cleanupGamePlay();
    const view = document.getElementById('gamePlayView');
    if (view) view.style.display = 'none';
}

function cleanupGamePlay() {
    if (GAME_STATE.cleanup) {
        GAME_STATE.cleanup();
    }
    GAME_STATE.cleanup = null;
    GAME_STATE.currentGame = null;
}

async function callOpenRouter(prompt, temperature = 0.6, maxTokens = 1000) {
    const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'z-ai/glm-4.5-air:free',
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        throw new Error('AI request failed');
    }
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

function safeJsonParse(text) {
    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            return JSON.parse(text.slice(start, end + 1));
        }
        return JSON.parse(text);
    } catch (error) {
        return null;
    }
}

// =====================================================================
// QUIZ ARENA
// =====================================================================

function renderQuizArena(container) {
    container.innerHTML = `
        <div class="game-play-layout">
            <div class="game-panel">
                <div class="game-section-title"><i class="fas fa-sliders-h"></i> Quiz Setup</div>
                <input class="game-input" id="quizTopic" placeholder="Enter topic (e.g., Newton's laws, Stoichiometry)">
                <div class="game-inline">
                    <select class="game-select" id="quizDifficulty">
                        <option value="easy">Easy</option>
                        <option value="medium" selected>Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <select class="game-select" id="quizQuestionsCount">
                        <option value="5">5 Questions</option>
                        <option value="10" selected>10 Questions</option>
                        <option value="15">15 Questions</option>
                    </select>
                </div>
                <div class="game-inline">
                    <select class="game-select" id="quizTimePerQ">
                        <option value="20">20s per Question</option>
                        <option value="30" selected>30s per Question</option>
                        <option value="45">45s per Question</option>
                    </select>
                    <select class="game-select" id="quizPlayersCount">
                        <option value="1" selected>Solo</option>
                        <option value="2">2 Players</option>
                        <option value="3">3 Players</option>
                        <option value="4">4 Players</option>
                    </select>
                </div>
                <div id="quizPlayerNames" class="game-panel"></div>
                <button class="btn-primary" id="startQuizBtn"><i class="fas fa-play"></i> Generate Quiz</button>
                <div class="sim-status" id="quizStatus">AI will generate MCQs with answers.</div>
                <div class="game-section-title"><i class="fas fa-crown"></i> Leaderboard</div>
                <div class="leaderboard-list" id="quizLeaderboard"></div>
            </div>
            <div class="game-panel">
                <div class="game-section-title"><i class="fas fa-question-circle"></i> Quiz Arena</div>
                <div id="quizStage">
                    <div class="quiz-question-box">
                        <h3>Ready to start?</h3>
                        <p>Generate a quiz to begin the arena. Questions are AI-crafted MCQs.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const playerNamesEl = container.querySelector('#quizPlayerNames');
    const playersSelect = container.querySelector('#quizPlayersCount');
    const leaderboardEl = container.querySelector('#quizLeaderboard');
    const stageEl = container.querySelector('#quizStage');
    const startBtn = container.querySelector('#startQuizBtn');
    const statusEl = container.querySelector('#quizStatus');

    const quizState = {
        questions: [],
        currentQuestion: 0,
        players: [],
        currentPlayerIndex: 0,
        scores: [],
        timer: null,
        timeLeft: 0,
        timePerQuestion: 30,
        active: false
    };

    function buildPlayerInputs() {
        const count = parseInt(playersSelect.value, 10);
        playerNamesEl.innerHTML = '';
        if (count <= 1) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'game-panel';
        wrapper.innerHTML = `<div class="game-section-title"><i class="fas fa-users"></i> Player Names</div>`;
        for (let i = 0; i < count; i += 1) {
            const input = document.createElement('input');
            input.className = 'game-input';
            input.placeholder = `Player ${i + 1} name`;
            input.value = `Player ${i + 1}`;
            input.dataset.playerIndex = i;
            wrapper.appendChild(input);
        }
        playerNamesEl.appendChild(wrapper);
    }

    function updateLeaderboard() {
        leaderboardEl.innerHTML = quizState.players.map((player, index) => `
            <div class="leaderboard-item">
                <span>${player}</span>
                <strong>${quizState.scores[index]} pts</strong>
            </div>
        `).join('');
    }

    function startTimer(onExpire) {
        clearInterval(quizState.timer);
        quizState.timeLeft = quizState.timePerQuestion;
        quizState.timer = setInterval(() => {
            quizState.timeLeft -= 1;
            if (quizState.timeLeft <= 0) {
                clearInterval(quizState.timer);
                onExpire();
            }
            updateQuizUI();
        }, 1000);
    }

    function updateQuizUI() {
        if (!quizState.active) return;
        const question = quizState.questions[quizState.currentQuestion];
        const player = quizState.players[quizState.currentPlayerIndex];
        stageEl.innerHTML = `
            <div class="quiz-question-box">
                <div class="game-inline">
                    <div><strong>Player:</strong> ${player}</div>
                    <div><strong>Time:</strong> ${quizState.timeLeft}s</div>
                    <div><strong>Question:</strong> ${quizState.currentQuestion + 1}/${quizState.questions.length}</div>
                </div>
                <h3>${question.question}</h3>
                <div class="quiz-options">
                    ${question.options.map((opt, idx) => `
                        <div class="quiz-option" data-index="${idx}">${opt}</div>
                    `).join('')}
                </div>
                <div class="sim-status">Select the best answer. Speed matters.</div>
            </div>
        `;

        stageEl.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', () => {
                const chosen = parseInt(option.dataset.index, 10);
                handleAnswer(chosen);
            });
        });
    }

    function handleAnswer(chosenIndex) {
        const question = quizState.questions[quizState.currentQuestion];
        const correctIndex = question.correctIndex;
        const isCorrect = chosenIndex === correctIndex;
        clearInterval(quizState.timer);
        const speedBonus = Math.max(0, Math.round((quizState.timeLeft / quizState.timePerQuestion) * 120));
        const base = isCorrect ? 200 : 0;
        quizState.scores[quizState.currentPlayerIndex] += base + speedBonus;
        updateLeaderboard();

        stageEl.innerHTML = `
            <div class="quiz-question-box">
                <h3>${isCorrect ? 'Correct!' : 'Not quite.'}</h3>
                <p><strong>Answer:</strong> ${question.options[correctIndex]}</p>
                <p>${question.explanation || 'Focus on the core concept and try the next one.'}</p>
                <button class="btn-primary" id="nextQuizStep">Next</button>
            </div>
        `;
        stageEl.querySelector('#nextQuizStep').addEventListener('click', () => {
            advanceTurn();
        });
    }

    function advanceTurn() {
        const isLastPlayer = quizState.currentPlayerIndex === quizState.players.length - 1;
        if (isLastPlayer) {
            quizState.currentPlayerIndex = 0;
            quizState.currentQuestion += 1;
        } else {
            quizState.currentPlayerIndex += 1;
        }

        if (quizState.currentQuestion >= quizState.questions.length) {
            finishQuiz();
            return;
        }
        startTimer(() => handleAnswer(-1));
        updateQuizUI();
    }

    function finishQuiz() {
        quizState.active = false;
        const ranking = quizState.players
            .map((player, idx) => ({ player, score: quizState.scores[idx] }))
            .sort((a, b) => b.score - a.score);
        stageEl.innerHTML = `
            <div class="quiz-question-box">
                <h3>Quiz Complete</h3>
                <p>Leaderboard results:</p>
                <div class="leaderboard-list">
                    ${ranking.map((item, idx) => `
                        <div class="leaderboard-item">
                            <span>#${idx + 1} ${item.player}</span>
                            <strong>${item.score} pts</strong>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-primary" id="restartQuiz">Play Again</button>
            </div>
        `;
        stageEl.querySelector('#restartQuiz').addEventListener('click', () => {
            stageEl.innerHTML = `
                <div class="quiz-question-box">
                    <h3>Generate another quiz?</h3>
                    <p>Adjust settings and click Generate Quiz.</p>
                </div>
            `;
        });
    }

    async function generateQuiz() {
        const topic = container.querySelector('#quizTopic').value.trim();
        const difficulty = container.querySelector('#quizDifficulty').value;
        const count = parseInt(container.querySelector('#quizQuestionsCount').value, 10);
        const playersCount = parseInt(container.querySelector('#quizPlayersCount').value, 10);

        if (!topic) {
            showToast('Please enter a topic for the quiz.', 'error');
            return;
        }

        const playerInputs = playerNamesEl.querySelectorAll('input');
        const players = [];
        if (playersCount > 1) {
            playerInputs.forEach((input, idx) => {
                players[idx] = input.value.trim() || `Player ${idx + 1}`;
            });
        } else {
            players.push('You');
        }

        quizState.players = players;
        quizState.scores = new Array(players.length).fill(0);
        quizState.currentQuestion = 0;
        quizState.currentPlayerIndex = 0;
        quizState.timePerQuestion = parseInt(container.querySelector('#quizTimePerQ').value, 10);
        updateLeaderboard();

        statusEl.textContent = 'Generating quiz with AI...';
        startBtn.disabled = true;
        startBtn.textContent = 'Generating...';

        const prompt = `Create ${count} multiple-choice questions (MCQ) on the topic "${topic}". Difficulty: ${difficulty}.
Return STRICT JSON with this schema:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "exact option text that is correct",
      "explanation": "short explanation"
    }
  ]
}
Only MCQs. No extra text.`;

        let quizJson = null;
        try {
            const response = await callOpenRouter(prompt, 0.4, 1200);
            quizJson = safeJsonParse(response);
        } catch (error) {
            quizJson = null;
        }

        if (!quizJson || !quizJson.questions || quizJson.questions.length === 0) {
            const fallback = createFallbackQuiz(topic, count);
            quizJson = { questions: fallback };
        }

        quizState.questions = quizJson.questions.map((q) => {
            const options = q.options || [];
            const correctIndex = options.findIndex(opt => opt === q.answer);
            return {
                question: q.question,
                options,
                correctIndex: correctIndex === -1 ? 0 : correctIndex,
                explanation: q.explanation || ''
            };
        });

        quizState.active = true;
        statusEl.textContent = 'Quiz ready. Good luck.';
        startBtn.disabled = false;
        startBtn.textContent = 'Generate Quiz';
        startTimer(() => handleAnswer(-1));
        updateQuizUI();
    }

    playersSelect.addEventListener('change', buildPlayerInputs);
    startBtn.addEventListener('click', generateQuiz);
    buildPlayerInputs();
    updateLeaderboard();

    return () => {
        clearInterval(quizState.timer);
    };
}

function createFallbackQuiz(topic, count) {
    const questions = [];
    for (let i = 0; i < count; i += 1) {
        const a = Math.floor(Math.random() * 12) + 3;
        const b = Math.floor(Math.random() * 12) + 3;
        const correct = a + b;
        const options = [correct, correct + 1, correct - 1, correct + 2].map(v => `${v}`);
        questions.push({
            question: `${topic}: What is ${a} + ${b}?`,
            options,
            answer: `${correct}`,
            explanation: 'Add the values directly.'
        });
    }
    return questions;
}

// =====================================================================
// MEMORY MATCH
// =====================================================================

function renderMemoryMatch(container) {
    container.innerHTML = `
        <div class="game-play-layout">
            <div class="game-panel">
                <div class="game-section-title"><i class="fas fa-layer-group"></i> Deck Builder</div>
                <input class="game-input" id="memoryTopic" placeholder="Topic (e.g., algebra, derivatives, thermodynamics)">
                <div class="game-inline">
                    <select class="game-select" id="memoryDifficulty">
                        <option value="easy">Easy</option>
                        <option value="medium" selected>Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <select class="game-select" id="memoryPairs">
                        <option value="6">6 Pairs</option>
                        <option value="8" selected>8 Pairs</option>
                        <option value="10">10 Pairs</option>
                    </select>
                </div>
                <button class="btn-primary" id="generateMemoryDeck"><i class="fas fa-magic"></i> Generate Cards</button>
                <div class="sim-status" id="memoryStatus">AI will craft equivalent formula pairs.</div>
                <div class="game-section-title"><i class="fas fa-stopwatch"></i> Stats</div>
                <div id="memoryStats">Moves: 0 | Matches: 0</div>
            </div>
            <div class="game-panel">
                <div class="game-section-title"><i class="fas fa-brain"></i> Memory Match</div>
                <div class="memory-grid" id="memoryGrid"></div>
            </div>
        </div>
    `;

    const topicInput = container.querySelector('#memoryTopic');
    const difficultySelect = container.querySelector('#memoryDifficulty');
    const pairsSelect = container.querySelector('#memoryPairs');
    const statusEl = container.querySelector('#memoryStatus');
    const statsEl = container.querySelector('#memoryStats');
    const gridEl = container.querySelector('#memoryGrid');
    const generateBtn = container.querySelector('#generateMemoryDeck');

    let cards = [];
    let revealed = [];
    let moves = 0;
    let matches = 0;

    function updateStats() {
        statsEl.textContent = `Moves: ${moves} | Matches: ${matches}`;
    }

    function renderGrid() {
        gridEl.innerHTML = cards.map(card => `
            <div class="memory-card ${card.state}" data-card-id="${card.id}">
                ${card.state === 'hidden' ? '' : `<span>${card.text}</span>`}
            </div>
        `).join('');
        gridEl.querySelectorAll('.memory-card').forEach(cardEl => {
            cardEl.addEventListener('click', () => handleCardClick(cardEl.dataset.cardId));
        });
    }

    function handleCardClick(cardId) {
        const card = cards.find(c => c.id === cardId);
        if (!card || card.state !== 'hidden' || revealed.length === 2) return;
        card.state = 'revealed';
        revealed.push(card);
        renderGrid();
        if (revealed.length === 2) {
            moves += 1;
            if (revealed[0].pairId === revealed[1].pairId) {
                revealed[0].state = 'matched';
                revealed[1].state = 'matched';
                matches += 1;
                revealed = [];
                updateStats();
                renderGrid();
            } else {
                setTimeout(() => {
                    revealed.forEach(c => c.state = 'hidden');
                    revealed = [];
                    updateStats();
                    renderGrid();
                }, 700);
            }
            updateStats();
        }
    }

    async function generateDeck() {
        const topic = topicInput.value.trim();
        if (!topic) {
            showToast('Please enter a topic for the cards.', 'error');
            return;
        }
        const difficulty = difficultySelect.value;
        const pairsCount = parseInt(pairsSelect.value, 10);

        statusEl.textContent = 'Generating cards with AI...';
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        const prompt = `Create ${pairsCount} equivalent formula/value pairs for the topic "${topic}". Difficulty: ${difficulty}.
Return STRICT JSON:
{
  "pairs": [
    {"left": "expression or formula", "right": "equivalent value or formula"}
  ]
}
Ensure each pair is logically equivalent. No extra text.`;

        let deckJson = null;
        try {
            const response = await callOpenRouter(prompt, 0.5, 900);
            deckJson = safeJsonParse(response);
        } catch (error) {
            deckJson = null;
        }

        if (!deckJson || !deckJson.pairs) {
            deckJson = { pairs: createFallbackPairs(pairsCount) };
        }

        cards = [];
        deckJson.pairs.forEach((pair, index) => {
            const pairId = `pair-${index}`;
            cards.push({ id: `${pairId}-a`, pairId, text: pair.left, state: 'hidden' });
            cards.push({ id: `${pairId}-b`, pairId, text: pair.right, state: 'hidden' });
        });
        cards = shuffle(cards);
        revealed = [];
        moves = 0;
        matches = 0;
        updateStats();
        renderGrid();

        statusEl.textContent = 'Deck ready. Start matching.';
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Cards';
    }

    generateBtn.addEventListener('click', generateDeck);
    updateStats();

    return () => {};
}

function createFallbackPairs(count) {
    const pairs = [];
    for (let i = 0; i < count; i += 1) {
        const a = Math.floor(Math.random() * 9) + 1;
        const b = Math.floor(Math.random() * 9) + 1;
        pairs.push({ left: `${a} + ${b}`, right: `${a + b}` });
    }
    return pairs;
}

// =====================================================================
// MENTAL MATH
// =====================================================================

function renderMentalMath(container) {
    container.innerHTML = `
        <div class="game-play-layout">
            <div class="game-panel">
                <div class="game-section-title"><i class="fas fa-bolt"></i> Drill Setup</div>
                <input class="game-input" id="mentalTopic" placeholder="Topic (e.g., arithmetic, fractions, trig identities)">
                <div class="game-inline">
                    <select class="game-select" id="mentalDifficulty">
                        <option value="easy">Easy</option>
                        <option value="medium" selected>Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <select class="game-select" id="mentalCount">
                        <option value="5">5 Questions</option>
                        <option value="10" selected>10 Questions</option>
                        <option value="15">15 Questions</option>
                    </select>
                </div>
                <button class="btn-primary" id="generateMental"><i class="fas fa-play"></i> Generate Drill</button>
                <div class="sim-status" id="mentalStatus">AI will create rapid-fire questions.</div>
                <div class="game-section-title"><i class="fas fa-chart-line"></i> Stats</div>
                <div id="mentalStats">Score: 0 | Accuracy: 0%</div>
            </div>
            <div class="game-panel">
                <div class="game-section-title"><i class="fas fa-fire"></i> Live Drill</div>
                <div id="mentalStage">
                    <div class="quiz-question-box">
                        <h3>Ready for speed?</h3>
                        <p>Generate a drill and answer as quickly as possible.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const topicInput = container.querySelector('#mentalTopic');
    const difficultySelect = container.querySelector('#mentalDifficulty');
    const countSelect = container.querySelector('#mentalCount');
    const statusEl = container.querySelector('#mentalStatus');
    const statsEl = container.querySelector('#mentalStats');
    const stageEl = container.querySelector('#mentalStage');
    const generateBtn = container.querySelector('#generateMental');

    const state = {
        questions: [],
        current: 0,
        correct: 0,
        answered: 0
    };

    function updateStats() {
        const accuracy = state.answered === 0 ? 0 : Math.round((state.correct / state.answered) * 100);
        statsEl.textContent = `Score: ${state.correct} | Accuracy: ${accuracy}%`;
    }

    function renderQuestion() {
        const question = state.questions[state.current];
        stageEl.innerHTML = `
            <div class="quiz-question-box">
                <div class="game-inline">
                    <div><strong>Question:</strong> ${state.current + 1}/${state.questions.length}</div>
                </div>
                <h3>${question.question}</h3>
                <input class="game-input" id="mentalAnswer" placeholder="Type your answer">
                <div class="game-inline">
                    <button class="btn-primary" id="submitMental">Submit</button>
                    <button class="btn-secondary glass-btn" id="skipMental">Skip</button>
                </div>
                <div class="sim-status">${question.hint || 'Stay sharp.'}</div>
            </div>
        `;

        stageEl.querySelector('#submitMental').addEventListener('click', () => {
            const answer = stageEl.querySelector('#mentalAnswer').value.trim();
            handleAnswer(answer);
        });

        stageEl.querySelector('#skipMental').addEventListener('click', () => {
            handleAnswer(null);
        });
    }

    function handleAnswer(answer) {
        const question = state.questions[state.current];
        state.answered += 1;
        if (answer && answer.toLowerCase() === question.answer.toLowerCase()) {
            state.correct += 1;
        }
        updateStats();
        state.current += 1;
        if (state.current >= state.questions.length) {
            finishDrill();
        } else {
            renderQuestion();
        }
    }

    function finishDrill() {
        const accuracy = state.answered === 0 ? 0 : Math.round((state.correct / state.answered) * 100);
        stageEl.innerHTML = `
            <div class="quiz-question-box">
                <h3>Drill Complete</h3>
                <p>Score: ${state.correct}/${state.questions.length} | Accuracy: ${accuracy}%</p>
                <button class="btn-primary" id="restartMental">New Drill</button>
            </div>
        `;
        stageEl.querySelector('#restartMental').addEventListener('click', () => {
            stageEl.innerHTML = `
                <div class="quiz-question-box">
                    <h3>Generate another drill?</h3>
                    <p>Adjust settings and click Generate Drill.</p>
                </div>
            `;
        });
    }

    async function generateDrill() {
        const topic = topicInput.value.trim();
        if (!topic) {
            showToast('Please enter a topic for the drill.', 'error');
            return;
        }
        const difficulty = difficultySelect.value;
        const count = parseInt(countSelect.value, 10);

        statusEl.textContent = 'Generating questions with AI...';
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        const prompt = `Create ${count} short-answer mental math questions on "${topic}". Difficulty: ${difficulty}.
Return STRICT JSON:
{
  "questions": [
    { "question": "string", "answer": "string", "hint": "short hint" }
  ]
}
No extra text.`;

        let drillJson = null;
        try {
            const response = await callOpenRouter(prompt, 0.5, 800);
            drillJson = safeJsonParse(response);
        } catch (error) {
            drillJson = null;
        }

        if (!drillJson || !drillJson.questions) {
            drillJson = { questions: createFallbackMental(count) };
        }

        state.questions = drillJson.questions;
        state.current = 0;
        state.correct = 0;
        state.answered = 0;
        updateStats();
        renderQuestion();

        statusEl.textContent = 'Drill ready.';
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Drill';
    }

    generateBtn.addEventListener('click', generateDrill);
    updateStats();

    return () => {};
}

function createFallbackMental(count) {
    const questions = [];
    for (let i = 0; i < count; i += 1) {
        const a = Math.floor(Math.random() * 20) + 5;
        const b = Math.floor(Math.random() * 12) + 2;
        questions.push({
            question: `Compute ${a} x ${b}`,
            answer: `${a * b}`,
            hint: 'Multiplication practice.'
        });
    }
    return questions;
}

function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// =====================================================================
// SIMULATORS
// =====================================================================

const SIMULATORS = {
    physics: [
        { id: 'projectile', title: 'Projectile Motion', summary: 'Angle, velocity, gravity, and height. Visualize trajectory and vectors.' },
        { id: 'vector-add', title: 'Vector Addition 3D', summary: 'Drag vectors in 3D and see the resultant live.' },
        { id: 'relative-motion', title: 'Relative Motion', summary: 'Switch observer frames and see relative velocity vectors.' },
        { id: 'laws-motion', title: 'Laws of Motion Playground', summary: 'Apply forces, mass, friction, and watch acceleration.' },
        { id: 'roller-coaster', title: 'Work-Energy Roller Coaster', summary: 'Track motion with KE/PE graphs in sync.' }
    ],
    chemistry: [
        { id: 'orbitals', title: 'Atomic Orbital Visualizer', summary: 's, p, d orbitals in 3D with slicing.' },
        { id: 'vsepr', title: 'Molecular Geometry (VSEPR)', summary: 'Switch shapes and view bond angles.' },
        { id: 'hybrid', title: 'Hybridization Explorer', summary: 'Animate s + p to sp, sp2, sp3.' }
    ],
    maths: [
        { id: 'coord-3d', title: '3D Coordinate Geometry', summary: 'Points, distance, and section formula.' },
        { id: 'plane-line', title: 'Plane & Line in 3D', summary: 'Rotate planes, see intersections and skew.' }
    ]
};

function renderSimulators(container) {
    container.innerHTML = `
        <div class="game-play-layout">
            <div class="game-panel" id="simControlPanel">
                <div class="game-section-title"><i class="fas fa-layer-group"></i> Categories</div>
                <div class="sim-category-grid">
                    <div class="sim-category-card" data-category="physics">
                        <h3>Physics</h3>
                        <p class="sim-status">5 simulators</p>
                    </div>
                    <div class="sim-category-card" data-category="chemistry">
                        <h3>Chemistry</h3>
                        <p class="sim-status">3 simulators</p>
                    </div>
                    <div class="sim-category-card" data-category="maths">
                        <h3>Maths</h3>
                        <p class="sim-status">2 simulators</p>
                    </div>
                </div>
                <div class="game-section-title"><i class="fas fa-cube"></i> Simulator List</div>
                <div class="sim-list" id="simList"></div>
                <div class="sim-status" id="simDescription">Select a category to load simulators.</div>
            </div>
            <div class="game-panel">
                <div class="game-section-title"><i class="fas fa-vr-cardboard"></i> Simulation View</div>
                <div class="game-canvas-panel" id="simCanvasPanel">
                    <div class="sim-canvas-overlay" id="simOverlay"></div>
                </div>
                <div id="simUIControls"></div>
            </div>
        </div>
    `;

    const listEl = container.querySelector('#simList');
    const descriptionEl = container.querySelector('#simDescription');
    const canvasPanel = container.querySelector('#simCanvasPanel');
    const overlayEl = container.querySelector('#simOverlay');
    const uiControls = container.querySelector('#simUIControls');

    let simEngine = null;
    let cleanupFn = null;

    function loadCategory(category) {
        const sims = SIMULATORS[category] || [];
        listEl.innerHTML = sims.map(sim => `
            <div class="sim-list-item" data-sim="${sim.id}">
                <strong>${sim.title}</strong>
                <div class="sim-status">${sim.summary}</div>
            </div>
        `).join('');
        descriptionEl.textContent = `Loaded ${category} simulators.`;
        listEl.querySelectorAll('.sim-list-item').forEach(item => {
            item.addEventListener('click', () => {
                loadSimulator(item.getAttribute('data-sim'));
            });
        });
    }

    function resetSimulationArea() {
        overlayEl.innerHTML = '';
        uiControls.innerHTML = '';
        if (cleanupFn) cleanupFn();
        if (simEngine) simEngine.dispose();
        simEngine = null;
        cleanupFn = null;
        canvasPanel.querySelectorAll('canvas').forEach(c => c.remove());
    }

    function loadSimulator(simId) {
        resetSimulationArea();
        simEngine = createSimEngine(canvasPanel);
        overlayEl.innerHTML = `<span class="sim-badge">${simId.replace('-', ' ')}</span>`;
        switch (simId) {
            case 'projectile':
                cleanupFn = initProjectileSim(simEngine, uiControls, overlayEl);
                break;
            case 'vector-add':
                cleanupFn = initVectorAddSim(simEngine, uiControls, overlayEl);
                break;
            case 'relative-motion':
                cleanupFn = initRelativeMotionSim(simEngine, uiControls, overlayEl);
                break;
            case 'laws-motion':
                cleanupFn = initLawsMotionSim(simEngine, uiControls, overlayEl);
                break;
            case 'roller-coaster':
                cleanupFn = initRollerCoasterSim(simEngine, uiControls, overlayEl);
                break;
            case 'orbitals':
                cleanupFn = initOrbitalSim(simEngine, uiControls, overlayEl);
                break;
            case 'vsepr':
                cleanupFn = initVseprSim(simEngine, uiControls, overlayEl);
                break;
            case 'hybrid':
                cleanupFn = initHybridSim(simEngine, uiControls, overlayEl);
                break;
            case 'coord-3d':
                cleanupFn = initCoordinateSim(simEngine, uiControls, overlayEl);
                break;
            case 'plane-line':
                cleanupFn = initPlaneLineSim(simEngine, uiControls, overlayEl);
                break;
            default:
                break;
        }
    }

    container.querySelectorAll('.sim-category-card').forEach(card => {
        card.addEventListener('click', () => loadCategory(card.getAttribute('data-category')));
    });

    return () => {
        resetSimulationArea();
    };
}

function createSimEngine(container) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x070b1a, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x070b1a, 15, 80);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    camera.position.set(12, 12, 18);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x2c2c44, 0.6);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 10);
    scene.add(dir);
    const point = new THREE.PointLight(0x8b5cf6, 0.6);
    point.position.set(-10, 10, 10);
    scene.add(point);

    const grid = new THREE.GridHelper(40, 40, 0x334155, 0x1f2937);
    grid.position.y = -0.01;
    scene.add(grid);

    let updateFn = null;
    let frameId = null;

    function animate() {
        frameId = requestAnimationFrame(animate);
        if (updateFn) updateFn();
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    function onResize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    return {
        scene,
        camera,
        renderer,
        controls,
        setUpdate(fn) { updateFn = fn; },
        dispose() {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
        }
    };
}

function initProjectileSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const projectile = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x2b1900 })
    );
    scene.add(projectile);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
    const lineGeometry = new THREE.BufferGeometry();
    const trajectoryLine = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(trajectoryLine);

    const velocityArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 1, 0).normalize(), new THREE.Vector3(), 2, 0x22d3ee);
    scene.add(velocityArrow);

    const rangeMarker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xec4899 })
    );
    rangeMarker.position.y = 0.25;
    scene.add(rangeMarker);

    controlsContainer.innerHTML = `
        <div class="game-panel">
            <div class="game-section-title"><i class="fas fa-bullseye"></i> Controls</div>
            <label>Angle (deg)</label>
            <input class="game-input" id="projAngle" type="range" min="15" max="75" value="45">
            <label>Velocity (m/s)</label>
            <input class="game-input" id="projVelocity" type="range" min="5" max="50" value="25">
            <label>Gravity (m/s^2)</label>
            <input class="game-input" id="projGravity" type="range" min="2" max="20" value="9.8" step="0.1">
            <label>Height (m)</label>
            <input class="game-input" id="projHeight" type="range" min="0" max="10" value="2" step="0.5">
        </div>
    `;

    const angleInput = controlsContainer.querySelector('#projAngle');
    const velocityInput = controlsContainer.querySelector('#projVelocity');
    const gravityInput = controlsContainer.querySelector('#projGravity');
    const heightInput = controlsContainer.querySelector('#projHeight');

    let time = 0;
    let flightTime = 1;

    function recompute() {
        const angle = THREE.MathUtils.degToRad(parseFloat(angleInput.value));
        const v = parseFloat(velocityInput.value);
        const g = parseFloat(gravityInput.value);
        const h = parseFloat(heightInput.value);

        const vy = v * Math.sin(angle);
        const vx = v * Math.cos(angle);
        flightTime = (vy + Math.sqrt(vy * vy + 2 * g * h)) / g;
        const points = [];
        const steps = 80;
        for (let i = 0; i <= steps; i += 1) {
            const t = (i / steps) * flightTime;
            const x = vx * t;
            const y = h + vy * t - 0.5 * g * t * t;
            points.push(new THREE.Vector3(x, Math.max(y, 0), 0));
        }
        lineGeometry.setFromPoints(points);
        rangeMarker.position.set(vx * flightTime, 0.25, 0);
        velocityArrow.setDirection(new THREE.Vector3(vx, vy, 0).normalize());
        velocityArrow.setLength(2 + v / 10);
        projectile.position.set(0, h, 0);
        time = 0;
    }

    function update() {
        const angle = THREE.MathUtils.degToRad(parseFloat(angleInput.value));
        const v = parseFloat(velocityInput.value);
        const g = parseFloat(gravityInput.value);
        const h = parseFloat(heightInput.value);
        const vx = v * Math.cos(angle);
        const vy = v * Math.sin(angle);
        time += 0.02;
        if (time > flightTime) time = 0;
        const x = vx * time;
        const y = h + vy * time - 0.5 * g * time * time;
        projectile.position.set(x, Math.max(y, 0), 0);
    }

    angleInput.addEventListener('input', recompute);
    velocityInput.addEventListener('input', recompute);
    gravityInput.addEventListener('input', recompute);
    heightInput.addEventListener('input', recompute);

    recompute();
    engine.setUpdate(update);

    overlayEl.innerHTML += `<span class="sim-badge">Trajectory</span><span class="sim-badge">Velocity Vector</span>`;

    return () => {
        scene.remove(projectile, trajectoryLine, velocityArrow, rangeMarker);
    };
}

function initVectorAddSim(engine, controlsContainer, overlayEl) {
    const { scene, camera, renderer } = engine;
    const origin = new THREE.Vector3(0, 0, 0);
    const vectorA = new THREE.Vector3(4, 2, 0);
    const vectorB = new THREE.Vector3(2, 4, 2);

    const arrowA = new THREE.ArrowHelper(vectorA.clone().normalize(), origin, vectorA.length(), 0x22d3ee);
    const arrowB = new THREE.ArrowHelper(vectorB.clone().normalize(), origin, vectorB.length(), 0xf97316);
    const arrowR = new THREE.ArrowHelper(vectorA.clone().add(vectorB).normalize(), origin, vectorA.clone().add(vectorB).length(), 0x10b981);
    scene.add(arrowA, arrowB, arrowR);

    const handleGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const handleMatA = new THREE.MeshStandardMaterial({ color: 0x22d3ee });
    const handleMatB = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    const handleA = new THREE.Mesh(handleGeo, handleMatA);
    const handleB = new THREE.Mesh(handleGeo, handleMatB);
    scene.add(handleA, handleB);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let activeHandle = null;

    function updateHandles() {
        handleA.position.copy(vectorA);
        handleB.position.copy(vectorB);
        arrowA.setDirection(vectorA.clone().normalize());
        arrowA.setLength(vectorA.length());
        arrowB.setDirection(vectorB.clone().normalize());
        arrowB.setLength(vectorB.length());
        const resultant = vectorA.clone().add(vectorB);
        arrowR.setDirection(resultant.clone().normalize());
        arrowR.setLength(resultant.length());
    }

    function onPointerDown(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects([handleA, handleB]);
        if (intersects.length > 0) {
            activeHandle = intersects[0].object;
        }
    }

    function onPointerMove(event) {
        if (!activeHandle) return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const pos = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, pos);
        if (activeHandle === handleA) {
            vectorA.copy(pos);
        } else if (activeHandle === handleB) {
            vectorB.copy(pos);
        }
        updateHandles();
        updateReadout();
    }

    function onPointerUp() {
        activeHandle = null;
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerUp);

    controlsContainer.innerHTML = `
        <div class="game-panel">
            <div class="game-section-title"><i class="fas fa-arrows-alt"></i> Vectors</div>
            <div id="vectorReadout"></div>
            <p class="sim-status">Drag the vector tips in the plane to change direction and magnitude.</p>
        </div>
    `;

    const readout = controlsContainer.querySelector('#vectorReadout');
    function updateReadout() {
        const res = vectorA.clone().add(vectorB);
        readout.innerHTML = `
            <div class="sim-status">A: (${vectorA.x.toFixed(1)}, ${vectorA.y.toFixed(1)}, ${vectorA.z.toFixed(1)})</div>
            <div class="sim-status">B: (${vectorB.x.toFixed(1)}, ${vectorB.y.toFixed(1)}, ${vectorB.z.toFixed(1)})</div>
            <div class="sim-status">Resultant: (${res.x.toFixed(1)}, ${res.y.toFixed(1)}, ${res.z.toFixed(1)})</div>
        `;
    }

    updateHandles();
    updateReadout();
    overlayEl.innerHTML += `<span class="sim-badge">Drag Handles</span>`;

    return () => {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointerleave', onPointerUp);
        scene.remove(arrowA, arrowB, arrowR, handleA, handleB);
    };
}

function initRelativeMotionSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const obj1 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshStandardMaterial({ color: 0x22d3ee }));
    const obj2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
    scene.add(obj1, obj2);

    const relArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 3, 0xec4899);
    scene.add(relArrow);

    controlsContainer.innerHTML = `
        <div class="game-panel">
            <div class="game-section-title"><i class="fas fa-sync-alt"></i> Relative Motion</div>
            <label>Object A Velocity</label>
            <input class="game-input" id="relVA" type="range" min="1" max="8" value="4">
            <label>Object B Velocity</label>
            <input class="game-input" id="relVB" type="range" min="1" max="8" value="6">
            <label>Observer Frame</label>
            <select class="game-select" id="relFrame">
                <option value="ground">Ground</option>
                <option value="a">Object A</option>
                <option value="b">Object B</option>
            </select>
        </div>
    `;

    const vAInput = controlsContainer.querySelector('#relVA');
    const vBInput = controlsContainer.querySelector('#relVB');
    const frameSelect = controlsContainer.querySelector('#relFrame');

    let t = 0;
    function update() {
        t += 0.02;
        const vA = parseFloat(vAInput.value);
        const vB = parseFloat(vBInput.value);
        const frame = frameSelect.value;
        const posA = new THREE.Vector3(vA * t, 0, 0);
        const posB = new THREE.Vector3(vB * t, 0, 3);

        let obsVel = 0;
        if (frame === 'a') obsVel = vA;
        if (frame === 'b') obsVel = vB;

        obj1.position.set(posA.x - obsVel * t, 0, 0);
        obj2.position.set(posB.x - obsVel * t, 0, 3);

        const relVel = vB - vA;
        relArrow.setDirection(new THREE.Vector3(relVel >= 0 ? 1 : -1, 0, 0));
        relArrow.setLength(Math.abs(relVel) + 1);
        relArrow.position.copy(obj1.position);
    }

    engine.setUpdate(update);
    overlayEl.innerHTML += `<span class="sim-badge">Frame Switching</span>`;

    return () => {
        scene.remove(obj1, obj2, relArrow);
    };
}

function initLawsMotionSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const block = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.6, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x8b5cf6 })
    );
    block.position.y = 0.3;
    scene.add(block);

    const accArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 2, 0x10b981);
    scene.add(accArrow);

    controlsContainer.innerHTML = `
        <div class="game-panel">
            <div class="game-section-title"><i class="fas fa-bolt"></i> Force Controls</div>
            <label>Force (N)</label>
            <input class="game-input" id="forceInput" type="range" min="-20" max="20" value="10">
            <label>Mass (kg)</label>
            <input class="game-input" id="massInput" type="range" min="1" max="10" value="4">
            <label>Friction Coefficient</label>
            <input class="game-input" id="frictionInput" type="range" min="0" max="0.9" value="0.2" step="0.05">
        </div>
    `;

    const forceInput = controlsContainer.querySelector('#forceInput');
    const massInput = controlsContainer.querySelector('#massInput');
    const frictionInput = controlsContainer.querySelector('#frictionInput');

    let velocity = 0;
    let position = 0;
    function update() {
        const force = parseFloat(forceInput.value);
        const mass = parseFloat(massInput.value);
        const mu = parseFloat(frictionInput.value);
        const friction = -Math.sign(velocity) * mu * mass * 9.8;
        const netForce = force + friction;
        const acceleration = netForce / mass;

        velocity += acceleration * 0.02;
        position += velocity * 0.02;
        if (position > 8) position = -8;
        if (position < -8) position = 8;
        block.position.x = position;

        accArrow.setDirection(new THREE.Vector3(acceleration >= 0 ? 1 : -1, 0, 0));
        accArrow.setLength(Math.min(4, Math.abs(acceleration) + 1));
        accArrow.position.set(block.position.x, 1.2, 0);
    }

    engine.setUpdate(update);
    overlayEl.innerHTML += `<span class="sim-badge">Forces</span><span class="sim-badge">Friction</span>`;

    return () => {
        scene.remove(block, accArrow);
    };
}

function initRollerCoasterSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const points = [
        new THREE.Vector3(-8, 3, 0),
        new THREE.Vector3(-4, 6, 2),
        new THREE.Vector3(0, 2, -1),
        new THREE.Vector3(4, 7, 1),
        new THREE.Vector3(8, 3, 0)
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.2, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0x22d3ee });
    const track = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(track);

    const cart = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 24), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    scene.add(cart);

    controlsContainer.innerHTML = `
        <div class="game-panel">
            <div class="game-section-title"><i class="fas fa-chart-area"></i> Energy</div>
            <canvas class="sim-graph" id="energyGraph"></canvas>
            <div class="sim-status">Blue = Potential, Orange = Kinetic</div>
        </div>
    `;
    const graph = controlsContainer.querySelector('#energyGraph');
    const ctx = graph.getContext('2d');

    let t = 0;
    function update() {
        t += 0.0015;
        if (t > 1) t = 0;
        const pos = curve.getPointAt(t);
        cart.position.copy(pos);
        const h0 = 7;
        const h = pos.y;
        const g = 9.8;
        const v = Math.sqrt(Math.max(0.1, 2 * g * (h0 - h)));
        drawEnergyGraph(h, v);
    }

    function drawEnergyGraph(h, v) {
        const w = graph.width = graph.clientWidth;
        const hgt = graph.height = graph.clientHeight;
        ctx.clearRect(0, 0, w, hgt);
        const pe = h / 7;
        const ke = Math.min(1, v / 12);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.fillRect(0, hgt * (1 - pe), w * 0.4, hgt * pe);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.fillRect(w * 0.6, hgt * (1 - ke), w * 0.4, hgt * ke);
    }

    engine.setUpdate(update);
    overlayEl.innerHTML += `<span class="sim-badge">Energy Graph</span>`;

    return () => {
        scene.remove(track, cart);
    };
}

function initOrbitalSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const points = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({ color: 0x8b5cf6, size: 0.08 });
    const cloud = new THREE.Points(points, material);
    scene.add(cloud);

    controlsContainer.innerHTML = `
        <div class="game-panel">
            <div class="game-section-title"><i class="fas fa-atom"></i> Orbital Type</div>
            <select class="game-select" id="orbitalType">
                <option value="s">s orbital</option>
                <option value="p">p orbital</option>
                <option value="d">d orbital</option>
            </select>
            <label>Slice (Y)</label>
            <input class="game-input" id="orbitalSlice" type="range" min="-4" max="4" value="4" step="0.2">
        </div>
    `;

    const typeSelect = controlsContainer.querySelector('#orbitalType');
    const sliceInput = controlsContainer.querySelector('#orbitalSlice');

    function generatePoints(type) {
        const vertices = [];
        for (let i = 0; i < 4000; i += 1) {
            let x = 0;
            let y = 0;
            let z = 0;
            if (type === 's') {
                const r = Math.abs(randNormal()) * 2.2;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.sin(phi) * Math.sin(theta);
                z = r * Math.cos(phi);
            } else if (type === 'p') {
                const r = Math.abs(randNormal()) * 2;
                const sign = Math.random() > 0.5 ? 1 : -1;
                x = r * sign;
                y = randNormal();
                z = randNormal();
            } else {
                const r = Math.abs(randNormal()) * 2;
                const signX = Math.random() > 0.5 ? 1 : -1;
                const signZ = Math.random() > 0.5 ? 1 : -1;
                x = r * signX;
                y = randNormal() * 0.6;
                z = r * signZ;
            }
            vertices.push(x, y, z);
        }
        points.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        points.computeBoundingSphere();
    }

    function applySlice() {
        const slice = parseFloat(sliceInput.value);
        const positions = points.getAttribute('position');
        for (let i = 0; i < positions.count; i += 1) {
            const y = positions.getY(i);
            positions.setY(i, Math.abs(y) > slice ? 9999 : y);
        }
        positions.needsUpdate = true;
    }

    typeSelect.addEventListener('change', () => {
        generatePoints(typeSelect.value);
        applySlice();
    });
    sliceInput.addEventListener('input', applySlice);

    generatePoints('s');
    applySlice();

    overlayEl.innerHTML += `<span class="sim-badge">3D Orbitals</span>`;

    return () => {
        scene.remove(cloud);
    };
}

function initVseprSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const central = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
    scene.add(central);
    const atoms = [];

    controlsContainer.innerHTML = `
        <div class="game-panel">
            <div class="game-section-title"><i class="fas fa-project-diagram"></i> Geometry</div>
            <select class="game-select" id="vseprShape">
                <option value="linear">Linear</option>
                <option value="trigonal">Trigonal Planar</option>
                <option value="tetra">Tetrahedral</option>
                <option value="bipyramidal">Trigonal Bipyramidal</option>
                <option value="octa">Octahedral</option>
            </select>
            <div class="sim-status" id="vseprInfo"></div>
        </div>
    `;

    const shapeSelect = controlsContainer.querySelector('#vseprShape');
    const infoEl = controlsContainer.querySelector('#vseprInfo');

    function setShape(shape) {
        atoms.forEach(atom => scene.remove(atom));
        atoms.length = 0;
        const positions = [];
        let angleInfo = '';
        if (shape === 'linear') {
            positions.push([4, 0, 0], [-4, 0, 0]);
            angleInfo = '180 degrees';
        } else if (shape === 'trigonal') {
            positions.push([4, 0, 0], [-2, 0, 3.5], [-2, 0, -3.5]);
            angleInfo = '120 degrees';
        } else if (shape === 'tetra') {
            positions.push([3, 3, 3], [-3, -3, 3], [-3, 3, -3], [3, -3, -3]);
            angleInfo = '109.5 degrees';
        } else if (shape === 'bipyramidal') {
            positions.push([4, 0, 0], [-2, 0, 3.5], [-2, 0, -3.5], [0, 4, 0], [0, -4, 0]);
            angleInfo = '90 and 120 degrees';
        } else {
            positions.push([4, 0, 0], [-4, 0, 0], [0, 4, 0], [0, -4, 0], [0, 0, 4], [0, 0, -4]);
            angleInfo = '90 degrees';
        }
        positions.forEach(pos => {
            const atom = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), new THREE.MeshStandardMaterial({ color: 0x22d3ee }));
            atom.position.set(pos[0], pos[1], pos[2]);
            atoms.push(atom);
            scene.add(atom);
        });
        infoEl.textContent = `Bond angles: ${angleInfo}`;
    }

    shapeSelect.addEventListener('change', () => setShape(shapeSelect.value));
    setShape('linear');
    overlayEl.innerHTML += `<span class="sim-badge">Bond Angles</span>`;

    return () => {
        atoms.forEach(atom => scene.remove(atom));
        scene.remove(central);
    };
}

function initHybridSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const sOrbital = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), new THREE.MeshStandardMaterial({ color: 0x8b5cf6, opacity: 0.6, transparent: true }));
    const pOrbital1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), new THREE.MeshStandardMaterial({ color: 0x22d3ee, opacity: 0.6, transparent: true }));
    const pOrbital2 = pOrbital1.clone();
    scene.add(sOrbital, pOrbital1, pOrbital2);

    controlsContainer.innerHTML = `
        <div class="game-panel">
            <div class="game-section-title"><i class="fas fa-wave-square"></i> Hybridization</div>
            <select class="game-select" id="hybridType">
                <option value="sp">sp</option>
                <option value="sp2">sp2</option>
                <option value="sp3">sp3</option>
            </select>
        </div>
    `;
    const hybridSelect = controlsContainer.querySelector('#hybridType');

    function setHybrid(type) {
        if (type === 'sp') {
            pOrbital1.position.set(2, 0, 0);
            pOrbital2.position.set(-2, 0, 0);
        } else if (type === 'sp2') {
            pOrbital1.position.set(2, 0, 0);
            pOrbital2.position.set(-1, 0, 1.7);
        } else {
            pOrbital1.position.set(2, 0, 0);
            pOrbital2.position.set(-1, 1.7, 1.7);
        }
    }

    hybridSelect.addEventListener('change', () => setHybrid(hybridSelect.value));
    setHybrid('sp');
    overlayEl.innerHTML += `<span class="sim-badge">Hybrid Orbitals</span>`;

    return () => {
        scene.remove(sOrbital, pOrbital1, pOrbital2);
    };
}

function initCoordinateSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const pointA = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshStandardMaterial({ color: 0x22d3ee }));
    const pointB = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const lineGeom = new THREE.BufferGeometry();
    const line = new THREE.Line(lineGeom, lineMaterial);
    scene.add(pointA, pointB, line);

    controlsContainer.innerHTML = `
        <div class="game-panel">
            <div class="game-section-title"><i class="fas fa-ruler-combined"></i> Points</div>
            <div class="game-inline">
                <input class="game-input" id="ax" value="0">
                <input class="game-input" id="ay" value="0">
                <input class="game-input" id="az" value="0">
            </div>
            <div class="game-inline">
                <input class="game-input" id="bx" value="5">
                <input class="game-input" id="by" value="3">
                <input class="game-input" id="bz" value="2">
            </div>
            <div class="game-section-title"><i class="fas fa-chart-line"></i> Section Ratio</div>
            <div class="game-inline">
                <input class="game-input" id="ratioM" value="1">
                <input class="game-input" id="ratioN" value="1">
            </div>
            <div class="sim-status" id="coordInfo"></div>
        </div>
    `;

    const inputs = controlsContainer.querySelectorAll('input');
    const infoEl = controlsContainer.querySelector('#coordInfo');
    const sectionPoint = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    scene.add(sectionPoint);

    function update() {
        const ax = parseFloat(controlsContainer.querySelector('#ax').value);
        const ay = parseFloat(controlsContainer.querySelector('#ay').value);
        const az = parseFloat(controlsContainer.querySelector('#az').value);
        const bx = parseFloat(controlsContainer.querySelector('#bx').value);
        const by = parseFloat(controlsContainer.querySelector('#by').value);
        const bz = parseFloat(controlsContainer.querySelector('#bz').value);
        const m = parseFloat(controlsContainer.querySelector('#ratioM').value) || 1;
        const n = parseFloat(controlsContainer.querySelector('#ratioN').value) || 1;

        pointA.position.set(ax, ay, az);
        pointB.position.set(bx, by, bz);
        lineGeom.setFromPoints([pointA.position, pointB.position]);

        const sx = (m * bx + n * ax) / (m + n);
        const sy = (m * by + n * ay) / (m + n);
        const sz = (m * bz + n * az) / (m + n);
        sectionPoint.position.set(sx, sy, sz);

        const distance = pointA.position.distanceTo(pointB.position).toFixed(2);
        infoEl.textContent = `Distance AB: ${distance}, Section Point: (${sx.toFixed(2)}, ${sy.toFixed(2)}, ${sz.toFixed(2)})`;
    }

    inputs.forEach(input => input.addEventListener('input', update));
    update();
    overlayEl.innerHTML += `<span class="sim-badge">Section Formula</span>`;

    return () => {
        scene.remove(pointA, pointB, line, sectionPoint);
    };
}

function initPlaneLineSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, opacity: 0.3, transparent: true, side: THREE.DoubleSide });
    const planeGeom = new THREE.PlaneGeometry(12, 12);
    const planeMesh = new THREE.Mesh(planeGeom, planeMat);
    scene.add(planeMesh);

    const lineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
    const lineGeom = new THREE.BufferGeometry();
    const line = new THREE.Line(lineGeom, lineMat);
    scene.add(line);

    controlsContainer.innerHTML = `
        <div class="game-panel">
            <div class="game-section-title"><i class="fas fa-sliders-h"></i> Plane</div>
            <label>Plane Normal Theta</label>
            <input class="game-input" id="planeTheta" type="range" min="0" max="180" value="45">
            <label>Plane Normal Phi</label>
            <input class="game-input" id="planePhi" type="range" min="0" max="180" value="45">
            <label>Plane Offset</label>
            <input class="game-input" id="planeOffset" type="range" min="-3" max="3" value="0" step="0.2">
            <div class="game-section-title"><i class="fas fa-grip-lines"></i> Line</div>
            <label>Line Direction Theta</label>
            <input class="game-input" id="lineTheta" type="range" min="0" max="180" value="60">
            <label>Line Direction Phi</label>
            <input class="game-input" id="linePhi" type="range" min="0" max="180" value="60">
            <div class="sim-status" id="planeInfo"></div>
        </div>
    `;

    const inputs = controlsContainer.querySelectorAll('input');
    const infoEl = controlsContainer.querySelector('#planeInfo');

    function update() {
        const theta = THREE.MathUtils.degToRad(parseFloat(controlsContainer.querySelector('#planeTheta').value));
        const phi = THREE.MathUtils.degToRad(parseFloat(controlsContainer.querySelector('#planePhi').value));
        const offset = parseFloat(controlsContainer.querySelector('#planeOffset').value);
        const normal = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta)
        );
        planeMesh.position.copy(normal.clone().multiplyScalar(offset));
        planeMesh.lookAt(normal);

        const lTheta = THREE.MathUtils.degToRad(parseFloat(controlsContainer.querySelector('#lineTheta').value));
        const lPhi = THREE.MathUtils.degToRad(parseFloat(controlsContainer.querySelector('#linePhi').value));
        const lineDir = new THREE.Vector3(
            Math.sin(lPhi) * Math.cos(lTheta),
            Math.cos(lPhi),
            Math.sin(lPhi) * Math.sin(lTheta)
        ).normalize();

        const p0 = new THREE.Vector3(-6, 0, -6);
        const p1 = p0.clone().add(lineDir.clone().multiplyScalar(12));
        lineGeom.setFromPoints([p0, p1]);

        const denom = normal.dot(lineDir);
        if (Math.abs(denom) < 0.01) {
            infoEl.textContent = 'Line is parallel to the plane.';
        } else {
            infoEl.textContent = 'Line intersects the plane.';
        }
    }

    inputs.forEach(input => input.addEventListener('input', update));
    update();
    overlayEl.innerHTML += `<span class="sim-badge">Intersection Check</span>`;

    return () => {
        scene.remove(planeMesh, line);
    };
}

function randNormal() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGames);
} else {
    initGames();
}
