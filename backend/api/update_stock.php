<?php
header('Content-Type: application/json');
$databaseFile = '../db/database.json';

function readDatabase($file) {
    return json_decode(file_get_contents($file), true);
}
function writeDatabase($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$name = $input['name'] ?? null;
$vendedor = $input['vendedor'] ?? null;
$stock = isset($input['stock']) ? intval($input['stock']) : null;

if (!$name || !$vendedor || $stock === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Parâmetros obrigatórios: name, vendedor, stock']);
    exit;
}

$data = readDatabase($databaseFile);
if (!isset($data['productDatabase'][$name])) {
    http_response_code(404);
    echo json_encode(['error' => 'Produto não encontrado']);
    exit;
}

if (!isset($data['productDatabase'][$name]['stock']) || !is_array($data['productDatabase'][$name]['stock'])) {
    $data['productDatabase'][$name]['stock'] = [];
}
$data['productDatabase'][$name]['stock'][$vendedor] = $stock;
writeDatabase($databaseFile, $data);
echo json_encode(['success' => true, 'stock' => $stock]); 