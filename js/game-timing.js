/**
 * Game Theory TikZ Studio - Dynamic Game Timing / Sequence of Play Studio
 * Generates horizontal stage-game timing diagrams for sequential games,
 * signaling games, contracting/moral hazard models, and bargaining.
 * 
 * Features:
 *  - Time coordinates t = 0, 1, 2... or custom stage labels
 *  - Active mover badges (Nature, Principal, Agent, Sender, Receiver...)
 *  - Action sets & decisions
 *  - Information state / Bayes belief updates
 *  - Realized payoffs & outcomes
 *  - TikZ curly braces for multi-stage phases
 *  - Pure TikZ code with standard libraries (decorations.pathreplacing)
 *  - Canvas live preview and PNG/SVG export
 */

(function (window) {
  'use strict';

  var timingState = {
    title: "Spence Job Market Signaling Timing",
    axisLabel: "Time / Sequence of Moves ($t$)",
    axisStyle: "arrow", // "arrow", "double-arrow", "discrete"
    stages: [
      {
        id: "stage-0",
        timeLabel: "t = 0",
        player: "Nature (Chance)",
        playerColor: "#64748b",
        action: "Nature determines worker's productivity type $\\theta \\in \\{\\theta_L, \\theta_H\\}$ with prior $\\Pr(\\theta_H) = p$.",
        information: "Worker privately observes type $\\theta$; Employers do not observe $\\theta$ (Asymmetric Info).",
        payoff: "",
        phase: "Information Generation"
      },
      {
        id: "stage-1",
        timeLabel: "t = 1",
        player: "Worker (Sender)",
        playerColor: "#4f46e5",
        action: "Worker chooses education signal level $e \\ge 0$ incurring cost $c(e, \\theta) = e / \\theta$.",
        information: "Education level $e$ is publicly observable by all market participants.",
        payoff: "",
        phase: "Signaling Phase"
      },
      {
        id: "stage-2",
        timeLabel: "t = 2",
        player: "Employers (Receivers)",
        playerColor: "#0284c7",
        action: "Competitive employers update posterior beliefs $\\mu(\\theta_H \\mid e)$ and offer wage $w(e) = \\mathbb{E}[\\theta \\mid e]$.",
        information: "Beliefs updated via Bayes' rule on equilibrium path; off-path beliefs specified by PBE.",
        payoff: "",
        phase: "Market Clearing"
      },
      {
        id: "stage-3",
        timeLabel: "t = 3",
        player: "Payoffs Realized",
        playerColor: "#10b981",
        action: "Worker produces and receives wage; firms earn zero expected profit under Bertrand competition.",
        information: "Payoffs: $u_W = w(e) - c(e, \\theta)$, $\\quad u_F = \\theta - w(e)$.",
        payoff: "$u_W = w - e/\\theta$",
        phase: "Market Clearing"
      }
    ],
    phases: [
      { name: "Information Generation", from: 0, to: 0 },
      { name: "Signaling & Screening", from: 1, to: 1 },
      { name: "Market Equilibrium & Payoffs", from: 2, to: 3 }
    ],
    options: {
      showPhases: true,
      showInformation: true,
      showPayoffs: true,
      nodeSpacing: 3.2,
      fontScale: 1.0
    }
  };

  // Presets Library
  var TIMING_PRESETS = {
    "spence-signaling": {
      id: "spence-signaling",
      name: "Spence Job Market Signaling",
      category: "Information Economics",
      subtitle: "Asymmetric Information & Costly Signaling",
      description: "Sequence of moves in Michael Spence's seminal labor signaling model with separating and pooling equilibria.",
      tags: ["Signaling", "Bayesian", "Contract Theory"],
      stages: [
        {
          id: "s0",
          timeLabel: "t = 0",
          player: "Nature",
          playerColor: "#64748b",
          action: "Selects type $\\theta \\in \\{\\theta_L, \\theta_H\\}$ with prior $p$.",
          information: "Observed by Worker only (Private Info).",
          payoff: "",
          phase: "Exogenous Setup"
        },
        {
          id: "s1",
          timeLabel: "t = 1",
          player: "Worker",
          playerColor: "#4f46e5",
          action: "Acquires education level $e \\ge 0$ at cost $c(e, \\theta)$.",
          information: "Signal $e$ is publicly observable.",
          payoff: "",
          phase: "Strategic Action"
        },
        {
          id: "s2",
          timeLabel: "t = 2",
          player: "Firms",
          playerColor: "#0284c7",
          action: "Form beliefs $\\mu(e)$ and make wage offers $w(e)$.",
          information: "Bertrand competition drives expected profits to 0.",
          payoff: "",
          phase: "Resolution"
        },
        {
          id: "s3",
          timeLabel: "t = 3",
          player: "Payoffs",
          playerColor: "#10b981",
          action: "Production occurs; payoffs realized.",
          information: "$u_W = w(e) - e/\\theta$; $u_F = \\theta - w(e)$.",
          payoff: "u_W, u_F",
          phase: "Resolution"
        }
      ],
      phases: [
        { name: "Type Determination", from: 0, to: 0 },
        { name: "Signaling Choice", from: 1, to: 1 },
        { name: "Market Clearing & Payoffs", from: 2, to: 3 }
      ]
    },
    "principal-agent": {
      id: "principal-agent",
      name: "Principal-Agent Contracting (Moral Hazard)",
      category: "Contract Theory",
      subtitle: "Incentives, Effort & Stochastic Output",
      description: "Timeline of hidden action: contract proposal, acceptance decision, unobservable effort, and outcome distribution.",
      tags: ["Moral Hazard", "Contract Theory", "Incentives"],
      stages: [
        {
          id: "pa0",
          timeLabel: "t = 0",
          player: "Principal",
          playerColor: "#4f46e5",
          action: "Designs and proposes wage contract $w(y)$ dependent on observable output $y$.",
          information: "Contract terms are common knowledge.",
          payoff: "",
          phase: "Contracting"
        },
        {
          id: "pa1",
          timeLabel: "t = 1",
          player: "Agent",
          playerColor: "#0284c7",
          action: "Accepts or Rejects contract based on reservation utility $\\bar{U}$ (IR Constraint).",
          information: "If rejected, game ends with payoffs $(0, \\bar{U})$.",
          payoff: "",
          phase: "Participation"
        },
        {
          id: "pa2",
          timeLabel: "t = 2",
          player: "Agent",
          playerColor: "#0284c7",
          action: "Chooses unobserved effort $e \\in \\{e_L, e_H\\}$ with cost $\\psi(e)$ (IC Constraint).",
          information: "Effort $e$ is hidden action; not observed by Principal.",
          payoff: "",
          phase: "Moral Hazard"
        },
        {
          id: "pa3",
          timeLabel: "t = 3",
          player: "Nature & Payoffs",
          playerColor: "#10b981",
          action: "Output $y \\in \\{y_L, y_H\\}$ realized according to distribution $\\Pr(y \\mid e)$; wages $w(y)$ paid.",
          information: "Principal receives $y - w(y)$; Agent receives $u(w(y)) - \\psi(e)$.",
          payoff: "",
          phase: "Settlement"
        }
      ],
      phases: [
        { name: "Contract Proposal", from: 0, to: 0 },
        { name: "Participation & Effort", from: 1, to: 2 },
        { name: "Output & Payoffs", from: 3, to: 3 }
      ]
    },
    "akerlof-lemons": {
      id: "akerlof-lemons",
      name: "Akerlof Market for Lemons",
      category: "Information Economics",
      subtitle: "Adverse Selection in Used Vehicle Markets",
      description: "Timeline of market unraveling due to private information on vehicle quality.",
      tags: ["Adverse Selection", "Asymmetric Info", "Market Failure"],
      stages: [
        {
          id: "al0",
          timeLabel: "t = 0",
          player: "Nature",
          playerColor: "#64748b",
          action: "Assigns car quality $\\theta \\sim U[0, 1]$ to Seller.",
          information: "Observed privately by Seller; Buyer only knows uniform prior.",
          payoff: "",
          phase: "Setup"
        },
        {
          id: "al1",
          timeLabel: "t = 1",
          player: "Market / Buyer",
          playerColor: "#0284c7",
          action: "Buyer posts market price $p$ based on expected quality $\\mathbb{E}[\\theta \\mid p]$.",
          information: "Seller chooses to supply car if and only if $p \\ge \\theta$.",
          payoff: "",
          phase: "Trade"
        },
        {
          id: "al2",
          timeLabel: "t = 2",
          player: "Payoffs Realized",
          playerColor: "#10b981",
          action: "Trade executes if $p \\ge \\theta$; adverse selection causes market breakdown if $p < \\bar{\\theta}$.",
          information: "$u_S = p - \\theta$ (if sold) or $0$; $u_B = \\frac{3}{2}\\theta - p$.",
          payoff: "",
          phase: "Payoffs"
        }
      ],
      phases: [
        { name: "Quality Draw", from: 0, to: 0 },
        { name: "Pricing & Adverse Selection", from: 1, to: 2 }
      ]
    },
    "stackelberg-duopoly": {
      id: "stackelberg-duopoly",
      name: "Stackelberg Sequential Duopoly",
      category: "Industrial Organization",
      subtitle: "First-Mover Commitment & Follower Reaction",
      description: "Two firms sequentially choose output quantities. Leader commits first; Follower observes and responds.",
      tags: ["Cournot", "First-Mover Advantage", "Commitment"],
      stages: [
        {
          id: "st1",
          timeLabel: "Stage 1",
          player: "Firm 1 (Leader)",
          playerColor: "#4f46e5",
          action: "Commits to market output quantity $q_1 \\ge 0$.",
          information: "Quantity $q_1$ is irreversibly fixed and observed by Firm 2.",
          payoff: "",
          phase: "Leader Move"
        },
        {
          id: "st2",
          timeLabel: "Stage 2",
          player: "Firm 2 (Follower)",
          playerColor: "#0284c7",
          action: "Observes $q_1$ and chooses best-response quantity $q_2 = R_2(q_1) = \\frac{a - c - q_1}{2}$.",
          information: "Follower reacts optimally to the observed leader commitment.",
          payoff: "",
          phase: "Follower Reaction"
        },
        {
          id: "st3",
          timeLabel: "Stage 3",
          player: "Market Clearing",
          playerColor: "#10b981",
          action: "Aggregate market supply $Q = q_1 + q_2$ determines clearing price $P(Q) = a - bQ$.",
          information: "Profits realized: $\\pi_1 = (P - c)q_1$, $\\pi_2 = (P - c)q_2$.",
          payoff: "",
          phase: "Market Payoffs"
        }
      ],
      phases: [
        { name: "Sequential Production", from: 0, to: 1 },
        { name: "Market Clearing", from: 2, to: 2 }
      ]
    },
    "rubinstein-bargaining": {
      id: "rubinstein-bargaining",
      name: "Rubinstein Alternating-Offer Bargaining",
      category: "Bargaining Theory",
      subtitle: "Infinite Horizon with Discount Factors $\\delta_1, \\delta_2$",
      description: "Players alternate making partition proposals over a surplus of size 1 with time discount factors.",
      tags: ["Bargaining", "Dynamic Games", "SPNE"],
      stages: [
        {
          id: "rb1",
          timeLabel: "t = 1",
          player: "Player 1",
          playerColor: "#4f46e5",
          action: "Proposes division $(x_1, 1 - x_1)$. Player 2 chooses: Accept (Game Ends) or Reject.",
          information: "If rejected, time elapses to $t=2$ discounting surplus by $\\delta$.",
          payoff: "",
          phase: "Period 1"
        },
        {
          id: "rb2",
          timeLabel: "t = 2",
          player: "Player 2",
          playerColor: "#0284c7",
          action: "Counters with offer $(y_2, 1 - y_2)$. Player 1 chooses: Accept or Reject.",
          information: "If rejected, bargaining proceeds to next period with further discounting.",
          payoff: "",
          phase: "Period 2"
        },
        {
          id: "rb3",
          timeLabel: "t = 3",
          player: "Player 1",
          playerColor: "#4f46e5",
          action: "Offers again in period 3. Unique SPNE yields immediate agreement at $t=1$: $x_1^* = \\frac{1 - \\delta_2}{1 - \\delta_1 \\delta_2}$.",
          information: "Subgame perfection eliminates delay in equilibrium.",
          payoff: "",
          phase: "Equilibrium"
        }
      ],
      phases: [
        { name: "Alternating Offers & Delay", from: 0, to: 2 }
      ]
    },
    "entry-deterrence": {
      id: "entry-deterrence",
      name: "Entry Deterrence & Capacity Commitment (Dixit)",
      category: "Industrial Organization",
      subtitle: "Credible Threats & Sunk Capital",
      description: "Incumbent invests in excess production capacity to make aggressive pricing credible in the post-entry subgame.",
      tags: ["Entry Deterrence", "Commitment", "Credible Threat"],
      stages: [
        {
          id: "ed1",
          timeLabel: "t = 1",
          player: "Incumbent",
          playerColor: "#4f46e5",
          action: "Invests in sunk capacity $K$, reducing post-entry marginal cost from $c$ to $c_0$.",
          information: "Capacity $K$ is visible to potential entrants.",
          payoff: "",
          phase: "Commitment"
        },
        {
          id: "ed2",
          timeLabel: "t = 2",
          player: "Entrant",
          playerColor: "#0284c7",
          action: "Decides whether to Enter (paying fixed entry cost $F$) or Stay Out.",
          information: "Entrant anticipates incumbent's optimal post-entry response.",
          payoff: "",
          phase: "Entry Decision"
        },
        {
          id: "ed3",
          timeLabel: "t = 3",
          player: "Post-Entry Subgame",
          playerColor: "#10b981",
          action: "If Entry occurs, duopoly competition ensues; if Stay Out, Incumbent retains monopoly profit.",
          information: "Equilibrium: Incumbent chooses $K^*$ to deter entry credibly.",
          payoff: "",
          phase: "Payoffs"
        }
      ],
      phases: [
        { name: "Strategic Investment", from: 0, to: 0 },
        { name: "Entry & Competition", from: 1, to: 2 }
      ]
    },
    "diamond-dybvig-timing": {
      id: "diamond-dybvig-timing",
      name: "Diamond-Dybvig Liquidity & Bank Run Timeline",
      category: "Financial Economics",
      subtitle: "Maturity Transformation, Liquidity Risk & Fire Sales",
      description: "Timeline of the Diamond-Dybvig model showing how maturity transformation creates vulnerable demand deposit contracts and potential panic runs.",
      tags: ["Banking", "Liquidity Shock", "Bank Run", "Financial Crises"],
      stages: [
        {
          id: "dd0",
          timeLabel: "t = 0",
          player: "Depositors & Bank",
          playerColor: "#4f46e5",
          action: "Depositors deposit endowment $1 in bank; bank invests in illiquid long-term production technology $R > 1$.",
          information: "Symmetric information; deposit contract promises $r_1 = 1$ on early demand.",
          payoff: "",
          phase: "Deposit & Investment"
        },
        {
          id: "dd1",
          timeLabel: "t = 1",
          player: "Nature",
          playerColor: "#64748b",
          action: "Nature draws private liquidity preference: Patient ($t=2$) or Impatient ($t=1$).",
          information: "Type is private info; impatient consumers must consume at $t=1$.",
          payoff: "",
          phase: "Liquidity Shock"
        },
        {
          id: "dd2",
          timeLabel: "t = 2 (Early)",
          player: "Depositors",
          playerColor: "#0284c7",
          action: "Impatient depositors withdraw $r_1$. If panic hits, patient depositors also run.",
          information: "Sequential service constraint: first in line get paid until bank reserves exhaust.",
          payoff: "",
          phase: "Run / Fire Sale"
        },
        {
          id: "dd3",
          timeLabel: "t = 3 (Maturity)",
          player: "Bank / Asset Yield",
          playerColor: "#10b981",
          action: "Long-term technology yields $R$. Remaining patient depositors split residual assets.",
          information: "No run: patient depositors get $R > 1$. Bank run: assets liquidated at fire-sale discount $L < 1$.",
          payoff: "u_{imp} = 1, u_{pat} = R",
          phase: "Maturation & Payoffs"
        }
      ],
      phases: [
        { name: "Deposit & Investment", from: 0, to: 0 },
        { name: "Liquidity Shock", from: 1, to: 1 },
        { name: "Liquidation & Maturation", from: 2, to: 3 }
      ]
    },
    "first-price-auction": {
      id: "first-price-auction",
      name: "First-Price Sealed-Bid Auction Timeline",
      category: "Auction Theory",
      subtitle: "Private Valuations & Strategic Bid Shading",
      description: "Sequence of moves in a static first-price sealed-bid auction under incomplete information with risk-neutral bidders.",
      tags: ["Auction Theory", "Bayesian Game", "Bid Shading", "Private Values"],
      stages: [
        {
          id: "fpa0",
          timeLabel: "Stage 0",
          player: "Nature",
          playerColor: "#64748b",
          action: "Draws independent private valuations $v_i \\sim F(v)$ on $[0, \\bar{v}]$ for each bidder $i$.",
          information: "Bidder $i$ privately observes $v_i$; knows only distribution $F$ of rival valuations.",
          payoff: "",
          phase: "Type Realization"
        },
        {
          id: "fpa1",
          timeLabel: "Stage 1",
          player: "Seller / Rules",
          playerColor: "#64748b",
          action: "Auctioneer announces reserve price $r$ and commits to allocation & payment rules.",
          information: "Rules and reserve price are common knowledge.",
          payoff: "",
          phase: "Auction Announcement"
        },
        {
          id: "fpa2",
          timeLabel: "Stage 2",
          player: "Bidders",
          playerColor: "#4f46e5",
          action: "Bidders independently submit sealed bids $b_i = \\beta(v_i) = \\frac{n-1}{n} v_i$.",
          information: "Simultaneous bids: each bidder trades off win probability against profit margin.",
          payoff: "",
          phase: "Sealed Bidding"
        },
        {
          id: "fpa3",
          timeLabel: "Stage 3",
          player: "Auctioneer",
          playerColor: "#10b981",
          action: "Envelopes opened: highest bidder $b_{(1)}$ wins and pays their own bid price $b_{(1)}$.",
          information: "Winner surplus $v_{(1)} - b_{(1)}$; all losing bidders receive payoff $0$.",
          payoff: "u_i = v_i - b_i",
          phase: "Allocation & Clearing"
        }
      ],
      phases: [
        { name: "Type Realization", from: 0, to: 0 },
        { name: "Rules & Bidding", from: 1, to: 2 },
        { name: "Clearing & Settlement", from: 3, to: 3 }
      ]
    },
    "venture-capital-staged": {
      id: "venture-capital-staged",
      name: "Venture Capital Staged Financing",
      category: "Corporate Finance",
      subtitle: "Milestone Financing, Real Options & Dilution",
      description: "Multi-stage financing round timeline showing how staging mitigates agency costs, entrepreneur hold-up, and downside failure risks.",
      tags: ["Venture Capital", "Staged Financing", "Real Options", "Milestones"],
      stages: [
        {
          id: "vc0",
          timeLabel: "Seed (t=0)",
          player: "Entrepreneur & VC",
          playerColor: "#4f46e5",
          action: "VC provides Seed capital $I_0$ in exchange for preferred equity stake $\\alpha_0$.",
          information: "Contract specifies milestone targets and board governance rights.",
          payoff: "",
          phase: "Seed Round"
        },
        {
          id: "vc1",
          timeLabel: "Series A (t=1)",
          player: "Entrepreneur",
          playerColor: "#0284c7",
          action: "Founder executes R&D; prototype is built and early product-market fit signal $\\theta$ is observed.",
          information: "VC observes KPI traction metrics $\\theta \\in [0, 1]$.",
          payoff: "",
          phase: "Execution & Learning"
        },
        {
          id: "vc2",
          timeLabel: "Series B (t=2)",
          player: "VC Fund",
          playerColor: "#4f46e5",
          action: "VC exercises continuation option: injects growth capital $I_1$ if $\\theta \\ge \\bar{\\theta}$, or abandons/liquidates.",
          information: "Staged funding limits VC downside loss to initial seed tranche $I_0$.",
          payoff: "",
          phase: "Continuation Option"
        },
        {
          id: "vc3",
          timeLabel: "Exit (t=3)",
          player: "Market / IPO",
          playerColor: "#10b981",
          action: "Company executes IPO or acquisition; proceeds distributed according to liquidation seniority.",
          information: "High traction yields returns $V(\\theta)$; failure yields scrap liquidation value.",
          payoff: "\\alpha V, (1-\\alpha)V",
          phase: "Liquidity Exit"
        }
      ],
      phases: [
        { name: "Seed Investment", from: 0, to: 0 },
        { name: "Product Development", from: 1, to: 1 },
        { name: "Milestone Decision & Exit", from: 2, to: 3 }
      ]
    },
    "grossman-hart-moore": {
      id: "grossman-hart-moore",
      name: "Grossman-Hart-Moore Incomplete Contracts",
      category: "Contract Theory",
      subtitle: "Asset Ownership & Property Rights Approach to the Firm",
      description: "Timeline of incomplete contracting where non-verifiable specific human capital investments make asset ownership rights the optimal incentive device.",
      tags: ["Property Rights", "Incomplete Contracts", "Hold-Up", "Firm Boundaries"],
      stages: [
        {
          id: "ghm0",
          timeLabel: "t = 0",
          player: "Buyer & Supplier",
          playerColor: "#4f46e5",
          action: "Parties negotiate asset ownership structure (Integration vs Non-integration) to allocate residual control rights.",
          information: "Complex future states cannot be specified in a court-enforceable contract.",
          payoff: "",
          phase: "Governance Choice"
        },
        {
          id: "ghm1",
          timeLabel: "t = 1",
          player: "Supplier & Buyer",
          playerColor: "#0284c7",
          action: "Parties choose relationship-specific human capital investments $i$ and $e$ at private cost $c(i)$ and $c(e)$.",
          information: "Investments are observable between parties but non-verifiable in court.",
          payoff: "",
          phase: "Specific Investment"
        },
        {
          id: "ghm2",
          timeLabel: "t = 2",
          player: "Bargaining",
          playerColor: "#64748b",
          action: "Uncertainty resolves; parties engage in ex-post Nash bargaining over generated surplus $V(i, e)$.",
          information: "Disagreement default payoffs are determined by who owns the physical assets.",
          payoff: "",
          phase: "Ex-Post Bargaining"
        },
        {
          id: "ghm3",
          timeLabel: "t = 3",
          player: "Trade & Payoffs",
          playerColor: "#10b981",
          action: "Specialized components delivered; final goods produced and bargaining shares distributed.",
          information: "Residual control owner has stronger ex-ante investment incentives.",
          payoff: "u_B, u_S",
          phase: "Payoffs"
        }
      ],
      phases: [
        { name: "Asset Ownership", from: 0, to: 0 },
        { name: "Specific Investment", from: 1, to: 1 },
        { name: "Bargaining & Settlement", from: 2, to: 3 }
      ]
    },
    "barro-gordon-inflation": {
      id: "barro-gordon-inflation",
      name: "Barro-Gordon Monetary Policy Credibility",
      category: "Macroeconomics",
      subtitle: "Time Inconsistency & Inflation Bias",
      description: "Dynamic sequence of expectations and monetary policy showing how discretionary central banking creates inflation bias without lowering unemployment.",
      tags: ["Time Inconsistency", "Central Banking", "Monetary Policy", "Inflation Bias"],
      stages: [
        {
          id: "bg0",
          timeLabel: "t = 0",
          player: "Private Sector",
          playerColor: "#4f46e5",
          action: "Unions & firms form rational inflation expectations $\\pi^e$ and lock in nominal wage contracts.",
          information: "Public observes central bank preferences and objective loss function.",
          payoff: "",
          phase: "Expectations Formation"
        },
        {
          id: "bg1",
          timeLabel: "t = 1",
          player: "Nature",
          playerColor: "#64748b",
          action: "Nature draws economic supply/velocity shock $\\varepsilon \\sim (0, \\sigma^2)$.",
          information: "Central bank observes shock $\\varepsilon$ before setting policy.",
          payoff: "",
          phase: "Supply Shock"
        },
        {
          id: "bg2",
          timeLabel: "t = 2",
          player: "Central Bank",
          playerColor: "#0284c7",
          action: "Central Bank sets actual inflation $\\pi$, tempted to create surprise inflation $\\pi - \\pi^e > 0$ to expand output.",
          information: "Discretion leads to inflation bias $\\pi^* = \\frac{k}{\\gamma} > 0$.",
          payoff: "",
          phase: "Policy Choice"
        },
        {
          id: "bg3",
          timeLabel: "t = 3",
          player: "Macro Economy",
          playerColor: "#10b981",
          action: "Real wages adjust; output $y = \\bar{y} + \\alpha(\\pi - \\pi^e) - \\varepsilon$ is realized.",
          information: "In rational equilibrium $\\pi = \\pi^e$: surprise is zero, output unchanged, positive deadweight inflation loss.",
          payoff: "L = \\frac{1}{2}(\\pi^2 + \\gamma(y - y^*)^2)",
          phase: "Equilibrium Outcome"
        }
      ],
      phases: [
        { name: "Wage Setting", from: 0, to: 0 },
        { name: "Macro Shock", from: 1, to: 1 },
        { name: "Monetary Discretion & Payoffs", from: 2, to: 3 }
      ]
    },
    "clinical-trial-fda": {
      id: "clinical-trial-fda",
      name: "Pharmaceutical R&D & FDA Approval Pipeline",
      category: "Health Economics & Regulation",
      subtitle: "Pre-Clinical, Phase I-III Trials & Market Exclusivity",
      description: "Staged pharmaceutical drug development protocol: high upfront investment under strict regulatory milestones and trial failure risks.",
      tags: ["Pharmaceuticals", "Regulation", "R&D Pipeline", "Staged Real Options"],
      stages: [
        {
          id: "ct0",
          timeLabel: "Discovery (t=0)",
          player: "Pharma Sponsor",
          playerColor: "#4f46e5",
          action: "Sinks pre-clinical lab discovery & animal pharmacology; files Investigational New Drug (IND) application.",
          information: "Success probability $p_0 \\approx 0.15$; high sunk capital requirement.",
          payoff: "",
          phase: "Pre-Clinical"
        },
        {
          id: "ct1",
          timeLabel: "Phase I-II (t=1)",
          player: "Clinical Investigators",
          playerColor: "#0284c7",
          action: "Evaluates dosage safety and preliminary therapeutic efficacy across human patient cohorts.",
          information: "Interim data revealed: safety profile and efficacy endpoints.",
          payoff: "",
          phase: "Clinical Trials"
        },
        {
          id: "ct2",
          timeLabel: "Phase III & FDA (t=2)",
          player: "FDA / Regulatory Agency",
          playerColor: "#64748b",
          action: "Multi-center double-blind randomized trials complete; FDA reviews New Drug Application (NDA) for approval.",
          information: "Regulatory decision: unconditional approval, black box warning, or complete response rejection.",
          payoff: "",
          phase: "Regulatory Review"
        },
        {
          id: "ct3",
          timeLabel: "Market Launch (t=3)",
          player: "Commercial Market",
          playerColor: "#10b981",
          action: "Approved therapy launches with patent exclusivity; eventual generic entry upon patent expiry.",
          information: "Monopoly profits during patent term; price drops to marginal cost after generic entry.",
          payoff: "\\Pi_{brand}, CS",
          phase: "Commercialization"
        }
      ],
      phases: [
        { name: "Pre-Clinical", from: 0, to: 0 },
        { name: "Clinical Trials", from: 1, to: 1 },
        { name: "Regulatory Review", from: 2, to: 2 },
        { name: "Commercialization", from: 3, to: 3 }
      ]
    },
    "patent-race-timing": {
      id: "patent-race-timing",
      name: "R&D Patent Race & Preemption Protocol",
      category: "Industrial Organization",
      subtitle: "Winner-Take-All Discovery, Priority Filing & Patent Expiry",
      description: "Sequence of moves in dynamic technological competition: firms invest flow R&D expenditures to discover breakthrough innovations first.",
      tags: ["Patent Race", "Preemption", "First-Mover", "Innovation"],
      stages: [
        {
          id: "pr0",
          timeLabel: "t = 0",
          player: "Firms A & B",
          playerColor: "#4f46e5",
          action: "Firms choose R&D investment intensities $x_A, x_B$; hazard rate of discovery is $\\lambda(x_i)$.",
          information: "Investment levels observable; breakthrough timing governed by Poisson process.",
          payoff: "",
          phase: "R&D Investment"
        },
        {
          id: "pr1",
          timeLabel: "t = 1",
          player: "Nature",
          playerColor: "#64748b",
          action: "First breakthrough occurs at stochastic arrival time $\\tau = \\min(\\tau_A, \\tau_B)$.",
          information: "Identity of inventor is revealed publicly.",
          payoff: "",
          phase: "Breakthrough Discovery"
        },
        {
          id: "pr2",
          timeLabel: "t = 2",
          player: "Patent Office",
          playerColor: "#0284c7",
          action: "Grants 20-year exclusive legal patent to first inventor; rival is blocked from practicing technology.",
          information: "Legal exclusivity creates monopoly rents for duration of patent.",
          payoff: "",
          phase: "Patent Grant"
        },
        {
          id: "pr3",
          timeLabel: "t = 3",
          player: "Market Expiry",
          playerColor: "#10b981",
          action: "Patent expires; generic and open-source competitors enter freely, driving consumer surplus up.",
          information: "Post-patent competition restores allocative market efficiency.",
          payoff: "\\pi_{monopoly} \\rightarrow \\pi_{competitive}",
          phase: "Market Competition"
        }
      ],
      phases: [
        { name: "R&D Race", from: 0, to: 1 },
        { name: "Patent Exclusivity", from: 2, to: 2 },
        { name: "Public Domain", from: 3, to: 3 }
      ]
    },
    "sovereign-debt-crisis": {
      id: "sovereign-debt-crisis",
      name: "Sovereign Debt Issuance & Restructuring",
      category: "Financial Economics",
      subtitle: "Eaton-Gersovitz Sovereign Default & Haircut Bargaining",
      description: "Dynamic sequence of sovereign debt issuance, macroeconomic shock, strategic default decision, and creditor restructuring negotiations.",
      tags: ["Sovereign Debt", "Strategic Default", "Haircut", "Debt Restructuring"],
      stages: [
        {
          id: "sd0",
          timeLabel: "t = 0 (Issuance)",
          player: "Sovereign & Investors",
          playerColor: "#4f46e5",
          action: "Government issues sovereign bonds at spread $s$; international creditors purchase debt.",
          information: "Creditors price default probability based on debt-to-GDP and external vulnerability.",
          payoff: "",
          phase: "Bond Issuance"
        },
        {
          id: "sd1",
          timeLabel: "t = 1 (Shock)",
          player: "Nature",
          playerColor: "#64748b",
          action: "Adverse terms-of-trade or commodity price collapse strikes sovereign export revenues.",
          information: "Fiscal revenues fall sharply; debt service burden becomes unsustainable.",
          payoff: "",
          phase: "Macro Shock"
        },
        {
          id: "sd2",
          timeLabel: "t = 2 (Default)",
          player: "Sovereign Government",
          playerColor: "#0284c7",
          action: "Sovereign chooses whether to implement harsh fiscal austerity or declare debt moratorium / default.",
          information: "Default triggers market exclusion and international trade sanctions.",
          payoff: "",
          phase: "Default Decision"
        },
        {
          id: "sd3",
          timeLabel: "t = 3 (Restructuring)",
          player: "Creditor Committee & IMF",
          playerColor: "#10b981",
          action: "Bondholders and government negotiate debt exchange with nominal haircut $h$; IMF program commences.",
          information: "Debt sustainability restored; sovereign regains international capital market access.",
          payoff: "(1-h)D, -\\text{Sanction}",
          phase: "Restructuring"
        }
      ],
      phases: [
        { name: "Borrowing", from: 0, to: 0 },
        { name: "Distress & Shock", from: 1, to: 1 },
        { name: "Default & Haircut", from: 2, to: 3 }
      ]
    }
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Phase membership belongs to stages, not their current positions. Legacy
  // presets/projects use inclusive index ranges; migrate those before any edit.
  function normalizePhases() {
    var stages = timingState.stages;
    timingState.phases = timingState.phases.filter(function(ph) {
      var ids = Array.isArray(ph.stageIds) ? ph.stageIds : stages
        .filter(function(stage, idx) { return idx >= ph.from && idx <= ph.to; })
        .map(function(stage) { return stage.id; });
      var indices = [];
      ph.stageIds = stages.filter(function(stage, idx) {
        if (ids.indexOf(stage.id) === -1) return false;
        indices.push(idx);
        return true;
      }).map(function(stage) { return stage.id; });
      if (!indices.length) return false;
      // Bounds retained for legacy readers only. Renderers must use runs below.
      ph.from = indices[0];
      ph.to = indices[indices.length - 1];
      return true;
    });
  }

  function getPhaseRanges() {
    normalizePhases();
    var ranges = [];
    timingState.phases.forEach(function(ph) {
      var run = null;
      timingState.stages.forEach(function(stage, idx) {
        if (ph.stageIds.indexOf(stage.id) === -1) {
          run = null;
        } else if (run) {
          run.to = idx;
        } else {
          run = { name: ph.name, from: idx, to: idx };
          ranges.push(run);
        }
      });
    });
    return ranges;
  }

  var nextStageId = 0;
  function createStageId() {
    var id;
    do {
      id = "stage-added-" + nextStageId++;
    } while (timingState.stages.some(function(stage) { return stage.id === id; }));
    return id;
  }

  function loadPreset(presetId) {
    var p = TIMING_PRESETS[presetId];
    if (!p) return;
    timingState.title = p.name;
    timingState.stages = clone(p.stages);
    timingState.phases = p.phases ? clone(p.phases) : [];
    renderAll();
  }

  // Generate TikZ Code for Dynamic Game Timing
  function generateTikZCode(isStandalone) {
    var stages = timingState.stages;
    var phases = getPhaseRanges();
    var opts = timingState.options;
    var n = stages.length;

    var out = [];

    if (isStandalone) {
      out.push("% Generated with Game Theory TikZ Studio");
      out.push("% Dynamic Game Timing & Sequence of Play");
      out.push("\\documentclass[border=8pt]{standalone}");
      out.push("\\usepackage{tikz}");
      out.push("\\usepackage{amsmath, amssymb}");
      out.push("\\usetikzlibrary{calc, positioning, decorations.pathreplacing}");
      out.push("");
      out.push("\\begin{document}");
    }

    out.push("\\begin{tikzpicture}[>=stealth, font=\\sffamily]");
    out.push("  % Timing Axis Parameters & TikZ Syntax Guide:");
    out.push("  % - \\def\\dx specifies equidistant horizontal spacing between sequential stages.");
    out.push("  % - (T0, T1, ...) anchor time labels below the main timeline axis.");
    out.push("  % - (P0, P1, ...) position acting players immediately above each stage tick.");
    out.push("  % - (A0, A1, ...) wrap strategic action descriptions above players.");
    out.push("  % - (I0, I1, ...) anchor private/public information sets below the time labels.");
    out.push("  % - decorations.pathreplacing draws top-level braces to group stages into phases.");
    var dxNum = opts.nodeSpacing || 3.6;
    var dx = dxNum.toFixed(1);
    out.push("  \\def\\dx{" + dx + "} % Distance between stage nodes");
    out.push("");

    // Player Colors
    out.push("  % Player Palette");
    out.push("  \\definecolor{naturecolor}{HTML}{64748B}");
    out.push("  \\definecolor{p1color}{HTML}{4F46E5}");
    out.push("  \\definecolor{p2color}{HTML}{0284C7}");
    out.push("  \\definecolor{payoffcolor}{HTML}{10B981}");
    out.push("");

    // Horizontal Stage Axis Line
    // Stage 0 is at 0.0, extending to -1.6cm text width. Axis starts at -1.8cm.
    // Last stage is at (n-1)*dx, extending to +1.6cm text width. Axis ends at totalLen + 2.2cm.
    var totalLen = (n - 1) * dxNum;
    var axisStart = "-1.8";
    var axisEnd = (totalLen + 2.2).toFixed(1);
    out.push("  % Horizontal Stage Axis");
    out.push("  \\draw[very thick, ->] (" + axisStart + ", 0) -- (" + axisEnd + ", 0) node[right, font=\\small\\bfseries] {" + timingState.axisLabel + "};");
    out.push("");

    // Stage Ticks & Nodes
    out.push("  % Stage Marks & Descriptions");
    stages.forEach(function(s, i) {
      var xCoord = (i * dxNum).toFixed(1);
      out.push("  % --- Stage " + i + ": " + s.timeLabel + " (" + s.player + ") ---");
      // Tick mark
      out.push("  \\draw[thick] (" + xCoord + ", 0.15) -- (" + xCoord + ", -0.15);");
      out.push("  \\fill (" + xCoord + ", 0) circle (2.5pt);");

      // Time Coordinate below axis (named T0, T1, ...)
      out.push("  \\node[below=0.25cm, font=\\bfseries] (T" + i + ") at (" + xCoord + ", 0) {" + s.timeLabel + "};");

      // Active Mover (above axis)
      out.push("  \\node[above=0.35cm, font=\\bfseries\\small, align=center, fill=white, inner sep=2pt] (P" + i + ") at (" + xCoord + ", 0) {" + s.player + "};");

      // Action description above player node
      var safeAction = s.action.replace(/"/g, "'");
      out.push("  \\node[above=0.2cm of P" + i + ", text width=3.2cm, align=center, font=\\footnotesize] (A" + i + ") {" + safeAction + "};");

      // Information state below time coordinate (anchored to T_i to prevent overlap or gaps)
      var lastBelow = "T" + i;
      if (opts.showInformation && s.information) {
        var safeInfo = s.information.replace(/"/g, "'");
        out.push("  \\node[below=0.2cm of " + lastBelow + ", text width=3.2cm, align=center, font=\\scriptsize, text=gray!80] (I" + i + ") {" + safeInfo + "};");
        lastBelow = "I" + i;
      }

      // Payoffs realized (if shown)
      if (opts.showPayoffs && s.payoff) {
        var safePayoff = s.payoff.replace(/"/g, "'");
        out.push("  \\node[below=0.15cm of " + lastBelow + ", font=\\scriptsize\\bfseries, text=payoffcolor] (Pay" + i + ") {" + safePayoff + "};");
      }
      out.push("");
    });

    // Decorative Brackets for Phases
    if (opts.showPhases && phases.length > 0) {
      // Calculate dynamic brace height based on the tallest action text
      var maxActionLines = 1;
      stages.forEach(function(s) {
        var lines = Math.max(1, Math.ceil(((s.action || "").length) / 32));
        if (lines > maxActionLines) maxActionLines = lines;
      });
      // P node top is ~0.9cm, A node top is ~1.1 + lines*0.42cm
      var braceY = (1.0 + maxActionLines * 0.42 + 0.35).toFixed(2);

      out.push("  % Stage Grouping Brackets (Phases)");
      phases.forEach(function(ph, idx) {
        var phasePad = Math.min(1.5, dxNum * 0.45);
        var fromX = (ph.from * dxNum - phasePad).toFixed(2);
        var toX = (ph.to * dxNum + phasePad).toFixed(2);
        var labelWidth = ((ph.to - ph.from) * dxNum + 2 * phasePad - 0.15).toFixed(2);
        out.push("  \\draw[decorate, decoration={brace, amplitude=5pt}, thick, gray!70]");
        out.push("    (" + fromX + ", " + braceY + ") -- (" + toX + ", " + braceY + ")");
        // Phase titles are text; preserve explicitly escaped ampersands.
        var phaseName = ph.name.replace(/(^|[^\\])&/g, '$1\\&');
        out.push("    node[midway, above=7pt, text width=" + labelWidth + "cm, align=center, inner xsep=0pt, font=\\small\\bfseries, text=gray!90] {" + phaseName + "};");
      });
      out.push("");
    }

    out.push("\\end{tikzpicture}");

    if (isStandalone) {
      out.push("\\end{document}");
    }

    return out.join("\n");
  }

  // Format LaTeX Math for Crisp Canvas Typography
  function formatMathForCanvas(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\mathrm\{([^}]+)\}/g, '$1')
      .replace(/\\mathbf\{([^}]+)\}/g, '$1')
      .replace(/\\mathbb\{E\}/g, 'E')
      .replace(/\\mathbb\{([^}]+)\}/g, '$1')
      .replace(/\\Pr/g, 'Pr')
      .replace(/\\theta_H/g, 'θ_H')
      .replace(/\\theta_L/g, 'θ_L')
      .replace(/\\theta/g, 'θ')
      .replace(/\\bar\{\\theta\}/g, 'θ̄')
      .replace(/\\bar\{([^}]+)\}/g, '$1̄')
      .replace(/\\mu/g, 'μ')
      .replace(/\\delta_1/g, 'δ₁')
      .replace(/\\delta_2/g, 'δ₂')
      .replace(/\\delta/g, 'δ')
      .replace(/\\pi_1/g, 'π₁')
      .replace(/\\pi_2/g, 'π₂')
      .replace(/\\pi/g, 'π')
      .replace(/\\sigma/g, 'σ')
      .replace(/\\in/g, '∈')
      .replace(/\\geq?/g, '≥')
      .replace(/\\leq?/g, '≤')
      .replace(/\\neq/g, '≠')
      .replace(/\\approx/g, '≈')
      .replace(/\\sim/g, '~')
      .replace(/\\mid/g, '|')
      .replace(/\\quad/g, ' ')
      .replace(/\\qquad/g, '  ')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
      .replace(/\\\{/g, '{')
      .replace(/\\\}/g, '}')
      .replace(/\$+/g, '')
      .replace(/\\([a-zA-Z]+)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Accurately wrap text based on canvas text measurements
  function getWrappedLines(ctx, text, maxWidth, breakLongWords) {
    if (!text) return [];
    var clean = formatMathForCanvas(text);
    var words = clean.split(' ');
    if (breakLongWords) {
      words = words.reduce(function(parts, word) {
        var part = '';
        Array.from(word).forEach(function(ch) {
          if (part && ctx.measureText(part + ch).width > maxWidth) {
            parts.push(part);
            part = '';
          }
          part += ch;
        });
        if (part) parts.push(part);
        return parts;
      }, []);
    }
    var lines = [];
    var currentLine = '';

    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (!word) continue;
      var testLine = currentLine ? (currentLine + ' ' + word) : word;
      var width = ctx.measureText(testLine).width;
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  // HTML5 Canvas Rendering
  function renderCanvas() {
    var canvas = document.getElementById("timing-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var stages = timingState.stages;
    var phases = getPhaseRanges();
    var opts = timingState.options;
    var n = stages.length;

    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var width = Math.max(rect.width || 820, 820);
    // Start from a stable base; the previous intrinsic canvas height may include
    // expanded phase labels and must not cause growth on repeated renders.
    var height = 480;

    if (n === 0) return;

    // Responsive Geometry & Column Widths
    var marginL = n >= 5 ? 60 : 75;
    var marginR = n >= 5 ? 110 : 130;
    var availW = width - marginL - marginR;
    var stepX = n > 1 ? (availW / (n - 1)) : (availW / 2);
    var colWidth = Math.min(Math.max(stepX - 22, 110), 175);
    var badgeW = Math.min(Math.max(stepX - 26, 95), 135);
    var badgeH = 26;
    var axisY = Math.floor(height * 0.49); // 235px

    // Pre-calculate wrapped lines for all stages to determine precise vertical bounds
    var stageData = stages.map(function(s, idx) {
      var x = marginL + idx * stepX;
      ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
      var actionLines = getWrappedLines(ctx, s.action, colWidth);
      
      ctx.font = "10.5px -apple-system, BlinkMacSystemFont, sans-serif";
      var infoLines = (opts.showInformation && s.information) ? getWrappedLines(ctx, s.information, colWidth) : [];
      
      return {
        x: x,
        actionLines: actionLines,
        infoLines: infoLines
      };
    });

    // Calculate action text starting baselines (stacking UPWARDS above player badges)
    var actionLineHeight = 14.5;
    var badgeY = axisY - 38; // center of player badge
    var badgeTop = badgeY - badgeH / 2; // top of player badge
    var actionBottomBaseline = badgeTop - 10; // bottom line of action text sits 10px above badge

    var minActionTop = axisY - 60; // track highest action baseline for bracket positioning
    stageData.forEach(function(sd) {
      var linesCount = sd.actionLines.length;
      sd.actionStartY = actionBottomBaseline - (linesCount - 1) * actionLineHeight;
      if (sd.actionStartY < minActionTop) {
        minActionTop = sd.actionStartY;
      }
    });

    // Wrap each phase within its actual contiguous run, with a gutter between
    // adjacent runs. Reserve space above the actions for every label line.
    var phaseLineHeight = 14;
    var maxPhaseLines = 0;
    ctx.font = "bold 11.5px -apple-system, BlinkMacSystemFont, sans-serif";
    var phaseData = opts.showPhases ? phases.map(function(ph) {
      var spanPad = Math.min(colWidth * (ph.from === ph.to ? 0.48 : 0.42), stepX * 0.45);
      var startX = stageData[ph.from].x - spanPad;
      var endX = stageData[ph.to].x + spanPad;
      var lines = getWrappedLines(ctx, ph.name, Math.max(1, endX - startX - 10), true);
      maxPhaseLines = Math.max(maxPhaseLines, lines.length);
      return { startX: startX, endX: endX, lines: lines };
    }) : [];
    var bracketY = minActionTop - 22;
    var requiredBracketY = 28 + maxPhaseLines * phaseLineHeight;
    var extraTop = phaseData.length ? Math.max(0, requiredBracketY - bracketY) : 0;
    axisY += extraTop;
    badgeY += extraTop;
    bracketY += extraTop;
    height += extraTop;
    stageData.forEach(function(sd) { sd.actionStartY += extraTop; });

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Canvas background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(10, 10, width - 20, height - 20);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Render Phases Brackets (if enabled)
    if (phaseData.length > 0) {
      phaseData.forEach(function(ph) {
        var startX = ph.startX;
        var endX = ph.endX;

        // Draw bracket
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(startX, bracketY + 8);
        ctx.lineTo(startX, bracketY);
        ctx.lineTo(endX, bracketY);
        ctx.lineTo(endX, bracketY + 8);
        ctx.stroke();

        // Center bracket tip pointing UP
        var midX = (startX + endX) / 2;
        ctx.beginPath();
        ctx.moveTo(midX - 7, bracketY);
        ctx.lineTo(midX, bracketY - 6);
        ctx.lineTo(midX + 7, bracketY);
        ctx.stroke();

        // Phase Title
        ctx.font = "bold 11.5px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = "#334155";
        ctx.textAlign = "center";
        ph.lines.forEach(function(line, idx) {
          ctx.fillText(line, midX, bracketY - 11 - (ph.lines.length - 1 - idx) * phaseLineHeight);
        });
      });
    }

    // Draw Main Axis Line with Arrow
    var axisStart = marginL - 35;
    var lastX = stageData[n - 1].x;
    var axisEnd = Math.min(width - 24, lastX + 50);

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(axisStart, axisY);
    ctx.lineTo(axisEnd, axisY);
    ctx.stroke();

    // Arrow Head
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(axisEnd, axisY);
    ctx.lineTo(axisEnd - 12, axisY - 5.5);
    ctx.lineTo(axisEnd - 12, axisY + 5.5);
    ctx.closePath();
    ctx.fill();

    // Axis Label placed cleanly at the arrow tip
    ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "right";
    ctx.fillText(formatMathForCanvas(timingState.axisLabel), axisEnd, axisY - 12);

    // Render Each Stage
    stages.forEach(function(s, idx) {
      var sd = stageData[idx];
      var x = sd.x;

      // 1. Tick mark on axis
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, axisY - 7);
      ctx.lineTo(x, axisY + 7);
      ctx.stroke();

      // 2. Node circle on axis
      ctx.fillStyle = s.playerColor || "#4f46e5";
      ctx.beginPath();
      ctx.arc(x, axisY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Player badge (above axis, with 12px gap to action text)
      ctx.fillStyle = s.playerColor || "#4f46e5";
      roundRect(ctx, x - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 6, true, false);

      ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(formatMathForCanvas(s.player), x, badgeY + 4);

      // 4. Action Description (above badge, never overlapping)
      ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "center";
      sd.actionLines.forEach(function(line, lIdx) {
        ctx.fillText(line, x, sd.actionStartY + lIdx * actionLineHeight);
      });

      // 5. Time label below tick mark
      var timeLabelY = axisY + 26;
      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'JetBrains Mono', monospace";
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.fillText(formatMathForCanvas(s.timeLabel), x, timeLabelY);

      // 6. Information state / beliefs below time label
      var infoLineHeight = 13.5;
      var infoStartY = timeLabelY + 18;
      var lastBottomY = timeLabelY;
      if (opts.showInformation && sd.infoLines.length > 0) {
        ctx.font = "10.5px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = "#475569";
        ctx.textAlign = "center";
        sd.infoLines.forEach(function(line, lIdx) {
          ctx.fillText(line, x, infoStartY + lIdx * infoLineHeight);
        });
        lastBottomY = infoStartY + (sd.infoLines.length - 1) * infoLineHeight;
      }

      // 7. Payoffs (if enabled and present)
      if (opts.showPayoffs && s.payoff) {
        var payoffY = lastBottomY + 20;
        var cleanPayoff = formatMathForCanvas(s.payoff);
        ctx.font = "bold 10px -apple-system, BlinkMacSystemFont, sans-serif";
        var textW = ctx.measureText(cleanPayoff).width;
        var pillW = Math.max(textW + 16, 60);
        var pillH = 19;
        
        ctx.fillStyle = "#ecfdf5";
        ctx.strokeStyle = "#a7f3d0";
        ctx.lineWidth = 1;
        roundRect(ctx, x - pillW / 2, payoffY - pillH / 2, pillW, pillH, 4, true, true);

        ctx.fillStyle = "#047857";
        ctx.textAlign = "center";
        ctx.fillText(cleanPayoff, x, payoffY + 3.5);
      }
    });
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function updateCodeViews() {
    var fn = window.formatTikZSyntax || escapeHTML;
    var tikzElem = document.getElementById("timing-tikz-code");
    if (tikzElem) {
      var code = generateTikZCode(false);
      tikzElem.value = code;
      var hl = document.getElementById("timing-tikz-highlight");
      if (hl) {
        hl.innerHTML = '<code style="color: #f8fafc; background: transparent; border: none; font-family: inherit;">' + fn(code) + '</code>';
      }
    }
    var standaloneElem = document.getElementById("timing-standalone-code");
    if (standaloneElem) {
      var sCode = generateTikZCode(true);
      standaloneElem.value = sCode;
      var sHl = document.getElementById("timing-standalone-highlight");
      if (sHl) {
        sHl.innerHTML = '<code style="color: #f8fafc; background: transparent; border: none; font-family: inherit;">' + fn(sCode) + '</code>';
      }
    }
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function renderStageList() {
    var container = document.getElementById("stages-editor-list");
    if (!container) return;

    container.innerHTML = timingState.stages.map(function(s, idx) {
      return '<div style="background: #ffffff; border: 1px solid var(--color-border); border-radius: 8px; padding: 0.75rem; margin-bottom: 0.75rem; box-shadow: var(--shadow-sm);">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">' +
          '<div style="display: flex; align-items: center; gap: 0.4rem;">' +
            '<span style="font-size: 0.75rem; font-weight: 700; background: #e0e7ff; color: #3730a3; padding: 2px 7px; border-radius: 4px;">#' + (idx + 1) + '</span>' +
            '<input type="text" maxlength="10000" class="input-modern" style="width: 70px; padding: 0.2rem 0.4rem; font-size: 0.8rem; font-weight: 700;" value="' + escapeHTML(s.timeLabel) + '" data-project-path="stages.' + idx + '.timeLabel" onchange="GameTimingApp.updateStageProp(' + idx + ', \'timeLabel\', this.value);">' +
            '<input type="text" maxlength="10000" class="input-modern" style="width: 130px; padding: 0.2rem 0.4rem; font-size: 0.8rem; font-weight: 600; color: ' + escapeHTML(s.playerColor) + ';" value="' + escapeHTML(s.player) + '" data-project-path="stages.' + idx + '.player" onchange="GameTimingApp.updateStageProp(' + idx + ', \'player\', this.value);">' +
          '</div>' +
          '<div style="display: flex; gap: 0.25rem;">' +
            '<button type="button" class="btn-modern btn-modern-secondary" onclick="GameTimingApp.moveStage(' + idx + ', -1);" ' + (idx === 0 ? 'disabled' : '') + ' style="padding: 0.2rem 0.4rem; font-size: 0.7rem;">▲</button>' +
            '<button type="button" class="btn-modern btn-modern-secondary" onclick="GameTimingApp.moveStage(' + idx + ', 1);" ' + (idx === timingState.stages.length - 1 ? 'disabled' : '') + ' style="padding: 0.2rem 0.4rem; font-size: 0.7rem;">▼</button>' +
            '<button type="button" class="btn-modern btn-modern-secondary" onclick="GameTimingApp.deleteStage(' + idx + ');" style="padding: 0.2rem 0.4rem; font-size: 0.7rem; color: #ef4444;">✕</button>' +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom: 0.4rem;">' +
          '<label style="font-size: 0.72rem; color: var(--color-text-muted); display: block;">Action / Decision Taken:</label>' +
          '<textarea maxlength="10000" class="input-modern" style="width: 100%; height: 48px; font-size: 0.78rem; padding: 0.3rem 0.5rem; resize: vertical;" data-project-path="stages.' + idx + '.action" onchange="GameTimingApp.updateStageProp(' + idx + ', \'action\', this.value);">' + escapeHTML(s.action) + '</textarea>' +
        '</div>' +
        '<div style="margin-bottom: 0.4rem;">' +
          '<label style="font-size: 0.72rem; color: var(--color-text-muted); display: block;">Information State / Beliefs:</label>' +
          '<input type="text" maxlength="10000" class="input-modern" style="width: 100%; font-size: 0.78rem; padding: 0.3rem 0.5rem;" value="' + escapeHTML(s.information || '') + '" data-project-path="stages.' + idx + '.information" onchange="GameTimingApp.updateStageProp(' + idx + ', \'information\', this.value);">' +
        '</div>' +
        '<div>' +
          '<label style="font-size: 0.72rem; color: var(--color-text-muted); display: block;">Realized Payoff / Outcome (Optional):</label>' +
          '<input type="text" maxlength="10000" class="input-modern" style="width: 100%; font-size: 0.78rem; padding: 0.3rem 0.5rem;" value="' + escapeHTML(s.payoff || '') + '" placeholder="e.g. u_W = w - e/θ" data-project-path="stages.' + idx + '.payoff" onchange="GameTimingApp.updateStageProp(' + idx + ', \'payoff\', this.value);">' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderAll() {
    normalizePhases();
    renderCanvas();
    renderStageList();
    updateCodeViews();
  }

  var GameTimingApp = {
    generateTikZCode: generateTikZCode,
    getState: function() { return timingState; },
    normalizePhases: normalizePhases,
    getPhaseRanges: getPhaseRanges,
    loadPreset: loadPreset,
    getPresets: function() { return TIMING_PRESETS; },
    updateStageProp: function(idx, prop, val) {
      if (timingState.stages[idx]) {
        timingState.stages[idx][prop] = val;
        renderAll();
      }
    },
    addStage: function() {
      normalizePhases();
      var nextNum = timingState.stages.length;
      timingState.stages.push({
        id: createStageId(),
        timeLabel: "t = " + nextNum,
        player: "Player " + ((nextNum % 2) + 1),
        playerColor: nextNum % 2 === 0 ? "#4f46e5" : "#0284c7",
        action: "Chooses strategy action $s_" + nextNum + "$.",
        information: "Action observed by all active players.",
        payoff: "",
        phase: "Stage " + nextNum
      });
      renderAll();
    },
    moveStage: function(idx, dir) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= timingState.stages.length ||
          (dir !== -1 && dir !== 1)) return;
      var target = idx + dir;
      if (target < 0 || target >= timingState.stages.length) return;
      normalizePhases();
      var temp = timingState.stages[idx];
      timingState.stages[idx] = timingState.stages[target];
      timingState.stages[target] = temp;
      renderAll();
    },
    deleteStage: function(idx) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= timingState.stages.length) return;
      if (timingState.stages.length <= 1) {
        if (window.showToast) {
          window.showToast("Must have at least one stage in the game timing diagram.");
        }
        return;
      }
      normalizePhases();
      timingState.stages.splice(idx, 1);
      renderAll();
    },
    setOption: function(key, val) {
      timingState.options[key] = val;
      renderAll();
    },
    renderAll: renderAll
  };

  normalizePhases();
  window.GameTimingApp = GameTimingApp;

  window.addEventListener('DOMContentLoaded', function() {
    renderAll();
  });

  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      renderCanvas();
    }, 100);
  });

})(window);
