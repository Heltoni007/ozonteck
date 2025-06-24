<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$db_file = '../db/database.json';

try {
    if (!file_exists($db_file)) {
        throw new Exception("Banco de dados não encontrado.");
    }

    $database = json_decode(file_get_contents($db_file), true);
    $users = $database['users'] ?? [];

    // Remove a senha de cada usuário antes de enviar
    foreach ($users as $username => &$user_data) {
        unset($user_data['password']);
    }

    http_response_code(200);
    echo json_encode($users);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
?> 