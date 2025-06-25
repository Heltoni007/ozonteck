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
    $name = $post_data['name'] ?? null;
    $avatar = $post_data['avatar'] ?? null;
    $role = $post_data['role'] ?? null;

    if ($username && $name && $role) {
        try {
            $database_content = file_get_contents($db_file);
            $database = json_decode($database_content, true);
            if (!isset($database['users'][$username])) {
                http_response_code(404);
                $response = ['error' => true, 'message' => 'Usuário não encontrado.'];
            } else {
                // Não permitir que admin altere o próprio role para não travar o sistema
                if ($username === 'admin' && $role !== 'admin') {
                    http_response_code(403);
                    $response = ['error' => true, 'message' => 'Não é permitido alterar o papel do administrador.'];
                } else {
                    $database['users'][$username]['name'] = $name;
                    if ($avatar) $database['users'][$username]['avatar'] = $avatar;
                    $database['users'][$username]['role'] = $role;
                    file_put_contents($db_file, json_encode($database, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                    http_response_code(200);
                    $response = ['error' => false, 'message' => 'Usuário atualizado com sucesso!'];
                }
            }
        } catch (Exception $e) {
            http_response_code(500);
            $response = ['error' => true, 'message' => 'Erro interno do servidor.'];
        }
    } else {
        http_response_code(400);
        $response = ['error' => true, 'message' => 'Dados obrigatórios ausentes.'];
    }
}
echo json_encode($response); 