// =================================================================
// FUNÇÕES DE UI E NAVEGAÇÃO
// =================================================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'success' ? 
        'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)' : 
        'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function hideAllSections() {
    const loginSection = document.getElementById('loginSection');
    if (loginSection) loginSection.classList.add('hidden');
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.style.display = 'none';
    const clientDataSection = document.getElementById('clientDataSection');
    if (clientDataSection) clientDataSection.classList.add('hidden');
    const ozonioHistory = document.getElementById('ozonioHistory');
    if (ozonioHistory) ozonioHistory.classList.add('hidden');
    const quizSection = document.getElementById('quizSection');
    if (quizSection) quizSection.classList.add('hidden');
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) resultsSection.classList.add('hidden');
}

function renderActionButtons() {
    const container = document.getElementById('actionButtons');
    if (!container) return;
    let user = (window.appState && appState.currentUser) ? appState.currentUser : null;
    if (!user) {
        try { user = JSON.parse(localStorage.getItem('ozonUser')); } catch (e) { user = null; }
    }
    // Limpa menu lateral se for desktop
    if (window.innerWidth > 700) {
        container.classList.remove('active');
        const overlay = document.getElementById('menuOverlay');
        if (overlay) overlay.classList.remove('active');
    }
    if (user) {
        if (window.innerWidth <= 700) {
            const avatar = user.avatar || '👤';
            const name = user.name || '';
            container.innerHTML = `
                <button class="menu-close" id="menuCloseBtn" title="Fechar menu">&times;</button>
                <div class="menu-logo">
                    <img src="images/logo_smartozen.png" alt="Logo Ozonteck">
                    <div style="margin-top:10px;margin-bottom:2px;">
                        <span style="display:inline-block;width:74px;height:74px;background:#fff;border-radius:50%;box-shadow:0 2px 12px #00b89433;border:3px solid #fff;font-size:3.2em;line-height:74px;text-align:center;">${avatar}</span>
                    </div>
                    <div class="menu-username">${name}</div>
                </div>
                <ul class="menu-list">
                    <li><a href="catalogo.html">📦 Catálogo/PDV</a></li>
                    <li><a href="reports.html">📊 Relatórios</a></li>
                    ${(user.role === 'admin' || user.role === 'gestor') ? '<li><a href="gestao_equipe.html">👥 Gestão de Equipe</a></li>' : ''}
                    <li><a href="#" id="menuLogout">⏻ Sair</a></li>
                </ul>
            `;
            setTimeout(() => {
                const logout = document.getElementById('menuLogout');
                if (logout) logout.onclick = function(e) { e.preventDefault(); if (typeof handleLogout === 'function') handleLogout(); };
                const closeBtn = document.getElementById('menuCloseBtn');
                const actionButtons = document.getElementById('actionButtons');
                const overlay = document.getElementById('menuOverlay');
                const hamburger = document.getElementById('hamburgerMenu');
                if (closeBtn) closeBtn.onclick = function() {
                    actionButtons.classList.remove('active');
                    overlay.classList.remove('active');
                    if (hamburger) hamburger.classList.remove('open');
                };
            }, 100);
        } else {
            // Desktop: botões tradicionais
            container.innerHTML = '';
            const btnCatalogo = document.createElement('button');
            btnCatalogo.className = 'btn btn-sm';
            btnCatalogo.innerHTML = '📦 Catálogo/PDV';
            btnCatalogo.onclick = () => window.location.href = 'catalogo.html';
            container.appendChild(btnCatalogo);
            const btnRelatorios = document.createElement('button');
            btnRelatorios.className = 'btn btn-sm';
            btnRelatorios.innerHTML = '📊 Relatórios';
            btnRelatorios.onclick = () => window.location.href = 'reports.html';
            container.appendChild(btnRelatorios);
            if (user.role === 'admin' || user.role === 'gestor') {
                const btnEquipe = document.createElement('button');
                btnEquipe.className = 'btn btn-sm';
                btnEquipe.innerHTML = '👥 Gestão de Equipe';
                btnEquipe.onclick = () => window.location.href = 'gestao_equipe.html';
                container.appendChild(btnEquipe);
            }
            const btnLogout = document.createElement('button');
            btnLogout.className = 'btn btn-sm logout-btn';
            btnLogout.innerHTML = '<span style="font-size:1.2em;">⏻</span> Sair';
            btnLogout.onclick = () => { if (typeof handleLogout === 'function') handleLogout(); };
            container.appendChild(btnLogout);
        }
        container.style.display = '';
    } else {
        container.innerHTML = '';
        container.style.display = 'none';
    }
}

// MENU HAMBURGUER MOBILE MELHORADO
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        const hamburger = document.getElementById('hamburgerMenu');
        const actionButtons = document.getElementById('actionButtons');
        const overlay = document.getElementById('menuOverlay');
        if (actionButtons) actionButtons.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (hamburger && actionButtons && overlay) {
            hamburger.onclick = function() {
                hamburger.classList.toggle('open');
                actionButtons.classList.toggle('active');
                overlay.classList.toggle('active');
            };
            overlay.onclick = function(e) {
                if (e.target === overlay) {
                    hamburger.classList.remove('open');
                    actionButtons.classList.remove('active');
                    overlay.classList.remove('active');
                }
            };
            // Fecha menu ao clicar em qualquer botão
            actionButtons.addEventListener('click', function(e) {
                if (e.target.tagName === 'BUTTON') {
                    hamburger.classList.remove('open');
                    actionButtons.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        }
    });
}

// Forçar re-renderização do menu ao redimensionar a janela
window.addEventListener('resize', () => { if (typeof renderActionButtons === 'function') renderActionButtons(); }); 