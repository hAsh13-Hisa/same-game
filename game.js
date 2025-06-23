class SameGame {
    constructor() {
        this.boardSize = 10;
        this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
        this.board = [];
        this.score = 0;
        this.initializeGame();
    }

    initializeGame() {
        this.board = this.generateBoard();
        this.renderBoard();
        this.setupEventListeners();
    }

    generateBoard() {
        const board = [];
        for (let i = 0; i < this.boardSize; i++) {
            board.push([]);
            for (let j = 0; j < this.boardSize; j++) {
                board[i].push(this.colors[Math.floor(Math.random() * this.colors.length)]);
            }
        }
        return board;
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.backgroundColor = this.board[i][j];
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', () => this.handleClick(cell));
                gameBoard.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        document.getElementById('reset-button').addEventListener('click', () => this.resetGame());
    }

    handleClick(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const color = cell.style.backgroundColor;

        const cellsToRemove = this.findConnectedCells(row, col, color);
        if (cellsToRemove.length > 1) {
            this.removeCells(cellsToRemove);
            this.updateScore(cellsToRemove.length);
            this.checkGameOver();
        }
    }

    findConnectedCells(row, col, color) {
        const visited = new Set();
        const stack = [[row, col]];
        const cellsToRemove = [];

        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = `${r}-${c}`;
            if (visited.has(key)) continue;
            
            visited.add(key);
            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell.style.backgroundColor === color) {
                cellsToRemove.push(cell);
                
                // 上下左右のセルをチェック
                if (r > 0) stack.push([r - 1, c]);
                if (r < this.boardSize - 1) stack.push([r + 1, c]);
                if (c > 0) stack.push([r, c - 1]);
                if (c < this.boardSize - 1) stack.push([r, c + 1]);
            }
        }

        return cellsToRemove;
    }

    removeCells(cells) {
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            this.board[row][col] = null;
            cell.remove();
        });

        // セルを下に落とす
        for (let col = 0; col < this.boardSize; col++) {
            let emptyRow = this.boardSize - 1;
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    this.board[emptyRow][col] = this.board[row][col];
                    if (emptyRow !== row) {
                        this.board[row][col] = null;
                    }
                    emptyRow--;
                }
            }
        }

        // 列を左に詰める
        const newBoard = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
        let emptyCol = 0;
        
        // すべての列をチェック
        for (let col = 0; col < this.boardSize; col++) {
            // 現在の列にブロックがあるかチェック
            let hasBlock = false;
            for (let row = 0; row < this.boardSize; row++) {
                if (this.board[row][col] !== null) {
                    hasBlock = true;
                    break;
                }
            }
            
            // ブロックがある列は新しい位置にコピー
            if (hasBlock) {
                // まず下に落ちた後の列を取得
                const droppedColumn = Array(this.boardSize).fill(null);
                let emptyRow = this.boardSize - 1;
                
                // 下に落ちた後の列を再構築
                for (let row = this.boardSize - 1; row >= 0; row--) {
                    if (this.board[row][col] !== null) {
                        droppedColumn[emptyRow] = this.board[row][col];
                        emptyRow--;
                    }
                }
                
                // 新しい位置にコピー
                for (let row = 0; row < this.boardSize; row++) {
                    newBoard[row][emptyCol] = droppedColumn[row];
                }
                emptyCol++;
            }
        }

        // ボードを更新
        this.board = newBoard;
        this.renderBoard();
    }

    updateScore(points) {
        this.score += points * points;
        document.getElementById('score').textContent = this.score;
    }

    checkGameOver() {
        const cells = document.querySelectorAll('.cell');
        if (cells.length === 0) {
            alert(`ゲームクリア！最終スコア: ${this.score}`);
            this.resetGame();
        }
    }

    resetGame() {
        this.score = 0;
        document.getElementById('score').textContent = this.score;
        this.initializeGame();
    }
}

// ゲームの初期化
document.addEventListener('DOMContentLoaded', () => {
    new SameGame();
});
