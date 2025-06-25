// =================================================================
// VARIÁVEIS GLOBAIS DE DADOS (preenchidas via API)
// =================================================================
let clientPriorities = {};
let questions = [];
let productDatabase = {};
let productProtocols = {}; // Nova variável para protocolos

// =================================================================
// ESTADO E LÓGICA PRINCIPAL DA APLICAÇÃO
// =================================================================

let appState = {
    currentQuestion: 0,
    answers: [],
    currentUser: null,
    isLoggedIn: false,
    selectedPriorities: [],
    priorityAnalysis: {},
    showingPriorities: false,
    clientData: {}
};

// =================================================================
// FUNÇÕES DE ESTADO LOCAL
// =================================================================

function saveStateToLocalStorage() {
    const stateToSave = {
        currentQuestion: appState.currentQuestion,
        answers: appState.answers,
        selectedPriorities: appState.selectedPriorities,
        showingPriorities: appState.showingPriorities,
        clientData: appState.clientData,
        currentUser: appState.currentUser
    };
    localStorage.setItem('ozonteckAppState', JSON.stringify(stateToSave));
}

function loadStateFromLocalStorage() {
    const savedState = localStorage.getItem('ozonteckAppState');
    if (savedState) {
        const loadedState = JSON.parse(savedState);
        // Só carrega o estado se o usuário logado for o mesmo
        if (loadedState.currentUser && appState.currentUser.name === loadedState.currentUser.name) {
            // Garante que sempre começa com o questionário
            appState = { 
                ...appState, 
                currentQuestion: loadedState.currentQuestion || 0,
                answers: loadedState.answers || [],
                selectedPriorities: loadedState.selectedPriorities || [],
                showingPriorities: false, // Sempre começa com questionário
                clientData: loadedState.clientData || {},
                currentUser: loadedState.currentUser
            };
            return true;
        }
    }
    return false;
}

// =================================================================
// FUNÇÕES DO FLUXO DO CLIENTE
// =================================================================

function handleStartDiagnosis() {
    const clientName = document.getElementById('clientName').value.trim();
    const clientEmail = document.getElementById('clientEmail').value.trim();
    const clientWhatsapp = document.getElementById('clientWhatsapp').value.trim();
    const clientAgeRange = document.getElementById('clientAgeRange').value;

    if (!clientName || !clientEmail || !clientAgeRange || !clientWhatsapp) {
        showNotification('Por favor, preencha todos os dados do cliente.', 'error');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
        showNotification('Por favor, insira um e-mail válido.', 'error');
        return;
    }
    if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(clientWhatsapp)) {
        showNotification('Por favor, insira um WhatsApp válido.', 'error');
        return;
    }

    // Limpa o estado anterior para garantir que sempre começa com o questionário
    localStorage.removeItem('ozonteckAppState');

    appState.clientData = {
        name: clientName,
        email: clientEmail,
        whatsapp: clientWhatsapp,
        ageRange: clientAgeRange
    };

    hideAllSections();
    document.getElementById('ozonioHistory').classList.remove('hidden');
    document.getElementById('quizSection').classList.remove('hidden');
    startQuiz();
}

// =================================================================
// FUNÇÕES DO SISTEMA DE PRIORIDADES
// =================================================================

