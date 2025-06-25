// js/catalogo.js

async function fetchProducts() {
    const res = await fetch('backend/api/products_crud.php');
    return await res.json();
}

async function fetchCategories() {
    const res = await fetch('backend/api/categories_crud.php');
    return await res.json();
}

function getUser() {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('ozonUser'));
    } catch (e) {}
    return user;
}

// Estrutura global do carrinho
let cart = JSON.parse(localStorage.getItem('ozonCart') || '{}');

function saveCart() {
    localStorage.setItem('ozonCart', JSON.stringify(cart));
}

function addToCart(prod, vendedor, qtd = 1) {
    // Verifica estoque do vendedor
    const stock = prod.stock && vendedor && prod.stock[vendedor] !== undefined ? prod.stock[vendedor] : 0;
    if (stock <= 0) {
        showNotification('Produto sem estoque!', 'error');
        return;
    }
    if (!cart[prod.name]) {
        cart[prod.name] = { ...prod, qtd: 0 };
    }
    // Não permite adicionar mais do que o estoque disponível
    if (cart[prod.name].qtd + qtd > stock) {
        showNotification('Estoque insuficiente para esse produto!', 'error');
        return;
    }
    cart[prod.name].qtd += qtd;
    saveCart();
    showCartButton();
    showNotification('Produto adicionado ao carrinho!', 'success');
}

function removeFromCart(prodName) {
    delete cart[prodName];
    saveCart();
    showCartModal();
    showCartButton();
}

function updateCartQuantity(prodName, qtd) {
    if (cart[prodName]) {
        cart[prodName].qtd = qtd;
        if (qtd <= 0) removeFromCart(prodName);
        else saveCart();
    }
    showCartModal();
    showCartButton();
}

function getCartTotal() {
    return Object.values(cart).reduce((sum, item) => sum + item.price * item.qtd, 0);
}

function showCartButton() {
    let btn = document.getElementById('cartFloatingBtn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'cartFloatingBtn';
        btn.className = 'btn btn-primary';
        btn.style.position = 'fixed';
        btn.style.bottom = '28px';
        btn.style.right = '28px';
        btn.style.zIndex = '9999';
        btn.style.borderRadius = '50%';
        btn.style.width = '70px';
        btn.style.height = '70px';
        btn.style.boxShadow = '0 4px 18px rgba(0,0,0,0.13)';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.fontSize = '2.1em';
        btn.innerHTML = '<span style="position:relative;display:inline-block;width:1.2em;height:1.2em;">🛒<span id="cartCount" style="position:absolute;top:-12px;right:-18px;background:#dc2626;color:#fff;font-size:0.7em;font-weight:700;padding:2px 7px;border-radius:12px;min-width:22px;text-align:center;box-shadow:0 2px 8px #0002;">0</span></span>';
        btn.title = 'Abrir carrinho';
        btn.onclick = showCartModal;
        document.body.appendChild(btn);
    }
    const count = Object.values(cart).reduce((sum, item) => sum + item.qtd, 0);
    document.getElementById('cartCount').textContent = count;
    btn.style.display = count > 0 ? 'flex' : 'none';
}

