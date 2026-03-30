<!DOCTYPE html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>BLAST і пошук гомологів</title>
    <link rel="icon" type="image/x-icon" href="assets/favicon.ico" />
    <script src="https://use.fontawesome.com/releases/v6.3.0/js/all.js" crossorigin="anonymous"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet" type="text/css" />
    <link href="https://fonts.googleapis.com/css?family=Lato:400,700,400italic,700italic" rel="stylesheet" type="text/css" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="css/styles.css" />
    <link rel="stylesheet" href="css/custom.css" />
  </head>
  <body>
    <nav class="navbar navbar-expand-lg bg-secondary text-uppercase sticky-top" id="mainNav">
      <div class="container">
        <a class="navbar-brand" href="#page-top">BLAST</a>
        <button
          class="navbar-toggler text-uppercase font-weight-bold bg-primary text-white rounded"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarResponsive"
          aria-controls="navbarResponsive"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          Menu
          <i class="fas fa-bars"></i>
        </button>
        <div class="collapse navbar-collapse" id="navbarResponsive">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="#about">Суть</a></li>
            <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="#workflow">Схема</a></li>
            <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="#terms">Поняття</a></li>
            <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="#example">Приклад</a></li>
            <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="#feedback">Форма</a></li>
            <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="#messages">Повідомлення</a></li>
          </ul>
        </div>
      </div>
    </nav>
    <main class="container">
      <section class="card mb-3" id="about">
        <div class="card-header">
          <h2 class="card-title">Суть явища</h2>
        </div>
        <div class="card-body">
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
        </div>
      </section>

      <section class="card mb-3" id="workflow">
        <div class="card-header">
          <h2 class="card-title">Схема роботи BLAST</h2>
        </div>
        <div class="card-body">
        <ol>
          <li>Введення запитної послідовності (query).</li>
          <li>Розбиття запиту на короткі "слова" (k-mers).</li>
          <li>Пошук збігів цих слів у вибраній базі даних.</li>
          <li>Розширення локальних збігів до вирівнювань.</li>
          <li>Оцінка статистичної значущості результатів.</li>
        </ol>

        <div class="image-placeholder" role="img" aria-label="Плейсхолдер схеми BLAST">
          <img src="assets/img/blast-schema.jpg" alt="Схема роботи BLAST" class="workflow-image image-native"/>
        </div>
        </div>
      </section>

      <section class="card mb-3" id="terms">
        <div class="card-header">
          <h2 class="card-title">Ключові поняття</h2>
        </div>
        <div class="card-body">
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
        </div>
      </section>

      <section class="card mb-3" id="example">
        <div class="card-header">
          <div class="d-flex align-items-center justify-content-between gap-2">
            <h2 class="card-title mb-0">Приклад результату пошуку</h2>
            <button type="button" id="change-example-btn" class="btn btn-dark">
              Змінити приклад
            </button>
          </div>
        </div>
        <div class="card-body">

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
            <img src="assets/img/blast-result-dhodh.png" alt="Приклад результату BLAST для DHODH" class="result-image" />
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
            <img src="assets/img/blast-result-m5.png" alt="Другий приклад результату BLAST" class="result-image" />
          </div>
        </article>
        </div>
      </section>

      <section class="card mb-3" id="feedback">
        <div class="card-header">
          <h2 class="card-title">Зворотній зв'язок</h2>
        </div>
        <div class="card-body">
          <form id="feedback-form" action="submit.php" method="post">
          <div class="mb-3">
            <label for="name" class="form-label">Ім'я</label>
            <input type="text" id="name" name="name" class="form-control" required />
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" id="email" name="email" class="form-control" required />
          </div>

          <div class="mb-3">
            <label for="message" class="form-label">Повідомлення</label>
            <textarea id="message" name="message" rows="4" class="form-control" required></textarea>
          </div>

          <button type="submit" class="btn btn-dark">Надіслати</button>
          <p id="form-status" class="mt-2 fw-semibold" aria-live="polite"></p>
          </form>
        </div>
      </section>

      <section class="card mb-3" id="messages">
        <div class="card-header">
          <h2 class="card-title">Повідомлення</h2>
        </div>
        <div class="card-body">
          <div
            class="messages-list list-group"
            hx-get="messages.php"
            hx-trigger="load, feedback:submitted from:body, message:deleted from:body"
            hx-swap="innerHTML"
          >
            <p>Завантаження повідомлень...</p>
          </div>
        </div>
      </section>
    </main>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/scripts.js"></script>
    <script src="https://unpkg.com/htmx.org@1.9.12"></script>
  </body>
</html>