function showPrioritySelection() {
    const container = document.getElementById('questionsContainer');
    // Ordenar: sugeridas (em ordem), depois as demais
    const suggested = appState.selectedPriorities.map(p => clientPriorities[p.key]);
    const remaining = Object.values(clientPriorities).filter(
        p => !appState.selectedPriorities.find(sp => sp.id === p.id)
    );
    const allPriorities = [...suggested, ...remaining];
    // Cores para as 3 principais (borda vermelha, fundo branco), neutro para as demais
    const highlightColors = [
        'background: #fff; border: 2.5px solid #ef4444;',
        'background: #fff; border: 2.5px solid #ef4444;',
        'background: #fff; border: 2.5px solid #ef4444;'
    ];
    const neutralColor = 'background: #fff; border: 2px solid #d1d5db; color: #6b7280;';
    // Legenda
    const legendHTML = `
        <div style='margin-bottom:12px;'>
            <span style='display:inline-block;width:18px;height:18px;vertical-align:middle;${highlightColors[0]}margin-right:6px;'></span> <b>Prioridade Sugerida</b>
            <span style='display:inline-block;width:18px;height:18px;vertical-align:middle;${neutralColor}margin-left:18px;margin-right:6px;'></span> Menor importância
        </div>
    `;
    container.innerHTML = `
        <div class="question-card">
            <div class="question-title">🎯 Agora selecione suas PRINCIPAIS PRIORIDADES de saúde</div>
            <div class="question-subtitle">Selecione até 3 prioridades mais importantes para seu diagnóstico, em ordem de criticidade.</div>
            ${legendHTML}
            <div style="background: #f0fdfa; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h4 style="color: #b91c1c; margin-bottom: 15px;">🔥 Prioridades do seu diagnóstico:</h4>
                <div id="priorityOptions" class="priority-options" style="display: flex; flex-direction: column; gap: 18px;">
                    ${allPriorities.map((priority, idx) => {
                        const style = idx < 3 ? highlightColors[idx] : neutralColor;
                        return `
                        <div class="priority-option" data-priority="${priority.id}" style="${style} border-radius: 10px; padding: 18px; margin-bottom: 0; display: flex; align-items: center;">
                            <span class="priority-icon" style="font-size:2rem; margin-right: 18px;">${priority.icon}</span>
                            <div class="priority-content">
                                <div class="priority-title" style="font-weight:bold; font-size:1.2rem; color:${idx < 3 ? '#b91c1c' : '#6b7280'};">${priority.title}</div>
                                <div class="priority-description" style="color:${idx < 3 ? '#991b1b' : '#6b7280'};">${priority.description}</div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div style="background: #fff7ed; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h4 style="color: #f59e0b; margin-bottom: 15px;">🏆 Suas Prioridades Selecionadas:</h4>
                <div id="selectedPriorities" class="selected-priorities">
                </div>
            </div>
        </div>
    `;
    setupPrioritySelection();
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('finishBtn').style.display = 'inline-block';
    document.getElementById('finishBtn').disabled = appState.selectedPriorities.length === 0;
    updateSelectedPrioritiesDisplay();
}

function setupPrioritySelection() {
    const priorityOptions = document.querySelectorAll('.priority-option');
    
    priorityOptions.forEach(option => {
        option.addEventListener('click', () => handlePriorityClick(option));
    });
}

function handlePriorityClick(element) {
    const priorityId = parseInt(element.dataset.priority);
    
    if (appState.selectedPriorities.find(p => p.id === priorityId)) {
        showNotification('Prioridade já selecionada!', 'error');
        return;
    }
    
    if (appState.selectedPriorities.length >= 3) {
        showNotification('Máximo de 3 prioridades permitidas!', 'error');
        return;
    }
    
    element.classList.add('selected');

    // Busca direta pela prioridade usando o ID
    let priority = null;
    for (const key in clientPriorities) {
        if (clientPriorities[key].id === priorityId) {
            priority = clientPriorities[key];
            break;
        }
    }
    
    if (priority) {
        appState.selectedPriorities.push({
            ...priority,
            order: appState.selectedPriorities.length + 1
        });
        
        updateSelectedPrioritiesDisplay();
        
        if (appState.selectedPriorities.length >= 1) {
            document.getElementById('finishBtn').disabled = false;
        }
    }
}

function updateSelectedPrioritiesDisplay() {
    const container = document.getElementById('selectedPriorities');
    if (appState.selectedPriorities.length === 0) {
        container.innerHTML = '';
        return;
    }
    const htmlContent = appState.selectedPriorities.map((priority, index) => `
        <div class="selected-priority-item" data-priority-id="${priority.id}">
            <div class="priority-order">${index + 1}º</div>
            <span class="priority-icon">${priority.icon}</span>
            <div class="priority-content">
                <div class="priority-title">${priority.title}</div>
                <div class="priority-benefits">${priority.benefitsText}</div>
            </div>
            <button class="remove-priority" onclick="removePriority(${priority.id})">✕</button>
        </div>
    `).join('');
    container.innerHTML = htmlContent;
    makePrioritiesSortable();
}

function makePrioritiesSortable() {
    const container = document.getElementById('selectedPriorities');
    new Sortable(container, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
            const reorderedPriorities = [];
            const items = evt.to.children;

            for (let i = 0; i < items.length; i++) {
                const priorityId = items[i].dataset.priorityId;
                const priority = appState.selectedPriorities.find(p => p.id == priorityId);
                if (priority) {
                    reorderedPriorities.push(priority);
                }
            }
            
            appState.selectedPriorities = reorderedPriorities;
            updateSelectedPrioritiesDisplay(); // Re-render to update order numbers
        }
    });
}

function removePriority(priorityId) {
    // Re-enable the option in the main list
    const priorityOption = document.querySelector(`.priority-option[data-priority="${priorityId}"]`);
    if (priorityOption) {
        priorityOption.classList.remove('selected');
    }

    appState.selectedPriorities = appState.selectedPriorities.filter(p => p.id !== priorityId);
    updateSelectedPrioritiesDisplay();
    
    if (appState.selectedPriorities.length === 0) {
        document.getElementById('finishBtn').disabled = true;
    }
}

// =================================================================
// FUNÇÕES DO QUESTIONÁRIO
// =================================================================

function startQuiz() {
    if (appState.answers && appState.answers.length === questions.length) {
        // Questionário já foi respondido, sugere prioridades automaticamente
        sugerirPrioridadesAutomaticamente();
        appState.showingPriorities = true;
        showPrioritySelection();
        updateSelectedPrioritiesDisplay();
    } else {
        appState.currentQuestion = 0;
        appState.answers = [];
        appState.selectedPriorities = [];
        appState.showingPriorities = false;
        showQuestion();
    }
}

function showQuestion() {
    const question = questions[appState.currentQuestion];
    const container = document.getElementById('questionsContainer');
    
    const progress = ((appState.currentQuestion + 1) / questions.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressText').textContent = `Pergunta ${appState.currentQuestion + 1} de ${questions.length}`;
    
    container.innerHTML = `
        <div class="question-card">
            <div class="question-title">${question.question}</div>
            <div class="question-subtitle">${question.subtitle}</div>
            <div class="options-container">
                ${question.options.map((option, index) => `
                    <div class="option" data-value="${option.value}" data-weight="${option.weight}" data-products='${JSON.stringify(option.products)}'>
                        ${option.text}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    const options = container.querySelectorAll('.option');
    options.forEach(option => {
        option.addEventListener('click', () => selectOption(option));
    });
    
    document.getElementById('nextBtn').disabled = true;
    document.getElementById('finishBtn').style.display = 'none';
    
    if (appState.currentQuestion === questions.length - 1) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('finishBtn').style.display = 'inline-block';
        document.getElementById('finishBtn').disabled = true;
    } else {
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('finishBtn').style.display = 'none';
    }
}

function selectOption(selectedOption) {
    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    
    selectedOption.classList.add('selected');
    
    if (appState.currentQuestion === questions.length - 1) {
        document.getElementById('finishBtn').disabled = false;
    } else {
        document.getElementById('nextBtn').disabled = false;
    }
    
    const questionData = questions[appState.currentQuestion];
    appState.answers[appState.currentQuestion] = {
        questionId: questionData.id,
        category: questionData.category,
        weight: questionData.weight,
        selectedValue: parseInt(selectedOption.dataset.value),
        selectedWeight: parseInt(selectedOption.dataset.weight),
        products: JSON.parse(selectedOption.dataset.products),
        questionWeight: questionData.weight
    };
    
    saveStateToLocalStorage();
}

function nextQuestion() {
    if (appState.currentQuestion < questions.length - 1) {
        appState.currentQuestion++;
        showQuestion();
    }
}

async function finishQuiz() {
    if (!appState.showingPriorities && appState.answers.length === questions.length) {
        // Questionário terminou, sugere prioridades automaticamente
        sugerirPrioridadesAutomaticamente();
        appState.showingPriorities = true;
        document.getElementById('progressText').textContent = `Questionário concluído! Agora selecione suas prioridades`;
        saveStateToLocalStorage();
        setTimeout(() => {
            showPrioritySelection();
            updateSelectedPrioritiesDisplay();
        }, 1000);
        return;
    }
    if (appState.showingPriorities && appState.selectedPriorities.length > 0) {
        // Prioridades selecionadas, finaliza o diagnóstico
        const diagnosticReport = {
            consultant: appState.currentUser,
            client: appState.clientData,
            priorities: appState.selectedPriorities,
            answers: appState.answers,
            timestamp: new Date().toISOString()
        };
        try {
            const response = await fetch('backend/api/save_diagnostic.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(diagnosticReport)
            });
            const result = await response.json();
            if (result.error) {
                showNotification(`Erro ao salvar: ${result.message}`, 'error');
            } else {
                showNotification(result.message, 'success');
            }
        } catch (error) {
            console.error("Falha ao salvar diagnóstico:", error);
            showNotification('Erro de comunicação ao salvar o diagnóstico.', 'error');
        }
        generateResults();
        hideAllSections();
        document.getElementById('resultsSection').classList.remove('hidden');
        localStorage.removeItem('ozonteckAppState');
    }
}

function restartQuiz() {
    // Redefine o estado relacionado ao questionário/cliente
    appState.currentQuestion = 0;
    appState.answers = [];
    appState.selectedPriorities = [];
    appState.showingPriorities = false;
    appState.clientData = {};

    // Limpa o progresso salvo no localStorage
    localStorage.removeItem('ozonteckAppState');

    // Limpa os campos de dados do cliente
    document.getElementById('clientName').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientAgeRange').value = '';

    // Reexibe as seções corretas
    hideAllSections();
    if (appState.currentUser && appState.currentUser.role === 'admin') {
        document.getElementById('adminPanel').style.display = 'block';
    }
    document.getElementById('clientDataSection').classList.remove('hidden');
    
    showNotification('Pronto para uma nova consulta.', 'success');
}

// =================================================================
// FUNÇÕES DE ANÁLISE E RESULTADOS MELHORADAS
// =================================================================

// === AGRUPAMENTO DE CATEGORIAS PARA PRIORIDADES ===
const categoryToPriorityKey = {
    energia: 'energia_vitalidade',
    imunidade: 'imunidade_prevencao',
    digestao: 'emagrecimento_metabolismo',
    sono: 'sono_regeneracao',
    muscular: 'dores_inflamacao',
    mental: 'energia_vitalidade',
    intestinal: 'emagrecimento_metabolismo',
    emocional: 'sono_regeneracao',
    beleza: 'beleza_antiaging',
    dores: 'dores_inflamacao',
    sexual: 'performance_sexual',
    exercicio: 'energia_vitalidade',
};

// === LIMIARES DE GRAVIDADE ===
const GRAVITY_THRESHOLDS = {
    ALTO: 16,
    MEDIO: 10,
    BAIXO: 4,
};

function generateDiagnosticResult() {
    // 1. Inicialização das pontuações
    const priorityScores = {};
    Object.keys(clientPriorities).forEach(key => priorityScores[key] = 0);

    // 2. Processamento das respostas
    appState.answers.forEach(answer => {
        const priorityKey = categoryToPriorityKey[answer.category];
        if (priorityKey) {
            const score = answer.questionWeight * answer.selectedWeight;
            priorityScores[priorityKey] += score;
        }
    });

    // 3. Ordenação das prioridades
    const sortedPriorities = Object.entries(priorityScores)
        .sort((a, b) => b[1] - a[1])
        .map(([key, score]) => ({ key, score, ...clientPriorities[key] }));
    const top3 = sortedPriorities.slice(0, 3);

    // 4. Qualificação da gravidade e recomendação dinâmica
    const result = top3.map(priority => {
        let gravity = 'Saudável';
        let recommendation = [];
        let recType = '';
        if (priority.score >= GRAVITY_THRESHOLDS.ALTO) {
            gravity = 'Crítica';
            recommendation = (productProtocols[priority.key.toUpperCase()]?.products || priority.products);
            recType = 'Protocolo Essencial';
        } else if (priority.score >= GRAVITY_THRESHOLDS.MEDIO) {
            gravity = 'Moderada';
            recommendation = [priority.mainProduct];
            if (priority.products.length > 1) recommendation.push(priority.products[1]);
            recType = 'Sugestão Forte';
        } else if (priority.score >= GRAVITY_THRESHOLDS.BAIXO) {
            gravity = 'Ponto de Melhoria';
            recommendation = [priority.mainProduct];
            recType = 'Sugestão Opcional';
        } else {
            gravity = 'Saudável';
            if (priority.key === 'energia_vitalidade' && productDatabase['VITA OZON PLUS']) {
                recommendation = ['VITA OZON PLUS'];
                recType = 'Manutenção';
            } else {
                recommendation = [];
                recType = '';
            }
        }
        return {
            name: priority.title,
            key: priority.key,
            score: priority.score,
            gravity,
            recommendation,
            recType,
            icon: priority.icon,
            benefitsText: priority.benefitsText
        };
    });

    // 5. Mensagem de resumo
    let summary = '';
    const main = result[0];
    if (main.gravity === 'Crítica') {
        summary = `⚠️ Atenção: Sua principal prioridade de saúde é crítica (${main.name}). Recomendamos fortemente o ${main.recType} para um plano focado de recuperação.`;
    } else if (main.gravity === 'Moderada') {
        summary = `🔎 Sua principal prioridade de saúde (${main.name}) está em nível moderado. Sugerimos uma ação para otimizar sua saúde.`;
    } else if (main.gravity === 'Ponto de Melhoria') {
        summary = `💡 Sua principal prioridade (${main.name}) é um ponto de melhoria. Pequenas mudanças podem trazer grandes benefícios!`;
    } else {
        summary = `🎉 Parabéns! Você está saudável em sua principal prioridade (${main.name}). Continue cuidando bem da sua saúde!`;
    }

    return { priorities: result, summary, debug: { priorityScores, answers: appState.answers } };
}

function generateResults() {
    const diagnostic = generateDiagnosticResult();
    displayDiagnosticResults(diagnostic);
}

function displayDiagnosticResults(diagnostic) {
    const container = document.getElementById('recommendedProducts');
    container.innerHTML = '';
    let html = '';
    html += `<div class="product-card" style="background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%); border-left: 6px solid #00d4aa;">
        <div class="product-name">🎯 Diagnóstico Personalizado</div>
        <div class="product-description">${diagnostic.summary}</div>
        <div class="product-benefits">
            <h4>Prioridades Selecionadas:</h4>
            <ul style="list-style: none; padding: 0;">
                ${diagnostic.priorities.map((p, i) => `
                    <li style="margin-bottom: 18px;">
                        <strong>${i+1}º ${p.icon} ${p.name}</strong> <span style="color:#64748b; font-size:13px;">(${p.gravity}, Pontuação: ${p.score})</span><br>
                        <span style="color:#64748b; font-size:14px;">${p.benefitsText}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    </div>`;

    // Produtos detalhados em cards únicos
    // Map: produto -> {motivos: [benefitsText de cada prioridade], prioridades: [nomes]}
    const productMap = {};
    diagnostic.priorities.forEach(priority => {
        priority.recommendation.forEach(prod => {
            if (!productMap[prod]) {
                productMap[prod] = {
                    motivos: [],
                    prioridades: [],
                    recType: priority.recType
                };
            }
            if (!productMap[prod].motivos.includes(priority.benefitsText)) {
                productMap[prod].motivos.push(priority.benefitsText);
            }
            if (!productMap[prod].prioridades.includes(priority.name)) {
                productMap[prod].prioridades.push(priority.name);
            }
        });
    });
    const uniqueProducts = Object.keys(productMap);
    html += `<div style='margin-top:32px;'></div>`;
    uniqueProducts.forEach(prod => {
        const prodObj = productDatabase[prod];
        if (!prodObj) return;
        const img = prodObj.image ? prodObj.image : 'https://cdn.jsdelivr.net/gh/feathericons/feather@4.28.0/icons/image.svg';
        html += `
        <div class="product-card" style="margin-bottom: 32px; border-left: 6px solid #00b894; background:#fff; box-shadow:0 4px 18px rgba(0,0,0,0.07); border-radius:14px; padding:28px 18px 18px 18px; display:flex; flex-direction:column; align-items:center;">
            <img src='${img}' alt='img' style='width:140px;height:140px;object-fit:cover;border-radius:16px;border:2.5px solid #d1fae5;background:#f0fdfa;display:block;margin-bottom:18px;'>
            <div class="product-header" style='text-align:center;width:100%;'>
                <div class="product-name" style='font-size:1.35rem;font-weight:700;margin-bottom:2px;'>${prodObj.name}</div>
                <div class="product-code" style='color:#64748b;font-size:13px;margin-bottom:2px;'>Código: ${prodObj.code}</div>
                <div class="product-price" style='color:#00b894;font-weight:600;margin-bottom:6px;'>R$ ${prodObj.price.toFixed(2)}</div>
            </div>
            <div class="product-category" style='color:#2563eb;font-size:13px;text-align:center;margin-bottom:6px;'>${prodObj.category}</div>
            <div class="product-description" style='margin:8px 0 8px 0;text-align:center;'>${prodObj.description}</div>
            <div class="product-benefits" style='width:100%;'>
                <h4 style='margin:0 0 4px 0;font-size:1rem;text-align:center;'>Principais Benefícios:</h4>
                <ul style='margin:0 0 8px 0;'>
                    ${prodObj.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                </ul>
            </div>
            <div class="product-usage" style='margin-bottom:6px;'><strong>Dosagem:</strong> ${prodObj.dosage}</div>
            <div class="product-stock ${prodObj.stock < 50 ? 'low-stock' : ''}" style='margin-bottom:6px;'><strong>Estoque:</strong> ${prodObj.stock} unidades${prodObj.stock < 50 ? '<span class="stock-warning"> (Estoque baixo!)</span>' : ''}</div>
            <div class="product-reason" style="margin-top:8px;width:100%;">
                <b>Motivo da recomendação:</b><br>
                <ul style='margin:0; padding-left:18px;'>
                    ${productMap[prod].prioridades.map((prio, idx) => `<li><b>${prio}:</b> ${productMap[prod].motivos[idx]}</li>`).join('')}
                </ul>
                <div style='margin-top:6px; color:#00b894;'><b>Tipo de recomendação:</b> ${productMap[prod].recType}</div>
            </div>
        </div>
        `;
    });
    container.innerHTML = html;
}

// =================================================================
// FUNÇÕES DE OFERTAS INTELIGENTES
// =================================================================

function generateSmartOffers(sortedProducts) {
    const offerContainer = document.createElement('div');
    offerContainer.id = 'smartOffersSection';
    
    const topProducts = sortedProducts.slice(0, 5);
    const mainProduct = topProducts[0] ? productDatabase[topProducts[0][0]] : null;
    const secondaryProduct = topProducts[1] ? productDatabase[topProducts[1][0]] : null;
    const tertiaryProduct = topProducts[2] ? productDatabase[topProducts[2][0]] : null;

    let offersHTML = '<h2 class="results-title" style="text-align: center; margin-top: 40px; margin-bottom: 20px;">🌟 Ofertas Personalizadas para Você</h2>';

    // Verificar se existe protocolo específico para os produtos recomendados
    const suggestedProtocol = findBestProtocol(topProducts.map(([name]) => name));
    
    if (suggestedProtocol) {
        offersHTML += generateProtocolOffer(suggestedProtocol);
    }

    // Oferta Individual - Produto Principal
    if (mainProduct) {
        const discount = calculateDynamicDiscount(mainProduct, 15);
        const finalPrice = mainProduct.price * (1 - discount / 100);
        
        offersHTML += `
            <div class="product-card offer-card">
                <div class="offer-badge">MAIS RECOMENDADO</div>
                <div class="offer-title">✨ Oferta Individual (${discount}% OFF)</div>
                <div class="product-name">${mainProduct.name}</div>
                <div class="product-description">Ideal para começar seu tratamento personalizado.</div>
                <div class="offer-price">
                    <span class="original-price">R$ ${mainProduct.price.toFixed(2)}</span>
                    <span class="discounted-price">R$ ${finalPrice.toFixed(2)}</span>
                </div>
                <div class="offer-benefits">
                    <strong>Você economiza:</strong> R$ ${(mainProduct.price - finalPrice).toFixed(2)}
                </div>
            </div>
        `;
    }

    // Combo Duplo
    if (mainProduct && secondaryProduct) {
        const originalPrice = mainProduct.price + secondaryProduct.price;
        const discount = calculateDynamicDiscount({price: originalPrice}, 25);
        const finalPrice = originalPrice * (1 - discount / 100);
        
        offersHTML += `
            <div class="product-card offer-card">
                <div class="offer-title">🚀 Combo Essencial (${discount}% OFF)</div>
                <div class="product-name">${mainProduct.name} + ${secondaryProduct.name}</div>
                <div class="product-description">Potencialize seus resultados com a combinação ideal para seu perfil.</div>
                <div class="offer-price">
                    <span class="original-price">R$ ${originalPrice.toFixed(2)}</span>
                    <span class="discounted-price">R$ ${finalPrice.toFixed(2)}</span>
                </div>
                <div class="offer-benefits">
                    <strong>Você economiza:</strong> R$ ${(originalPrice - finalPrice).toFixed(2)}
                </div>
            </div>
        `;
    }

    // Combo Triplo Premium
    if (mainProduct && secondaryProduct && tertiaryProduct) {
        const originalPrice = mainProduct.price + secondaryProduct.price + tertiaryProduct.price;
        const discount = calculateDynamicDiscount({price: originalPrice}, 35);
        const finalPrice = originalPrice * (1 - discount / 100);
        
        offersHTML += `
            <div class="product-card offer-card best-offer">
                <div class="offer-badge">MELHOR ESCOLHA</div>
                <div class="offer-title">🏆 Programa Completo (${discount}% OFF)</div>
                <div class="product-name">${mainProduct.name} + ${secondaryProduct.name} + ${tertiaryProduct.name}</div>
                <div class="product-description">O tratamento completo para uma transformação total em sua saúde.</div>
                <div class="offer-price">
                    <span class="original-price">R$ ${originalPrice.toFixed(2)}</span>
                    <span class="discounted-price">R$ ${finalPrice.toFixed(2)}</span>
                </div>
                <div class="offer-bonus">+ Desconto especial na próxima compra!</div>
                <div class="offer-benefits">
                    <strong>Você economiza:</strong> R$ ${(originalPrice - finalPrice).toFixed(2)}
                </div>
            </div>
        `;
    }

    // Oferta baseada em faixa etária
    if (appState.clientData.ageRange) {
        offersHTML += generateAgeBasedOffer(appState.clientData.ageRange, topProducts);
    }

    offerContainer.innerHTML = offersHTML;
    document.getElementById('resultsSection').appendChild(offerContainer);
}

function findBestProtocol(recommendedProducts) {
    let bestMatch = null;
    let maxMatches = 0;
    
    Object.entries(productProtocols).forEach(([key, protocol]) => {
        const matches = protocol.products.filter(product => 
            recommendedProducts.includes(product)
        ).length;
        
        if (matches > maxMatches && matches >= 2) {
            maxMatches = matches;
            bestMatch = protocol;
        }
    });
    
    return bestMatch;
}

function generateProtocolOffer(protocol) {
    return `
        <div class="product-card offer-card protocol-offer">
            <div class="offer-badge">PROTOCOLO OZONTECK</div>
            <div class="offer-title">🎯 ${protocol.name}</div>
            <div class="product-description">${protocol.description}</div>
            <div class="protocol-products">
                <strong>Produtos inclusos:</strong>
                <ul>
                    ${protocol.products.map(productName => {
                        const product = productDatabase[productName];
                        return product ? `<li>${product.name} - ${product.category}</li>` : '';
                    }).join('')}
                </ul>
            </div>
            <div class="offer-price">
                <span class="original-price">R$ ${protocol.individualPrice.toFixed(2)}</span>
                <span class="discounted-price">R$ ${protocol.comboPrice.toFixed(2)}</span>
            </div>
            <div class="offer-benefits">
                <strong>Desconto total:</strong> ${protocol.discount}% | 
                <strong>Economia:</strong> R$ ${(protocol.individualPrice - protocol.comboPrice).toFixed(2)}
            </div>
        </div>
    `;
}

function calculateDynamicDiscount(product, baseDiscount) {
    // Desconto dinâmico baseado no estoque e categoria
    let discount = baseDiscount;
    
    if (product.stock && product.stock < 50) {
        discount += 5; // Desconto extra para produtos com estoque baixo
    }
    
    if (product.category === 'Suplementação Avançada') {
        discount += 3; // Desconto extra para produtos premium
    }
    
    return Math.min(discount, 40); // Máximo de 40% de desconto
}

function generateAgeBasedOffer(ageRange, topProducts) {
    const ageRecommendations = {
        '18-25': {
            focus: 'Performance e Energia',
            products: ['VIRTUOSOS CAPS', 'VITA OZON PLUS'],
            message: 'Ideais para manter alta performance na sua fase mais ativa!'
        },
        '26-35': {
            focus: 'Equilíbrio e Prevenção',
            products: ['LIFE CHI', 'NX CAP', 'ÔMEGA 3'],
            message: 'Perfeito para manter o equilíbrio entre trabalho e vida pessoal!'
        },
        '36-45': {
            focus: 'Vitalidade e Anti-aging',
            products: ['LUMINOUS VITA', 'LIFE CHI', 'DREAM BLISS'],
            message: 'Mantenha sua vitalidade e combata os primeiros sinais do tempo!'
        },
        '46-55': {
            focus: 'Saúde Preventiva',
            products: ['ÔMEGA 3', 'AMINA K2', 'POWER TRI-MAGNÉSIO'],
            message: 'Invista na sua saúde para os próximos anos com qualidade!'
        },
        '56+': {
            focus: 'Longevidade Saudável',
            products: ['AMINA K2', 'ÔMEGA 3', 'OZON FLEX'],
            message: 'Produtos especiais para uma longevidade ativa e saudável!'
        }
    };
    
    const ageGroup = ageRecommendations[ageRange];
    if (!ageGroup) return '';
    
    const relevantProducts = ageGroup.products.filter(product => 
        topProducts.some(([name]) => name === product)
    );
    
    if (relevantProducts.length === 0) return '';
    
    return `
        <div class="product-card offer-card age-based-offer">
            <div class="offer-title">🎂 Oferta Especial para ${ageRange} anos</div>
            <div class="offer-subtitle">${ageGroup.focus}</div>
            <div class="product-description">${ageGroup.message}</div>
            <div class="age-products">
                ${relevantProducts.map(productName => {
                    const product = productDatabase[productName];
                    return product ? `<span class="age-product-tag">${product.name}</span>` : '';
                }).join('')}
            </div>
            <div class="offer-benefits">
                <strong>Desconto especial de 20% para sua faixa etária!</strong>
            </div>
        </div>
    `;
}

function sugerirPrioridadesAutomaticamente() {
    // Calcula pontuação de cada prioridade
    const priorityScores = {};
    Object.keys(clientPriorities).forEach(key => priorityScores[key] = 0);
    appState.answers.forEach(answer => {
        const priorityKey = categoryToPriorityKey[answer.category];
        if (priorityKey) {
            const score = answer.questionWeight * answer.selectedWeight;
            priorityScores[priorityKey] += score;
        }
    });
    // Ordena prioridades por pontuação
    const sorted = Object.entries(priorityScores)
        .sort((a, b) => b[1] - a[1])
        .map(([key, score]) => ({ ...clientPriorities[key], key, score }));
    // Seleciona as 3 principais
    appState.selectedPriorities = sorted.slice(0, 3).map((priority, idx) => ({
        ...priority,
        order: idx + 1
    }));
}

// =================================================================
// INICIALIZAÇÃO DA APLICAÇÃO MELHORADA
// =================================================================
async function initializeApp() {
    try {
        const response = await fetch('backend/api/get_data.php');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Preenche as variáveis globais com os dados do backend
        clientPriorities = data.clientPriorities;
        questions = data.questions;
        productDatabase = data.productDatabase;
        productProtocols = data.productProtocols || {}; // Novo campo para protocolos

        // Validar integridade dos dados
        validateDataIntegrity();

        // Adiciona os listeners para os botões principais após carregar os dados
        setupEventListeners();
        
        showNotification('Sistema carregado com sucesso!', 'success');
        checkActiveSession();

    } catch (error) {
        console.error("Falha ao inicializar a aplicação:", error);
        showNotification('Erro fatal ao carregar dados do sistema. Verifique o console.', 'error');
    }
}

function validateDataIntegrity() {
    console.log('🔍 Validando integridade dos dados...');
    console.log(`📦 Produtos carregados: ${Object.keys(productDatabase).length}`);
    console.log(`❓ Perguntas carregadas: ${questions.length}`);
    console.log(`🎯 Prioridades carregadas: ${Object.keys(clientPriorities).length}`);
    console.log(`💊 Protocolos carregados: ${Object.keys(productProtocols).length}`);
    
    // Debug detalhado das prioridades
    console.log('🎯 Detalhes das prioridades:');
    Object.entries(clientPriorities).forEach(([key, priority]) => {
        console.log(`  - ${key}: ID=${priority.id}, Título="${priority.title}"`);
    });
    
    // Verificar se todos os produtos mencionados nas perguntas existem no database
    const missingProducts = [];
    questions.forEach(question => {
        question.options.forEach(option => {
            option.products.forEach(productName => {
                if (!productDatabase[productName]) {
                    missingProducts.push(productName);
                }
            });
        });
    });
    
    if (missingProducts.length > 0) {
        console.warn('⚠️ Produtos mencionados nas perguntas mas não encontrados no database:', [...new Set(missingProducts)]);
    } else {
        console.log('✅ Todos os produtos estão corretamente referenciados!');
    }
}

function setupEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) addUserBtn.addEventListener('click', addUser);
    const startDiagnosisBtn = document.getElementById('startDiagnosisBtn');
    if (startDiagnosisBtn) startDiagnosisBtn.addEventListener('click', handleStartDiagnosis);
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
    const finishBtn = document.getElementById('finishBtn');
    if (finishBtn) finishBtn.addEventListener('click', finishQuiz);
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) restartBtn.addEventListener('click', restartQuiz);
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => handleLogout());

    // Listeners da tecla Enter
    const loginUser = document.getElementById('loginUser');
    if (loginUser) loginUser.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
    const loginPass = document.getElementById('loginPass');
    if (loginPass) loginPass.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });

    const btnShowReports = document.getElementById('btnShowReports');
    if (btnShowReports) {
        btnShowReports.addEventListener('click', function() {
            window.location.href = 'reports.html';
        });
    }
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            if (typeof handleLogout === 'function') handleLogout();
        });
    }
}