function showCartModal() {
    let modal = document.getElementById('cartModalBg');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'cartModalBg';
    modal.className = 'modal-bg';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.18)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'flex-end';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `
        <div id="cartModalContent" style="background:#fff;border:2.5px solid #00b894;box-shadow:0 8px 32px rgba(0,0,0,0.12);border-radius:18px 18px 0 0;padding:0;width:100vw;max-width:420px;min-width:0;color:#1e293b;position:relative;display:flex;flex-direction:column;min-height:0;max-height:95vh;overflow-y:auto;">
            <div style="padding:22px 20px 0 20px;display:flex;align-items:center;justify-content:space-between;">
                <h3 style="margin:0;font-size:1.2rem;font-weight:700;">🛒 Carrinho</h3>
                <button class="btn btn-danger btn-sm" id="closeCartModal">Fechar</button>
            </div>
            <div id="cartItemsList" style="padding:10px 20px 0 20px;"></div>
            <div style="padding:18px 20px 18px 20px;border-top:1.5px solid #e0e0e0;margin-top:10px;">
                <div style="font-weight:600;font-size:1.1em;">Total: <span id="cartTotal">R$ ${getCartTotal().toFixed(2)}</span></div>
                <button class="btn btn-primary btn-block" id="btnCheckout" style="margin-top:18px;width:100%;font-size:1.1em;">Finalizar Venda</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeCartModal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    renderCartItems();
    document.getElementById('btnCheckout').onclick = showCheckoutModal;
    // Responsividade extra para mobile
    const mq = window.matchMedia('(max-width: 600px)');
    const content = document.getElementById('cartModalContent');
    if (mq.matches && content) {
        content.style.maxWidth = '100vw';
        content.style.width = '100vw';
        content.style.borderRadius = '10px 10px 0 0';
        content.style.padding = '0';
        content.style.minHeight = '0';
        content.style.maxHeight = '98vh';
        content.style.overflowY = 'auto';
    }
}

async function getAllClients() {
    // Busca clientes do localStorage (appState.clientData) e dos diagnósticos do banco
    let clients = [];
    // 1. Clientes do localStorage (últimos usados)
    try {
        const saved = JSON.parse(localStorage.getItem('ozonClients') || '[]');
        if (Array.isArray(saved)) clients = saved;
    } catch (e) {}
    // 2. Clientes dos diagnósticos do banco
    try {
        const res = await fetch('backend/api/get_diagnostics.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: getUser() })
        });
        const data = await res.json();
        if (data.diagnostics) {
            data.diagnostics.forEach(diag => {
                if (diag.client && diag.client.name) {
                    // Evita duplicados por nome/email
                    if (!clients.some(c => c.name === diag.client.name && c.email === diag.client.email)) {
                        clients.push({
                            name: diag.client.name,
                            email: diag.client.email || '',
                            whatsapp: diag.client.whatsapp || '',
                            ageRange: diag.client.ageRange || ''
                        });
                    }
                }
            });
        }
    } catch (e) {}
    return clients;
}

function saveClientToLocal(client) {
    let clients = [];
    try { clients = JSON.parse(localStorage.getItem('ozonClients') || '[]'); } catch (e) {}
    // Evita duplicados por nome/email
    if (!clients.some(c => c.name === client.name && c.email === client.email)) {
        clients.push(client);
        localStorage.setItem('ozonClients', JSON.stringify(clients));
    }
}

function renderClientAutocomplete(input, clients, onSelect) {
    let acList = document.getElementById('clientAutocompleteList');
    if (acList) acList.remove();
    acList = document.createElement('div');
    acList.id = 'clientAutocompleteList';
    acList.style.position = 'absolute';
    acList.style.background = '#fff';
    acList.style.border = '1.5px solid #00b894';
    acList.style.borderRadius = '8px';
    acList.style.boxShadow = '0 4px 18px rgba(0,0,0,0.08)';
    acList.style.zIndex = '10001';
    acList.style.width = input.offsetWidth + 'px';
    acList.style.maxHeight = '180px';
    acList.style.overflowY = 'auto';
    acList.style.left = input.getBoundingClientRect().left + window.scrollX + 'px';
    acList.style.top = input.getBoundingClientRect().bottom + window.scrollY + 'px';
    document.body.appendChild(acList);
    const val = input.value.trim().toLowerCase();
    const filtered = clients.filter(c => c.name.toLowerCase().includes(val) || c.email.toLowerCase().includes(val) || c.whatsapp.includes(val));
    if (!filtered.length) {
        acList.innerHTML = '<div style="padding:8px 12px;color:#64748b;">Nenhum cliente encontrado</div>';
        return;
    }
    filtered.forEach(c => {
        const div = document.createElement('div');
        div.style.padding = '8px 12px';
        div.style.cursor = 'pointer';
        div.style.borderBottom = '1px solid #e0e0e0';
        div.style.color = '#1e293b';
        div.textContent = `${c.name} ${c.email ? ' - ' + c.email : ''} ${c.whatsapp ? ' - ' + c.whatsapp : ''}`;
        div.onclick = () => {
            onSelect(c);
            acList.remove();
        };
        acList.appendChild(div);
    });
    document.addEventListener('click', function handler(e) {
        if (!acList.contains(e.target) && e.target !== input) {
            acList.remove();
            document.removeEventListener('click', handler);
        }
    });
}

function showCheckoutModal() {
    let modal = document.getElementById('checkoutModalBg');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'checkoutModalBg';
    modal.className = 'modal-bg';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.18)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    const total = getCartTotal();
    modal.innerHTML = `
        <div style="background:#fff;border:2.5px solid #00b894;box-shadow:0 8px 32px rgba(0,0,0,0.12);border-radius:18px;padding:0;max-width:98vw;width:100%;max-width:420px;min-width:0;color:#1e293b;position:relative;display:flex;flex-direction:column;">
            <div style="padding:28px 20px 0 20px;overflow-y:auto;max-height:80vh;flex:1 1 auto;">
                <h3 style="text-align:center;margin-bottom:18px;font-weight:700;color:#1e293b;font-size:1.3rem;">Finalizar Venda</h3>
                <div style="margin-bottom:12px;position:relative;">
                    <label><b>Cliente:</b></label>
                    <input type="text" id="checkoutClient" class="btn btn-sm" placeholder="Nome do cliente" style="width:100%;margin-top:4px;">
                    <div id="clientExtraFields" style="margin-top:8px;display:none;">
                        <input type="email" id="checkoutClientEmail" class="btn btn-sm" placeholder="E-mail" style="width:100%;margin-bottom:6px;">
                        <input type="text" id="checkoutClientWhatsapp" class="btn btn-sm" placeholder="WhatsApp" style="width:100%;margin-bottom:6px;">
                        <input type="text" id="checkoutClientAge" class="btn btn-sm" placeholder="Faixa etária" style="width:100%;">
                        <button id="btnBackToSearch" class="btn btn-secondary btn-sm" style="margin-top:6px;">Voltar para busca</button>
                    </div>
                    <button id="btnNewClient" class="btn btn-secondary btn-sm" style="margin-top:6px;">Novo cliente</button>
                </div>
                <div style="margin-bottom:12px;">
                    <label><b>Desconto:</b></label>
                    <input type="number" id="checkoutDiscount" class="btn btn-sm" placeholder="0,00" min="0" style="width:100%;margin-top:4px;">
                </div>
                <div style="margin-bottom:12px;">
                    <label><b>Método de Pagamento:</b></label>
                    <select id="checkoutPayment" class="btn btn-sm" style="width:100%;margin-top:4px;">
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao">Cartão</option>
                        <option value="pix">Pix</option>
                        <option value="outro">Outro</option>
                    </select>
                </div>
                <div style="margin-bottom:12px;" id="checkoutMoneyDiv">
                    <label><b>Valor Recebido:</b></label>
                    <input type="number" id="checkoutReceived" class="btn btn-sm" placeholder="0,00" min="0" style="width:100%;margin-top:4px;">
                </div>
                <div style="margin-bottom:12px;">
                    <b>Resumo:</b>
                    <ul id="checkoutSummary" style="padding-left:18px;margin:8px 0 0 0;font-size:0.98em;"></ul>
                </div>
                <div style="font-weight:600;font-size:1.1em;text-align:right;">Total: <span id="checkoutTotal">R$ ${total.toFixed(2)}</span></div>
                <button class="btn btn-primary btn-block" id="btnConfirmCheckout" style="margin-top:18px;width:100%;font-size:1.1em;">Confirmar Venda</button>
                <button class="btn btn-secondary btn-block" id="btnCancelCheckout" style="margin-top:8px;width:100%;">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btnCancelCheckout').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    // Esconde valor recebido se não for dinheiro
    const paymentSelect = document.getElementById('checkoutPayment');
    const moneyDiv = document.getElementById('checkoutMoneyDiv');
    paymentSelect.onchange = () => {
        moneyDiv.style.display = paymentSelect.value === 'dinheiro' ? 'block' : 'none';
    };
    paymentSelect.onchange();
    // Resumo dos produtos
    const summary = document.getElementById('checkoutSummary');
    summary.innerHTML = Object.values(cart).map(item => `<li>${item.name} x ${item.qtd} = R$ ${(item.price * item.qtd).toFixed(2)}</li>`).join('');
    // Atualiza total com desconto
    const discountInput = document.getElementById('checkoutDiscount');
    const totalSpan = document.getElementById('checkoutTotal');
    discountInput.oninput = () => {
        let discount = parseFloat(discountInput.value) || 0;
        let newTotal = total - discount;
        if (newTotal < 0) newTotal = 0;
        totalSpan.textContent = 'R$ ' + newTotal.toFixed(2);
    };
    // Autocomplete de clientes
    (async () => {
        const clients = await getAllClients();
        const clientInput = document.getElementById('checkoutClient');
        const extraFields = document.getElementById('clientExtraFields');
        const btnNewClient = document.getElementById('btnNewClient');
        const btnBackToSearch = document.getElementById('btnBackToSearch');
        clientInput.oninput = () => {
            renderClientAutocomplete(clientInput, clients, c => {
                clientInput.value = c.name;
                extraFields.style.display = 'block';
                document.getElementById('checkoutClientEmail').value = c.email || '';
                document.getElementById('checkoutClientWhatsapp').value = c.whatsapp || '';
                document.getElementById('checkoutClientAge').value = c.ageRange || '';
            });
        };
        btnNewClient.onclick = () => {
            extraFields.style.display = 'block';
            clientInput.value = '';
            document.getElementById('checkoutClientEmail').value = '';
            document.getElementById('checkoutClientWhatsapp').value = '';
            document.getElementById('checkoutClientAge').value = '';
        };
        btnBackToSearch.onclick = () => {
            extraFields.style.display = 'none';
            document.getElementById('checkoutClientEmail').value = '';
            document.getElementById('checkoutClientWhatsapp').value = '';
            document.getElementById('checkoutClientAge').value = '';
        };
    })();
    document.getElementById('btnConfirmCheckout').onclick = async () => {
        // Coletar dados
        const clientName = document.getElementById('checkoutClient').value.trim();
        const clientEmail = document.getElementById('checkoutClientEmail')?.value.trim() || '';
        const clientWhatsapp = document.getElementById('checkoutClientWhatsapp')?.value.trim() || '';
        const clientAge = document.getElementById('checkoutClientAge')?.value.trim() || '';
        const cliente = { name: clientName, email: clientEmail, whatsapp: clientWhatsapp, ageRange: clientAge };
        if (!clientName) {
            showNotification('Informe o nome do cliente!', 'error');
            return;
        }
        saveClientToLocal(cliente);
        const desconto = parseFloat(document.getElementById('checkoutDiscount').value) || 0;
        const pagamento = document.getElementById('checkoutPayment').value;
        const valor_recebido = pagamento === 'dinheiro' ? (parseFloat(document.getElementById('checkoutReceived').value) || 0) : 0;
        const user = getUser();
        const vendedor = user ? user.name : '';
        const produtos = Object.values(cart).map(item => ({
            name: item.name,
            qtd: item.qtd,
            price: item.price
        }));
        const total = Math.max(getCartTotal() - desconto, 0);
        // Enviar para backend
        const res = await fetch('backend/api/sales_crud.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente, desconto, pagamento, valor_recebido, vendedor, produtos, total
            })
        });
        const data = await res.json();
        if (data.success) {
            // Baixar estoque dos produtos vendidos
            for (const item of produtos) {
                await fetch('backend/api/update_stock.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: item.name, vendedor, stock: (cart[item.name].stock && cart[item.name].stock[vendedor] ? cart[item.name].stock[vendedor] : 0) - item.qtd })
                });
            }
            showNotification('Venda registrada com sucesso!', 'success');
            modal.remove();
            document.getElementById('cartModalBg')?.remove();
            cart = {};
            saveCart();
            showCartButton();
            // Atualizar catálogo em tempo real
            const products = await fetchProducts();
            renderCatalog(products, getUser());
            // Exibir modal de comprovante
            setTimeout(() => showComprovanteModal({ ...data, ...{
                datahora: new Date().toISOString(),
                cliente,
                vendedor,
                produtos,
                desconto,
                total,
                pagamento,
                valor_recebido
            }}), 400);
        } else {
            showNotification('Erro ao registrar venda: ' + (data.error || 'Erro desconhecido'), 'error');
        }
    };
}

