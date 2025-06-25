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
    $gestor_id = $post_data['gestor_id'] ?? null;
    $ativo = isset($post_data['ativo']) ? (bool)$post_data['ativo'] : null;
    $requester = $post_data['requester'] ?? null;

    if ($username && $name && $role && $requester) {
        try {
            $database_content = file_get_contents($db_file);
            $database = json_decode($database_content, true);
            if (!isset($database['users'][$username])) {
                http_response_code(404);
                $response = ['error' => true, 'message' => 'Usuário não encontrado.'];
            } else {
                $requester_data = $database['users'][$requester] ?? null;
                if (!$requester_data) {
                    http_response_code(403);
                    $response = ['error' => true, 'message' => 'Usuário solicitante inválido.'];
                    echo json_encode($response);
                    exit;
                }
                // Não permitir que admin altere o próprio role
                if ($username === 'admin' && $role !== 'admin') {
                    http_response_code(403);
                    $response = ['error' => true, 'message' => 'Não é permitido alterar o papel do administrador.'];
                    echo json_encode($response);
                    exit;
                }
                // Permissões
                if ($requester_data['role'] === 'admin') {
                    // Admin pode editar qualquer usuário
                } else if ($requester_data['role'] === 'gestor') {
                    // Gestor só pode editar vendedores sob sua gestão
                    if ($database['users'][$username]['role'] !== 'vendedor' || $database['users'][$username]['gestor_id'] !== $requester) {
                        http_response_code(403);
                        $response = ['error' => true, 'message' => 'Gestor só pode editar seus vendedores.'];
                        echo json_encode($response);
                        exit;
                    }
                    // Gestor não pode promover para gestor/admin
                    if ($role !== 'vendedor') {
                        http_response_code(403);
                        $response = ['error' => true, 'message' => 'Gestor só pode manter vendedores.'];
                        echo json_encode($response);
                        exit;
                    }
                    // Força vínculo ao próprio gestor
                    $gestor_id = $requester;
                } else {
                    http_response_code(403);
                    $response = ['error' => true, 'message' => 'Permissão negada.'];
                    echo json_encode($response);
                    exit;
                }
                $database['users'][$username]['name'] = $name;
                if ($avatar) $database['users'][$username]['avatar'] = $avatar;
                $database['users'][$username]['role'] = $role;
                if ($gestor_id && $role === 'vendedor') {
                    $database['users'][$username]['gestor_id'] = $gestor_id;
                }
                if (!is_null($ativo)) {
                    $database['users'][$username]['ativo'] = $ativo;
                }
                file_put_contents($db_file, json_encode($database, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                http_response_code(200);
                $response = ['error' => false, 'message' => 'Usuário atualizado com sucesso!'];
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