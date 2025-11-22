// Poker Logic Engine - חישוב הסתברויות פוקר

// Constants
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const HAND_RANKINGS = {
    HIGH_CARD: 1,
    PAIR: 2,
    TWO_PAIR: 3,
    THREE_OF_KIND: 4,
    STRAIGHT: 5,
    FLUSH: 6,
    FULL_HOUSE: 7,
    FOUR_OF_KIND: 8,
    STRAIGHT_FLUSH: 9,
    ROYAL_FLUSH: 10
};

const HAND_NAMES_HE = {
    [HAND_RANKINGS.HIGH_CARD]: 'קלף גבוה',
    [HAND_RANKINGS.PAIR]: 'זוג',
    [HAND_RANKINGS.TWO_PAIR]: 'שני זוגות',
    [HAND_RANKINGS.THREE_OF_KIND]: 'שלישייה',
    [HAND_RANKINGS.STRAIGHT]: 'רצף',
    [HAND_RANKINGS.FLUSH]: 'צבע',
    [HAND_RANKINGS.FULL_HOUSE]: 'בית מלא',
    [HAND_RANKINGS.FOUR_OF_KIND]: 'רביעייה',
    [HAND_RANKINGS.STRAIGHT_FLUSH]: 'רצף צבע',
    [HAND_RANKINGS.ROYAL_FLUSH]: 'רויאל פלאש'
};

// Card class
class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
        this.value = RANK_VALUES[rank];
    }

    toString() {
        return `${this.rank}${this.suit}`;
    }

    equals(other) {
        return this.rank === other.rank && this.suit === other.suit;
    }
}

// Deck class
class Deck {
    constructor(excludeCards = []) {
        this.cards = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                const card = new Card(rank, suit);
                const isExcluded = excludeCards.some(c => c.equals(card));
                if (!isExcluded) {
                    this.cards.push(card);
                }
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(n) {
        return this.cards.splice(0, n);
    }
}

// Hand Evaluator
class HandEvaluator {
    static evaluateHand(cards) {
        if (cards.length < 5) {
            return { ranking: HAND_RANKINGS.HIGH_CARD, name: HAND_NAMES_HE[HAND_RANKINGS.HIGH_CARD] };
        }

        // Get best 5-card combination from available cards
        const bestHand = this.getBestFiveCardHand(cards);
        return bestHand;
    }

    static getBestFiveCardHand(cards) {
        if (cards.length === 5) {
            return this.evaluate5Cards(cards);
        }

        // Try all combinations of 5 cards
        let bestHand = { ranking: 0, value: 0 };
        const combinations = this.getCombinations(cards, 5);

        for (const combo of combinations) {
            const handResult = this.evaluate5Cards(combo);
            if (handResult.ranking > bestHand.ranking ||
                (handResult.ranking === bestHand.ranking && handResult.value > bestHand.value)) {
                bestHand = handResult;
            }
        }

        return bestHand;
    }