function renderCartItems() {
    const list = document.getElementById('cartItemsList');
    if (!list) return;
    if (Object.keys(cart).length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#64748b;font-weight:500;width:100%;margin:30px 0;">Seu carrinho está vazio.</div>';
        return;
    }
    list.innerHTML = '';
    Object.values(cart).forEach(item => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'space-between';
        div.style.gap = '10px';
        div.style.marginBottom = '12px';
        div.innerHTML = `
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;font-size:1.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
                <div style="color:#64748b;font-size:12px;">R$ ${item.price.toFixed(2)} x </div>
            </div>
            <input type="number" min="1" value="${item.qtd}" style="width:48px;padding:4px 8px;border-radius:6px;border:1.5px solid #d1fae5;">
            <button class="btn btn-danger btn-sm" title="Remover">✖</button>
        `;
        // Atualizar quantidade
        const input = div.querySelector('input[type=number]');
        input.onchange = () => {
            let val = parseInt(input.value);
            if (isNaN(val) || val < 1) val = 1;
            updateCartQuantity(item.name, val);
        };
        // Remover item
        const btnRemove = div.querySelector('button');
        btnRemove.onclick = () => removeFromCart(item.name);
        list.appendChild(div);
    });
    document.getElementById('cartTotal').textContent = 'R$ ' + getCartTotal().toFixed(2);
}