// =================================================================
// FUNÇÕES DE DEBUG E DESENVOLVIMENTO
// =================================================================

function debugSystemState() {
    console.group('🐛 Debug - Estado do Sistema Ozonteck');
    console.log('👤 Usuário atual:', appState.currentUser);
    console.log('📋 Cliente atual:', appState.clientData);
    console.log('🎯 Prioridades selecionadas:', appState.selectedPriorities);
    console.log('📝 Respostas do questionário:', appState.answers);
    console.log('📊 Pergunta atual:', appState.currentQuestion);
    console.log('💾 Dados no localStorage:', localStorage.getItem('ozonteckAppState'));
    console.groupEnd();
}

// Expor função de debug globalmente para desenvolvimento
window.debugOzonteck = debugSystemState;

if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '/ozonteck/' || window.location.pathname === '/ozonteck/index.html') {
    document.addEventListener('DOMContentLoaded', initializeApp);
}

// Adicionar máscara de WhatsApp ao carregar a tela de dados do cliente
function setupWhatsappMask() {
    const input = document.getElementById('clientWhatsapp');
    if (!input) return;
    input.addEventListener('input', function(e) {
        let v = input.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 6) {
            input.value = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
        } else if (v.length > 2) {
            input.value = `(${v.slice(0,2)}) ${v.slice(2)}`;
        } else if (v.length > 0) {
            input.value = `(${v}`;
        }
    });
}

