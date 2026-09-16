/**
 * Game Theory TikZ Studio - Strategic-Form Payoff Matrix Generator
 * Supports 2x2, 2x3, 3x2, 3x3, NxM bimatrix games.
 * Features:
 *  - Interactive cell editing with LaTeX math support
 *  - Player 1 & Player 2 best-response underlining
 *  - Automatic and manual Pure Strategy Nash Equilibrium (PNE) highlighting
 *  - Iterated Elimination of Strictly Dominated Strategies (IESDS strike-through)
 *  - Mixed strategy probability labels (p, 1-p, q, 1-q)
 *  - Diagonal player split header or standard side/top headers
 *  - Pure TikZ code export (\matrix of nodes) ready for Overleaf
 *  - Standard LaTeX tabular export
 *  - Canvas visual rendering and PNG/SVG export
 */

(function (window) {
  'use strict';

  // Game Matrix Data Model
  var matrixState = {
    title: "Prisoner's Dilemma",
    player1: {
      name: "Player 1",
      color: "#4f46e5",
      tikzColor: "indigo!80",
      strategies: ["Cooperate", "Defect"],
      probabilities: ["p", "1-p"]
    },
    player2: {
      name: "Player 2",
      color: "#0284c7",
      tikzColor: "cyan!80",
      strategies: ["Cooperate", "Defect"],
      probabilities: ["q", "1-q"]
    },
    // Grid payoffs: array of rows, each row has array of { u1, u2, p1Underline, p2Underline, isNE }
    cells: [
      [
        { u1: "3", u2: "3", p1Underline: false, p2Underline: false, isNE: false },
        { u1: "0", u2: "5", p1Underline: false, p2Underline: true, isNE: false }
      ],
      [
        { u1: "5", u2: "0", p1Underline: true, p2Underline: false, isNE: false },
        { u1: "1", u2: "1", p1Underline: true, p2Underline: true, isNE: true }
      ]
    ],
    // Eliminated strategies (IESDS)
    eliminatedRows: [], // indices of eliminated rows
    eliminatedCols: [], // indices of eliminated columns
    // Visual and styling preferences
    options: {
      showProbabilities: true,
      showDiagonalHeader: true,
      matrixStyle: "boxed", // "boxed", "brackets", "academic", "clean"
      autoHighlightNE: true,
      neHighlightColor: "#10b981", // emerald
      neBadge: true,
      cellPadding: 16,
      fontSize: 14,
      mathMode: true
    }
  };

  // Presets Library
  var MATRIX_PRESETS = {
    "prisoners-dilemma": {
      id: "prisoners-dilemma",
      name: "Prisoner's Dilemma",
      category: "Classic Dilemmas",
      subtitle: "Dominant Strategies & Social Dilemma",
      description: "Both players have a strictly dominant strategy to Defect, yielding a unique sub-optimal Nash Equilibrium at (Defect, Defect).",
      tags: ["2x2", "Dominant Strategy", "Inefficient NE", "Symmetric"],
      player1: { name: "Player 1", strategies: ["Cooperate (C)", "Defect (D)"], probabilities: ["p", "1-p"] },
      player2: { name: "Player 2", strategies: ["Cooperate (C)", "Defect (D)"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "3", u2: "3" }, { u1: "0", u2: "5" }],
        [{ u1: "5", u2: "0" }, { u1: "1", u2: "1" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "battle-of-sexes": {
      id: "battle-of-sexes",
      name: "Battle of the Sexes (Bach or Stravinsky)",
      category: "Coordination Games",
      subtitle: "Coordination with Conflicting Preferences",
      description: "Players wish to coordinate their evening, but have conflicting preferences between Opera and Football. Two pure Nash equilibria.",
      tags: ["2x2", "Coordination", "Multiple NE", "Mixed Strategy"],
      player1: { name: "Player 1", strategies: ["Opera (O)", "Football (F)"], probabilities: ["p", "1-p"] },
      player2: { name: "Player 2", strategies: ["Opera (O)", "Football (F)"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "3", u2: "2" }, { u1: "0", u2: "0" }],
        [{ u1: "0", u2: "0" }, { u1: "2", u2: "3" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "stag-hunt": {
      id: "stag-hunt",
      name: "Stag Hunt (Rousseau)",
      category: "Coordination Games",
      subtitle: "Payoff Dominance vs. Risk Dominance",
      description: "Hunting Stag requires mutual cooperation for maximum payoff (3,3); hunting Hare guarantees safety (2,2) without relying on the other.",
      tags: ["2x2", "Trust", "Payoff Dominant", "Risk Dominant"],
      player1: { name: "Hunter 1", strategies: ["Stag", "Hare"], probabilities: ["p", "1-p"] },
      player2: { name: "Hunter 2", strategies: ["Stag", "Hare"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "3", u2: "3" }, { u1: "0", u2: "2" }],
        [{ u1: "2", u2: "0" }, { u1: "2", u2: "2" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "matching-pennies": {
      id: "matching-pennies",
      name: "Matching Pennies",
      category: "Zero-Sum Games",
      subtitle: "Strictly Competitive / No Pure NE",
      description: "Player 1 wins if coins match; Player 2 wins if coins differ. Zero-sum game with only a unique mixed-strategy equilibrium (1/2, 1/2).",
      tags: ["2x2", "Zero-Sum", "No Pure NE", "Minimax"],
      player1: { name: "Player 1 (Matcher)", strategies: ["Heads (H)", "Tails (T)"], probabilities: ["p", "1-p"] },
      player2: { name: "Player 2 (Mismatcher)", strategies: ["Heads (H)", "Tails (T)"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "1", u2: "-1" }, { u1: "-1", u2: "1" }],
        [{ u1: "-1", u2: "1" }, { u1: "1", u2: "-1" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "hawk-dove": {
      id: "hawk-dove",
      name: "Hawk-Dove / Game of Chicken",
      category: "Anti-Coordination",
      subtitle: "Escalation vs. Concession",
      description: "Contesting a resource where mutual aggression (Hawk, Hawk) leads to catastrophic conflict. Two pure anti-coordination equilibria.",
      tags: ["2x2", "Evolutionary", "Anti-Coordination", "Biology"],
      player1: { name: "Player 1", strategies: ["Hawk", "Dove"], probabilities: ["p", "1-p"] },
      player2: { name: "Player 2", strategies: ["Hawk", "Dove"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "-2", u2: "-2" }, { u1: "4", u2: "0" }],
        [{ u1: "0", u2: "4" }, { u1: "2", u2: "2" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "rock-paper-scissors": {
      id: "rock-paper-scissors",
      name: "Rock-Paper-Scissors (3x3)",
      category: "Zero-Sum Games",
      subtitle: "Cyclic Symmetric Zero-Sum Game",
      description: "Classic 3x3 cyclic zero-sum game with symmetric payoffs. Unique mixed-strategy equilibrium: (1/3, 1/3, 1/3).",
      tags: ["3x3", "Zero-Sum", "Cyclic", "Mixed NE"],
      player1: { name: "Player 1", strategies: ["Rock", "Paper", "Scissors"], probabilities: ["p_1", "p_2", "p_3"] },
      player2: { name: "Player 2", strategies: ["Rock", "Paper", "Scissors"], probabilities: ["q_1", "q_2", "q_3"] },
      cells: [
        [{ u1: "0", u2: "0" }, { u1: "-1", u2: "1" }, { u1: "1", u2: "-1" }],
        [{ u1: "1", u2: "-1" }, { u1: "0", u2: "0" }, { u1: "-1", u2: "1" }],
        [{ u1: "-1", u2: "1" }, { u1: "1", u2: "-1" }, { u1: "0", u2: "0" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "iesds-3x3": {
      id: "iesds-3x3",
      name: "Iterated Deletion of Dominated Strategies (IESDS)",
      category: "Dominance & Solvability",
      subtitle: "3x3 Solvable by Strict Dominance",
      description: "Demonstrates successive elimination of strictly dominated strategies leading to a dominance-solvable unique Nash Equilibrium.",
      tags: ["3x3", "IESDS", "Rationalizability", "Dominance Solvable"],
      player1: { name: "Player 1", strategies: ["Top (T)", "Middle (M)", "Bottom (B)"], probabilities: ["p_1", "p_2", "p_3"] },
      player2: { name: "Player 2", strategies: ["Left (L)", "Center (C)", "Right (R)"], probabilities: ["q_1", "q_2", "q_3"] },
      cells: [
        [{ u1: "4", u2: "3" }, { u1: "5", u2: "1" }, { u1: "6", u2: "2" }],
        [{ u1: "2", u2: "1" }, { u1: "8", u2: "4" }, { u1: "3", u2: "6" }],
        [{ u1: "3", u2: "0" }, { u1: "9", u2: "2" }, { u1: "2", u2: "8" }]
      ],
      eliminatedRows: [1], // Middle dominated
      eliminatedCols: [2]  // Right eliminated
    },
    "cournot-discrete": {
      id: "cournot-discrete",
      name: "Cournot Duopoly (Discretised 3x3)",
      category: "Industrial Organization",
      subtitle: "Quantity Competition with Low, Med, High Output",
      description: "Two firms compete in output quantities (q=1, 2, 3). Best responses meet at the intermediate output level (2, 2).",
      tags: ["3x3", "Cournot", "Duopoly", "Economics"],
      player1: { name: "Firm 1", strategies: ["Low (q=1)", "Med (q=2)", "High (q=3)"], probabilities: ["p_L", "p_M", "p_H"] },
      player2: { name: "Firm 2", strategies: ["Low (q=1)", "Med (q=2)", "High (q=3)"], probabilities: ["q_L", "q_M", "q_H"] },
      cells: [
        [{ u1: "12", u2: "12" }, { u1: "9", u2: "14" }, { u1: "6", u2: "12" }],
        [{ u1: "14", u2: "9" }, { u1: "10", u2: "10" }, { u1: "6", u2: "7" }],
        [{ u1: "12", u2: "6" }, { u1: "7", u2: "6" }, { u1: "2", u2: "2" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "penalty-kick": {
      id: "penalty-kick",
      name: "Penalty Kick Game (Chiappori et al.)",
      category: "Empirical Economics",
      subtitle: "Striker vs. Goalkeeper Asymmetric Mixed Strategy",
      description: "Striker chooses natural side (Left) vs other (Right) while Goalkeeper dives. Empirical test of minimax theorem.",
      tags: ["2x2", "Empirical", "Sports Economics", "Mixed Strategy"],
      player1: { name: "Striker", strategies: ["Aim Left (L)", "Aim Right (R)"], probabilities: ["p", "1-p"] },
      player2: { name: "Goalkeeper", strategies: ["Dive Left (L)", "Dive Right (R)"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "58", u2: "42" }, { u1: "95", u2: "5" }],
        [{ u1: "93", u2: "7" }, { u1: "70", u2: "30" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "technology-adoption": {
      id: "technology-adoption",
      name: "Technology Adoption & Standards",
      category: "Network Effects",
      subtitle: "Coordination with Network Externalities",
      description: "Adopting compatible technological standards (Beta vs VHS, Blu-ray vs HD-DVD) yields positive network spillovers.",
      tags: ["2x2", "Network Effects", "Standards", "Pareto Ranked"],
      player1: { name: "Firm A", strategies: ["Adopt Standard Alpha", "Adopt Standard Beta"], probabilities: ["p", "1-p"] },
      player2: { name: "Firm B", strategies: ["Adopt Standard Alpha", "Adopt Standard Beta"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "10", u2: "10" }, { u1: "2", u2: "2" }],
        [{ u1: "2", u2: "2" }, { u1: "6", u2: "6" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "pollution-abatement": {
      id: "pollution-abatement",
      name: "Tragedy of the Commons / Pollution Abatement",
      category: "Environmental Economics",
      subtitle: "3x3 Social Dilemma with Positive Externalities",
      description: "Two factories choose pollution control: High Abatement, Low Abatement, or Pollute (Free-ride). Free-riding is strictly dominant, leading to socially inefficient high pollution.",
      tags: ["3x3", "Tragedy of Commons", "Externalities", "Dominant Strategy"],
      player1: { name: "Factory 1", strategies: ["High Abatement", "Low Abatement", "Pollute (Free-ride)"], probabilities: ["p_H", "p_L", "p_P"] },
      player2: { name: "Factory 2", strategies: ["High Abatement", "Low Abatement", "Pollute (Free-ride)"], probabilities: ["q_H", "q_L", "q_P"] },
      cells: [
        [{ u1: "6", u2: "6" }, { u1: "3", u2: "7" }, { u1: "1", u2: "8" }],
        [{ u1: "7", u2: "3" }, { u1: "4", u2: "4" }, { u1: "2", u2: "5" }],
        [{ u1: "8", u2: "1" }, { u1: "5", u2: "2" }, { u1: "3", u2: "3" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "bertrand-discrete": {
      id: "bertrand-discrete",
      name: "Bertrand Price Competition (Discrete 3x3)",
      category: "Industrial Organization",
      subtitle: "Price Undercutting & Marginal Cost Pricing",
      description: "Two firms set prices: High ($3), Medium ($2), or Cost ($1). Undercutting captures the entire market, driving price down to marginal cost (Bertrand Paradox).",
      tags: ["3x3", "Bertrand", "Price Competition", "Duopoly"],
      player1: { name: "Firm 1", strategies: ["Price High ($3)", "Price Med ($2)", "Price Cost ($1)"], probabilities: ["p_H", "p_M", "p_C"] },
      player2: { name: "Firm 2", strategies: ["Price High ($3)", "Price Med ($2)", "Price Cost ($1)"], probabilities: ["q_H", "q_M", "q_C"] },
      cells: [
        [{ u1: "6", u2: "6" }, { u1: "0", u2: "10" }, { u1: "0", u2: "4" }],
        [{ u1: "10", u2: "0" }, { u1: "4", u2: "4" }, { u1: "0", u2: "2" }],
        [{ u1: "4", u2: "0" }, { u1: "2", u2: "0" }, { u1: "1", u2: "1" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "hotelling-location": {
      id: "hotelling-location",
      name: "Hotelling Beach Vendor Location (3x3)",
      category: "Spatial Economics",
      subtitle: "Principle of Minimum Differentiation",
      description: "Two ice cream vendors choose positions on a beach: Left, Center, or Right. Both clustering in the Center is the unique Nash Equilibrium.",
      tags: ["3x3", "Hotelling", "Median Voter", "Spatial Competition"],
      player1: { name: "Vendor 1", strategies: ["Position Left (L)", "Position Center (C)", "Position Right (R)"], probabilities: ["p_L", "p_C", "p_R"] },
      player2: { name: "Vendor 2", strategies: ["Position Left (L)", "Position Center (C)", "Position Right (R)"], probabilities: ["q_L", "q_C", "q_R"] },
      cells: [
        [{ u1: "50", u2: "50" }, { u1: "25", u2: "75" }, { u1: "50", u2: "50" }],
        [{ u1: "75", u2: "25" }, { u1: "50", u2: "50" }, { u1: "75", u2: "25" }],
        [{ u1: "50", u2: "50" }, { u1: "25", u2: "75" }, { u1: "50", u2: "50" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "schelling-point": {
      id: "schelling-point",
      name: "Schelling Focal Point (Meeting in NYC)",
      category: "Coordination Games",
      subtitle: "Salience & Informal Coordination",
      description: "Two friends must meet at noon in New York City without communicating. Options: Grand Central Station, Empire State Building, or Times Square. Grand Central is the classic focal point.",
      tags: ["3x3", "Focal Point", "Schelling", "Coordination"],
      player1: { name: "Friend 1", strategies: ["Grand Central", "Empire State", "Times Square"], probabilities: ["p_GC", "p_ES", "p_TS"] },
      player2: { name: "Friend 2", strategies: ["Grand Central", "Empire State", "Times Square"], probabilities: ["q_GC", "q_ES", "q_TS"] },
      cells: [
        [{ u1: "10", u2: "10" }, { u1: "0", u2: "0" }, { u1: "0", u2: "0" }],
        [{ u1: "0", u2: "0" }, { u1: "6", u2: "6" }, { u1: "0", u2: "0" }],
        [{ u1: "0", u2: "0" }, { u1: "0", u2: "0" }, { u1: "6", u2: "6" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "bank-run-2x2": {
      id: "bank-run-2x2",
      name: "Diamond-Dybvig Simultaneous Bank Run (2x2)",
      category: "Financial Economics",
      subtitle: "Liquidity Shock & Panic Self-Fulfilling Equilibrium",
      description: "Two depositors decide whether to Keep Deposits In Bank or Withdraw Now. Two pure Nash equilibria: the efficient social outcome (Keep In, Keep In) and the destructive run (Withdraw, Withdraw).",
      tags: ["2x2", "Bank Run", "Financial Crises", "Coordination"],
      player1: { name: "Depositor 1", strategies: ["Keep In Bank", "Withdraw (Run)"], probabilities: ["p", "1-p"] },
      player2: { name: "Depositor 2", strategies: ["Keep In Bank", "Withdraw (Run)"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "3", u2: "3" }, { u1: "0", u2: "2" }],
        [{ u1: "2", u2: "0" }, { u1: "1", u2: "1" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "public-goods-2x2": {
      id: "public-goods-2x2",
      name: "Public Goods Contribution Game",
      category: "Classic Dilemmas",
      subtitle: "Endowment Multiplier & Free-Rider Dilemma",
      description: "Each player has endowment 10. Contributions are multiplied by 1.6 and shared equally. Free-riding strictly dominates, creating a socially inefficient equilibrium.",
      tags: ["2x2", "Public Goods", "Free-Rider", "Cooperation"],
      player1: { name: "Player 1", strategies: ["Contribute (10)", "Keep / Free-Ride (0)"], probabilities: ["p", "1-p"] },
      player2: { name: "Player 2", strategies: ["Contribute (10)", "Keep / Free-Ride (0)"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "16", u2: "16" }, { u1: "8", u2: "18" }],
        [{ u1: "18", u2: "8" }, { u1: "10", u2: "10" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "volunteer-dilemma": {
      id: "volunteer-dilemma",
      name: "Volunteer's Dilemma (Alarm & Whistleblowing)",
      category: "Classic Dilemmas",
      subtitle: "Costly Individual Sacrifice for Collective Survival",
      description: "If at least one person volunteers (pulls the fire alarm at small personal effort cost), everyone is saved. If nobody volunteers, a catastrophic disaster occurs. Two asymmetric pure Nash equilibria.",
      tags: ["2x2", "Social Dilemma", "Whistleblowing", "Asymmetric NE"],
      player1: { name: "Person 1", strategies: ["Volunteer (Pull)", "Ignore (Wait)"], probabilities: ["p", "1-p"] },
      player2: { name: "Person 2", strategies: ["Volunteer (Pull)", "Ignore (Wait)"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "3", u2: "3" }, { u1: "3", u2: "5" }],
        [{ u1: "5", u2: "3" }, { u1: "0", u2: "0" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "asymmetric-attrition": {
      id: "asymmetric-attrition",
      name: "War of Attrition (Concession Timing)",
      category: "Dominance & Solvability",
      subtitle: "Escalation Cost vs. Conceding the Prize",
      description: "Two players contest a prize of value 4. Each can Concede immediately in Period 1, hold on until Period 2, or Fight to the end (Period 3), with fighting costing 2 per round.",
      tags: ["3x3", "War of Attrition", "Escalation", "Persistence"],
      player1: { name: "Player 1", strategies: ["Concede P1", "Hold to P2", "Fight to P3"], probabilities: ["p_1", "p_2", "p_3"] },
      player2: { name: "Player 2", strategies: ["Concede P1", "Hold to P2", "Fight to P3"], probabilities: ["q_1", "q_2", "q_3"] },
      cells: [
        [{ u1: "0", u2: "0" }, { u1: "0", u2: "4" }, { u1: "0", u2: "4" }],
        [{ u1: "4", u2: "0" }, { u1: "-2", u2: "-2" }, { u1: "-2", u2: "2" }],
        [{ u1: "4", u2: "0" }, { u1: "2", u2: "-2" }, { u1: "-4", u2: "-4" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "arms-race": {
      id: "arms-race",
      name: "Arms Race & Bilateral Disarmament",
      category: "Classic Dilemmas",
      subtitle: "Cold War Security Dilemma & Detente",
      description: "Both nations prefer mutual peace (Disarm, Disarm), but military dominance over an unarmed rival provides strategic security. Defection (Arm) is strictly dominant, locking both into costly arms buildup.",
      tags: ["2x2", "International Relations", "Security Dilemma", "Cold War"],
      player1: { name: "Nation A", strategies: ["Disarm (Peace)", "Build Weapons (Arm)"], probabilities: ["p", "1-p"] },
      player2: { name: "Nation B", strategies: ["Disarm (Peace)", "Build Weapons (Arm)"], probabilities: ["q", "1-q"] },
      cells: [
        [{ u1: "10", u2: "10" }, { u1: "0", u2: "15" }],
        [{ u1: "15", u2: "0" }, { u1: "4", u2: "4" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    },
    "centipede-matrix": {
      id: "centipede-matrix",
      name: "Centipede Game (Normal Form 3x3)",
      category: "Dominance & Solvability",
      subtitle: "Strategic Form Representation of Sequential Stopping",
      description: "Players alternate between taking the pot or passing. Normal-form representation shows that Take at Round 1 weakly or strictly dominates later rounds through backward induction.",
      tags: ["3x3", "Centipede", "Backward Induction", "IESDS"],
      player1: { name: "Player 1", strategies: ["Take (t=1)", "Pass then Take (t=3)", "Pass All (t=5)"], probabilities: ["p_1", "p_2", "p_3"] },
      player2: { name: "Player 2", strategies: ["Take (t=2)", "Pass then Take (t=4)", "Pass All (t=6)"], probabilities: ["q_1", "q_2", "q_3"] },
      cells: [
        [{ u1: "2", u2: "0" }, { u1: "2", u2: "0" }, { u1: "2", u2: "0" }],
        [{ u1: "1", u2: "3" }, { u1: "4", u2: "2" }, { u1: "4", u2: "2" }],
        [{ u1: "1", u2: "3" }, { u1: "3", u2: "5" }, { u1: "6", u2: "6" }]
      ],
      eliminatedRows: [],
      eliminatedCols: []
    }
  };

  // Helper to deep-clone an object
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Parse numeric payoff (for auto best-response calculation)
  function parsePayoff(val) {
    if (typeof val === 'number') return val;
    if (!val) return NaN;
    var trimmed = String(val).trim();
    // Support fractions like "1/2" or "-1/2"
    if (/^-?\d+\s*\/\s*\d+$/.test(trimmed)) {
      var parts = trimmed.split('/');
      return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
    return parseFloat(trimmed);
  }

  // Auto-calculate best responses for Player 1 & Player 2
  function computeBestResponses() {
    var numRows = matrixState.player1.strategies.length;
    var numCols = matrixState.player2.strategies.length;

    // First reset underlines if auto-mode
    for (var r = 0; r < numRows; r++) {
      for (var c = 0; c < numCols; c++) {
        matrixState.cells[r][c].p1Underline = false;
        matrixState.cells[r][c].p2Underline = false;
      }
    }

    // Player 1 best response: max in each column c across active rows
    for (var c = 0; c < numCols; c++) {
      if (matrixState.eliminatedCols.indexOf(c) !== -1) continue;
      var maxP1 = -Infinity;
      var hasValidP1 = false;
      for (var r = 0; r < numRows; r++) {
        if (matrixState.eliminatedRows.indexOf(r) !== -1) continue;
        var p1Val = parsePayoff(matrixState.cells[r][c].u1);
        if (!isNaN(p1Val)) {
          hasValidP1 = true;
          if (p1Val > maxP1) maxP1 = p1Val;
        }
      }
      if (hasValidP1 && maxP1 !== -Infinity) {
        for (var r2 = 0; r2 < numRows; r2++) {
          if (matrixState.eliminatedRows.indexOf(r2) !== -1) continue;
          var val = parsePayoff(matrixState.cells[r2][c].u1);
          if (val === maxP1) {
            matrixState.cells[r2][c].p1Underline = true;
          }
        }
      }
    }

    // Player 2 best response: max in each row r across active columns
    for (var r = 0; r < numRows; r++) {
      if (matrixState.eliminatedRows.indexOf(r) !== -1) continue;
      var maxP2 = -Infinity;
      var hasValidP2 = false;
      for (var c = 0; c < numCols; c++) {
        if (matrixState.eliminatedCols.indexOf(c) !== -1) continue;
        var p2Val = parsePayoff(matrixState.cells[r][c].u2);
        if (!isNaN(p2Val)) {
          hasValidP2 = true;
          if (p2Val > maxP2) maxP2 = p2Val;
        }
      }
      if (hasValidP2 && maxP2 !== -Infinity) {
        for (var c2 = 0; c2 < numCols; c2++) {
          if (matrixState.eliminatedCols.indexOf(c2) !== -1) continue;
          var val = parsePayoff(matrixState.cells[r][c2].u2);
          if (val === maxP2) {
            matrixState.cells[r][c2].p2Underline = true;
          }
        }
      }
    }

    // Check Nash Equilibria: cell where both are best responses
    for (var r = 0; r < numRows; r++) {
      for (var c = 0; c < numCols; c++) {
        var isElim = matrixState.eliminatedRows.indexOf(r) !== -1 || matrixState.eliminatedCols.indexOf(c) !== -1;
        if (!isElim && matrixState.cells[r][c].p1Underline && matrixState.cells[r][c].p2Underline) {
          matrixState.cells[r][c].isNE = true;
        } else {
          matrixState.cells[r][c].isNE = false;
        }
      }
    }
  }

  // Load a preset
  function loadPreset(presetId) {
    var p = MATRIX_PRESETS[presetId];
    if (!p) return;
    matrixState.title = p.name;
    matrixState.player1 = clone(p.player1);
    matrixState.player2 = clone(p.player2);
    if (!matrixState.player1.color) matrixState.player1.color = "#4f46e5";
    if (!matrixState.player2.color) matrixState.player2.color = "#0284c7";

    // Setup cells
    var numRows = p.player1.strategies.length;
    var numCols = p.player2.strategies.length;
    matrixState.cells = [];
    for (var r = 0; r < numRows; r++) {
      var row = [];
      for (var c = 0; c < numCols; c++) {
        var cellData = (p.cells[r] && p.cells[r][c]) ? p.cells[r][c] : { u1: "0", u2: "0" };
        row.push({
          u1: String(cellData.u1),
          u2: String(cellData.u2),
          p1Underline: !!cellData.p1Underline,
          p2Underline: !!cellData.p2Underline,
          isNE: !!cellData.isNE
        });
      }
      matrixState.cells.push(row);
    }
    matrixState.eliminatedRows = p.eliminatedRows ? clone(p.eliminatedRows) : [];
    matrixState.eliminatedCols = p.eliminatedCols ? clone(p.eliminatedCols) : [];

    if (matrixState.options.autoHighlightNE) {
      computeBestResponses();
    }

    renderAll();
  }

  // Change matrix dimensions
  function setDimensions(rows, cols) {
    var oldRows = matrixState.player1.strategies.length;
    var oldCols = matrixState.player2.strategies.length;

    // Update row strategies
    var defaultRowLabels = ["Top (T)", "Bottom (B)", "Middle (M)", "Extra 1", "Extra 2"];
    var newRowStrats = [];
    var newRowProbs = [];
    for (var r = 0; r < rows; r++) {
      newRowStrats.push(matrixState.player1.strategies[r] || defaultRowLabels[r] || ("Strategy " + (r + 1)));
      if (rows === 2) {
        newRowProbs = ["p", "1-p"];
      } else {
        newRowProbs.push("p_" + (r + 1));
      }
    }
    matrixState.player1.strategies = newRowStrats;
    matrixState.player1.probabilities = newRowProbs;

    // Update col strategies
    var defaultColLabels = ["Left (L)", "Right (R)", "Center (C)", "Col 4", "Col 5"];
    var newColStrats = [];
    var newColProbs = [];
    for (var c = 0; c < cols; c++) {
      newColStrats.push(matrixState.player2.strategies[c] || defaultColLabels[c] || ("Strategy " + (c + 1)));
      if (cols === 2) {
        newColProbs = ["q", "1-q"];
      } else {
        newColProbs.push("q_" + (c + 1));
      }
    }
    matrixState.player2.strategies = newColStrats;
    matrixState.player2.probabilities = newColProbs;

    // Rebuild cells preserving existing values
    var newCells = [];
    for (var r = 0; r < rows; r++) {
      var rowArr = [];
      for (var c = 0; c < cols; c++) {
        if (matrixState.cells[r] && matrixState.cells[r][c]) {
          rowArr.push(clone(matrixState.cells[r][c]));
        } else {
          rowArr.push({ u1: "0", u2: "0", p1Underline: false, p2Underline: false, isNE: false });
        }
      }
      newCells.push(rowArr);
    }
    matrixState.cells = newCells;

    // Filter eliminated lists
    matrixState.eliminatedRows = matrixState.eliminatedRows.filter(function(i) { return i < rows; });
    matrixState.eliminatedCols = matrixState.eliminatedCols.filter(function(i) { return i < cols; });

    if (matrixState.options.autoHighlightNE) {
      computeBestResponses();
    }

    renderAll();
  }

  // Generate Pure TikZ Code
  function generateTikZCode(isStandalone) {
    var p1 = matrixState.player1;
    var p2 = matrixState.player2;
    var cells = matrixState.cells;
    var numRows = p1.strategies.length;
    var numCols = p2.strategies.length;
    var opts = matrixState.options;

    var out = [];

    if (isStandalone) {
      out.push("% Generated with Game Theory TikZ Studio");
      out.push("% Strategic Form (Normal Form) Payoff Matrix");
      out.push("\\documentclass[border=6pt]{standalone}");
      out.push("\\usepackage{tikz}");
      out.push("\\usepackage{amsmath, amssymb}");
      out.push("\\usetikzlibrary{matrix, positioning, calc, fit}");
      out.push("");
      out.push("\\begin{document}");
    }

    out.push("\\begin{tikzpicture}[>=stealth, font=\\sffamily]");
    out.push("  % Player Colors");
    out.push("  \\definecolor{p1color}{HTML}{4F46E5} % Player 1 (" + p1.name + ")");
    out.push("  \\definecolor{p2color}{HTML}{0284C7} % Player 2 (" + p2.name + ")");
    out.push("  \\definecolor{nebg}{HTML}{ECFDF5}   % Nash Equilibrium Background");
    out.push("  \\definecolor{neborder}{HTML}{10B981}% Nash Equilibrium Border");
    out.push("");

    // Build the matrix of nodes
    out.push("  % Strategic Form Payoff Matrix");
    out.push("  % TikZ Matrix Syntax Guide:");
    out.push("  % - (M) names the matrix node. Individual cells are accessible as (M-row-col).");
    out.push("  % - Row 1 = Column strategy headers; Column 1 = Row strategy headers.");
    out.push("  % - Payoff cells start at (M-2-2) through (M-" + (numRows + 1) + "-" + (numCols + 1) + ").");
    out.push("  \\matrix (M) [");
    out.push("    matrix of nodes,");
    out.push("    nodes in empty cells,");
    out.push("    column sep=-\\pgflinewidth,");
    out.push("    row sep=-\\pgflinewidth,");
    out.push("    nodes={");
    out.push("      align=center,");
    out.push("      minimum width=2.4cm,");
    out.push("      minimum height=1.3cm,");
    out.push("      inner sep=4pt,");
    out.push("      anchor=center");
    out.push("    },");
    out.push("    column 1/.style={nodes={minimum width=2.8cm, font=\\bfseries}},");
    out.push("    row 1/.style={nodes={minimum height=1.0cm, font=\\bfseries}}");
    out.push("  ] {");

    // Row 1: Header row (Top-left diagonal + Column strategies)
    var headerRow = [];
    if (opts.showDiagonalHeader) {
      headerRow.push("{\\small " + p1.name + " $\\backslash$ " + p2.name + "}");
    } else {
      headerRow.push("{}");
    }

    for (var c = 0; c < numCols; c++) {
      var colLabel = p2.strategies[c];
      if (opts.showProbabilities && p2.probabilities[c]) {
        colLabel += " \\\\[-2pt]{\\footnotesize\\color{p2color} $(" + p2.probabilities[c] + ")$}";
      }
      headerRow.push("{" + colLabel + "}");
    }
    out.push("    " + headerRow.join(" & ") + " \\\\");

    // Matrix Body Rows (Payoffs)
    for (var r = 0; r < numRows; r++) {
      var rowCells = [];
      // Row header (Strategy name + optional probability)
      var rowLabel = p1.strategies[r];
      if (opts.showProbabilities && p1.probabilities[r]) {
        rowLabel += " {\\footnotesize\\color{p1color} $(" + p1.probabilities[r] + ")$}";
      }
      rowCells.push("{" + rowLabel + "}");

      // Cells
      for (var c = 0; c < numCols; c++) {
        var cell = cells[r][c];
        var isElim = matrixState.eliminatedRows.indexOf(r) !== -1 || matrixState.eliminatedCols.indexOf(c) !== -1;
        var nodeStyle = [];

        // Box border style
        if (opts.matrixStyle === "boxed") {
          nodeStyle.push("draw=gray!50", "thick");
        } else if (opts.matrixStyle === "academic") {
          nodeStyle.push("draw=none");
        } else {
          nodeStyle.push("draw=gray!40");
        }

        // Nash Equilibrium highlight
        if (cell.isNE && !isElim && opts.autoHighlightNE) {
          nodeStyle.push("fill=nebg", "draw=neborder", "very thick");
        } else if (isElim) {
          nodeStyle.push("fill=gray!10", "opacity=0.6");
        }

        var p1Val = cell.p1Underline ? "\\underline{" + cell.u1 + "}" : cell.u1;
        var p2Val = cell.p2Underline ? "\\underline{" + cell.u2 + "}" : cell.u2;

        var cellMath = "$" + p1Val + ",\\;\\; " + p2Val + "$";
        if (cell.isNE && opts.neBadge && !isElim) {
          cellMath += " \\\\[-3pt]{\\tiny\\color{neborder!90!black}\\textbf{NE}}";
        }

        var styleStr = nodeStyle.length > 0 ? "|[" + nodeStyle.join(", ") + "]|" : "";
        rowCells.push("    " + styleStr + " {" + cellMath + "}");
      }
      out.push(rowCells.join(" & ") + " \\\\");
    }

    out.push("  };");
    out.push("");

    // Additional TikZ Decorations
    out.push("  % Player Labels");
    out.push("  \\node[above=0.35cm of M-1-2.north east, anchor=south, font=\\bfseries\\large, text=p2color] {" + p2.name + "};");
    out.push("  \\node[left=0.4cm of M-2-1.north west, anchor=east, font=\\bfseries\\large, text=p1color, rotate=90] {" + p1.name + "};");

    // Diagonal divider in top-left cell if requested
    if (opts.showDiagonalHeader) {
      out.push("");
      out.push("  % Diagonal Divider in Top-Left Header");
      out.push("  \\draw[gray!50, line width=0.8pt] (M-1-1.north west) -- (M-1-1.south east);");
    }

    // Dominated Strategy Strike-outs (IESDS)
    if (matrixState.eliminatedRows.length > 0 || matrixState.eliminatedCols.length > 0) {
      out.push("");
      out.push("  % Iterated Deletion of Strictly Dominated Strategies (IESDS)");
      matrixState.eliminatedRows.forEach(function(r) {
        var rowNum = r + 2; // +2 offset due to 1-based indexing and header row
        out.push("  \\draw[red!80, line width=1.4pt, dashed] ($(M-" + rowNum + "-1.west)+(-0.2,0)$) -- ($(M-" + rowNum + "-" + (numCols + 1) + ".east)+(0.2,0)$) node[right, red!80, font=\\footnotesize] {Dominated};");
      });
      matrixState.eliminatedCols.forEach(function(c) {
        var colNum = c + 2;
        out.push("  \\draw[red!80, line width=1.4pt, dashed] ($(M-1-" + colNum + ".north)+(0,0.2)$) -- ($(M-" + (numRows + 1) + "-" + colNum + ".south)+(0,-0.2)$) node[below, red!80, font=\\footnotesize] {Dominated};");
      });
    }

    // Brackets style if selected
    if (opts.matrixStyle === "brackets") {
      out.push("");
      out.push("  % Outer Matrix Brackets");
      out.push("  \\draw[thick, gray!80] ($(M-2-2.north west)+(-2pt,2pt)$) -- ++(-4pt,0) -- ($(M-" + (numRows + 1) + "-2.south west)+(-6pt,-2pt)$) -- ++(4pt,0);");
      out.push("  \\draw[thick, gray!80] ($(M-2-" + (numCols + 1) + ".north east)+(2pt,2pt)$) -- ++(4pt,0) -- ($(M-" + (numRows + 1) + "-" + (numCols + 1) + ".south east)+(6pt,-2pt)$) -- ++(-4pt,0);");
    }

    // Legend
    out.push("");
    out.push("  % Legend: Best-response underlines and Payoffs");
    out.push("  \\node[below=0.5cm of M.south, align=center, font=\\footnotesize, text=gray!80] {");
    out.push("    Payoffs: $(\\textcolor{p1color}{u_1}, \\textcolor{p2color}{u_2})$ \\quad ");
    out.push("    $\\underline{u_1}$: " + p1.name + " Best Response \\quad ");
    out.push("    $\\underline{u_2}$: " + p2.name + " Best Response");
    if (opts.autoHighlightNE) {
      out.push("    \\quad \\tikz[baseline=-0.5ex]{\\fill[nebg, draw=neborder, thick] (0,0) rectangle (0.35, 0.25);} Nash Equilibrium (NE)");
    }
    out.push("  };");

    out.push("\\end{tikzpicture}");

    if (isStandalone) {
      out.push("\\end{document}");
    }

    return out.join("\n");
  }

  // Generate standard LaTeX tabular code
  function generateTabularCode() {
    var p1 = matrixState.player1;
    var p2 = matrixState.player2;
    var cells = matrixState.cells;
    var numRows = p1.strategies.length;
    var numCols = p2.strategies.length;

    var colSpec = "l | " + Array(numCols).fill("c").join(" | ");
    var lines = [];
    lines.push("\\begin{table}[htbp]");
    lines.push("\\centering");
    lines.push("\\caption{" + matrixState.title + " (Strategic Form)}");
    lines.push("\\begin{tabular}{" + colSpec + "}");
    lines.push("  \\multicolumn{1}{c}{} & \\multicolumn{" + numCols + "}{c}{\\textbf{" + p2.name + "}} \\\\");

    var hRow = "  \\textbf{" + p1.name + "} & " + p2.strategies.map(function(s) { return "\\textbf{" + s + "}"; }).join(" & ") + " \\\\ \\hline";
    lines.push(hRow);

    for (var r = 0; r < numRows; r++) {
      var rowCells = ["  \\textbf{" + p1.strategies[r] + "}"];
      for (var c = 0; c < numCols; c++) {
        var cell = cells[r][c];
        var u1Str = cell.p1Underline ? "\\underline{" + cell.u1 + "}" : cell.u1;
        var u2Str = cell.p2Underline ? "\\underline{" + cell.u2 + "}" : cell.u2;
        var val = "(" + u1Str + ", " + u2Str + ")";
        if (cell.isNE) {
          val = "\\textbf{" + val + "}$^*$";
        }
        rowCells.push(val);
      }
      lines.push(rowCells.join(" & ") + " \\\\ \\hline");
    }

    lines.push("\\end{tabular}");
    lines.push("\\end{table}");
    return lines.join("\n");
  }

  // HTML5 Canvas Rendering
  function renderCanvas() {
    var canvas = document.getElementById("matrix-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var p1 = matrixState.player1;
    var p2 = matrixState.player2;
    var cells = matrixState.cells;
    var numRows = p1.strategies.length;
    var numCols = p2.strategies.length;
    var opts = matrixState.options;

    // Handle retina display
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var width = Math.max(rect.width || 680, 680);
    var height = Math.max(rect.height || 460, 460);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw grid background subtle pattern
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(12, 12, width - 24, height - 24);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // Matrix geometry calculation
    var cellW = Math.min(130, Math.floor((width - 240) / numCols));
    var cellH = Math.min(70, Math.floor((height - 180) / numRows));
    var headerW = 160;
    var headerH = 50;

    var totalMatrixW = headerW + numCols * cellW;
    var totalMatrixH = headerH + numRows * cellH;

    var startX = Math.max(50, Math.floor((width - totalMatrixW) / 2));
    var startY = Math.max(70, Math.floor((height - totalMatrixH) / 2) + 15);

    // Store hit-boxes for interactive clicking
    window.__matrixCellHitboxes = [];

    // Title / Player Top Label (Player 2)
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#0284c7";
    ctx.fillText(p2.name + " (Column Player)", startX + headerW + (numCols * cellW) / 2, startY - 32);

    // Player Left Label (Player 1)
    ctx.save();
    ctx.translate(startX - 35, startY + headerH + (numRows * cellH) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#4f46e5";
    ctx.fillText(p1.name + " (Row Player)", 0, 0);
    ctx.restore();

    // 1. Top-Left Header Cell (Diagonal or clean)
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(startX, startY, headerW, headerH);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(startX, startY, headerW, headerH);

    if (opts.showDiagonalHeader) {
      // Diagonal line from top-left to bottom-right
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + headerW, startY + headerH);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label Player 1 bottom-left
      ctx.font = "600 11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#4f46e5";
      ctx.textAlign = "left";
      ctx.fillText(p1.name, startX + 12, startY + headerH - 14);

      // Label Player 2 top-right
      ctx.fillStyle = "#0284c7";
      ctx.textAlign = "right";
      ctx.fillText(p2.name, startX + headerW - 12, startY + 14);
    } else {
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText(p1.name + " \\ " + p2.name, startX + headerW / 2, startY + headerH / 2);
    }

    // 2. Column Headers (Player 2 strategies)
    for (var c = 0; c < numCols; c++) {
      var colX = startX + headerW + c * cellW;
      var isColElim = matrixState.eliminatedCols.indexOf(c) !== -1;

      ctx.fillStyle = isColElim ? "#f1f5f9" : "#f8fafc";
      ctx.fillRect(colX, startY, cellW, headerH);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(colX, startY, cellW, headerH);

      // Text
      ctx.textAlign = "center";
      ctx.fillStyle = isColElim ? "#94a3b8" : "#0f172a";
      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(p2.strategies[c], colX + cellW / 2, startY + (opts.showProbabilities ? 18 : headerH / 2));

      // Probability
      if (opts.showProbabilities && p2.probabilities[c]) {
        ctx.font = "italic 11px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = "#0284c7";
        ctx.fillText("(" + p2.probabilities[c] + ")", colX + cellW / 2, startY + 34);
      }
    }

    // 3. Row Headers & Matrix Cells
    for (var r = 0; r < numRows; r++) {
      var rowY = startY + headerH + r * cellH;
      var isRowElim = matrixState.eliminatedRows.indexOf(r) !== -1;

      // Row Header
      ctx.fillStyle = isRowElim ? "#f1f5f9" : "#f8fafc";
      ctx.fillRect(startX, rowY, headerW, cellH);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startX, rowY, headerW, cellH);

      ctx.textAlign = "center";
      ctx.fillStyle = isRowElim ? "#94a3b8" : "#0f172a";
      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(p1.strategies[r], startX + headerW / 2, rowY + (opts.showProbabilities ? cellH / 2 - 8 : cellH / 2));

      if (opts.showProbabilities && p1.probabilities[r]) {
        ctx.font = "italic 11px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = "#4f46e5";
        ctx.fillText("(" + p1.probabilities[r] + ")", startX + headerW / 2, rowY + cellH / 2 + 10);
      }

      // Cells
      for (var c = 0; c < numCols; c++) {
        var cellX = startX + headerW + c * cellW;
        var cell = cells[r][c];
        var isCellElim = isRowElim || matrixState.eliminatedCols.indexOf(c) !== -1;

        // Save hitbox
        window.__matrixCellHitboxes.push({
          row: r,
          col: c,
          x: cellX,
          y: rowY,
          w: cellW,
          h: cellH
        });

        // Background
        if (cell.isNE && !isCellElim && opts.autoHighlightNE) {
          ctx.fillStyle = "#ecfdf5"; // emerald light
        } else if (isCellElim) {
          ctx.fillStyle = "#f1f5f9";
        } else {
          ctx.fillStyle = "#ffffff";
        }
        ctx.fillRect(cellX, rowY, cellW, cellH);

        // Cell Border
        if (cell.isNE && !isCellElim && opts.autoHighlightNE) {
          ctx.strokeStyle = "#10b981"; // emerald border
          ctx.lineWidth = 2.5;
          ctx.strokeRect(cellX + 1, rowY + 1, cellW - 2, cellH - 2);
        } else {
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cellX, rowY, cellW, cellH);
        }

        // Draw NE badge if active
        if (cell.isNE && !isCellElim && opts.neBadge) {
          ctx.fillStyle = "#059669";
          ctx.font = "bold 9px -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.textAlign = "right";
          ctx.fillText("NE★", cellX + cellW - 6, rowY + 12);
        }

        // Render Payoffs: (u1, u2)
        var u1Text = String(cell.u1);
        var u2Text = String(cell.u2);
        var sep = ",  ";

        ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'JetBrains Mono', monospace";
        var u1Width = ctx.measureText(u1Text).width;
        var sepWidth = ctx.measureText(sep).width;
        var u2Width = ctx.measureText(u2Text).width;
        var totalPayoffW = u1Width + sepWidth + u2Width;

        var payoffStartX = cellX + (cellW - totalPayoffW) / 2;
        var payoffY = rowY + cellH / 2;

        // Draw Player 1 Payoff
        ctx.textAlign = "left";
        ctx.fillStyle = isCellElim ? "#94a3b8" : "#1e1b4b"; // deep indigo
        ctx.fillText(u1Text, payoffStartX, payoffY);

        // Player 1 Underline
        if (cell.p1Underline && !isCellElim) {
          ctx.strokeStyle = "#4f46e5";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(payoffStartX, payoffY + 3);
          ctx.lineTo(payoffStartX + u1Width, payoffY + 3);
          ctx.stroke();
        }

        // Separator
        ctx.fillStyle = "#64748b";
        ctx.fillText(sep, payoffStartX + u1Width, payoffY);

        // Draw Player 2 Payoff
        var p2StartX = payoffStartX + u1Width + sepWidth;
        ctx.fillStyle = isCellElim ? "#94a3b8" : "#0c4a6e"; // deep cyan
        ctx.fillText(u2Text, p2StartX, payoffY);

        // Player 2 Underline
        if (cell.p2Underline && !isCellElim) {
          ctx.strokeStyle = "#0284c7";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(p2StartX, payoffY + 3);
          ctx.lineTo(p2StartX + u2Width, payoffY + 3);
          ctx.stroke();
        }
      }
    }

    // 4. Draw Dominated Strategy Strike-Through lines (IESDS)
    matrixState.eliminatedRows.forEach(function(r) {
      var rowY = startY + headerH + r * cellH + cellH / 2;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(startX - 10, rowY);
      ctx.lineTo(startX + totalMatrixW + 10, rowY);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    matrixState.eliminatedCols.forEach(function(c) {
      var colX = startX + headerW + c * cellW + cellW / 2;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(colX, startY - 10);
      ctx.lineTo(colX, startY + totalMatrixH + 10);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 5. Bottom Legend
    var legendY = height - 26;
    ctx.textAlign = "center";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText("Payoffs: (Player 1, Player 2)  •  Underlines denote Best Responses  •  Green border denotes Pure Nash Equilibrium", width / 2, legendY);
  }

  // Update Code Views
  function updateCodeViews() {
    var tikzElem = document.getElementById("tikz-code-area");
    if (tikzElem) {
      tikzElem.value = generateTikZCode(false);
    }
    var standaloneElem = document.getElementById("standalone-code-area");
    if (standaloneElem) {
      standaloneElem.value = generateTikZCode(true);
    }
    var tabularElem = document.getElementById("tabular-code-area");
    if (tabularElem) {
      tabularElem.value = generateTabularCode();
    }
  }

  // Render UI Controls (Inputs for Players, Strategies, Matrix grid)
  function renderControls() {
    var p1 = matrixState.player1;
    var p2 = matrixState.player2;
    var cells = matrixState.cells;
    var numRows = p1.strategies.length;
    var numCols = p2.strategies.length;

    // Update title input
    var titleInp = document.getElementById("matrix-title-input");
    if (titleInp && document.activeElement !== titleInp) {
      titleInp.value = matrixState.title;
    }

    // Update Player Names
    var p1NameInp = document.getElementById("p1-name-input");
    if (p1NameInp && document.activeElement !== p1NameInp) p1NameInp.value = p1.name;
    var p2NameInp = document.getElementById("p2-name-input");
    if (p2NameInp && document.activeElement !== p2NameInp) p2NameInp.value = p2.name;

    // Render Strategy Inputs
    var p1StratContainer = document.getElementById("p1-strategies-container");
    if (p1StratContainer) {
      p1StratContainer.innerHTML = p1.strategies.map(function(s, idx) {
        var isElim = matrixState.eliminatedRows.indexOf(idx) !== -1;
        return '<div style="display: flex; gap: 0.35rem; align-items: center; margin-bottom: 0.35rem;">' +
          '<span style="font-size: 0.75rem; font-weight: 700; color: #4f46e5; width: 22px;">R' + (idx + 1) + '</span>' +
          '<input type="text" class="input-modern" style="flex: 1; padding: 0.3rem 0.5rem; font-size: 0.8rem;" value="' + s.replace(/"/g, '&quot;') + '" onchange="PayoffMatrixApp.updateStrategyName(1, ' + idx + ', this.value);">' +
          '<input type="text" class="input-modern" style="width: 50px; padding: 0.3rem 0.3rem; font-size: 0.75rem; text-align: center;" title="Mixed Strategy Prob" value="' + (p1.probabilities[idx] || '') + '" onchange="PayoffMatrixApp.updateStrategyProb(1, ' + idx + ', this.value);">' +
          '<button type="button" class="btn-modern btn-modern-secondary ' + (isElim ? 'active' : '') + '" style="padding: 0.3rem 0.45rem; font-size: 0.72rem;" onclick="PayoffMatrixApp.toggleElimination(\'row\', ' + idx + ');" title="Toggle Dominated (IESDS)">' + (isElim ? 'Restore' : 'Dominate') + '</button>' +
        '</div>';
      }).join('');
    }

    var p2StratContainer = document.getElementById("p2-strategies-container");
    if (p2StratContainer) {
      p2StratContainer.innerHTML = p2.strategies.map(function(s, idx) {
        var isElim = matrixState.eliminatedCols.indexOf(idx) !== -1;
        return '<div style="display: flex; gap: 0.35rem; align-items: center; margin-bottom: 0.35rem;">' +
          '<span style="font-size: 0.75rem; font-weight: 700; color: #0284c7; width: 22px;">C' + (idx + 1) + '</span>' +
          '<input type="text" class="input-modern" style="flex: 1; padding: 0.3rem 0.5rem; font-size: 0.8rem;" value="' + s.replace(/"/g, '&quot;') + '" onchange="PayoffMatrixApp.updateStrategyName(2, ' + idx + ', this.value);">' +
          '<input type="text" class="input-modern" style="width: 50px; padding: 0.3rem 0.3rem; font-size: 0.75rem; text-align: center;" title="Mixed Strategy Prob" value="' + (p2.probabilities[idx] || '') + '" onchange="PayoffMatrixApp.updateStrategyProb(2, ' + idx + ', this.value);">' +
          '<button type="button" class="btn-modern btn-modern-secondary ' + (isElim ? 'active' : '') + '" style="padding: 0.3rem 0.45rem; font-size: 0.72rem;" onclick="PayoffMatrixApp.toggleElimination(\'col\', ' + idx + ');" title="Toggle Dominated (IESDS)">' + (isElim ? 'Restore' : 'Dominate') + '</button>' +
        '</div>';
      }).join('');
    }

    // Render Matrix Grid Editor Table
    var editorGrid = document.getElementById("matrix-editor-grid");
    if (editorGrid) {
      var html = '<table style="width: 100%; border-collapse: separate; border-spacing: 6px;">';
      // Header row
      html += '<thead><tr><th></th>';
      for (var c = 0; c < numCols; c++) {
        html += '<th style="font-size: 0.8rem; color: #0284c7; padding: 4px; text-align: center;">' + p2.strategies[c] + '</th>';
      }
      html += '</tr></thead><tbody>';

      for (var r = 0; r < numRows; r++) {
        html += '<tr><td style="font-size: 0.8rem; font-weight: 600; color: #4f46e5; padding: 4px; white-space: nowrap;">' + p1.strategies[r] + '</td>';
        for (var c = 0; c < numCols; c++) {
          var cell = cells[r][c];
          var isNE = cell.isNE;
          html += '<td style="background: ' + (isNE ? '#ecfdf5' : '#ffffff') + '; border: 1.5px solid ' + (isNE ? '#10b981' : '#e2e8f0') + '; border-radius: 6px; padding: 6px; text-align: center;">' +
            '<div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 4px;">' +
              '<input type="text" value="' + cell.u1 + '" style="width: 42px; text-align: center; font-weight: 700; color: #4f46e5; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 4px; font-size: 0.85rem;" onchange="PayoffMatrixApp.updatePayoff(' + r + ', ' + c + ', 1, this.value);">' +
              '<span style="color: #94a3b8; font-weight: bold;">,</span>' +
              '<input type="text" value="' + cell.u2 + '" style="width: 42px; text-align: center; font-weight: 700; color: #0284c7; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 4px; font-size: 0.85rem;" onchange="PayoffMatrixApp.updatePayoff(' + r + ', ' + c + ', 2, this.value);">' +
            '</div>' +
            '<div style="display: flex; justify-content: center; gap: 4px;">' +
              '<button type="button" class="btn-modern btn-modern-secondary ' + (cell.p1Underline ? 'active' : '') + '" style="padding: 1px 5px; font-size: 0.68rem; ' + (cell.p1Underline ? 'background: #4f46e5; color: white;' : '') + '" onclick="PayoffMatrixApp.toggleUnderline(' + r + ', ' + c + ', 1);" title="Underline P1 payoff"><u>u1</u></button>' +
              '<button type="button" class="btn-modern btn-modern-secondary ' + (cell.p2Underline ? 'active' : '') + '" style="padding: 1px 5px; font-size: 0.68rem; ' + (cell.p2Underline ? 'background: #0284c7; color: white;' : '') + '" onclick="PayoffMatrixApp.toggleUnderline(' + r + ', ' + c + ', 2);" title="Underline P2 payoff"><u>u2</u></button>' +
              '<button type="button" class="btn-modern btn-modern-secondary ' + (cell.isNE ? 'active' : '') + '" style="padding: 1px 5px; font-size: 0.68rem; ' + (cell.isNE ? 'background: #10b981; color: white;' : '') + '" onclick="PayoffMatrixApp.toggleNE(' + r + ', ' + c + ');" title="Toggle Nash Equilibrium status">NE</button>' +
            '</div>' +
          '</td>';
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      editorGrid.innerHTML = html;
    }

    renderEquilibriumInsight();
  }

  function renderEquilibriumInsight() {
    var container = document.getElementById("matrix-insight-container");
    if (!container) return;

    var p1 = matrixState.player1;
    var p2 = matrixState.player2;
    var cells = matrixState.cells;
    var numRows = p1.strategies.length;
    var numCols = p2.strategies.length;

    var neList = [];
    for (var r = 0; r < numRows; r++) {
      for (var c = 0; c < numCols; c++) {
        var cell = cells[r][c];
        if (cell.isNE || (cell.p1Underline && cell.p2Underline)) {
          neList.push({
            row: r,
            col: c,
            s1: p1.strategies[r],
            s2: p2.strategies[c],
            u1: cell.u1,
            u2: cell.u2
          });
        }
      }
    }

    var html = '';
    if (neList.length === 0) {
      html = '<div class="insight-card-header">' +
        '<span class="insight-card-title" style="color: #d97706;">' +
          '<span>⚖️</span> No Pure Strategy Nash Equilibrium' +
        '</span>' +
        '<span class="nav-badge" style="background: #fef3c7; color: #92400e;">Mixed Strategy Game</span>' +
      '</div>' +
      '<div class="insight-card-body">' +
        'In this matrix, neither player has a fixed pure choice that remains immune to being outguessed. ' +
        'This is characteristic of zero-sum games of pure conflict (e.g. <em>Matching Pennies</em> or <em>Rock-Paper-Scissors</em>). ' +
        'To play optimally, players will randomize their moves (playing a <strong>Mixed Strategy Nash Equilibrium</strong>).' +
      '</div>';
    } else if (neList.length === 1) {
      var ne = neList[0];
      html = '<div class="insight-card-header">' +
        '<span class="insight-card-title" style="color: #059669;">' +
          '<span>🎯</span> Unique Pure Nash Equilibrium: (' + ne.s1 + ', ' + ne.s2 + ')' +
        '</span>' +
        '<span class="nav-badge" style="background: #ecfdf5; color: #065f46;">Payoffs: (' + ne.u1 + ', ' + ne.u2 + ')</span>' +
      '</div>' +
      '<div class="insight-card-body">' +
        'At outcome <strong>(' + ne.s1 + ', ' + ne.s2 + ')</strong>, <strong>' + p1.name + '</strong> receives ' + ne.u1 + ' and <strong>' + p2.name + '</strong> receives ' + ne.u2 + '. ' +
        'Neither player has an incentive to unilaterally switch to another choice. Both are playing their mutual best responses.' +
      '</div>';
    } else {
      var neText = neList.map(function(n) {
        return '<strong>(' + n.s1 + ', ' + n.s2 + ')</strong> with payoffs (' + n.u1 + ', ' + n.u2 + ')';
      }).join(' and ');

      html = '<div class="insight-card-header">' +
        '<span class="insight-card-title" style="color: #2563eb;">' +
          '<span>🤝</span> ' + neList.length + ' Pure Nash Equilibria Found' +
        '</span>' +
        '<span class="nav-badge" style="background: #eff6ff; color: #1e40af;">Multiple Equilibria</span>' +
      '</div>' +
      '<div class="insight-card-body">' +
        'Equilibria occur at: ' + neText + '. ' +
        'Games with multiple equilibria often model coordination or trust dilemmas (such as <em>Battle of the Sexes</em> or <em>Stag Hunt</em>), where players succeed by coordinating on the same outcome.' +
      '</div>';
    }

    container.innerHTML = html;
  }

  // Full redraw
  function renderAll() {
    renderCanvas();
    renderControls();
    updateCodeViews();
  }

  // Public API
  var PayoffMatrixApp = {
    getState: function() {
      return matrixState;
    },
    loadPreset: loadPreset,
    setDimensions: setDimensions,
    computeBestResponses: function() {
      computeBestResponses();
      renderAll();
    },
    updateTitle: function(val) {
      matrixState.title = val;
      renderAll();
    },
    updatePlayerName: function(playerNum, val) {
      if (playerNum === 1) matrixState.player1.name = val;
      else matrixState.player2.name = val;
      renderAll();
    },
    updateStrategyName: function(playerNum, idx, val) {
      if (playerNum === 1) matrixState.player1.strategies[idx] = val;
      else matrixState.player2.strategies[idx] = val;
      renderAll();
    },
    updateStrategyProb: function(playerNum, idx, val) {
      if (playerNum === 1) matrixState.player1.probabilities[idx] = val;
      else matrixState.player2.probabilities[idx] = val;
      renderAll();
    },
    updatePayoff: function(r, c, playerNum, val) {
      if (playerNum === 1) matrixState.cells[r][c].u1 = val;
      else matrixState.cells[r][c].u2 = val;

      if (matrixState.options.autoHighlightNE) {
        computeBestResponses();
      }
      renderAll();
    },
    toggleUnderline: function(r, c, playerNum) {
      if (playerNum === 1) {
        matrixState.cells[r][c].p1Underline = !matrixState.cells[r][c].p1Underline;
      } else {
        matrixState.cells[r][c].p2Underline = !matrixState.cells[r][c].p2Underline;
      }
      matrixState.cells[r][c].isNE = matrixState.cells[r][c].p1Underline && matrixState.cells[r][c].p2Underline;
      renderAll();
    },
    toggleNE: function(r, c) {
      var nextState = !matrixState.cells[r][c].isNE;
      matrixState.cells[r][c].isNE = nextState;
      if (nextState) {
        matrixState.cells[r][c].p1Underline = true;
        matrixState.cells[r][c].p2Underline = true;
      }
      renderAll();
    },
    toggleElimination: function(type, idx) {
      if (type === 'row') {
        var pos = matrixState.eliminatedRows.indexOf(idx);
        if (pos === -1) matrixState.eliminatedRows.push(idx);
        else matrixState.eliminatedRows.splice(pos, 1);
      } else {
        var pos2 = matrixState.eliminatedCols.indexOf(idx);
        if (pos2 === -1) matrixState.eliminatedCols.push(idx);
        else matrixState.eliminatedCols.splice(pos2, 1);
      }
      if (matrixState.options.autoHighlightNE) {
        computeBestResponses();
      }
      renderAll();
    },
    setOption: function(key, val) {
      matrixState.options[key] = val;
      if (key === 'autoHighlightNE' && val) {
        computeBestResponses();
      }
      renderAll();
    },
    generateTikZCode: generateTikZCode,
    generateTabularCode: generateTabularCode,
    renderAll: renderAll,
    getPresets: function() {
      return MATRIX_PRESETS;
    }
  };

  window.PayoffMatrixApp = PayoffMatrixApp;

  // Initialize on window load
  window.addEventListener('DOMContentLoaded', function() {
    // Setup canvas click listener for cell toggles
    var canvas = document.getElementById("matrix-canvas");
    if (canvas) {
      canvas.addEventListener("click", function(evt) {
        var rect = canvas.getBoundingClientRect();
        var clickX = evt.clientX - rect.left;
        var clickY = evt.clientY - rect.top;

        if (window.__matrixCellHitboxes) {
          for (var i = 0; i < window.__matrixCellHitboxes.length; i++) {
            var hb = window.__matrixCellHitboxes[i];
            if (clickX >= hb.x && clickX <= hb.x + hb.w && clickY >= hb.y && clickY <= hb.y + hb.h) {
              // Toggle Nash equilibrium on cell click
              PayoffMatrixApp.toggleNE(hb.row, hb.col);
              if (window.showToast) {
                window.showToast("Toggled Cell (" + (hb.row + 1) + ", " + (hb.col + 1) + ")");
              }
              break;
            }
          }
        }
      });
    }

    // Auto-compute best responses initially
    computeBestResponses();
    renderAll();
  });

})(window);