function renderCatalog(products, user, filters = {}) {
    const grid = document.getElementById('catalogGrid');
    grid.innerHTML = '';
    const vendedor = user ? user.name : null;
    let filteredProducts = Object.values(products);
    // Filtro de categoria
    if (filters.category && filters.category !== '') {
        filteredProducts = filteredProducts.filter(prod => prod.category === filters.category);
    }
    // Filtro de busca
    if (filters.search && filters.search.trim() !== '') {
        const search = filters.search.trim().toLowerCase();
        filteredProducts = filteredProducts.filter(prod =>
            prod.name.toLowerCase().includes(search) ||
            prod.code.toLowerCase().includes(search)
        );
    }
    // Filtro de estoque
    if (filters.stock === 'in') {
        filteredProducts = filteredProducts.filter(prod => prod.stock && vendedor && prod.stock[vendedor] > 0);
    } else if (filters.stock === 'low') {
        filteredProducts = filteredProducts.filter(prod => prod.stock && vendedor && prod.stock[vendedor] > 0 && prod.stock[vendedor] <= 5);
    } else if (filters.stock === 'out') {
        filteredProducts = filteredProducts.filter(prod => !prod.stock || !prod.stock[vendedor] || prod.stock[vendedor] === 0);
    }
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<div style="text-align:center;color:#64748b;font-weight:500;width:100%;">Nenhum produto encontrado.</div>';
        return;
    }
    filteredProducts.forEach(prod => {
        const img = prod.image ? prod.image : 'https://cdn.jsdelivr.net/gh/feathericons/feather@4.28.0/icons/image.svg';
        const stock = prod.stock && vendedor && prod.stock[vendedor] !== undefined ? prod.stock[vendedor] : 0;
        let stockClass = 'catalog-stock';
        let stockText = '';
        if (stock === 0) {
            stockClass += ' zero';
            stockText = 'Sem estoque';
        } else if (stock <= 5) {
            stockClass += ' low';
            stockText = `Estoque baixo (${stock} unidade${stock === 1 ? '' : 's'})`;
        } else {
            stockText = `Com estoque (${stock} unidade${stock === 1 ? '' : 's'})`;
        }
        const card = document.createElement('div');
        card.className = 'catalog-card';
        card.innerHTML = `
            <img src="${img}" alt="img">
            <div class="catalog-category">${prod.category}</div>
            <div style="font-size:1.15rem;font-weight:700;text-align:center;margin-bottom:2px;color:#1e293b;">${prod.name}</div>
            <div style="color:#64748b;font-size:13px;text-align:center;margin-bottom:2px;">Código: ${prod.code}</div>
            <div style="color:#00b894;font-weight:600;text-align:center;margin-bottom:6px;">R$ ${prod.price.toFixed(2)}</div>
            <div class="${stockClass}">${stockText}</div>
            <div class="catalog-update">
                <input type="number" min="0" value="${stock}" style="width:60px;padding:4px 8px;border-radius:6px;border:1.5px solid #d1fae5;">
                <button class="btn btn-sm" style="background:#00b894;color:#fff;" title="Atualizar estoque">Atualizar</button>
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-top:10px;" title="Ver detalhes do produto">Ver detalhes</button>
            <button class="btn btn-primary btn-sm" style="margin-top:8px;" title="Adicionar ao carrinho">Adicionar ao carrinho</button>
        `;
        // Atualizar estoque
        const input = card.querySelector('input[type=number]');
        const btn = card.querySelector('button');
        btn.onclick = async () => {
            const novoEstoque = parseInt(input.value);
            if (isNaN(novoEstoque) || novoEstoque < 0) {
                alert('Estoque inválido!');
                return;
            }
            const res = await fetch('backend/api/update_stock.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: prod.name, vendedor: vendedor, stock: novoEstoque })
            });
            const data = await res.json();
            if (data.success) {
                prod.stock = prod.stock || {};
                prod.stock[vendedor] = novoEstoque;
                if (novoEstoque === 0) {
                    showNotification('Produto sem estoque!', 'error');
                } else if (novoEstoque <= 5) {
                    showNotification('Estoque baixo para este produto!', 'warning');
                } else {
                    showNotification('Estoque atualizado!', 'success');
                }
                renderCatalog(products, user); // Atualiza visual
            } else {
                alert(data.error || 'Erro ao atualizar estoque!');
            }
        };
        // Botão ver detalhes
        const btnDetails = card.querySelectorAll('button')[1];
        btnDetails.onclick = () => showProductDetailsModal(prod, vendedor);
        // Botão adicionar ao carrinho
        const btnAddCart = card.querySelectorAll('button')[2];
        btnAddCart.onclick = () => addToCart(prod, vendedor, 1);
        grid.appendChild(card);
    });
    showCartButton();
}