// Chamar a máscara ao inicializar o app e ao mostrar o formulário
const origShowClientDataSection = typeof showClientDataSection === 'function' ? showClientDataSection : null;
function showClientDataSectionWithMask() {
    if (origShowClientDataSection) origShowClientDataSection();
    setupWhatsappMask();
}
window.addEventListener('DOMContentLoaded', setupWhatsappMask);

// Função para buscar diagnósticos do backend
async function fetchDiagnostics() {
    // Garante que appState.currentUser está preenchido ao acessar reports.html
    if (!appState.currentUser) {
        const userSession = sessionStorage.getItem('ozonteckUserSession');
        if (userSession) {
            appState.currentUser = JSON.parse(userSession);
        }
    }
    const user = appState.currentUser;
    const response = await fetch('backend/api/get_diagnostics.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
    });
    const data = await response.json();
    return data.diagnostics;
}

// Função para fechar venda
async function closeSale(diagnosticId) {
    await fetch('backend/api/close_sale.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: diagnosticId })
    });
    showNotification('Venda fechada com sucesso!', 'success');
    renderDiagnosticsReport(); // Atualiza a tela
}

// Função para renderizar relatórios
async function renderDiagnosticsReport() {
    const diagnostics = await fetchDiagnostics();
    const container = document.getElementById('diagnosticsReport');
    if (!container) return;
    // Filtro por vendedor para admin
    let user = appState.currentUser;
    let filterConsultant = null;
    if (user && user.role === 'admin') {
        // Obter lista de consultores únicos
        const consultants = Array.from(new Set(diagnostics.map(d => d.consultant && d.consultant.name).filter(Boolean)));
        let selectHTML = `<div style='margin-bottom:18px;'><label for='filterConsultant'><b>Filtrar por vendedor:</b></label> <select id='filterConsultant' class='btn btn-sm' style='width:auto;min-width:160px;'><option value=''>Todos</option>${consultants.map(c => `<option value='${c}'>${c}</option>`).join('')}</select></div>`;
        container.innerHTML = selectHTML;
        document.getElementById('filterConsultant').onchange = function(e) {
            renderDiagnosticsReportFiltered(e.target.value);
        };
        filterConsultant = document.getElementById('filterConsultant').value;
    }
    renderDiagnosticsReportFiltered(filterConsultant);
}

