// ステージ管理
const StageManager = {
    currentStage: 1,
    targetScore: 100,
    
    init: function() {
        this.updateStageInfo();
    },
    
    updateStageInfo: function() {
        const stageInfo = document.getElementById('stage-info');
        const targetScore = document.getElementById('target-score');
        if (stageInfo && targetScore) {
            stageInfo.textContent = `ステージ ${this.currentStage}`;
            targetScore.textContent = `目標スコア: ${this.targetScore}`;
        }
    },
    
    nextStage: function() {
        this.currentStage++;
        this.targetScore = this.calculateTargetScore();
        this.updateStageInfo();
        return this.currentStage;
    },
    
    calculateTargetScore: function() {
        // ステージが進むにつれて目標スコアを増加
        return 100 + (this.currentStage - 1) * 50;
    },
    
    resetStage: function() {
        this.currentStage = 1;
        this.targetScore = 100;
        this.updateStageInfo();
    }
};

// ゲームモデル
const GameModel = {
    size: 10,
    board: [],
    pigs: ['pig1', 'pig2', 'pig3', 'pig4', 'pig5'],
    score: 0,
    removableBlocks: 0,
    currentStage: 1,

    initBoard: function() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
    },

    generateBoard: function() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.board[i][j] = this.pigs[Math.floor(Math.random() * this.pigs.length)];
            }
        }
    },

    removeBlocks: function(blocks) {
        // ブロックを削除
        blocks.forEach(block => {
            const row = parseInt(block.dataset.row);
            const col = parseInt(block.dataset.col);
            if (this.board[row] && this.board[row][col]) {
                this.board[row][col] = null;
                GameView.removeBlock(row, col); // ビューの更新
            }
        });

        // スコアの更新
        const removedCount = blocks.length;
        if (removedCount >= 2) {
            this.score += Math.pow(removedCount, 2);
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                scoreElement.textContent = this.score;
            }
        }
    },

    // ブロックの削除（ビュー更新用）
    removeBlock: function(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.dataset.pig = '';
            cell.style.backgroundImage = 'none';
        }
    },

    // スコアの初期化
    initScore: function() {
        this.score = 0;
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    },

    // スコアの取得
    getScore: function() {
        return this.score;
    },

    dropBlocks: function() {
        for (let col = 0; col < this.size; col++) {
            const temp = Array(this.size).fill(null);
            let targetRow = this.size - 1;
            for (let row = this.size - 1; row >= 0; row--) {
                if (this.board[row][col]) {
                    temp[targetRow] = this.board[row][col];
                    targetRow--;
                }
            }
            for (let row = 0; row < this.size; row++) {
                this.board[row][col] = temp[row];
            }
        }
    },

    compactColumns: function() {
        let emptyColumns = [];
        for (let col = 0; col < this.size; col++) {
            let isEmpty = true;
            for (let row = 0; row < this.size; row++) {
                if (this.board[row][col]) {
                    isEmpty = false;
                    break;
                }
            }
            if (isEmpty) {
                emptyColumns.push(col);
            }
        }
        if (emptyColumns.length > 0) {
            for (let col = this.size - 1; col >= 0; col--) {
                if (!emptyColumns.includes(col)) {
                    let targetCol = col;
                    for (let emptyCol of emptyColumns) {
                        if (col > emptyCol) {
                            targetCol--;
                        }
                    }
                    if (targetCol !== col) {
                        for (let row = 0; row < this.size; row++) {
                            this.board[row][targetCol] = this.board[row][col];
                            this.board[row][col] = null;
                        }
                    }
                }
            }
        }
    },

    updateBoard: function(blocks) {
        this.removeBlocks(blocks);
        this.dropBlocks();
        this.compactColumns();
    },

    updateRemovableBlocks: function() {
        this.removableBlocks = 0;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] && this.isRemovable(row, col)) {
                    this.removableBlocks++;
                }
            }
        }
    },

    isRemovable: function(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return false;
        }
        if (!this.board[row][col]) {
            return false;
        }
        const pig = this.board[row][col];
        if (this.board[row - 1] && this.board[row - 1][col] === pig) {
            return true;
        }
        if (this.board[row + 1] && this.board[row + 1][col] === pig) {
            return true;
        }
        if (this.board[row][col - 1] && this.board[row][col - 1] === pig) {
            return true;
        }
        if (this.board[row][col + 1] && this.board[row][col + 1] === pig) {
            return true;
        }
        return false;
    },

    // ゲームオーバー/クリアチェック
    checkGameOver: function() {
        // 全てのブロックが消去された場合：ゲームクリア
        let allBlocksRemoved = true;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col]) {
                    allBlocksRemoved = false;
                    break;
                }
            }
            if (!allBlocksRemoved) break;
        }

        if (allBlocksRemoved) {
            // ゲームクリア処理
            this.showGameResult('ゲームクリア！');
            
            // ステージ進行
            setTimeout(() => {
                StageManager.nextStage();
                this.initBoard();
                this.generateBoard();
                this.initScore();
                GameView.drawBoard(this.board);
                this.updateRemovableBlocks();
                GameView.updateRemovableBlocks(this.removableBlocks);
            }, 1000);
            
            return true;
        }

        // 消去可能なブロックがなくなった場合：ゲームオーバー
        if (this.removableBlocks === 0) {
            // ゲームオーバー処理
            this.showGameResult('ゲームオーバー！');
            
            // ステージリセット
            setTimeout(() => {
                StageManager.resetStage();
                this.initBoard();
                this.generateBoard();
                this.initScore();
                GameView.drawBoard(this.board);
                this.updateRemovableBlocks();
                GameView.updateRemovableBlocks(this.removableBlocks);
            }, 1000);
            
            return true;
        }

        return false;
    },

    // ステージの初期化
    initStage: function() {
        this.currentStage = StageManager.currentStage;
        this.targetScore = StageManager.targetScore;
    },

    // モーダルウィンドウの表示
    showModal: function(message) {
        const modal = document.getElementById('result-modal');
        const modalMessage = document.getElementById('modal-message');
        const modalOk = document.getElementById('modal-ok');
        
        if (modal && modalMessage) {
            modalMessage.textContent = message;
            modal.style.display = 'block';
            
            // OKボタンのクリックイベント
            modalOk.onclick = () => {
                modal.style.display = 'none';
                this.modalResolve(true);
            };
            
            // クリック外で閉じる
            modal.onclick = (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                    this.modalResolve(true);
                }
            };
        }
    },

    // モーダルウィンドウの結果を待つ
    showGameResult: function(message) {
        return new Promise(resolve => {
            this.modalResolve = resolve;
            this.showModal(message);
        });
    },

    // ゲームオーバー/クリアチェック
    checkGameOver: function() {
        // 全てのブロックが消去された場合：ゲームクリア
        let allBlocksRemoved = true;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col]) {
                    allBlocksRemoved = false;
                    break;
                }
            }
            if (!allBlocksRemoved) break;
        }

        if (allBlocksRemoved) {
            // ゲームクリア処理
            this.showGameResult('ゲームクリア！').then(() => {
                StageManager.nextStage();
                this.initBoard();
                this.generateBoard();
                this.initScore();
                GameView.drawBoard(this.board);
                this.updateRemovableBlocks();
                GameView.updateRemovableBlocks(this.removableBlocks);
            });
            
            return true;
        }

        // 消去可能なブロックがなくなった場合：ゲームオーバー
        if (this.removableBlocks === 0) {
            // ゲームオーバー処理
            this.showGameResult('ゲームオーバー！').then(() => {
                StageManager.resetStage();
                this.initBoard();
                this.generateBoard();
                this.initScore();
                GameView.drawBoard(this.board);
                this.updateRemovableBlocks();
                GameView.updateRemovableBlocks(this.removableBlocks);
            });
            
            return true;
        }

        return false;
    },

    // ゲーム結果のスタイル
    initGameResultStyle: function() {
        const style = document.createElement('style');
        style.textContent = `
            .game-result {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(255, 255, 255, 0.9);
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                font-size: 24px;
                font-weight: bold;
                color: #333;
                cursor: pointer;
            }
            .game-result:hover {
                background-color: rgba(255, 255, 255, 0.8);
            }
        `;
        document.head.appendChild(style);
    },

    // 初期化時にゲーム結果のスタイルを設定
    // テストパターンの設定
    setTestPattern: function() {
        const pattern = [
            ['pig1', 'pig2', 'pig3', 'pig4', 'pig5', 'pig1', 'pig2', 'pig3', 'pig4', 'pig5'],
            ['pig1', 'pig2', 'pig3', 'pig4', 'pig5', 'pig1', 'pig2', 'pig3', 'pig4', 'pig5'],
            ['pig1', 'pig2', 'pig3', 'pig4', 'pig5', 'pig1', 'pig2', 'pig3', 'pig4', 'pig5'],
            ['pig1', 'pig2', 'pig3', 'pig4', 'pig5', 'pig1', 'pig2', 'pig3', 'pig4', 'pig5'],
            ['pig1', 'pig2', 'pig3', 'pig4', 'pig5', 'pig1', 'pig2', 'pig3', 'pig4', 'pig5'],
            ['pig1', 'pig2', 'pig3', 'pig4', 'pig5', 'pig1', 'pig2', 'pig3', 'pig4', 'pig5'],
            ['pig1', 'pig2', 'pig3', 'pig4', 'pig5', 'pig1', 'pig2', 'pig3', 'pig4', 'pig5'],
            ['pig1', 'pig2', 'pig3', 'pig4', 'pig5', 'pig1', 'pig2', 'pig3', 'pig4', 'pig5'],
            ['pig1', 'pig2', 'pig3', 'pig4', 'pig5', 'pig1', 'pig2', 'pig3', 'pig4', 'pig5'],
            ['pig1', 'pig2', 'pig3', 'pig4', 'pig5', 'pig1', 'pig2', 'pig3', 'pig4', 'pig5']
        ];
        this.board = pattern;
        this.updateRemovableBlocks();
    }
};

