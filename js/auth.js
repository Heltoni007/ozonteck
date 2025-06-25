// =================================================================
// FUNÇÕES DE AUTENTICAÇÃO E ADMINISTRAÇÃO
// =================================================================

let sessionTimeout;

function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        handleLogout('Sua sessão expirou por inatividade.');
    }, 15 * 60 * 1000); // 15 minutos
}

async function handleLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value.trim();
    
    if (!username || !password) {
        showNotification('Por favor, preencha todos os campos!', 'error');
        return;
    }

    try {
        const response = await fetch('backend/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.error) {
            showNotification(data.message, 'error');
        } else {
            appState.currentUser = data.user;
            appState.isLoggedIn = true;
            sessionStorage.setItem('ozonteckUserSession', JSON.stringify(data.user));
            localStorage.setItem('ozonUser', JSON.stringify(data.user));
            
            showNotification(data.message, 'success');
            
            hideAllSections();
            if (appState.currentUser.role === 'admin') {
                document.getElementById('adminPanel').style.display = 'block';
                updateTeamList(); 
            }
            document.getElementById('clientDataSection').classList.remove('hidden');
            
            resetSessionTimeout();
            document.addEventListener('click', resetSessionTimeout);
            document.addEventListener('keypress', resetSessionTimeout);
            if (typeof renderActionButtons === 'function') renderActionButtons();
        }
    } catch (error) {
        console.error("Falha ao fazer login:", error);
        showNotification('Erro de comunicação com o servidor.', 'error');
    }
    
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
}

function handleLogout(notificationMessage = 'Logout realizado com sucesso!') {
    sessionStorage.removeItem('ozonteckUserSession');
    localStorage.removeItem('ozonUser');
    appState.currentUser = null;
    appState.isLoggedIn = false;
    appState.currentQuestion = 0;
    appState.answers = [];
    appState.selectedPriorities = [];
    appState.showingPriorities = false;
    
    hideAllSections();
    document.getElementById('loginSection').classList.remove('hidden');
    
    showNotification(notificationMessage, 'success');
    
    clearTimeout(sessionTimeout);
    document.removeEventListener('click', resetSessionTimeout);
    document.removeEventListener('keypress', resetSessionTimeout);
    if (typeof renderActionButtons === 'function') renderActionButtons();
}

async function addUser() {
    const newUsername = document.getElementById('newUser').value.trim();
    const newPassword = document.getElementById('newPass').value.trim();
    
    if (!newUsername || !newPassword) {
        showNotification('Preencha todos os campos!', 'error');
        return;
    }

    try {
        const response = await fetch('backend/api/add_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: newUsername, password: newPassword })
        });
        const result = await response.json();
        showNotification(result.message, result.error ? 'error' : 'success');
        
        if (!result.error) {
            document.getElementById('newUser').value = '';
            document.getElementById('newPass').value = '';
            updateTeamList();
        }
    } catch (error) {
        console.error("Falha ao adicionar usuário:", error);
        showNotification('Erro de comunicação ao adicionar usuário.', 'error');
    }
}

async function editUser(username, user) {
    // Cria um formulário inline para editar nome, avatar e role
    const teamList = document.getElementById('teamList');
    const userCard = Array.from(teamList.children).find(card => card.dataset.username === username);
    if (!userCard) return;
    userCard.innerHTML = `
        <form id="editUserForm" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <input type="text" id="editName" value="${user.name}" placeholder="Nome" style="width:120px;">
            <input type="text" id="editAvatar" value="${user.avatar || ''}" placeholder="Avatar" style="width:50px;">
            <select id="editRole">
                <option value="admin" ${user.role==='admin'?'selected':''}>admin</option>
                <option value="vendedor" ${user.role==='vendedor'?'selected':''}>vendedor</option>
                <option value="demo" ${user.role==='demo'?'selected':''}>demo</option>
            </select>
            <button type="submit" class="btn btn-sm" style="background:#00b894;">Salvar</button>
            <button type="button" class="btn btn-sm btn-danger" id="cancelEdit">Cancelar</button>
        </form>
    `;
    document.getElementById('cancelEdit').onclick = updateTeamList;
    document.getElementById('editUserForm').onsubmit = async function(e) {
        e.preventDefault();
        const name = document.getElementById('editName').value.trim();
        const avatar = document.getElementById('editAvatar').value.trim();
        const role = document.getElementById('editRole').value;
        try {
            const response = await fetch('backend/api/update_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, name, avatar, role })
            });
            const result = await response.json();
            showNotification(result.message, result.error ? 'error' : 'success');
            if (!result.error) updateTeamList();
        } catch (error) {
            showNotification('Erro ao atualizar usuário.', 'error');
        }
    };
}

async function updateTeamList() {
    try {
        const response = await fetch('backend/api/get_users.php');
        const users = await response.json();
        const teamList = document.getElementById('teamList');
        teamList.innerHTML = '';
        Object.entries(users).forEach(([username, user]) => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.dataset.username = username;
            userCard.innerHTML = `
                <div>
                    <span>${user.avatar}</span>
                    <strong>${user.name}</strong>
                    <span style="font-size: 12px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${user.role}</span>
                </div>
                ${user.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="removeUser('${username}')">Remover</button>` : ''}
                <button class="btn btn-sm" style="background:#00b894;" onclick="editUser('${username}', ${JSON.stringify(user).replace(/"/g,'&quot;')})">Editar</button>
            `;
            teamList.appendChild(userCard);
        });
    } catch (error) {
        console.error("Falha ao buscar lista de usuários:", error);
        showNotification('Erro ao carregar a equipe.', 'error');
    }
}

async function removeUser(username) {
    if (!confirm(`Tem certeza que deseja remover o usuário "${username}"?`)) {
        return;
    }

    try {
        const response = await fetch('backend/api/remove_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username })
        });
        const result = await response.json();
        showNotification(result.message, result.error ? 'error' : 'success');
        
        if (!result.error) {
            updateTeamList();
        }
    } catch (error) {
        console.error("Falha ao remover usuário:", error);
        showNotification('Erro de comunicação ao remover usuário.', 'error');
    }
}

function checkActiveSession() {
    const userSession = sessionStorage.getItem('ozonteckUserSession');
    if (userSession) {
        const user = JSON.parse(userSession);
        appState.currentUser = user;
        appState.isLoggedIn = true;

        showNotification(`Sessão restaurada. Bem-vindo(a) de volta, ${user.name}!`, 'success');

        if (typeof hideAllSections === 'function') hideAllSections();
        const adminPanel = document.getElementById('adminPanel');
        if (user.role === 'admin' && adminPanel) {
            adminPanel.style.display = 'block';
            if (typeof updateTeamList === 'function') updateTeamList();
        }
        const clientDataSection = document.getElementById('clientDataSection');
        if (clientDataSection) clientDataSection.classList.remove('hidden');

        if (typeof resetSessionTimeout === 'function') resetSessionTimeout();
        document.addEventListener('click', resetSessionTimeout);
        document.addEventListener('keypress', resetSessionTimeout);
        if (typeof renderActionButtons === 'function') renderActionButtons();
    }
} 