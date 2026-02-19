// Import Three.js as ES Module
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Make THREE and OrbitControls globally available for compatibility
window.THREE = THREE;
window.OrbitControls = OrbitControls;

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

async function callOpenRouter(prompt, temperature = 0.6, maxTokens = 2000) {
    console.log('🎮 Games AI request:', prompt.substring(0, 100) + '...');
    
    const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'z-ai/glm-4.5-air:free',
            messages: [{ role: 'user', content: prompt }],
            temperature
        })
    });

    if (!response.ok) {
        console.error('❌ AI request failed:', response.status);
        throw new Error('AI request failed');
    }
    
    const data = await response.json();
    console.log('📡 Games AI response:', data);
    
    // GLM-4.5-air puts response in reasoning field, not content field
    const messageData = data.choices?.[0]?.message;
    let aiResponse = '';
    
    // Try content field first
    if (messageData?.content && messageData.content.trim()) {
        aiResponse = messageData.content.trim();
        console.log('📝 Using content field');
    }
    // Fallback to reasoning field (GLM-4.5-air)
    else if (messageData?.reasoning) {
        aiResponse = messageData.reasoning.trim();
        console.log('📝 Using reasoning field');
        
        // Try to extract JSON from reasoning
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/g);
        if (jsonMatch) {
            aiResponse = jsonMatch[jsonMatch.length - 1]; // Get last JSON object
            console.log('📝 Extracted JSON from reasoning');
        }
    }
    
    console.log('🤖 Final AI response:', aiResponse.substring(0, 200) + '...');
    return aiResponse;
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
            if (!response || response.trim().length === 0) {
                throw new Error('Empty AI response');
            }
            deckJson = safeJsonParse(response);
            if (!deckJson || !deckJson.pairs || deckJson.pairs.length === 0) {
                throw new Error('Invalid deck format from AI');
            }
        } catch (error) {
            console.error('❌ Memory Match AI error:', error);
            statusEl.textContent = '❌ AI generation failed. Please try again.';
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Cards';
            showToast('Failed to generate cards with AI. Check console for details.', 'error');
            return;
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
            if (!response || response.trim().length === 0) {
                throw new Error('Empty AI response');
            }
            drillJson = safeJsonParse(response);
            if (!drillJson || !drillJson.questions || drillJson.questions.length === 0) {
                throw new Error('Invalid drill format from AI');
            }
        } catch (error) {
            console.error('❌ Mental Math AI error:', error);
            statusEl.textContent = '❌ AI generation failed. Please try again.';
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Drill';
            showToast('Failed to generate drill with AI. Check console for details.', 'error');
            return;
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
        { id: 'laws-motion', title: 'Friction Simulator', summary: 'Apply forces, adjust friction, observe static vs kinetic friction.' },
        { id: 'roller-coaster', title: 'Work-Energy Roller Coaster', summary: 'Track motion with KE/PE graphs in sync.' },
        { id: 'shm', title: 'Simple Harmonic Motion', summary: 'Pendulum: period, amplitude and energy in real time.' },
        { id: 'collision', title: 'Elastic vs Inelastic Collision', summary: 'Compare elastic and inelastic collisions with momentum & KE graphs.' }
    ],
    chemistry: [
        { id: 'orbitals', title: 'Atomic Orbital Visualizer', summary: 's, p, d orbitals in 3D with slicing.' },
        { id: 'vsepr', title: 'Molecular Geometry (VSEPR)', summary: 'Switch shapes and view bond angles.' },
        { id: 'hybrid', title: 'Hybridization Explorer', summary: 'Animate s + p to sp, sp2, sp3.' },
        { id: 'mo-diagram', title: 'Molecular Orbital Diagram', summary: 'MO energy diagrams for N₂, O₂, F₂, NO, CO.' },
        { id: 'photoelectric', title: 'Photoelectric Effect', summary: 'Watch electrons ejected as light intensity and frequency change.' },
        { id: 'orbital-overlap', title: 'Orbital Overlap', summary: 's and p orbital overlap: bonding, antibonding, and zero overlap.' },
        { id: 'redox-balance', title: 'Redox Balancing', summary: 'Step-by-step balancing via half-reaction or oxidation state method.' }
    ],
    maths: [
        { id: 'coord-3d', title: '3D Coordinate Geometry', summary: 'Points, distance, and section formula.' },
        { id: 'plane-line', title: 'Plane & Line in 3D', summary: 'Rotate planes, see intersections and skew.' },
        { id: 'lpp', title: 'Linear Programming (LPP)', summary: 'Feasible region, corner points, optimal solution.' },
        { id: 'function-graph', title: 'Graphs of Functions', summary: 'Relations & Functions: plot multiple function types and their domains.' },
        { id: 'wave-graph', title: 'Sine & Cosine Waves', summary: 'Visualize A·sin(Bx+C)+D and A·cos(Bx+C)+D with live controls.' }
    ]
};

function renderSimulators(container) {
    container.innerHTML = `
        <div class="game-play-layout">
            <div class="game-panel" id="simControlPanel">
                <div class="game-section-title"><i class="fas fa-layer-group"></i> 🎯 Categories</div>
                <div class="sim-category-grid">
                    <div class="sim-category-card" data-category="physics">
                        <div class="category-icon">⚡</div>
                        <h3>Physics</h3>
                        <p class="sim-status">7 simulators</p>
                    </div>
                    <div class="sim-category-card" data-category="chemistry">
                        <div class="category-icon">🧪</div>
                        <h3>Chemistry</h3>
                        <p class="sim-status">7 simulators</p>
                    </div>
                    <div class="sim-category-card" data-category="maths">
                        <div class="category-icon">📐</div>
                        <h3>Maths</h3>
                        <p class="sim-status">5 simulators</p>
                    </div>
                </div>
                <div class="game-section-title" style="margin-top: 16px;"><i class="fas fa-cube"></i> 📋 Simulator List</div>
                <div class="sim-list" id="simList"></div>
                <div class="sim-status" id="simDescription">Select a category to load simulators.</div>
            </div>
            <div class="game-panel">
                <div class="game-section-title"><i class="fas fa-vr-cardboard"></i> 🎮 Simulation View</div>
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
        const icons = {
            physics: '⚡',
            chemistry: '🧪',
            maths: '📐'
        };
        listEl.innerHTML = sims.map(sim => `
            <div class="sim-list-item" data-sim="${sim.id}">
                <div class="sim-item-icon">${icons[category] || '🎯'}</div>
                <div class="sim-item-content">
                    <strong class="sim-item-title">${sim.title}</strong>
                    <div class="sim-status">${sim.summary}</div>
                </div>
            </div>
        `).join('');
        descriptionEl.innerHTML = `<strong style="color: #8b5cf6;">✅ Loaded</strong> ${category} simulators.`;
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
        const hideAxes = ['orbitals', 'vsepr', 'hybrid'].includes(simId); // Hide axes for chemistry sims
        simEngine = createSimEngine(canvasPanel, hideAxes);
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
            case 'shm':
                cleanupFn = initSHMSim(simEngine, uiControls, overlayEl);
                break;
            case 'lpp':
                cleanupFn = initLPPSim(simEngine, uiControls, overlayEl);
                break;
            case 'mo-diagram':
                cleanupFn = initMOSim(simEngine, uiControls, overlayEl);
                break;
            case 'photoelectric':
                cleanupFn = initPhotoelectricSim(simEngine, uiControls, overlayEl);
                break;
            case 'orbital-overlap':
                cleanupFn = initOrbitalOverlapSim(simEngine, uiControls, overlayEl);
                break;
            case 'redox-balance':
                cleanupFn = initRedoxSim(simEngine, uiControls, overlayEl);
                break;
            case 'collision':
                cleanupFn = initCollisionSim(simEngine, uiControls, overlayEl);
                break;
            case 'function-graph':
                cleanupFn = initFunctionGraphSim(simEngine, uiControls, overlayEl);
                break;
            case 'wave-graph':
                cleanupFn = initWaveGraphSim(simEngine, uiControls, overlayEl);
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

function createSimEngine(container, hideAxes = false) {
    // Clear container first
    container.innerHTML = '';
    
    // Ensure container has proper dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;
    
    console.log('🎨 Creating sim engine with dimensions:', width, 'x', height);
    
    // Create renderer with explicit settings
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: false,
        preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x0a0a1a, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Ensure canvas is visible with explicit styles
    renderer.domElement.style.cssText = 'width: 100%; height: 100%; display: block; position: relative;';
    renderer.domElement.setAttribute('data-engine', 'active');
    
    container.appendChild(renderer.domElement);
    console.log('✅ Canvas appended to container');

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);
    
    // Add beautiful gradient background
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 512;
    bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext('2d');
    const gradient = bgCtx.createRadialGradient(256, 256, 0, 256, 256, 400);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0a0a1a');
    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, 512, 512);
    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    scene.background = bgTexture;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
    camera.position.set(10, 8, 15);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI * 0.85;

    // Enhanced lighting for realistic look
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    
    const hemi = new THREE.HemisphereLight(0x88ccff, 0x444422, 0.5);
    scene.add(hemi);
    
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(15, 25, 15);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 100;
    dir.shadow.camera.left = -30;
    dir.shadow.camera.right = 30;
    dir.shadow.camera.top = 30;
    dir.shadow.camera.bottom = -30;
    scene.add(dir);
    
    const point1 = new THREE.PointLight(0x8b5cf6, 0.8, 50);
    point1.position.set(-10, 10, 10);
    scene.add(point1);
    
    const point2 = new THREE.PointLight(0x22d3ee, 0.6, 50);
    point2.position.set(10, 5, -10);
    scene.add(point2);

    // Create a beautiful floor/ground
    const floorGeometry = new THREE.PlaneGeometry(80, 80);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a2e,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.9
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid with better styling
    const grid = new THREE.GridHelper(40, 40, 0x4a5568, 0x2d3748);
    grid.position.y = 0;
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);
    
    // Add subtle axis lines (hide for chemistry sims)
    let axisHelper = null;
    if (!hideAxes) {
        axisHelper = new THREE.AxesHelper(5);
        axisHelper.position.y = 0.01;
        scene.add(axisHelper);
    }

    let updateFn = null;
    let frameId = null;

    function animate() {
        frameId = requestAnimationFrame(animate);
        if (updateFn) updateFn();
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    console.log('✅ Sim engine started, rendering...');

    function onResize() {
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 520;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);
    
    // Trigger initial resize after a short delay
    setTimeout(onResize, 100);

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
    const { scene, camera } = engine;
    // Scale factor: divide real values to fit scene
    const S = 0.4;
    
    // Launcher platform
    const launcherBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.3, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.5, roughness: 0.5 })
    );
    launcherBase.position.set(0, 0.15, 0);
    launcherBase.castShadow = true;
    scene.add(launcherBase);

    // Cannon barrel
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 2, 16),
        new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.7, roughness: 0.3 })
    );
    barrel.position.set(0, 0.5, 0);
    scene.add(barrel);

    // Projectile
    const projectile = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.2 })
    );
    projectile.castShadow = true;
    scene.add(projectile);

    // Trajectory line
    const lineGeometry = new THREE.BufferGeometry();
    const trajectoryLine = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 }));
    scene.add(trajectoryLine);

    // Range marker
    const rangeMarker = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.08, 16, 32),
        new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.3 })
    );
    rangeMarker.rotation.x = Math.PI / 2;
    rangeMarker.position.y = 0.1;
    scene.add(rangeMarker);

    // Velocity arrow
    const velocityArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 1, 0).normalize(), new THREE.Vector3(), 3, 0x22d3ee, 0.4, 0.25);
    scene.add(velocityArrow);

    // Camera for projectile - side view to clearly show parabolic arc
    camera.position.set(7, 5, 22);
    camera.lookAt(7, 4, 0);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title"><i class="fas fa-rocket"></i> 🎮 Projectile Controls</div>
            <div class="sim-control-row">
                <label>🎯 Launch Angle</label>
                <input class="sim-slider" id="projAngle" type="range" min="10" max="80" value="45">
                <span class="sim-slider-val" id="angleVal">45°</span>
            </div>
            <div class="sim-control-row">
                <label>💨 Initial Velocity</label>
                <input class="sim-slider" id="projVelocity" type="range" min="5" max="50" value="20">
                <span class="sim-slider-val" id="velVal">20 m/s</span>
            </div>
            <div class="sim-control-row">
                <label>🌍 Gravity</label>
                <input class="sim-slider" id="projGravity" type="range" min="1" max="20" value="9.8" step="0.1">
                <span class="sim-slider-val" id="gravVal">9.8 m/s²</span>
            </div>
            <div class="sim-control-row">
                <label>📏 Launch Height</label>
                <input class="sim-slider" id="projHeight" type="range" min="0" max="10" value="2" step="0.5">
                <span class="sim-slider-val" id="heightVal">2 m</span>
            </div>
            <div class="sim-stats-grid">
                <div class="sim-stat-card"><div class="sim-stat-label">Range</div><div class="sim-stat-value" id="rangeVal">--</div><div class="sim-stat-unit">m</div></div>
                <div class="sim-stat-card"><div class="sim-stat-label">Max Height</div><div class="sim-stat-value" id="maxHVal">--</div><div class="sim-stat-unit">m</div></div>
                <div class="sim-stat-card"><div class="sim-stat-label">Flight Time</div><div class="sim-stat-value" id="flightVal">--</div><div class="sim-stat-unit">s</div></div>
            </div>
            <button class="btn-primary sim-action-btn" id="launchProjBtn"><i class="fas fa-space-shuttle"></i> Launch</button>
            <button class="btn-secondary sim-action-btn" id="resetProjBtn"><i class="fas fa-redo"></i> Reset</button>
        </div>
    `;

    const angleInput = controlsContainer.querySelector('#projAngle');
    const velocityInput = controlsContainer.querySelector('#projVelocity');
    const gravityInput = controlsContainer.querySelector('#projGravity');
    const heightInput = controlsContainer.querySelector('#projHeight');
    const launchBtn = controlsContainer.querySelector('#launchProjBtn');
    const resetBtn = controlsContainer.querySelector('#resetProjBtn');

    let time = 0;
    let flightTime = 1;
    let isLaunched = false;
    let animationSpeed = 1.5; // slightly faster for better visual clarity

    function updateLabels() {
        controlsContainer.querySelector('#angleVal').textContent = angleInput.value + '°';
        controlsContainer.querySelector('#velVal').textContent = velocityInput.value + ' m/s';
        controlsContainer.querySelector('#gravVal').textContent = gravityInput.value + ' m/s²';
        controlsContainer.querySelector('#heightVal').textContent = heightInput.value + ' m';
    }

    function recompute() {
        const angle = THREE.MathUtils.degToRad(parseFloat(angleInput.value));
        const v = parseFloat(velocityInput.value);
        const g = parseFloat(gravityInput.value);
        const h = parseFloat(heightInput.value);
        const vy = v * Math.sin(angle);
        const vx = v * Math.cos(angle);
        flightTime = (vy + Math.sqrt(vy * vy + 2 * g * h)) / g;
        const range = vx * flightTime;
        const maxHeight = h + (vy * vy) / (2 * g);

        controlsContainer.querySelector('#rangeVal').textContent = range.toFixed(1);
        controlsContainer.querySelector('#maxHVal').textContent = maxHeight.toFixed(1);
        controlsContainer.querySelector('#flightVal').textContent = flightTime.toFixed(2);

        // Update barrel angle
        barrel.rotation.z = angle;
        barrel.position.set(Math.cos(angle) * 0.8, 0.4 + Math.sin(angle) * 0.8, 0);

        // Trajectory points scaled to fit view
        const points = [];
        const steps = 120;
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * flightTime;
            const x = vx * t * S;
            const y = (h + vy * t - 0.5 * g * t * t) * S;
            points.push(new THREE.Vector3(x, Math.max(y, 0), 0));
        }
        lineGeometry.setFromPoints(points);
        rangeMarker.position.set(range * S, 0.15, 0);

        velocityArrow.position.set(0, h * S, 0);
        velocityArrow.setDirection(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
        velocityArrow.setLength(1.5 + v / 20);
        projectile.position.set(0, h * S, 0);
        time = 0;
    }

    function update() {
        if (!isLaunched) return;
        
        const angle = THREE.MathUtils.degToRad(parseFloat(angleInput.value));
        const v = parseFloat(velocityInput.value);
        const g = parseFloat(gravityInput.value);
        const h = parseFloat(heightInput.value);
        const vx = v * Math.cos(angle);
        const vy = v * Math.sin(angle);
        
        // Realistic physics with proper gravity!
        time += 0.016 * animationSpeed;
        
        if (time > flightTime) {
            time = 0; // Loop animation
            projectile.position.set(0, h * S, 0);
        }
        
        const x = vx * time * S;
        const y = (h + vy * time - 0.5 * g * time * time) * S;
        
        // Keep projectile above ground
        if (y >= 0) {
            projectile.position.set(x, y, 0);
        } else {
            projectile.position.set(x, 0, 0);
        }
        
        rangeMarker.rotation.z += 0.03;
    }

    [angleInput, velocityInput, gravityInput, heightInput].forEach(inp => {
        inp.addEventListener('input', () => { 
            updateLabels(); 
            recompute();
            if (!isLaunched) {
                // Update projectile position at launch point when adjusting
                projectile.position.set(0, parseFloat(heightInput.value) * S, 0);
            }
        });
    });
    
    launchBtn.addEventListener('click', () => { 
        if (!isLaunched) {
            isLaunched = true;
            time = 0;
            launchBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        } else {
            isLaunched = false;
            launchBtn.innerHTML = '<i class="fas fa-space-shuttle"></i> Launch';
        }
    });
    
    resetBtn.addEventListener('click', () => { 
        isLaunched = false;
        time = 0;
        projectile.position.set(0, parseFloat(heightInput.value) * S, 0);
        launchBtn.innerHTML = '<i class="fas fa-space-shuttle"></i> Launch';
    });

    updateLabels();
    recompute();
    engine.setUpdate(update);
    overlayEl.innerHTML += `<span class="sim-badge">🎯 Trajectory</span><span class="sim-badge">⚡ Real-time</span>`;

    return () => {
        scene.remove(projectile, trajectoryLine, velocityArrow, rangeMarker, launcherBase, barrel);
    };
}

