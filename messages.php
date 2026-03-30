<?php
require_once __DIR__ . '/db.php';

$stmt = $pdo->query('SELECT id, username, email, message, created_at FROM feedback ORDER BY created_at DESC');
$messages = $stmt->fetchAll();
?>
<?php if (empty($messages)) : ?>
  <div class="list-group-item text-muted">Поки що повідомлень немає.</div>
<?php else : ?>
  <?php foreach ($messages as $row) : ?>
    <div class="list-group-item message-item" data-id="<?= (int) $row['id'] ?>">
      <div class="d-flex align-items-start justify-content-between gap-2">
        <div>
          <h3 class="h6 mb-1"><?= htmlspecialchars($row['username']) ?></h3>
          <p class="mb-2"><?= nl2br(htmlspecialchars($row['message'])) ?></p>
          <small class="text-muted"><?= htmlspecialchars($row['email']) ?> · <?= htmlspecialchars($row['created_at']) ?></small>
        </div>
        <button type="button" class="btn btn-outline-danger btn-sm delete-message-btn">Видалити</button>
      </div>
    </div>
  <?php endforeach; ?>
<?php endif; ?>
