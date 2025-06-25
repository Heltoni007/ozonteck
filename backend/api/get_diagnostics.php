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
} else {
    $result = array_filter($diagnostics, function($diag) use ($user) {
        return isset($diag['consultant']['name']) && $diag['consultant']['name'] === $user['name'];
    });
}

echo json_encode(['diagnostics' => array_values($result)]); 