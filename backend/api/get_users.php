<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$db_file = '../db/database.json';

$requester = $_GET['requester'] ?? $_POST['requester'] ?? null;
$role = $_GET['role'] ?? $_POST['role'] ?? null;

try {
    if (!file_exists($db_file)) {
        throw new Exception("Banco de dados não encontrado.");
    }

    $database = json_decode(file_get_contents($db_file), true);
    $users = $database['users'] ?? [];

    // Filtro por gestor
    if ($requester && $role === 'gestor' && isset($users[$requester])) {
        $users = array_intersect_key($users, array_filter($users, function($u, $username) use ($requester) {
            return ($u['role'] === 'vendedor' && isset($u['gestor_id']) && $u['gestor_id'] === $requester) || $u['role'] === 'gestor' || $u['role'] === 'admin';
        }, ARRAY_FILTER_USE_BOTH));
    }

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