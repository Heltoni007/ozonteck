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