function initVectorAddSim(engine, controlsContainer, overlayEl) {
    const { scene, camera } = engine;
    
    // Hide the 3D scene - we'll use a 2D canvas overlay instead
    camera.position.set(0, 100, 0.01);
    camera.lookAt(0, 0, 0);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title"><i class="fas fa-arrows-alt"></i> 📐 Vector Addition</div>
            
            <div style="display:flex;gap:12px;margin-bottom:8px;">
                <button class="btn-primary" id="vecMethodBtn" style="flex:1;padding:6px;font-size:0.8rem;">Tail-to-Tip</button>
                <button class="btn-secondary" id="vecParallelBtn" style="flex:1;padding:6px;font-size:0.8rem;">Parallelogram</button>
            </div>
            
            <canvas id="vecCanvas2D" width="340" height="300" style="width:100%;border-radius:10px;background:#0f1419;display:block;margin-bottom:10px;"></canvas>

            <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;">
                <span style="color:#22d3ee;font-weight:700;min-width:14px;">A</span>
                <label style="font-size:0.78rem;min-width:40px;">mag</label>
                <input class="sim-slider" id="vaMag" type="range" min="1" max="8" value="5" step="0.5" style="flex:1;">
                <span class="sim-slider-val" id="vaMagVal">5</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
                <span style="color:#22d3ee;font-weight:700;min-width:14px;">A</span>
                <label style="font-size:0.78rem;min-width:40px;">angle</label>
                <input class="sim-slider" id="vaAng" type="range" min="0" max="360" value="30" step="5" style="flex:1;">
                <span class="sim-slider-val" id="vaAngVal">30°</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;">
                <span style="color:#f97316;font-weight:700;min-width:14px;">B</span>
                <label style="font-size:0.78rem;min-width:40px;">mag</label>
                <input class="sim-slider" id="vbMag" type="range" min="1" max="8" value="4" step="0.5" style="flex:1;">
                <span class="sim-slider-val" id="vbMagVal">4</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;">
                <span style="color:#f97316;font-weight:700;min-width:14px;">B</span>
                <label style="font-size:0.78rem;min-width:40px;">angle</label>
                <input class="sim-slider" id="vbAng" type="range" min="0" max="360" value="110" step="5" style="flex:1;">
                <span class="sim-slider-val" id="vbAngVal">110°</span>
            </div>
            
            <div class="sim-stats-grid">
                <div class="sim-stat-card" style="border-left:3px solid #22d3ee">
                    <div class="sim-stat-label">|A|</div>
                    <div class="sim-stat-value" id="magA">5.0</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #f97316">
                    <div class="sim-stat-label">|B|</div>
                    <div class="sim-stat-value" id="magB">4.0</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #10b981">
                    <div class="sim-stat-label">|R|</div>
                    <div class="sim-stat-value" id="magR">--</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #a855f7">
                    <div class="sim-stat-label">R angle</div>
                    <div class="sim-stat-value" id="angR">--</div>
                    <div class="sim-stat-unit">°</div>
                </div>
            </div>
            <div class="sim-status" id="vectorReadout" style="margin-top:8px;font-size:0.82rem;"></div>
        </div>
    `;

    const canvas = controlsContainer.querySelector('#vecCanvas2D');
    const ctx = canvas.getContext('2d');
    let method = 'tip'; // 'tip' or 'para'

    controlsContainer.querySelector('#vecMethodBtn').addEventListener('click', () => { method = 'tip'; drawVectors(); });
    controlsContainer.querySelector('#vecParallelBtn').addEventListener('click', () => { method = 'para'; drawVectors(); });

    function drawArrow2D(ctx, x1, y1, x2, y2, color, width, label) {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len < 2) return;
        const ang = Math.atan2(dy, dx);
        const hLen = Math.min(18, len * 0.35);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - hLen * Math.cos(ang - 0.38), y2 - hLen * Math.sin(ang - 0.38));
        ctx.lineTo(x2 - hLen * 0.6 * Math.cos(ang), y2 - hLen * 0.6 * Math.sin(ang));
        ctx.lineTo(x2 - hLen * Math.cos(ang + 0.38), y2 - hLen * Math.sin(ang + 0.38));
        ctx.closePath();
        ctx.fill();

        if (label) {
            ctx.fillStyle = color;
            ctx.font = 'bold 13px sans-serif';
            const mx = (x1 + x2) / 2 - 12 * Math.sin(ang);
            const my = (y1 + y2) / 2 + 12 * Math.cos(ang);
            ctx.fillText(label, mx, my);
        }
        ctx.restore();
    }

    function dashedLine2D(ctx, x1, y1, x2, y2, color) {
        ctx.save();
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    function drawVectors() {
        const aMag = parseFloat(controlsContainer.querySelector('#vaMag').value);
        const aAng = parseFloat(controlsContainer.querySelector('#vaAng').value) * Math.PI / 180;
        const bMag = parseFloat(controlsContainer.querySelector('#vbMag').value);
        const bAng = parseFloat(controlsContainer.querySelector('#vbAng').value) * Math.PI / 180;

        controlsContainer.querySelector('#vaMagVal').textContent = aMag.toFixed(1);
        controlsContainer.querySelector('#vaAngVal').textContent = controlsContainer.querySelector('#vaAng').value + '°';
        controlsContainer.querySelector('#vbMagVal').textContent = bMag.toFixed(1);
        controlsContainer.querySelector('#vbAngVal').textContent = controlsContainer.querySelector('#vbAng').value + '°';

        const W = canvas.width, H = canvas.height;
        const scale = 22; // pixels per unit
        const ox = W / 2, oy = H / 2 + 20; // origin

        // Clear
        ctx.fillStyle = '#0f1419';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.save();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let x = ox % scale; x < W; x += scale) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = oy % scale; y < H; y += scale) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        // Axes
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
        // Axis labels
        ctx.fillStyle = '#475569'; ctx.font = '10px sans-serif';
        ctx.fillText('+X', W - 20, oy - 5);
        ctx.fillText('+Y', ox + 5, 12);
        ctx.restore();

        // Component vectors  
        const ax = aMag * Math.cos(aAng), ay = aMag * Math.sin(aAng);
        const bx = bMag * Math.cos(bAng), by = bMag * Math.sin(bAng);
        const rx = ax + bx, ry = ay + by;
        const rMag = Math.sqrt(rx*rx + ry*ry);
        const rAng = Math.atan2(ry, rx) * 180 / Math.PI;

        // Note: canvas Y is flipped (positive Y goes down)
        const ax_px = ax * scale, ay_px = -ay * scale; // flip Y
        const bx_px = bx * scale, by_px = -by * scale;
        const rx_px = rx * scale, ry_px = -ry * scale;

        if (method === 'tip') {
            // Tail-to-tip: A from origin, B from tip of A
            drawArrow2D(ctx, ox, oy, ox + ax_px, oy + ay_px, '#22d3ee', 3, 'A');
            drawArrow2D(ctx, ox + ax_px, oy + ay_px, ox + ax_px + bx_px, oy + ay_px + by_px, '#f97316', 3, 'B');
            drawArrow2D(ctx, ox, oy, ox + rx_px, oy + ry_px, '#10b981', 3.5, 'R');

            // Label method
            ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
            ctx.fillText('Tail-to-Tip Method', 8, 15);
        } else {
            // Parallelogram: both from origin, dashed copies, resultant is diagonal
            drawArrow2D(ctx, ox, oy, ox + ax_px, oy + ay_px, '#22d3ee', 3, 'A');
            drawArrow2D(ctx, ox, oy, ox + bx_px, oy + by_px, '#f97316', 3, 'B');
            // Dashed copies
            dashedLine2D(ctx, ox + bx_px, oy + by_px, ox + rx_px, oy + ry_px, '#22d3ee');
            dashedLine2D(ctx, ox + ax_px, oy + ay_px, ox + rx_px, oy + ry_px, '#f97316');
            // Resultant diagonal
            drawArrow2D(ctx, ox, oy, ox + rx_px, oy + ry_px, '#10b981', 3.5, 'R');

            ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
            ctx.fillText('Parallelogram Method', 8, 15);
        }

        // Origin dot
        ctx.beginPath();
        ctx.arc(ox, oy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();

        // Component readout
        ctx.fillStyle = '#22d3ee'; ctx.font = '11px sans-serif';
        ctx.fillText(`A: (${ax.toFixed(1)}, ${ay.toFixed(1)})`, 8, H - 44);
        ctx.fillStyle = '#f97316';
        ctx.fillText(`B: (${bx.toFixed(1)}, ${by.toFixed(1)})`, 8, H - 28);
        ctx.fillStyle = '#10b981';
        ctx.fillText(`R: (${rx.toFixed(1)}, ${ry.toFixed(1)})`, 8, H - 12);

        controlsContainer.querySelector('#magA').textContent = aMag.toFixed(2);
        controlsContainer.querySelector('#magB').textContent = bMag.toFixed(2);
        controlsContainer.querySelector('#magR').textContent = rMag.toFixed(2);
        controlsContainer.querySelector('#angR').textContent = rAng.toFixed(1);
        controlsContainer.querySelector('#vectorReadout').innerHTML = `
            <strong style="color:#22d3ee">A</strong> = ${aMag.toFixed(1)} at ${(aAng*180/Math.PI).toFixed(0)}° &nbsp;
            <strong style="color:#f97316">B</strong> = ${bMag.toFixed(1)} at ${(bAng*180/Math.PI).toFixed(0)}°<br>
            <strong style="color:#10b981">R = A + B</strong>: magnitude <strong>${rMag.toFixed(2)}</strong> at <strong>${rAng.toFixed(1)}°</strong>
        `;
    }

    controlsContainer.querySelectorAll('input[type="range"]').forEach(inp => inp.addEventListener('input', drawVectors));
    drawVectors();

    // No 3D update needed - pure 2D canvas
    engine.setUpdate(() => {});
    overlayEl.innerHTML += `<span class="sim-badge">📐 2D Vector Addition</span><span class="sim-badge">⛓️ Tail-to-Tip & Parallelogram</span>`;

    return () => {
        // Nothing to remove from scene - 2D canvas only
    };
}

function initRelativeMotionSim(engine, controlsContainer, overlayEl) {
    const { scene, camera } = engine;
    
    // Position camera for better view
    camera.position.set(0, 8, 16);
    camera.lookAt(0, 1, 0);

    // Create detailed train (Object A) — longer with 2 carriages + locomotive
    const trainGroup = new THREE.Group();
    // Locomotive body
    const trainBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.3, 1.0),
        new THREE.MeshStandardMaterial({ 
            color: 0x22d3ee, 
            emissive: 0x22d3ee, 
            emissiveIntensity: 0.2,
            metalness: 0.7,
            roughness: 0.3 
        })
    );
    trainBody.position.set(0, 0.65, 0);
    trainGroup.add(trainBody);
    // Locomotive cabin/nose
    const trainFront = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.9, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.8, roughness: 0.2 })
    );
    trainFront.position.set(1.65, 0.9, 0);
    trainGroup.add(trainFront);
    // Chimney on top
    const chimney = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    chimney.position.set(0.8, 1.55, 0);
    trainGroup.add(chimney);
    // Carriage 1
    const carriage1 = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.1, 0.95),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.1, metalness: 0.6 })
    );
    carriage1.position.set(-3.2, 0.55, 0);
    trainGroup.add(carriage1);
    // Carriage 2
    const carriage2 = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.1, 0.95),
        new THREE.MeshStandardMaterial({ color: 0x0891b2, emissive: 0x0891b2, emissiveIntensity: 0.1, metalness: 0.6 })
    );
    carriage2.position.set(-6.2, 0.55, 0);
    trainGroup.add(carriage2);
    // Coupler between loco and carriage1
    const coupler1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 }));
    coupler1.position.set(-1.8, 0.4, 0);
    trainGroup.add(coupler1);
    // Coupler between carriage1 and carriage2
    const coupler2 = coupler1.clone();
    coupler2.position.set(-4.85, 0.4, 0);
    trainGroup.add(coupler2);
    // Wheels for all sections
    const wheelPositions = [
        [1.0, -3.0], [0.2, -3.0],   // loco wheels
        [-2.0, -3.0], [-3.0, -3.0], // loco rear + carriage1 front
        [-4.3, -3.0], [-5.1, -3.0], // carriage1 rear + carriage2 front
        [-6.3, -3.0], [-7.1, -3.0], // carriage2 rear
    ];
    wheelPositions.forEach(([wx, wz]) => {
        [-0.6, 0.6].forEach(side => {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.18, 0.14, 16),
                new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.1 })
            );
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(wx, 0.18, side);
            trainGroup.add(wheel);
        });
    });
    trainGroup.position.y = 0;
    trainGroup.position.z = -2;
    scene.add(trainGroup);

    // Create detailed car (Object B)
    const carGroup = new THREE.Group();
    // Car body
    const carBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.7, 1.0),
        new THREE.MeshStandardMaterial({ 
            color: 0xf97316, 
            emissive: 0xf97316, 
            emissiveIntensity: 0.2,
            metalness: 0.8,
            roughness: 0.2 
        })
    );
    carBody.position.y = 0.5;
    carGroup.add(carBody);
    
    // Car top (roof)
    const carRoof = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.5, 0.95),
        new THREE.MeshStandardMaterial({ 
            color: 0xea580c, 
            metalness: 0.7, 
            roughness: 0.3 
        })
    );
    carRoof.position.set(-0.2, 0.95, 0);
    carGroup.add(carRoof);
    
    // Car wheels
    for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
        );
        wheel.rotation.z = Math.PI / 2;
        const xPos = i < 2 ? -0.6 : 0.6;
        const zPos = i % 2 === 0 ? 0.55 : -0.55;
        wheel.position.set(xPos, 0.15, zPos);
        carGroup.add(wheel);
    }
    carGroup.position.y = 0;
    carGroup.position.z = 2;
    scene.add(carGroup);

    // === TRAIN SIDE (z = -2): Rail track ===
    // Rail bed (gravel/ballast)
    const railBed = new THREE.Mesh(
        new THREE.BoxGeometry(42, 0.15, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.99, metalness: 0 })
    );
    railBed.position.set(0, 0.0, -2);
    railBed.receiveShadow = true;
    scene.add(railBed);
    // Railway ties/sleepers
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 0.95 });
    for (let i = -20; i <= 20; i += 1.2) {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 1.8), tieMat);
        tie.position.set(i, 0.1, -2);
        scene.add(tie);
    }
    // Left rail
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(42, 0.1, 0.12), railMat);
    leftRail.position.set(0, 0.2, -2 - 0.7);
    scene.add(leftRail);
    // Right rail
    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(42, 0.1, 0.12), railMat);
    rightRail.position.set(0, 0.2, -2 + 0.7);
    scene.add(rightRail);

    // === CAR SIDE (z = +2): Road ===
    const roadGeometry = new THREE.PlaneGeometry(42, 2.8);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x374151, 
        roughness: 0.95,
        metalness: 0.05
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 2);
    road.receiveShadow = true;
    scene.add(road);
    // Road edge lines (white)
    const roadEdgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftEdge = new THREE.Mesh(new THREE.PlaneGeometry(42, 0.12), roadEdgeMat);
    leftEdge.rotation.x = -Math.PI / 2;
    leftEdge.position.set(0, 0.02, 2 - 1.3);
    scene.add(leftEdge);
    const rightEdge = new THREE.Mesh(new THREE.PlaneGeometry(42, 0.12), roadEdgeMat);
    rightEdge.rotation.x = -Math.PI / 2;
    rightEdge.position.set(0, 0.02, 2 + 1.3);
    scene.add(rightEdge);
    // Road center dashes
    for (let i = -20; i < 20; i += 2) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.1), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(i, 0.025, 2);
        scene.add(dash);
    }
    // Ground between and around
    const groundMid = new THREE.Mesh(
        new THREE.PlaneGeometry(42, 4),
        new THREE.MeshStandardMaterial({ color: 0x1c2333, roughness: 0.99 })
    );
    groundMid.rotation.x = -Math.PI / 2;
    groundMid.position.set(0, 0, 0);
    groundMid.receiveShadow = true;
    scene.add(groundMid);
    
    // Center divider (grass strip)
    const divider = new THREE.Mesh(
        new THREE.PlaneGeometry(42, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.99 })
    );
    divider.rotation.x = -Math.PI / 2;
    divider.position.set(0, 0.02, 0);
    scene.add(divider);
    
    // Separate label line: "TRAIN" side and "CAR" side
    const centerLine = groundMid; // Keep scene reference consistent

    // Relative velocity arrow
    const relArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), 
        new THREE.Vector3(), 
        3, 
        0xec4899, 
        0.5, 
        0.35
    );
    relArrow.position.y = 2;
    scene.add(relArrow);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title"><i class="fas fa-sync-alt"></i> 🎮 Relative Motion</div>
            <div class="sim-control-row">
                <label>🚂 Train Speed</label>
                <input class="sim-slider" id="relVA" type="range" min="0" max="10" value="8" step="0.5">
                <span class="sim-slider-val" id="relVAVal">8 m/s</span>
            </div>
            <div class="sim-control-row">
                <label>🚗 Car Speed</label>
                <input class="sim-slider" id="relVB" type="range" min="0" max="10" value="4" step="0.5">
                <span class="sim-slider-val" id="relVBVal">4 m/s</span>
            </div>
            <div class="sim-control-row" style="margin-top: 12px;">
                <label style="min-width: 100%;">👁️ Observer Frame</label>
                <select class="game-select" id="relFrame" style="width: 100%; margin-top: 8px;">
                    <option value="ground">🌍 Ground (Stationary)</option>
                    <option value="a">🚂 Train Reference</option>
                    <option value="b">🚗 Car Reference</option>
                </select>
            </div>
            <div class="sim-stats-grid" style="margin-top:12px;">
                <div class="sim-stat-card">
                    <div class="sim-stat-label">Relative Velocity</div>
                    <div class="sim-stat-value" id="relVelVal">--</div>
                    <div class="sim-stat-unit">m/s</div>
                </div>
            </div>
            <div class="sim-status" id="relInfo" style="margin-top: 12px;"></div>
        </div>
    `;

    const vAInput = controlsContainer.querySelector('#relVA');
    const vBInput = controlsContainer.querySelector('#relVB');
    const frameSelect = controlsContainer.querySelector('#relFrame');
    const relInfoEl = controlsContainer.querySelector('#relInfo');

    let t = 0;
    function update() {
        t += 0.016;
        const vA = parseFloat(vAInput.value);
        const vB = parseFloat(vBInput.value);
        const frame = frameSelect.value;

        controlsContainer.querySelector('#relVAVal').textContent = vA + ' m/s';
        controlsContainer.querySelector('#relVBVal').textContent = vB + ' m/s';

        let obsVel = 0;
        let frameLabel = 'Ground';
        if (frame === 'a') { obsVel = vA; frameLabel = 'Train'; }
        if (frame === 'b') { obsVel = vB; frameLabel = 'Car'; }

        // Wrap positions to stay in view (-15 to 15)
        let xA = ((vA - obsVel) * t) % 30;
        let xB = ((vB - obsVel) * t) % 30;
        if (xA > 15) xA -= 30; if (xA < -15) xA += 30;
        if (xB > 15) xB -= 30; if (xB < -15) xB += 30;

        trainGroup.position.x = xA;
        trainGroup.position.z = -2;
        carGroup.position.x = xB;
        carGroup.position.z = 2;

        const relVel = vB - vA;
        controlsContainer.querySelector('#relVelVal').textContent = relVel.toFixed(1);
        
        // Update arrow
        if (Math.abs(relVel) > 0.01) {
            const direction = relVel >= 0 ? 1 : -1;
            relArrow.setDirection(new THREE.Vector3(direction, 0, 0));
            relArrow.setLength(Math.min(6, Math.abs(relVel) * 0.7 + 0.8));
            relArrow.position.set(trainGroup.position.x, 2, -2);
            relArrow.visible = true;
        } else {
            relArrow.visible = false;
        }
        
        // Update info
        if (relVel > 0) {
            relInfoEl.innerHTML = `<strong style="color: #22d3ee;">🚗 Car</strong> is moving <strong style="color: #10b981;">faster</strong> than <strong style="color: #f97316;">🚂 Train</strong> in ${frameLabel} frame`;
        } else if (relVel < 0) {
            relInfoEl.innerHTML = `<strong style="color: #f97316;">🚂 Train</strong> is moving <strong style="color: #10b981;">faster</strong> than <strong style="color: #22d3ee;">🚗 Car</strong> in ${frameLabel} frame`;
        } else {
            relInfoEl.innerHTML = `<strong style="color: #fbbf24;">Both moving at same speed!</strong>`;
        }
    }

    engine.setUpdate(update);
    overlayEl.innerHTML += `<span class="sim-badge">🚂 Train & Car</span><span class="sim-badge">🔄 Frame Switching</span>`;

    return () => {
        scene.remove(trainGroup, carGroup, road, centerLine, relArrow);
    };
}