function showNotification(msg, type) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.style.background = type === 'error' ? '#dc2626' : (type === 'warning' ? '#f59e0b' : '#00b894');
    n.style.color = '#fff';
    n.style.padding = '12px 22px';
    n.style.position = 'fixed';
    n.style.top = '24px';
    n.style.left = '50%';
    n.style.transform = 'translateX(-50%)';
    n.style.borderRadius = '8px';
    n.style.fontWeight = '600';
    n.style.zIndex = 9999;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2500);
}

async function renderCatalogFilters(products, user, onFilter) {
    const filtersDiv = document.getElementById('catalogFilters');
    filtersDiv.innerHTML = '';
    // Busca
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar por nome ou código...';
    searchInput.className = 'btn btn-sm';
    searchInput.style.minWidth = '180px';
    // Categoria
    const categories = await fetchCategories();
    const categorySelect = document.createElement('select');
    categorySelect.className = 'btn btn-sm';
    categorySelect.style.minWidth = '140px';
    categorySelect.innerHTML = '<option value="">Todas as categorias</option>' + categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    // Estoque
    const stockSelect = document.createElement('select');
    stockSelect.className = 'btn btn-sm';
    stockSelect.style.minWidth = '140px';
    stockSelect.innerHTML = '<option value="all">Todos</option><option value="in">Com estoque</option><option value="low">Estoque baixo</option><option value="out">Sem estoque</option>';
    // Eventos
    [searchInput, categorySelect, stockSelect].forEach(el => el.onchange = () => {
        onFilter({
            search: searchInput.value,
            category: categorySelect.value,
            stock: stockSelect.value === 'all' ? '' : stockSelect.value
        });
    });
    searchInput.oninput = () => {
        onFilter({
            search: searchInput.value,
            category: categorySelect.value,
            stock: stockSelect.value === 'all' ? '' : stockSelect.value
        });
    };
    // Adiciona ao DOM
    filtersDiv.appendChild(searchInput);
    filtersDiv.appendChild(categorySelect);
    filtersDiv.appendChild(stockSelect);
}

