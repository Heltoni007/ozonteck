<?php
header('Content-Type: application/json');
$databaseFile = '../db/database.json';

function readDatabase($file) {
    return json_decode(file_get_contents($file), true);
}
function writeDatabase($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$data = readDatabase($databaseFile);

switch ($method) {
    case 'GET':
        // Listar todas as categorias únicas dos produtos
        $categories = [];
        foreach ($data['productDatabase'] as $prod) {
            if (!in_array($prod['category'], $categories)) {
                $categories[] = $prod['category'];
            }
        }
        echo json_encode($categories);
        break;
    case 'POST':
        // Adicionar nova categoria (apenas como referência, não há objeto categoria isolado)
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['category']) || !$input['category']) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome da categoria é obrigatório']);
            exit;
        }
        // Adiciona categoria criando um produto "dummy" (pois categorias só existem via produtos)
        $dummy = [
            'name' => '__dummy_' . uniqid(),
            'code' => '',
            'category' => $input['category'],
            'price' => 0,
            'description' => '',
            'benefits' => [],
            'indications' => [],
            'contraindications' => [],
            'dosage' => '',
            'stock' => 0,
            'active' => false
        ];
        $data['productDatabase'][$dummy['name']] = $dummy;
        writeDatabase($databaseFile, $data);
        echo json_encode(['success' => true]);
        break;
    case 'PUT':
        // Editar nome de categoria (altera todos os produtos com a categoria antiga)
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['oldCategory']) || !isset($input['newCategory'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Categorias antiga e nova são obrigatórias']);
            exit;
        }
        foreach ($data['productDatabase'] as &$prod) {
            if ($prod['category'] === $input['oldCategory']) {
                $prod['category'] = $input['newCategory'];
            }
        }
        writeDatabase($databaseFile, $data);
        echo json_encode(['success' => true]);
        break;
    case 'DELETE':
        // Remover categoria (remove todos os produtos dessa categoria)
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['category']) || !$input['category']) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome da categoria é obrigatório']);
            exit;
        }
        foreach ($data['productDatabase'] as $name => $prod) {
            if ($prod['category'] === $input['category']) {
                unset($data['productDatabase'][$name]);
            }
        }
        writeDatabase($databaseFile, $data);
        echo json_encode(['success' => true]);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
} 