function initLawsMotionSim(engine, controlsContainer, overlayEl) {
    const { scene, camera } = engine;
    
    // Better camera angle
    camera.position.set(0, 5, 14);
    camera.lookAt(0, 1, 0);

    // Enhanced surface with texture-like appearance
    const surface = new THREE.Mesh(
        new THREE.BoxGeometry(36, 0.3, 5), 
        new THREE.MeshStandardMaterial({ 
            color: 0x334155, 
            roughness: 0.95,
            metalness: 0.05 
        })
    );
    surface.position.y = -0.15;
    surface.receiveShadow = true;
    scene.add(surface);
    
    // Add grid lines on surface for depth
    const gridHelper = new THREE.GridHelper(36, 36, 0x475569, 0x475569);
    gridHelper.position.y = 0.02;
    gridHelper.rotation.y = Math.PI / 2;
    scene.add(gridHelper);

    // Detailed block with labels
    const blockGroup = new THREE.Group();
    
    // Main block body
    const blockBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.0, 1.2),
        new THREE.MeshStandardMaterial({ 
            color: 0x8b5cf6, 
            emissive: 0x8b5cf6, 
            emissiveIntensity: 0.25, 
            metalness: 0.4,
            roughness: 0.6 
        })
    );
    blockBody.castShadow = true;
    blockGroup.add(blockBody);
    
    // Block edges for detail
    const edgeGeometry = new THREE.EdgesGeometry(blockBody.geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    blockGroup.add(edges);
    
    blockGroup.position.y = 0.5;
    scene.add(blockGroup);

    // Enhanced force arrows with labels
    const forceArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), 
        new THREE.Vector3(), 
        2.5, 
        0x22d3ee, 
        0.5, 
        0.4
    );
    const frictionArrow = new THREE.ArrowHelper(
        new THREE.Vector3(-1, 0, 0), 
        new THREE.Vector3(), 
        1.5, 
        0xef4444, 
        0.4, 
        0.3
    );
    const accArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), 
        new THREE.Vector3(), 
        2.5, 
        0x10b981, 
        0.5, 
        0.4
    );
    scene.add(forceArrow, frictionArrow, accArrow);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title"><i class="fas fa-bolt"></i> 🧲 Friction Simulator</div>
            <div class="sim-control-row">
                <label>⬅➡ Applied Force</label>
                <input class="sim-slider" id="forceInput" type="range" min="-20" max="20" value="10">
                <span class="sim-slider-val" id="forceVal">10 N</span>
            </div>
            <div class="sim-control-row">
                <label>⚖️ Mass</label>
                <input class="sim-slider" id="massInput" type="range" min="1" max="10" value="4">
                <span class="sim-slider-val" id="massVal">4 kg</span>
            </div>
            <div class="sim-control-row">
                <label>🧊 Friction Coefficient (μ)</label>
                <input class="sim-slider" id="frictionInput" type="range" min="0" max="0.9" value="0.2" step="0.05">
                <span class="sim-slider-val" id="fricVal">0.20</span>
            </div>
            <div class="sim-stats-grid">
                <div class="sim-stat-card">
                    <div class="sim-stat-label">🟢 Acceleration</div>
                    <div class="sim-stat-value" id="accVal">--</div>
                    <div class="sim-stat-unit">m/s²</div>
                </div>
                <div class="sim-stat-card">
                    <div class="sim-stat-label">💨 Velocity</div>
                    <div class="sim-stat-value" id="velDisplay">--</div>
                    <div class="sim-stat-unit">m/s</div>
                </div>
                <div class="sim-stat-card">
                    <div class="sim-stat-label">⚡ Net Force</div>
                    <div class="sim-stat-value" id="netFVal">--</div>
                    <div class="sim-stat-unit">N</div>
                </div>
            </div>
            <div class="sim-status" id="lawsInfo" style="margin-top: 12px;"></div>
            <button class="btn-primary sim-action-btn" id="resetLawsBtn"><i class="fas fa-redo"></i> Reset</button>
        </div>
    `;

    const forceInput = controlsContainer.querySelector('#forceInput');
    const massInput = controlsContainer.querySelector('#massInput');
    const frictionInput = controlsContainer.querySelector('#frictionInput');
    const lawsInfoEl = controlsContainer.querySelector('#lawsInfo');

    let velocity = 0;
    let position = 0;

    function update() {
        const force = parseFloat(forceInput.value);
        const mass = parseFloat(massInput.value);
        const mu = parseFloat(frictionInput.value);

        controlsContainer.querySelector('#forceVal').textContent = force + ' N';
        controlsContainer.querySelector('#massVal').textContent = mass + ' kg';
        controlsContainer.querySelector('#fricVal').textContent = mu.toFixed(2);

        // Calculate friction force
        const frictionForce = velocity !== 0 ? -Math.sign(velocity) * mu * mass * 9.8 : (Math.abs(force) > mu * mass * 9.8 ? 0 : -force);
        const realNet = Math.abs(force) > mu * mass * 9.8 || Math.abs(velocity) > 0.01 ? force + frictionForce : 0;
        const acceleration = realNet / mass;

        velocity += acceleration * 0.016;
        if (Math.abs(velocity) < 0.01 && Math.abs(force) <= mu * mass * 9.8) velocity = 0;
        position += velocity * 0.016;

        // Wrap to stay in view
        if (position > 15) position = -15;
        if (position < -15) position = 15;
        blockGroup.position.x = position;

        // Applied force arrow (cyan)
        if (Math.abs(force) > 0.1) {
            forceArrow.visible = true;
            forceArrow.setDirection(new THREE.Vector3(force >= 0 ? 1 : -1, 0, 0));
            forceArrow.setLength(Math.min(5, Math.abs(force) / 4.5 + 0.5));
            forceArrow.position.set(blockGroup.position.x, 1.2, 0);
        } else { forceArrow.visible = false; }

        // Friction arrow (red)
        if (Math.abs(velocity) > 0.05 && mu > 0) {
            frictionArrow.visible = true;
            frictionArrow.setDirection(new THREE.Vector3(velocity > 0 ? -1 : 1, 0, 0));
            frictionArrow.setLength(Math.min(3.5, mu * mass * 9.8 / 5 + 0.3));
            frictionArrow.position.set(blockGroup.position.x, 0.3, 0);
        } else { frictionArrow.visible = false; }

        // Acceleration arrow (green)
        if (Math.abs(acceleration) > 0.05) {
            accArrow.visible = true;
            accArrow.setDirection(new THREE.Vector3(acceleration >= 0 ? 1 : -1, 0, 0));
            accArrow.setLength(Math.min(3.5, Math.abs(acceleration) * 0.45 + 0.5));
            accArrow.position.set(blockGroup.position.x, 1.8, 0);
        } else { accArrow.visible = false; }

        controlsContainer.querySelector('#accVal').textContent = acceleration.toFixed(2);
        controlsContainer.querySelector('#velDisplay').textContent = velocity.toFixed(2);
        controlsContainer.querySelector('#netFVal').textContent = realNet.toFixed(1);
        
        // Status message
        if (Math.abs(velocity) < 0.01) {
            if (Math.abs(force) <= mu * mass * 9.8) {
                lawsInfoEl.innerHTML = `<strong style="color: #ef4444;">⚠️ Static Friction</strong> prevents motion (max ${(mu * mass * 9.8).toFixed(1)} N)`;
            } else {
                lawsInfoEl.innerHTML = `<strong style="color: #10b981;">✓ Ready to move!</strong> Force exceeds friction`;
            }
        } else {
            const direction = velocity > 0 ? 'right →' : '← left';
            lawsInfoEl.innerHTML = `<strong style="color: #22d3ee;">Moving ${direction}</strong> with kinetic friction`;
        }
    }

    controlsContainer.querySelector('#resetLawsBtn').addEventListener('click', () => { 
        velocity = 0; 
        position = 0; 
        blockGroup.position.x = 0;
    });
    
    engine.setUpdate(update);
    overlayEl.innerHTML += `<span class="sim-badge">🔵 Applied Force</span><span class="sim-badge">🔴 Friction</span><span class="sim-badge">🟢 Acceleration</span>`;
    
    return () => {
        scene.remove(blockGroup, forceArrow, frictionArrow, accArrow, surface, gridHelper);
    };
}

function initRollerCoasterSim(engine, controlsContainer, overlayEl) {
    const { scene, camera } = engine;
    camera.position.set(0, 14, 26);
    camera.lookAt(0, 5, 0);

    // Pure gravity roller coaster: starts at a high peak, drops fast, then even-height bumps
    // No lift chain — cart starts at the top and falls naturally.
    // Even hills after the big drop so cart maintains speed through them.
    const trackPoints = [
        new THREE.Vector3(-14, 11.5, 0),  // START — high peak (released from here)
        new THREE.Vector3(-11, 10.0, 0),  // tip over edge — just past peak
        new THREE.Vector3(-8,  4.5,  0),  // steep first drop
        new THREE.Vector3(-5,  0.8,  0),  // valley 1 — max speed
        new THREE.Vector3(-2,  6.0,  0),  // hill 2 — even height
        new THREE.Vector3( 1,  0.8,  0),  // valley 2
        new THREE.Vector3( 4,  5.5,  0),  // hill 3 — slightly shorter
        new THREE.Vector3( 7,  0.8,  0),  // valley 3
        new THREE.Vector3(10,  5.0,  0),  // hill 4
        new THREE.Vector3(13,  0.8,  0),  // valley 4
        new THREE.Vector3(14,  1.2,  0),  // approach station
    ];
    const curve = new THREE.CatmullRomCurve3(trackPoints, false, 'catmullrom', 0.5);

    // Ground platform
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(36, 14),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Track supports
    const supportMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.4 });
    const supports = [];
    for (let i = 0; i <= 1; i += 0.06) {
        const p = curve.getPointAt(i);
        if (p.y > 1.5) {
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, p.y, 8), supportMat);
            pillar.position.set(p.x, p.y / 2, p.z);
            pillar.castShadow = true;
            scene.add(pillar);
            supports.push(pillar);
        }
    }

    // Track tube
    const tubeGeometry1 = new THREE.TubeGeometry(curve, 300, 0.12, 12, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x38bdf8, metalness: 0.8, roughness: 0.2,
        emissive: 0x38bdf8, emissiveIntensity: 0.15
    });
    const track1 = new THREE.Mesh(tubeGeometry1, tubeMaterial);
    track1.castShadow = true;
    scene.add(track1);

    // Cart
    const cartGroup = new THREE.Group();
    const cartBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.6, 0.7), 
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.3 })
    );
    cartBody.castShadow = true;
    cartGroup.add(cartBody);
    const cartRoof = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.2, 0.65),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7 })
    );
    cartRoof.position.y = 0.4;
    cartGroup.add(cartRoof);
    for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(i < 2 ? -0.5 : 0.5, -0.35, i % 2 === 0 ? 0.4 : -0.4);
        cartGroup.add(wheel);
    }
    scene.add(cartGroup);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title"><i class="fas fa-chart-area"></i> 🎢 Work-Energy Roller Coaster</div>
            <canvas class="sim-graph" id="energyGraph" width="300" height="160" style="border-radius:8px;background:#0f1419;"></canvas>
            <div class="sim-stats-grid" style="margin-top:12px;">
                <div class="sim-stat-card" style="border-left:3px solid #38bdf8">
                    <div class="sim-stat-label">⛰️ Potential Energy</div>
                    <div class="sim-stat-value" id="peVal">--</div>
                    <div class="sim-stat-unit">J</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #f59e0b">
                    <div class="sim-stat-label">⚡ Kinetic Energy</div>
                    <div class="sim-stat-value" id="keVal">--</div>
                    <div class="sim-stat-unit">J</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #10b981">
                    <div class="sim-stat-label">💨 Speed</div>
                    <div class="sim-stat-value" id="speedVal">--</div>
                    <div class="sim-stat-unit">m/s</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #a855f7">
                    <div class="sim-stat-label">🎯 Total Energy</div>
                    <div class="sim-stat-value" id="totalEVal">--</div>
                    <div class="sim-stat-unit">J</div>
                </div>
            </div>
            <div class="sim-status" id="coasterInfo" style="margin-top:12px;"></div>
            <button class="btn-primary sim-action-btn" id="resetCoasterBtn"><i class="fas fa-redo"></i> Restart</button>
        </div>
    `;
    
    const graph = controlsContainer.querySelector('#energyGraph');
    const ctx = graph.getContext('2d');
    const coasterInfoEl = controlsContainer.querySelector('#coasterInfo');

    const g = 9.8;
    const mass = 1.5;
    const totalLen = curve.getLength();
    
    // Pure gravity physics — cart starts at the high peak (arcPos ~0) with zero speed.
    // No lift chain: it tips over naturally and gravity drives the whole ride.
    let arcPos = 0.01;
    let speed = 0.0;

    const peHistory = [];
    const keHistory = [];
    
    function update() {
        const clampedPos = Math.max(0.001, Math.min(0.999, arcPos));
        const tangent = curve.getTangentAt(clampedPos);
        const slopeAngle = Math.asin(Math.max(-1, Math.min(1, tangent.y)));

        // Gravity acceleration along track slope
        const accel = -g * Math.sin(slopeAngle);
        speed += accel * 0.016;
        speed *= 0.9996; // tiny rolling friction
        arcPos += (speed * 0.016) / totalLen;

        // Bounce/wrap at ends
        if (arcPos >= 0.99) {
            arcPos = 0.98;
            speed = -Math.abs(speed) * 0.35;
        }
        if (arcPos <= 0.001) {
            // Reached start again — restart from peak
            arcPos = 0.01;
            speed = 0;
            peHistory.length = 0;
            keHistory.length = 0;
        }

        const newPos = curve.getPointAt(clampedPos);
        cartGroup.position.copy(newPos);
        cartGroup.position.y += 0.3;

        const lookPos = Math.min(0.999, clampedPos + 0.01);
        const lookTarget = curve.getPointAt(lookPos);
        cartGroup.lookAt(lookTarget);

        // Rotate wheels
        cartGroup.children.forEach((child, i) => {
            if (i >= 3) child.rotation.x += speed * 0.12;
        });

        const h = newPos.y;
        const pe = mass * g * h;
        const ke = 0.5 * mass * speed * speed;
        const totalE = pe + ke;

        controlsContainer.querySelector('#peVal').textContent = pe.toFixed(1);
        controlsContainer.querySelector('#keVal').textContent = ke.toFixed(1);
        controlsContainer.querySelector('#speedVal').textContent = Math.abs(speed).toFixed(2);
        controlsContainer.querySelector('#totalEVal').textContent = totalE.toFixed(1);
        
        peHistory.push(pe);
        keHistory.push(ke);
        if (peHistory.length > 80) { peHistory.shift(); keHistory.shift(); }
        
        if (h < 2 && Math.abs(speed) > 4) {
            coasterInfoEl.innerHTML = `<strong style="color:#f59e0b;">⚡ MAXIMUM SPEED!</strong> All PE converted to KE`;
        } else if (h > 9) {
            const tipDir = speed < 0.5 ? '🫨 Barely moving...' : '📉 Starting to fall!';
            coasterInfoEl.innerHTML = `<strong style="color:#38bdf8;">⛰️ At the Top:</strong> ${tipDir} PE = ${pe.toFixed(1)} J`;
        } else {
            coasterInfoEl.innerHTML = `<strong style="color:#10b981;">✓ Energy conserved:</strong> ${totalE.toFixed(1)} J`;
        }
        
        drawEnergyGraph(peHistory, keHistory);
    }

    function drawEnergyGraph(peHist, keHist) {
        const w = graph.width, hgt = graph.height;
        ctx.fillStyle = '#0f1419';
        ctx.fillRect(0, 0, w, hgt);
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (hgt / 4) * i;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText('Energy Over Time', 10, 15);
        if (peHist.length < 2) return;
        const maxE = Math.max(...peHist, ...keHist, 1);
        const step = w / (peHist.length - 1);
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        peHist.forEach((pe, i) => {
            const x = i * step, y = hgt - 10 - ((pe / maxE) * (hgt - 30));
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        keHist.forEach((ke, i) => {
            const x = i * step, y = hgt - 10 - ((ke / maxE) * (hgt - 30));
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(10, hgt - 30, 15, 8);
        ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText('PE', 30, hgt - 22);
        ctx.fillStyle = '#f59e0b'; ctx.fillRect(60, hgt - 30, 15, 8);
        ctx.fillStyle = '#fff'; ctx.fillText('KE', 80, hgt - 22);
    }

    controlsContainer.querySelector('#resetCoasterBtn').addEventListener('click', () => {
        arcPos = 0.01; speed = 0;
        peHistory.length = 0; keHistory.length = 0;
    });

    engine.setUpdate(update);
    overlayEl.innerHTML += `<span class="sim-badge">🎢 Pure Gravity Drop</span><span class="sim-badge">⚡ Energy Conservation</span>`;

    return () => {
        scene.remove(track1, cartGroup, ground);
        supports.forEach(s => scene.remove(s));
    };
}

function initOrbitalSim(engine, controlsContainer, overlayEl) {
    const { scene, camera } = engine;
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 4, 0);

    // Nucleus - elevated above ground
    const nucleus = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 32, 32),
        new THREE.MeshStandardMaterial({ 
            color: 0xef4444, 
            emissive: 0xef4444, 
            emissiveIntensity: 0.7,
            metalness: 0.5,
            roughness: 0.2
        })
    );
    nucleus.position.y = 4; // Always 4 units above ground
    scene.add(nucleus);

    // Group for orbital shape - elevated
    const orbitalGroup = new THREE.Group();
    orbitalGroup.position.y = 4; // Keep orbitals above ground
    scene.add(orbitalGroup);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title"><i class="fas fa-atom"></i> 🎮 Atomic Orbitals</div>
            <select class="game-select" id="orbitalType">
                <option value="1s">1s - Spherical</option>
                <option value="2s">2s - Larger Sphere (1 node)</option>
                <option value="2p">2p - Dumbbell</option>
                <option value="3s">3s - Sphere (2 radial nodes)</option>
                <option value="3p">3p - Dumbbell (1 radial node)</option>
                <option value="3d">3d - Cloverleaf</option>
            </select>
            <div class="sim-control-row">
                <label>💎 Opacity</label>
                <input class="sim-slider" id="orbitalOpacity" type="range" min="20" max="85" value="50">
                <span class="sim-slider-val" id="opacVal">50%</span>
            </div>
            <div class="sim-control-row">
                <label>✨ Detail Level</label>
                <input class="sim-slider" id="orbitalDetail" type="range" min="16" max="64" value="48" step="8">
                <span class="sim-slider-val" id="detailVal">48</span>
            </div>
            <div class="sim-status" id="orbitalInfo"></div>
        </div>
    `;

    const typeSelect = controlsContainer.querySelector('#orbitalType');
    const opacityInput = controlsContainer.querySelector('#orbitalOpacity');
    const detailInput = controlsContainer.querySelector('#orbitalDetail');
    const infoEl = controlsContainer.querySelector('#orbitalInfo');

    function createLobe(radiusX, radiusY, radiusZ, color, position) {
        const detail = parseInt(detailInput.value);
        const geom = new THREE.SphereGeometry(1, detail, detail);
        geom.scale(radiusX, radiusY, radiusZ);
        const opacity = parseFloat(opacityInput.value) / 100;
        const mat = new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            roughness: 0.2,
            metalness: 0.3,
            clearcoat: 0.5,
            clearcoatRoughness: 0.2,
            side: THREE.DoubleSide,
            depthWrite: false,
            envMapIntensity: 1.0
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(position[0], position[1], position[2]);
        mesh.renderOrder = 999; // Render on top
        return mesh;
    }

    function buildOrbital(type) {
        // Clear old
        while (orbitalGroup.children.length) orbitalGroup.remove(orbitalGroup.children[0]);
        let info = '';

        if (type === '1s') {
            orbitalGroup.add(createLobe(2, 2, 2, 0x8b5cf6, [0, 0, 0]));
            info = '1s: Spherical, n=1, l=0. No nodes. 2 max electrons.';
        } else if (type === '2s') {
            orbitalGroup.add(createLobe(3.5, 3.5, 3.5, 0x8b5cf6, [0, 0, 0]));
            orbitalGroup.add(createLobe(1.5, 1.5, 1.5, 0xc084fc, [0, 0, 0]));
            info = '2s: Spherical, n=2, l=0. 1 radial node (inner shell). 2 max electrons.';
        } else if (type === '2p') {
            // Two lobes along Y axis (dumbbell)
            orbitalGroup.add(createLobe(1.2, 2.8, 1.2, 0x22d3ee, [0, 2.3, 0]));
            orbitalGroup.add(createLobe(1.2, 2.8, 1.2, 0xf97316, [0, -2.3, 0]));
            info = '2p: Dumbbell, n=2, l=1. 1 angular nodal plane. 6 max electrons (3 orbitals).';
        } else if (type === '3s') {
            // 3s: largest sphere with 2 radial nodes (3 concentric regions)
            orbitalGroup.add(createLobe(4.5, 4.5, 4.5, 0x8b5cf6, [0, 0, 0]));
            orbitalGroup.add(createLobe(2.8, 2.8, 2.8, 0xc084fc, [0, 0, 0]));
            orbitalGroup.add(createLobe(1.2, 1.2, 1.2, 0xa78bfa, [0, 0, 0]));
            info = '3s: Spherical, n=3, l=0. 2 radial nodes (3 shells visible). 2 max electrons.';
        } else if (type === '3p') {
            // 3p: larger dumbbell with waist node (intermediate radial node)
            // Outer lobes (large)
            orbitalGroup.add(createLobe(1.5, 3.5, 1.5, 0x22d3ee, [0, 3.5, 0]));
            orbitalGroup.add(createLobe(1.5, 3.5, 1.5, 0xf97316, [0, -3.5, 0]));
            // Inner lobes (smaller, showing radial node)
            orbitalGroup.add(createLobe(0.8, 1.4, 0.8, 0x67e8f9, [0, 1.2, 0]));
            orbitalGroup.add(createLobe(0.8, 1.4, 0.8, 0xfed7aa, [0, -1.2, 0]));
            info = '3p: Dumbbell, n=3, l=1. 1 radial + 1 angular node. 6 max electrons (3 orbitals).';
        } else if (type === '3d') {
            // Four lobes in XY plane (cloverleaf)
            orbitalGroup.add(createLobe(1.5, 1.5, 0.8, 0x22d3ee, [2, 2, 0]));
            orbitalGroup.add(createLobe(1.5, 1.5, 0.8, 0xf97316, [-2, -2, 0]));
            orbitalGroup.add(createLobe(1.5, 1.5, 0.8, 0x22d3ee, [2, -2, 0]));
            orbitalGroup.add(createLobe(1.5, 1.5, 0.8, 0xf97316, [-2, 2, 0]));
            info = '3d: Cloverleaf, n=3, l=2. 2 angular nodal planes. 10 max electrons (5 orbitals).';
        }
        infoEl.textContent = info;
    }

    typeSelect.addEventListener('change', () => buildOrbital(typeSelect.value));
    opacityInput.addEventListener('input', () => {
        controlsContainer.querySelector('#opacVal').textContent = opacityInput.value + '%';
        buildOrbital(typeSelect.value);
    });
    detailInput.addEventListener('input', () => {
        controlsContainer.querySelector('#detailVal').textContent = detailInput.value;
        buildOrbital(typeSelect.value);
    });

    buildOrbital('1s');

    // Gentle rotation for better 3D view
    engine.setUpdate(() => { orbitalGroup.rotation.y += 0.008; });
    overlayEl.innerHTML += `<span class="sim-badge">⚛️ Quantum Orbitals</span><span class="sim-badge">💎 HD Rendering</span>`;

    return () => {
        scene.remove(orbitalGroup, nucleus);
    };
}

function initVseprSim(engine, controlsContainer, overlayEl) {
    const { scene, camera } = engine;
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 5, 0);

    const molGroup = new THREE.Group();
    molGroup.position.y = 5;
    scene.add(molGroup);

    const central = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 32, 32), 
        new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.3, metalness: 0.4, roughness: 0.3 })
    );
    molGroup.add(central);
    const atomMeshes = [];
    const bondMeshes = [];
    const lonePairMeshes = [];

    // VSEPR data structure: geometry → available shapes
    // Each shape has: bondPairs, lonePairs, angle, hybridization, examples, positions (bonding atoms), lonePairDirs
    const VSEPR_DATA = {
        linear: {
            label: 'Linear (AB₂)',
            shapes: {
                linear: {
                    name: 'Linear', bondPairs: 2, lonePairs: 0, angle: '180°',
                    hybrid: 'sp', example: 'CO₂, BeCl₂, C₂H₂',
                    atomPos: [[3,0,0],[-3,0,0]], lpDirs: []
                }
            }
        },
        trigplanar: {
            label: 'Trigonal Planar (AB₃)',
            shapes: {
                trigonal_planar: {
                    name: 'Trigonal Planar', bondPairs: 3, lonePairs: 0, angle: '120°',
                    hybrid: 'sp²', example: 'BF₃, SO₃, AlCl₃',
                    atomPos: [[3,0,0],[-1.5,0,2.6],[-1.5,0,-2.6]], lpDirs: []
                },
                bent_tp: {
                    name: 'Bent (from Trigonal Planar)', bondPairs: 2, lonePairs: 1, angle: '~119°',
                    hybrid: 'sp²', example: 'SO₂, O₃, SnCl₂',
                    atomPos: [[2.8,0,1.6],[-2.8,0,1.6]], lpDirs: [[0,0,-2.5]]
                }
            }
        },
        tetrahedral: {
            label: 'Tetrahedral (AB₄)',
            shapes: {
                tetrahedral: {
                    name: 'Tetrahedral', bondPairs: 4, lonePairs: 0, angle: '109.5°',
                    hybrid: 'sp³', example: 'CH₄, CCl₄, NH₄⁺, SiF₄',
                    atomPos: [[1.73,1.73,1.73],[-1.73,-1.73,1.73],[-1.73,1.73,-1.73],[1.73,-1.73,-1.73]],
                    lpDirs: []
                },
                trigonal_pyramidal: {
                    name: 'Trigonal Pyramidal', bondPairs: 3, lonePairs: 1, angle: '~107°',
                    hybrid: 'sp³', example: 'NH₃, PCl₃, AsH₃',
                    atomPos: [[2.6,0.6,0],[-1.3,0.6,2.25],[-1.3,0.6,-2.25]], lpDirs: [[0,-2.5,0]]
                },
                bent_tet: {
                    name: 'Bent (from Tetrahedral)', bondPairs: 2, lonePairs: 2, angle: '~104.5°',
                    hybrid: 'sp³', example: 'H₂O, H₂S, SCl₂',
                    atomPos: [[2.4,0.5,1.5],[-2.4,0.5,1.5]], lpDirs: [[0,-2,0],[0,0,-2.5]]
                }
            }
        },
        tbipyramidal: {
            label: 'Trigonal Bipyramidal (AB₅)',
            shapes: {
                tbipyramidal: {
                    name: 'Trigonal Bipyramidal', bondPairs: 5, lonePairs: 0, angle: '90°/120°',
                    hybrid: 'sp³d', example: 'PCl₅, AsF₅, SbCl₅',
                    atomPos: [[3,0,0],[-1.5,0,2.6],[-1.5,0,-2.6],[0,3,0],[0,-3,0]], lpDirs: []
                },
                seesaw: {
                    name: 'See-Saw', bondPairs: 4, lonePairs: 1, angle: '~173°/~102°',
                    hybrid: 'sp³d', example: 'SF₄, XeO₂F₂',
                    atomPos: [[3,0,0],[-1.5,0,2.6],[-1.5,0,-2.6],[0,-3,0]], lpDirs: [[0,2.5,0]]
                },
                tshape: {
                    name: 'T-Shape', bondPairs: 3, lonePairs: 2, angle: '~87°/180°',
                    hybrid: 'sp³d', example: 'ClF₃, BrF₃',
                    atomPos: [[3,0,0],[-3,0,0],[0,-3,0]], lpDirs: [[0,2.5,0],[0,0,2.5]]
                },
                linear_tbp: {
                    name: 'Linear (from TBP)', bondPairs: 2, lonePairs: 3, angle: '180°',
                    hybrid: 'sp³d', example: 'I₃⁻, XeF₂',
                    atomPos: [[0,3,0],[0,-3,0]], lpDirs: [[3,0,0],[-1.5,0,2.6],[-1.5,0,-2.6]]
                }
            }
        },
        octahedral: {
            label: 'Octahedral (AB₆)',
            shapes: {
                octahedral: {
                    name: 'Octahedral', bondPairs: 6, lonePairs: 0, angle: '90°',
                    hybrid: 'sp³d²', example: 'SF₆, Mo(CO)₆, [PtCl₆]²⁻',
                    atomPos: [[3,0,0],[-3,0,0],[0,3,0],[0,-3,0],[0,0,3],[0,0,-3]], lpDirs: []
                },
                square_pyramidal: {
                    name: 'Square Pyramidal', bondPairs: 5, lonePairs: 1, angle: '~87°/180°',
                    hybrid: 'sp³d²', example: 'BrF₅, XeOF₄, IF₅',
                    atomPos: [[3,0,0],[-3,0,0],[0,0,3],[0,0,-3],[0,3,0]], lpDirs: [[0,-2.5,0]]
                },
                square_planar: {
                    name: 'Square Planar', bondPairs: 4, lonePairs: 2, angle: '90°',
                    hybrid: 'sp³d²', example: 'XeF₄, [PtCl₄]²⁻, [ICl₄]⁻',
                    atomPos: [[3,0,0],[-3,0,0],[0,0,3],[0,0,-3]], lpDirs: [[0,2.5,0],[0,-2.5,0]]
                }
            }
        }
    };

    // Build the controls UI
    function buildUI() {
        const geomKeys = Object.keys(VSEPR_DATA);
        const geomOptions = geomKeys.map(k => `<option value="${k}">${VSEPR_DATA[k].label}</option>`).join('');
        
        controlsContainer.innerHTML = `
            <div class="game-panel sim-controls-panel">
                <div class="game-section-title"><i class="fas fa-project-diagram"></i> 🧬 VSEPR Explorer</div>
                <div class="sim-control-row">
                    <label style="font-weight:700;color:#a78bfa;">📐 Electron Pair Geometry</label>
                    <select class="game-select" id="vseprGeom" style="margin-top:4px;">${geomOptions}</select>
                </div>
                <div class="sim-control-row" style="margin-top:8px;">
                    <label style="font-weight:700;color:#22d3ee;">🔷 Molecular Shape</label>
                    <select class="game-select" id="vseprShape" style="margin-top:4px;"></select>
                </div>
                <div class="sim-stats-grid" style="margin-top:10px;">
                    <div class="sim-stat-card" style="border-left:3px solid #22d3ee">
                        <div class="sim-stat-label">🔵 Bond Pairs</div>
                        <div class="sim-stat-value" id="vBondPairs">--</div>
                    </div>
                    <div class="sim-stat-card" style="border-left:3px solid #f97316">
                        <div class="sim-stat-label">🟠 Lone Pairs</div>
                        <div class="sim-stat-value" id="vLonePairs">--</div>
                    </div>
                    <div class="sim-stat-card" style="border-left:3px solid #10b981">
                        <div class="sim-stat-label">📐 Bond Angle</div>
                        <div class="sim-stat-value" id="vAngle" style="font-size:0.85rem">--</div>
                    </div>
                    <div class="sim-stat-card" style="border-left:3px solid #a78bfa">
                        <div class="sim-stat-label">🧬 Hybrid</div>
                        <div class="sim-stat-value" id="vHybrid" style="font-size:0.85rem">--</div>
                    </div>
                </div>
                <div class="sim-status" id="vseprExample" style="margin-top:8px;font-size:0.88rem;border-left:3px solid #fbbf24;padding-left:8px;"></div>
            </div>
        `;
    }

    function populateShapes(geomKey) {
        const shapeSelect = controlsContainer.querySelector('#vseprShape');
        const shapes = VSEPR_DATA[geomKey].shapes;
        shapeSelect.innerHTML = Object.keys(shapes).map(k => `<option value="${k}">${shapes[k].name}</option>`).join('');
        return Object.keys(shapes)[0];
    }

    function renderMolecule(geomKey, shapeKey) {
        // Clear old meshes
        atomMeshes.forEach(m => molGroup.remove(m));
        bondMeshes.forEach(m => molGroup.remove(m));
        lonePairMeshes.forEach(m => molGroup.remove(m));
        atomMeshes.length = 0; bondMeshes.length = 0; lonePairMeshes.length = 0;

        const shapeData = VSEPR_DATA[geomKey].shapes[shapeKey];
        if (!shapeData) return;

        // Bonding atoms (cyan spheres)
        shapeData.atomPos.forEach(pos => {
            const atom = new THREE.Mesh(
                new THREE.SphereGeometry(0.38, 24, 24),
                new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 0.2, metalness: 0.5 })
            );
            atom.position.set(pos[0], pos[1], pos[2]);
            atomMeshes.push(atom);
            molGroup.add(atom);

            // Bond cylinder (more realistic than line)
            const dir = new THREE.Vector3(pos[0], pos[1], pos[2]);
            const len = dir.length();
            const bondGeom = new THREE.CylinderGeometry(0.08, 0.08, len - 0.6, 8);
            const bondMesh = new THREE.Mesh(bondGeom, new THREE.MeshStandardMaterial({ color: 0xffffff, opacity: 0.7, transparent: true }));
            const mid = dir.clone().multiplyScalar(0.5);
            bondMesh.position.copy(mid);
            bondMesh.lookAt(dir);
            bondMesh.rotateX(Math.PI / 2);
            bondMeshes.push(bondMesh);
            molGroup.add(bondMesh);
        });

        // Lone pairs (orange fuzzy clouds)
        shapeData.lpDirs.forEach(pos => {
            const lp = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.5, transparent: true, opacity: 0.55, depthWrite: false })
            );
            lp.position.set(pos[0], pos[1], pos[2]);
            lonePairMeshes.push(lp);
            molGroup.add(lp);
            // Small second cloud for "cloud" effect
            const lp2 = new THREE.Mesh(
                new THREE.SphereGeometry(0.35, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.3, transparent: true, opacity: 0.4, depthWrite: false })
            );
            lp2.position.set(pos[0]*1.25, pos[1]*1.25, pos[2]*1.25);
            lonePairMeshes.push(lp2);
            molGroup.add(lp2);
        });

        // Update stats
        controlsContainer.querySelector('#vBondPairs').textContent = shapeData.bondPairs;
        controlsContainer.querySelector('#vLonePairs').textContent = shapeData.lonePairs;
        controlsContainer.querySelector('#vAngle').textContent = shapeData.angle;
        controlsContainer.querySelector('#vHybrid').textContent = shapeData.hybrid;
        controlsContainer.querySelector('#vseprExample').innerHTML = `<strong>Examples:</strong> ${shapeData.example}`;
    }

    buildUI();

    const geomSelect = controlsContainer.querySelector('#vseprGeom');
    geomSelect.value = 'tetrahedral';
    let currentGeom = 'tetrahedral';
    let currentShapeKey = populateShapes('tetrahedral');

    const shapeSelectEl = controlsContainer.querySelector('#vseprShape');
    renderMolecule(currentGeom, currentShapeKey);

    geomSelect.addEventListener('change', () => {
        currentGeom = geomSelect.value;
        currentShapeKey = populateShapes(currentGeom);
        renderMolecule(currentGeom, currentShapeKey);
    });
    shapeSelectEl.addEventListener('change', () => {
        currentShapeKey = shapeSelectEl.value;
        renderMolecule(currentGeom, currentShapeKey);
    });

    engine.setUpdate(() => { molGroup.rotation.y += 0.005; });
    overlayEl.innerHTML += `<span class="sim-badge">🔗 Geometry + Shape</span><span class="sim-badge">🟠 Lone Pairs</span>`;

    return () => {
        atomMeshes.forEach(a => molGroup.remove(a));
        bondMeshes.forEach(b => molGroup.remove(b));
        lonePairMeshes.forEach(l => molGroup.remove(l));
        molGroup.remove(central);
        scene.remove(molGroup);
    };
}

function initHybridSim(engine, controlsContainer, overlayEl) {
    const { scene, camera } = engine;
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 2, 0);

    const hybridGroup = new THREE.Group();
    hybridGroup.position.y = 2;
    scene.add(hybridGroup);

    // Nucleus
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 }));
    hybridGroup.add(nucleus);

    const lobes = [];

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title"><i class="fas fa-wave-square"></i> 🎮 Hybridization</div>
            <select class="game-select" id="hybridType">
                <option value="sp">sp (linear, 180°)</option>
                <option value="sp2">sp² (trigonal, 120°)</option>
                <option value="sp3" selected>sp³ (tetrahedral, 109.5°)</option>
                <option value="sp3d">sp³d (trig. bipyramidal, 90°/120°)</option>
                <option value="sp3d2">sp³d² (octahedral, 90°)</option>
            </select>
            <div class="sim-stats-grid" style="margin-top:10px;">
                <div class="sim-stat-card"><div class="sim-stat-label">Type</div><div class="sim-stat-value" id="hybType">sp³</div></div>
                <div class="sim-stat-card"><div class="sim-stat-label">Angle</div><div class="sim-stat-value" id="hybAngle">109.5°</div></div>
                <div class="sim-stat-card"><div class="sim-stat-label">Orbitals</div><div class="sim-stat-value" id="hybCount">4</div></div>
            </div>
            <div class="sim-status" id="hybInfo" style="margin-top:8px;"></div>
        </div>
    `;

    const hybridSelect = controlsContainer.querySelector('#hybridType');
    const typeEl = controlsContainer.querySelector('#hybType');
    const angleEl = controlsContainer.querySelector('#hybAngle');
    const countEl = controlsContainer.querySelector('#hybCount');
    const infoEl = controlsContainer.querySelector('#hybInfo');

    const colors = [0x8b5cf6, 0x22d3ee, 0xf97316, 0x10b981, 0xef4444, 0x84cc16];

    function createLobe(dir, color) {
        // Elongated lobe shape using scaled sphere
        const geom = new THREE.SphereGeometry(1, 24, 24);
        geom.scale(0.6, 0.6, 2.0);

        const mat = new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            roughness: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const mesh = new THREE.Mesh(geom, mat);

        // Point lobe in direction
        const up = new THREE.Vector3(0, 0, 1);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
        mesh.quaternion.copy(quaternion);

        // Offset center along direction
        mesh.position.copy(dir.clone().normalize().multiplyScalar(1.5));

        return mesh;
    }

    function setHybrid(type) {
        lobes.forEach(l => hybridGroup.remove(l));
        lobes.length = 0;

        const directions = [];
        let angle = '', count = '', info = '';

        if (type === 'sp') {
            directions.push(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0));
            angle = '180°'; count = '2'; info = 'Linear: 1 s + 1 p → 2 sp orbitals. e.g. BeCl₂, C₂H₂';
        } else if (type === 'sp2') {
            for (let i = 0; i < 3; i++) {
                const a = (i * 2 * Math.PI) / 3;
                directions.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
            }
            angle = '120°'; count = '3'; info = 'Trigonal: 1 s + 2 p → 3 sp² orbitals. e.g. BF₃, C₂H₄';
        } else if (type === 'sp3') {
            directions.push(
                new THREE.Vector3(1, 1, 1).normalize(),
                new THREE.Vector3(-1, -1, 1).normalize(),
                new THREE.Vector3(-1, 1, -1).normalize(),
                new THREE.Vector3(1, -1, -1).normalize()
            );
            angle = '109.5°'; count = '4'; info = 'Tetrahedral: 1 s + 3 p → 4 sp³ orbitals. e.g. CH₄, NH₃';
        } else if (type === 'sp3d') {
            // 3 equatorial (120° apart in XZ plane) + 2 axial (±Y)
            for (let i = 0; i < 3; i++) {
                const a = (i * 2 * Math.PI) / 3;
                directions.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
            }
            directions.push(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0));
            angle = '90°/120°'; count = '5'; info = 'Trig. Bipyramidal: 1 s + 3 p + 1 d → 5 sp³d orbitals. e.g. PCl₅, SF₄';
        } else if (type === 'sp3d2') {
            // 6 octahedral directions: ±X, ±Y, ±Z
            directions.push(
                new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
            );
            angle = '90°'; count = '6'; info = 'Octahedral: 1 s + 3 p + 2 d → 6 sp³d² orbitals. e.g. SF₆, XeF₄';
        } else {
            directions.push(
                new THREE.Vector3(1, 1, 1).normalize(),
                new THREE.Vector3(-1, -1, 1).normalize(),
                new THREE.Vector3(-1, 1, -1).normalize(),
                new THREE.Vector3(1, -1, -1).normalize()
            );
            angle = '109.5°'; count = '4'; info = 'Tetrahedral: 1 s + 3 p → 4 sp³ orbitals. e.g. CH₄, NH₃';
        }

        directions.forEach((dir, i) => {
            const lobe = createLobe(dir, colors[i % colors.length]);
            lobes.push(lobe);
            hybridGroup.add(lobe);

            // Bond line
            const bondGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(3)]);
            const bond = new THREE.Line(bondGeom, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
            lobes.push(bond);
            hybridGroup.add(bond);
        });

        typeEl.textContent = type;
        angleEl.textContent = angle;
        countEl.textContent = count;
        infoEl.textContent = info;
    }

    hybridSelect.addEventListener('change', () => setHybrid(hybridSelect.value));
    setHybrid('sp3');

    engine.setUpdate(() => { hybridGroup.rotation.y += 0.005; });
    overlayEl.innerHTML += `<span class="sim-badge">🧬 Hybrid Orbitals</span>`;

    return () => {
        lobes.forEach(l => hybridGroup.remove(l));
        hybridGroup.remove(nucleus);
        scene.remove(hybridGroup);
    };
}

function initCoordinateSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const pointA = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 0.2 }));
    const pointB = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.2 }));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const lineGeom = new THREE.BufferGeometry();
    const line = new THREE.Line(lineGeom, lineMaterial);
    const sectionPoint = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.2 }));
    scene.add(pointA, pointB, line, sectionPoint);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title"><i class="fas fa-ruler-combined"></i> 🎮 3D Coordinates</div>
            <div class="game-section-title" style="font-size:0.85rem"><span style="color:#22d3ee">●</span> Point A</div>
            <div class="sim-control-row"><label>X</label><input class="sim-slider" id="ax" type="range" min="-8" max="8" value="0" step="0.5"><span class="sim-slider-val" id="axVal">0</span></div>
            <div class="sim-control-row"><label>Y</label><input class="sim-slider" id="ay" type="range" min="-8" max="8" value="0" step="0.5"><span class="sim-slider-val" id="ayVal">0</span></div>
            <div class="sim-control-row"><label>Z</label><input class="sim-slider" id="az" type="range" min="-8" max="8" value="0" step="0.5"><span class="sim-slider-val" id="azVal">0</span></div>
            <div class="game-section-title" style="font-size:0.85rem"><span style="color:#f97316">●</span> Point B</div>
            <div class="sim-control-row"><label>X</label><input class="sim-slider" id="bx" type="range" min="-8" max="8" value="5" step="0.5"><span class="sim-slider-val" id="bxVal">5</span></div>
            <div class="sim-control-row"><label>Y</label><input class="sim-slider" id="by" type="range" min="-8" max="8" value="3" step="0.5"><span class="sim-slider-val" id="byVal">3</span></div>
            <div class="sim-control-row"><label>Z</label><input class="sim-slider" id="bz" type="range" min="-8" max="8" value="2" step="0.5"><span class="sim-slider-val" id="bzVal">2</span></div>
            <div class="game-section-title" style="font-size:0.85rem"><span style="color:#10b981">●</span> Section Ratio m:n</div>
            <div class="game-inline">
                <input class="game-input" id="ratioM" value="1" style="width:50%">
                <input class="game-input" id="ratioN" value="1" style="width:50%">
            </div>
            <div class="sim-stats-grid" style="margin-top:8px;">
                <div class="sim-stat-card"><div class="sim-stat-label">Distance</div><div class="sim-stat-value" id="distVal">--</div></div>
            </div>
            <div class="sim-status" id="coordInfo" style="margin-top:4px;"></div>
        </div>
    `;

    const inputs = controlsContainer.querySelectorAll('input');
    const infoEl = controlsContainer.querySelector('#coordInfo');

    function updateCoords() {
        const ax = parseFloat(controlsContainer.querySelector('#ax').value);
        const ay = parseFloat(controlsContainer.querySelector('#ay').value);
        const az = parseFloat(controlsContainer.querySelector('#az').value);
        const bx = parseFloat(controlsContainer.querySelector('#bx').value);
        const by = parseFloat(controlsContainer.querySelector('#by').value);
        const bz = parseFloat(controlsContainer.querySelector('#bz').value);
        const m = parseFloat(controlsContainer.querySelector('#ratioM').value) || 1;
        const n = parseFloat(controlsContainer.querySelector('#ratioN').value) || 1;

        controlsContainer.querySelector('#axVal').textContent = ax;
        controlsContainer.querySelector('#ayVal').textContent = ay;
        controlsContainer.querySelector('#azVal').textContent = az;
        controlsContainer.querySelector('#bxVal').textContent = bx;
        controlsContainer.querySelector('#byVal').textContent = by;
        controlsContainer.querySelector('#bzVal').textContent = bz;

        pointA.position.set(ax, ay, az);
        pointB.position.set(bx, by, bz);
        lineGeom.setFromPoints([pointA.position, pointB.position]);

        const sx = (m * bx + n * ax) / (m + n);
        const sy = (m * by + n * ay) / (m + n);
        const sz = (m * bz + n * az) / (m + n);
        sectionPoint.position.set(sx, sy, sz);

        const distance = pointA.position.distanceTo(pointB.position).toFixed(2);
        controlsContainer.querySelector('#distVal').textContent = distance;
        infoEl.innerHTML = `Section: <strong style="color:#10b981">(${sx.toFixed(1)}, ${sy.toFixed(1)}, ${sz.toFixed(1)})</strong>`;
    }

    inputs.forEach(input => input.addEventListener('input', updateCoords));
    updateCoords();
    overlayEl.innerHTML += `<span class="sim-badge">📐 Section Formula</span>`;

    return () => {
        scene.remove(pointA, pointB, line, sectionPoint);
    };
}

function initPlaneLineSim(engine, controlsContainer, overlayEl) {
    const { scene } = engine;
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, opacity: 0.25, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const planeGeom = new THREE.PlaneGeometry(14, 14);
    const planeMesh = new THREE.Mesh(planeGeom, planeMat);
    scene.add(planeMesh);

    const lineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    const lineGeom = new THREE.BufferGeometry();
    const line = new THREE.Line(lineGeom, lineMat);
    scene.add(line);

    // Intersection point marker
    const intPoint = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.5 }));
    intPoint.visible = false;
    scene.add(intPoint);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title"><i class="fas fa-sliders-h"></i> 🎮 Plane & Line</div>
            <div class="sim-control-row"><label>Plane θ</label><input class="sim-slider" id="planeTheta" type="range" min="0" max="180" value="45"><span class="sim-slider-val" id="pThetaVal">45°</span></div>
            <div class="sim-control-row"><label>Plane φ</label><input class="sim-slider" id="planePhi" type="range" min="0" max="180" value="45"><span class="sim-slider-val" id="pPhiVal">45°</span></div>
            <div class="sim-control-row"><label>Offset</label><input class="sim-slider" id="planeOffset" type="range" min="-3" max="3" value="0" step="0.2"><span class="sim-slider-val" id="pOffVal">0</span></div>
            <div class="game-section-title" style="margin-top:8px"><i class="fas fa-grip-lines"></i> Line</div>
            <div class="sim-control-row"><label>Line θ</label><input class="sim-slider" id="lineTheta" type="range" min="0" max="180" value="60"><span class="sim-slider-val" id="lThetaVal">60°</span></div>
            <div class="sim-control-row"><label>Line φ</label><input class="sim-slider" id="linePhi" type="range" min="0" max="180" value="60"><span class="sim-slider-val" id="lPhiVal">60°</span></div>
            <div class="sim-stats-grid" style="margin-top:8px;">
                <div class="sim-stat-card"><div class="sim-stat-label">Status</div><div class="sim-stat-value" id="planeInfo" style="font-size:0.75rem">--</div></div>
            </div>
        </div>
    `;

    const inputs = controlsContainer.querySelectorAll('input');
    const infoEl = controlsContainer.querySelector('#planeInfo');

    function update() {
        const theta = THREE.MathUtils.degToRad(parseFloat(controlsContainer.querySelector('#planeTheta').value));
        const phi = THREE.MathUtils.degToRad(parseFloat(controlsContainer.querySelector('#planePhi').value));
        const offset = parseFloat(controlsContainer.querySelector('#planeOffset').value);

        controlsContainer.querySelector('#pThetaVal').textContent = controlsContainer.querySelector('#planeTheta').value + '°';
        controlsContainer.querySelector('#pPhiVal').textContent = controlsContainer.querySelector('#planePhi').value + '°';
        controlsContainer.querySelector('#pOffVal').textContent = offset;
        controlsContainer.querySelector('#lThetaVal').textContent = controlsContainer.querySelector('#lineTheta').value + '°';
        controlsContainer.querySelector('#lPhiVal').textContent = controlsContainer.querySelector('#linePhi').value + '°';

        const normal = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
        planeMesh.position.copy(normal.clone().multiplyScalar(offset));
        planeMesh.lookAt(planeMesh.position.clone().add(normal));

        const lTheta = THREE.MathUtils.degToRad(parseFloat(controlsContainer.querySelector('#lineTheta').value));
        const lPhi = THREE.MathUtils.degToRad(parseFloat(controlsContainer.querySelector('#linePhi').value));
        const lineDir = new THREE.Vector3(Math.sin(lPhi) * Math.cos(lTheta), Math.cos(lPhi), Math.sin(lPhi) * Math.sin(lTheta)).normalize();
        const p0 = lineDir.clone().multiplyScalar(-8);
        const p1 = lineDir.clone().multiplyScalar(8);
        lineGeom.setFromPoints([p0, p1]);

        const denom = normal.dot(lineDir);
        if (Math.abs(denom) < 0.01) {
            infoEl.textContent = 'Parallel';
            infoEl.style.color = '#f59e0b';
            intPoint.visible = false;
        } else {
            // Calculate intersection
            const t = (offset - normal.dot(p0)) / normal.dot(lineDir);
            const ip = p0.clone().add(lineDir.clone().multiplyScalar(t));
            intPoint.position.copy(ip);
            intPoint.visible = true;
            infoEl.textContent = 'Intersects';
            infoEl.style.color = '#10b981';
        }
    }

    inputs.forEach(input => input.addEventListener('input', update));
    update();
    overlayEl.innerHTML += `<span class="sim-badge">🔴 Intersection</span>`;

    return () => {
        scene.remove(planeMesh, line, intPoint);
    };
}

function randNormal() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// =====================================================================
// SHM PENDULUM SIMULATOR
// =====================================================================
function initSHMSim(engine, controlsContainer, overlayEl) {
    const { scene, camera } = engine;
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 4, 0);

    const pendGroup = new THREE.Group();
    pendGroup.position.set(0, 10, 0);
    scene.add(pendGroup);

    // Pivot
    const pivotMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    pendGroup.add(pivotMesh);

    // Rod (line bar)
    const rodGeom = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
    const rodMesh = new THREE.Mesh(rodGeom, new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6 }));
    pendGroup.add(rodMesh);

    // Bob
    const bobMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.35, metalness: 0.7 })
    );
    pendGroup.add(bobMesh);

    // Trace trail
    const trailPoints = [];
    const trailMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    let trailLine = null;

    // Wall / support bar
    const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.18, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 })
    );
    wallMesh.position.set(0, 10, 0);
    scene.add(wallMesh);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title"><i class="fas fa-circle-notch"></i> 🔵 Simple Harmonic Motion</div>
            <div class="sim-control-row">
                <label>📏 Length (L): <strong id="lVal">3.0</strong> m</label>
                <input type="range" class="game-slider" id="pendLen" min="1" max="6" step="0.1" value="3.0">
            </div>
            <div class="sim-control-row">
                <label>📐 Amplitude: <strong id="aVal">30</strong>°</label>
                <input type="range" class="game-slider" id="pendAmp" min="5" max="60" step="1" value="30">
            </div>
            <div class="sim-control-row">
                <label>🌍 Gravity (g): <strong id="gVal">9.8</strong> m/s²</label>
                <input type="range" class="game-slider" id="pendGrav" min="1" max="20" step="0.1" value="9.8">
            </div>
            <div class="sim-stats-grid" style="margin-top:10px;">
                <div class="sim-stat-card" style="border-left:3px solid #22d3ee">
                    <div class="sim-stat-label">⏱ Period T</div>
                    <div class="sim-stat-value" id="periodVal">--</div>
                    <div class="sim-stat-unit">s</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #f59e0b">
                    <div class="sim-stat-label">📐 Angle θ</div>
                    <div class="sim-stat-value" id="angleVal">--</div>
                    <div class="sim-stat-unit">°</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #10b981">
                    <div class="sim-stat-label">💨 Velocity</div>
                    <div class="sim-stat-value" id="velVal">--</div>
                    <div class="sim-stat-unit">m/s</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #a78bfa">
                    <div class="sim-stat-label">⚡ KE</div>
                    <div class="sim-stat-value" id="keValShm">--</div>
                    <div class="sim-stat-unit">J</div>
                </div>
            </div>
            <canvas id="shmGraph" width="300" height="100" style="margin-top:10px;border-radius:8px;background:#0f1419;"></canvas>
            <div class="sim-status" id="shmFormula" style="margin-top:8px;font-size:0.82rem;color:#94a3b8;">θ(t) = A·cos(ωt) | T = 2π√(L/g)</div>
            <button class="btn-primary sim-action-btn" id="shmResetBtn"><i class="fas fa-redo"></i> Reset</button>
        </div>
    `;

    const shmCanvas = controlsContainer.querySelector('#shmGraph');
    const shmCtx = shmCanvas.getContext('2d');

    let L = 3.0, ampDeg = 30, grav = 9.8;
    let theta = 0, omega = 0;
    let simTime = 0;
    const angleHistory = [];

    function resetPendulum() {
        theta = (ampDeg * Math.PI) / 180;
        omega = 0;
        simTime = 0;
        angleHistory.length = 0;
        trailPoints.length = 0;
        if (trailLine) { scene.remove(trailLine); trailLine = null; }
    }
    resetPendulum();

    function updateSliders() {
        L = parseFloat(controlsContainer.querySelector('#pendLen').value);
        ampDeg = parseFloat(controlsContainer.querySelector('#pendAmp').value);
        grav = parseFloat(controlsContainer.querySelector('#pendGrav').value);
        controlsContainer.querySelector('#lVal').textContent = L.toFixed(1);
        controlsContainer.querySelector('#aVal').textContent = ampDeg;
        controlsContainer.querySelector('#gVal').textContent = grav.toFixed(1);
        resetPendulum();
    }

    ['#pendLen','#pendAmp','#pendGrav'].forEach(id => {
        controlsContainer.querySelector(id).addEventListener('input', updateSliders);
    });
    controlsContainer.querySelector('#shmResetBtn').addEventListener('click', resetPendulum);

    engine.setUpdate(() => {
        const dt = 0.016;
        // Runge-Kutta 4 for accuracy
        const alphaDot = (t, w) => -(grav / L) * Math.sin(t);
        const k1t = omega * dt, k1w = alphaDot(theta, omega) * dt;
        const k2t = (omega + k1w/2) * dt, k2w = alphaDot(theta + k1t/2, omega + k1w/2) * dt;
        const k3t = (omega + k2w/2) * dt, k3w = alphaDot(theta + k2t/2, omega + k2w/2) * dt;
        const k4t = (omega + k3w) * dt, k4w = alphaDot(theta + k3t, omega + k3w) * dt;
        theta += (k1t + 2*k2t + 2*k3t + k4t) / 6;
        omega += (k1w + 2*k2w + 2*k3w + k4w) / 6;
        // Slight damping
        omega *= 0.9998;
        simTime += dt;

        // 3D positions: pivot at origin, bob swings in XY plane
        const bobX = L * Math.sin(theta) * 2.2; // scale up for visibility
        const bobY = -L * Math.cos(theta) * 2.2;

        rodMesh.position.set(bobX / 2, bobY / 2, 0);
        rodMesh.scale.y = Math.sqrt(bobX * bobX + bobY * bobY) / 1;
        rodMesh.lookAt(new THREE.Vector3(bobX, bobY, 0));
        rodMesh.rotateX(Math.PI / 2);

        bobMesh.position.set(bobX, bobY, 0);

        // Trail
        trailPoints.push(new THREE.Vector3(bobX, bobY, 0).add(pendGroup.position));
        if (trailPoints.length > 120) trailPoints.shift();
        if (trailLine) scene.remove(trailLine);
        if (trailPoints.length > 2) {
            const tg = new THREE.BufferGeometry().setFromPoints(trailPoints);
            trailLine = new THREE.Line(tg, trailMat);
            scene.add(trailLine);
        }

        const T = 2 * Math.PI * Math.sqrt(L / grav);
        const v = omega * L;
        const ke = 0.5 * 1.0 * v * v;
        controlsContainer.querySelector('#periodVal').textContent = T.toFixed(2);
        controlsContainer.querySelector('#angleVal').textContent = (theta * 180 / Math.PI).toFixed(1);
        controlsContainer.querySelector('#velVal').textContent = Math.abs(v).toFixed(2);
        controlsContainer.querySelector('#keValShm').textContent = ke.toFixed(3);

        angleHistory.push((theta * 180) / Math.PI);
        if (angleHistory.length > 150) angleHistory.shift();

        // Draw wave
        const w = shmCanvas.width, h = shmCanvas.height;
        shmCtx.fillStyle = '#0f1419'; shmCtx.fillRect(0, 0, w, h);
        shmCtx.strokeStyle = '#1e293b'; shmCtx.lineWidth = 1;
        shmCtx.beginPath(); shmCtx.moveTo(0, h/2); shmCtx.lineTo(w, h/2); shmCtx.stroke();
        if (angleHistory.length > 2) {
            const maxA = Math.max(...angleHistory.map(Math.abs), 1);
            const step = w / (angleHistory.length - 1);
            shmCtx.strokeStyle = '#f59e0b'; shmCtx.lineWidth = 2;
            shmCtx.beginPath();
            angleHistory.forEach((a, i) => {
                const x = i * step, y = h/2 - (a / maxA) * (h/2 - 8);
                i === 0 ? shmCtx.moveTo(x, y) : shmCtx.lineTo(x, y);
            });
            shmCtx.stroke();
        }
        shmCtx.fillStyle = '#94a3b8'; shmCtx.font = '10px sans-serif';
        shmCtx.fillText('θ(t) — displacement wave', 8, 12);
    });

    overlayEl.innerHTML += `<span class="sim-badge">🔵 SHM Pendulum</span><span class="sim-badge">T = 2π√(L/g)</span>`;

    return () => {
        scene.remove(pendGroup, wallMesh);
        if (trailLine) scene.remove(trailLine);
    };
}

// =====================================================================
// LPP (LINEAR PROGRAMMING) GRAPH SIMULATOR — 2D canvas
// =====================================================================
function initLPPSim(engine, controlsContainer, overlayEl) {
    engine.setUpdate(() => {});

    const constraints = [
        { a: 2, b: 1, c: 10, op: '≤' },
        { a: 1, b: 3, c: 12, op: '≤' },
        { a: 1, b: 0, c: 6,  op: '≤' },
    ];
    const objective = { cx: 3, cy: 5, goal: 'max' };

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel" style="min-width:280px;">
            <div class="game-section-title"><i class="fas fa-chart-line"></i> 📊 Linear Programming</div>
            <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:6px;">Objective: Z = <strong id="lppObjLabel">${objective.cx}x + ${objective.cy}y</strong> (<span id="lppGoalLabel">${objective.goal}</span>imize)</div>
            <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
                <span style="font-size:0.8rem;color:#f59e0b;">Z = </span>
                <input type="number" class="game-input" id="lppCx" value="${objective.cx}" style="width:52px;" placeholder="cx">
                <span style="font-size:0.8rem;color:#94a3b8;">x +</span>
                <input type="number" class="game-input" id="lppCy" value="${objective.cy}" style="width:52px;" placeholder="cy">
                <span style="font-size:0.8rem;color:#94a3b8;">y</span>
                <select class="game-select" id="lppGoal" style="font-size:0.78rem;padding:2px 6px;">
                    <option value="max">Max</option>
                    <option value="min">Min</option>
                </select>
            </div>
            <div style="font-size:0.82rem;font-weight:700;color:#a78bfa;margin-bottom:4px;">📏 Constraints (ax + by ≤/≥ c):</div>
            <div id="lppConstraintList" style="display:flex;flex-direction:column;gap:4px;"></div>
            <button class="btn-primary sim-action-btn" id="lppAddBtn" style="margin-top:8px;padding:6px 12px;font-size:0.8rem;">
                <i class="fas fa-plus"></i> Add Constraint
            </button>
            <div class="sim-stats-grid" style="margin-top:10px;">
                <div class="sim-stat-card" style="border-left:3px solid #10b981;grid-column:span 2;">
                    <div class="sim-stat-label">🎯 Optimal Point</div>
                    <div class="sim-stat-value" id="lppOptPt" style="font-size:0.85rem;">--</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #f59e0b;grid-column:span 2;">
                    <div class="sim-stat-label">Z (Optimal)</div>
                    <div class="sim-stat-value" id="lppOptZ">--</div>
                </div>
            </div>
        </div>
    `;

    const lppCanvas = make2DCanvas(engine, 'lppCanvas', '#0d1117');
    const ctx = lppCanvas.getContext('2d');

    function renderConstraintList() {
        const list = controlsContainer.querySelector('#lppConstraintList');
        list.innerHTML = constraints.map((c, i) => `
            <div style="display:flex;gap:4px;align-items:center;" data-idx="${i}">
                <input type="number" class="game-input lpp-a" value="${c.a}" style="width:44px;" title="coeff of x">
                <span style="color:#94a3b8;font-size:0.8rem;">x +</span>
                <input type="number" class="game-input lpp-b" value="${c.b}" style="width:44px;" title="coeff of y">
                <span style="color:#94a3b8;font-size:0.8rem;">y</span>
                <select class="game-select lpp-op" style="font-size:0.76rem;padding:2px 4px;">
                    <option value="≤" ${c.op==='≤'?'selected':''}>≤</option>
                    <option value="≥" ${c.op==='≥'?'selected':''}>≥</option>
                    <option value="=" ${c.op==='='?'selected':''}>= </option>
                </select>
                <input type="number" class="game-input lpp-c" value="${c.c}" style="width:44px;" title="RHS constant">
                <button class="sim-delete-btn" data-del="${i}" style="background:#ef4444;border:none;color:#fff;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:0.8rem;">✕</button>
            </div>
        `).join('');

        list.querySelectorAll('[data-del]').forEach(btn => {
            btn.addEventListener('click', () => {
                constraints.splice(parseInt(btn.getAttribute('data-del')), 1);
                renderConstraintList();
                drawLPP();
            });
        });

        list.querySelectorAll('[data-idx]').forEach(row => {
            const idx = parseInt(row.getAttribute('data-idx'));
            row.querySelector('.lpp-a').addEventListener('input', e => { constraints[idx].a = parseFloat(e.target.value)||0; drawLPP(); });
            row.querySelector('.lpp-b').addEventListener('input', e => { constraints[idx].b = parseFloat(e.target.value)||0; drawLPP(); });
            row.querySelector('.lpp-c').addEventListener('input', e => { constraints[idx].c = parseFloat(e.target.value)||0; drawLPP(); });
            row.querySelector('.lpp-op').addEventListener('change', e => { constraints[idx].op = e.target.value; drawLPP(); });
        });
    }

    function drawLPP() {
        const W = lppCanvas.width = lppCanvas.offsetWidth || 600;
        const H = lppCanvas.height = lppCanvas.offsetHeight || 500;
        ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

        const pad = 60;
        const scale = (W - pad * 2) / 16;
        const ox = pad, oy = H - pad;

        function toScreen(x, y) { return [ox + x * scale, oy - y * scale]; }

        // Grid
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
        for (let v = 0; v <= 16; v++) {
            const [sx] = toScreen(v, 0); const [, sy] = toScreen(0, v);
            ctx.beginPath(); ctx.moveTo(sx, pad); ctx.lineTo(sx, oy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox, sy); ctx.lineTo(W - pad, sy); ctx.stroke();
        }
        // Axes
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ox, pad); ctx.lineTo(ox, oy); ctx.lineTo(W - pad, oy); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText('x', W - pad + 6, oy + 4);
        ctx.fillText('y', ox - 4, pad - 8);
        for (let v = 0; v <= 16; v += 2) {
            const [sx] = toScreen(v, 0); const [, sy] = toScreen(0, v);
            ctx.fillStyle = '#475569'; ctx.font = '10px sans-serif';
            ctx.fillText(v, sx - 4, oy + 14);
            if (v > 0) ctx.fillText(v, ox - 22, sy + 4);
        }

        const lineColors = ['#f97316','#22d3ee','#a78bfa','#10b981','#ec4899','#f59e0b'];

        // Draw constraint lines
        constraints.forEach((c, i) => {
            if (c.b !== 0) {
                const x0 = 0, y0 = (c.c - c.a * x0) / c.b;
                const x1 = 16, y1 = (c.c - c.a * x1) / c.b;
                const [sx0, sy0] = toScreen(x0, y0); const [sx1, sy1] = toScreen(x1, y1);
                ctx.strokeStyle = lineColors[i % lineColors.length]; ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx1, sy1); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = lineColors[i % lineColors.length]; ctx.font = '11px sans-serif';
                const midX = 8, midY = (c.c - c.a * midX) / c.b + 0.3;
                if (midY >= 0 && midY <= 16) {
                    const [lx, ly] = toScreen(midX, midY);
                    ctx.fillText(`${c.a}x+${c.b}y${c.op}${c.c}`, lx, ly - 4);
                }
            } else if (c.a !== 0) {
                const xv = c.c / c.a;
                const [sx, sy0] = toScreen(xv, 0); const [, sy1] = toScreen(xv, 16);
                ctx.strokeStyle = lineColors[i % lineColors.length]; ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath(); ctx.moveTo(sx, sy0); ctx.lineTo(sx, sy1); ctx.stroke();
                ctx.setLineDash([]);
            }
        });

        // Find corner vertices (feasible region intersections)
        const pts = [[0, 0]];
        // axis intercepts 
        constraints.forEach(c => {
            if (c.b !== 0) pts.push([0, c.c / c.b], [c.c / c.a || 0, 0]);
            else if (c.a !== 0) pts.push([c.c / c.a, 0]);
        });
        // All intersections between constraint pairs
        for (let i = 0; i < constraints.length; i++) {
            for (let j = i + 1; j < constraints.length; j++) {
                const {a: a1, b: b1, c: c1} = constraints[i];
                const {a: a2, b: b2, c: c2} = constraints[j];
                const det = a1 * b2 - a2 * b1;
                if (Math.abs(det) > 1e-10) {
                    const xI = (c1 * b2 - c2 * b1) / det;
                    const yI = (a1 * c2 - a2 * c1) / det;
                    pts.push([xI, yI]);
                }
            }
        }

        // Filter feasible points (x≥0, y≥0, all constraints satisfied)
        function isFeasible(x, y) {
            if (x < -0.001 || y < -0.001) return false;
            return constraints.every(c => {
                const lhs = c.a * x + c.b * y;
                if (c.op === '≤') return lhs <= c.c + 0.001;
                if (c.op === '≥') return lhs >= c.c - 0.001;
                return Math.abs(lhs - c.c) < 0.01;
            });
        }
        const feasible = pts.filter(([x, y]) => isFeasible(x, y) && x <= 20 && y <= 20);

        // Shade feasible region (convex hull)
        if (feasible.length > 2) {
            const cx_ = feasible.reduce((s, p) => s + p[0], 0) / feasible.length;
            const cy_ = feasible.reduce((s, p) => s + p[1], 0) / feasible.length;
            const sorted = [...feasible].sort((a, b) => Math.atan2(a[1]-cy_, a[0]-cx_) - Math.atan2(b[1]-cy_, b[0]-cx_));
            ctx.fillStyle = 'rgba(34,211,238,0.12)';
            ctx.beginPath();
            sorted.forEach(([x, y], i) => {
                const [sx, sy] = toScreen(x, y);
                i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
            });
            ctx.closePath(); ctx.fill();
            // Draw outline
            ctx.strokeStyle = 'rgba(34,211,238,0.4)'; ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Evaluate objective at feasible corners
        const cxV = parseFloat(controlsContainer.querySelector('#lppCx').value) || 0;
        const cyV = parseFloat(controlsContainer.querySelector('#lppCy').value) || 0;
        const goal = controlsContainer.querySelector('#lppGoal').value;
        controlsContainer.querySelector('#lppObjLabel').textContent = `${cxV}x + ${cyV}y`;
        controlsContainer.querySelector('#lppGoalLabel').textContent = goal;

        let optPt = null, optZ = goal === 'max' ? -Infinity : Infinity;
        feasible.forEach(([x, y]) => {
            const z = cxV * x + cyV * y;
            if (goal === 'max' ? z > optZ : z < optZ) { optZ = z; optPt = [x, y]; }
        });

        // Vertex dots
        feasible.forEach(([x, y]) => {
            const [sx, sy] = toScreen(x, y);
            ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#64748b'; ctx.fill();
        });

        // Optimal point highlight
        if (optPt) {
            const [sx, sy] = toScreen(optPt[0], optPt[1]);
            ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`(${optPt[0].toFixed(1)}, ${optPt[1].toFixed(1)})`, sx + 10, sy - 8);
            controlsContainer.querySelector('#lppOptPt').textContent = `(${optPt[0].toFixed(2)}, ${optPt[1].toFixed(2)})`;
            controlsContainer.querySelector('#lppOptZ').textContent = optZ.toFixed(2);

            // Objective line through optimal
            if (cxV !== 0 || cyV !== 0) {
                const x0 = 0, y0 = cyV !== 0 ? optZ / cyV : 0;
                const x1 = cxV !== 0 ? optZ / cxV : 16, y1 = 0;
                const [sx0, sy0_] = toScreen(x0, y0); const [sx1, sy1] = toScreen(x1, y1);
                ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.setLineDash([8, 4]);
                ctx.beginPath(); ctx.moveTo(sx0, sy0_); ctx.lineTo(sx1, sy1); ctx.stroke();
                ctx.setLineDash([]);
            }
        } else {
            controlsContainer.querySelector('#lppOptPt').textContent = 'Infeasible / None';
            controlsContainer.querySelector('#lppOptZ').textContent = '--';
        }

        ctx.fillStyle = '#1e293b'; ctx.fillRect(ox, 0, W - ox - pad + 10, pad - 10);
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`LPP Graph — Z = ${cxV}x + ${cyV}y (${goal}imize)`, ox + 8, pad - 14);
    }

    renderConstraintList();
    drawLPP();

    controlsContainer.querySelector('#lppAddBtn').addEventListener('click', () => {
        constraints.push({ a: 1, b: 1, c: 8, op: '≤' });
        renderConstraintList();
        drawLPP();
    });
    ['#lppCx','#lppCy'].forEach(id => {
        controlsContainer.querySelector(id).addEventListener('input', drawLPP);
    });
    controlsContainer.querySelector('#lppGoal').addEventListener('change', drawLPP);

    const resizeObs = new ResizeObserver(() => drawLPP());
    resizeObs.observe(lppCanvas.parentElement);

    overlayEl.innerHTML += `<span class="sim-badge">📊 Feasible Region</span><span class="sim-badge">🎯 Corner Point</span>`;

    return () => {
        lppCanvas.remove();
        resizeObs.disconnect();
    };
}

