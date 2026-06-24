# Fiscal Forge – Strategic Budget Optimizer

## Overview

Fiscal Forge is a single-page web application that applies classic Data Structures and Algorithms (DSA) concepts to solve real-world personal finance problems. The system helps users optimize budgets, allocate savings intelligently, predict future spending trends, and rebalance overspent budgets.

Designed specifically for household budgeting, Fiscal Forge operates entirely on the client side with zero server dependency and supports Pakistani Rupee (PKR) calculations.

---

## Features

### Budget Optimizer (0/1 Knapsack Algorithm)

* Selects the optimal combination of expenses within a given budget.
* Maximizes overall priority value while staying under budget constraints.
* Compares Dynamic Programming results with a Greedy heuristic for transparency.

### Savings Planner (Greedy Algorithm)

* Allocates remaining funds to savings goals based on urgency.

* Urgency is calculated using:

  ```
  Urgency = Priority ÷ Remaining Months
  ```

* Ensures the most important goals are funded first.

### Trend Predictor (Weighted Moving Average)

* Uses a 3-month Weighted Moving Average (WMA) to forecast future expenses.

* Formula:

  ```
  WMA = (1×M1 + 2×M2 + 3×M3) / 6
  ```

* Identifies potential spending risks before they occur.

### Budget Rebalancer (Priority Queue / Min Heap)

* Detects overspending situations.
* Suggests budget cuts starting from the lowest-priority categories.
* Provides exact adjustment amounts required to return within budget.

---

## Algorithms Used

| Module            | Algorithm                          | Time Complexity |
| ----------------- | ---------------------------------- | --------------- |
| Budget Optimizer  | 0/1 Knapsack (Dynamic Programming) | O(n × W)        |
| Savings Planner   | Greedy Algorithm                   | O(n log n)      |
| Trend Predictor   | Weighted Moving Average            | O(n)            |
| Budget Rebalancer | Priority Queue (Min Heap)          | O(n log n)      |

---

## Technology Stack

* HTML5
* CSS3 (Glassmorphism UI)
* Vanilla JavaScript (ES6+)
* Google Fonts (Inter & JetBrains Mono)

### Architecture

* Fully client-side application
* No backend server required
* No database dependency
* Instant computation and response

---

## Key Benefits

* Optimal budget allocation using Dynamic Programming
* Smart savings goal prioritization
* Future spending prediction
* Automatic overspending correction
* Real-time client-side processing
* Designed for PKR-based budgeting

---

## Project Structure

```
FiscalForge/
│
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── images/
│   └── icons/
│
└── README.md
```

## Future Enhancements

* User authentication
* Expense history storage
* Interactive charts and dashboards
* Export reports to PDF
* AI-powered budgeting recommendations
* Multi-currency support

---

## Team Members

* Khansa Waheed (230982)
* Momna Nawaz (230981)
* Shiza Riaz (230932)

---

## Academic Project

Developed as a Design and Analysis of Algorithm Project to demonstrate practical applications of Dynamic Programming, Greedy Algorithms, Weighted Moving Averages, and Priority Queues in personal finance management.

