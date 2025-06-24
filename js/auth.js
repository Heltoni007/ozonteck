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

async function updateTeamList() {
    try {
        const response = await fetch('backend/api/get_users.php');
        const users = await response.json();
        
        const teamList = document.getElementById('teamList');
        teamList.innerHTML = '';
        
        Object.entries(users).forEach(([username, user]) => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <div>
                    <span>${user.avatar}</span>
                    <strong>${user.name}</strong>
                    <span style="font-size: 12px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${user.role}</span>
                </div>
                ${user.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="removeUser('${username}')">Remover</button>` : ''}
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

        hideAllSections();
        if (user.role === 'admin') {
            document.getElementById('adminPanel').style.display = 'block';
            updateTeamList();
        }
        
        // Para admin e vendedores, após logar, sempre mostramos a coleta de dados do cliente.
        document.getElementById('clientDataSection').classList.remove('hidden');

        resetSessionTimeout();
        document.addEventListener('click', resetSessionTimeout);
        document.addEventListener('keypress', resetSessionTimeout);
    }
} 