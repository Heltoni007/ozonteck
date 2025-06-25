// js/sales_report.js

async function fetchSales() {
    const user = JSON.parse(sessionStorage.getItem('ozonteckUserSession') || '{}');
    const params = user && user.role && user.username ? `?requester=${encodeURIComponent(user.username)}&role=${encodeURIComponent(user.role)}` : '';
    const res = await fetch('backend/api/sales_crud.php' + params);
    return await res.json();
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR');
}

function renderSalesTable(sales) {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';
    if (!sales.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748b;">Nenhuma venda encontrada.</td></tr>';
        return;
    }
    sales.forEach(sale => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(sale.datahora)}</td>
            <td>${sale.cliente?.name || '-'}</td>
            <td>${sale.produtos.map(p => `${p.name} x${p.qtd}`).join('<br>')}</td>
            <td>R$ ${Number(sale.total).toFixed(2)}</td>
            <td>R$ ${Number(sale.desconto || 0).toFixed(2)}</td>
            <td>${sale.pagamento || '-'}</td>
            <td>${sale.vendedor || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function unique(arr, key) {
    return [...new Map(arr.map(x => [x[key], x])).values()];
}

function renderSalesFilters(sales, onFilter) {
    const filtersDiv = document.getElementById('salesFilters');
    filtersDiv.innerHTML = '';
    // Período
    const dateStart = document.createElement('input');
    dateStart.type = 'date';
    dateStart.className = 'btn btn-sm';
    dateStart.style.minWidth = '120px';
    const dateEnd = document.createElement('input');
    dateEnd.type = 'date';
    dateEnd.className = 'btn btn-sm';
    dateEnd.style.minWidth = '120px';
    // Vendedor
    const vendedores = unique(sales.filter(s => s.vendedor), 'vendedor').map(s => s.vendedor).filter(Boolean);
    const vendedorSelect = document.createElement('select');
    vendedorSelect.className = 'btn btn-sm';
    vendedorSelect.innerHTML = '<option value="">Todos os vendedores</option>' + vendedores.map(v => `<option value="${v}">${v}</option>`).join('');
    // Cliente
    const clientes = unique(sales.filter(s => s.cliente?.name), s => s.cliente?.name).map(s => s.cliente?.name).filter(Boolean);
    const clienteSelect = document.createElement('select');
    clienteSelect.className = 'btn btn-sm';
    clienteSelect.innerHTML = '<option value="">Todos os clientes</option>' + clientes.map(c => `<option value="${c}">${c}</option>`).join('');
    // Pagamento
    const pagamentos = unique(sales.filter(s => s.pagamento), 'pagamento').map(s => s.pagamento).filter(Boolean);
    const pagamentoSelect = document.createElement('select');
    pagamentoSelect.className = 'btn btn-sm';
    pagamentoSelect.innerHTML = '<option value="">Todos os pagamentos</option>' + pagamentos.map(p => `<option value="${p}">${p}</option>`).join('');
    // Eventos
    [dateStart, dateEnd, vendedorSelect, clienteSelect, pagamentoSelect].forEach(el => el.onchange = () => {
        onFilter({
            dateStart: dateStart.value,
            dateEnd: dateEnd.value,
            vendedor: vendedorSelect.value,
            cliente: clienteSelect.value,
            pagamento: pagamentoSelect.value
        });
    });
    filtersDiv.appendChild(dateStart);
    filtersDiv.appendChild(dateEnd);
    filtersDiv.appendChild(vendedorSelect);
    filtersDiv.appendChild(clienteSelect);
    filtersDiv.appendChild(pagamentoSelect);
}

function filterSales(sales, filters) {
    return sales.filter(sale => {
        let ok = true;
        if (filters.dateStart) ok = ok && new Date(sale.datahora) >= new Date(filters.dateStart);
        if (filters.dateEnd) ok = ok && new Date(sale.datahora) <= new Date(filters.dateEnd + 'T23:59:59');
        if (filters.vendedor) ok = ok && sale.vendedor === filters.vendedor;
        if (filters.cliente) ok = ok && sale.cliente?.name === filters.cliente;
        if (filters.pagamento) ok = ok && sale.pagamento === filters.pagamento;
        return ok;
    });
}

function exportSalesCSV(sales) {
    const header = ['Data/Hora','Cliente','Produtos','Total','Desconto','Pagamento','Vendedor'];
    const rows = sales.map(sale => [
        formatDate(sale.datahora),
        sale.cliente?.name || '-',
        sale.produtos.map(p => `${p.name} x${p.qtd}`).join(' | '),
        'R$ ' + Number(sale.total).toFixed(2),
        'R$ ' + Number(sale.desconto || 0).toFixed(2),
        sale.pagamento || '-',
        sale.vendedor || '-'
    ]);
    let csv = header.join(';') + '\n';
    rows.forEach(r => { csv += r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(';')+'\n'; });
    const blob = new Blob([csv], {type: 'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vendas_ozonteck.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function exportSalesTXT(sales) {
    let txt = '';
    sales.forEach((sale, i) => {
        txt += `Venda #${i+1}\n`;
        txt += `Data/Hora: ${formatDate(sale.datahora)}\nCliente: ${sale.cliente?.name || '-'}\nProdutos: ${sale.produtos.map(p => `${p.name} x${p.qtd}`).join(', ')}\nTotal: R$ ${Number(sale.total).toFixed(2)}\nDesconto: R$ ${Number(sale.desconto || 0).toFixed(2)}\nPagamento: ${sale.pagamento || '-'}\nVendedor: ${sale.vendedor || '-'}\n-----------------------------\n`;
    });
    const blob = new Blob([txt], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vendas_ozonteck.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// PDF export simples usando jsPDF
async function exportSalesPDF(sales) {
    if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.body.appendChild(script);
        await new Promise(r => { script.onload = r; });
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(13);
    doc.text('Relatório de Vendas - Ozonteck', 10, 14);
    let y = 22;
    sales.forEach((sale, i) => {
        doc.text(`Venda #${i+1}`, 10, y);
        y += 7;
        doc.text(`Data/Hora: ${formatDate(sale.datahora)}`, 10, y);
        y += 7;
        doc.text(`Cliente: ${sale.cliente?.name || '-'}`, 10, y);
        y += 7;
        doc.text(`Produtos: ${sale.produtos.map(p => `${p.name} x${p.qtd}`).join(', ')}`, 10, y);
        y += 7;
        doc.text(`Total: R$ ${Number(sale.total).toFixed(2)}`, 10, y);
        y += 7;
        doc.text(`Desconto: R$ ${Number(sale.desconto || 0).toFixed(2)}`, 10, y);
        y += 7;
        doc.text(`Pagamento: ${sale.pagamento || '-'}`, 10, y);
        y += 7;
        doc.text(`Vendedor: ${sale.vendedor || '-'}`, 10, y);
        y += 10;
        if (y > 270) { doc.addPage(); y = 14; }
    });
    doc.save('vendas_ozonteck.pdf');
}

async function initSalesReport() {
    const user = JSON.parse(sessionStorage.getItem('ozonteckUserSession') || '{}');
    // Botão de gestão para admin/gestor
    if (user && (user.role === 'admin' || user.role === 'gestor')) {
        let btn = document.getElementById('btnManageTeam');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'btnManageTeam';
            btn.className = 'btn btn-sm';
            btn.style = 'margin-bottom:10px;margin-right:10px;background:#00b894;color:#fff;';
            btn.innerText = 'Gerenciar Equipe';
            btn.onclick = () => window.location.href = 'admin_products.html'; // ou outra página de gestão
            document.body.prepend(btn);
        }
    }
    const sales = await fetchSales();
    let currentFilters = { dateStart: '', dateEnd: '', vendedor: '', cliente: '', pagamento: '' };
    const update = (filters) => {
        currentFilters = { ...currentFilters, ...filters };
        renderSalesTable(filterSales(sales, currentFilters));
    };
    renderSalesFilters(sales, update);
    renderSalesTable(filterSales(sales, currentFilters));
    document.getElementById('exportCSV').onclick = () => exportSalesCSV(filterSales(sales, currentFilters));
    document.getElementById('exportTXT').onclick = () => exportSalesTXT(filterSales(sales, currentFilters));
    document.getElementById('exportPDF').onclick = () => exportSalesPDF(filterSales(sales, currentFilters));
}

document.addEventListener('DOMContentLoaded', initSalesReport); 