// ゲームビュー
const GameView = {
    initBoard: function() {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) {
            console.error('ゲームボードが見つかりません');
            return;
        }
        gameBoard.innerHTML = '';
        for (let row = 0; row < GameModel.size; row++) {
            for (let col = 0; col < GameModel.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                gameBoard.appendChild(cell);
            }
        }
    },

    drawBoard: function(board) {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) {
            console.error('ゲームボードが見つかりません');
            return;
        }
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const cell = gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    if (board[row][col]) {
                        cell.dataset.pig = board[row][col]; // データ属性の設定
                        cell.style.backgroundImage = `url('images/${board[row][col]}.png')`;
                    } else {
                        cell.dataset.pig = '';
                        cell.style.backgroundImage = 'none';
                    }
                }
            }
        }
    },

    // ブロックの削除
    removeBlock: function(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.dataset.pig = '';
            cell.style.backgroundImage = 'none';
        }
    },

    updateRemovableBlocks: function(count) {
        const removableBlocksElement = document.getElementById('removable-blocks');
        if (removableBlocksElement) {
            removableBlocksElement.textContent = `削除可能ブロック: ${count}`;
        }
    }
};

// ゲームコントローラー
const GameController = {
    init: function() {
        // ステージ管理の初期化
        StageManager.init();
        
        // ボードの初期化と生成
        GameModel.initBoard();
        GameModel.initStage();
        GameModel.generateBoard();
        
        // スコアの初期化
        GameModel.initScore();
        
        // ビューの初期化と描画
        GameView.initBoard();
        GameView.drawBoard(GameModel.board);
        
        // 削除可能ブロックの更新
        GameModel.updateRemovableBlocks();
        GameView.updateRemovableBlocks(GameModel.removableBlocks);

        // クリックイベントの設定
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.addEventListener('click', (event) => {
                const target = event.target;
                if (target.classList.contains('cell') && target.dataset.pig) {
                    const row = parseInt(target.dataset.row);
                    const col = parseInt(target.dataset.col);
                    const pig = target.dataset.pig;

                    // 同じブロックを全て取得
                    const connectedCells = this.findConnectedCells(row, col, pig);
                    if (connectedCells.length >= 2) {
                        // ブロックの削除、落下、列の詰め替え
                        GameModel.updateBoard(connectedCells);
                        
                        // スコアの更新
                        this.updateScore(connectedCells.length);
                        
                        // UIの更新
                        GameView.drawBoard(GameModel.board);
                        
                        // 削除可能ブロックの更新
                        GameModel.updateRemovableBlocks();
                        GameView.updateRemovableBlocks(GameModel.removableBlocks);

                        // ゲームオーバー/クリアチェック
                        GameModel.checkGameOver();
                    }
                }
            });
        }

        // リセットボタンの設定
        const resetButton = document.querySelector('button:first-of-type');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetGame();
            });
        }

        // テストパターンボタンの設定
        const testButton = document.querySelector('button:nth-of-type(2)');
        if (testButton) {
            testButton.addEventListener('click', () => {
                GameModel.setTestPattern();
                GameView.drawBoard(GameModel.board);
                GameView.updateRemovableBlocks(GameModel.removableBlocks);
            });
        }
    },

    // ゲームのリセット
    resetGame: function() {
        GameModel.initBoard();
        GameModel.generateBoard();
        GameModel.initScore();
        GameView.drawBoard(GameModel.board);
        GameModel.updateRemovableBlocks();
        GameView.updateRemovableBlocks(GameModel.removableBlocks);
    },

    // スコアの更新
    updateScore: function(removedCount) {
        const score = GameModel.getScore();
        const newScore = score + Math.pow(removedCount, 2);
        GameModel.score = newScore;
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = newScore;
        }
    },

    // 同じブロックを全て取得
    findConnectedCells: function(row, col, pig) {
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
                if (r < GameModel.size - 1) stack.push([r + 1, c]);
                if (c > 0) stack.push([r, c - 1]);
                if (c < GameModel.size - 1) stack.push([r, c + 1]);
            }
        }

        return cellsToRemove;
    }
};

// ゲームの開始
GameController.init();
