// js/gestao_equipe.js

async function fetchUsers() {
    const user = JSON.parse(sessionStorage.getItem('ozonteckUserSession') || '{}');
    const params = user && user.role && user.username ? `?requester=${encodeURIComponent(user.username)}&role=${encodeURIComponent(user.role)}` : '';
    const res = await fetch('backend/api/get_users.php' + params);
    return await res.json();
}

function renderTeamFilters(users, onFilter) {
    const actions = document.getElementById('teamActions');
    actions.innerHTML = '';
    // Filtro por role
    const roleSelect = document.createElement('select');
    roleSelect.className = 'btn btn-sm';
    roleSelect.innerHTML = '<option value="">Todos os papéis</option>' + ['admin','gestor','vendedor'].map(r => `<option value="${r}">${r}</option>`).join('');
    // Filtro por gestor
    const gestores = Object.entries(users).filter(([u,ud]) => ud.role==='gestor').map(([u,ud]) => u);
    const gestorSelect = document.createElement('select');
    gestorSelect.className = 'btn btn-sm';
    gestorSelect.innerHTML = '<option value="">Todos os gestores</option>' + gestores.map(g => `<option value="${g}">${g}</option>`).join('');
    [roleSelect, gestorSelect].forEach(el => el.onchange = () => {
        onFilter({ role: roleSelect.value, gestor: gestorSelect.value });
    });
    actions.appendChild(roleSelect);
    actions.appendChild(gestorSelect);
    // Botão novo usuário
    const user = JSON.parse(sessionStorage.getItem('ozonteckUserSession') || '{}');
    if (user && (user.role === 'admin' || user.role === 'gestor')) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm';
        btn.style = 'background:#00b894;color:#fff;';
        btn.innerText = 'Novo Usuário';
        btn.onclick = () => showUserForm(users, null);
        actions.appendChild(btn);
    }
}

function filterUsers(users, filters) {
    return Object.entries(users).filter(([username, u]) => {
        let ok = true;
        if (filters.role) ok = ok && u.role === filters.role;
        if (filters.gestor && u.role === 'vendedor') ok = ok && u.gestor_id === filters.gestor;
        return ok;
    });
}

function renderTeamList(users, filters) {
    const teamList = document.getElementById('teamList');
    teamList.innerHTML = '';
    filterUsers(users, filters).forEach(([username, u]) => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `
            <div class="team-info">
                <span class="team-avatar">${u.avatar || '👤'}</span>
                <span class="team-name">${u.name}</span>
                <span class="team-role">${u.role}</span>
                ${u.role === 'vendedor' && u.gestor_id ? `<span class="team-gestor">Gestor: ${u.gestor_id}</span>` : ''}
                <span class="team-status ${u.ativo===false?'inativo':'ativo'}">${u.ativo===false?'Inativo':'Ativo'}</span>
            </div>
            <div class="team-actions-btns">
                <button class="btn btn-sm" onclick="showUserForm(window._users,'${username}')">Editar</button>
                ${u.role!=='admin'?`<button class="btn btn-sm" onclick="toggleAtivo('${username}',${u.ativo!==false})">${u.ativo===false?'Ativar':'Desativar'}</button>`:''}
                ${u.role!=='admin'?`<button class="btn btn-danger btn-sm" onclick="removeUser('${username}')">Remover</button>`:''}
            </div>
        `;
        teamList.appendChild(card);
    });
}

