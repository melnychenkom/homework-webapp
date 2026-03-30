<?php
require_once __DIR__ . '/db.php';

$messages = [];
$stmt = $pdo->query('SELECT id, username, email, message, created_at FROM feedback ORDER BY created_at DESC');
$messages = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BLAST і пошук гомологів</title>
    <link rel="stylesheet" href="style.css" />
    <script src="script.js" defer></script>
  </head>
  <body>
    <header class="hero">
      <div class="container">
        <h1>BLAST і пошук гомологів</h1>
        <p class="subtitle">
          Пошук схожих послідовностей у біологічних базах даних.
        </p>
      </div>
    </header>

    <main class="container">
      <section class="card" id="about">
        <h2>Суть явища</h2>
        <p>
          Гомологи — це біологічні послідовності (ДНК, РНК або білки), які мають
          спільне еволюційне походження. Інструмент BLAST (Basic Local Alignment
          Search Tool) дозволяє швидко знайти у великих базах даних послідовності,
          що мають локальну схожість із вашою запитною послідовністю.
        </p>
        <p>
          Такий пошук використовують для анотації генів, виявлення функціонально
          подібних білків і порівняння організмів на молекулярному рівні.
        </p>
      </section>

      <section class="card" id="workflow">
        <h2>Схема роботи BLAST</h2>
        <ol>
          <li>Введення запитної послідовності (query).</li>
          <li>Розбиття запиту на короткі "слова" (k-mers).</li>
          <li>Пошук збігів цих слів у вибраній базі даних.</li>
          <li>Розширення локальних збігів до вирівнювань.</li>
          <li>Оцінка статистичної значущості результатів.</li>
        </ol>

        <div class="image-placeholder" role="img" aria-label="Плейсхолдер схеми BLAST">
          <img src="img/blast-schema.jpg" alt="Схема роботи BLAST" class="workflow-image" />
        </div>
      </section>

      <section class="card" id="terms">
        <h2>Ключові поняття</h2>
        <div class="terms-grid">
          <article class="term">
            <h3>Hit</h3>
            <p>
              Послідовність у базі даних, яка має значущий збіг із вашим запитом.
              У результатах BLAST один запит може мати багато hits.
            </p>
          </article>
          <article class="term">
            <h3>E-value</h3>
            <p>
              Очікувана кількість випадкових збігів такої ж якості або кращої.
              Чим менше E-value, тим імовірніше, що збіг біологічно значущий.
            </p>
          </article>
          <article class="term">
            <h3>Identity</h3>
            <p>
              Частка однакових позицій у вирівнюванні двох послідовностей, зазвичай
              виражається у відсотках (% identity).
            </p>
          </article>
        </div>
      </section>

      <section class="card" id="example">
        <h2>Приклад результату пошуку</h2>
        <button type="button" id="change-example-btn" class="change-example-btn">
          Змінити приклад
        </button>

        <article class="example-content" id="example-one">
          <p>
            BLASTp-запит: людський фермент DHODH (dihydroorotate dehydrogenase).
            Короткий підсумок таблиці результатів:
          </p>
          <ul>
            <li>
              <strong>Top hit (людина):</strong> 100% identity, 100% query cover,
              E-value = 0.0.
            </li>
            <li>
              <strong>Ссавці (щур, миша):</strong> близько 88% identity при 100%
              покритті.
            </li>
            <li>
              <strong>Бактерії Azospirillum:</strong> 57–58% identity, 88% cover,
              дуже низькі E-value (наприклад, 3e-134).
            </li>
          </ul>
          <p>
            Висновок: DHODH сильно консервативний від ссавців до бактерій.
          </p>
          <div class="image-placeholder" role="img" aria-label="Перший приклад результату BLAST">
            <img src="img/blast-result-dhodh.png" alt="Приклад результату BLAST для DHODH" class="result-image" />
          </div>
        </article>

        <article class="example-content" id="example-two" hidden>
          <p>
            BLASTp (GenPept): мускариновий ацетилхоліновий рецептор M5.
            Короткий підсумок результатів:
          </p>
          <ul>
            <li>
              <strong>Exact match (людина):</strong> 100% query cover і 100.00%
              identity — запит повністю збігається з відомою людською
              послідовністю M5.
            </li>
            <li>
              <strong>Статистична значущість:</strong> E-value = 0.0 для топових
              хітів, тобто збіги не є випадковими.
            </li>
            <li>
              <strong>Еволюційна консервація:</strong> наступні хіти — примати
              (шимпанзе, горила, гібон) з >95% identity і 100% query cover.
            </li>
          </ul>
          <p>
            Висновок: рецептор M5 (GPCR, переважно у ЦНС) є сильно
            еволюційно консервативним серед приматів.
          </p>
          <div class="image-placeholder" role="img" aria-label="Другий приклад результату BLAST">
            <img src="img/blast-result-m5.png" alt="Другий приклад результату BLAST" class="result-image" />
          </div>
        </article>
      </section>

      <section class="card" id="feedback">
        <h2>Зворотній зв'язок</h2>
        <form id="feedback-form" class="feedback-form" action="submit.php" method="post">
          <label for="name">Ім'я</label>
          <input type="text" id="name" name="name" required />

          <label for="email">Email</label>
          <input type="email" id="email" name="email" required />

          <label for="message">Повідомлення</label>
          <textarea id="message" name="message" rows="4" required></textarea>

          <button type="submit" class="change-example-btn">Надіслати</button>
          <p id="form-status" aria-live="polite"></p>
        </form>
      </section>

      <section class="card" id="messages">
        <h2>Повідомлення</h2>
        <?php if (empty($messages)) : ?>
          <p>Поки що повідомлень немає.</p>
        <?php else : ?>
          <div class="messages-list">
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
          </div>
        <?php endif; ?>
      </section>
    </main>
  </body>
</html>
