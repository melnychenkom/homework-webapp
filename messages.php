<?php
require_once __DIR__ . '/db.php';

$stmt = $pdo->query('SELECT id, username, email, message, created_at FROM feedback ORDER BY created_at DESC');
$messages = $stmt->fetchAll();
?>
<?php if (empty($messages)) : ?>
  <p>Поки що повідомлень немає.</p>
<?php else : ?>
  <?php foreach ($messages as $row) : ?>
    <article class="message-item" data-id="<?= (int) $row['id'] ?>">
      <div class="message-header">
        <h3><?= htmlspecialchars($row['username']) ?></h3>
        <button type="button" class="delete-message-btn">Видалити</button>
      </div>
      <p><?= nl2br(htmlspecialchars($row['message'])) ?></p>
      <p class="message-meta"><?= htmlspecialchars($row['email']) ?> · <?= htmlspecialchars($row['created_at']) ?></p>
    </article>
  <?php endforeach; ?>
<?php endif; ?>