    static evaluate5Cards(cards) {
        const sorted = [...cards].sort((a, b) => b.value - a.value);

        // Check for flush
        const isFlush = cards.every(c => c.suit === cards[0].suit);

        // Check for straight
        const straightResult = this.checkStraight(sorted);
        const isStraight = straightResult.isStraight;

        // Royal Flush
        if (isFlush && isStraight && sorted[0].rank === 'A' && sorted[1].rank === 'K') {
            return {
                ranking: HAND_RANKINGS.ROYAL_FLUSH,
                name: HAND_NAMES_HE[HAND_RANKINGS.ROYAL_FLUSH],
                value: straightResult.highCard
            };
        }

        // Straight Flush
        if (isFlush && isStraight) {
            return {
                ranking: HAND_RANKINGS.STRAIGHT_FLUSH,
                name: HAND_NAMES_HE[HAND_RANKINGS.STRAIGHT_FLUSH],
                value: straightResult.highCard
            };
        }

        // Count rank occurrences
        const rankCounts = this.countRanks(sorted);
        const counts = Object.values(rankCounts).sort((a, b) => b - a);

        // Four of a Kind
        if (counts[0] === 4) {
            return {
                ranking: HAND_RANKINGS.FOUR_OF_KIND,
                name: HAND_NAMES_HE[HAND_RANKINGS.FOUR_OF_KIND],
                value: this.getKickerValue(rankCounts, [4])
            };
        }

        // Full House
        if (counts[0] === 3 && counts[1] === 2) {
            return {
                ranking: HAND_RANKINGS.FULL_HOUSE,
                name: HAND_NAMES_HE[HAND_RANKINGS.FULL_HOUSE],
                value: this.getKickerValue(rankCounts, [3, 2])
            };
        }

        // Flush
        if (isFlush) {
            return {
                ranking: HAND_RANKINGS.FLUSH,
                name: HAND_NAMES_HE[HAND_RANKINGS.FLUSH],
                value: sorted[0].value
            };
        }

        // Straight
        if (isStraight) {
            return {
                ranking: HAND_RANKINGS.STRAIGHT,
                name: HAND_NAMES_HE[HAND_RANKINGS.STRAIGHT],
                value: straightResult.highCard
            };
        }

        // Three of a Kind
        if (counts[0] === 3) {
            return {
                ranking: HAND_RANKINGS.THREE_OF_KIND,
                name: HAND_NAMES_HE[HAND_RANKINGS.THREE_OF_KIND],
                value: this.getKickerValue(rankCounts, [3])
            };
        }

        // Two Pair
        if (counts[0] === 2 && counts[1] === 2) {
            return {
                ranking: HAND_RANKINGS.TWO_PAIR,
                name: HAND_NAMES_HE[HAND_RANKINGS.TWO_PAIR],
                value: this.getKickerValue(rankCounts, [2, 2])
            };
        }

        // Pair
        if (counts[0] === 2) {
            return {
                ranking: HAND_RANKINGS.PAIR,
                name: HAND_NAMES_HE[HAND_RANKINGS.PAIR],
                value: this.getKickerValue(rankCounts, [2])
            };
        }

        // High Card
        return {
            ranking: HAND_RANKINGS.HIGH_CARD,
            name: HAND_NAMES_HE[HAND_RANKINGS.HIGH_CARD],
            value: sorted[0].value
        };
    }

    static checkStraight(sortedCards) {
        // Check regular straight
        let isStraight = true;
        for (let i = 0; i < sortedCards.length - 1; i++) {
            if (sortedCards[i].value - sortedCards[i + 1].value !== 1) {
                isStraight = false;
                break;
            }
        }

        if (isStraight) {
            return { isStraight: true, highCard: sortedCards[0].value };
        }

        // Check A-2-3-4-5 straight (wheel)
        if (sortedCards[0].rank === 'A' && sortedCards[1].rank === '5' &&
            sortedCards[2].rank === '4' && sortedCards[3].rank === '3' &&
            sortedCards[4].rank === '2') {
            return { isStraight: true, highCard: 5 }; // In wheel, 5 is high
        }

        return { isStraight: false, highCard: 0 };
    }

    static countRanks(cards) {
        const counts = {};
        for (const card of cards) {
            counts[card.rank] = (counts[card.rank] || 0) + 1;
        }
        return counts;
    }

    static getKickerValue(rankCounts, pattern) {
        let value = 0;
        const sortedRanks = Object.entries(rankCounts)
            .sort((a, b) => {
                if (b[1] !== a[1]) return b[1] - a[1];
                return RANK_VALUES[b[0]] - RANK_VALUES[a[0]];
            });

        for (const [rank, count] of sortedRanks) {
            value = value * 15 + RANK_VALUES[rank];
        }
        return value;
    }

    static getCombinations(arr, k) {
        if (k === 1) return arr.map(item => [item]);
        if (k === arr.length) return [arr];

        const combinations = [];
        for (let i = 0; i <= arr.length - k; i++) {
            const head = arr[i];
            const tailCombos = this.getCombinations(arr.slice(i + 1), k - 1);
            for (const combo of tailCombos) {
                combinations.push([head, ...combo]);
            }
        }
        return combinations;
    }

