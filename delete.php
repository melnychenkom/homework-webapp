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

$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
if (!$id) {
	http_response_code(422);
	echo json_encode([
		'success' => false,
		'message' => 'Некоректний ідентифікатор.'
	], JSON_UNESCAPED_UNICODE);
	exit;
}

$stmt = $pdo->prepare('DELETE FROM feedback WHERE id = ?');
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) {
	http_response_code(404);
	echo json_encode([
		'success' => false,
		'message' => 'Повідомлення не знайдено.'
	], JSON_UNESCAPED_UNICODE);
	exit;
}

echo json_encode([
	'success' => true,
	'message' => 'Повідомлення видалено.'
], JSON_UNESCAPED_UNICODE);