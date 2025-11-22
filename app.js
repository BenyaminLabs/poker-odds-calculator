// Application State
const state = {
    playerCards: [],
    communityCards: [],
    numPlayers: 4,
    hidePlayerCards: false,
    availableCards: [],
    calculating: false
};

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

// Reset all
function resetAll() {
    state.playerCards = [];
    state.communityCards = [];
    state.numPlayers = 4;
    document.getElementById('numPlayers').value = 4;
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('initialCalculateBtn').style.display = 'flex';
    updateUI();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    initializeCards();
    updateUI();

    // Hide cards toggle
    document.getElementById('hideCards').addEventListener('change', (e) => {
        state.hidePlayerCards = e.target.checked;
        updateSelectedCardsDisplay('playerCardsDisplay', state.playerCards, 2, state.hidePlayerCards);
    });

    // Number of players
    document.getElementById('numPlayers').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 2 && value <= 10) {
            state.numPlayers = value;
            if (state.playerCards.length === 2 && state.communityCards.length > 0) {
                calculateOdds();
            }
        }
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
