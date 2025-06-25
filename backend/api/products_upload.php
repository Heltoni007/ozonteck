<?php
header('Content-Type: application/json');
$targetDir = '../uploads/';
if (!is_dir($targetDir)) mkdir($targetDir, 0777, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    $file = $_FILES['image'];
    $allowed = ['jpg', 'jpeg', 'png', 'webp'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Formato de imagem não permitido.']);
        exit;
    }
    if ($file['size'] > 2*1024*1024) { // 2MB
        http_response_code(400);
        echo json_encode(['error' => 'Imagem muito grande (máx 2MB).']);
        exit;
    }
    $newName = uniqid('prod_', true) . '.' . $ext;
    $targetFile = $targetDir . $newName;
    if (move_uploaded_file($file['tmp_name'], $targetFile)) {
        echo json_encode(['success' => true, 'url' => 'backend/uploads/' . $newName]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Falha ao salvar imagem.']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Requisição inválida.']);
} 