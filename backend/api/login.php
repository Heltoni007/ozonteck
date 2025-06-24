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

    if ($username && $password) {
        try {
            $database = json_decode(file_get_contents($db_file), true);
            $users = $database['users'] ?? [];

            if (isset($users[$username]) && $users[$username]['password'] === $password) {
                $user_data = $users[$username];
                unset($user_data['password']); // Nunca retorne a senha

                http_response_code(200);
                $response = [
                    'error' => false,
                    'message' => 'Login bem-sucedido!',
                    'user' => $user_data
                ];
            } else {
                http_response_code(401);
                $response = ['error' => true, 'message' => 'Usuário ou senha incorretos.'];
            }
        } catch (Exception $e) {
            http_response_code(500);
            $response = ['error' => true, 'message' => 'Erro interno do servidor.'];
        }
    } else {
        http_response_code(400);
        $response = ['error' => true, 'message' => 'Usuário e senha são obrigatórios.'];
    }
}

echo json_encode($response);
?> 