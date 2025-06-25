// admin_products.js

// Verifica se o usuário logado é admin
function checkAdminAccess() {
    const user = JSON.parse(localStorage.getItem('ozonUser'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
    }
}

// Evento para botão de voltar
function setupBackButton() {
    document.getElementById('backToSystemBtn').onclick = function() {
        window.location.href = 'index.html';
    };
}

// Evento para logout
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    const user = JSON.parse(localStorage.getItem('ozonUser'));
    if (user) {
        logoutBtn.style.display = 'inline-block';
        logoutBtn.onclick = function() {
            localStorage.removeItem('ozonUser');
            window.location.href = 'index.html';
        };
    }
}

// Função para buscar categorias do backend
async function fetchCategories() {
    const res = await fetch('backend/api/categories_crud.php');
    return await res.json();
}

// Função para buscar produtos do backend
async function fetchProducts() {
    const res = await fetch('backend/api/products_crud.php');
    return await res.json();
}

// Renderiza categorias em um select e botões de editar/remover
function renderCategoriesSelect(categories, onChange) {
    let html = '<label for="categorySelect"><b>Categoria:</b></label> ';
    html += '<select id="categorySelect" class="select-style">';
    html += '<option value="">Selecione...</option>';
    categories.forEach(cat => {
        html += `<option value="${cat}">${cat}</option>`;
    });
    html += '</select>';
    html += '<button class="btn btn-secondary btn-sm" id="editCategoryBtn" style="margin-left:8px;">Editar Categoria</button>';
    html += '<button class="btn btn-danger btn-sm" id="deleteCategoryBtn" style="margin-left:4px;">Remover Categoria</button>';
    document.getElementById('adminProductsContent').innerHTML = html + '<div id="productsList"></div>';
    document.getElementById('categorySelect').onchange = onChange;
    document.getElementById('editCategoryBtn').onclick = () => editCategory(categories);
    document.getElementById('deleteCategoryBtn').onclick = () => deleteCategory(categories);
}

