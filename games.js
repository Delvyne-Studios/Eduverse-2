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
            <div class="game-panel gamified-sidebar gamified-dark" id="simControlPanel">
                <div class="game-section-title gamified-header"><i class="fas fa-layer-group"></i> 🎯 Categories</div>
                <div class="sim-category-grid">
                    <div class="sim-category-card gamified-category" data-category="physics">
                        <div class="category-icon">⚡</div>
                        <h3>Physics</h3>
                        <p class="sim-status">5 simulators</p>
                    </div>
                    <div class="sim-category-card gamified-category" data-category="chemistry">
                        <div class="category-icon">🧪</div>
                        <h3>Chemistry</h3>
                        <p class="sim-status">3 simulators</p>
                    </div>
                    <div class="sim-category-card gamified-category" data-category="maths">
                        <div class="category-icon">📐</div>
                        <h3>Maths</h3>
                        <p class="sim-status">2 simulators</p>
                    </div>
                </div>
                <div class="game-section-title gamified-header" style="margin-top: 16px;"><i class="fas fa-cube"></i> 📋 Simulator List</div>
                <div class="sim-list gamified-list" id="simList"></div>
                <div class="sim-status gamified-status" id="simDescription">Select a category to load simulators.</div>
            </div>
            <div class="game-panel gamified-dark">
                <div class="game-section-title gamified-header"><i class="fas fa-vr-cardboard"></i> 🎮 Simulation View</div>
                <div class="game-canvas-panel gamified-viewport" id="simCanvasPanel">
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
            <div class="sim-list-item gamified-list-item" data-sim="${sim.id}">
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

    // Camera for projectile
    camera.position.set(8, 8, 18);
    camera.lookAt(5, 2, 0);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel gamified-dark">
            <div class="game-section-title gamified-header"><i class="fas fa-rocket"></i> 🎮 Projectile Controls</div>
            <div class="sim-control-row gamified-control">
                <label>🎯 Launch Angle</label>
                <input class="sim-slider gamified-slider" id="projAngle" type="range" min="10" max="80" value="45">
                <span class="sim-slider-val gamified-value" id="angleVal">45°</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>💨 Initial Velocity</label>
                <input class="sim-slider gamified-slider" id="projVelocity" type="range" min="5" max="50" value="20">
                <span class="sim-slider-val gamified-value" id="velVal">20 m/s</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>🌍 Gravity</label>
                <input class="sim-slider gamified-slider" id="projGravity" type="range" min="1" max="20" value="9.8" step="0.1">
                <span class="sim-slider-val gamified-value" id="gravVal">9.8 m/s²</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>📏 Launch Height</label>
                <input class="sim-slider gamified-slider" id="projHeight" type="range" min="0" max="10" value="2" step="0.5">
                <span class="sim-slider-val gamified-value" id="heightVal">2 m</span>
            </div>
            <div class="sim-stats-grid gamified-stats">
                <div class="sim-stat-card gamified-stat"><div class="sim-stat-label">Range</div><div class="sim-stat-value" id="rangeVal">--</div><div class="sim-stat-unit">m</div></div>
                <div class="sim-stat-card gamified-stat"><div class="sim-stat-label">Max Height</div><div class="sim-stat-value" id="maxHVal">--</div><div class="sim-stat-unit">m</div></div>
                <div class="sim-stat-card gamified-stat"><div class="sim-stat-label">Flight Time</div><div class="sim-stat-value" id="flightVal">--</div><div class="sim-stat-unit">s</div></div>
            </div>
            <button class="btn-primary sim-action-btn gamified-btn" id="launchProjBtn"><i class="fas fa-space-shuttle"></i> Launch</button>
            <button class="btn-secondary sim-action-btn gamified-btn" id="resetProjBtn"><i class="fas fa-redo"></i> Reset</button>
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
    let animationSpeed = 1.0;

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
        isLaunched = true;
        time = 0;
        launchBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
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
    
    // Better camera position
    camera.position.set(8, 6, 10);
    camera.lookAt(0, 2, 0);
    
    const origin = new THREE.Vector3(0, 0, 0);
    let vectorA = new THREE.Vector3(4, 2, 1);
    let vectorB = new THREE.Vector3(2, 3, 2);

    // Vector A starts from origin
    const arrowA = new THREE.ArrowHelper(
        vectorA.clone().normalize(), 
        origin, 
        vectorA.length(), 
        0x22d3ee, 
        0.6, 
        0.4
    );
    scene.add(arrowA);
    
    // Vector B starts from tip of A (tail-to-tip method!)
    const arrowB = new THREE.ArrowHelper(
        vectorB.clone().normalize(), 
        vectorA.clone(), 
        vectorB.length(), 
        0xf97316, 
        0.6, 
        0.4
    );
    scene.add(arrowB);
    
    // Resultant arrow from origin to final tip
    const resultant = vectorA.clone().add(vectorB);
    const arrowR = new THREE.ArrowHelper(
        resultant.clone().normalize(), 
        origin, 
        resultant.length(), 
        0x10b981, 
        0.7, 
        0.5
    );
    scene.add(arrowR);
    
    // Dashed line showing parallelogram for visualization
    const dashedMaterial = new THREE.LineDashedMaterial({ 
        color: 0x64748b, 
        dashSize: 0.3, 
        gapSize: 0.15,
        opacity: 0.6,
        transparent: true
    });
    
    // Dashed line from origin to B
    const dashedGeom1 = new THREE.BufferGeometry().setFromPoints([origin, vectorB.clone()]);
    const dashedLine1 = new THREE.Line(dashedGeom1, dashedMaterial);
    dashedLine1.computeLineDistances();
    scene.add(dashedLine1);
    
    // Dashed line from tip of A to final tip (parallel to B from origin)
    const dashedGeom2 = new THREE.BufferGeometry().setFromPoints([vectorA.clone(), resultant.clone()]);
    const dashedLine2 = new THREE.Line(dashedGeom2, dashedMaterial);
    dashedLine2.computeLineDistances();
    scene.add(dashedLine2);

    // Tip markers for visual clarity
    const createTipMarker = (color) => new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 16), 
        new THREE.MeshStandardMaterial({ 
            color, 
            emissive: color, 
            emissiveIntensity: 0.4,
            metalness: 0.6
        })
    );
    
    const tipA = createTipMarker(0x22d3ee);
    const tipB = createTipMarker(0xf97316);
    const tipR = createTipMarker(0x10b981);
    scene.add(tipA, tipB, tipR);

    // Origin marker
    const originSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.5 })
    );
    scene.add(originSphere);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel gamified-dark">
            <div class="game-section-title gamified-header"><i class="fas fa-arrows-alt"></i> 📐 Vector A <span style="color:#22d3ee">●</span></div>
            <div class="sim-control-row gamified-control">
                <label>X Component</label>
                <input class="sim-slider gamified-slider" id="vaX" type="range" min="-8" max="8" value="4" step="0.5">
                <span class="sim-slider-val gamified-value" id="vaXVal">4.0</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>Y Component</label>
                <input class="sim-slider gamified-slider" id="vaY" type="range" min="-8" max="8" value="2" step="0.5">
                <span class="sim-slider-val gamified-value" id="vaYVal">2.0</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>Z Component</label>
                <input class="sim-slider gamified-slider" id="vaZ" type="range" min="-8" max="8" value="1" step="0.5">
                <span class="sim-slider-val gamified-value" id="vaZVal">1.0</span>
            </div>
            
            <div class="game-section-title gamified-header" style="margin-top:12px;"><i class="fas fa-arrows-alt"></i> 📐 Vector B <span style="color:#f97316">●</span></div>
            <div class="sim-control-row gamified-control">
                <label>X Component</label>
                <input class="sim-slider gamified-slider" id="vbX" type="range" min="-8" max="8" value="2" step="0.5">
                <span class="sim-slider-val gamified-value" id="vbXVal">2.0</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>Y Component</label>
                <input class="sim-slider gamified-slider" id="vbY" type="range" min="-8" max="8" value="3" step="0.5">
                <span class="sim-slider-val gamified-value" id="vbYVal">3.0</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>Z Component</label>
                <input class="sim-slider gamified-slider" id="vbZ" type="range" min="-8" max="8" value="2" step="0.5">
                <span class="sim-slider-val gamified-value" id="vbZVal">2.0</span>
            </div>
            
            <div class="sim-stats-grid gamified-stats" style="margin-top:12px;">
                <div class="sim-stat-card gamified-stat" style="border-left:3px solid #22d3ee">
                    <div class="sim-stat-label">|A| Magnitude</div>
                    <div class="sim-stat-value" id="magA">--</div>
                </div>
                <div class="sim-stat-card gamified-stat" style="border-left:3px solid #f97316">
                    <div class="sim-stat-label">|B| Magnitude</div>
                    <div class="sim-stat-value" id="magB">--</div>
                </div>
                <div class="sim-stat-card gamified-stat" style="border-left:3px solid #10b981">
                    <div class="sim-stat-label">|R| Resultant</div>
                    <div class="sim-stat-value" id="magR">--</div>
                </div>
            </div>
            <div class="sim-status gamified-result" id="vectorReadout" style="margin-top:12px;"></div>
        </div>
    `;

    function updateVectors() {
        vectorA.set(
            parseFloat(controlsContainer.querySelector('#vaX').value), 
            parseFloat(controlsContainer.querySelector('#vaY').value), 
            parseFloat(controlsContainer.querySelector('#vaZ').value)
        );
        vectorB.set(
            parseFloat(controlsContainer.querySelector('#vbX').value), 
            parseFloat(controlsContainer.querySelector('#vbY').value), 
            parseFloat(controlsContainer.querySelector('#vbZ').value)
        );
        const res = vectorA.clone().add(vectorB);

        // Update labels
        controlsContainer.querySelector('#vaXVal').textContent = vectorA.x.toFixed(1);
        controlsContainer.querySelector('#vaYVal').textContent = vectorA.y.toFixed(1);
        controlsContainer.querySelector('#vaZVal').textContent = vectorA.z.toFixed(1);
        controlsContainer.querySelector('#vbXVal').textContent = vectorB.x.toFixed(1);
        controlsContainer.querySelector('#vbYVal').textContent = vectorB.y.toFixed(1);
        controlsContainer.querySelector('#vbZVal').textContent = vectorB.z.toFixed(1);

        // Update arrow A (from origin)
        if (vectorA.length() > 0.01) { 
            arrowA.position.copy(origin);
            arrowA.setDirection(vectorA.clone().normalize()); 
            arrowA.setLength(vectorA.length(), 0.6, 0.4); 
        }
        
        // Update arrow B (tail-to-tip: starts at tip of A!)
        if (vectorB.length() > 0.01) { 
            arrowB.position.copy(vectorA); // B starts where A ends
            arrowB.setDirection(vectorB.clone().normalize()); 
            arrowB.setLength(vectorB.length(), 0.6, 0.4); 
        }
        
        // Update resultant arrow (from origin to final tip)
        if (res.length() > 0.01) { 
            arrowR.position.copy(origin);
            arrowR.setDirection(res.clone().normalize()); 
            arrowR.setLength(res.length(), 0.7, 0.5); 
        }

        // Update tip markers
        tipA.position.copy(vectorA);
        tipB.position.copy(res); // B tip is at the final position (A + B)
        tipR.position.copy(res);

        // Update dashed parallelogram lines
        dashedGeom1.setFromPoints([origin, vectorB.clone()]);
        dashedLine1.computeLineDistances();
        
        dashedGeom2.setFromPoints([vectorA.clone(), res.clone()]);
        dashedLine2.computeLineDistances();

        // Update stats
        controlsContainer.querySelector('#magA').textContent = vectorA.length().toFixed(2);
        controlsContainer.querySelector('#magB').textContent = vectorB.length().toFixed(2);
        controlsContainer.querySelector('#magR').textContent = res.length().toFixed(2);
        
        // Update readout with visual representation
        controlsContainer.querySelector('#vectorReadout').innerHTML = `
            <strong style="color:#22d3ee">A</strong> = (${vectorA.x.toFixed(1)}, ${vectorA.y.toFixed(1)}, ${vectorA.z.toFixed(1)})<br>
            <strong style="color:#f97316">B</strong> = (${vectorB.x.toFixed(1)}, ${vectorB.y.toFixed(1)}, ${vectorB.z.toFixed(1)})<br>
            <strong style="color:#10b981">R = A + B</strong> = (${res.x.toFixed(1)}, ${res.y.toFixed(1)}, ${res.z.toFixed(1)})
        `;
    }

    controlsContainer.querySelectorAll('input[type="range"]').forEach(inp => inp.addEventListener('input', updateVectors));
    updateVectors();
    overlayEl.innerHTML += `<span class="sim-badge">⛓️ Tail-to-Tip Method</span><span class="sim-badge">📐 3D Vectors</span>`;

    return () => {
        scene.remove(arrowA, arrowB, arrowR, tipA, tipB, tipR, dashedLine1, dashedLine2, originSphere);
    };
}

function initRelativeMotionSim(engine, controlsContainer, overlayEl) {
    const { scene, camera } = engine;
    
    // Position camera for better view
    camera.position.set(0, 8, 16);
    camera.lookAt(0, 1, 0);

    // Create detailed train (Object A)
    const trainGroup = new THREE.Group();
    // Train body
    const trainBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.2, 1.0),
        new THREE.MeshStandardMaterial({ 
            color: 0x22d3ee, 
            emissive: 0x22d3ee, 
            emissiveIntensity: 0.2,
            metalness: 0.7,
            roughness: 0.3 
        })
    );
    trainBody.position.y = 0.6;
    trainGroup.add(trainBody);
    
    // Train front (cabin)
    const trainFront = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.8, 0.9),
        new THREE.MeshStandardMaterial({ 
            color: 0x0ea5e9, 
            metalness: 0.8, 
            roughness: 0.2 
        })
    );
    trainFront.position.set(1.5, 0.8, 0);
    trainGroup.add(trainFront);
    
    // Train wheels
    for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.15, 16),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.1 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(-0.8 + i * 0.8, 0.18, 0.6);
        trainGroup.add(wheel);
    }
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

    // Enhanced road with lane markings
    const roadGeometry = new THREE.PlaneGeometry(40, 5.5);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e293b, 
        roughness: 0.95,
        metalness: 0.05
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.005;
    road.receiveShadow = true;
    scene.add(road);
    
    // Lane dividers (dashed lines)
    for (let i = -15; i < 15; i += 2) {
        const dash = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 0.15),
            new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
        );
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(i, 0.02, 0);
        scene.add(dash);
    }
    
    // Center line
    const centerLine = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xfef3c7 })
    );
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.015;
    scene.add(centerLine);

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
        <div class="game-panel sim-controls-panel gamified-dark">
            <div class="game-section-title gamified-header"><i class="fas fa-sync-alt"></i> 🎮 Relative Motion</div>
            <div class="sim-control-row gamified-control">
                <label>🚂 Train Speed</label>
                <input class="sim-slider gamified-slider" id="relVA" type="range" min="0" max="10" value="4" step="0.5">
                <span class="sim-slider-val gamified-value" id="relVAVal">4 m/s</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>🚗 Car Speed</label>
                <input class="sim-slider gamified-slider" id="relVB" type="range" min="0" max="10" value="6" step="0.5">
                <span class="sim-slider-val gamified-value" id="relVBVal">6 m/s</span>
            </div>
            <div class="sim-control-row gamified-control" style="margin-top: 12px;">
                <label style="min-width: 100%;">👁️ Observer Frame</label>
                <select class="game-select gamified-select" id="relFrame" style="width: 100%; margin-top: 8px;">
                    <option value="ground">🌍 Ground (Stationary)</option>
                    <option value="a">🚂 Train Reference</option>
                    <option value="b">🚗 Car Reference</option>
                </select>
            </div>
            <div class="sim-stats-grid gamified-stats" style="margin-top:12px;">
                <div class="sim-stat-card gamified-stat">
                    <div class="sim-stat-label">Relative Velocity</div>
                    <div class="sim-stat-value" id="relVelVal">--</div>
                    <div class="sim-stat-unit">m/s</div>
                </div>
            </div>
            <div class="sim-status gamified-result" id="relInfo" style="margin-top: 12px;"></div>
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
        if (Math.abs(relVel) > 0.01) {
            relArrow.setDirection(new THREE.Vector3(relVel >= 0 ? 1 : -1, 0, 0));
            relArrow.setLength(Math.min(5, Math.abs(relVel) * 0.8 + 0.5));
        }
        relArrow.position.set(carA.position.x, 1.2, carA.position.z);
    }

    engine.setUpdate(update);
    overlayEl.innerHTML += `<span class="sim-badge">🔄 Frame Switching</span>`;

    return () => {
        scene.remove(carA, carB, relArrow, lane1, lane2);
    };
}

function initLawsMotionSim(engine, controlsContainer, overlayEl) {
    const { scene, camera } = engine;
    
    // Better camera angle
    camera.position.set(0, 5, 14);
    camera.lookAt(0, 1, 0);

    // Enhanced surface with texture-like appearance
    const surface = new THREE.Mesh(
        new THREE.BoxGeometry(24, 0.3, 4), 
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
    const gridHelper = new THREE.GridHelper(24, 24, 0x475569, 0x475569);
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
        <div class="game-panel sim-controls-panel gamified-dark">
            <div class="game-section-title gamified-header"><i class="fas fa-bolt"></i> ⚖️ Newton's Laws</div>
            <div class="sim-control-row gamified-control">
                <label>⬅➡ Applied Force</label>
                <input class="sim-slider gamified-slider" id="forceInput" type="range" min="-20" max="20" value="10">
                <span class="sim-slider-val gamified-value" id="forceVal">10 N</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>⚖️ Mass</label>
                <input class="sim-slider gamified-slider" id="massInput" type="range" min="1" max="10" value="4">
                <span class="sim-slider-val gamified-value" id="massVal">4 kg</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>🧊 Friction Coefficient (μ)</label>
                <input class="sim-slider gamified-slider" id="frictionInput" type="range" min="0" max="0.9" value="0.2" step="0.05">
                <span class="sim-slider-val gamified-value" id="fricVal">0.20</span>
            </div>
            <div class="sim-stats-grid gamified-stats">
                <div class="sim-stat-card gamified-stat">
                    <div class="sim-stat-label">🟢 Acceleration</div>
                    <div class="sim-stat-value" id="accVal">--</div>
                    <div class="sim-stat-unit">m/s²</div>
                </div>
                <div class="sim-stat-card gamified-stat">
                    <div class="sim-stat-label">💨 Velocity</div>
                    <div class="sim-stat-value" id="velDisplay">--</div>
                    <div class="sim-stat-unit">m/s</div>
                </div>
                <div class="sim-stat-card gamified-stat">
                    <div class="sim-stat-label">⚡ Net Force</div>
                    <div class="sim-stat-value" id="netFVal">--</div>
                    <div class="sim-stat-unit">N</div>
                </div>
            </div>
            <div class="sim-status gamified-result" id="lawsInfo" style="margin-top: 12px;"></div>
            <button class="btn-primary sim-action-btn gamified-btn" id="resetLawsBtn"><i class="fas fa-redo"></i> Reset</button>
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
        if (position > 10) position = -10;
        if (position < -10) position = 10;
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

    // Enhanced track with more dramatic curves
    const trackPoints = [
        new THREE.Vector3(-14, 12, 0),
        new THREE.Vector3(-12, 12, 1),
        new THREE.Vector3(-8, 2.5, 2),
        new THREE.Vector3(-5, 10, 0),
        new THREE.Vector3(-2, 1.8, -1),
        new THREE.Vector3(1, 8, 1),
        new THREE.Vector3(4, 1.2, 0),
        new THREE.Vector3(7, 6, -1),
        new THREE.Vector3(10, 2, 0),
        new THREE.Vector3(12, 5, 1),
        new THREE.Vector3(14, 3, 0)
    ];
    const curve = new THREE.CatmullRomCurve3(trackPoints, false, 'catmullrom', 0.4);

    // Ground platform
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(32, 32),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Track supports with realistic structure
    const supportMat = new THREE.MeshStandardMaterial({ 
        color: 0x64748b, 
        metalness: 0.7, 
        roughness: 0.4 
    });
    const supports = [];
    for (let i = 0; i <= 1; i += 0.08) {
        const p = curve.getPointAt(i);
        if (p.y > 1.5) {
            // Main pillar
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.15, p.y, 8), 
                supportMat
            );
            pillar.position.set(p.x, p.y / 2, p.z);
            pillar.castShadow = true;
            scene.add(pillar);
            supports.push(pillar);
            
            // Support base
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.3, 0.3, 8),
                supportMat
            );
            base.position.set(p.x, 0.15, p.z);
            scene.add(base);
            supports.push(base);
        }
    }

    // Track rails (dual rails for realism)
    const tubeGeometry1 = new THREE.TubeGeometry(curve, 240, 0.12, 12, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x38bdf8, 
        metalness: 0.8, 
        roughness: 0.2,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.1
    });
    const track1 = new THREE.Mesh(tubeGeometry1, tubeMaterial);
    track1.castShadow = true;
    scene.add(track1);

    // Detailed cart
    const cartGroup = new THREE.Group();
    
    // Cart body
    const cartBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.6, 0.7), 
        new THREE.MeshStandardMaterial({ 
            color: 0xf59e0b, 
            emissive: 0xf59e0b, 
            emissiveIntensity: 0.4, 
            metalness: 0.6,
            roughness: 0.3
        })
    );
    cartBody.castShadow = true;
    cartGroup.add(cartBody);
    
    // Cart roof
    const cartRoof = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.2, 0.65),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7 })
    );
    cartRoof.position.y = 0.4;
    cartGroup.add(cartRoof);
    
    // Cart wheels
    for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
        );
        wheel.rotation.z = Math.PI / 2;
        const xPos = i < 2 ? -0.5 : 0.5;
        const zPos = i % 2 === 0 ? 0.4 : -0.4;
        wheel.position.set(xPos, -0.4, zPos);
        cartGroup.add(wheel);
    }
    
    scene.add(cartGroup);

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel gamified-dark">
            <div class="game-section-title gamified-header"><i class="fas fa-chart-area"></i> 🎢 Energy Conservation</div>
            <canvas class="sim-graph" id="energyGraph" width="300" height="160" style="border-radius: 8px; background: #0f1419;"></canvas>
            <div class="sim-stats-grid gamified-stats" style="margin-top: 12px;">
                <div class="sim-stat-card gamified-stat" style="border-left:3px solid #38bdf8">
                    <div class="sim-stat-label">⛰️ Potential Energy</div>
                    <div class="sim-stat-value" id="peVal">--</div>
                    <div class="sim-stat-unit">J</div>
                </div>
                <div class="sim-stat-card gamified-stat" style="border-left:3px solid #f59e0b">
                    <div class="sim-stat-label">⚡ Kinetic Energy</div>
                    <div class="sim-stat-value" id="keVal">--</div>
                    <div class="sim-stat-unit">J</div>
                </div>
                <div class="sim-stat-card gamified-stat" style="border-left:3px solid #10b981">
                    <div class="sim-stat-label">💨 Speed</div>
                    <div class="sim-stat-value" id="speedVal">--</div>
                    <div class="sim-stat-unit">m/s</div>
                </div>
                <div class="sim-stat-card gamified-stat" style="border-left:3px solid #a855f7">
                    <div class="sim-stat-label">🎯 Total Energy</div>
                    <div class="sim-stat-value" id="totalEVal">--</div>
                    <div class="sim-stat-unit">J</div>
                </div>
            </div>
            <div class="sim-status gamified-result" id="coasterInfo" style="margin-top: 12px;"></div>
            <button class="btn-primary sim-action-btn gamified-btn" id="resetCoasterBtn"><i class="fas fa-redo"></i> Restart</button>
        </div>
    `;
    
    const graph = controlsContainer.querySelector('#energyGraph');
    const ctx = graph.getContext('2d');
    const coasterInfoEl = controlsContainer.querySelector('#coasterInfo');

    // Physics-based motion
    const g = 9.8;
    const mass = 1.5;
    const maxH = 12;
    let arcPos = 0;
    let speed = 0;
    const totalLen = curve.getLength();

    const peHistory = [];
    const keHistory = [];
    
    function update() {
        // Get current height and slope
        const pos = curve.getPointAt(arcPos);
        const tangent = curve.getTangentAt(arcPos);
        const slopeAngle = Math.asin(Math.max(-1, Math.min(1, tangent.y)));

        // a = -g * sin(slope) along the track
        const accel = -g * Math.sin(slopeAngle);
        speed += accel * 0.016;
        speed *= 0.9992; // minimal friction

        // Advance arc position
        arcPos += (speed * 0.016) / totalLen;
        if (arcPos > 0.99) { arcPos = 0.01; speed = 1.0; }
        if (arcPos < 0.01) { arcPos = 0.99; speed = -1.0; }

        const newPos = curve.getPointAt(Math.max(0.001, Math.min(0.999, arcPos)));
        cartGroup.position.copy(newPos);
        cartGroup.position.y += 0.3;

        // Orient cart along track
        const lookTarget = curve.getPointAt(Math.min(0.999, arcPos + 0.01));
        cartGroup.lookAt(lookTarget);
        
        // Rotate wheels based on speed
        cartGroup.children.forEach((child, i) => {
            if (i >= 3) { // wheels are last 4 children
                child.rotation.x += speed * 0.1;
            }
        });

        const h = newPos.y;
        const pe = mass * g * h;
        const ke = 0.5 * mass * speed * speed;
        const totalE = pe + ke;

        controlsContainer.querySelector('#peVal').textContent = pe.toFixed(1);
        controlsContainer.querySelector('#keVal').textContent = ke.toFixed(1);
        controlsContainer.querySelector('#speedVal').textContent = Math.abs(speed).toFixed(2);
        controlsContainer.querySelector('#totalEVal').textContent = totalE.toFixed(1);
        
        // Store energy history for graph
        peHistory.push(pe);
        keHistory.push(ke);
        if (peHistory.length > 60) {
            peHistory.shift();
            keHistory.shift();
        }
        
        // Status message
        if (h > 8) {
            coasterInfoEl.innerHTML = `<strong style="color: #38bdf8;">⛰️ High altitude!</strong> Maximum potential energy`;
        } else if (h < 3 && Math.abs(speed) > 4) {
            coasterInfoEl.innerHTML = `<strong style="color: #f59e0b;">⚡ Maximum speed!</strong> Kinetic energy peak`;
        } else if (Math.abs(speed) < 2) {
            coasterInfoEl.innerHTML = `<strong style="color: #fbbf24;">🔄 Converting...</strong> PE → KE transition`;
        } else {
            coasterInfoEl.innerHTML = `<strong style="color: #10b981;">✓ Energy conserved:</strong> ${totalE.toFixed(1)} J`;
        }
        
        drawEnergyGraph(peHistory, keHistory);
    }

    function drawEnergyGraph(peHist, keHist) {
        const w = graph.width;
        const hgt = graph.height;
        
        // Clear with dark background
        ctx.fillStyle = '#0f1419';
        ctx.fillRect(0, 0, w, hgt);
        
        // Draw grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (hgt / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        
        // Title
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('Energy Over Time', 10, 15);
        
        if (peHist.length < 2) return;
        
        const maxE = Math.max(...peHist, ...keHist, 1);
        const step = w / (peHist.length - 1);
        
        // Draw PE line
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        peHist.forEach((pe, i) => {
            const x = i * step;
            const y = hgt - 10 - ((pe / maxE) * (hgt - 30));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Draw KE line
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        keHist.forEach((ke, i) => {
            const x = i * step;
            const y = hgt - 10 - ((ke / maxE) * (hgt - 30));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Legend
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(10, hgt - 30, 15, 8);
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.fillText('PE', 30, hgt - 22);
        
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(60, hgt - 30, 15, 8);
        ctx.fillStyle = '#fff';
        ctx.fillText('KE', 80, hgt - 22);
    }

    // Start with initial speed from the top
    speed = 2.5;
    arcPos = 0.02;
    
    controlsContainer.querySelector('#resetCoasterBtn').addEventListener('click', () => {
        speed = 2.5;
        arcPos = 0.02;
        peHistory.length = 0;
        keHistory.length = 0;
    });

    engine.setUpdate(update);
    overlayEl.innerHTML += `<span class="sim-badge">🎢 Realistic Physics</span><span class="sim-badge">⚡ Energy Conservation</span>`;

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
        <div class="game-panel sim-controls-panel gamified-dark">
            <div class="game-section-title gamified-header"><i class="fas fa-atom"></i> 🎮 Atomic Orbitals</div>
            <select class="game-select gamified-select" id="orbitalType">
                <option value="1s">1s - Spherical</option>
                <option value="2s">2s - Larger Sphere</option>
                <option value="2p">2p - Dumbbell</option>
                <option value="3d">3d - Cloverleaf</option>
            </select>
            <div class="sim-control-row gamified-control">
                <label>💎 Opacity</label>
                <input class="sim-slider gamified-slider" id="orbitalOpacity" type="range" min="20" max="85" value="50">
                <span class="sim-slider-val gamified-value" id="opacVal">50%</span>
            </div>
            <div class="sim-control-row gamified-control">
                <label>✨ Detail Level</label>
                <input class="sim-slider gamified-slider" id="orbitalDetail" type="range" min="16" max="64" value="48" step="8">
                <span class="sim-slider-val gamified-value" id="detailVal">48</span>
            </div>
            <div class="sim-status gamified-result" id="orbitalInfo"></div>
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
            info = '1s: Spherical, 1 node surface = 0';
        } else if (type === '2s') {
            orbitalGroup.add(createLobe(3, 3, 3, 0x8b5cf6, [0, 0, 0]));
            orbitalGroup.add(createLobe(1.2, 1.2, 1.2, 0xc084fc, [0, 0, 0]));
            info = '2s: Spherical with 1 radial node';
        } else if (type === '2p') {
            // Two lobes along Y axis (dumbbell)
            orbitalGroup.add(createLobe(1.2, 2.5, 1.2, 0x22d3ee, [0, 2, 0]));
            orbitalGroup.add(createLobe(1.2, 2.5, 1.2, 0xf97316, [0, -2, 0]));
            info = '2p: Dumbbell shape, 1 angular node (plane)';
        } else if (type === '3d') {
            // Four lobes in XY plane (cloverleaf)
            orbitalGroup.add(createLobe(1.5, 1.5, 0.8, 0x22d3ee, [2, 2, 0]));
            orbitalGroup.add(createLobe(1.5, 1.5, 0.8, 0xf97316, [-2, -2, 0]));
            orbitalGroup.add(createLobe(1.5, 1.5, 0.8, 0x22d3ee, [2, -2, 0]));
            orbitalGroup.add(createLobe(1.5, 1.5, 0.8, 0xf97316, [-2, 2, 0]));
            info = '3d: Cloverleaf, 2 angular nodal planes';
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
    molGroup.position.y = 5; // Elevated above grid
    scene.add(molGroup);

    const central = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 32, 32), 
        new THREE.MeshStandardMaterial({ 
            color: 0xec4899, 
            emissive: 0xec4899, 
            emissiveIntensity: 0.3,
            metalness: 0.4,
            roughness: 0.3
        })
    );
    molGroup.add(central);
    const atoms = [];
    const bonds = [];

    controlsContainer.innerHTML = `
        <div class="game-panel sim-controls-panel gamified-dark">
            <div class="game-section-title gamified-header"><i class="fas fa-project-diagram"></i> 🎮 VSEPR Geometry</div>
            <select class="game-select gamified-select" id="vseprShape">
                <option value="linear">Linear (2 atoms)</option>
                <option value="trigonal">Trigonal Planar (3)</option>
                <option value="tetra" selected>Tetrahedral (4)</option>
                <option value="bipyramidal">Trigonal Bipyramidal (5)</option>
                <option value="octa">Octahedral (6)</option>
            </select>
            <div class="sim-stats-grid gamified-stats" style="margin-top:10px;">
                <div class="sim-stat-card gamified-stat"><div class="sim-stat-label">Bond Angle</div><div class="sim-stat-value" id="vseprAngle">--</div><div class="sim-stat-unit">°</div></div>
                <div class="sim-stat-card gamified-stat"><div class="sim-stat-label">Atoms</div><div class="sim-stat-value" id="vseprCount">--</div></div>
            </div>
            <div class="sim-status gamified-result" id="vseprInfo" style="margin-top:12px;"></div>
        </div>
    `;

    const shapeSelect = controlsContainer.querySelector('#vseprShape');
    const angleEl = controlsContainer.querySelector('#vseprAngle');
    const countEl = controlsContainer.querySelector('#vseprCount');
    const infoEl = controlsContainer.querySelector('#vseprInfo');

    function setShape(shape) {
        atoms.forEach(a => molGroup.remove(a));
        bonds.forEach(b => molGroup.remove(b));
        atoms.length = 0;
        bonds.length = 0;

        const positions = [];
        let angleInfo = '';
        let example = '';
        const R = 3; // bond length

        if (shape === 'linear') {
            positions.push([R, 0, 0], [-R, 0, 0]);
            angleInfo = '180'; example = 'e.g. CO₂, BeCl₂';
        } else if (shape === 'trigonal') {
            for (let i = 0; i < 3; i++) {
                const a = (i * 2 * Math.PI) / 3;
                positions.push([R * Math.cos(a), 0, R * Math.sin(a)]);
            }
            angleInfo = '120'; example = 'e.g. BF₃, AlCl₃';
        } else if (shape === 'tetra') {
            // Tetrahedral vertices
            positions.push([1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]);
            positions.forEach(p => { p[0] *= R / 1.73; p[1] *= R / 1.73; p[2] *= R / 1.73; });
            angleInfo = '109.5'; example = 'e.g. CH₄, NH₄⁺';
        } else if (shape === 'bipyramidal') {
            for (let i = 0; i < 3; i++) {
                const a = (i * 2 * Math.PI) / 3;
                positions.push([R * Math.cos(a), 0, R * Math.sin(a)]);
            }
            positions.push([0, R, 0], [0, -R, 0]);
            angleInfo = '90/120'; example = 'e.g. PCl₅';
        } else {
            positions.push([R, 0, 0], [-R, 0, 0], [0, R, 0], [0, -R, 0], [0, 0, R], [0, 0, -R]);
            angleInfo = '90'; example = 'e.g. SF₆';
        }

        positions.forEach(pos => {
            const atom = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 24), new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 0.15 }));
            atom.position.set(pos[0], pos[1], pos[2]);
            atoms.push(atom);
            molGroup.add(atom);

            // Bond line from center to atom
            const bondGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(pos[0], pos[1], pos[2])]);
            const bond = new THREE.Line(bondGeom, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
            bonds.push(bond);
            molGroup.add(bond);
        });

        angleEl.textContent = angleInfo;
        countEl.textContent = positions.length;
        infoEl.textContent = example;
    }

    shapeSelect.addEventListener('change', () => setShape(shapeSelect.value));
    setShape('tetra');

    // Slow rotation
    engine.setUpdate(() => { molGroup.rotation.y += 0.005; });
    overlayEl.innerHTML += `<span class="sim-badge">🔗 Bond Angles</span>`;

    return () => {
        atoms.forEach(a => molGroup.remove(a));
        bonds.forEach(b => molGroup.remove(b));
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

    const colors = [0x8b5cf6, 0x22d3ee, 0xf97316, 0x10b981];

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
        } else {
            // Tetrahedral
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

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGames);
} else {
    initGames();
}