// =====================================================================
// MOLECULAR ORBITAL DIAGRAM SIMULATOR — Canvas 2D
// =====================================================================
function initMOSim(engine, controlsContainer, overlayEl) {
    engine.setUpdate(() => {});

    const MO_DATA = {
        N2: { name:'N\u2082', left:'N', right:'N', bondOrder:3, magnetic:'Diamagnetic',
              config:'\u03c31s\u00b2 \u03c3*1s\u00b2 \u03c32s\u00b2 \u03c3*2s\u00b2 \u03c02p\u2074 \u03c32p\u00b2',
              levels:[
                {label:'1s',       side:'left',  x:-1,    y:0,    e:2},
                {label:'1s',       side:'right', x: 1,    y:0,    e:2},
                {label:'\u03c3\u2081s',  side:'mo',   x:0,     y:-0.6, e:2},
                {label:'\u03c3*\u2081s', side:'mo',   x:0,     y: 0.9, e:2},
                {label:'2s',       side:'left',  x:-1,    y:2.8,  e:2},
                {label:'2s',       side:'right', x: 1,    y:2.8,  e:2},
                {label:'\u03c3\u2082s',  side:'mo',   x:0,     y:2.2,  e:2},
                {label:'\u03c3*\u2082s', side:'mo',   x:0,     y:3.6,  e:2},
                {label:'2p',       side:'left',  x:-1,    y:5.5,  e:1, triple:true},
                {label:'2p',       side:'right', x: 1,    y:5.5,  e:1, triple:true},
                {label:'\u03c0\u2082p',  side:'mo',   x: 0.38, y:5.1, e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x:-0.38, y:5.1, e:2},
                {label:'\u03c3\u2082p',  side:'mo',   x:0,     y:5.7,  e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x: 0.38, y:6.5, e:0},
                {label:'\u03c0*\u2082p', side:'mo',   x:-0.38, y:6.5, e:0},
                {label:'\u03c3*\u2082p', side:'mo',   x:0,     y:7.2,  e:0},
              ]},
        O2: { name:'O\u2082', left:'O', right:'O', bondOrder:2, magnetic:'Paramagnetic (2 unpaired e\u207b)',
              config:'\u03c31s\u00b2 \u03c3*1s\u00b2 \u03c32s\u00b2 \u03c3*2s\u00b2 \u03c32p\u00b2 \u03c02p\u2074 \u03c0*2p\u00b2',
              levels:[
                {label:'1s',       side:'left',  x:-1,    y:0,    e:2},
                {label:'1s',       side:'right', x: 1,    y:0,    e:2},
                {label:'\u03c3\u2081s',  side:'mo',   x:0,     y:-0.6, e:2},
                {label:'\u03c3*\u2081s', side:'mo',   x:0,     y: 0.9, e:2},
                {label:'2s',       side:'left',  x:-1,    y:2.8,  e:2},
                {label:'2s',       side:'right', x: 1,    y:2.8,  e:2},
                {label:'\u03c3\u2082s',  side:'mo',   x:0,     y:2.2,  e:2},
                {label:'\u03c3*\u2082s', side:'mo',   x:0,     y:3.6,  e:2},
                {label:'2p',       side:'left',  x:-1,    y:5.5,  e:1, triple:true},
                {label:'2p',       side:'right', x: 1,    y:5.5,  e:1, triple:true},
                {label:'\u03c3\u2082p',  side:'mo',   x:0,     y:5.0,  e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x: 0.38, y:5.7, e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x:-0.38, y:5.7, e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x: 0.38, y:6.5, e:1},
                {label:'\u03c0*\u2082p', side:'mo',   x:-0.38, y:6.5, e:1},
                {label:'\u03c3*\u2082p', side:'mo',   x:0,     y:7.2,  e:0},
              ]},
        F2: { name:'F\u2082', left:'F', right:'F', bondOrder:1, magnetic:'Diamagnetic',
              config:'\u03c31s\u00b2 \u03c3*1s\u00b2 \u03c32s\u00b2 \u03c3*2s\u00b2 \u03c32p\u00b2 \u03c02p\u2074 \u03c0*2p\u2074',
              levels:[
                {label:'1s',       side:'left',  x:-1,    y:0,    e:2},
                {label:'1s',       side:'right', x: 1,    y:0,    e:2},
                {label:'\u03c3\u2081s',  side:'mo',   x:0,     y:-0.6, e:2},
                {label:'\u03c3*\u2081s', side:'mo',   x:0,     y: 0.9, e:2},
                {label:'2s',       side:'left',  x:-1,    y:2.8,  e:2},
                {label:'2s',       side:'right', x: 1,    y:2.8,  e:2},
                {label:'\u03c3\u2082s',  side:'mo',   x:0,     y:2.2,  e:2},
                {label:'\u03c3*\u2082s', side:'mo',   x:0,     y:3.6,  e:2},
                {label:'2p',       side:'left',  x:-1,    y:5.5,  e:1, triple:true},
                {label:'2p',       side:'right', x: 1,    y:5.5,  e:1, triple:true},
                {label:'\u03c3\u2082p',  side:'mo',   x:0,     y:5.0,  e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x: 0.38, y:5.7, e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x:-0.38, y:5.7, e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x: 0.38, y:6.5, e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x:-0.38, y:6.5, e:2},
                {label:'\u03c3*\u2082p', side:'mo',   x:0,     y:7.2,  e:0},
              ]},
        NO: { name:'NO', left:'N', right:'O', bondOrder:2.5, magnetic:'Paramagnetic (1 unpaired e\u207b)',
              config:'\u03c31s\u00b2 \u03c3*1s\u00b2 \u03c32s\u00b2 \u03c3*2s\u00b2 \u03c02p\u2074 \u03c32p\u00b2 \u03c0*2p\u00b9',
              levels:[
                {label:'1s',       side:'left',  x:-1,    y:0,    e:2},
                {label:'1s',       side:'right', x: 1,    y:0,    e:2},
                {label:'\u03c3\u2081s',  side:'mo',   x:0,     y:-0.6, e:2},
                {label:'\u03c3*\u2081s', side:'mo',   x:0,     y: 0.9, e:2},
                {label:'2s',       side:'left',  x:-1,    y:2.8,  e:2},
                {label:'2s',       side:'right', x: 1,    y:2.8,  e:2},
                {label:'\u03c3\u2082s',  side:'mo',   x:0,     y:2.2,  e:2},
                {label:'\u03c3*\u2082s', side:'mo',   x:0,     y:3.6,  e:2},
                {label:'2p',       side:'left',  x:-1,    y:5.5,  e:1, triple:true},
                {label:'2p',       side:'right', x: 1,    y:5.5,  e:1, triple:true},
                {label:'\u03c0\u2082p',  side:'mo',   x: 0.38, y:5.1, e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x:-0.38, y:5.1, e:2},
                {label:'\u03c3\u2082p',  side:'mo',   x:0,     y:5.7,  e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x: 0.38, y:6.5, e:1},
                {label:'\u03c0*\u2082p', side:'mo',   x:-0.38, y:6.5, e:0},
                {label:'\u03c3*\u2082p', side:'mo',   x:0,     y:7.2,  e:0},
              ]},
        CO: { name:'CO', left:'C', right:'O', bondOrder:3, magnetic:'Diamagnetic',
              config:'\u03c31s\u00b2 \u03c3*1s\u00b2 \u03c32s\u00b2 \u03c3*2s\u00b2 \u03c02p\u2074 \u03c32p\u00b2',
              levels:[
                {label:'1s',       side:'left',  x:-1,    y:0,    e:2},
                {label:'1s',       side:'right', x: 1,    y:0,    e:2},
                {label:'\u03c3\u2081s',  side:'mo',   x:0,     y:-0.6, e:2},
                {label:'\u03c3*\u2081s', side:'mo',   x:0,     y: 0.9, e:2},
                {label:'2s',       side:'left',  x:-1,    y:2.8,  e:2},
                {label:'2s',       side:'right', x: 1,    y:2.8,  e:2},
                {label:'\u03c3\u2082s',  side:'mo',   x:0,     y:2.2,  e:2},
                {label:'\u03c3*\u2082s', side:'mo',   x:0,     y:3.6,  e:2},
                {label:'2p',       side:'left',  x:-1,    y:5.5,  e:1, triple:true},
                {label:'2p',       side:'right', x: 1,    y:5.5,  e:1, triple:true},
                {label:'\u03c0\u2082p',  side:'mo',   x: 0.38, y:5.1, e:2},
                {label:'\u03c0\u2082p',  side:'mo',   x:-0.38, y:5.1, e:2},
                {label:'\u03c3\u2082p',  side:'mo',   x:0,     y:5.7,  e:2},
                {label:'\u03c0*\u2082p', side:'mo',   x: 0.38, y:6.5, e:0},
                {label:'\u03c0*\u2082p', side:'mo',   x:-0.38, y:6.5, e:0},
                {label:'\u03c3*\u2082p', side:'mo',   x:0,     y:7.2,  e:0},
              ]},
    };

    let currentMol = 'N2';

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title">\u269b\ufe0f Molecular Orbital Diagram</div>
            <div class="sim-control-row">
                <label style="font-weight:700;color:#a78bfa;">Select Molecule</label>
                <select class="game-select" id="moMolSelect" style="margin-top:4px;">
                    ${Object.keys(MO_DATA).map(k=>`<option value="${k}">${MO_DATA[k].name}</option>`).join('')}
                </select>
            </div>
            <div class="sim-stats-grid" style="margin-top:10px;">
                <div class="sim-stat-card" style="border-left:3px solid #10b981">
                    <div class="sim-stat-label">\ud83d\udd17 Bond Order</div>
                    <div class="sim-stat-value" id="moBondOrder">--</div>
                </div>
                <div class="sim-stat-card" style="border-left:3px solid #f97316">
                    <div class="sim-stat-label">\ud83e\udde8 Magnetic</div>
                    <div class="sim-stat-value" id="moMagnetic" style="font-size:0.7rem;">--</div>
                </div>
            </div>
            <div class="sim-stat-card" style="border-left:3px solid #22d3ee;margin-top:6px;">
                <div class="sim-stat-label">\ud83d\udccb Configuration</div>
                <div style="font-size:0.72rem;color:#94a3b8;margin-top:4px;" id="moConfig">--</div>
            </div>
            <div style="margin-top:8px;font-size:0.74rem;color:#64748b;line-height:2;">
                <span style="display:inline-block;width:12px;height:12px;background:#d4a843;border-radius:2px;margin-right:4px;"></span>Bonding MO
                <span style="display:inline-block;width:12px;height:12px;background:#e05252;border-radius:2px;margin-left:8px;margin-right:4px;"></span>Antibonding MO*
                <br>
                <span style="display:inline-block;width:12px;height:12px;background:#4a7fb5;border-radius:2px;margin-right:4px;"></span>Atomic Orbital
            </div>
        </div>`;

    const moCanvas = make2DCanvas(engine, 'moCanvas', '#0d1117');
    const ctx2 = moCanvas.getContext('2d');

    const CLR = {
        bg:'#0d1117', bgGrid:'#111827', axisLine:'#334155', axisText:'#94a3b8',
        colLabel:'#cbd5e1', moBox:'#2a1f08', moBord:'#d4a843',
        moBoxAb:'#2a0808', moBordAb:'#e05252', aoBox:'#0f2038', aoBord:'#4a7fb5',
        dash:'#2d3f54', arrowCol:'#e2e8f0', labelBond:'#d4a843', labelAb:'#e05252', labelAO:'#7cb8e8',
    };

    function drawMO(molKey) {
        const mol = MO_DATA[molKey];
        const W = moCanvas.width  = moCanvas.offsetWidth  || 680;
        const H = moCanvas.height = moCanvas.offsetHeight || 620;

        ctx2.fillStyle = CLR.bg; ctx2.fillRect(0,0,W,H);
        ctx2.strokeStyle = CLR.bgGrid; ctx2.lineWidth = 0.5;
        for (let gy=28; gy<H; gy+=28) { ctx2.beginPath(); ctx2.moveTo(0,gy); ctx2.lineTo(W,gy); ctx2.stroke(); }

        const lx = W*0.20, rx = W*0.80, cx = W*0.50;
        const topPad = 36, botPad = 54;
        const availH = H - topPad - botPad;
        function toY(v) { return topPad + availH*(1 - v/8.4); }

        // ENERGY axis
        ctx2.save();
        ctx2.strokeStyle = CLR.axisLine; ctx2.lineWidth = 2;
        ctx2.beginPath(); ctx2.moveTo(18,H-botPad); ctx2.lineTo(18,topPad+4); ctx2.stroke();
        ctx2.beginPath(); ctx2.moveTo(13,topPad+10); ctx2.lineTo(18,topPad+2); ctx2.lineTo(23,topPad+10); ctx2.stroke();
        ctx2.fillStyle = CLR.axisText; ctx2.font = 'bold 11px sans-serif';
        ctx2.translate(11,H/2); ctx2.rotate(-Math.PI/2);
        ctx2.textAlign='center'; ctx2.fillText('ENERGY',0,0);
        ctx2.restore();

        // Column labels
        ctx2.fillStyle = CLR.colLabel; ctx2.font = 'bold 15px sans-serif'; ctx2.textAlign='center';
        ctx2.fillText(mol.left, lx, H-14);
        ctx2.fillStyle = '#a78bfa'; ctx2.fillText(mol.name, cx, H-14);
        ctx2.fillStyle = CLR.colLabel; ctx2.fillText(mol.right, rx, H-14);

        const boxW=40, boxH=22;

        // Dashed connectors (behind boxes)
        const groups=[
            {aoY:0,   moYs:[-0.6,0.9]},
            {aoY:2.8, moYs:[2.2,3.6]},
            {aoY:5.5, moYs:[5.0,5.1,5.7,6.5,7.2]},
        ];
        ctx2.setLineDash([5,5]); ctx2.strokeStyle=CLR.dash; ctx2.lineWidth=1;
        groups.forEach(g=>{
            const ay=toY(g.aoY+0.5);
            g.moYs.forEach(my=>{
                const moy=toY(my+0.5);
                ctx2.beginPath(); ctx2.moveTo(lx+boxW*0.7,ay);   ctx2.lineTo(cx-boxW,moy); ctx2.stroke();
                ctx2.beginPath(); ctx2.moveTo(rx-boxW*0.7,ay);   ctx2.lineTo(cx+boxW,moy); ctx2.stroke();
            });
        });
        ctx2.setLineDash([]);

        // Boxes
        const drawn={};
        mol.levels.forEach(lvl=>{
            const bCx = lvl.side==='mo' ? cx+lvl.x*W*0.13 : (lvl.side==='left'?lx:rx);
            const bCy = toY(lvl.y+0.5);
            const isAb = lvl.label.includes('*');
            const isMO = lvl.side==='mo';
            const fill  = isMO?(isAb?CLR.moBoxAb:CLR.moBox):CLR.aoBox;
            const bord  = isMO?(isAb?CLR.moBordAb:CLR.moBord):CLR.aoBord;
            const lc    = isMO?(isAb?CLR.labelAb:CLR.labelBond):CLR.labelAO;

            if (lvl.triple) {
                const key=`${lvl.side}-${lvl.y}`;
                if (drawn[key]) return; drawn[key]=true;
                for (let k=-1;k<=1;k++) {
                    const bx=bCx+k*(boxW+4)-boxW/2;
                    ctx2.shadowBlur=6; ctx2.shadowColor=bord;
                    ctx2.fillStyle=fill; ctx2.strokeStyle=bord; ctx2.lineWidth=1.5;
                    ctx2.fillRect(bx,bCy-boxH/2,boxW,boxH); ctx2.strokeRect(bx,bCy-boxH/2,boxW,boxH);
                    ctx2.shadowBlur=0;
                    if (k===0) drawArrow(bCx+k*(boxW+4),bCy,1,false);
                }
                ctx2.fillStyle=lc; ctx2.font='10px monospace'; ctx2.textAlign='left';
                ctx2.fillText('2p  2p  2p', bCx-boxW+2, bCy-boxH/2-5);
                return;
            }

            const bx=bCx-boxW/2;
            ctx2.shadowBlur=10; ctx2.shadowColor=bord;
            ctx2.fillStyle=fill; ctx2.strokeStyle=bord; ctx2.lineWidth=2;
            ctx2.fillRect(bx,bCy-boxH/2,boxW,boxH); ctx2.strokeRect(bx,bCy-boxH/2,boxW,boxH);
            ctx2.shadowBlur=0;

            if (lvl.e===2) drawArrow(bCx,bCy,2,true);
            else if (lvl.e===1) drawArrow(bCx,bCy,1,false);

            ctx2.fillStyle=lc; ctx2.font=`${isAb?'italic ':''}10px monospace`; ctx2.textAlign='left';
            if (lvl.side==='left')       ctx2.fillText(lvl.label, bx-28, bCy+4);
            else if (lvl.side==='right') ctx2.fillText(lvl.label, bx+boxW+4, bCy+4);
            else { ctx2.textAlign='right'; ctx2.fillText(lvl.label, bx-4, bCy+4); }
        });

        controlsContainer.querySelector('#moBondOrder').textContent = mol.bondOrder;
        controlsContainer.querySelector('#moMagnetic').textContent  = mol.magnetic;
        controlsContainer.querySelector('#moConfig').textContent    = mol.config;
    }

    function drawArrow(cx,cy,count,paired) {
        ctx2.strokeStyle=CLR.arrowCol; ctx2.lineWidth=1.8;
        if (count===2) {
            [-5,5].forEach((dx,i)=>{
                const up=i===0, y1=cy+(up?6:-6), y2=cy+(up?-6:6), dir=up?-1:1;
                ctx2.beginPath(); ctx2.moveTo(cx+dx,y1); ctx2.lineTo(cx+dx,y2); ctx2.stroke();
                ctx2.beginPath(); ctx2.moveTo(cx+dx-3,y2-dir*4); ctx2.lineTo(cx+dx,y2); ctx2.lineTo(cx+dx+3,y2-dir*4); ctx2.stroke();
            });
        } else {
            ctx2.beginPath(); ctx2.moveTo(cx,cy+6); ctx2.lineTo(cx,cy-6); ctx2.stroke();
            ctx2.beginPath(); ctx2.moveTo(cx-3,cy-2); ctx2.lineTo(cx,cy-6); ctx2.lineTo(cx+3,cy-2); ctx2.stroke();
        }
    }

    controlsContainer.querySelector('#moMolSelect').addEventListener('change', e=>{ currentMol=e.target.value; drawMO(currentMol); });
    drawMO(currentMol);

    const moResizeObs = new ResizeObserver(()=>drawMO(currentMol));
    moResizeObs.observe(moCanvas.parentElement);

    overlayEl.innerHTML += `<span class="sim-badge">\u269b\ufe0f MO Diagram</span><span class="sim-badge">\ud83d\udd17 Bond Order</span>`;
    return () => { moCanvas.remove(); moResizeObs.disconnect(); };
}

// =====================================================================
// HELPER: make a 2D canvas that covers the sim panel (hides THREE.js canvas)
// =====================================================================
function make2DCanvas(engine, id, bg) {
    const host = engine.renderer.domElement.parentElement;
    host.style.position = 'relative';
    let c = document.getElementById(id);
    if (c) c.remove(); // always fresh
    c = document.createElement('canvas');
    c.id = id;
    c.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;border-radius:12px;background:${bg || '#0d1117'};`;
    host.appendChild(c);
    return c;
}

