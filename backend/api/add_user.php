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
    $password = $post_data['password'] ?? null;
    $role = $post_data['role'] ?? 'vendedor';
    $gestor_id = $post_data['gestor_id'] ?? null;
    $ativo = isset($post_data['ativo']) ? (bool)$post_data['ativo'] : true;
    $requester = $post_data['requester'] ?? null; // usuário logado

    if ($username && $password && $role && $requester) {
        try {
            $database_content = file_get_contents($db_file);
            $database = json_decode($database_content, true);
            $requester_data = $database['users'][$requester] ?? null;
            if (!$requester_data) {
                http_response_code(403);
                $response = ['error' => true, 'message' => 'Usuário solicitante inválido.'];
            } else if (isset($database['users'][$username])) {
                http_response_code(409); // Conflict
                $response = ['error' => true, 'message' => 'Este nome de usuário já existe.'];
            } else {
                // Permissões
                if ($requester_data['role'] === 'admin') {
                    // Admin pode criar qualquer usuário
                } else if ($requester_data['role'] === 'gestor') {
                    if ($role !== 'vendedor') {
                        http_response_code(403);
                        $response = ['error' => true, 'message' => 'Gestor só pode criar vendedores.'];
                        echo json_encode($response);
                        exit;
                    }
                    $gestor_id = $requester; // força vínculo ao próprio gestor
                } else {
                    http_response_code(403);
                    $response = ['error' => true, 'message' => 'Permissão negada.'];
                    echo json_encode($response);
                    exit;
                }
                $new_user = [
                    'password' => $password, // Em produção, use password_hash()
                    'name' => ucfirst($username),
                    'avatar' => '\ud83d\udc64',
                    'role' => $role,
                    'ativo' => $ativo
                ];
                if ($role === 'vendedor' && $gestor_id) {
                    $new_user['gestor_id'] = $gestor_id;
                }
                $database['users'][$username] = $new_user;
                file_put_contents($db_file, json_encode($database, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                http_response_code(201); // Created
                $response = ['error' => false, 'message' => 'Usuário adicionado com sucesso!'];
            }
        } catch (Exception $e) {
            http_response_code(500);
            $response = ['error' => true, 'message' => 'Erro interno do servidor.'];
        }
    } else {
        http_response_code(400);
        $response = ['error' => true, 'message' => 'Usuário, senha, role e requester são obrigatórios.'];
    }
}

echo json_encode($response);
?> 