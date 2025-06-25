<?php
header('Content-Type: application/json');

// Recebe usuário via POST (JSON)
$input = json_decode(file_get_contents('php://input'), true);
$user = isset($input['user']) ? $input['user'] : null;
if (!$user || !isset($user['role']) || !isset($user['name'])) {
    echo json_encode(['diagnostics' => []]);
    exit;
}

$db = json_decode(file_get_contents('../db/database.json'), true);
$diagnostics = isset($db['diagnostics']) ? $db['diagnostics'] : [];

if ($user['role'] === 'admin') {
    $result = $diagnostics;
} else if ($user['role'] === 'gestor') {
    // Gestor vê diagnósticos dos seus vendedores
    $db_users = $db['users'] ?? [];
    $meusVendedores = array_filter($db_users, function($u) use ($user) {
        return isset($u['role'], $u['gestor_id']) && $u['role'] === 'vendedor' && $u['gestor_id'] === $user['username'];
    });
    $nomesVendedores = array_map(function($u) { return $u['name']; }, $meusVendedores);
    $result = array_filter($diagnostics, function($diag) use ($nomesVendedores) {
        return isset($diag['consultant']['name']) && in_array($diag['consultant']['name'], $nomesVendedores);
    });
} else {
    $result = array_filter($diagnostics, function($diag) use ($user) {
        return isset($diag['consultant']['name']) && $diag['consultant']['name'] === $user['name'];
    });
}

echo json_encode(['diagnostics' => array_values($result)]); 