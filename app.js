// Application State
const state = {
    playerCards: [],
    communityCards: [],
    numPlayers: 4,
    hidePlayerCards: false,
    availableCards: [],
    calculating: false,
    gridStates: {
        playerGrid: true,  // collapsed by default
        communityGrid: true  // collapsed by default
    }
};

// Toggle card grid visibility
function toggleCardGrid(gridId) {
    const isPlayerGrid = gridId === 'playerGrid';
    const selector = isPlayerGrid ? 'playerCardSelector' : 'communityCardSelector';
    const icon = document.getElementById(isPlayerGrid ? 'playerGridIcon' : 'communityGridIcon');
    const grid = document.getElementById(selector);

    state.gridStates[gridId] = !state.gridStates[gridId];

    if (state.gridStates[gridId]) {
        grid.classList.add('collapsed');
        icon.textContent = '▼';
    } else {
        grid.classList.remove('collapsed');
        icon.textContent = '▲';
    }
}

// Change player count with stepper
function changePlayerCount(delta) {
    const newCount = state.numPlayers + delta;
    if (newCount >= 2 && newCount <= 10) {
        state.numPlayers = newCount;
        document.getElementById('numPlayersDisplay').textContent = newCount;

        // Update button states
        document.getElementById('decrementPlayers').disabled = newCount <= 2;
        document.getElementById('incrementPlayers').disabled = newCount >= 10;

        // Recalculate if we have cards
        if (state.playerCards.length === 2 && state.communityCards.length > 0) {
            calculateOdds();
        }
    }
}

// Initialize available cards
function initializeCards() {
    state.availableCards = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            state.availableCards.push(new Card(rank, suit));
        }
    }
}

// Get card color class
function getCardColor(suit) {
    return (suit === '♥' || suit === '♦') ? 'red' : 'black';
}

// Render card selector
function renderCardSelector(containerId, maxCards, selectedCards, otherSelectedCards) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    for (const card of state.availableCards) {
        const button = document.createElement('button');
        button.className = 'card-button ' + getCardColor(card.suit);
        button.textContent = card.toString();

        // Check if card is already selected
        const isSelected = selectedCards.some(c => c.equals(card));
        const isDisabled = otherSelectedCards.some(c => c.equals(card)) ||
            (!isSelected && selectedCards.length >= maxCards);

        if (isSelected) {
            button.classList.add('selected');
        }
        if (isDisabled) {
            button.classList.add('disabled');
        }

        button.onclick = () => toggleCardSelection(card, selectedCards, maxCards);
        container.appendChild(button);
    }
}

// Toggle card selection
function toggleCardSelection(card, selectedCards, maxCards) {
    const index = selectedCards.findIndex(c => c.equals(card));

    if (index !== -1) {
        // Deselect card
        selectedCards.splice(index, 1);
    } else if (selectedCards.length < maxCards) {
        // Select card
        selectedCards.push(card);
    }

    updateUI();
}

// Update selected cards display
function updateSelectedCardsDisplay(containerId, cards, maxCards, isHidden = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (isHidden) {
        container.classList.add('hidden');
    } else {
        container.classList.remove('hidden');
    }

    for (let i = 0; i < maxCards; i++) {
        if (i < cards.length) {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'selected-card ' + getCardColor(cards[i].suit);
            cardDiv.textContent = cards[i].toString();
            container.appendChild(cardDiv);
        } else {
            const emptySlot = document.createElement('div');
            emptySlot.className = 'empty-slot';
            container.appendChild(emptySlot);
        }
    }
}

// Update entire UI
function updateUI() {
    // Update card selectors
    renderCardSelector('playerCardSelector', 2, state.playerCards, state.communityCards);
    renderCardSelector('communityCardSelector', 5, state.communityCards, state.playerCards);

    // Update selected cards display
    updateSelectedCardsDisplay('playerCardsDisplay', state.playerCards, 2, state.hidePlayerCards);
    updateSelectedCardsDisplay('communityCardsDisplay', state.communityCards, 5, false);

    // Show/hide results section
    const hasMinimumCards = state.playerCards.length === 2;
    const resultsSection = document.getElementById('resultsSection');
    const initialBtn = document.getElementById('initialCalculateBtn');

    if (hasMinimumCards && state.communityCards.length > 0) {
        // Auto-calculate when cards change
        calculateOdds();
    }
}

