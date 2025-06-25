<?php
// Script de migração: transforma stock global em stock por vendedor
$dbFile = __DIR__ . '/../backend/db/database.json';
$data = json_decode(file_get_contents($dbFile), true);

// Pega todos os vendedores e admin
$vendedores = [];
foreach ($data['users'] as $username => $user) {
    if (in_array($user['role'], ['vendedor', 'admin'])) {
        $vendedores[] = $username;
    }
}

// Atualiza cada produto
foreach ($data['productDatabase'] as &$prod) {
    $oldStock = isset($prod['stock']) ? $prod['stock'] : 0;
    $newStock = [];
    foreach ($vendedores as $v) {
        $newStock[$v] = ($v === 'admin') ? $oldStock : 0;
    }
    $prod['stock'] = $newStock;
}

file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "Migração concluída. Estoque agora é por vendedor.\n"; 