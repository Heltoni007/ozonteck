<?php
header('Content-Type: application/json');
$databaseFile = '../db/database.json';

function readDatabase($file) {
    return json_decode(file_get_contents($file), true);
}
function writeDatabase($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];
$data = readDatabase($databaseFile);

switch ($method) {
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['produtos']) || !is_array($input['produtos']) || count($input['produtos']) === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados da venda incompletos']);
            exit;
        }
        $venda = [
            'id' => uniqid('sale_', true),
            'cliente' => $input['cliente'] ?? '',
            'produtos' => $input['produtos'],
            'desconto' => $input['desconto'] ?? 0,
            'total' => $input['total'] ?? 0,
            'pagamento' => $input['pagamento'] ?? '',
            'valor_recebido' => $input['valor_recebido'] ?? 0,
            'vendedor' => $input['vendedor'] ?? '',
            'datahora' => date('c')
        ];
        if (!isset($data['sales'])) $data['sales'] = [];
        $data['sales'][] = $venda;
        writeDatabase($databaseFile, $data);
        echo json_encode(['success' => true, 'id' => $venda['id']]);
        break;
    case 'GET':
        // Listar vendas com filtro por role
        $requester = $_GET['requester'] ?? null;
        $role = $_GET['role'] ?? null;
        $sales = $data['sales'] ?? [];
        if ($requester && $role) {
            $users = $data['users'] ?? [];
            if ($role === 'admin') {
                // Admin vê tudo
            } else if ($role === 'gestor') {
                // Gestor vê vendas dos seus vendedores
                $meusVendedores = array_keys(array_filter($users, function($u) use ($requester) {
                    return isset($u['role'], $u['gestor_id']) && $u['role'] === 'vendedor' && $u['gestor_id'] === $requester;
                }));
                $sales = array_filter($sales, function($v) use ($meusVendedores) {
                    return isset($v['vendedor']) && in_array($v['vendedor'], $meusVendedores);
                });
            } else if ($role === 'vendedor') {
                // Vendedor vê só suas vendas
                $sales = array_filter($sales, function($v) use ($requester) {
                    return isset($v['vendedor']) && $v['vendedor'] === $requester;
                });
            } else {
                // Outras roles não veem nada
                $sales = [];
            }
        }
        echo json_encode(array_values($sales));
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
} 