async function renderDiagnosticsReportFiltered(consultantName) {
    const diagnostics = await fetchDiagnostics();
    const container = document.getElementById('diagnosticsReport');
    let filtered = diagnostics;
    if (consultantName) {
        filtered = diagnostics.filter(d => d.consultant && d.consultant.name === consultantName);
    }
    // Manter o select de filtro sempre no topo e manter o valor selecionado
    const select = document.getElementById('filterConsultant');
    let html = '';
    let selectedValue = consultantName || '';
    if (select) {
        // Reconstruir o select mantendo o valor selecionado
        const options = Array.from(select.options).map(opt => `<option value='${opt.value}'${opt.value===selectedValue?' selected':''}>${opt.textContent}</option>`).join('');
        html += `<div style='margin-bottom:18px;'><label for='filterConsultant'><b>Filtrar por vendedor:</b></label> <select id='filterConsultant' class='btn btn-sm' style='width:auto;min-width:160px;'>${options}</select></div>`;
    }
    if (!filtered.length) {
        container.innerHTML = (html || '') + '<div style="color:#64748b;">Nenhum diagnóstico encontrado.</div>';
        if (select) document.getElementById('filterConsultant').onchange = function(e) { renderDiagnosticsReportFiltered(e.target.value); };
        return;
    }
    html += filtered.map(diag => {
        const statusClass = diag.closed ? 'status-fechado' : 'status-aberto';
        const statusText = diag.closed ? 'Fechado' : 'Aberto';
        const icon = diag.consultant.avatar || '👤';
        return `
        <div class="diagnostic-card">
            <div style="display:flex;align-items:center;gap:18px;margin-bottom:10px;">
                <div style="font-size:2.2rem;">${icon}</div>
                <div>
                    <div style="font-weight:700;font-size:1.1rem;">${diag.client.name}</div>
                    <div style="color:#64748b;font-size:13px;">${diag.client.email}</div>
                    <div style="color:#00b894;font-size:13px;">${diag.client.whatsapp || '-'}</div>
                </div>
            </div>
            <div style="margin-bottom:8px;"><b>Consultor:</b> ${diag.consultant.name}</div>
            <div style="margin-bottom:8px;"><b>Data/Hora:</b> ${diag.timestamp ? new Date(diag.timestamp).toLocaleString() : '-'}</div>
            <div style="margin-bottom:8px;"><b>Prioridades:</b> <span style="color:#2563eb;">${diag.priorities ? diag.priorities.map(p => `${p.icon || ''} ${p.title}`).join(', ') : '-'}</span></div>
            <div style="margin-bottom:8px;"><b>Produtos:</b> <span style="color:#0a4d3c;">${diag.priorities ? diag.priorities.flatMap(p => p.products).join(', ') : '-'}</span></div>
            <div style="margin-bottom:8px;"><b>Status:</b> <span class="${statusClass}">${statusText}</span></div>
            ${!diag.closed ? `<button onclick="closeSale('${diag.id}')">Fechar Venda</button>` : `<div style='margin-top:8px;'><b>Fechado em:</b> ${diag.closedAt ? new Date(diag.closedAt).toLocaleString() : ''}</div>`}
        </div>
        `;
    }).join('');
    container.innerHTML = html;
    if (select) document.getElementById('filterConsultant').onchange = function(e) { renderDiagnosticsReportFiltered(e.target.value); };
}

