<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Дозволено тільки POST-запит.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Заповніть усі поля форми.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Вкажіть коректний email.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt = $pdo->prepare('INSERT INTO feedback (username, email, message) VALUES (?, ?, ?)');
$stmt->execute([$name, $email, $message]);

echo json_encode([
    'success' => true,
    'message' => "Дякуємо, {$name}! Ваше повідомлення отримано."
], JSON_UNESCAPED_UNICODE);