// Calculate odds
async function calculateOdds() {
    if (state.playerCards.length !== 2) {
        return;
    }

    if (state.calculating) {
        return;
    }

    state.calculating = true;

    // Show loading state
    const calculateText = document.getElementById('calculateText') || document.getElementById('initialCalculateText');
    const calculateLoading = document.getElementById('calculateLoading') || document.getElementById('initialCalculateLoading');
    if (calculateText) calculateText.style.display = 'none';
    if (calculateLoading) calculateLoading.style.display = 'inline-block';

    // Show results section
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('initialCalculateBtn').style.display = 'none';

    // Use setTimeout to allow UI to update
    setTimeout(() => {
        try {
            // Calculate odds
            const numSimulations = state.communityCards.length === 5 ? 1000 : 5000;
            const odds = OddsCalculator.calculateOdds(
                state.playerCards,
                state.communityCards,
                state.numPlayers - 1,
                numSimulations
            );

            // Analyze current hand
            const analysis = OddsCalculator.analyzeHand(state.playerCards, state.communityCards);

            // Update results display
            document.getElementById('winPercentage').textContent = odds.winRate + '%';
            document.getElementById('currentHand').textContent = analysis.currentHand.name;

            // Show draw information if applicable
            const drawRow = document.getElementById('drawRow');
            const drawInfo = document.getElementById('drawInfo');
            if (analysis.draws && analysis.draws.length > 0) {
                const drawTexts = analysis.draws.map(d => {
                    if (d.type === 'flush') return `draw לצבע (${d.outs} קלפים)`;
                    if (d.type === 'straight') return `draw לרצף (${d.outs} קלפים)`;
                    return d.type;
                });
                drawInfo.textContent = drawTexts.join(', ');
                drawRow.style.display = 'flex';
            } else {
                drawRow.style.display = 'none';
            }

            // Color-code win percentage
            const winPct = parseFloat(odds.winRate);
            const winPercentageEl = document.getElementById('winPercentage');
            if (winPct >= 70) {
                winPercentageEl.style.color = 'var(--accent-green)';
            } else if (winPct >= 40) {
                winPercentageEl.style.color = 'var(--accent-gold)';
            } else {
                winPercentageEl.style.color = 'var(--accent-red)';
            }

            // Update Pot Odds & EV if pot/bet are set
            updateDecisionHelper(winPct);

        } catch (error) {
            console.error('Error calculating odds:', error);
            document.getElementById('winPercentage').textContent = 'שגיאה';
            document.getElementById('currentHand').textContent = 'לא ניתן לחשב';
        } finally {
            state.calculating = false;

            // Hide loading state
            if (calculateText) calculateText.style.display = 'inline';
            if (calculateLoading) calculateLoading.style.display = 'none';
        }
    }, 50);
}

// ===== POT ODDS & EV CALCULATOR =====

function calculatePotOdds() {
    const potSize = parseFloat(document.getElementById('potSize').value) || 0;
    const betSize = parseFloat(document.getElementById('betSize').value) || 0;

    if (betSize === 0) return null;

    const totalPot = potSize + betSize;
    const potOdds = (betSize / totalPot) * 100;

    return potOdds;
}

function calculateEV(winRate, potSize, betSize) {
    const totalPot = potSize + betSize;
    const winAmount = totalPot * (winRate / 100);
    const loseAmount = betSize * ((100 - winRate) / 100);

    return winAmount - loseAmount;
}

function updateDecisionHelper(winRate) {
    const potSize = parseFloat(document.getElementById('potSize').value) || 0;
    const betSize = parseFloat(document.getElementById('betSize').value) || 0;

    if (potSize === 0 || betSize === 0) {
        document.getElementById('decisionHelper').style.display = 'none';
        return;
    }

    const potOdds = calculatePotOdds();
    const ev = calculateEV(winRate, potSize, betSize);

    // Display
    document.getElementById('decisionHelper').style.display = 'block';
    document.getElementById('potOddsValue').textContent = potOdds.toFixed(1) + '%';
    document.getElementById('evValue').textContent = (ev >= 0 ? '+' : '') + ev.toFixed(2) + '₪';

    // Color EV
    const evEl = document.getElementById('evValue');
    evEl.style.color = ev >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';

    // Recommendation
    const recAction = document.getElementById('recAction');
    if (winRate >= potOdds) {
        recAction.textContent = 'CALL ✓';
        recAction.className = 'rec-action call';
    } else {
        recAction.textContent = 'FOLD ✗';
        recAction.className = 'rec-action fold';
    }
}

