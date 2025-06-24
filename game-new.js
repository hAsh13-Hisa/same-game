// Logger
const Logger = {
    init: function() {
        if (!localStorage.getItem('gameLogs')) {
            localStorage.setItem('gameLogs', JSON.stringify([]));
        }
    },

    log: function(message) {
        const logs = JSON.parse(localStorage.getItem('gameLogs'));
        logs.push({
            timestamp: new Date().toISOString(),
            message: message
        });
        localStorage.setItem('gameLogs', JSON.stringify(logs));
        console.log(message);
    },

    showLogs: function() {
        const logs = JSON.parse(localStorage.getItem('gameLogs'));
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            logContainer.innerHTML = logs.map(log => `
                <div class="log-entry">
                    <span class="timestamp">${log.timestamp}</span>
                    <span class="message">${log.message}</span>
                </div>
            `).join('');
        }
    }
};

// ステージ管理
const StageManager = {
    currentStage: 1,
    stages: [
        {
            id: 1,
            targetScore: 100,
            pattern: null
        },
        {
            id: 2,
            targetScore: 200,
            pattern: null
        },
        {
            id: 3,
            targetScore: 300,
            pattern: null
        }
    ],

    // ステージを進行
    advanceStage: function() {
        if (this.currentStage < this.stages.length) {
            this.currentStage++;
            return true;
        }
        return false;
    }
};

// ゲームの開始
GameController.init();

// テストパターンボタンのイベントリスナー設定
const testPatternButton = document.getElementById('test-pattern-button');
if (testPatternButton) {
    testPatternButton.addEventListener('click', () => GameController.testPattern());
}

// ステージ進行ボタンのイベントリスナー設定
const nextStageButton = document.getElementById('next-stage-button');
if (nextStageButton) {
    nextStageButton.addEventListener('click', () => {
        if (StageManager.advanceStage()) {
            GameController.resetGame();
        } else {
            alert('最終ステージです！');
        }
    });
}

// Game Model
const GameModel = {
    // ボードの初期化
    initBoard: function() {
        Logger.log('ボードの初期化開始');
        this.size = 10;
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.score = 0;
        this.removableBlocks = 0;
        this.pigs = ['pig1', 'pig2', 'pig3', 'pig4', 'pig5'];
        Logger.log('ボードの初期化完了');
    },

    // ボードの生成
    generateBoard: function() {
        Logger.log('ボードの生成開始');
        // まず、すべてのセルをnullで初期化
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(null));

        // ステージパターンを使用
        const stage = StageManager.stages[StageManager.currentStage - 1];
        if (stage && stage.pattern) {
            Logger.log('ステージパターンを使用');
            // パターンをコピー
            this.board = stage.pattern.map(row => [...row]);
            Logger.log('生成されたボード:', JSON.stringify(this.board));
        } else {
            Logger.log('ランダム生成開始');
            // ランダム生成
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    this.board[i][j] = this.pigs[Math.floor(Math.random() * this.pigs.length)];
                }
            }
            Logger.log('ランダム生成完了');
        }

        Logger.log('ボードの生成完了');
    },

    // ブロックの削除
    removeBlocks: function(blocks) {
        Logger.log('ブロックの削除開始');
        let removedCount = 0;
        
        blocks.forEach(block => {
            const row = parseInt(block.dataset.row);
            const col = parseInt(block.dataset.col);
            if (this.board[row][col]) {
                this.board[row][col] = null;
                removedCount++;
            }
        });
        
        Logger.log(`削除されたブロック数: ${removedCount}`);
        return removedCount;
    },

    // ブロックの落下
    dropBlocks: function() {
        Logger.log('ブロックの落下開始');
        for (let col = 0; col < this.size; col++) {
            const column = [];
            for (let row = this.size - 1; row >= 0; row--) {
                if (this.board[row][col]) {
                    column.push(this.board[row][col]);
                    this.board[row][col] = null;
                }
            }
            
            // ブロックを下から詰める
            for (let i = 0; i < column.length; i++) {
                this.board[this.size - 1 - i][col] = column[i];
            }
        }
        Logger.log('ブロックの落下完了');
    },

    // ブロックの移動
    moveBlock: function(fromRow, fromCol, toRow, toCol) {
        Logger.log(`ブロックの移動: (${fromRow},${fromCol}) -> (${toRow},${toCol})`);
        const block = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;
        this.board[toRow][toCol] = block;
    },

    // ゲームオーバー判定
    isGameOver: function() {
        Logger.log('ゲームオーバー判定開始');
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const pig = this.board[i][j];
                if (pig) {
                    // 上下左右のセルをチェック
                    if (i > 0 && this.board[i - 1][j] === pig) return false;
                    if (i < this.size - 1 && this.board[i + 1][j] === pig) return false;
                    if (j > 0 && this.board[i][j - 1] === pig) return false;
                    if (j < this.size - 1 && this.board[i][j + 1] === pig) return false;
                }
            }
        }
        Logger.log('ゲームオーバー');
        return true;
    },

    // ブロックの検索
    findConnectedBlocks: function(row, col, pig) {
        Logger.log(`ブロックの検索開始: (${row},${col}) ${pig}`);
        const visited = new Set();
        const stack = [[row, col]];
        const blocks = [];

        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = `${r}-${c}`;
            if (visited.has(key)) continue;
            
            visited.add(key);
            const block = this.board[r][c];
            if (block === pig) {
                blocks.push({ row: r, col: c });
                
                // 上下左右のセルをチェック
                if (r > 0) stack.push([r - 1, c]);
                if (r < this.size - 1) stack.push([r + 1, c]);
                if (c > 0) stack.push([r, c - 1]);
                if (c < this.size - 1) stack.push([r, c + 1]);
            }
        }
        
        Logger.log(`検索結果: ${blocks.length}個のブロック`);
        return blocks;
    },

    // ブロックの更新
    updateRemovableBlocks: function() {
        Logger.log('ブロックの更新開始');
        let count = 0;
        const visited = new Set();

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const key = `${i}-${j}`;
                if (visited.has(key)) continue;
                
                const pig = this.board[i][j];
                if (pig) {
                    const blocks = this.findConnectedBlocks(i, j, pig);
                    if (blocks.length >= 2) {
                        count += blocks.length;
                        blocks.forEach(block => {
                            const key = `${block.row}-${block.col}`;
                            visited.add(key);
                        });
                    }
                }
            }
        }
        
        this.removableBlocks = count;
        Logger.log(`更新されたブロック数: ${count}`);
    }
};