// =====================================================================
// PHOTOELECTRIC EFFECT SIMULATOR — animated visual
// =====================================================================
function initPhotoelectricSim(engine, controlsContainer, overlayEl) {
    engine.setUpdate(() => {});
    const peCanvas = make2DCanvas(engine, 'peCanvas', '#0d1117');
    const ctx = peCanvas.getContext('2d');

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title">⚡ Photoelectric Effect</div>
            <div class="sim-stat-card" style="border-left:3px solid #f59e0b;">
                <div class="sim-stat-label">Current Phase</div>
                <div class="sim-stat-value" id="pePhaseLabel" style="font-size:0.8rem;color:#fbbf24;">—</div>
            </div>
            <div class="sim-stat-card" style="border-left:3px solid #22d3ee;margin-top:6px;">
                <div class="sim-stat-label">Key Concept</div>
                <div style="font-size:0.74rem;color:#94a3b8;margin-top:4px;line-height:1.5;" id="peConceptLabel">—</div>
            </div>
            <div style="margin-top:10px;font-size:0.75rem;color:#64748b;background:#1e293b;border-radius:6px;padding:8px;line-height:1.9;">
                <div>🔴 Phase 1 — Infrared (low freq): no ejection</div>
                <div>🟡 Phase 2 — Threshold: barely ejected</div>
                <div>🟢 Phase 3 — UV (high freq): fast electrons</div>
                <div>🔵 Phase 4 — UV + high intensity: more e⁻</div>
            </div>
            <div class="sim-stat-card" style="margin-top:6px;border-left:3px solid #a78bfa;">
                <div class="sim-stat-label">Photon Energy</div>
                <div class="sim-stat-value" id="peELabel">—</div>
            </div>
        </div>`;

    const phases = [
        { label:'Infrared — E < φ (no ejection)', concept:'Photon energy E=hf is below work function φ. No matter how many photons — zero electrons ejected.', color:'#f87171', waveLen:6, numPhotons:3, ejects:false, speed:0 },
        { label:'Threshold — E = φ (barely ejected)', concept:'Photon energy exactly matches work function. Electrons escape with KE ≈ 0.', color:'#fbbf24', waveLen:3.5, numPhotons:2, ejects:true, speed:0.6 },
        { label:'UV — E > φ (fast ejection)', concept:'Surplus energy (hf − φ) converts directly to kinetic energy of photoelectron.', color:'#4ade80', waveLen:2.0, numPhotons:2, ejects:true, speed:3.5 },
        { label:'High Intensity UV — more electrons', concept:'More photons hit per second → more electrons ejected, but SPEED depends only on frequency!', color:'#22d3ee', waveLen:2.0, numPhotons:6, ejects:true, speed:3.5 },
    ];

    const photons = [], electrons = [], sparks = [];
    let phaseIdx = 0, phaseTimer = 0, frameCount = 0;
    const PHASE_DUR = 280;

    function spawnPhoton(ph) {
        const W = peCanvas.width, H = peCanvas.height;
        photons.push({
            x: 5, y: H * 0.2 + Math.random() * H * 0.6,
            vx: 4 + Math.random() * 1.5, vy: (Math.random()-0.5)*0.6,
            color: ph.color, waveLen: ph.waveLen, hit: false, alive: true
        });
    }

    let animId = null;
    function draw() {
        animId = requestAnimationFrame(draw);
        const W = peCanvas.width = peCanvas.offsetWidth || 700;
        const H = peCanvas.height = peCanvas.offsetHeight || 500;
        ctx.fillStyle = '#08090f'; ctx.fillRect(0, 0, W, H);

        const ph = phases[phaseIdx];
        const surfX = Math.floor(W * 0.58);

        // === METAL SURFACE (realistic slab) ===
        const metalGrad = ctx.createLinearGradient(surfX, 0, surfX + 90, 0);
        metalGrad.addColorStop(0, '#7f8fa6'); metalGrad.addColorStop(0.3, '#4a5568');
        metalGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = metalGrad;
        ctx.fillRect(surfX, H * 0.08, 90, H * 0.84);
        // Shine stripe
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(surfX + 2, H * 0.08, 10, H * 0.84);
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
        ctx.strokeRect(surfX, H * 0.08, 90, H * 0.84);
        ctx.fillStyle = '#cbd5e1'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Metal', surfX + 45, H * 0.08 + 18);
        ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif';
        ctx.fillText('φ = work fn', surfX + 45, H * 0.08 + 32);

        // Free electron cloud on surface (animated dots)
        for (let i = 0; i < 12; i++) {
            const ey = H * 0.12 + (i / 12) * H * 0.76;
            const ex = surfX - 4 + Math.sin(frameCount * 0.04 + i) * 2;
            ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, Math.PI*2);
            ctx.fillStyle = `rgba(167,139,250,${0.4 + 0.3*Math.sin(frameCount*0.05+i)})`; ctx.fill();
        }

        // === PHOTON SOURCE (light source box) ===
        const srcGrad = ctx.createLinearGradient(10, 0, 80, 0);
        srcGrad.addColorStop(0, '#1e293b'); srcGrad.addColorStop(1, ph.color.replace('#','') ? ph.color : '#888');
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.roundRect(8, H/2 - 34, 60, 68, 8); ctx.fill();
        ctx.strokeStyle = ph.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(8, H/2 - 34, 60, 68, 8); ctx.stroke();
        ctx.fillStyle = ph.color; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('LIGHT', 38, H/2 - 12);
        ctx.fillText('SOURCE', 38, H/2 + 2);
        // Glow
        const glRad = ctx.createRadialGradient(68, H/2, 0, 68, H/2, 35);
        glRad.addColorStop(0, ph.color + '66'); glRad.addColorStop(1, 'transparent');
        ctx.fillStyle = glRad; ctx.beginPath(); ctx.arc(68, H/2, 35, 0, Math.PI*2); ctx.fill();

        // Spawn photons
        frameCount++;
        if (frameCount % Math.max(1, Math.round(18 / ph.numPhotons)) === 0) spawnPhoton(ph);

        // === DRAW & UPDATE PHOTONS ===
        for (let i = photons.length - 1; i >= 0; i--) {
            const p = photons[i];
            if (!p.alive) { photons.splice(i, 1); continue; }
            p.x += p.vx; p.y += p.vy;

            // Wave beam behind photon
            ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let w = 0; w < 32; w++) {
                const wx = p.x - w * 2.8;
                const wy = p.y + Math.sin((w + frameCount * 0.4) * (0.6/p.waveLen)) * (p.waveLen * 1.5);
                w === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
            }
            ctx.stroke();

            // Photon head glow
            const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
            pg.addColorStop(0, p.color + 'ff'); pg.addColorStop(1, p.color + '00');
            ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
            ctx.fillStyle = '#fff'; ctx.fill();

            // Frequency tag above photon
            ctx.fillStyle = p.color; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
            ctx.fillText(`λ=${p.waveLen.toFixed(1)}`, p.x - 10, p.y - 12);

            // HIT surface
            if (!p.hit && p.x >= surfX - 2) {
                p.hit = true; p.alive = false;
                // Spark at impact
                for (let s = 0; s < 8; s++) sparks.push({ x: surfX, y: p.y, vx: -Math.random()*2, vy: (Math.random()-0.5)*4, alpha:1, color: p.color });
                if (ph.ejects) {
                    // Eject electron
                    const spd = ph.speed;
                    electrons.push({ x: surfX - 5, y: p.y, vx: -(spd + Math.random()*1.5), vy: (Math.random()-0.5)*spd*0.6, alpha:1.0, trail:[] });
                }
            }
            if (p.x > W || p.y < 0 || p.y > H) p.alive = false;
        }

        // === IMPACT SPARKS ===
        for (let i = sparks.length - 1; i >= 0; i--) {
            const s = sparks[i];
            s.x += s.vx; s.y += s.vy; s.alpha -= 0.06;
            if (s.alpha <= 0) { sparks.splice(i, 1); continue; }
            ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI*2);
            ctx.fillStyle = s.color + Math.floor(s.alpha*255).toString(16).padStart(2,'0'); ctx.fill();
        }

        // === DRAW ELECTRONS with trail ===
        for (let i = electrons.length - 1; i >= 0; i--) {
            const e = electrons[i];
            e.trail.push({ x: e.x, y: e.y });
            if (e.trail.length > 18) e.trail.shift();
            e.x += e.vx; e.y += e.vy;
            e.vy *= 0.995; // tiny gravity
            e.alpha -= 0.008;
            if (e.alpha <= 0 || e.x < -20) { electrons.splice(i, 1); continue; }
            // Trail
            e.trail.forEach((pt, ti) => {
                ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.5 + (ti/e.trail.length)*2, 0, Math.PI*2);
                ctx.fillStyle = `rgba(167,139,250,${(ti/e.trail.length)*e.alpha*0.6})`; ctx.fill();
            });
            // Electron
            const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 7);
            eg.addColorStop(0, '#c4b5fd'); eg.addColorStop(1, '#7c3aed00');
            ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(e.x, e.y, 3.5, 0, Math.PI*2);
            ctx.fillStyle = '#a78bfa'; ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('e⁻', e.x, e.y + 3);
            // KE label
            if (ph.speed > 0) {
                const ke = (0.5 * 9.1e-31 * (ph.speed * 1e5)**2 / 1.6e-19).toFixed(2);
                ctx.fillStyle = '#4ade80'; ctx.font = '9px monospace';
                ctx.fillText(`KE=${ke}eV`, e.x - 10, e.y - 12);
            }
        }

        // No-ejection X indicator
        if (!ph.ejects) {
            ctx.fillStyle = 'rgba(239,68,68,0.08)';
            ctx.fillRect(surfX + 92, H * 0.08, W - surfX - 92, H * 0.84);
            ctx.fillStyle = '#f87171'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('✗ No electron ejected', W * 0.83, H * 0.46);
            ctx.font = '11px sans-serif'; ctx.fillStyle = '#f87171aa';
            ctx.fillText('E < φ', W * 0.83, H * 0.52);
        }

        // === ENERGY EQUATION DISPLAY ===
        const eqY = 22;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.roundRect(W/2 - 180, 6, 360, 30, 6); ctx.fill();
        ctx.textAlign = 'center'; ctx.font = 'bold 12px monospace';
        const eqColor = ph.ejects ? '#4ade80' : '#f87171';
        const eqText = ph.ejects ? `E = hf > φ   →   KE = hf − φ = ${(ph.speed**2 * 0.5).toFixed(1)} eV` : `E = hf < φ   →   No ejection`;
        ctx.fillStyle = eqColor; ctx.fillText(eqText, W/2, eqY);

        // Phase label on canvas
        ctx.fillStyle = ph.color + 'cc'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`Phase ${phaseIdx+1}: ${ph.label}`, 14, H - 38);

        // Progress bar
        const pct = phaseTimer / PHASE_DUR;
        ctx.fillStyle = '#1e293b'; ctx.fillRect(14, H - 26, W - 28, 6); ctx.beginPath(); ctx.roundRect(14, H-26, (W-28)*pct, 6, 3); ctx.fillStyle = ph.color; ctx.fill();

        // Sidebar update
        const pl = document.getElementById('pePhaseLabel'), cl = document.getElementById('peConceptLabel'), el = document.getElementById('peELabel');
        if (pl) { pl.textContent = ph.label; pl.style.color = ph.color; }
        if (cl) cl.textContent = ph.concept;
        if (el) { el.textContent = ph.ejects ? `hf > φ  →  KE = hf − φ` : `hf < φ  →  blocked`; el.style.color = ph.ejects ? '#4ade80' : '#f87171'; }

        phaseTimer++;
        if (phaseTimer >= PHASE_DUR) {
            phaseTimer = 0; phaseIdx = (phaseIdx + 1) % phases.length;
            photons.length = 0; electrons.length = 0; sparks.length = 0;
        }
    }
    draw();
    overlayEl.innerHTML += `<span class="sim-badge">⚡ Photoelectric</span><span class="sim-badge">E=hf</span>`;
    return () => { cancelAnimationFrame(animId); peCanvas.remove(); };
}

// =====================================================================
// ORBITAL OVERLAP SIMULATOR — animated shapes
// =====================================================================
function initOrbitalOverlapSim(engine, controlsContainer, overlayEl) {
    engine.setUpdate(() => {});
    const ooCanvas = make2DCanvas(engine, 'ooCanvas', '#0d1117');
    const ctx = ooCanvas.getContext('2d');

    const CASES = [
        { id:'ss_bond',  label:'s–s (in phase)',          type:'bonding',    typeLabel:'σ Bonding MO',     desc:'Both s orbitals in phase → constructive interference → bond forms (lower energy)',    bond:'σ' },
        { id:'sp_bond',  label:'s–p (in phase)',          type:'bonding',    typeLabel:'σ Bonding MO',     desc:'s orbital overlaps with a lobe of p in phase → σ bonding (head-on overlap)',           bond:'σ' },
        { id:'pp_sigma', label:'p–p end-on (in phase)',   type:'bonding',    typeLabel:'σ Bonding MO',     desc:'Two p orbitals end-on in phase → strongest σ overlap',                                bond:'σ' },
        { id:'pp_pi',    label:'p–p side-on (in phase)',  type:'bonding',    typeLabel:'π Bonding MO',     desc:'Two p orbitals side-on parallel same phase → π bonding MO',                           bond:'π' },
        { id:'ss_anti',  label:'s–s (out of phase)',      type:'antibonding', typeLabel:'σ* Antibonding',  desc:'Opposite phases → destructive interference → node between nuclei → antibonding',      bond:'σ*' },
        { id:'sp_anti',  label:'s–p (out of phase)',      type:'antibonding', typeLabel:'σ* Antibonding',  desc:'s and p out of phase → nodal plane forms between them → antibonding',                 bond:'σ*' },
        { id:'pp_pi_a',  label:'p–p side-on (anti)',      type:'antibonding', typeLabel:'π* Antibonding',  desc:'Side-on p orbitals opposite phases → nodal plane between lobes → π* antibonding',     bond:'π*' },
        { id:'sp_zero',  label:'s–p⊥ (zero overlap)',     type:'zero',        typeLabel:'Zero Overlap',    desc:'s orbital approaches p perpendicularly — + and − lobes cancel exactly → no MO formed', bond:'0' },
        { id:'pp_zero',  label:'p–p⊥ (zero overlap)',     type:'zero',        typeLabel:'Zero Overlap',    desc:'Orthogonal p orbitals — equal + and − contributions cancel → no net overlap',           bond:'0' },
    ];

    let caseIdx = 0, animT = 0, animId = null;

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title">🔵 Orbital Overlap</div>
            <select class="game-select" id="ooSel">${CASES.map((c,i)=>`<option value="${i}">${c.label}</option>`).join('')}</select>
            <div class="sim-stat-card" style="margin-top:8px;border-left:3px solid #22d3ee;">
                <div class="sim-stat-label">Result</div>
                <div class="sim-stat-value" id="ooType" style="font-size:0.82rem;"></div>
            </div>
            <div style="font-size:0.75rem;color:#94a3b8;margin-top:8px;line-height:1.6;" id="ooDesc"></div>
            <div style="margin-top:10px;font-size:0.73rem;color:#475569;background:#1e293b;border-radius:6px;padding:8px;line-height:1.9;">
                <span style="color:#e8c46e;">■</span> (+) phase &nbsp;
                <span style="color:#6ea8d5;">■</span> (−) phase &nbsp;
                <span style="color:#f87171;">═</span> nodal plane
            </div>
        </div>`;

    function updateSidebar(idx) {
        const c = CASES[idx];
        const tl = document.getElementById('ooType'), dl = document.getElementById('ooDesc');
        const col = c.type==='bonding'?'#4ade80':c.type==='antibonding'?'#f87171':'#94a3b8';
        if (tl) { tl.textContent = c.typeLabel; tl.style.color = col; }
        if (dl) dl.textContent = c.desc;
    }
    updateSidebar(0);
    document.getElementById('ooSel').addEventListener('change', e => { caseIdx = parseInt(e.target.value); animT = 0; updateSidebar(caseIdx); });

    // Draw helpers
    function drawS(cx, cy, R, phase, alpha=0.75) {
        const col = phase==='+' ? [232,196,110] : [110,168,213];
        const g = ctx.createRadialGradient(cx-R*0.25, cy-R*0.25, R*0.1, cx, cy, R);
        g.addColorStop(0, `rgba(255,255,255,${alpha*0.8})`);
        g.addColorStop(0.4, `rgba(${col},${alpha})`);
        g.addColorStop(1, `rgba(${col},${alpha*0.3})`);
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = phase==='+'?'#b8881a':'#3a6ea0'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = phase==='+'?'#fde68a':'#bfdbfe'; ctx.font = `bold ${Math.max(11,R*0.45)}px serif`; ctx.textAlign = 'center';
        ctx.fillText(phase, cx, cy + R*0.15);
    }
    function lobe(cx, cy, rx, ry, phase, alpha=0.75) {
        const col = phase==='+' ? [232,196,110] : [110,168,213];
        const g = ctx.createRadialGradient(cx - rx*0.2, cy - ry*0.2, rx*0.05, cx, cy, Math.max(rx,ry));
        g.addColorStop(0, `rgba(255,255,255,${alpha*0.7})`);
        g.addColorStop(0.4, `rgba(${col},${alpha})`);
        g.addColorStop(1, `rgba(${col},${alpha*0.2})`);
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = phase==='+'?'#b8881a':'#3a6ea0'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = phase==='+'?'#fde68a':'#bfdbfe'; ctx.font = `bold ${Math.max(10, Math.min(rx,ry)*0.5)}px serif`; ctx.textAlign = 'center';
        ctx.fillText(phase, cx, cy + Math.min(rx,ry)*0.2);
    }
    function nucleus(cx, cy) {
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2);
        ctx.fillStyle = '#e2e8f0'; ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    function nodePlane(x1,y1,x2,y2) {
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5; ctx.setLineDash([6,4]);
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        ctx.setLineDash([]);
    }
    function label(x, y, text, color='#e2e8f0', size=12) {
        ctx.fillStyle = color; ctx.font = `bold ${size}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(text, x, y);
    }

    function renderCase(id, W, H, t) {
        ctx.fillStyle = '#0d1117'; ctx.fillRect(0,0,W,H);
        const cx = W/2, cy = H/2;
        const R = Math.min(W,H) * 0.11;
        // Breathe animation — orbitals gently pulse toward/away
        const breathe = 0.94 + 0.06 * Math.sin(t * 0.03);
        const gap = R * 0.85 * breathe;

        const c = CASES.find(x=>x.id===id);
        const typeColor = c.type==='bonding'?'#4ade80':c.type==='antibonding'?'#f87171':'#94a3b8';
        label(cx, 28, c.typeLabel, typeColor, 14);

        if (id==='ss_bond') {
            drawS(cx - gap, cy, R, '+'); drawS(cx + gap, cy, R, '+');
            nucleus(cx - gap, cy); nucleus(cx + gap, cy);
            if (gap < R * 1.2) label(cx, cy, '⊕', '#166534', 18);
        }
        else if (id==='sp_bond') {
            drawS(cx - gap - R*0.5, cy, R*0.9, '+');
            nucleus(cx - gap - R*0.5, cy);
            lobe(cx + gap + R*0.8, cy, R*1.3, R*0.7, '+');
            lobe(cx + gap + R*0.8 + R*2.6, cy, R*1.1, R*0.65, '-');
            nucleus(cx + gap + R*0.8 + R*1.3, cy);
        }
        else if (id==='pp_sigma') {
            lobe(cx - gap - R, cy, R*1.3, R*0.7, '+');
            lobe(cx - gap - R - R*2.6, cy, R*1.1, R*0.65, '-');
            nucleus(cx - gap - R - R*1.3 + R*2.6, cy);
            lobe(cx + gap + R, cy, R*1.3, R*0.7, '+');
            lobe(cx + gap + R + R*2.6, cy, R*1.1, R*0.65, '-');
            nucleus(cx + gap + R - R*0.1, cy);
        }
        else if (id==='pp_pi') {
            const vGap = R * 1.4 * breathe;
            lobe(cx - R*0.6, cy - vGap - R*0.5, R*0.6, R*1.1, '+');
            lobe(cx - R*0.6, cy - vGap + R*1.1, R*0.6, R*0.9, '-');
            nucleus(cx - R*0.6, cy - vGap + R*0.1);
            lobe(cx + R*0.6, cy + vGap - R*0.5, R*0.6, R*1.1, '+');
            lobe(cx + R*0.6, cy + vGap + R*1.1, R*0.6, R*0.9, '-');
            nucleus(cx + R*0.6, cy + vGap + R*0.1);
            label(cx, cy, '// π', '#166534', 13);
        }
        else if (id==='ss_anti') {
            drawS(cx - gap, cy, R, '+'); drawS(cx + gap, cy, R, '-');
            nucleus(cx - gap, cy); nucleus(cx + gap, cy);
            nodePlane(cx, cy - R*1.8, cx, cy + R*1.8);
            label(cx, cy + R*2.1, 'Node', '#ef4444', 11);
        }
        else if (id==='sp_anti') {
            drawS(cx - gap - R*0.5, cy, R*0.9, '+');
            nucleus(cx - gap - R*0.5, cy);
            lobe(cx + gap + R*0.8, cy, R*1.3, R*0.7, '-');
            lobe(cx + gap + R*0.8 + R*2.6, cy, R*1.1, R*0.65, '+');
            nucleus(cx + gap + R*0.8 + R*1.3, cy);
            nodePlane(cx + gap - R*0.3, cy - R*1.8, cx + gap - R*0.3, cy + R*1.8);
        }
        else if (id==='pp_pi_a') {
            const vGap = R * 1.4 * breathe;
            lobe(cx - R*0.6, cy - vGap - R*0.5, R*0.6, R*1.1, '+');
            lobe(cx - R*0.6, cy - vGap + R*1.1, R*0.6, R*0.9, '-');
            nucleus(cx - R*0.6, cy - vGap + R*0.1);
            lobe(cx + R*0.6, cy + vGap - R*0.5, R*0.6, R*1.1, '-');
            lobe(cx + R*0.6, cy + vGap + R*1.1, R*0.6, R*0.9, '+');
            nucleus(cx + R*0.6, cy + vGap + R*0.1);
            nodePlane(cx - R*2, cy, cx + R*2, cy);
            label(cx, cy + 14, 'π* node', '#ef4444', 11);
        }
        else if (id==='sp_zero') {
            drawS(cx - gap*1.2, cy, R*0.9, '+');
            nucleus(cx - gap*1.2, cy);
            // p orbital rotated 90° — vertical
            lobe(cx + R*0.5, cy - R*1.2, R*0.65, R*1.1, '+');
            lobe(cx + R*0.5, cy + R*1.2, R*0.65, R*1.1, '-');
            nucleus(cx + R*0.5, cy);
            // cancel arrows
            ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('+ and − cancel → 0', cx + R, cy + R*2.6);
        }
        else if (id==='pp_zero') {
            // horizontal p on left
            lobe(cx - gap - R, cy, R*1.3, R*0.7, '+');
            lobe(cx - gap - R - R*2.6, cy, R*1.1, R*0.65, '-');
            nucleus(cx - gap - R - R*1.3 + R*2.6, cy);
            // vertical p on right
            lobe(cx + R*0.5, cy - R*1.2, R*0.65, R*1.1, '+');
            lobe(cx + R*0.5, cy + R*1.2, R*0.65, R*1.1, '-');
            nucleus(cx + R*0.5, cy);
            ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('Orthogonal → net overlap = 0', cx, cy + R*2.8);
        }

        // Bond type badge
        const bdCol = c.type==='bonding'?'#0f2a1a':c.type==='antibonding'?'#2a0808':'#1e293b';
        const bdBdr = c.type==='bonding'?'#10b981':c.type==='antibonding'?'#ef4444':'#94a3b8';
        ctx.fillStyle = bdCol;
        ctx.beginPath(); ctx.roundRect(W - 80, H-38, 72, 26, 6); ctx.fill();
        ctx.strokeStyle = bdBdr; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = bdBdr; ctx.font = 'bold 13px serif'; ctx.textAlign = 'center';
        ctx.fillText(c.bond, W - 44, H - 20);
    }

    function animate() {
        animId = requestAnimationFrame(animate);
        const W = ooCanvas.width = ooCanvas.offsetWidth || 600;
        const H = ooCanvas.height = ooCanvas.offsetHeight || 500;
        animT++;
        renderCase(CASES[caseIdx].id, W, H, animT);
    }
    animate();
    overlayEl.innerHTML += `<span class="sim-badge">🔵 Orbital Overlap</span><span class="sim-badge">σ/π bonds</span>`;
    return () => { cancelAnimationFrame(animId); ooCanvas.remove(); };
}

// =====================================================================
// REDOX BALANCING SIMULATOR — step-by-step visual
// =====================================================================
function initRedoxSim(engine, controlsContainer, overlayEl) {
    engine.setUpdate(() => {});
    const rxCanvas = make2DCanvas(engine, 'rxCanvas', '#0d1117');
    const ctx = rxCanvas.getContext('2d');

    // ─── Palette ─────────────────────────────────────────────────────────────
    const P = {
        mn:  { f:'#2d0045', b:'#e879f9', t:'#f0abfc' },
        fe:  { f:'#431407', b:'#f97316', t:'#fed7aa' },
        cr:  { f:'#1a2800', b:'#a3e635', t:'#d9f99d' },
        h2o: { f:'#082030', b:'#38bdf8', t:'#bae6fd' },
        Hp:  { f:'#052e16', b:'#34d399', t:'#a7f3d0' },
        elec:{ f:'#1e1b4b', b:'#818cf8', t:'#c7d2fe' },
        neu: { f:'#1e293b', b:'#475569', t:'#94a3b8' },
        zn:  { f:'#172554', b:'#60a5fa', t:'#bfdbfe' },
        i:   { f:'#2d1657', b:'#c084fc', t:'#e9d5ff' },
        co2: { f:'#1c1917', b:'#fb923c', t:'#fed7aa' },
        new_hi:{ f:'#1c1400', b:'#fbbf24', t:'#fde68a' }, // incoming species
    };

    // ─── Formula renderer ─────────────────────────────────────────────────────
    // spec = [ {txt, mode:'n'|'sub'|'sup'}, ... ]
    function formulaWidth(spec, baseSize) {
        let w = 0;
        spec.forEach(s => {
            ctx.font = (s.mode==='n' ? `bold ${baseSize}px` : `bold ${Math.round(baseSize*0.65)}px`) + ' monospace';
            w += ctx.measureText(s.txt).width + (s.mode==='n' ? 0.5 : 0);
        });
        return w;
    }
    function drawFormula(spec, cx, cy, baseSize, col, alpha) {
        const tw = formulaWidth(spec, baseSize);
        let xp = cx - tw / 2;
        ctx.globalAlpha = alpha;
        spec.forEach(s => {
            const sz   = s.mode==='n' ? baseSize : Math.round(baseSize * 0.65);
            const yOff = s.mode==='sub' ? baseSize*0.35 : s.mode==='sup' ? -baseSize*0.45 : 0;
            ctx.font   = `bold ${sz}px monospace`;
            ctx.fillStyle = col;
            ctx.textAlign = 'left';
            ctx.fillText(s.txt, xp, cy + yOff);
            xp += ctx.measureText(s.txt).width + (s.mode==='n' ? 0.5 : 0);
        });
        ctx.globalAlpha = 1;
    }
    function parseFormula(raw) {
        // raw like 'MnO4', 'Fe2+', '5Fe', 'H2O', 'e-'
        const tokens = [];
        let i = 0;
        while (i < raw.length) {
            const ch = raw[i];
            if (ch >= '1' && ch <= '9' && tokens.length === 0) {
                let num = '';
                while (i < raw.length && raw[i] >= '0' && raw[i] <= '9') num += raw[i++];
                tokens.push({txt: num, mode:'n'});
            } else if (ch >= 'A' && ch <= 'Z') {
                let sym = ch; i++;
                while (i < raw.length && raw[i] >= 'a' && raw[i] <= 'z') sym += raw[i++];
                tokens.push({txt: sym, mode:'n'});
            } else if (ch >= '0' && ch <= '9') {
                let num = '';
                while (i < raw.length && raw[i] >= '0' && raw[i] <= '9') num += raw[i++];
                tokens.push({txt: num, mode:'sub'});
            } else if (ch === '^') {
                i++;
                let sup = '';
                while (i < raw.length && raw[i] !== ' ') sup += raw[i++];
                tokens.push({txt: sup, mode:'sup'});
            } else if (ch === '+' || ch === '-') {
                tokens.push({txt: ch, mode:'sup'}); i++;
            } else { i++; }
        }
        return tokens;
    }

    // ─── Species chip ─────────────────────────────────────────────────────────
    // sp = { raw:'MnO4', sup:'-', ck:'mn', coeff:1, x,y, alpha, scale, glow }
    function chipW(sp, fs) {
        const spec = parseFormula((sp.coeff>1?sp.coeff.toString():'')+sp.raw+(sp.sup||''));
        return formulaWidth(spec, fs) + 28;
    }
    function drawChip(sp, fs, glow) {
        const spec = parseFormula((sp.coeff>1?sp.coeff.toString():'')+sp.raw+(sp.sup||''));
        const pal  = P[sp.ck] || P.neu;
        const w    = formulaWidth(spec, fs) + 28;
        const h    = fs * 2;
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.scale(sp.scale||1, sp.scale||1);
        if (glow || sp.glow) {
            ctx.shadowBlur  = 18;
            ctx.shadowColor = pal.b;
        }
        ctx.globalAlpha = sp.alpha || 1;
        ctx.fillStyle   = pal.f;
        ctx.strokeStyle = pal.b;
        ctx.lineWidth   = 2.2;
        ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 9);
        ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        drawFormula(spec, 0, fs*0.18, fs, pal.t, sp.alpha || 1);
        ctx.restore();
    }

    // ─── Particle system ─────────────────────────────────────────────────────
    let particles = [];
    function spawnElectrons(n, fromX, fromY, toX, toY) {
        for (let i=0; i<n; i++) {
            const delay = i * 8;
            particles.push({ type:'elec', delay, t:0, x:fromX, y:fromY, tx:toX, ty:toY,
                             alpha:0, trail:[] });
        }
    }
    function spawnAtomPop(x, y, text, color) {
        particles.push({ type:'pop', t:0, x, y, text, color, alpha:1, vy:-1.5 });
    }
    function updateParticles() {
        particles = particles.filter(p => p.alpha > 0);
        particles.forEach(p => {
            if (p.type === 'elec') {
                if (p.delay > 0) { p.delay--; return; }
                p.t++;
                const prog = Math.min(p.t / 55, 1);
                const ease = prog < 0.5 ? 2*prog*prog : -1+(4-2*prog)*prog;
                p.x = p.x + (p.tx - p.x) * 0.065;
                p.y = p.y + (p.ty - p.y) * 0.065 - Math.sin(prog*Math.PI)*35;
                p.alpha = prog < 0.85 ? 1 : 1 - (prog-0.85)/0.15;
                p.trail.push({x:p.x, y:p.y});
                if (p.trail.length > 8) p.trail.shift();
            } else if (p.type === 'pop') {
                p.t++; p.y += p.vy; p.vy *= 0.95;
                p.alpha = Math.max(0, 1 - p.t/55);
            }
        });
    }
    function drawParticles() {
        particles.forEach(p => {
            if (p.type === 'elec') {
                if (p.delay > 0) return;
                // trail
                p.trail.forEach((pt, i) => {
                    ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI*2);
                    ctx.fillStyle = `rgba(129,140,248,${p.alpha*(i/p.trail.length)*0.4})`; ctx.fill();
                });
                ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2);
                ctx.shadowBlur=12; ctx.shadowColor='#818cf8';
                ctx.fillStyle=`rgba(129,140,248,${p.alpha})`; ctx.fill();
                ctx.shadowBlur=0;
                ctx.fillStyle=`rgba(199,210,254,${p.alpha})`; ctx.font='bold 8px monospace';
                ctx.textAlign='center'; ctx.fillText('e\u207b', p.x, p.y-8);
            } else if (p.type === 'pop') {
                ctx.fillStyle = p.color.replace(')', `,${p.alpha})`).replace('rgb(','rgba(');
                ctx.font = 'bold 13px sans-serif'; ctx.textAlign='center';
                ctx.globalAlpha = p.alpha;
                ctx.fillText(p.text, p.x, p.y);
                ctx.globalAlpha = 1;
            }
        });
    }

    // ─── Atom counter visual ──────────────────────────────────────────────────
    function drawAtomCount(cx, y, W, H, elem, lhsN, rhsN, t, pal) {
        const eq = lhsN === rhsN;
        const boxW = Math.min(W*0.38, 220);
        const lx = cx - boxW - 28, rx = cx + 28;

        // element badge
        ctx.fillStyle = (pal||P.neu).f; ctx.strokeStyle = (pal||P.neu).b; ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(cx-22, y, 44, 34, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=(pal||P.neu).t; ctx.font='bold 14px monospace'; ctx.textAlign='center';
        ctx.fillText(elem, cx, y+23);

        // lhs count
        ctx.fillStyle='#1e293b'; ctx.strokeStyle='#334155'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(lx, y, boxW, 34, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#94a3b8'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('LHS', lx+boxW/2, y+12);
        ctx.fillStyle=eq?'#4ade80':'#f87171'; ctx.font='bold 18px monospace';
        ctx.fillText(lhsN, lx+boxW/2, y+30);

        // rhs count
        ctx.fillStyle='#1e293b'; ctx.strokeStyle='#334155'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(rx, y, boxW, 34, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#94a3b8'; ctx.font='11px sans-serif'; ctx.textAlign='center';
        ctx.fillText('RHS', rx+boxW/2, y+12);
        ctx.fillStyle=eq?'#4ade80':'#f87171'; ctx.font='bold 18px monospace';
        ctx.fillText(rhsN, rx+boxW/2, y+30);

        // equality
        const sym = eq ? '\u2713 Balanced!' : '\u2717 Imbalanced!';
        ctx.fillStyle = eq ? '#4ade80' : '#f87171';
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign='center';
        ctx.fillText(sym, cx, y+55);
        if (!eq) {
            const diff = Math.abs(rhsN - lhsN);
            ctx.fillStyle='#fbbf24'; ctx.font='11px sans-serif';
            ctx.fillText(`Need ${diff} more on ${ lhsN < rhsN ? 'LHS' : 'RHS' }`, cx, y+72);
        }
    }

    // ─── Charge bar ───────────────────────────────────────────────────────────
    function drawChargeBar(cx, y, lhsQ, rhsQ) {
        ctx.fillStyle='#0f172a'; ctx.strokeStyle='#1e3a5f'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(cx-220, y, 440, 52, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#64748b'; ctx.font='10px monospace'; ctx.textAlign='center';
        ctx.fillText('CHARGE BALANCE', cx, y+13);

        const lStr = `LHS: ${lhsQ>=0?'+':''}${lhsQ}`;
        const rStr = `RHS: ${rhsQ>=0?'+':''}${rhsQ}`;
        const eq   = lhsQ === rhsQ;

        ctx.fillStyle = eq ? '#4ade80' : '#f87171';
        ctx.font='bold 15px monospace'; ctx.textAlign='center';
        ctx.fillText(lStr, cx-100, y+36);
        ctx.fillStyle='#475569'; ctx.font='18px monospace';
        ctx.fillText('vs', cx, y+36);
        ctx.fillStyle = eq ? '#4ade80' : '#f87171';
        ctx.font='bold 15px monospace';
        ctx.fillText(rStr, cx+100, y+36);

        if (!eq) {
            const diff = Math.abs(rhsQ - lhsQ);
            ctx.fillStyle='#fbbf24'; ctx.font='11px sans-serif'; ctx.textAlign='center';
            ctx.fillText(`\u2192 Add ${diff}e\u207b to ${ lhsQ > rhsQ ? 'LHS' : 'RHS' }`, cx, y+68);
        }
    }

    // ─── Narration typewriter ─────────────────────────────────────────────────
    let _lastNarr = '', _typeIdx = 0;
    function drawNarration(text, t, W) {
        if (text !== _lastNarr) { _lastNarr = text; _typeIdx = 0; }
        _typeIdx = Math.min(text.length, _typeIdx + Math.ceil(text.length / 42));
        const shown = text.substring(0, _typeIdx);
        ctx.fillStyle='#0d1f30'; ctx.strokeStyle='#1e3f5f'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(12, 8, W-24, 58, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#60a5fa'; ctx.font='bold 9px monospace'; ctx.textAlign='left';
        ctx.fillText('\u25b6 NARRATOR', 24, 24);
        ctx.fillStyle='#e2e8f0'; ctx.font='12.5px sans-serif';
        // word wrap at 80 chars per line
        const words = shown.split(' ');
        let line='', lines=[], maxW = W-52;
        words.forEach(w => {
            const test = line ? line+' '+w : w;
            if (ctx.measureText(test).width > maxW && line) { lines.push(line); line=w; }
            else line = test;
        });
        if (line) lines.push(line);
        lines.slice(0,3).forEach((l,i) => ctx.fillText(l, 24, 38+i*16));
    }

    // ─── Equation row renderer ────────────────────────────────────────────────
    // items = [ {raw, sup, ck, coeff, x, y, alpha, scale, glow}, ... ]
    // returns list with computed x positions
    function layoutEqRow(items, cx, y, fs, W) {
        // compute total width
        let total = 0;
        items.forEach((sp,i) => { total += chipW(sp, fs) + (i>0?38:0); });
        let xp = cx - total/2;
        return items.map((sp,i) => {
            const w = chipW(sp, fs);
            if (i>0) xp += 38;
            const out = Object.assign({}, sp, { x: xp + w/2, y });
            xp += w;
            return out;
        });
    }

    // "+" operator
    function drawPlus(x, y, alpha) {
        ctx.globalAlpha = alpha||1;
        ctx.fillStyle='#475569'; ctx.font=`bold 22px sans-serif`; ctx.textAlign='center';
        ctx.fillText('+', x, y+7); ctx.globalAlpha=1;
    }
    // Arrow
    function drawArrow(x, y, W, alpha) {
        ctx.globalAlpha = alpha||1;
        ctx.strokeStyle='#22d3ee'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(x-32, y); ctx.lineTo(x+32, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+20, y-8); ctx.lineTo(x+32, y); ctx.lineTo(x+20, y+8); ctx.stroke();
        ctx.globalAlpha=1;
    }

    // Full equation draw helper
    // eq = { lhs:[sp,...], rhs:[sp,...] }
    function drawEquation(eq, cy, W, FS, tOff) {
        // compute lhs block & rhs block, center arrow at W/2
        const lhsLaid = layoutEqRow(eq.lhs, W*0.27, cy, FS, W);
        const rhsLaid = layoutEqRow(eq.rhs, W*0.73, cy, FS, W);
        drawArrow(W*0.5, cy, W, 1);

        // draw "+" between species
        let prevEnd = null;
        lhsLaid.forEach((sp, i) => {
            if (i>0) drawPlus(sp.x - chipW(sp,FS)/2 - 16, cy, sp.alpha||1);
            drawChip({...sp, x: sp.x + (sp._dx||0)}, FS, sp.glow);
        });
        rhsLaid.forEach((sp, i) => {
            if (i>0) drawPlus(sp.x - chipW(sp,FS)/2 - 16, cy, sp.alpha||1);
            drawChip({...sp, x: sp.x + (sp._dx||0)}, FS, sp.glow);
        });
    }

    // ─── Slides for MnO4 + Fe -> Mn + Fe (acidic) ────────────────────────────
    const MN = (c,ck,r,s) => ({coeff:c||1, raw:r, sup:s||'', ck:ck||'mn'});
    const FE = (c) => ({coeff:c||1, raw:'Fe', sup:'2+', ck:'fe'});
    const FE3= (c) => ({coeff:c||1, raw:'Fe', sup:'3+', ck:'fe'});
    const MNO4 = () => ({coeff:1, raw:'MnO4', sup:'\u2212', ck:'mn'});
    const MN2  = () => ({coeff:1, raw:'Mn',   sup:'2+',  ck:'mn'});
    const H2O  = (c) => ({coeff:c||1, raw:'H2O', sup:'', ck:'h2o'});
    const HP   = (c) => ({coeff:c||1, raw:'H',   sup:'+', ck:'Hp'});
    const ELEC = (c) => ({coeff:c||1, raw:'e',   sup:'\u2212', ck:'elec'});

    const REACTIONS = [
      {
        label: 'MnO\u2084\u207b + Fe\u00b2\u207a \u2192 Mn\u00b2\u207a + Fe\u00b3\u207a',
        shortLabel: 'Permanganate\u002BIron',
        slides: [
          { narr: 'Welcome! Today we are balancing a classic redox reaction in acidic medium. Here is the unbalanced equation. Our job is to make atoms AND charge equal on both sides.',
            eq: { lhs:[MNO4(), FE(1)], rhs:[MN2(), FE3(1)] },
            sub: null },

          { narr: 'Step 1 \u2014 Find what is being oxidised and reduced. Look at Manganese: Mn goes from +7 in MnO\u2084\u207b to +2. It GAINS 5 electrons \u2014 this is REDUCTION. Iron goes from +2 to +3 \u2014 it LOSES 1 electron. That is OXIDATION.',
            eq: { lhs:[{...MNO4(),glow:true}, FE(1)], rhs:[{...MN2(),glow:true}, FE3(1)] },
            oxStates: [ {sp:'Mn', from:'+7', to:'+2', type:'red'}, {sp:'Fe', from:'+2', to:'+3', type:'ox'} ],
            sub: null },

          { narr: 'Step 2 \u2014 Write the OXIDATION half-reaction first. Iron loses 1 electron. We split the overall reaction into two half-reactions so we can balance each separately.',
            halfTitle: 'Oxidation Half-Reaction',
            eq: { lhs:[FE(1)], rhs:[FE3(1), ELEC(1)] },
            sub: null },

          { narr: 'Step 3 \u2014 Now the REDUCTION half-reaction. Manganese starts as MnO\u2084\u207b and becomes Mn\u00b2\u207a. Count the oxygen atoms \u2014 there are 4 on the left and 0 on the right. IMBALANCED!',
            halfTitle: 'Reduction Half-Reaction \u2014 Balance atoms first',
            eq: { lhs:[MNO4()], rhs:[MN2()] },
            atomCount: { elem:'O', pal:'h2o', lhsN:4, rhsN:0 },
            sub: null },

          { narr: 'To balance 4 oxygen atoms, we add 4 H\u2082O molecules to the RIGHT side. Watch them fly in! Oxygen is now balanced: 4 on each side.',
            halfTitle: 'Add 4H\u2082O to balance oxygen \u2192',
            eq: { lhs:[MNO4()], rhs:[MN2(), {...H2O(4), glow:true, enterFrom:'right'}] },
            atomCount: { elem:'O', pal:'h2o', lhsN:4, rhsN:4 },
            sub: null },

          { narr: 'Now count Hydrogen. We added 4 H\u2082O, which gives us 8 H on the right. But the left has ZERO hydrogen. That is 8 hydrogen atoms out of nowhere \u2014 IMBALANCED!',
            halfTitle: 'Count hydrogen after adding H\u2082O',
            eq: { lhs:[MNO4()], rhs:[MN2(), H2O(4)] },
            atomCount: { elem:'H', pal:'Hp', lhsN:0, rhsN:8 },
            sub: null },

          { narr: 'Add 8 H\u207a ions to the LEFT to balance hydrogen. In acidic medium we use H\u207a. Watch them fly in from the left side! Hydrogen is now balanced.',
            halfTitle: '\u2190 Add 8H\u207a to balance hydrogen',
            eq: { lhs:[MNO4(), {...HP(8), glow:true, enterFrom:'left'}], rhs:[MN2(), H2O(4)] },
            atomCount: { elem:'H', pal:'Hp', lhsN:8, rhsN:8 },
            sub: null },

          { narr: 'All atoms are balanced! Now check the CHARGE. Left side: MnO\u2084\u207b is \u22121, and 8H\u207a is +8. Total LEFT charge = +7. Right side: Mn\u00b2\u207a is +2, water has 0 charge. Total RIGHT charge = +2.',
            halfTitle: 'Check charge balance',
            eq: { lhs:[MNO4(), HP(8)], rhs:[MN2(), H2O(4)] },
            chargeBar: { lhs:7, rhs:2 },
            sub: null },

          { narr: 'The left is +7 and right is +2. Difference = 5. We add 5 electrons to the LEFT to balance the charge. Watch the electrons fly across!',
            halfTitle: 'Add 5e\u207b to LEFT to balance charge',
            eq: { lhs:[MNO4(), HP(8), {...ELEC(5), glow:true, enterFrom:'left'}], rhs:[MN2(), H2O(4)] },
            chargeBar: { lhs:2, rhs:2 },
            spawnElec: true,
            sub: null },

          { narr: 'The Reduction half-reaction is now FULLY BALANCED. Both atoms AND charge are equal. MnO\u2084\u207b + 8H\u207a + 5e\u207b \u2192 Mn\u00b2\u207a + 4H\u2082O. Beautiful!',
            halfTitle: '\u2705 Reduction half-reaction BALANCED',
            eq: { lhs:[MNO4(), HP(8), ELEC(5)], rhs:[MN2(), H2O(4)] },
            celebrate: false,
            sub: null },

          { narr: 'Now combine both half-reactions. The oxidation had 1e\u207b, but reduction needs 5e\u207b. So we multiply the oxidation half-reaction by 5 to match electrons!',
            halfTitle: 'Scale oxidation \u00d75 to match electron count',
            eq: null,
            bothHalves: {
              ox: { lhs:[FE(5)],  rhs:[FE3(5), ELEC(5)], label:'Oxidation \u00d75:' },
              red:{ lhs:[MNO4(), HP(8), ELEC(5)], rhs:[MN2(), H2O(4)], label:'Reduction \u00d71:' }
            },
            sub: null },

          { narr: 'Add both half-reactions together and the 5 electrons cancel out from both sides. This gives us the final balanced equation!',
            halfTitle: 'Cancel electrons \u2014 Add half-reactions',
            eq: null,
            bothHalves: {
              ox: { lhs:[FE(5)],  rhs:[FE3(5)], label:'Oxidation:' },
              red:{ lhs:[MNO4(), HP(8)], rhs:[MN2(), H2O(4)], label:'Reduction:' },
              cancelNote: '5e\u207b cancel on both sides!'
            },
            sub: null },

          { narr: '\u2705 FINAL BALANCED EQUATION: MnO\u2084\u207b + 5Fe\u00b2\u207a + 8H\u207a \u2192 Mn\u00b2\u207a + 5Fe\u00b3\u207a + 4H\u2082O. Check: Mn\u2713 Fe\u2713 O\u2713 H\u2713 Charge\u2713. Perfectly balanced, as all things should be!',
            halfTitle: '\u2728 BALANCED EQUATION \u2728',
            eq: { lhs:[MNO4(), FE(5), HP(8)], rhs:[MN2(), FE3(5), H2O(4)] },
            celebrate: true,
            sub: null },
        ]
      },

      {
        label: 'Cr\u2082O\u2087\u00b2\u207b + I\u207b \u2192 Cr\u00b3\u207a + I\u2082',
        shortLabel: 'Dichromate+Iodide',
        slides: [
          { narr: 'Dichromate + Iodide redox in acidic medium. Cr\u2082O\u2087\u00b2\u207b is a powerful oxidising agent. Iodide I\u207b gets oxidised to I\u2082 gas.',
            eq: { lhs:[{coeff:1,raw:'Cr2O7',sup:'\u00b2\u207b',ck:'cr'}, {coeff:1,raw:'I',sup:'\u207b',ck:'i'}],
                  rhs:[{coeff:1,raw:'Cr',sup:'\u00b3\u207a',ck:'cr'}, {coeff:1,raw:'I2',sup:'',ck:'i'}] },
            sub: null },
          { narr: 'Oxidation states: Cr drops from +6 \u2192 +3 (REDUCTION, gains 3e\u207b per Cr, 6e\u207b total for Cr\u2082). Iodine goes from \u22121 \u2192 0 in I\u2082 (OXIDATION, loses 1e\u207b per I).',
            eq: { lhs:[{coeff:1,raw:'Cr2O7',sup:'\u00b2\u207b',ck:'cr',glow:true}, {coeff:1,raw:'I',sup:'\u207b',ck:'i'}],
                  rhs:[{coeff:1,raw:'Cr',sup:'\u00b3\u207a',ck:'cr'}, {coeff:1,raw:'I2',sup:'',ck:'i',glow:true}] },
            oxStates:[{sp:'Cr',from:'+6',to:'+3',type:'red'},{sp:'I',from:'\u22121',to:'0',type:'ox'}],
            sub: null },
          { narr: 'Oxidation: 2I\u207b \u2192 I\u2082 + 2e\u207b. The two iodide ions combine and release 2 electrons each time.',
            halfTitle: 'Oxidation: 2I\u207b \u2192 I\u2082 + 2e\u207b',
            eq: { lhs:[{coeff:2,raw:'I',sup:'\u207b',ck:'i'}], rhs:[{coeff:1,raw:'I2',sup:'',ck:'i'}, ELEC(2)] },
            sub: null },
          { narr: 'Reduction: Cr\u2082O\u2087\u00b2\u207b \u2192 2Cr\u00b3\u207a. Balance O with 7H\u2082O on right, then balance H with 14H\u207a on left, then add 6e\u207b. Full half-reaction: Cr\u2082O\u2087\u00b2\u207b + 14H\u207a + 6e\u207b \u2192 2Cr\u00b3\u207a + 7H\u2082O.',
            halfTitle: 'Reduction (fully balanced)',
            eq: { lhs:[{coeff:1,raw:'Cr2O7',sup:'\u00b2\u207b',ck:'cr'},{coeff:14,raw:'H',sup:'+',ck:'Hp'},ELEC(6)],
                  rhs:[{coeff:2,raw:'Cr',sup:'\u00b3\u207a',ck:'cr'},{coeff:7,raw:'H2O',sup:'',ck:'h2o'}] },
            sub: null },
          { narr: 'Scale oxidation \u00d73 so electrons match: 3\u00d7(2e\u207b)=6e\u207b = 6e\u207b from reduction. Then cancel electrons and add both half-reactions.',
            halfTitle: '\u2705 BALANCED: Cr\u2082O\u2087\u00b2\u207b + 6I\u207b + 14H\u207a \u2192 2Cr\u00b3\u207a + 3I\u2082 + 7H\u2082O',
            eq: { lhs:[{coeff:1,raw:'Cr2O7',sup:'\u00b2\u207b',ck:'cr'},{coeff:6,raw:'I',sup:'\u207b',ck:'i'},{coeff:14,raw:'H',sup:'+',ck:'Hp'}],
                  rhs:[{coeff:2,raw:'Cr',sup:'\u00b3\u207a',ck:'cr'},{coeff:3,raw:'I2',sup:'',ck:'i'},{coeff:7,raw:'H2O',sup:'',ck:'h2o'}] },
            celebrate: true,
            sub: null },
        ]
      },

      {
        label: 'Zn + H\u2082SO\u2084 \u2192 ZnSO\u2084 + H\u2082',
        shortLabel: 'Zinc+Dilute Acid',
        slides: [
          { narr: 'A simple displacement redox reaction. Zinc metal reacts with dilute sulphuric acid. Zinc is the reducing agent here \u2014 it loses electrons. Hydrogen ions gain electrons and form H\u2082 gas.',
            eq: { lhs:[{coeff:1,raw:'Zn',sup:'',ck:'zn'},{coeff:1,raw:'H2SO4',sup:'',ck:'Hp'}],
                  rhs:[{coeff:1,raw:'ZnSO4',sup:'',ck:'zn'},{coeff:1,raw:'H2',sup:'\u2191',ck:'Hp'}] },
            sub: null },
          { narr: 'Oxidation states: Zn goes 0 \u2192 +2 (loses 2e\u207b, OXIDATION). Hydrogen goes +1 \u2192 0 (gains 1e\u207b each, \u00d72 = REDUCTION). Sulphate spectator stays as SO\u2084\u00b2\u207b.',
            oxStates:[{sp:'Zn',from:'0',to:'+2',type:'ox'},{sp:'H',from:'+1',to:'0',type:'red'}],
            eq: { lhs:[{coeff:1,raw:'Zn',sup:'',ck:'zn',glow:true},{coeff:1,raw:'H2SO4',sup:'',ck:'Hp'}],
                  rhs:[{coeff:1,raw:'ZnSO4',sup:'',ck:'zn'},{coeff:1,raw:'H2',sup:'\u2191',ck:'Hp',glow:true}] },
            sub: null },
          { narr: 'Oxidation: Zn \u2192 Zn\u00b2\u207a + 2e\u207b. Reduction: 2H\u207a + 2e\u207b \u2192 H\u2082\u2191. Both half-reactions have exactly 2 electrons each \u2014 no scaling needed!',
            halfTitle: 'Half-reactions already balanced \u2014 add directly',
            bothHalves:{
              ox:{lhs:[{coeff:1,raw:'Zn',sup:'',ck:'zn'}],rhs:[{coeff:1,raw:'Zn',sup:'2+',ck:'zn'},ELEC(2)],label:'Oxidation:'},
              red:{lhs:[{coeff:2,raw:'H',sup:'+',ck:'Hp'},ELEC(2)],rhs:[{coeff:1,raw:'H2',sup:'\u2191',ck:'Hp'}],label:'Reduction:'},
            },
            sub: null },
          { narr: '\u2705 BALANCED! Zn + H\u2082SO\u2084 \u2192 ZnSO\u2084 + H\u2082\u2191. Atoms: Zn\u2713 H\u2713 S\u2713 O\u2713. Charge is balanced. The net ionic equation is Zn + 2H\u207a \u2192 Zn\u00b2\u207a + H\u2082\u2191.',
            halfTitle: '\u2728 BALANCED \u2728',
            eq: { lhs:[{coeff:1,raw:'Zn',sup:'',ck:'zn'},{coeff:1,raw:'H2SO4',sup:'',ck:'Hp'}],
                  rhs:[{coeff:1,raw:'ZnSO4',sup:'',ck:'zn'},{coeff:1,raw:'H2',sup:'\u2191',ck:'Hp'}] },
            celebrate: true,
            sub: null },
        ]
      },
    ];

    // ─── State ────────────────────────────────────────────────────────────────
    let rxIdx   = 0;
    let slideIdx= 0;
    let slideT  = 0;
    let transIn = 0;   // 0->60 on slide enter
    let confetti= [];
    let animId  = null;
    let prevSlideIdx = -1;

    // ─── Controls ─────────────────────────────────────────────────────────────
    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title">\u26a7\ufe0f Redox Balancing</div>
            <div class="sim-control-row">
                <label style="color:#a78bfa;font-weight:700;">Reaction</label>
                <select class="game-select" id="rxSel" style="margin-top:4px;">
                    ${REACTIONS.map((r,i)=>`<option value="${i}">${r.shortLabel}</option>`).join('')}
                </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;">
                <button class="btn-primary" id="rxPrev" style="font-size:0.82rem;padding:7px;">\u25c0 Back</button>
                <button class="btn-primary" id="rxNext" style="font-size:0.82rem;padding:7px;background:#10b981;">Next \u25b6</button>
            </div>
            <button class="btn-primary sim-action-btn" id="rxReset" style="margin-top:6px;width:100%;"><i class="fas fa-redo"></i> Restart</button>
            <div class="sim-stat-card" style="margin-top:10px;border-left:3px solid #22d3ee;">
                <div class="sim-stat-label">Progress</div>
                <div class="sim-stat-value" id="rxProgress" style="font-size:0.78rem;">--</div>
            </div>
            <div class="sim-stat-card" style="margin-top:6px;border-left:3px solid #f59e0b;padding:8px;">
                <div class="sim-stat-label" style="margin-bottom:4px;">Step</div>
                <div style="font-size:0.72rem;color:#fbbf24;line-height:1.5;" id="rxStepHint"></div>
            </div>
        </div>`;

    function setRx(ri) {
        rxIdx=ri; slideIdx=0; slideT=0; transIn=0; particles=[]; confetti=[];
        _lastNarr=''; prevSlideIdx=-1;
        updateUI();
    }
    function updateUI() {
        const sl = REACTIONS[rxIdx].slides[slideIdx];
        const prog = document.getElementById('rxProgress');
        const hint = document.getElementById('rxStepHint');
        if (prog) prog.textContent = `Slide ${slideIdx+1} / ${REACTIONS[rxIdx].slides.length}`;
        if (hint) hint.textContent = sl.halfTitle || sl.narr.substring(0,80)+'...';
    }

    document.getElementById('rxSel').addEventListener('change', e => setRx(+e.target.value));
    document.getElementById('rxNext').addEventListener('click', () => {
        const mx = REACTIONS[rxIdx].slides.length-1;
        if (slideIdx<mx) { prevSlideIdx=slideIdx; slideIdx++; slideT=0; transIn=0; particles=[]; confetti=[]; _lastNarr=''; updateUI(); }
    });
    document.getElementById('rxPrev').addEventListener('click', () => {
        if (slideIdx>0) { prevSlideIdx=slideIdx; slideIdx--; slideT=0; transIn=0; particles=[]; confetti=[]; _lastNarr=''; updateUI(); }
    });
    document.getElementById('rxReset').addEventListener('click', () => setRx(rxIdx));

    // ─── Confetti ─────────────────────────────────────────────────────────────
    function spawnConfetti(W, H) {
        for (let i=0;i<60;i++) confetti.push({
            x: Math.random()*W, y: -10, vx:(Math.random()-0.5)*3,
            vy: 2+Math.random()*3, rot:Math.random()*Math.PI*2,
            vrot:(Math.random()-0.5)*0.15,
            col:['#a78bfa','#34d399','#fbbf24','#f87171','#38bdf8'][Math.floor(Math.random()*5)],
            w:6+Math.random()*6, h:3+Math.random()*4, alpha:1
        });
    }
    function updateDrawConfetti(H) {
        confetti.forEach(c => {
            c.x+=c.vx; c.y+=c.vy; c.rot+=c.vrot; c.alpha=Math.max(0,1-c.y/(H*1.1));
            ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.rot); ctx.globalAlpha=c.alpha;
            ctx.fillStyle=c.col; ctx.fillRect(-c.w/2,-c.h/2,c.w,c.h); ctx.restore();
        });
        confetti=confetti.filter(c=>c.y<H+20);
    }

    // ─── Flying entity dx calculation ────────────────────────────────────────
    // Returns offset dx based on enterFrom and transIn (0->60 frames)
    function entryDx(enterFrom, transIn) {
        if (!enterFrom) return 0;
        const prog = Math.min(transIn/40, 1);
        const ease = 1 - Math.pow(1-prog, 3);
        if (enterFrom==='left')  return -(1-ease)*320;
        if (enterFrom==='right') return  (1-ease)*320;
        return 0;
    }
    function entryAlpha(enterFrom, transIn) {
        if (!enterFrom) return 1;
        return Math.min(1, transIn/25);
    }

    // ─── Oxidation state banner ───────────────────────────────────────────────
    function drawOxStateBanner(states, W, H, t) {
        const bW=120, bH=62, gap=20;
        const total = states.length*(bW+gap)-gap;
        let bx = W/2 - total/2;
        const by = H*0.55;
        states.forEach(s => {
            const isRed = s.type==='red';
            const bord = isRed ? '#22d3ee' : '#f97316';
            const fill = isRed ? '#082030' : '#450a00';
            ctx.fillStyle=fill; ctx.strokeStyle=bord; ctx.lineWidth=2;
            ctx.beginPath(); ctx.roundRect(bx,by,bW,bH,10); ctx.fill(); ctx.stroke();
            ctx.fillStyle=bord; ctx.font='bold 13px monospace'; ctx.textAlign='center';
            ctx.fillText(s.sp, bx+bW/2, by+20);
            ctx.fillStyle='#e2e8f0'; ctx.font='11px sans-serif';
            ctx.fillText(`${s.from} \u2192 ${s.to}`, bx+bW/2, by+37);
            ctx.fillStyle=bord; ctx.font='bold 10px sans-serif';
            ctx.fillText(isRed?'\u25bc REDUCTION':'\u25b2 OXIDATION', bx+bW/2, by+54);
            bx += bW + gap;
        });
    }

    // ─── Both halves display ──────────────────────────────────────────────────
    function drawBothHalves(bh, W, H, FS, transIn) {
        const y1 = H*0.42, y2 = H*0.62;
        // ox
        ctx.fillStyle='#1c120a'; ctx.strokeStyle='#f97316'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(16, y1-38, W-32, 54, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#f97316'; ctx.font='bold 10px monospace'; ctx.textAlign='left';
        ctx.fillText(bh.ox.label, 28, y1-20);
        drawEquation(bh.ox, y1, W, FS*0.88, transIn);

        // red
        ctx.fillStyle='#081a2a'; ctx.strokeStyle='#22d3ee'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(16, y2-38, W-32, 54, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#22d3ee'; ctx.font='bold 10px monospace'; ctx.textAlign='left';
        ctx.fillText(bh.red.label, 28, y2-20);
        drawEquation(bh.red, y2, W, FS*0.88, transIn);

        if (bh.cancelNote) {
            ctx.fillStyle='#fbbf24'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
            ctx.fillText(bh.cancelNote, W/2, H*0.81);
        }
    }

    // ─── Main render ──────────────────────────────────────────────────────────
    function draw() {
        animId = requestAnimationFrame(draw);
        const W = rxCanvas.width  = rxCanvas.offsetWidth  || 720;
        const H = rxCanvas.height = rxCanvas.offsetHeight || 540;

        // Background with subtle radial glow
        ctx.fillStyle = '#0d1117'; ctx.fillRect(0,0,W,H);
        const bgGrad = ctx.createRadialGradient(W*0.5, H*0.4, 0, W*0.5, H*0.4, W*0.6);
        bgGrad.addColorStop(0, 'rgba(30,27,75,0.18)');
        bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle=bgGrad; ctx.fillRect(0,0,W,H);

        slideT++;
        if (transIn < 60) transIn++;

        const slide = REACTIONS[rxIdx].slides[slideIdx];
        const maxSlide = REACTIONS[rxIdx].slides.length - 1;
        const FS = Math.max(13, Math.min(17, W/44));

        // ── Narration (top) ──
        drawNarration(slide.narr, slideT, W);

        // ── Step title ──
        if (slide.halfTitle) {
            const tAlpha = Math.min(1, transIn/20);
            ctx.globalAlpha = tAlpha;
            const isGood = slide.halfTitle.includes('\u2705') || slide.halfTitle.includes('\u2728');
            ctx.fillStyle = isGood ? '#4ade80' : '#a78bfa';
            ctx.font = `bold ${FS*0.85}px sans-serif`; ctx.textAlign='center';
            ctx.fillText(slide.halfTitle, W/2, 82);
            ctx.globalAlpha=1;
        }

        const eqY = slide.halfTitle ? H*0.34 : H*0.32;

        // ── Equation or both halves ──
        if (slide.bothHalves) {
            drawBothHalves(slide.bothHalves, W, H, FS, transIn);
        } else if (slide.eq) {
            // Attach entry animation to new species
            const lhs = slide.eq.lhs.map(sp => ({
                ...sp,
                _dx: sp.enterFrom ? entryDx(sp.enterFrom, transIn) : 0,
                alpha: sp.enterFrom ? entryAlpha(sp.enterFrom, transIn) : (Math.min(1, transIn/15)),
            }));
            const rhs = slide.eq.rhs.map(sp => ({
                ...sp,
                _dx: sp.enterFrom ? entryDx(sp.enterFrom, transIn) : 0,
                alpha: sp.enterFrom ? entryAlpha(sp.enterFrom, transIn) : (Math.min(1, transIn/15)),
            }));
            drawEquation({lhs, rhs}, eqY, W, FS, transIn);
        }

        // ── Oxidation state banner ──
        if (slide.oxStates) {
            drawOxStateBanner(slide.oxStates, W, H, slideT);
        }

        // ── Atom count ──
        if (slide.atomCount) {
            const ac = slide.atomCount;
            const acAlpha = Math.min(1, (transIn-20)/30);
            ctx.globalAlpha = Math.max(0, acAlpha);
            drawAtomCount(W/2, H*0.56, W, H, ac.elem, ac.lhsN, ac.rhsN, slideT, P[ac.pal]);
            ctx.globalAlpha = 1;
            // Atom pop effects
            if (slideT === 28 && ac.lhsN !== ac.rhsN) {
                for (let i=0;i<3;i++) spawnAtomPop(
                    W/2 + (Math.random()-0.5)*40,
                    H*0.58 + Math.random()*20,
                    ac.lhsN < ac.rhsN ? `-${ac.rhsN-ac.lhsN} on LHS!` : `-${ac.lhsN-ac.rhsN} on RHS!`,
                    'rgb(248,113,113)'
                );
            }
        }

        // ── Charge bar ──
        if (slide.chargeBar) {
            const cbAlpha = Math.min(1, (transIn-15)/25);
            ctx.globalAlpha = Math.max(0, cbAlpha);
            drawChargeBar(W/2, H*0.57, slide.chargeBar.lhs, slide.chargeBar.rhs);
            ctx.globalAlpha = 1;
        }

        // ── Spawn electrons once ──
        if (slide.spawnElec && slideT === 35) {
            const arrX = W*0.5;
            spawnElectrons(5, W*0.68, H*0.34, W*0.27, H*0.34);
        }

        // ── Particles ──
        updateParticles();
        drawParticles();

        // ── Confetti ──
        if (slide.celebrate) {
            if (slideT === 5) spawnConfetti(W, H);
            updateDrawConfetti(H);
        }

        // ── Progress dots ──
        const dotsY = H - 16;
        const numSlides = REACTIONS[rxIdx].slides.length;
        for (let i=0;i<numSlides;i++) {
            const dx = W/2 - (numSlides-1)*12 + i*24;
            ctx.beginPath(); ctx.arc(dx, dotsY, i<=slideIdx?6:4, 0, Math.PI*2);
            ctx.fillStyle = i===slideIdx ? '#a78bfa' : (i<slideIdx?'#4ade80':'#1e293b');
            ctx.shadowBlur = i===slideIdx ? 10 : 0;
            ctx.shadowColor = '#a78bfa';
            ctx.fill(); ctx.shadowBlur=0;
        }

        // ── Reaction name ──
        ctx.fillStyle = '#334155'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(REACTIONS[rxIdx].label, W-10, H-6);
    }

    draw();
    updateUI();

    const rrObs = new ResizeObserver(()=>{});
    rrObs.observe(rxCanvas.parentElement||rxCanvas);

    overlayEl.innerHTML += `<span class="sim-badge">\u26a7\ufe0f Redox</span><span class="sim-badge">\ud83c\udfac Animated</span>`;
    return () => { cancelAnimationFrame(animId); rxCanvas.remove(); rrObs.disconnect(); };
}


function initCollisionSim(engine, controlsContainer, overlayEl) {
    engine.setUpdate(() => {});
    const colCanvas = make2DCanvas(engine, 'colCanvas', '#0d1117');
    const ctx = colCanvas.getContext('2d');

    let m1=3, m2=2, u1=6, u2=-3, ctype='elastic';
    let simT=0, animId=null, running=true;

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title">💥 Collision Simulator</div>
            <div style="display:flex;gap:6px;margin-bottom:10px;">
                <button class="btn-primary" id="elBtn" style="flex:1;font-size:0.8rem;padding:7px;">⚡ Elastic</button>
                <button id="inBtn" style="flex:1;font-size:0.8rem;padding:7px;background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:8px;cursor:pointer;">💧 Inelastic</button>
            </div>
            <div class="sim-control-row"><label>Mass₁: <strong id="m1L">${m1}</strong> kg</label><input type="range" class="game-slider" id="m1S" min="1" max="8" step="0.5" value="${m1}"></div>
            <div class="sim-control-row"><label>Mass₂: <strong id="m2L">${m2}</strong> kg</label><input type="range" class="game-slider" id="m2S" min="1" max="8" step="0.5" value="${m2}"></div>
            <div class="sim-control-row"><label>v₁: <strong id="u1L">${u1}</strong> m/s →</label><input type="range" class="game-slider" id="u1S" min="1" max="12" step="0.5" value="${u1}"></div>
            <div class="sim-control-row"><label>v₂: <strong id="u2L">${Math.abs(u2)}</strong> m/s ←</label><input type="range" class="game-slider" id="u2S" min="0" max="10" step="0.5" value="${Math.abs(u2)}"></div>
            <button class="btn-primary sim-action-btn" id="colReplay"><i class="fas fa-redo"></i> Replay</button>
            <div class="sim-stats-grid" style="margin-top:8px;">
                <div class="sim-stat-card" style="border-left:3px solid #22d3ee"><div class="sim-stat-label">p before</div><div class="sim-stat-value" id="pBef" style="font-size:0.82rem;">—</div></div>
                <div class="sim-stat-card" style="border-left:3px solid #10b981"><div class="sim-stat-label">p after</div><div class="sim-stat-value" id="pAft" style="font-size:0.82rem;">—</div></div>
                <div class="sim-stat-card" style="border-left:3px solid #f59e0b"><div class="sim-stat-label">KE before</div><div class="sim-stat-value" id="keBef" style="font-size:0.82rem;">—</div></div>
                <div class="sim-stat-card" style="border-left:3px solid #f97316"><div class="sim-stat-label">KE after</div><div class="sim-stat-value" id="keAft" style="font-size:0.82rem;">—</div></div>
            </div>
        </div>`;

    ['#m1S','#m2S','#u1S','#u2S'].forEach(id => {
        document.getElementById(id.slice(1)).addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            if (id==='#m1S') { m1=v; document.getElementById('m1L').textContent=v; }
            if (id==='#m2S') { m2=v; document.getElementById('m2L').textContent=v; }
            if (id==='#u1S') { u1=v; document.getElementById('u1L').textContent=v; }
            if (id==='#u2S') { u2=-v; document.getElementById('u2L').textContent=v; }
            simT=0;
        });
    });
    document.getElementById('elBtn').addEventListener('click', () => { ctype='elastic'; simT=0; document.getElementById('elBtn').style.background=''; document.getElementById('inBtn').style.background='#1e293b'; });
    document.getElementById('inBtn').addEventListener('click', () => { ctype='inelastic'; simT=0; document.getElementById('inBtn').style.background='#7c3aed'; document.getElementById('elBtn').style.background='#1e293b'; });
    document.getElementById('colReplay').addEventListener('click', () => { simT=0; });

    function calcAfter() {
        let v1f, v2f;
        if (ctype==='elastic') {
            v1f = ((m1-m2)*u1 + 2*m2*u2) / (m1+m2);
            v2f = ((m2-m1)*u2 + 2*m1*u1) / (m1+m2);
        } else {
            v1f = v2f = (m1*u1 + m2*u2) / (m1+m2);
        }
        return { v1f, v2f };
    }

    const sparks2 = [];
    function spawnSparks2(cx, cy) {
        for (let i=0;i<16;i++) {
            const angle = (i/16)*Math.PI*2;
            sparks2.push({ x:cx, y:cy, vx:Math.cos(angle)*(3+Math.random()*4), vy:Math.sin(angle)*(3+Math.random()*4), alpha:1, color: ctype==='elastic'?'#fbbf24':'#f97316' });
        }
    }

    let hitDone = false;
    function draw() {
        animId = requestAnimationFrame(draw);
        const W = colCanvas.width = colCanvas.offsetWidth || 700;
        const H = colCanvas.height = colCanvas.offsetHeight || 500;
        ctx.fillStyle = '#0d1117'; ctx.fillRect(0,0,W,H);

        const { v1f, v2f } = calcAfter();
        const floorY = H * 0.68;
        const SCALE = W / 220;
        const TOTAL = 260, HIT_AT = 100;

        simT += 0.7;
        if (simT > TOTAL) simT = TOTAL;

        // Floor / track
        const fgrad = ctx.createLinearGradient(0, floorY, 0, floorY+16);
        fgrad.addColorStop(0,'#334155'); fgrad.addColorStop(1,'#1e293b');
        ctx.fillStyle = fgrad; ctx.fillRect(0, floorY, W, 16);
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
        for (let tx=0;tx<W;tx+=20) {
            ctx.beginPath(); ctx.moveTo(tx, floorY); ctx.lineTo(tx+10, floorY+8); ctx.stroke();
        }

        const r1 = 18 + m1 * 4, r2 = 18 + m2 * 4;
        let x1, x2;
        const t = simT;

        if (t < HIT_AT) {
            const pct = t / HIT_AT;
            x1 = W*0.12 + pct * (W*0.46 - W*0.12 - r1 - r2 - 4);
            x2 = W*0.88 - pct * (W*0.88 - W*0.54 - r1 - r2 - 4);
            hitDone = false;
        } else if (t < HIT_AT + 14) {
            x1 = W*0.46 - r1 - 2;
            x2 = W*0.46 + r2 + 2;
            if (!hitDone) { spawnSparks2(W*0.46, floorY - (r1+r2)/2); hitDone = true; }
        } else {
            const tPost = (t - HIT_AT - 14) / (TOTAL - HIT_AT - 14);
            x1 = W*0.46 - r1 - 2 + v1f * tPost * 14 * SCALE;
            if (ctype==='inelastic') {
                // stick together
                x2 = x1 + r1 + r2;
            } else {
                x2 = W*0.46 + r2 + 2 + v2f * tPost * 14 * SCALE;
            }
        }

        // Draw sparks
        for (let i=sparks2.length-1;i>=0;i--) {
            const s=sparks2[i]; s.x+=s.vx; s.y+=s.vy; s.vy+=0.15; s.alpha-=0.035;
            if (s.alpha<=0) { sparks2.splice(i,1); continue; }
            ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI*2);
            ctx.fillStyle = s.color+Math.floor(s.alpha*255).toString(16).padStart(2,'0'); ctx.fill();
        }

        function drawBall(x, cy, r, col, lbl) {
            const bg = ctx.createRadialGradient(x-r*0.3, cy-r*0.3, r*0.1, x, cy, r);
            bg.addColorStop(0, '#fff'); bg.addColorStop(0.3, col); bg.addColorStop(1, col+'66');
            ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI*2);
            ctx.fillStyle = bg; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(10,r*0.5)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(lbl, x, cy + r*0.18);
        }

        const cy1 = floorY - r1, cy2 = floorY - r2;
        drawBall(x1, cy1, r1, '#22d3ee', `${m1}kg`);
        drawBall(x2, cy2, r2, '#f97316', `${m2}kg`);

        // Velocity arrows
        function velArrow(x, y, v, col, label) {
            if (Math.abs(v)<0.05) return;
            const len = v * SCALE * 5; const dir = len>0?1:-1;
            ctx.strokeStyle = col; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+len, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x+len,y); ctx.lineTo(x+len-dir*8,y-5); ctx.lineTo(x+len-dir*8,y+5); ctx.closePath();
            ctx.fillStyle = col; ctx.fill();
            ctx.fillStyle = col; ctx.font = '10px monospace'; ctx.textAlign = len>0?'left':'right';
            ctx.fillText(label, x+len+dir*6, y+3);
        }

        const phase = t < HIT_AT ? 'before' : t < HIT_AT+14 ? 'hit' : 'after';
        const v1d = phase==='before'?u1:(phase==='hit'?0:v1f);
        const v2d = phase==='before'?u2:(phase==='hit'?0:v2f);
        velArrow(x1, cy1 - r1 - 12, v1d, '#22d3ee', `${v1d.toFixed(1)}m/s`);
        if (ctype!=='inelastic'||phase!=='after') velArrow(x2, cy2 - r2 - 12, v2d, '#f97316', `${v2d.toFixed(1)}m/s`);

        // Collision flash
        if (phase==='hit') {
            ctx.beginPath(); ctx.arc((x1+x2)/2, (cy1+cy2)/2, (r1+r2)*0.9, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,180,0.2)'; ctx.fill();
            ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('💥', (x1+x2)/2, (cy1+cy2)/2 - r1);
        }

        // Type label
        const typeCol = ctype==='elastic'?'#4ade80':'#f97316';
        ctx.fillStyle = typeCol; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(ctype==='elastic'?'⚡ ELASTIC — KE conserved':'💧 PERFECTLY INELASTIC — KE lost as heat/sound', W/2, 22);

        // KE / Momentum bars (bottom panel)
        const barPanel = floorY + 28;
        const panH = H - barPanel - 10;
        const keBefore = 0.5*m1*u1**2 + 0.5*m2*u2**2;
        const keAfter  = 0.5*m1*v1f**2 + (ctype==='inelastic'?0.5*m2*v1f**2:0.5*m2*v2f**2);
        const pBefore  = m1*u1 + m2*u2;
        const pAfter   = m1*v1f + m2*v2f;

        const maxKE = Math.max(keBefore, 0.1);
        const barW2 = 55, yB = H - 18;

        [['KE before',keBefore,'#f59e0b',W/2-160],[`KE after\n(${((keAfter/keBefore)*100).toFixed(0)}%)`,keAfter,'#f97316',W/2-95],
         ['p before',Math.abs(pBefore)*0.6,'#22d3ee',W/2+20],['p after',Math.abs(pAfter)*0.6,'#10b981',W/2+85]].forEach(([lbl,val,col,bx]) => {
            const bh = Math.min((val/maxKE)*panH*0.9, panH*0.9);
            ctx.fillStyle = col+'55'; ctx.fillRect(bx, yB-bh, barW2, bh);
            ctx.fillStyle = col; ctx.fillRect(bx, yB-bh, barW2, 3);
            ctx.fillStyle = '#94a3b8'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
            lbl.split('\n').forEach((ll,li) => ctx.fillText(ll, bx+barW2/2, yB+12+li*12));
            ctx.fillStyle = '#fff'; ctx.fillText(val.toFixed(1), bx+barW2/2, yB-bh-5);
        });

        // Sidebar stats
        const pb=document.getElementById('pBef'),pa=document.getElementById('pAft'),kb=document.getElementById('keBef'),ka=document.getElementById('keAft');
        if (pb) pb.textContent = pBefore.toFixed(1)+' kg·m/s';
        if (pa) pa.textContent = pAfter.toFixed(1)+' kg·m/s';
        if (kb) kb.textContent = keBefore.toFixed(1)+' J';
        if (ka) { ka.textContent = keAfter.toFixed(1)+' J'; ka.style.color = Math.abs(keAfter-keBefore)<0.5?'#4ade80':'#f97316'; }

        if (simT >= TOTAL) simT = TOTAL;
    }
    draw();
    overlayEl.innerHTML += `<span class="sim-badge">💥 Collision</span><span class="sim-badge">p & KE</span>`;
    return () => { cancelAnimationFrame(animId); colCanvas.remove(); };
}

// =====================================================================
// FUNCTION GRAPHS — Plotly powered
// =====================================================================
function initFunctionGraphSim(engine, controlsContainer, overlayEl) {
    engine.setUpdate(() => {});
    const simArea = engine.renderer.domElement.parentElement;
    simArea.style.position = 'relative';
    // Hide THREE.js canvas, use a div for Plotly
    let fgDiv = document.getElementById('fgPlotDiv');
    if (fgDiv) fgDiv.remove();
    fgDiv = document.createElement('div');
    fgDiv.id = 'fgPlotDiv';
    fgDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;border-radius:12px;overflow:hidden;background:#0d1117;';
    simArea.appendChild(fgDiv);

    const FUNCTIONS = [
        { id:'linear',   label:'Linear: f(x)=mx+c',          params:[{n:'m',min:-5,max:5,step:0.5,val:1},{n:'c',min:-10,max:10,step:1,val:0}],   fn:(x,p)=>p[0]*x+p[1] },
        { id:'quad',     label:'Quadratic: f(x)=ax²+bx+c',   params:[{n:'a',min:-3,max:3,step:0.25,val:1},{n:'b',min:-5,max:5,step:0.5,val:0},{n:'c',min:-10,max:10,step:1,val:0}], fn:(x,p)=>p[0]*x*x+p[1]*x+p[2] },
        { id:'cubic',    label:'Cubic: f(x)=ax³+bx+c',       params:[{n:'a',min:-2,max:2,step:0.25,val:1},{n:'b',min:-5,max:5,step:0.5,val:0},{n:'c',min:-5,max:5,step:1,val:0}],  fn:(x,p)=>p[0]*x**3+p[1]*x+p[2] },
        { id:'abs',      label:'Absolute: f(x)=|ax+b|+c',    params:[{n:'a',min:-3,max:3,step:0.5,val:1},{n:'b',min:-5,max:5,step:0.5,val:0},{n:'c',min:-5,max:5,step:1,val:0}],   fn:(x,p)=>Math.abs(p[0]*x+p[1])+p[2] },
        { id:'sqrt',     label:'Square Root: f(x)=√(ax+b)',   params:[{n:'a',min:0.1,max:4,step:0.25,val:1},{n:'b',min:-5,max:5,step:0.5,val:0}],  fn:(x,p)=>p[0]*x+p[1]>=0?Math.sqrt(p[0]*x+p[1]):null },
        { id:'rational', label:'Rational: f(x)=a/(x+b)',      params:[{n:'a',min:-5,max:5,step:0.5,val:1},{n:'b',min:-4,max:4,step:0.5,val:1}],    fn:(x,p)=>Math.abs(x+p[1])<0.05?null:p[0]/(x+p[1]) },
        { id:'expo',     label:'Exponential: f(x)=aˣ',        params:[{n:'a(base)',min:0.1,max:5,step:0.1,val:2}],                                   fn:(x,p)=>Math.pow(Math.max(0.01,p[0]),x) },
        { id:'log',      label:'Logarithm: f(x)=logₐ(x)',     params:[{n:'a(base)',min:1.1,max:10,step:0.5,val:10}],                                 fn:(x,p)=>x>0.01?Math.log(x)/Math.log(Math.max(1.01,p[0])):null },
    ];

    let curFn = FUNCTIONS[0], pVals = curFn.params.map(p=>p.val);
    let needsRedraw = true;

    function buildUI() {
        const pc = document.getElementById('fgParamArea');
        if (!pc) return;
        pc.innerHTML = curFn.params.map((p,i)=>`
            <div class="sim-control-row">
                <label>${p.n}: <strong id="fgpL${i}">${pVals[i]}</strong></label>
                <input type="range" class="game-slider" id="fgpS${i}" min="${p.min}" max="${p.max}" step="${p.step}" value="${pVals[i]}">
            </div>`).join('');
        curFn.params.forEach((_,i) => {
            const sl = document.getElementById(`fgpS${i}`);
            if (sl) sl.addEventListener('input', e => { pVals[i]=parseFloat(e.target.value); document.getElementById(`fgpL${i}`).textContent=pVals[i]; needsRedraw=true; });
        });
    }

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel">
            <div class="game-section-title">📈 Function Graphs</div>
            <select class="game-select" id="fgFnSel">${FUNCTIONS.map(f=>`<option value="${f.id}">${f.label}</option>`).join('')}</select>
            <div id="fgParamArea" style="margin-top:8px;"></div>
            <div class="sim-stat-card" style="margin-top:8px;border-left:3px solid #22d3ee;">
                <div class="sim-stat-label">f(0)</div>
                <div class="sim-stat-value" id="fgAt0">—</div>
            </div>
            <div class="sim-stat-card" style="margin-top:6px;border-left:3px solid #a78bfa;">
                <div class="sim-stat-label">Domain note</div>
                <div style="font-size:0.75rem;color:#94a3b8;" id="fgDomainNote">—</div>
            </div>
        </div>`;

    document.getElementById('fgFnSel').addEventListener('change', e => {
        curFn = FUNCTIONS.find(f=>f.id===e.target.value)||FUNCTIONS[0];
        pVals = curFn.params.map(p=>p.val);
        buildUI();
        needsRedraw = true;
    });
    buildUI();

    const DOMAIN_NOTES = { rational:'Asymptote at x = −b', sqrt:'Defined only for ax+b ≥ 0', log:'Defined only for x > 0', expo:'Base must be positive', linear:'Defined for all x ∈ ℝ', quad:'Defined for all x ∈ ℝ', cubic:'Defined for all x ∈ ℝ', abs:'Defined for all x ∈ ℝ' };

    let rafId;
    const plotLayout = {
        paper_bgcolor:'#0d1117', plot_bgcolor:'#0f172a',
        font:{ color:'#94a3b8', size:11 },
        margin:{ l:50, r:20, t:30, b:50 },
        xaxis:{ gridcolor:'#1e293b', zerolinecolor:'#334155', zerolinewidth:2, color:'#64748b', title:'x' },
        yaxis:{ gridcolor:'#1e293b', zerolinecolor:'#334155', zerolinewidth:2, color:'#64748b', title:'f(x)', range:[-15,15] },
        showlegend:false,
    };

    function replot() {
        if (!needsRedraw) { rafId = requestAnimationFrame(replot); return; }
        needsRedraw = false;
        const xs = [], ys = [];
        for (let xi=-12; xi<=12; xi+=0.05) {
            const y = curFn.fn(xi, pVals);
            xs.push(xi); ys.push((y===null||!isFinite(y)||Math.abs(y)>50)?null:y);
        }
        const trace = { x:xs, y:ys, mode:'lines', type:'scatter',
            line:{ color:'#22d3ee', width:2.5 }, connectgaps:false };
        // zero crossing dots
        const zDots = { x:[], y:[], mode:'markers', type:'scatter',
            marker:{ color:'#f59e0b', size:8, symbol:'circle' } };
        for (let j=1;j<xs.length;j++) {
            if (ys[j-1]!==null&&ys[j]!==null&&Math.sign(ys[j-1])!==Math.sign(ys[j])) {
                const xz = xs[j-1] - ys[j-1]*(xs[j]-xs[j-1])/(ys[j]-ys[j-1]);
                zDots.x.push(xz); zDots.y.push(0);
            }
        }
        if (typeof Plotly !== 'undefined') {
            Plotly.react(fgDiv, [trace, zDots], {...plotLayout, title:{ text: curFn.label, font:{ color:'#a78bfa', size:13 } }}, { responsive:true, displayModeBar:false });
        }
        const at0 = curFn.fn(0, pVals);
        const a0el = document.getElementById('fgAt0'); if(a0el) a0el.textContent = (at0!==null&&isFinite(at0)) ? at0.toFixed(3) : 'undefined';
        const dn = document.getElementById('fgDomainNote'); if(dn) dn.textContent = DOMAIN_NOTES[curFn.id]||'—';
        rafId = requestAnimationFrame(replot);
    }
    needsRedraw = true;
    replot();

    overlayEl.innerHTML += `<span class="sim-badge">📈 Functions</span>`;
    return () => { cancelAnimationFrame(rafId); fgDiv.remove(); };
}

// =====================================================================
// SINE & COSINE WAVE GRAPHS — Plotly powered
// =====================================================================
function initWaveGraphSim(engine, controlsContainer, overlayEl) {
    engine.setUpdate(() => {});
    const simArea = engine.renderer.domElement.parentElement;
    simArea.style.position = 'relative';
    let wgDiv = document.getElementById('wgPlotDiv');
    if (wgDiv) wgDiv.remove();
    wgDiv = document.createElement('div');
    wgDiv.id = 'wgPlotDiv';
    wgDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;border-radius:12px;overflow:hidden;background:#0d1117;';
    simArea.appendChild(wgDiv);

    let sA=1,sB=1,sC=0,sD=0, cA=1,cB=1,cC=0,cD=0;
    let showS=true, showC=true, needsRedraw=true;

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel" style="overflow-y:auto;max-height:80vh;">
            <div class="game-section-title">〜 Sine & Cosine</div>
            <div style="color:#22d3ee;font-weight:700;font-size:0.82rem;margin-bottom:4px;">y = A·sin(Bx + Cπ) + D</div>
            <div class="sim-control-row"><label>A: <b id="sAL">${sA}</b></label><input type="range" class="game-slider" id="sAS" min="0.1" max="4" step="0.1" value="${sA}"></div>
            <div class="sim-control-row"><label>B: <b id="sBL">${sB}</b></label><input type="range" class="game-slider" id="sBS" min="0.1" max="6" step="0.1" value="${sB}"></div>
            <div class="sim-control-row"><label>C: <b id="sCL">${sC}</b>π</label><input type="range" class="game-slider" id="sCS" min="-2" max="2" step="0.25" value="${sC}"></div>
            <div class="sim-control-row"><label>D: <b id="sDL">${sD}</b></label><input type="range" class="game-slider" id="sDS" min="-4" max="4" step="0.5" value="${sD}"></div>
            <label style="font-size:0.78rem;display:flex;gap:6px;align-items:center;margin-bottom:8px;cursor:pointer;"><input type="checkbox" id="showSin" checked> Show sin (cyan)</label>
            <hr style="border-color:#1e293b;">
            <div style="color:#f97316;font-weight:700;font-size:0.82rem;margin-bottom:4px;">y = A·cos(Bx + Cπ) + D</div>
            <div class="sim-control-row"><label>A: <b id="cAL">${cA}</b></label><input type="range" class="game-slider" id="cAS" min="0.1" max="4" step="0.1" value="${cA}"></div>
            <div class="sim-control-row"><label>B: <b id="cBL">${cB}</b></label><input type="range" class="game-slider" id="cBS" min="0.1" max="6" step="0.1" value="${cB}"></div>
            <div class="sim-control-row"><label>C: <b id="cCL">${cC}</b>π</label><input type="range" class="game-slider" id="cCS" min="-2" max="2" step="0.25" value="${cC}"></div>
            <div class="sim-control-row"><label>D: <b id="cDL">${cD}</b></label><input type="range" class="game-slider" id="cDS" min="-4" max="4" step="0.5" value="${cD}"></div>
            <label style="font-size:0.78rem;display:flex;gap:6px;align-items:center;margin-bottom:8px;cursor:pointer;"><input type="checkbox" id="showCos" checked> Show cos (orange)</label>
            <div class="sim-stats-grid" style="margin-top:6px;">
                <div class="sim-stat-card" style="border-left:3px solid #22d3ee"><div class="sim-stat-label">sin Period</div><div class="sim-stat-value" id="sinT" style="font-size:0.85rem;">—</div></div>
                <div class="sim-stat-card" style="border-left:3px solid #f97316"><div class="sim-stat-label">cos Period</div><div class="sim-stat-value" id="cosT" style="font-size:0.85rem;">—</div></div>
            </div>
        </div>`;

    function bind(slId, lblId, setter) {
        const el = document.getElementById(slId);
        if(el) el.addEventListener('input', e => { setter(parseFloat(e.target.value)); document.getElementById(lblId).textContent=e.target.value; needsRedraw=true; });
    }
    bind('sAS','sAL', v=>sA=v); bind('sBS','sBL', v=>sB=v); bind('sCS','sCL', v=>sC=v); bind('sDS','sDL', v=>sD=v);
    bind('cAS','cAL', v=>cA=v); bind('cBS','cBL', v=>cB=v); bind('cCS','cCL', v=>cC=v); bind('cDS','cDL', v=>cD=v);
    document.getElementById('showSin').addEventListener('change', e => { showS=e.target.checked; needsRedraw=true; });
    document.getElementById('showCos').addEventListener('change', e => { showC=e.target.checked; needsRedraw=true; });

    const xs = [];
    for (let x=-4*Math.PI; x<=4*Math.PI; x+=0.04) xs.push(x);

    const layout = {
        paper_bgcolor:'#0d1117', plot_bgcolor:'#0f172a',
        font:{ color:'#94a3b8', size:11 },
        margin:{ l:55, r:20, t:38, b:50 },
        xaxis:{ gridcolor:'#1e293b', zerolinecolor:'#334155', zerolinewidth:2, color:'#64748b', title:'x (radians)',
                tickvals:[-4,-3,-2,-1,0,1,2,3,4].map(v=>v*Math.PI), ticktext:['-4π','-3π','-2π','-π','0','π','2π','3π','4π'] },
        yaxis:{ gridcolor:'#1e293b', zerolinecolor:'#334155', zerolinewidth:2, color:'#64748b', title:'y', range:[-6,6] },
        legend:{ font:{ color:'#94a3b8'}, bgcolor:'#0d1117',  bordercolor:'#334155' },
    };

    let rafId;
    function replot() {
        if (!needsRedraw) { rafId = requestAnimationFrame(replot); return; }
        needsRedraw = false;
        const traces = [];
        if (showS) {
            traces.push({ name:`sin: A=${sA} B=${sB} C=${sC}π D=${sD}`,
                x:xs, y:xs.map(x=>sA*Math.sin(sB*x+sC*Math.PI)+sD),
                mode:'lines', line:{ color:'#22d3ee', width:2.5 } });
            // Amplitude dashed markers
            traces.push({ x:[xs[0],xs[xs.length-1]], y:[sA+sD, sA+sD], mode:'lines', name:'sin peak', line:{ color:'#22d3ee', dash:'dot', width:1 }, showlegend:false });
            traces.push({ x:[xs[0],xs[xs.length-1]], y:[-sA+sD,-sA+sD], mode:'lines', name:'sin trough', line:{ color:'#22d3ee', dash:'dot', width:1 }, showlegend:false });
        }
        if (showC) {
            traces.push({ name:`cos: A=${cA} B=${cB} C=${cC}π D=${cD}`,
                x:xs, y:xs.map(x=>cA*Math.cos(cB*x+cC*Math.PI)+cD),
                mode:'lines', line:{ color:'#f97316', width:2.5 } });
            traces.push({ x:[xs[0],xs[xs.length-1]], y:[cA+cD, cA+cD], mode:'lines', name:'cos peak', line:{ color:'#f97316', dash:'dot', width:1 }, showlegend:false });
            traces.push({ x:[xs[0],xs[xs.length-1]], y:[-cA+cD,-cA+cD], mode:'lines', name:'cos trough', line:{ color:'#f97316', dash:'dot', width:1 }, showlegend:false });
        }
        if (typeof Plotly !== 'undefined') Plotly.react(wgDiv, traces, layout, { responsive:true, displayModeBar:false });

        const st=document.getElementById('sinT'), ct=document.getElementById('cosT');
        if (st) st.textContent = (2*Math.PI/sB).toFixed(3)+' rad = '+(360/sB).toFixed(1)+'°';
        if (ct) ct.textContent = (2*Math.PI/cB).toFixed(3)+' rad = '+(360/cB).toFixed(1)+'°';
        rafId = requestAnimationFrame(replot);
    }
    needsRedraw = true;
    replot();

    overlayEl.innerHTML += `<span class="sim-badge">〜 sin/cos</span>`;
    return () => { cancelAnimationFrame(rafId); wgDiv.remove(); };
}

// Expose to global scope (module doesn't auto-export to window)
window.closeGameDetail = closeGameDetail;
window.closeGamePlay = closeGamePlay;

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGames);
} else {
    initGames();
}