    static compareHands(hand1, hand2) {
        if (hand1.ranking !== hand2.ranking) {
            return hand1.ranking - hand2.ranking;
        }
        return hand1.value - hand2.value;
    }
}

// Odds Calculator using Monte Carlo simulation
class OddsCalculator {
    static calculateOdds(playerCards, communityCards, numOpponents, numSimulations = 10000) {
        if (playerCards.length !== 2) {
            throw new Error('Player must have exactly 2 cards');
        }

        let wins = 0;
        let ties = 0;
        const allKnownCards = [...playerCards, ...communityCards];

        for (let i = 0; i < numSimulations; i++) {
            const result = this.simulateHand(playerCards, communityCards, numOpponents);
            if (result === 'win') wins++;
            else if (result === 'tie') ties++;
        }

        const winRate = ((wins + ties / 2) / numSimulations) * 100;

        return {
            winRate: winRate.toFixed(1),
            wins: wins,
            ties: ties,
            losses: numSimulations - wins - ties,
            simulations: numSimulations
        };
    }

    static simulateHand(playerCards, communityCards, numOpponents) {
        // Create deck without known cards
        const allKnownCards = [...playerCards, ...communityCards];
        const deck = new Deck(allKnownCards);
        deck.shuffle();

        // Complete community cards if needed
        const finalCommunity = [...communityCards];
        const cardsNeeded = 5 - communityCards.length;
        if (cardsNeeded > 0) {
            finalCommunity.push(...deck.deal(cardsNeeded));
        }

        // Evaluate player hand
        const playerHand = HandEvaluator.evaluateHand([...playerCards, ...finalCommunity]);

        // Deal and evaluate opponent hands
        let bestOpponentHand = null;
        for (let i = 0; i < numOpponents; i++) {
            const opponentCards = deck.deal(2);
            const opponentHand = HandEvaluator.evaluateHand([...opponentCards, ...finalCommunity]);

            if (!bestOpponentHand || HandEvaluator.compareHands(opponentHand, bestOpponentHand) > 0) {
                bestOpponentHand = opponentHand;
            }
        }

        // Compare hands
        const comparison = HandEvaluator.compareHands(playerHand, bestOpponentHand);
        if (comparison > 0) return 'win';
        if (comparison === 0) return 'tie';
        return 'loss';
    }

    static analyzeHand(playerCards, communityCards) {
        if (playerCards.length !== 2) {
            return null;
        }

        const allCards = [...playerCards, ...communityCards];
        if (allCards.length < 2) {
            return null;
        }

        const currentHand = HandEvaluator.evaluateHand(allCards);

        // Detect draws
        const draws = this.detectDraws(allCards, communityCards.length);

        return {
            currentHand: currentHand,
            draws: draws
        };
    }

    static detectDraws(cards, numCommunityCards) {
        if (numCommunityCards >= 5) {
            return []; // No more cards to come
        }

        const draws = [];

        // Check for flush draw (4 of same suit)
        const suitCounts = {};
        for (const card of cards) {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        }
        for (const [suit, count] of Object.entries(suitCounts)) {
            if (count === 4) {
                draws.push({ type: 'flush', suit: suit, outs: 9 });
            }
        }

        // Check for straight draw (open-ended or gutshot)
        const sorted = [...cards].sort((a, b) => b.value - a.value);
        const values = sorted.map(c => c.value);
        const uniqueValues = [...new Set(values)].sort((a, b) => b - a);

        // Simple check for open-ended straight draw (4 consecutive cards)
        for (let i = 0; i <= uniqueValues.length - 4; i++) {
            const slice = uniqueValues.slice(i, i + 4);
            const isConsecutive = slice.every((val, idx) => {
                if (idx === 0) return true;
                return slice[idx - 1] - val === 1;
            });

            if (isConsecutive) {
                // This is a simplified check
                draws.push({ type: 'straight', outs: 8 });
                break;
            }
        }

        return draws;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Card, Deck, HandEvaluator, OddsCalculator, SUITS, RANKS, HAND_RANKINGS };
}
