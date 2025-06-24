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
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('clientDataSection').classList.add('hidden');
    document.getElementById('ozonioHistory').classList.add('hidden');
    document.getElementById('quizSection').classList.add('hidden');
    document.getElementById('resultsSection').classList.add('hidden');
} 