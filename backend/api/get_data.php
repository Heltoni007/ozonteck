<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$db_file = '../db/database.json';

try {
    if (!file_exists($db_file)) {
        throw new Exception("Banco de dados não encontrado.");
    }

    $database = json_decode(file_get_contents($db_file), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erro ao decodificar o JSON do banco de dados.");
    }

    $response_data = [
        'clientPriorities' => $database['clientPriorities'],
        'questions' => $database['questions'],
        'productDatabase' => $database['productDatabase'],
        'productProtocols' => $database['productProtocols'] ?? [] // Novo campo para protocolos
    ];

    // Log para debug (remover em produção)
    error_log("Dados carregados: " . count($response_data['productDatabase']) . " produtos, " . 
              count($response_data['questions']) . " perguntas, " . 
              count($response_data['clientPriorities']) . " prioridades, " .
              count($response_data['productProtocols']) . " protocolos");

    http_response_code(200);
    echo json_encode($response_data);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
?>