function getFilteredDiagnosticsForExport(diagnostics) {
    const select = document.getElementById('filterConsultant');
    if (select && select.value) {
        return diagnostics.filter(d => d.consultant && d.consultant.name === select.value);
    }
    return diagnostics;
}

// Função para exportar relatórios em CSV
async function exportDiagnosticsCSV() {
    const diagnostics = getFilteredDiagnosticsForExport(await fetchDiagnostics());
    if (!diagnostics.length) return alert('Nenhum relatório para exportar!');
    const header = ['Cliente','Email','WhatsApp','Consultor','Data/Hora','Prioridades','Produtos','Status'];
    const rows = diagnostics.map(diag => [
        diag.client.name,
        diag.client.email,
        diag.client.whatsapp || '-',
        diag.consultant.name,
        diag.timestamp ? new Date(diag.timestamp).toLocaleString() : '-',
        diag.priorities ? diag.priorities.map(p => (p.icon ? p.icon+' ':'')+p.title).join(' | ') : '-',
        diag.priorities ? diag.priorities.flatMap(p => p.products).join(' | ') : '-',
        diag.closed ? 'Fechado' : 'Aberto'
    ]);
    let csv = header.join(';') + '\n';
    rows.forEach(r => { csv += r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(';')+'\n'; });
    const blob = new Blob([csv], {type: 'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'relatorios_ozonteck.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// Função para exportar relatórios em TXT
async function exportDiagnosticsTXT() {
    const diagnostics = getFilteredDiagnosticsForExport(await fetchDiagnostics());
    if (!diagnostics.length) return alert('Nenhum relatório para exportar!');
    let txt = '';
    diagnostics.forEach((diag, i) => {
        txt += `Relatório #${i+1}\n`;
        txt += `Cliente: ${diag.client.name}\nEmail: ${diag.client.email}\nWhatsApp: ${diag.client.whatsapp || '-'}\nConsultor: ${diag.consultant.name}\nData/Hora: ${diag.timestamp ? new Date(diag.timestamp).toLocaleString() : '-'}\n`;
        txt += `Prioridades: ${diag.priorities ? diag.priorities.map(p => (p.icon ? p.icon+' ':'')+p.title).join(', ') : '-'}\n`;
        txt += `Produtos: ${diag.priorities ? diag.priorities.flatMap(p => p.products).join(', ') : '-'}\n`;
        txt += `Status: ${diag.closed ? 'Fechado' : 'Aberto'}\n`;
        txt += `-----------------------------\n`;
    });
    const blob = new Blob([txt], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'relatorios_ozonteck.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// Função para exportar relatórios em PDF (simples)
async function exportDiagnosticsPDF() {
    const diagnostics = getFilteredDiagnosticsForExport(await fetchDiagnostics());
    if (!diagnostics.length) return alert('Nenhum relatório para exportar!');
    let win = window.open('', '', 'width=900,height=700');
    win.document.write('<html><head><title>Relatórios Ozonteck</title>');
    win.document.write('<style>body{font-family:sans-serif;}h2{color:#00b894;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:8px;}th{background:#f0fdfa;}tr:nth-child(even){background:#f8fafc;}</style>');
    win.document.write('</head><body>');
    win.document.write('<h2>Relatórios Ozonteck</h2>');
    win.document.write('<table><thead><tr><th>Cliente</th><th>Email</th><th>WhatsApp</th><th>Consultor</th><th>Data/Hora</th><th>Prioridades</th><th>Produtos</th><th>Status</th></tr></thead><tbody>');
    diagnostics.forEach(diag => {
        win.document.write('<tr>');
        win.document.write(`<td>${diag.client.name}</td>`);
        win.document.write(`<td>${diag.client.email}</td>`);
        win.document.write(`<td>${diag.client.whatsapp || '-'}</td>`);
        win.document.write(`<td>${diag.consultant.name}</td>`);
        win.document.write(`<td>${diag.timestamp ? new Date(diag.timestamp).toLocaleString() : '-'}</td>`);
        win.document.write(`<td>${diag.priorities ? diag.priorities.map(p => (p.icon ? p.icon+' ':'')+p.title).join(' | ') : '-'}</td>`);
        win.document.write(`<td>${diag.priorities ? diag.priorities.flatMap(p => p.products).join(' | ') : '-'}</td>`);
        win.document.write(`<td>${diag.closed ? 'Fechado' : 'Aberto'}</td>`);
        win.document.write('</tr>');
    });
    win.document.write('</tbody></table>');
    win.document.write('</body></html>');
    win.document.close();
    win.print();
}

function renderActionButtons() {
    const container = document.getElementById('actionButtons');
    if (!container) return;
    // Tenta obter usuário do appState ou localStorage
    let user = (window.appState && appState.currentUser) ? appState.currentUser : null;
    if (!user) {
        try {
            user = JSON.parse(localStorage.getItem('ozonUser'));
        } catch (e) { user = null; }
    }
    // Só mostra botões se estiver logado
    if (user) {
        container.innerHTML = '';
        container.style.display = 'flex';
        // Botão de relatórios
        const btnReports = document.createElement('button');
        btnReports.id = 'btnShowReports';
        btnReports.className = 'btn btn-sm';
        btnReports.innerHTML = '📊 Relatórios';
        btnReports.onclick = function() { window.location.href = 'reports.html'; };
        container.appendChild(btnReports);
        // Botão Admin Produtos para admin
        if (user.role === 'admin') {
            const btnAdmin = document.createElement('button');
            btnAdmin.id = 'btnAdminProducts';
            btnAdmin.className = 'btn btn-secondary btn-sm';
            btnAdmin.innerHTML = '⚙️ Admin Produtos';
            btnAdmin.onclick = function() { window.location.href = 'admin_products.html'; };
            container.appendChild(btnAdmin);
        }
        // Botão de logout sempre por último
        const btnLogout = document.createElement('button');
        btnLogout.id = 'btnLogout';
        btnLogout.className = 'btn btn-sm';
        btnLogout.title = 'Sair';
        btnLogout.style.display = 'flex';
        btnLogout.style.alignItems = 'center';
        btnLogout.style.gap = '4px';
        btnLogout.style.marginLeft = 'auto';
        btnLogout.innerHTML = '<span style="font-size:1.2em;">⏻</span> Sair';
        btnLogout.onclick = function() { if (typeof handleLogout === 'function') handleLogout(); };
        container.appendChild(btnLogout);
        // Ajuste flex para garantir o logout à direita
        container.style.justifyContent = 'flex-start';
        container.style.alignItems = 'center';
        container.style.gap = '10px';
    } else {
        // Se não logado, oculta e limpa o container
        container.innerHTML = '';
        container.style.display = 'none';
    }
}

// Adicionar chamadas reais:
// ... existing code ...
// No final do DOMContentLoaded:
document.addEventListener('DOMContentLoaded', function() {
    // ... outros event listeners ...
    renderActionButtons();
});
// ... existing code ...
// No handleLogin (em js/auth.js), após sucesso:
// renderActionButtons();
// No handleLogout (em js/auth.js), após sucesso:
// renderActionButtons();
// No checkActiveSession (em js/auth.js), após restaurar sessão:
// renderActionButtons();