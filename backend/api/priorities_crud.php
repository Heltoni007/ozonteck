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
        // Listar todas as prioridades
        echo json_encode($data['clientPriorities']);
        break;
    case 'POST':
        // Adicionar nova prioridade
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id']) || !isset($input['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID e título são obrigatórios']);
            exit;
        }
        $data['clientPriorities'][$input['id']] = $input;
        writeDatabase($databaseFile, $data);
        echo json_encode(['success' => true]);
        break;
    case 'PUT':
        // Editar prioridade existente
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID da prioridade é obrigatório']);
            exit;
        }
        $data['clientPriorities'][$input['id']] = $input;
        writeDatabase($databaseFile, $data);
        echo json_encode(['success' => true]);
        break;
    case 'DELETE':
        // Remover prioridade
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID da prioridade é obrigatório']);
            exit;
        }
        unset($data['clientPriorities'][$input['id']]);
        writeDatabase($databaseFile, $data);
        echo json_encode(['success' => true]);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
} 