// ===== THEME SYSTEM =====

function setTheme(themeName) {
    document.body.className = themeName === 'default' ? '' : `theme-${themeName}`;
    localStorage.setItem('poker-theme', themeName);

    // Update active button
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
}

// ===== URL SHARING =====

function generateShareURL() {
    const params = new URLSearchParams();

    // Player cards
    if (state.playerCards.length > 0) {
        params.set('p', state.playerCards.map(c => c.toString()).join(','));
    }

    // Community cards
    if (state.communityCards.length > 0) {
        params.set('c', state.communityCards.map(c => c.toString()).join(','));
    }

    // Players
    params.set('n', state.numPlayers);

    // Pot info
    const potSize = document.getElementById('potSize')?.value;
    const betSize = document.getElementById('betSize')?.value;
    if (potSize && potSize !== '0') params.set('pot', potSize);
    if (betSize && betSize !== '0') params.set('bet', betSize);

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function parseCardFromString(cardStr) {
    // cardStr format: "A♠", "K♥", etc.
    if (cardStr.length < 2) return null;

    const rank = cardStr.slice(0, -1);
    const suit = cardStr.slice(-1);

    return new Card(rank, suit);
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);

    // Load player cards
    if (params.has('p')) {
        const cardStrs = params.get('p').split(',');
        state.playerCards = cardStrs.map(parseCardFromString).filter(c => c !== null);
    }

    // Load community cards
    if (params.has('c')) {
        const cardStrs = params.get('c').split(',');
        state.communityCards = cardStrs.map(parseCardFromString).filter(c => c !== null);
    }

    // Load players
    if (params.has('n')) {
        state.numPlayers = parseInt(params.get('n')) || 4;
        document.getElementById('numPlayersDisplay').textContent = state.numPlayers;
    }

    // Load pot info
    if (params.has('pot')) {
        document.getElementById('potSize').value = params.get('pot');
    }
    if (params.has('bet')) {
        document.getElementById('betSize').value = params.get('bet');
    }

    // Update UI if we loaded cards
    if (state.playerCards.length > 0 || state.communityCards.length > 0) {
        updateUI();
    }
}

async function copyShareLink() {
    const url = generateShareURL();
    try {
        await navigator.clipboard.writeText(url);
        showToast('✓ קישור הועתק!');
    } catch (err) {
        showToast('✗ שגיאה בהעתקה');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// Reset all
function resetAll() {
    state.playerCards = [];
    state.communityCards = [];
    state.numPlayers = 4;
    document.getElementById('numPlayersDisplay').textContent = 4;
    document.getElementById('decrementPlayers').disabled = false;
    document.getElementById('incrementPlayers').disabled = false;
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('initialCalculateBtn').style.display = 'flex';
    updateUI();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    initializeCards();

    // Load from URL if params exist
    loadFromURL();

    // If no cards loaded from URL, update UI normally
    if (state.playerCards.length === 0 && state.communityCards.length === 0) {
        updateUI();
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('poker-theme') || 'default';
    setTheme(savedTheme);

    // Initialize stepper button states
    document.getElementById('decrementPlayers').disabled = state.numPlayers <= 2;
    document.getElementById('incrementPlayers').disabled = state.numPlayers >= 10;

    // Hide cards toggle
    document.getElementById('hideCards').addEventListener('change', (e) => {
        state.hidePlayerCards = e.target.checked;
        updateSelectedCardsDisplay('playerCardsDisplay', state.playerCards, 2, state.hidePlayerCards);
    });

    // Theme button listeners
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });

    // Pot/Bet inputs - recalculate when changed
    ['potSize', 'betSize'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            if (state.playerCards.length === 2 && state.communityCards.length > 0) {
                calculateOdds();
            }
        });
    });

    // Calculate button
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateOdds);
    }

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAll);
    }
});

// Prevent zoom on double tap (iOS)
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// ===== PWA - SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/poker-odds-calculator/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}
