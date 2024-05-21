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
  let quizContents = [];  // Initialisation de quizContents comme tableau vide
  let loadedQuizzes = 0;
  let quizState = {
    currentQuestionIndex: 0,
    correctAnswersCount: 0,
    quizData: null,
    theme: null,
    level: null,
    mappedLevel: null
  };
// correspondance level choisi & level sur json
  function mapLevelToJSONKey(level) {
    const levelMap = {
      'debutant': 'débutant',
      'confirme': 'confirmé',
      'expert': 'expert'
    };
    return levelMap[level] || level;
  }

  quizzes.forEach((quiz, index) => {
    $.getJSON(quiz.json, function (data) {
      if (!quizContents[index]) {
        quizContents[index] = { data: data, image: quiz.image, theme: quiz.theme };
        loadedQuizzes++;
        if (loadedQuizzes === quizzes.length) {
          quizContents.forEach(quiz => {
            displayCards(quiz.data, quiz.image, quiz.theme);
          });
        }
      }
    }).fail(function (jqxhr, textStatus, error) {
      console.error(`Échec de la requête pour ${quiz.json}: ${textStatus}, ${error}`);
      loadedQuizzes++;
    });
  });
//--------- HTLM des cards-----------------
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

  $('#cards-container').on('change', '.quiz-radio', function () {
    var card = $(this).closest('.card');
    quizState.theme = card.find('h3').text();
    quizState.level = $(this).val();
    const quizIndex = quizzes.findIndex(quiz => quiz.theme === quizState.theme);
    quizState.quizData = quizContents[quizIndex];
// username
    var username = prompt("Veuillez entrer votre prénom pour commencer le quiz.");
    if (username) {
      quizState.username = username; 

      //--------------- htlm page summary-----------
      var image = card.find('img').attr('src');
      var summaryHtml = `
          <p class="quiz-summary">${quizState.theme} - niveau ${quizState.level}</p>
          <span class="user-name">${username}</span>, vous allez pouvoir démarrer ce quiz</p>
          <img src="${image}" alt="${quizState.theme}">
          <div class="button-container">
              <button id="start-quiz" data-theme="${quizState.theme}" data-level="${quizState.level}">Démarrer le quizz</button>
          </div>
          `;
      $('#summary-page').html(summaryHtml);
      $('#cards-container').hide();
      $('#summary-page').show();
    }
  });

  $(document).on('click', '#start-quiz', function () {
    loadQuiz(quizState.theme, quizState.level, quizState.quizData);
    $('#quiz-page').show();
    $('#summary-page').hide();
  });
// chargement quizz & level choisi
  function loadQuiz(theme, level, quizData) {
    quizState.mappedLevel = mapLevelToJSONKey(level);
    if (quizData.data.quizz[quizState.mappedLevel] && quizData.data.quizz[quizState.mappedLevel].length > 0) {
      displayQuestion(quizData.data.quizz[quizState.mappedLevel][0]);
    } else {
      console.log('Erreur de chargement du quiz ou niveau non disponible');
    }
  }
// load questions du quizz choisi
  function displayQuestion(questionData) {
    // reset du css de l'anecdote
    $('#quiz-anecdote').removeAttr('style').empty();
    $('#quiz-title').html(`${quizState.theme} - niveau ${quizState.level}`);
    $('#quiz-question').text(`Question ${quizState.currentQuestionIndex + 1}: ${questionData.question}`);
    let choicesHtml = questionData.propositions.map((proposition, index) =>
      `<div class="quiz-choice" id="choice-${index}" draggable="true">${proposition}</div>`
    ).join('');

    $('#quiz-choices').html(choicesHtml);

    $('#next-question').prop('disabled', true);

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
        let droppedAnswer = ui.draggable.text();
        checkAnswer(droppedAnswer);
      }
    });
  }
// page score
  function showFinalScore() {
    $('#quiz-page').hide();
    $('#resultpage').show();
    var finalScoreHtml = `
    <p class="quiz-summary">${quizState.theme} - niveau ${quizState.level}</p>
        <h2>Résultat final</h2>
        <span class="user-name">${quizState.username}</span>  Vous avez obtenu le score de <span id="finalscore"> ${quizState.correctAnswersCount} sur ${quizState.quizData.data.quizz[quizState.mappedLevel].length}</span>
        <button ID=reload onclick="location.reload();">Accueil</button>
      `;
    $('#resultpage').html(finalScoreHtml).show();
  }

//vérification réponse
  function checkAnswer(answer) {
    const normalizedGivenAnswer = answer.trim().toLowerCase();
    const questionData = quizState.quizData.data.quizz[quizState.mappedLevel][quizState.currentQuestionIndex];
    if (!questionData) {
      console.log('Erreur de chargement des données de la question.');
      return;
    }
    const normalizedCorrectAnswer = questionData.réponse.trim().toLowerCase();

    let dropZone = $('#drop-zone');
    dropZone.removeClass('correct incorrect'); // Nettoyer les classes précédentes

    if (normalizedGivenAnswer === normalizedCorrectAnswer) {
      dropZone.addClass('correct');
      quizState.correctAnswersCount++;
    } else {
      dropZone.addClass('incorrect');
    }
     // Trouver l'élément qui représente la bonne réponse
     $('.quiz-choice').each(function() {
      if ($(this).text().trim().toLowerCase() === normalizedCorrectAnswer) {
        $(this).css('background-color', 'green'); // Ajouter un fond vert
      }
    });

    // Afficher l'anecdote associée à la question
    $('#quiz-anecdote').text("Anecdote : " + questionData.anecdote || 'Pas d\'anecdote disponible.');
    $('#next-question').prop('disabled', false); // Activer le bouton Suivant

    $('.quiz-choice').draggable('disable');

     // Si dernière question, changer le texte du bouton Suivant et préparer pour afficher le score
     if (quizState.currentQuestionIndex === quizState.quizData.data.quizz[quizState.mappedLevel].length - 1) {
      $('#next-question').text('Voir le score final').off('click').on('click', showFinalScore);
    } else {
      // Préparer le bouton Suivant pour permettre le passage à la question suivante
      $('#next-question').prop('disabled', false);
    }
  }



  function moveToNextQuestion() {
    // Réinitialiser le CSS de la drop-zone
    $('#drop-zone').removeClass('correct incorrect');
    quizState.currentQuestionIndex++;
    if (quizState.currentQuestionIndex < quizState.quizData.data.quizz[quizState.mappedLevel].length) {
      displayQuestion(quizState.quizData.data.quizz[quizState.mappedLevel][quizState.currentQuestionIndex]);
    } else {
      showFinalScore();
    }
  }

  $('#next-question').on('click', function () {
    moveToNextQuestion();
  });



  
});
