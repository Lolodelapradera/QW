const quizzes = [
  { json: 'json/quizzdates20.json', image: 'dates20.jpg', theme: "Le XXième siècle" },
  { json: 'json/quizzinternet.json', image: 'internet.jpg', theme: "Méandres d'internet" },
  { json: 'json/quizzjavascript.json', image: 'javascript.png', theme: 'Javascript' },
  { json: 'json/quizzmicrosoft.json', image: 'microsoft.jpg', theme: 'Microsoft' },
  { json: 'json/quizznintendo.json', image: 'nintendo.jpg', theme: 'Nintendo' },
  { json: 'json/quizznombres.json', image: 'nombres.jpg', theme: 'Trouver le nombre' },
  { json: 'json/quizzphp.json', image: 'PHP.jpg', theme: 'PHP' },
  { json: 'json/quizzweb.json', image: 'web.jpg', theme: 'Application web' }
];

$(document).ready(function () {
  let quizContents = Array(quizzes.length).fill(null);
  let loadedQuizzes = 0;
  var currentQuestionIndex = 0;
  var correctAnswersCount = 0;



  // Utilisation d'une fonction unique pour gérer l'affichage des quiz
  function displayCards(quizData, image, theme) {
    var cardHtml = `
          <div class="card">
              <h3>${theme}</h3>
              <img src="img/${image}" alt="${theme}">
              <div class="label-quizz">
                  <input type="radio" class="quiz-radio" id="debutant-${theme}" name="level-${theme}" value="debutant">
                  <label for="debutant-${theme}">Débutant</label>
                  <input type="radio" class="quiz-radio" id="confirme-${theme}" name="level-${theme}" value="confirme">
                  <label for="confirme-${theme}">Confirmé</label>
                  <input type="radio" class="quiz-radio" id="expert-${theme}" name="level-${theme}" value="expert">
                  <label for="expert-${theme}">Expert</label>
              </div>
          </div>
      `;
    $('#cards-container').append(cardHtml);
  }

  quizzes.forEach((quiz, index) => {
    $.getJSON(quiz.json, function (data) {
      quizContents[index] = { data: data, image: quiz.image, theme: quiz.theme };
      loadedQuizzes++;
      if (loadedQuizzes === quizzes.length) {
        quizContents.forEach(quiz => {
          if (quiz !== null) {
            displayCards(quiz.data, quiz.image, quiz.theme);
          }
        });
      }
    }).fail(function (jqxhr, textStatus, error) {
      console.error(`Échec de la requête pour ${quiz.json}: ${textStatus}, ${error}`);
      loadedQuizzes++;
    });
  });

  $('#cards-container').on('change', '.quiz-radio', function () {
    var theme = $(this).closest('.card').find('h3').text();
    var level = $(this).val();
    var jsonUrl = quizzes.find(quiz => quiz.theme === theme).json;
    var name = prompt("Veuillez entrer votre prénom pour commencer le quiz.");
    if (name) {
      var image = $(this).closest('.card').find('img').attr('src');
      var summaryHtml = `
          <p class="quiz-summary">${theme} - niveau ${level}</p>
          <span class="user-name">${name}</span>, vous allez pouvoir démarrer ce quiz</p>
          <img src="${image}" alt="${theme}">
          <div class="button-container">
              <button id="start-quiz" data-json="${jsonUrl}" data-theme="${theme}" data-level="${level}">Démarrer le quizz</button>
          </div>
          `;
      $('#summary-page').html(summaryHtml);
      $('#cards-container').hide();
      $('#summary-page').show();
    }
  });

  $(document).on('click', '#start-quiz', function () {
    var theme = $(this).data('theme');
    var level = $(this).data('level');
    var jsonUrl = $(this).data('json');

    // Affichage des questions du quiz
    loadQuiz(theme, level, jsonUrl);

    $('#quiz-page').show();
    $('#summary-page').hide();
  });

  function loadQuiz(theme, level, jsonUrl) {
    var mappedLevel = mapLevelToJSONKey(level);
    $.getJSON(jsonUrl, function (quizData) {
      displayQuestion(quizData.quizz[mappedLevel][0], theme, level);
    }).fail(function () {
      alert('Erreur de chargement du quiz');
    });
  }



  function displayQuestion(questionData, theme, level) {
    $('#quiz-title').html(`${theme} - niveau ${level} `);
    $('#quiz-question').text(`Question ${currentQuestionIndex + 1} - ${questionData.question}`);
    let choicesHtml = questionData.propositions.map((proposition, index) =>
      `<div class="quiz-choice" id="choice-${index}" draggable="true">${proposition}</div>`
    ).join('');

    $('#quiz-choices').html(choicesHtml);

    $('.quiz-choice').draggable({
      revert: "invalid",
      containment: "#quiz-page",
      start: function (event, ui) {
        $(this).addClass('being-dragged');
      },
      stop: function (event, ui) {
        $(this).removeClass('being-dragged');
      }
    });

    $('#drop-zone').droppable({
      accept: ".quiz-choice",
      classes: {
        "ui-droppable-active": "active",
        "ui-droppable-hover": "hover"
      },
      drop: function (event, ui) {
        goodAnswer(ui.draggable, questionData);
      }
    });
  }

  function goodAnswer(draggedItem, questionData) {
    let isCorrect = draggedItem.text() === questionData.reponse;
    if (isCorrect) {
      $('#drop-zone').addClass('correct');
      draggedItem.addClass('correct');
      correctAnswersCount++; // Increment correct answers count
    } else {
      $('#drop-zone').addClass('incorrect');
      $('.quiz-choice').each(function () {
        if ($(this).text() === questionData.reponse) {
          $(this).addClass('correct');
        }
      });
    }
    // Afficher l'anecdote associée à la question, qu'elle soit correcte ou non
    $('#quiz-anecdote').text("Aneccote : " + questionData.anecdote || 'Pas d\'anecdote disponible.');
    $('#next-question').prop('disabled', false); // Activer le bouton Suivant
  }

  //-----------gestion bouton continuer
  $(document).on('click', '#next-question', function () {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.quizz[mappedLevel].length) {
      displayQuestion(quizData.quizz[mappedLevel][currentQuestionIndex], theme, level);
    } else {
      // Fin du quiz
      $('#quiz-page').hide();
      $('#resultpage').show();
      $('#summary-correct-answers').text(`Score: ${correctAnswersCount}/${currentQuestionIndex}`);
    }
  });



  function mapLevelToJSONKey(level) {
    const levelMap = {
      'debutant': 'débutant',
      'confirme': 'confirmé',
      'expert': 'expert'
    };
    return levelMap[level] || level;
  }
});
