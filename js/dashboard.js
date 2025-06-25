// js/dashboard.js

async function fetchSales() {
    const res = await fetch('backend/api/sales_crud.php');
    return await res.json();
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
}

function renderDashCards(resumo) {
    const cards = [
        { label: 'Total Vendido', value: 'R$ ' + resumo.totalVendido.toFixed(2) },
        { label: 'Nº de Vendas', value: resumo.numVendas },
        { label: 'Ticket Médio', value: 'R$ ' + resumo.ticketMedio.toFixed(2) },
        { label: 'Produtos Vendidos', value: resumo.totalProdutos },
    ];
    const dash = document.getElementById('dashCards');
    dash.innerHTML = cards.map(c => `<div class="dash-card"><div class="label">${c.label}</div><div class="value">${c.value}</div></div>`).join('');
}

function renderDashFilters(sales, onFilter) {
    const filtersDiv = document.getElementById('dashFilters');
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
    const vendedores = [...new Set(sales.map(s => s.vendedor).filter(Boolean))];
    const vendedorSelect = document.createElement('select');
    vendedorSelect.className = 'btn btn-sm';
    vendedorSelect.innerHTML = '<option value="">Todos os vendedores</option>' + vendedores.map(v => `<option value="${v}">${v}</option>`).join('');
    [dateStart, dateEnd, vendedorSelect].forEach(el => el.onchange = () => {
        onFilter({
            dateStart: dateStart.value,
            dateEnd: dateEnd.value,
            vendedor: vendedorSelect.value
        });
    });
    filtersDiv.appendChild(dateStart);
    filtersDiv.appendChild(dateEnd);
    filtersDiv.appendChild(vendedorSelect);
}

function filterSales(sales, filters) {
    return sales.filter(sale => {
        let ok = true;
        if (filters.dateStart) ok = ok && new Date(sale.datahora) >= new Date(filters.dateStart);
        if (filters.dateEnd) ok = ok && new Date(sale.datahora) <= new Date(filters.dateEnd + 'T23:59:59');
        if (filters.vendedor) ok = ok && sale.vendedor === filters.vendedor;
        return ok;
    });
}

function getResumo(sales) {
    const totalVendido = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const numVendas = sales.length;
    const totalProdutos = sales.reduce((sum, s) => sum + s.produtos.reduce((a, p) => a + p.qtd, 0), 0);
    const ticketMedio = numVendas ? totalVendido / numVendas : 0;
    return { totalVendido, numVendas, ticketMedio, totalProdutos };
}

function getMaisVendidos(sales) {
    const map = {};
    sales.forEach(s => s.produtos.forEach(p => {
        if (!map[p.name]) map[p.name] = { qtd: 0, valor: 0 };
        map[p.name].qtd += p.qtd;
        map[p.name].valor += p.qtd * p.price;
    }));
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qtd - a.qtd).slice(0, 10);
}

function getPagamentos(sales) {
    const map = {};
    sales.forEach(s => {
        const key = s.pagamento || 'Outro';
        map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([k, v]) => ({ metodo: k, qtd: v }));
}

function getVendasPorDia(sales) {
    const map = {};
    sales.forEach(s => {
        const d = formatDate(s.datahora);
        map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([dia, qtd]) => ({ dia, qtd })).sort((a, b) => new Date(a.dia.split('/').reverse().join('-')) - new Date(b.dia.split('/').reverse().join('-')));
}

let chartProdutos, chartPagamentos, chartVendasDia;

function renderCharts(sales) {
    // Produtos mais vendidos
    const maisVendidos = getMaisVendidos(sales);
    const ctx1 = document.getElementById('graphProdutos').getContext('2d');
    if (chartProdutos) chartProdutos.destroy();
    chartProdutos = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: maisVendidos.map(p => p.name),
            datasets: [{ label: 'Qtd. Vendida', data: maisVendidos.map(p => p.qtd), backgroundColor: '#00b894' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#1e293b' } }, y: { beginAtZero: true, ticks: { color: '#1e293b' } } } }
    });
    // Métodos de pagamento
    const pagamentos = getPagamentos(sales);
    const ctx2 = document.getElementById('graphPagamentos').getContext('2d');
    if (chartPagamentos) chartPagamentos.destroy();
    chartPagamentos = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: pagamentos.map(p => p.metodo),
            datasets: [{ data: pagamentos.map(p => p.qtd), backgroundColor: ['#00b894','#00d4aa','#f59e0b','#dc2626','#6366f1','#64748b'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#1e293b' } } } }
    });
    // Vendas por dia
    const vendasDia = getVendasPorDia(sales);
    const ctx3 = document.getElementById('graphVendasDia').getContext('2d');
    if (chartVendasDia) chartVendasDia.destroy();
    chartVendasDia = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: vendasDia.map(v => v.dia),
            datasets: [{ label: 'Vendas', data: vendasDia.map(v => v.qtd), borderColor: '#00b894', backgroundColor: '#00b89422', fill: true }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#1e293b' } }, y: { beginAtZero: true, ticks: { color: '#1e293b' } } } }
    });
}

async function initDashboard() {
    const sales = await fetchSales();
    let currentFilters = { dateStart: '', dateEnd: '', vendedor: '' };
    const update = (filters) => {
        currentFilters = { ...currentFilters, ...filters };
        const filtered = filterSales(sales, currentFilters);
        renderDashCards(getResumo(filtered));
        renderCharts(filtered);
    };
    renderDashFilters(sales, update);
    const filtered = filterSales(sales, currentFilters);
    renderDashCards(getResumo(filtered));
    renderCharts(filtered);
}

document.addEventListener('DOMContentLoaded', initDashboard); 