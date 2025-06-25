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
        // Listar todos os produtos
        echo json_encode($data['productDatabase']);
        break;
    case 'POST':
        // Adicionar novo produto
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['name']) || !$input['name']) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome do produto é obrigatório']);
            exit;
        }
        $data['productDatabase'][$input['name']] = $input;
        writeDatabase($databaseFile, $data);
        echo json_encode(['success' => true]);
        break;
    case 'PUT':
        // Editar produto existente
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['name']) || !$input['name']) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome do produto é obrigatório']);
            exit;
        }
        $data['productDatabase'][$input['name']] = $input;
        writeDatabase($databaseFile, $data);
        echo json_encode(['success' => true]);
        break;
    case 'DELETE':
        // Remover produto
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['name']) || !$input['name']) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome do produto é obrigatório']);
            exit;
        }
        unset($data['productDatabase'][$input['name']]);
        writeDatabase($databaseFile, $data);
        echo json_encode(['success' => true]);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
} 