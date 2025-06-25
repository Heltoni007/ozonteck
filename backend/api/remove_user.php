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
    $requester = $post_data['requester'] ?? null;

    if ($username && $requester) {
        try {
            $database_content = file_get_contents($db_file);
            $database = json_decode($database_content, true);
            $requester_data = $database['users'][$requester] ?? null;
            if (!$requester_data) {
                http_response_code(403);
                $response = ['error' => true, 'message' => 'Usuário solicitante inválido.'];
            } else if (isset($database['users'][$username])) {
                if ($database['users'][$username]['role'] === 'admin') {
                    http_response_code(403); // Forbidden
                    $response = ['error' => true, 'message' => 'Não é possível remover o administrador.'];
                } else if ($requester_data['role'] === 'admin') {
                    // Admin pode remover qualquer usuário (exceto admin)
                    unset($database['users'][$username]);
                    file_put_contents($db_file, json_encode($database, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                    http_response_code(200);
                    $response = ['error' => false, 'message' => 'Usuário removido com sucesso!'];
                } else if ($requester_data['role'] === 'gestor') {
                    // Gestor só pode remover vendedores sob sua gestão
                    if ($database['users'][$username]['role'] === 'vendedor' && isset($database['users'][$username]['gestor_id']) && $database['users'][$username]['gestor_id'] === $requester) {
                        unset($database['users'][$username]);
                        file_put_contents($db_file, json_encode($database, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                        http_response_code(200);
                        $response = ['error' => false, 'message' => 'Usuário removido com sucesso!'];
                    } else {
                        http_response_code(403);
                        $response = ['error' => true, 'message' => 'Gestor só pode remover seus vendedores.'];
                    }
                } else {
                    http_response_code(403);
                    $response = ['error' => true, 'message' => 'Permissão negada.'];
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
        $response = ['error' => true, 'message' => 'Nome de usuário e requester são obrigatórios.'];
    }
}

echo json_encode($response);
?> 