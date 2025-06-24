<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$db_file = '../db/database.json';
$response = ['error' => true, 'message' => 'Requisição inválida.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $post_data = json_decode(file_get_contents("php://input"), true);
    $username = $post_data['username'] ?? null;

    if ($username) {
        try {
            $database_content = file_get_contents($db_file);
            $database = json_decode($database_content, true);
            
            if (isset($database['users'][$username])) {
                if ($database['users'][$username]['role'] === 'admin') {
                    http_response_code(403); // Forbidden
                    $response = ['error' => true, 'message' => 'Não é possível remover o administrador.'];
                } else {
                    unset($database['users'][$username]);
                    file_put_contents($db_file, json_encode($database, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                    
                    http_response_code(200);
                    $response = ['error' => false, 'message' => 'Usuário removido com sucesso!'];
                }
            } else {
                http_response_code(404); // Not Found
                $response = ['error' => true, 'message' => 'Usuário não encontrado.'];
            }
        } catch (Exception $e) {
            http_response_code(500);
            $response = ['error' => true, 'message' => 'Erro interno do servidor.'];
        }
    } else {
        http_response_code(400);
        $response = ['error' => true, 'message' => 'Nome de usuário é obrigatório.'];
    }
}

echo json_encode($response);
?> 