// Game View
const GameView = {
    // ボードの初期化
    initBoard: function() {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) return;

        // 既存のセルを削除
        const cells = gameBoard.querySelectorAll('.cell');
        cells.forEach(cell => cell.remove());

        // ボードのサイズを設定
        gameBoard.style.gridTemplateColumns = `repeat(10, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(10, 1fr)`;
    },

    // ボードの描画
    drawBoard: function(board) {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) return;

        // 既存のセルを削除
        const cells = gameBoard.querySelectorAll('.cell');
        cells.forEach(cell => cell.remove());

        // 新しいセルを追加
        board.forEach((row, i) => {
            row.forEach((pig, j) => {
                if (pig) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    cell.dataset.pig = pig;
                    cell.style.backgroundImage = `url('images/${pig}.png')`;
                    gameBoard.appendChild(cell);
                }
            });
        });
    },

    // スコアの更新
    updateScore: function(score) {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = score;
        }
    },

    // 取れるブロック数の更新
    updateRemovableBlocks: function(count) {
        const removableBlocksElement = document.getElementById('removable-blocks');
        if (removableBlocksElement) {
            removableBlocksElement.textContent = count;
        }
    },

    // ステージ情報の更新
    updateStageInfo: function() {
        const stageInfo = document.getElementById('stage-info');
        if (stageInfo) {
            stageInfo.textContent = `ステージ ${StageManager.currentStage}`;
        }
    },

    // ターゲットスコアの更新
    updateTargetScore: function() {
        const targetScoreElement = document.getElementById('target-score');
        if (targetScoreElement) {
            const currentStage = StageManager.stages[StageManager.currentStage - 1];
            if (currentStage) {
                targetScoreElement.textContent = currentStage.targetScore;
            }
        }
    }
};