async function initCatalog() {
    // Renderiza botões de ação se função existir
    if (typeof renderActionButtons === 'function') renderActionButtons();
    const products = await fetchProducts();
    const categories = await fetchCategories();
    const user = getUser();
    if (!user) {
        document.getElementById('catalogGrid').innerHTML = '<div style="text-align:center;color:#dc2626;font-weight:600;">Faça login para acessar o catálogo.</div>';
        return;
    }
    let currentFilters = { search: '', category: '', stock: '' };
    const update = (filters) => {
        currentFilters = { ...currentFilters, ...filters };
        renderCatalog(products, user, currentFilters);
    };
    await renderCatalogFilters(products, user, update);
    renderCatalog(products, user, currentFilters);
}

function showProductDetailsModal(prod, vendedor) {
    // Monta HTML do modal
    const img = prod.image ? prod.image : 'https://cdn.jsdelivr.net/gh/feathericons/feather@4.28.0/icons/image.svg';
    const stock = prod.stock && vendedor && prod.stock[vendedor] !== undefined ? prod.stock[vendedor] : 0;
    let stockText = '';
    if (stock === 0) {
        stockText = 'Sem estoque';
    } else if (stock <= 5) {
        stockText = `Estoque baixo (${stock} unidade${stock === 1 ? '' : 's'})`;
    } else {
        stockText = `Com estoque (${stock} unidade${stock === 1 ? '' : 's'})`;
    }
    const modal = document.createElement('div');
    modal.className = 'modal-bg';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.18)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `
        <div id="productDetailsContent" style="background:#fff;border:2.5px solid #00b894;box-shadow:0 8px 32px rgba(0,0,0,0.12);border-radius:18px;padding:0;max-width:98vw;width:100%;max-width:420px;min-width:0;color:#1e293b;position:relative;display:flex;flex-direction:column;">
            <div style="padding:28px 20px 0 20px;overflow-y:auto;max-height:70vh;flex:1 1 auto;">
                <img src="${img}" alt="img" style="display:block;margin:0 auto 18px auto;max-width:120px;max-height:120px;border-radius:10px;border:1.5px solid #d1fae5;object-fit:cover;">
                <h3 style="text-align:center;margin-bottom:8px;font-weight:700;color:#1e293b;font-size:1.3rem;">${prod.name}</h3>
                <div style="color:#64748b;font-size:13px;text-align:center;margin-bottom:8px;">Código: ${prod.code}</div>
                <div class="catalog-category" style="margin:0 auto 10px auto;max-width:fit-content;">${prod.category}</div>
                <div style="color:#00b894;font-weight:600;text-align:center;margin-bottom:10px;">R$ ${prod.price.toFixed(2)}</div>
                <div class="${stock <= 5 ? 'catalog-stock low' : 'catalog-stock'}" style="text-align:center;margin-bottom:10px;">${stockText}</div>
                <div style="margin-bottom:10px;"><b>Descrição:</b><br>${prod.description || '<span style=\'color:#64748b\'>Não informada</span>'}</div>
                <div style="margin-bottom:10px;"><b>Benefícios:</b><br>${(prod.benefits && prod.benefits.length) ? prod.benefits.join(', ') : '<span style=\'color:#64748b\'>Não informados</span>'}</div>
                <div style="margin-bottom:10px;"><b>Indicações:</b><br>${(prod.indications && prod.indications.length) ? prod.indications.join(', ') : '<span style=\'color:#64748b\'>Não informadas</span>'}</div>
                <div style="margin-bottom:10px;"><b>Contraindicações:</b><br>${(prod.contraindications && prod.contraindications.length) ? prod.contraindications.join(', ') : '<span style=\'color:#64748b\'>Não informadas</span>'}</div>
                <div style="margin-bottom:10px;"><b>Dosagem:</b><br>${prod.dosage || '<span style=\'color:#64748b\'>Não informada</span>'}</div>
            </div>
            <button class="btn btn-secondary btn-sm" style="margin:18px auto 18px auto;display:block;max-width:180px;" id="closeProductModal">Fechar</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeProductModal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    // Responsividade extra para mobile
    const mq = window.matchMedia('(max-width: 600px)');
    const content = document.getElementById('productDetailsContent');
    if (mq.matches && content) {
        content.style.maxWidth = '100vw';
        content.style.width = '100vw';
        content.style.borderRadius = '10px';
        content.style.padding = '0';
        content.style.minHeight = '0';
        content.style.maxHeight = '98vh';
        content.style.overflowY = 'auto';
    }
}

async function gerarComprovantePDF(venda) {
    if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.body.appendChild(script);
        await new Promise(r => { script.onload = r; });
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // Logo centralizada e proporcional
    const logoUrl = 'images/logo_smartozen.png';
    let imgData = null;
    try {
        const img = await fetch(logoUrl).then(r => r.blob());
        imgData = await new Promise(res => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.readAsDataURL(img);
        });
    } catch (e) {}
    if (imgData) {
        // Calcular posição centralizada e tamanho proporcional
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxW = 60, maxH = 30;
        let imgW = maxW, imgH = maxH;
        // Tentar obter proporção real da imagem
        let tempImg = new window.Image();
        tempImg.src = imgData;
        await new Promise(r => { tempImg.onload = r; });
        const ratio = tempImg.width / tempImg.height;
        if (imgW / ratio > maxH) {
            imgH = maxH;
            imgW = maxH * ratio;
        } else {
            imgW = maxW;
            imgH = maxW / ratio;
        }
        const x = (pageWidth - imgW) / 2;
        doc.addImage(imgData, 'PNG', x, 8, imgW, imgH);
        doc.setFontSize(15);
        doc.text('Comprovante de Venda', pageWidth / 2, 8 + imgH + 8, { align: 'center' });
        let y = 8 + imgH + 16;
        doc.setFontSize(11);
        doc.text(`Data/Hora: ${new Date(venda.datahora).toLocaleString('pt-BR')}`, 10, y); y += 7;
        doc.text(`Cliente: ${venda.cliente?.name || '-'}`, 10, y); y += 7;
        if (venda.cliente?.whatsapp) { doc.text(`WhatsApp: ${venda.cliente.whatsapp}`, 10, y); y += 7; }
        if (venda.cliente?.email) { doc.text(`E-mail: ${venda.cliente.email}`, 10, y); y += 7; }
        doc.text(`Vendedor: ${venda.vendedor || '-'}`, 10, y); y += 10;
        doc.text('Produtos:', 10, y); y += 7;
        venda.produtos.forEach(p => {
            doc.text(`- ${p.name} x${p.qtd} (R$ ${(p.price * p.qtd).toFixed(2)})`, 12, y); y += 7;
            if (y > 270) { doc.addPage(); y = 14; }
        });
        y += 2;
        doc.text(`Desconto: R$ ${(venda.desconto || 0).toFixed(2)}`, 10, y); y += 7;
        doc.text(`Total: R$ ${(venda.total || 0).toFixed(2)}`, 10, y); y += 7;
        doc.text(`Pagamento: ${venda.pagamento || '-'}`, 10, y); y += 7;
        if (venda.valor_recebido) doc.text(`Valor Recebido: R$ ${(venda.valor_recebido).toFixed(2)}`, 10, y);
    } else {
        doc.setFontSize(15);
        doc.text('Comprovante de Venda', 10, 18);
        doc.setFontSize(11);
        let y = 30;
        doc.text(`Data/Hora: ${new Date(venda.datahora).toLocaleString('pt-BR')}`, 10, y); y += 7;
        doc.text(`Cliente: ${venda.cliente?.name || '-'}`, 10, y); y += 7;
        if (venda.cliente?.whatsapp) { doc.text(`WhatsApp: ${venda.cliente.whatsapp}`, 10, y); y += 7; }
        if (venda.cliente?.email) { doc.text(`E-mail: ${venda.cliente.email}`, 10, y); y += 7; }
        doc.text(`Vendedor: ${venda.vendedor || '-'}`, 10, y); y += 10;
        doc.text('Produtos:', 10, y); y += 7;
        venda.produtos.forEach(p => {
            doc.text(`- ${p.name} x${p.qtd} (R$ ${(p.price * p.qtd).toFixed(2)})`, 12, y); y += 7;
            if (y > 270) { doc.addPage(); y = 14; }
        });
        y += 2;
        doc.text(`Desconto: R$ ${(venda.desconto || 0).toFixed(2)}`, 10, y); y += 7;
        doc.text(`Total: R$ ${(venda.total || 0).toFixed(2)}`, 10, y); y += 7;
        doc.text(`Pagamento: ${venda.pagamento || '-'}`, 10, y); y += 7;
        if (venda.valor_recebido) doc.text(`Valor Recebido: R$ ${(venda.valor_recebido).toFixed(2)}`, 10, y);
    }
    doc.save('comprovante_venda.pdf');
    return doc;
}

function showComprovanteModal(venda) {
    let modal = document.getElementById('comprovanteModalBg');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'comprovanteModalBg';
    modal.className = 'modal-bg';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.18)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `
        <div style="background:#fff;border:2.5px solid #00b894;box-shadow:0 8px 32px rgba(0,0,0,0.12);border-radius:18px;padding:0;max-width:98vw;width:100%;max-width:420px;min-width:0;color:#1e293b;position:relative;display:flex;flex-direction:column;">
            <div style="padding:18px 20px 0 20px;overflow-y:auto;max-height:80vh;flex:1 1 auto;display:flex;flex-direction:column;align-items:center;">
                <img src="images/logo_smartozen.png" alt="Logo" style="max-width:120px;max-height:60px;margin-bottom:10px;display:block;">
                <h3 style="text-align:center;margin-bottom:18px;font-weight:700;color:#1e293b;font-size:1.3rem;">Comprovante de Venda</h3>
                <div style="margin-bottom:10px;text-align:center;"><b>Cliente:</b> ${venda.cliente?.name || '-'}<br><b>WhatsApp:</b> ${venda.cliente?.whatsapp || '-'}<br><b>E-mail:</b> ${venda.cliente?.email || '-'}</div>
                <div style="margin-bottom:10px;text-align:center;"><b>Vendedor:</b> ${venda.vendedor || '-'}</div>
                <div style="margin-bottom:10px;text-align:center;"><b>Produtos:</b><br>${venda.produtos.map(p => `${p.name} x${p.qtd} (R$ ${(p.price * p.qtd).toFixed(2)})`).join('<br>')}</div>
                <div style="margin-bottom:10px;text-align:center;"><b>Desconto:</b> R$ ${(venda.desconto || 0).toFixed(2)}<br><b>Total:</b> R$ ${(venda.total || 0).toFixed(2)}<br><b>Pagamento:</b> ${venda.pagamento || '-'}<br>${venda.valor_recebido ? `<b>Valor Recebido:</b> R$ ${(venda.valor_recebido).toFixed(2)}` : ''}</div>
                <div style="margin-bottom:10px;text-align:center;"><b>Data/Hora:</b> ${new Date(venda.datahora).toLocaleString('pt-BR')}</div>
                <button class="btn btn-primary btn-block" id="btnDownloadComprovante" style="margin-top:10px;width:100%;font-size:1.1em;">Baixar PDF</button>
                <button class="btn btn-secondary btn-block" id="btnSendWhatsapp" style="margin-top:8px;width:100%;">Enviar por WhatsApp</button>
                <button class="btn btn-sm btn-danger" id="btnCloseComprovante" style="margin-top:8px;width:100%;">Fechar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btnCloseComprovante').onclick = () => modal.remove();
    document.getElementById('btnDownloadComprovante').onclick = async () => { await gerarComprovantePDF(venda); };
    document.getElementById('btnSendWhatsapp').onclick = async () => {
        const nome = encodeURIComponent(venda.cliente?.name || '');
        const total = (venda.total || 0).toFixed(2);
        const vendedor = encodeURIComponent(venda.vendedor || '');
        const produtos = encodeURIComponent(venda.produtos.map(p => `${p.name} x${p.qtd}`).join(', '));
        const msg = `Olá ${nome}, sua compra foi registrada com sucesso!%0AProdutos: ${produtos}%0ATotal: R$ ${total}%0AVendedor: ${vendedor}%0AObrigado pela preferência!`;
        let whatsapp = (venda.cliente?.whatsapp || '').replace(/\D/g, '');
        if (whatsapp.length === 11) whatsapp = '55' + whatsapp;
        window.open(`https://wa.me/${whatsapp}?text=${msg}`, '_blank');
    };
}

document.addEventListener('DOMContentLoaded', initCatalog); 