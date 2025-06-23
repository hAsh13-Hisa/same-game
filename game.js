class SameGame {
    constructor() {
        this.boardSize = 10;
        this.pigs = ['pig1', 'pig2', 'pig3', 'pig4', 'pig5'];
        this.board = [];
        this.score = 0;
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
                board[i].push(this.pigs[Math.floor(Math.random() * this.pigs.length)]);
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
                cell.style.backgroundImage = `url('images/${this.board[i][j]}.png')`;
                cell.style.backgroundSize = 'contain';
                cell.style.backgroundRepeat = 'no-repeat';
                cell.style.backgroundPosition = 'center';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.dataset.pig = this.board[i][j];
                cell.addEventListener('click', () => this.handleClick(cell));
                gameBoard.appendChild(cell);
            }
        }
        this.updateRemovableBlocks();
    }

    setupEventListeners() {
        document.getElementById('reset-button').addEventListener('click', () => this.resetGame());
    }

    setupEventListeners() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleClick(cell));
        });

        document.getElementById('reset-button').addEventListener('click', () => this.resetGame());
    }

    handleClick(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const pig = cell.dataset.pig;

        const cellsToRemove = this.findConnectedCells(row, col, pig);
        if (cellsToRemove.length > 1) {
            this.removeCells(cellsToRemove);
            this.updateScore(cellsToRemove.length);
            this.checkGameOver();
        }
    }

    findConnectedCells(row, col, pig) {
        const visited = new Set();
        const stack = [[row, col]];
        const cellsToRemove = [];

        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = `${r}-${c}`;
            if (visited.has(key)) continue;
            
            visited.add(key);
            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell && cell.dataset.pig === pig) {
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
            // ポップアニメーションを適用
            cell.classList.add('popping');
            setTimeout(() => cell.remove(), 300);
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
        const currentScore = this.score;
        this.score += points * points;
        const scoreElement = document.getElementById('score');
        
        // スコアの更新アニメーション
        scoreElement.classList.add('update');
        setTimeout(() => {
            scoreElement.textContent = this.score;
            scoreElement.classList.remove('update');
        }, 300);
    }

    updateRemovableBlocks() {
        const cells = document.querySelectorAll('.cell');
        let removableBlocks = 0;
        const visited = new Set();

        // 全てのセルをチェック
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (!cell || !cell.dataset.pig) continue;
                
                const key = `${row}-${col}`;
                if (visited.has(key)) continue;

                const group = this.findConnectedGroup(row, col);
                if (group.length >= 2) {
                    removableBlocks += group.length;
                    group.forEach(cell => {
                        const key = `${cell.dataset.row}-${cell.dataset.col}`;
                        visited.add(key);
                    });
                }
            }
        }

        document.getElementById('removable-blocks').textContent = removableBlocks;
    }

    findConnectedGroup(row, col) {
        const startCell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!startCell || !startCell.dataset.pig) return [];

        const group = [];
        const queue = [[row, col]];
        const visited = new Set([`${row}-${col}`]);
        const pig = startCell.dataset.pig;

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            
            // セルが存在するか、ブタが存在するかチェック
            if (cell && cell.dataset.pig === pig) {
                group.push(cell);
                
                // 上下左右のセルをチェック
                const directions = [
                    [r - 1, c], // 上
                    [r + 1, c], // 下
                    [r, c - 1], // 左
                    [r, c + 1]  // 右
                ];

                for (const [nr, nc] of directions) {
                    if (nr < 0 || nr >= this.boardSize || nc < 0 || nc >= this.boardSize) continue;
                    const key = `${nr}-${nc}`;
                    if (visited.has(key)) continue;

                    const nextCell = document.querySelector(`[data-row="${nr}"][data-col="${nc}"]`);
                    if (nextCell && nextCell.dataset.pig === pig) {
                        queue.push([nr, nc]);
                        visited.add(key);
                    }
                }
            }
        }

        return group;
    }

    checkGameOver() {
        // ブロックがなくなった場合
        const cells = document.querySelectorAll('.cell');
        if (cells.length === 0) {
            alert(`ゲームクリア！最終スコア: ${this.score}`);
            this.resetGame();
            return;
        }

        // すべてのブロックの組み合わせをチェック
        let canRemove = false;
        const visited = new Set();

        // 全てのセルをチェック
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (!cell || !cell.dataset.pig) continue;
                
                const key = `${row}-${col}`;
                if (visited.has(key)) continue;

                const group = this.findConnectedGroup(row, col);
                if (group.length >= 2) {
                    canRemove = true;
                    break;
                }
            }
        }

        // 消せるブタが見つかった場合
        if (canRemove) return;

        // どのブタも消せない場合、ゲームオーバー
        alert(`ゲームオーバー！スコア: ${this.score}`);
        this.resetGame();
    }

    removeCells(cells) {
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            this.board[row][col] = null;
            // ポップアニメーションを適用
            cell.classList.add('popping');
            setTimeout(() => cell.remove(), 300);
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
        this.updateRemovableBlocks();
    }

    resetGame() {
        this.score = 0;
        document.getElementById('score').textContent = this.score;
        this.initializeGame();
    }
}

// ゲームの初期化
document.addEventListener('DOMContentLoaded', () => {
    const game = new SameGame();
    game.initializeGame();
});
