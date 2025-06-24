// ロガー
const Logger = {
    // デバッグモードの設定（デプロイ時はfalseに設定）
    DEBUG_MODE: false,

    init: function() {
        this.clearLog();
        this.initModal();
    },

    clearLog: function() {
        localStorage.clear();
    },

    log: function(message) {
        if (this.DEBUG_MODE) {
            // デバッグモードが有効な場合のみログを保存
            const log = localStorage.getItem('log') || '';
            localStorage.setItem('log', log + message + '\n');
            console.log(`[SameGame] ${message}`);
        }
    },

    viewLog: function() {
        const log = localStorage.getItem('log') || '';
        if (log) {
            this.showModal(log);
        } else {
            alert('ログがありません');
        }
    },

    // モーダルウィンドウの初期化
    initModal: function() {
        const modal = document.createElement('div');
        modal.className = 'log-modal';
        modal.innerHTML = `
            <div class="log-modal-content">
                <span class="close">&times;</span>
                <pre id="log-content"></pre>
            </div>
        `;
        document.body.appendChild(modal);

        // 閉じるボタンの処理
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };

        // クリック外で閉じる
        modal.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    },

    // モーダルウィンドウの表示
    showModal: function(log) {
        const modal = document.querySelector('.log-modal');
        const logContent = document.getElementById('log-content');
        if (modal && logContent) {
            logContent.textContent = log;
            modal.style.display = 'block';
        }
    }
};

// ロガーの初期化
Logger.init();