// Renderiza produtos da categoria selecionada
function renderProductsTable(products, category) {
    let html = `<button class='btn btn-primary' id='addProductBtn' style='margin-bottom:12px;'>+ Novo Produto</button>`;
    const filtered = Object.values(products).filter(p => p.category === category);
    if (filtered.length === 0) {
        html += '<p style="text-align:center;">Nenhum produto nesta categoria.</p>';
        document.getElementById('productsList').innerHTML = html;
        document.getElementById('addProductBtn').onclick = () => showProductForm(null, category);
        return;
    }
    html += '<table class="admin-table"><thead><tr>';
    html += '<th>Imagem</th><th>Nome</th><th>Código</th><th>Preço</th><th>Estoque</th><th>Ativo</th><th>Ações</th>';
    html += '</tr></thead><tbody>';
    filtered.forEach(prod => {
        const img = prod.image ? prod.image : 'https://cdn.jsdelivr.net/gh/feathericons/feather@4.28.0/icons/image.svg';
        html += `<tr><td style='text-align:center;'><img src='${img}' alt='img' style='width:48px;height:48px;object-fit:cover;border-radius:8px;border:1.5px solid #d1fae5;background:#f0fdfa;'></td><td>${prod.name}</td><td>${prod.code}</td><td>R$ ${prod.price.toFixed(2)}</td><td>${prod.stock}</td><td>${prod.active ? 'Sim' : 'Não'}</td><td><button class='btn btn-secondary btn-sm' data-edit='${prod.name}'>Editar</button> <button class='btn btn-danger btn-sm' data-del='${prod.name}'>Excluir</button></td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('productsList').innerHTML = html;
    document.getElementById('addProductBtn').onclick = () => showProductForm(null, category);
    // Adicionar eventos de edição
    document.querySelectorAll('button[data-edit]').forEach(btn => {
        btn.onclick = () => {
            const prod = Object.values(products).find(p => p.name === btn.getAttribute('data-edit'));
            showProductForm(prod, category, true);
        };
    });
    // Adicionar eventos de exclusão
    document.querySelectorAll('button[data-del]').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('Tem certeza que deseja excluir este produto?')) {
                const res = await fetch('backend/api/products_crud.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: btn.getAttribute('data-del') })
                });
                if (res.ok) {
                    const products = await fetchProducts();
                    renderProductsTable(products, category);
                } else {
                    alert('Erro ao excluir produto!');
                }
            }
        };
    });
}

// Função para exibir formulário de novo produto
async function showProductForm(product, category, isEdit) {
    const isNew = !product;
    const prod = product || {
        name: '',
        code: '',
        category: category,
        price: '',
        description: '',
        benefits: [],
        indications: [],
        contraindications: [],
        dosage: '',
        stock: '',
        active: true,
        image: ''
    };
    // Buscar categorias reais do backend
    const categories = await fetchCategories();
    let html = `<div class='modal-bg' id='modalProductBg' style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.18);z-index:9999;display:flex;align-items:center;justify-content:center;'>`;
    html += `<div class='modal-card' style='background:#fff;border:2.5px solid #00b894;box-shadow:0 8px 32px rgba(0,0,0,0.12);border-radius:18px;padding:0;max-width:98vw;width:100%;max-width:420px;min-width:0;color:#1e293b;position:relative;display:flex;flex-direction:column;'>`;
    html += `<div style='padding:28px 20px 0 20px;overflow-y:auto;max-height:70vh;flex:1 1 auto;'>`;
    html += `<h3 style='text-align:center;margin-bottom:18px;font-weight:700;color:#1e293b;font-size:1.3rem;'>${isNew ? 'Novo Produto' : 'Editar Produto'}</h3>`;
    // Imagem e upload
    html += `<div style='margin-bottom:16px;text-align:center;'>`;
    html += `<img id='prodImagePreview' src='${prod.image ? prod.image : ''}' alt='Pré-visualização' style='max-width:120px;max-height:120px;border-radius:10px;border:1.5px solid #d1fae5;object-fit:cover;${prod.image ? '' : 'display:none;'}'><br>`;
    html += `<input type='file' id='prodImageInput' accept='image/*' style='margin-top:8px;'>`;
    html += `</div>`;
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Nome:</label><input type='text' id='prodName' value='${prod.name}' ${isEdit ? 'readonly' : ''} style='width:100%;margin-top:4px;margin-bottom:8px;padding:8px 10px;border-radius:7px;border:1.5px solid #d1fae5;background:#f9fafb;'></div>`;
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Código:</label><input type='text' id='prodCode' value='${prod.code}' style='width:100%;margin-top:4px;margin-bottom:8px;padding:8px 10px;border-radius:7px;border:1.5px solid #d1fae5;background:#f9fafb;'></div>`;
    // Categoria como select
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Categoria:</label><select id='prodCategory' style='width:100%;margin-top:4px;margin-bottom:8px;padding:8px 10px;border-radius:7px;border:1.5px solid #d1fae5;background:#f0fdfa;'>`;
    categories.forEach(cat => {
        html += `<option value="${cat}"${prod.category === cat ? ' selected' : ''}>${cat}</option>`;
    });
    html += `</select></div>`;
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Preço (R$):</label><input type='number' id='prodPrice' value='${prod.price}' step='0.01' style='width:100%;margin-top:4px;margin-bottom:8px;padding:8px 10px;border-radius:7px;border:1.5px solid #d1fae5;background:#f9fafb;'></div>`;
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Estoque:</label><input type='number' id='prodStock' value='${prod.stock}' style='width:100%;margin-top:4px;margin-bottom:8px;padding:8px 10px;border-radius:7px;border:1.5px solid #d1fae5;background:#f9fafb;'></div>`;
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Ativo:</label> <input type='checkbox' id='prodActive' ${prod.active ? 'checked' : ''} style='margin-left:8px;vertical-align:middle;'></div>`;
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Descrição:</label><textarea id='prodDesc' style='width:100%;margin-top:4px;margin-bottom:8px;padding:8px 10px;border-radius:7px;border:1.5px solid #d1fae5;background:#f9fafb;min-height:48px;'>${prod.description}</textarea></div>`;
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Benefícios (1 por linha):</label><textarea id='prodBenefits' style='width:100%;margin-top:4px;margin-bottom:8px;padding:8px 10px;border-radius:7px;border:1.5px solid #d1fae5;background:#f9fafb;min-height:38px;'>${prod.benefits.join('\n')}</textarea></div>`;
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Indicações (1 por linha):</label><textarea id='prodIndications' style='width:100%;margin-top:4px;margin-bottom:8px;padding:8px 10px;border-radius:7px;border:1.5px solid #d1fae5;background:#f9fafb;min-height:38px;'>${prod.indications.join('\n')}</textarea></div>`;
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Contraindicações (1 por linha):</label><textarea id='prodContra' style='width:100%;margin-top:4px;margin-bottom:8px;padding:8px 10px;border-radius:7px;border:1.5px solid #d1fae5;background:#f9fafb;min-height:38px;'>${prod.contraindications.join('\n')}</textarea></div>`;
    html += `<div style='margin-bottom:12px;'><label style='font-weight:500;'>Dosagem:</label><input type='text' id='prodDosage' value='${prod.dosage}' style='width:100%;margin-top:4px;margin-bottom:8px;padding:8px 10px;border-radius:7px;border:1.5px solid #d1fae5;background:#f9fafb;'></div>`;
    html += `</div>`;
    html += `<div style='text-align:center;padding:18px 20px 18px 20px;background:#f0fdfa;border-top:1.5px solid #00b894;flex-shrink:0;'>`;
    html += `<button class='btn btn-primary' id='saveProductBtn' style='margin-right:10px;min-width:110px;'>Salvar</button>`;
    html += `<button class='btn btn-secondary' id='cancelProductBtn' style='min-width:110px;'>Cancelar</button>`;
    html += `</div>`;
    html += `<button id='closeModalBtn' style='position:absolute;top:12px;right:16px;background:none;border:none;font-size:1.5rem;cursor:pointer;color:#00b894;' title='Fechar'>&times;</button>`;
    html += `</div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    // Preview e upload da imagem
    const imageInput = document.getElementById('prodImageInput');
    const imagePreview = document.getElementById('prodImagePreview');
    let uploadedImageUrl = prod.image || '';
    imageInput.onchange = async function() {
        const file = this.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        imagePreview.style.display = 'none';
        imagePreview.src = '';
        imagePreview.alt = 'Enviando...';
        const res = await fetch('backend/api/products_upload.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            uploadedImageUrl = data.url;
            imagePreview.src = data.url;
            imagePreview.style.display = 'inline-block';
            imagePreview.alt = 'Pré-visualização';
        } else {
            alert(data.error || 'Erro ao enviar imagem.');
            uploadedImageUrl = '';
        }
    };
    // Scroll até o botão salvar
    setTimeout(() => {
        const btn = document.getElementById('saveProductBtn');
        if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    document.getElementById('cancelProductBtn').onclick = () => {
        document.getElementById('modalProductBg').remove();
    };
    document.getElementById('closeModalBtn').onclick = () => {
        document.getElementById('modalProductBg').remove();
    };
    document.getElementById('saveProductBtn').onclick = async () => {
        const newProd = {
            name: document.getElementById('prodName').value.trim(),
            code: document.getElementById('prodCode').value.trim(),
            category: document.getElementById('prodCategory').value.trim(),
            price: parseFloat(document.getElementById('prodPrice').value),
            description: document.getElementById('prodDesc').value.trim(),
            benefits: document.getElementById('prodBenefits').value.split('\n').map(s => s.trim()).filter(Boolean),
            indications: document.getElementById('prodIndications').value.split('\n').map(s => s.trim()).filter(Boolean),
            contraindications: document.getElementById('prodContra').value.split('\n').map(s => s.trim()).filter(Boolean),
            dosage: document.getElementById('prodDosage').value.trim(),
            stock: parseInt(document.getElementById('prodStock').value),
            active: document.getElementById('prodActive').checked,
            image: uploadedImageUrl
        };
        if (!newProd.name) {
            alert('Nome do produto é obrigatório!');
            return;
        }
        // Salvar via endpoint
        const res = await fetch('backend/api/products_crud.php', {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProd)
        });
        if (res.ok) {
            document.getElementById('modalProductBg').remove();
            // Recarregar produtos
            const products = await fetchProducts();
            renderProductsTable(products, newProd.category);
        } else {
            alert('Erro ao salvar produto!');
        }
    };
}

// Função para editar categoria
function editCategory(categories) {
    const select = document.getElementById('categorySelect');
    const oldCategory = select.value;
    if (!oldCategory) {
        alert('Selecione uma categoria para editar.');
        return;
    }
    const newCategory = prompt('Novo nome da categoria:', oldCategory);
    if (newCategory && newCategory !== oldCategory) {
        fetch('backend/api/categories_crud.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldCategory, newCategory })
        }).then(async res => {
            if (res.ok) {
                const [cats, products] = await Promise.all([fetchCategories(), fetchProducts()]);
                renderCategoriesSelect(cats, function() {
                    const cat = this.value;
                    if (cat) renderProductsTable(products, cat);
                    else document.getElementById('productsList').innerHTML = '';
                });
            } else {
                alert('Erro ao editar categoria!');
            }
        });
    }
}

// Função para remover categoria
function deleteCategory(categories) {
    const select = document.getElementById('categorySelect');
    const category = select.value;
    if (!category) {
        alert('Selecione uma categoria para remover.');
        return;
    }
    if (confirm('Remover esta categoria irá excluir TODOS os produtos nela. Deseja continuar?')) {
        fetch('backend/api/categories_crud.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category })
        }).then(async res => {
            if (res.ok) {
                const [cats, products] = await Promise.all([fetchCategories(), fetchProducts()]);
                renderCategoriesSelect(cats, function() {
                    const cat = this.value;
                    if (cat) renderProductsTable(products, cat);
                    else document.getElementById('productsList').innerHTML = '';
                });
            } else {
                alert('Erro ao remover categoria!');
            }
        });
    }
}

// Inicialização da página (atualizada)
async function initAdminProductsPage() {
    checkAdminAccess();
    setupBackButton();
    setupLogoutButton();
    document.getElementById('adminProductsContent').innerHTML = '<p style="text-align:center;">Carregando categorias e produtos...</p>';
    const [categories, products] = await Promise.all([fetchCategories(), fetchProducts()]);
    renderCategoriesSelect(categories, function() {
        const cat = this.value;
        if (cat) renderProductsTable(products, cat);
        else document.getElementById('productsList').innerHTML = '';
    });
}

document.addEventListener('DOMContentLoaded', initAdminProductsPage); 