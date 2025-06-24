<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$db_file = '../db/database.json';

$response = ['error' => true, 'message' => 'Requisição inválida.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $diagnostic_data = json_decode(file_get_contents("php://input"), true);

    if ($diagnostic_data) {
        try {
            // Adiciona um ID único e a data/hora ao diagnóstico
            $diagnostic_data['id'] = uniqid('diag_', true);
            $diagnostic_data['timestamp'] = date('c');

            $database_content = file_get_contents($db_file);
            $database = json_decode($database_content, true);
            
            // Adiciona o novo diagnóstico ao array
            $database['diagnostics'][] = $diagnostic_data;
            
            // Salva o arquivo de volta no disco
            file_put_contents($db_file, json_encode($database, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            
            http_response_code(200);
            $response = ['error' => false, 'message' => 'Diagnóstico salvo com sucesso!'];

        } catch (Exception $e) {
            http_response_code(500);
            $response = ['error' => true, 'message' => 'Erro interno do servidor ao salvar o diagnóstico.'];
        }
    } else {
        http_response_code(400);
        $response = ['error' => true, 'message' => 'Nenhum dado de diagnóstico recebido.'];
    }
}

echo json_encode($response);
?> 