function showUserForm(users, username) {
    const user = JSON.parse(sessionStorage.getItem('ozonteckUserSession') || '{}');
    const isEdit = !!username;
    const u = isEdit ? users[username] : {};
    const isGestor = user.role === 'gestor';
    const modal = document.createElement('div');
    modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0008;z-index:999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `<div style="background:#fff;padding:32px 22px 22px 22px;border-radius:18px;min-width:260px;max-width:96vw;box-shadow:0 8px 40px #00b89433;display:flex;flex-direction:column;align-items:center;">
        <h3 style="margin-bottom:18px;font-size:1.25em;font-weight:700;color:#00b894;letter-spacing:1px;text-align:center;">${isEdit?'Editar':'Novo'} Usuário</h3>
        <form id="userForm" style="width:100%;max-width:340px;display:flex;flex-direction:column;gap:14px;">
            <label style='font-size:1em;color:#1e293b;font-weight:500;'>Nome
                <input type="text" id="formName" placeholder="Nome" value="${u.name||''}" required style="width:100%;margin-top:4px;padding:10px 12px;border-radius:8px;border:1.5px solid #e0e0e0;font-size:1em;">
            </label>
            <label style='font-size:1em;color:#1e293b;font-weight:500;'>Avatar (emoji)
                <input type="text" id="formAvatar" placeholder="Avatar (emoji)" value="${u.avatar||'👤'}" style="width:100%;margin-top:4px;padding:10px 12px;border-radius:8px;border:1.5px solid #e0e0e0;font-size:1em;">
            </label>
            <label style='font-size:1em;color:#1e293b;font-weight:500;'>Papel
                <select id="formRole" style="width:100%;margin-top:4px;padding:10px 12px;border-radius:8px;border:1.5px solid #e0e0e0;font-size:1em;">
                    <option value="vendedor" ${u.role==='vendedor'?'selected':''}>Vendedor</option>
                    ${!isGestor ? `<option value="gestor" ${u.role==='gestor'?'selected':''}>Gestor</option>` : ''}
                    ${user.role==='admin'?'<option value="admin" '+(u.role==='admin'?'selected':'')+'>Admin</option>':''}
                </select>
            </label>
            <label style='font-size:1em;color:#1e293b;font-weight:500;${u.role!=='vendedor'?'display:none;':''}'>Gestor (username)
                <input type="text" id="formGestor" placeholder="Gestor (username)" value="${u.gestor_id||''}" style="width:100%;margin-top:4px;padding:10px 12px;border-radius:8px;border:1.5px solid #e0e0e0;font-size:1em;${u.role!=='vendedor'?'display:none;':''}">
            </label>
            <label style='font-size:1em;color:#1e293b;font-weight:500;'>Usuário
                <input type="text" id="formUsername" placeholder="Usuário" value="${username||''}" ${isEdit?'readonly':''} required style="width:100%;margin-top:4px;padding:10px 12px;border-radius:8px;border:1.5px solid #e0e0e0;font-size:1em;">
            </label>
            <label style='font-size:1em;color:#1e293b;font-weight:500;'>Senha
                <input type="password" id="formPassword" placeholder="Senha" ${isEdit?'':'required'} style="width:100%;margin-top:4px;padding:10px 12px;border-radius:8px;border:1.5px solid #e0e0e0;font-size:1em;">
            </label>
            <div style="display:flex;gap:12px;justify-content:center;margin-top:10px;">
                <button type="submit" class="btn btn-sm" style="background:#00b894;color:#fff;font-weight:600;padding:10px 22px;border-radius:8px;font-size:1em;">Salvar</button>
                <button type="button" class="btn btn-sm" id="cancelUserForm" style="background:#e0e0e0;color:#1e293b;font-weight:600;padding:10px 22px;border-radius:8px;font-size:1em;">Cancelar</button>
            </div>
        </form>
    </div>`;
    document.body.appendChild(modal);
    document.getElementById('cancelUserForm').onclick = ()=>modal.remove();
    document.getElementById('formRole').onchange = function(e){
        document.getElementById('formGestor').style.display = e.target.value==='vendedor'?'block':'none';
    };
    document.getElementById('userForm').onsubmit = async function(e){
        e.preventDefault();
        const name = document.getElementById('formName').value.trim();
        const avatar = document.getElementById('formAvatar').value.trim();
        const role = document.getElementById('formRole').value;
        const gestor_id = role==='vendedor'?document.getElementById('formGestor').value.trim():null;
        const username = document.getElementById('formUsername').value.trim();
        const password = document.getElementById('formPassword').value;
        const ativo = true;
        const requester = user.username;
        let url, body;
        if (isEdit) {
            url = 'backend/api/update_user.php';
            body = { username, name, avatar, role, gestor_id, ativo, requester };
        } else {
            url = 'backend/api/add_user.php';
            body = { username, password, name, avatar, role, gestor_id, ativo, requester };
        }
        const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
        const result = await res.json();
        alert(result.message);
        if (!result.error) {
            modal.remove();
            loadTeam();
        }
    };
}

async function toggleAtivo(username, ativar) {
    const user = JSON.parse(sessionStorage.getItem('ozonteckUserSession') || '{}');
    const users = window._users;
    const u = users[username];
    if (!u) return;
    const res = await fetch('backend/api/update_user.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ username, name:u.name, avatar:u.avatar, role:u.role, gestor_id:u.gestor_id, ativo:ativar, requester:user.username })
    });
    const result = await res.json();
    alert(result.message);
    if (!result.error) loadTeam();
}

async function removeUser(username) {
    if (!confirm('Remover usuário?')) return;
    const user = JSON.parse(sessionStorage.getItem('ozonteckUserSession') || '{}');
    const res = await fetch('backend/api/remove_user.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ username, requester:user.username })
    });
    const result = await res.json();
    alert(result.message);
    if (!result.error) loadTeam();
}

async function loadTeam() {
    const users = await fetchUsers();
    const sessionUser = JSON.parse(sessionStorage.getItem('ozonteckUserSession') || '{}');
    let filteredUsers = users;
    if (sessionUser.role === 'gestor') {
        // Gestor só vê a si mesmo e seus vendedores
        filteredUsers = Object.fromEntries(Object.entries(users).filter(([username, u]) => {
            return (u.role === 'gestor' && username === sessionUser.username) || (u.role === 'vendedor' && u.gestor_id === sessionUser.username);
        }));
    }
    window._users = filteredUsers;
    let currentFilters = { role: '', gestor: '' };
    renderTeamFilters(filteredUsers, f => {
        currentFilters = { ...currentFilters, ...f };
        renderTeamList(filteredUsers, currentFilters);
    });
    renderTeamList(filteredUsers, currentFilters);
}

document.addEventListener('DOMContentLoaded', loadTeam); 