# Alquerque Web Game

A modern, web-based implementation of the classic Alquerque board game, built as a Single-Page Application (SPA). This project was developed as part of a Web Technologies university course, focusing on pure, framework-free web development.

## 📌 Project Overview

Alquerque is a two-player strategy board game that is considered the ancestor of Checkers (Draughts). This application brings the game to the browser, featuring dynamic board generation, strict adherence to classic rules, and a built-in Artificial Intelligence (AI) opponent. 

The project strictly uses **Vanilla Web Technologies** (HTML, CSS, and JavaScript) without reliance on external libraries or frameworks.

## ✨ Features

- **Single-Page Application (SPA):** Seamless navigation between the game board, settings, instructions, and leaderboards without reloading the page.
- **Dynamic Board Generation:** The board is generated dynamically via the DOM using JavaScript. Players can choose between different board sizes (e.g., 2x2, 3x3, 4x4, 5x5).
- **Classic Rules Engine:**
  - Validates diagonal, horizontal, and vertical movements (no moving backwards to the starting row).
  - Enforces mandatory captures.
  - Supports multiple sequential jumps in a single turn.
  - Implements the **"Huffing" (Soplo) rule**: Automatically penalizes and removes a player's piece if they fail to make a mandatory capture.
- **Client-Side AI:** Play against the computer with varying difficulty levels (Random moves, priority to captures, and optional Minimax algorithm).
- **Interactive UI Areas:**
  - Configuration panel (AI level, starting player).
  - Real-time event messaging (invalid moves, turn indicators, win/loss/draw states).
  - Scoreboard/Leaderboard for local matches.
  - Interactive login/identification UI mock-up.

## 🛠️ Technologies Used

- **HTML5:** Semantic structure for the SPA areas.
- **CSS3:** Custom styling, layout management (Grid/Flexbox), and state handling without external CSS frameworks.
- **Vanilla JavaScript (ES6+):** Game logic, state management, DOM manipulation, and AI algorithms.

## 🚀 Getting Started

Since this project uses vanilla web technologies and runs entirely on the client side (for Phase 1), no complex local environment setup is required.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/alquerque-web.git
   ```
2. **Navigate to the directory:**
   ```bash
   cd alquerque-web
   ```
3. **Run the game:**
   Simply open the `index.html` file in your preferred modern web browser.
   *(Alternatively, you can use a local development server like Live Server for VS Code).*

## 📖 How to Play

1. The game starts with pieces placed symmetrically, leaving only the center intersection empty.
2. Players take turns moving a piece to an adjacent empty intersection following the lines.
3. To capture an opponent's piece, jump over it in a straight line to an empty spot immediately beyond it.
4. If a capture is possible, you **must** make it. If you fail to do so, the "Huffing" rule applies, and your piece will be removed from the board before your chosen move is executed.
5. The game ends when a player loses all their pieces, has no valid moves left, or both players agree to a draw.

## 🗺️ Roadmap (Phase 2)

Future updates for the next phases of the course will include:
- Node.js/Express server backend.
- Multiplayer matchmaking over the network.
- Persistent leaderboards stored in a database.
- Real user authentication and sessions.

## 📝 License

This project was created for educational purposes. Feel free to fork and modify!