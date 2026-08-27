// ===== UTILITÁRIOS DE STORAGE =====
const STORAGE_KEYS = {
    likes: 'sabores_likes',
    comments: 'sabores_comments',
    darkMode: 'sabores_dark',
    zoom: 'sabores_zoom'
};

function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ===== ESTADO INICIAL =====
let likes = loadJSON(STORAGE_KEYS.likes, {});       // { recipeId: true/false }
let comments = loadJSON(STORAGE_KEYS.comments, {}); // { recipeId: [{name, text, time}] }
let currentZoom = parseFloat(localStorage.getItem(STORAGE_KEYS.zoom)) || 1;

// ===== DARK MODE =====
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

function applyDarkMode(enabled) {
    if (enabled) {
        body.classList.add('dark-mode');
        darkModeToggle.textContent = 'Desativar';
    } else {
        body.classList.remove('dark-mode');
        darkModeToggle.textContent = 'Ativar';
    }
    localStorage.setItem(STORAGE_KEYS.darkMode, enabled ? '1' : '0');
}

// Inicializa dark mode
applyDarkMode(localStorage.getItem(STORAGE_KEYS.darkMode) === '1');

darkModeToggle.addEventListener('click', () => {
    const isDark = body.classList.contains('dark-mode');
    applyDarkMode(!isDark);
});

// ===== ZOOM =====
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomResetBtn = document.getElementById('zoom-reset');
const zoomLevelSpan = document.getElementById('zoom-level');

function applyZoom(level) {
    currentZoom = Math.max(0.8, Math.min(1.4, level));
    document.documentElement.style.fontSize = (currentZoom * 100) + '%';
    zoomLevelSpan.textContent = Math.round(currentZoom * 100) + '%';
    localStorage.setItem(STORAGE_KEYS.zoom, currentZoom);
}

applyZoom(currentZoom);

zoomInBtn.addEventListener('click', () => applyZoom(currentZoom + 0.1));
zoomOutBtn.addEventListener('click', () => applyZoom(currentZoom - 0.1));
zoomResetBtn.addEventListener('click', () => applyZoom(1));

// ===== MODAL DE CONFIGURAÇÕES =====
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const modalOverlay = document.getElementById('modal-overlay');
const closeSettings = document.getElementById('close-settings');

function openModal() {
    settingsModal.classList.remove('hidden');
    modalOverlay.classList.remove('hidden');
}

function closeModal() {
    settingsModal.classList.add('hidden');
    modalOverlay.classList.add('hidden');
}

settingsBtn.addEventListener('click', openModal);
closeSettings.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Fechar com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ===== DENÚNCIA =====
document.getElementById('report-btn').addEventListener('click', () => {
    const confirmReport = confirm(
        'Deseja denunciar este conteúdo?\n\n' +
        'Seu relatório será enviado à moderação. Obrigado por ajudar a manter a comunidade segura.'
    );
    if (confirmReport) {
        alert('Denúncia registrada com sucesso! Nossa equipe irá analisar o conteúdo em breve.');
        closeModal();
    }
});

// ===== CURTIDAS =====
function updateLikeUI(recipeId) {
    const btn = document.querySelector(`.like-btn[data-recipe="${recipeId}"]`);
    if (!btn) return;

    const icon = btn.querySelector('.like-icon');
    const countSpan = btn.querySelector('.like-count');
    const isLiked = !!likes[recipeId];

    // Contagem: se gostou, conta 1 (simulação simples por usuário)
    const baseCount = parseInt(btn.dataset.base || '0', 10) || 0;
    const displayCount = baseCount + (isLiked ? 1 : 0);

    countSpan.textContent = displayCount;
    btn.classList.toggle('liked', isLiked);
    icon.textContent = isLiked ? '♥' : '♡';
}

// Inicializa contagens base aleatórias leves para parecer vivo
document.querySelectorAll('.like-btn').forEach(btn => {
    const recipeId = btn.dataset.recipe;
    // Gera um número base estável por receita (baseado no id)
    let hash = 0;
    for (let i = 0; i < recipeId.length; i++) {
        hash = (hash + recipeId.charCodeAt(i) * 17) % 40;
    }
    btn.dataset.base = hash + 12; // entre 12 e 51
    updateLikeUI(recipeId);
});

// Evento de clique nas curtidas (toggle)
document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const recipeId = btn.dataset.recipe;
        likes[recipeId] = !likes[recipeId];
        saveJSON(STORAGE_KEYS.likes, likes);
        updateLikeUI(recipeId);

        // Feedback visual rápido
        btn.style.transform = 'scale(1.12)';
        setTimeout(() => btn.style.transform = '', 150);
    });
});

// ===== COMENTÁRIOS =====
function renderComments(recipeId) {
    const section = document.getElementById(`comments-${recipeId}`);
    if (!section) return;

    const list = section.querySelector('.comments-list');
    const items = comments[recipeId] || [];

    list.innerHTML = '';

    if (items.length === 0) {
        list.innerHTML = '<p style="opacity:0.6;font-size:0.9rem;">Nenhum comentário ainda. Seja o primeiro!</p>';
        return;
    }

    // Mais recentes primeiro
    [...items].reverse().forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.innerHTML = `
            <div class="author">${escapeHTML(c.name)}</div>
            <div class="text">${escapeHTML(c.text)}</div>
            <div class="time">${c.time}</div>
        `;
        list.appendChild(div);
    });
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTime(date) {
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Toggle seção de comentários
document.querySelectorAll('.comment-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const recipeId = btn.dataset.recipe;
        const section = document.getElementById(`comments-${recipeId}`);
        section.classList.toggle('hidden');
        if (!section.classList.contains('hidden')) {
            renderComments(recipeId);
        }
    });
});

// Enviar comentário
document.querySelectorAll('.comment-form').forEach(form => {
    const submitBtn = form.querySelector('.submit-comment');
    submitBtn.addEventListener('click', () => {
        const section = form.closest('.comments-section');
        const recipeId = section.id.replace('comments-', '');
        const nameInput = form.querySelector('.comment-name');
        const textInput = form.querySelector('.comment-text');

        const name = nameInput.value.trim() || 'Anônimo';
        const text = textInput.value.trim();

        if (!text) {
            alert('Escreva um comentário antes de enviar.');
            return;
        }

        if (!comments[recipeId]) comments[recipeId] = [];

        comments[recipeId].push({
            name: name.substring(0, 30),
            text: text.substring(0, 300),
            time: formatTime(new Date())
        });

        saveJSON(STORAGE_KEYS.comments, comments);
        renderComments(recipeId);

        // Limpa campos
        nameInput.value = '';
        textInput.value = '';
    });
});

// Inicializa contadores de comentários nos botões
function updateCommentButtons() {
    document.querySelectorAll('.comment-toggle-btn').forEach(btn => {
        const recipeId = btn.dataset.recipe;
        const count = (comments[recipeId] || []).length;
        btn.innerHTML = count > 0
            ? `💬 Comentários (${count})`
            : '💬 Comentários';
    });
}

updateCommentButtons();

// Atualiza o contador depois de cada envio também
document.querySelectorAll('.submit-comment').forEach(btn => {
    btn.addEventListener('click', () => {
        setTimeout(updateCommentButtons, 50);
    });
});

console.log('Sabores Caseiros carregado com sucesso! 🍲');