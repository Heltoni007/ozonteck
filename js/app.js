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
            appState = { ...appState, ...loadedState };
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
    const clientAgeRange = document.getElementById('clientAgeRange').value;

    if (!clientName || !clientEmail || !clientAgeRange) {
        showNotification('Por favor, preencha todos os dados do cliente.', 'error');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
        showNotification('Por favor, insira um e-mail válido.', 'error');
        return;
    }

    appState.clientData = {
        name: clientName,
        email: clientEmail,
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
    container.innerHTML = `
        <div class="question-card">
            <div class="question-title">🎯 Agora selecione suas PRINCIPAIS PRIORIDADES de saúde</div>
            <div class="question-subtitle">Com base nas suas respostas, escolha até 3 prioridades clicando nelas (ordem de importância)</div>
            
            <div style="background: #f0fdfa; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h4 style="color: #00b894; margin-bottom: 15px;">📋 Escolha suas prioridades:</h4>
                <div id="priorityOptions" class="priority-options">
                    ${Object.values(clientPriorities).map(priority => `
                        <div class="priority-option" data-priority="${priority.id}">
                            <span class="priority-icon">${priority.icon}</span>
                            <div class="priority-content">
                                <div class="priority-title">${priority.title}</div>
                                <div class="priority-description">${priority.description}</div>
                                <div class="priority-products">Produtos: ${priority.products.join(', ')}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="background: #fff7ed; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h4 style="color: #f59e0b; margin-bottom: 15px;">🏆 Suas Prioridades Selecionadas:</h4>
                <div id="selectedPriorities" class="selected-priorities">
                    <div class="empty-priority">Clique até 3 prioridades acima</div>
                </div>
            </div>
        </div>
    `;
    
    setupPrioritySelection();
    
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('finishBtn').style.display = 'inline-block';
    document.getElementById('finishBtn').disabled = true;
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
        container.innerHTML = '<div class="empty-priority">Clique até 3 prioridades acima</div>';
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
    if (loadStateFromLocalStorage()) {
        showNotification('Seu progresso anterior foi restaurado!', 'success');
        if (appState.showingPriorities) {
            showPrioritySelection();
            updateSelectedPrioritiesDisplay();
        } else {
            showQuestion();
        }
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
        // Questionário terminou, agora mostra as prioridades
        appState.showingPriorities = true;
        document.getElementById('progressText').textContent = `Questionário concluído! Agora selecione suas prioridades`;
        
        saveStateToLocalStorage();

        setTimeout(() => {
            showPrioritySelection();
        }, 1000);
        return;
    }
    
    if (appState.showingPriorities && appState.selectedPriorities.length > 0) {
        // Prioridades selecionadas, finaliza o diagnóstico
        // Prepara os dados do diagnóstico para serem enviados
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

function generateResults() {
    const productRecommendations = {};
    const categoryScores = {};
    
    // Análise das respostas do questionário
    appState.answers.forEach(answer => {
        if (!categoryScores[answer.category]) {
            categoryScores[answer.category] = 0;
        }
        categoryScores[answer.category] += answer.selectedWeight * answer.questionWeight;
        
        answer.products.forEach(product => {
            if (!productRecommendations[product]) {
                productRecommendations[product] = 0;
            }
            productRecommendations[product] += answer.selectedWeight * answer.questionWeight;
        });
    });
    
    const priorityAnalysis = analyzePriorities();
    const finalRecommendations = combinePriorityAndQuizResults(productRecommendations, priorityAnalysis);
    
    displayResults(finalRecommendations, categoryScores, priorityAnalysis);
}

function analyzePriorities() {
    const analysis = {};
    
    appState.selectedPriorities.forEach((priority, index) => {
        const weight = index === 0 ? 5 : index === 1 ? 3 : 2;
        
        priority.products.forEach(productName => {
            if (!analysis[productName]) {
                analysis[productName] = 0;
            }
            analysis[productName] += weight;
            
            if (productName === priority.mainProduct) {
                analysis[productName] += 2;
            }
        });
    });
    
    return analysis;
}

function combinePriorityAndQuizResults(quizResults, priorityResults) {
    const combined = {};
    
    [...new Set([...Object.keys(quizResults), ...Object.keys(priorityResults)])].forEach(product => {
        const quizScore = quizResults[product] || 0;
        const priorityScore = (priorityResults[product] || 0) * 3;
        combined[product] = quizScore + priorityScore;
    });
    
    return Object.entries(combined)
        .sort(([,a], [,b]) => b - a)
        .filter(([,score]) => score > 0);
}

function displayResults(sortedProducts, categoryScores, priorityAnalysis) {
    const container = document.getElementById('recommendedProducts');
    container.innerHTML = ''; // Limpa resultados antigos

    if (sortedProducts.length === 0) {
        container.innerHTML = `
            <div class="product-card">
                <div class="product-name">🎉 Parabéns!</div>
                <div class="product-description">
                    Com base em suas respostas, você apresenta uma excelente condição de saúde! 
                    Continue mantendo seus hábitos saudáveis.
                </div>
            </div>
        `;
        return;
    }
    
    let resultsHTML = '';
    
    // Exibir prioridades selecionadas
    if (appState.selectedPriorities.length > 0) {
        resultsHTML += `
            <div class="product-card" style="background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%); border-left: 6px solid #00d4aa;">
                <div class="product-name">🎯 Suas Prioridades de Saúde</div>
                <div class="product-description">
                    Com base nas prioridades que você selecionou, desenvolvemos um protocolo personalizado:
                </div>
                <div class="product-benefits">
                    <h4>Ordem de Prioridade Selecionada:</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${appState.selectedPriorities.map((priority, index) => `
                            <li style="margin-bottom: 8px; padding-left: 0;">
                                <strong>${index + 1}º ${priority.icon} ${priority.title}</strong><br>
                                <span style="color: #64748b; font-size: 14px;">${priority.benefitsText}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // Exibir produtos recomendados individualmente
    resultsHTML += sortedProducts.slice(0, 5).map(([productName, score]) => {
        const product = productDatabase[productName];
        if (!product) return '';
        
        return `
            <div class="product-card">
                <div class="product-header">
                    <div class="product-name">${product.name}</div>
                    <div class="product-code">Código: ${product.code}</div>
                    <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                </div>
                <div class="product-category">${product.category}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-benefits">
                    <h4>Principais Benefícios:</h4>
                    <ul>
                        ${product.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                    </ul>
                </div>
                <div class="product-usage">
                    <strong>Dosagem:</strong> ${product.dosage}
                </div>
                <div class="product-stock ${product.stock < 50 ? 'low-stock' : ''}">
                    <strong>Estoque:</strong> ${product.stock} unidades
                    ${product.stock < 50 ? '<span class="stock-warning"> (Estoque baixo!)</span>' : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = resultsHTML;

    // Gerar ofertas inteligentes baseadas nos produtos recomendados
    generateSmartOffers(sortedProducts);
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
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('addUserBtn').addEventListener('click', addUser);
    document.getElementById('startDiagnosisBtn').addEventListener('click', handleStartDiagnosis);
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('finishBtn').addEventListener('click', finishQuiz);
    document.getElementById('restartBtn').addEventListener('click', restartQuiz);
    document.getElementById('logoutBtn').addEventListener('click', () => handleLogout());

    // Listeners da tecla Enter
    document.getElementById('loginUser').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('loginPass').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
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

document.addEventListener('DOMContentLoaded', initializeApp);