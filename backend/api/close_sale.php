<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id']; // id do diagnóstico

$dbFile = '../db/database.json';
$db = json_decode(file_get_contents($dbFile), true);

foreach ($db['diagnostics'] as &$diag) {
    if ($diag['id'] === $id) {
        $diag['closed'] = true;
        $diag['closedAt'] = date('c');
        break;
    }
}
file_put_contents($dbFile, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo json_encode(['success' => true]); 