// Game Controller
const GameController = {
    // ゲームの初期化
    init: function() {
        // ボードの初期化
        GameView.initBoard();
        
        // モデルの初期化
        GameModel.initBoard();
        GameModel.generateBoard();
        
        // ボードの描画
        GameView.drawBoard(GameModel.board);
        GameView.updateScore(GameModel.score);
        GameView.updateRemovableBlocks(GameModel.removableBlocks);
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // ログの初期化
        Logger.init();
        
        // ステージ情報の更新
        GameView.updateStageInfo();
        GameView.updateTargetScore();
    },

    // イベントリスナーの設定
    setupEventListeners: function() {
        // リセットボタンのイベントリスナー
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetGame());
        }

        // パターン設定ボタンのイベントリスナー
        const patternButton = document.getElementById('pattern-button');
        if (patternButton) {
            patternButton.addEventListener('click', () => this.setPattern());
        }

        // ログ表示ボタンのイベントリスナー
        const logButton = document.getElementById('log-button');
        if (logButton) {
            logButton.addEventListener('click', () => Logger.showLogs());
        }

        // ブロックのクリックイベントリスナー
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.addEventListener('click', (e) => {
                const target = e.target;
                if (target.classList.contains('cell') && target.dataset.pig) {
                    this.handleBlockClick(target);
                }
            });
        }
    },

    // ブロックのクリック処理
    handleBlockClick: function(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const pig = cell.dataset.pig;

        // 連結ブロックの検索
        const blocks = GameModel.findConnectedBlocks(row, col, pig);
        if (blocks.length >= 2) {
            // ブロックの削除
            const removedCount = GameModel.removeBlocks(blocks);
            GameModel.score += removedCount;
            
            // ブロックの落下
            GameModel.dropBlocks();
            
            // ボードの更新
            GameView.drawBoard(GameModel.board);
            GameView.updateScore(GameModel.score);
            
            // 取れるブロック数の更新
            GameModel.updateRemovableBlocks();
            GameView.updateRemovableBlocks(GameModel.removableBlocks);
            
            // ゲームオーバー判定
            if (GameModel.isGameOver()) {
                this.gameOver();
            }
        }
    },

    // ゲームオーバー処理
    gameOver: function() {
        alert('ゲームオーバー！');
        this.resetGame();
    },

    // ゲームのリセット
    resetGame: function() {
        GameModel.initBoard();
        GameModel.generateBoard();
        GameView.drawBoard(GameModel.board);
        GameView.updateScore(GameModel.score);
        GameView.updateRemovableBlocks(GameModel.removableBlocks);
        GameView.updateStageInfo();
        GameView.updateTargetScore();
    },

    // パターンの設定
    setPattern: function() {
        const pattern = [
            [null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null]
        ];
        GameModel.board = pattern;
        GameView.drawBoard(GameModel.board);
    },

    // テストパターンの設定
    testPattern: function() {
        const pattern = [
            ['pig1', 'pig1', 'pig2', 'pig2', 'pig3', 'pig3', 'pig4', 'pig4', 'pig5', 'pig5'],
            ['pig1', 'pig1', 'pig2', 'pig2', 'pig3', 'pig3', 'pig4', 'pig4', 'pig5', 'pig5'],
            ['pig1', 'pig1', 'pig2', 'pig2', 'pig3', 'pig3', 'pig4', 'pig4', 'pig5', 'pig5'],
            ['pig1', 'pig1', 'pig2', 'pig2', 'pig3', 'pig3', 'pig4', 'pig4', 'pig5', 'pig5'],
            ['pig1', 'pig1', 'pig2', 'pig2', 'pig3', 'pig3', 'pig4', 'pig4', 'pig5', 'pig5'],
            ['pig1', 'pig1', 'pig2', 'pig2', 'pig3', 'pig3', 'pig4', 'pig4', 'pig5', 'pig5'],
            ['pig1', 'pig1', 'pig2', 'pig2', 'pig3', 'pig3', 'pig4', 'pig4', 'pig5', 'pig5'],
            ['pig1', 'pig1', 'pig2', 'pig2', 'pig3', 'pig3', 'pig4', 'pig4', 'pig5', 'pig5'],
            ['pig1', 'pig1', 'pig2', 'pig2', 'pig3', 'pig3', 'pig4', 'pig4', 'pig5', 'pig5'],
            ['pig1', 'pig1', 'pig2', 'pig2', 'pig3', 'pig3', 'pig4', 'pig4', 'pig5', 'pig5']
        ];
        GameModel.board = pattern;
        GameView.drawBoard(GameModel.board);
        GameModel.updateRemovableBlocks();
        GameView.updateRemovableBlocks(GameModel.removableBlocks);
    }
};

// ゲームの開始
GameController.init();

// テストパターンボタンのイベントリスナー設定
const testPatternButton = document.getElementById('test-pattern-button');
if (testPatternButton) {
    testPatternButton.addEventListener('click', () => GameController.testPattern());
}

// ステージ進行ボタンのイベントリスナー設定
const nextStageButton = document.getElementById('next-stage-button');
if (nextStageButton) {
    nextStageButton.addEventListener('click', () => {
        if (StageManager.advanceStage()) {
            GameController.resetGame();
        } else {
            alert('最終ステージです！');
        }
    });
}
