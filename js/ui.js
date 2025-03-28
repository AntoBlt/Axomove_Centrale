/**
 * AxoDodge - Gestion de l'interface utilisateur
 * Gère toutes les interactions avec l'interface
 */
class UI {
  constructor(game) {
    // Référence à l'instance du jeu
    this.game = game;

    // Éléments d'écran
    this.screens = {
      intro: document.getElementById("intro-screen"),
      game: document.getElementById("game-screen"),
      pause: document.getElementById("pause-screen"),
      gameOver: document.getElementById("gameover-screen"),
      advancedSettings: document.getElementById("advanced-settings-screen"),
      help: document.getElementById("help-screen"),
    };

    // Éléments du HUD
    this.hudElements = {
      score: document.getElementById("score"),
      lives: document.getElementById("lives-container"),
      timer: document.getElementById("timer"),
      currentDifficulty: document.getElementById("current-difficulty"),
      levelIndicator: document.getElementById("level-indicator"),
      progressionContainer: document.getElementById("progression-container"),
      levelProgress: document.getElementById("level-progress"),
      nextLevelTime: document.getElementById("next-level-time"),
      comboContainer: document.getElementById("combo-container"),
      comboCounter: document.getElementById("combo-counter"),
      comboMultiplier: document.getElementById("combo-multiplier"),
      notificationArea: document.getElementById("notification-area"),
      countdown: document.getElementById("countdown"),
      countdownContainer: document.getElementById("countdown-container"),
      positionOutlineContainer: document.getElementById(
        "position-outline-container"
      ),
      positionOutline: document.getElementById("position-outline"),
      positionTimer: document.getElementById("position-timer"),
      positionSeconds: document.getElementById("position-seconds"),
    };

    // Boutons et contrôles
    this.controls = {
      // Écran d'intro
      startGameBtn: document.getElementById("start-game-btn"),
      advancedSettingsBtn: document.getElementById("advanced-settings-btn"),
      difficultyBtns: document.querySelectorAll(".difficulty-btn"),

      // HUD du jeu
      zenModeBtn: document.getElementById("zen-mode-btn"),
      pauseBtn: document.getElementById("pause-btn"),
      soundBtn: document.getElementById("sound-btn"),

      // Écran de pause
      resumeBtn: document.getElementById("resume-btn"),
      restartBtn: document.getElementById("restart-btn"),
      zenModeToggle: document.getElementById("zen-mode-toggle"),
      skeletonToggle: document.getElementById("skeleton-toggle"),
      videoToggle: document.getElementById("video-toggle"),
      silhouetteToggle: document.getElementById("silhouette-toggle"),
      pauseAdvancedSettingsBtn: document.getElementById(
        "pause-advanced-settings-btn"
      ),
      helpBtn: document.getElementById("help-btn"),

      // Écran de fin de partie
      playAgainBtn: document.getElementById("play-again-btn"),
      shareBtn: document.getElementById("share-btn"),
      gameoverZenToggle: document.getElementById("gameover-zen-toggle"),

      // Écran de paramètres avancés
      closeAdvancedSettingsBtn: document.getElementById(
        "close-advanced-settings-btn"
      ),
      advancedDifficultyBtns: document.querySelectorAll(
        ".advanced-difficulty-btn"
      ),
      resetSettingsBtn: document.getElementById("reset-settings-btn"),
      saveSettingsBtn: document.getElementById("save-settings-btn"),

      // Curseurs de paramètres personnalisés
      spawnInterval: document.getElementById("spawn-interval"),
      initialRadius: document.getElementById("initial-radius"),
      growthFactor: document.getElementById("growth-factor"),
      warningTime: document.getElementById("warning-time"),
      progressiveIncrease: document.getElementById("progressive-increase"),

      // Affichage des valeurs des curseurs
      spawnIntervalValue: document.getElementById("spawn-interval-value"),
      initialRadiusValue: document.getElementById("initial-radius-value"),
      growthFactorValue: document.getElementById("growth-factor-value"),
      warningTimeValue: document.getElementById("warning-time-value"),

      // Écran d'aide
      closeHelpBtn: document.getElementById("close-help-btn"),
      backFromHelpBtn: document.getElementById("back-from-help-btn"),
    };

    // État de l'interface
    this.currentScreen = "intro";

    // Attacher les gestionnaires d'événements
    this.attachEventListeners();
  }

  /**
   * Attache tous les gestionnaires d'événements
   */
  attachEventListeners() {
    // Écran d'intro
    this.controls.startGameBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.game.start();
    });

    this.controls.advancedSettingsBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.showScreen("advancedSettings");
    });

    // Boutons de difficulté
    this.controls.difficultyBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        soundManager.playButtonClick();
        this.setActiveDifficultyButton(btn);
        this.game.setDifficulty(btn.getAttribute("data-difficulty"));
      });
    });

    // Contrôles du jeu
    this.controls.zenModeBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.toggleZenMode();
    });

    this.controls.pauseBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.game.togglePause();
    });

    this.controls.soundBtn.addEventListener("click", () => {
      this.toggleSound();
    });

    // Écran de pause
    this.controls.resumeBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.game.togglePause();
    });

    this.controls.restartBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.game.restart();
    });

    this.controls.zenModeToggle.addEventListener("change", () => {
      soundManager.playButtonClick();
      this.toggleZenMode();
    });

    this.controls.skeletonToggle.addEventListener("change", () => {
      soundManager.playButtonClick();
      this.game.toggleSkeleton(this.controls.skeletonToggle.checked);
    });

    this.controls.videoToggle.addEventListener("change", () => {
      soundManager.playButtonClick();
      this.game.toggleVideo(this.controls.videoToggle.checked);
    });

    this.controls.silhouetteToggle.addEventListener("change", () => {
      soundManager.playButtonClick();
      this.game.poseDetector.toggleSilhouette(
        this.controls.silhouetteToggle.checked
      );
    });

    this.controls.pauseAdvancedSettingsBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.showScreen("advancedSettings");
    });

    this.controls.helpBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.showScreen("help");
    });

    // Écran de fin de partie
    this.controls.playAgainBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.game.restart();
    });

    this.controls.shareBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.shareScore();
    });

    this.controls.gameoverZenToggle.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.toggleZenMode();
      this.game.restart();
    });

    // Écran de paramètres avancés
    this.controls.advancedDifficultyBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        soundManager.playButtonClick();
        this.setActiveAdvancedDifficultyButton(btn);

        const difficulty = btn.getAttribute("data-difficulty");
        this.game.setDifficulty(difficulty);

        // Afficher/masquer les paramètres personnalisés
        if (difficulty === "custom") {
          document.getElementById("custom-settings").classList.remove("hidden");
        } else {
          document.getElementById("custom-settings").classList.add("hidden");
        }
      });
    });

    this.controls.closeAdvancedSettingsBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.hideScreen("advancedSettings");
    });

    this.controls.resetSettingsBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.resetCustomSettings();
    });

    this.controls.saveSettingsBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.saveCustomSettings();
      this.hideScreen("advancedSettings");
    });

    // Curseurs de paramètres personnalisés
    this.controls.spawnInterval.addEventListener("input", () => {
      this.updateCustomSettingValue("spawn-interval");
    });

    this.controls.initialRadius.addEventListener("input", () => {
      this.updateCustomSettingValue("initial-radius");
    });

    this.controls.growthFactor.addEventListener("input", () => {
      this.updateCustomSettingValue("growth-factor");
    });

    this.controls.warningTime.addEventListener("input", () => {
      this.updateCustomSettingValue("warning-time");
    });

    // Écran d'aide
    this.controls.closeHelpBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.hideScreen("help");
    });

    this.controls.backFromHelpBtn.addEventListener("click", () => {
      soundManager.playButtonClick();
      this.hideScreen("help");
    });

    // Touche d'échappement pour pause
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.currentScreen === "game") {
        this.game.togglePause();
      }
    });
  }

  /**
   * Affiche un écran spécifique
   * @param {string} screenName - Nom de l'écran à afficher
   */
  showScreen(screenName) {
    // Masquer tous les écrans
    Object.values(this.screens).forEach((screen) => {
      screen.classList.add("hidden");
    });

    // Afficher l'écran demandé
    this.screens[screenName].classList.remove("hidden");
    this.currentScreen = screenName;

    // Mettre à jour l'état du jeu en fonction de l'écran
    if (screenName === "game") {
      // S'assurer que le HUD est visible
      document.getElementById("hud").classList.remove("hidden");
    }

    // Mettre à jour l'interface en fonction de l'écran
    if (screenName === "advancedSettings") {
      this.updateCustomSettingsUI();
    }
  }

  /**
   * Affiche le contour de positionnement
   * @param {Function} onPositioned - Fonction à appeler quand le joueur est positionné
   */
  showPositionOutline(onPositioned) {
    // Afficher le conteneur du contour
    this.hudElements.positionOutlineContainer.classList.remove("hidden");

    // Réinitialiser l'état du contour
    this.hudElements.positionOutline.classList.remove("correct", "pulsating");
    this.hudElements.positionTimer.classList.remove("visible");
    this.hudElements.positionSeconds.textContent = "3";

    // Centre du canvas
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Dimensions du contour
    const outline = this.hudElements.positionOutline;
    const outlineWidth = outline.offsetWidth;
    const outlineHeight = outline.offsetHeight;

    // Centrer le contour
    outline.style.position = "absolute";
    outline.style.left = `${centerX - outlineWidth / 2}px`;
    outline.style.top = `${centerY - outlineHeight / 2}px`;

    // État de la vérification
    let isPositionCorrect = false;
    let positionTimer = 0;
    let countdownStarted = false;

    // Obtenir les limites du contour pour la vérification
    const outlineBounds = {
      x: centerX - outlineWidth / 2,
      y: centerY - outlineHeight / 2,
      width: outlineWidth,
      height: outlineHeight,
    };

    // Fonction pour vérifier la position du joueur
    const checkPosition = () => {
      // Vérifier si le joueur est à l'intérieur du contour
      const inPosition =
        this.game.poseDetector.checkPlayerInOutline(outlineBounds);

      // Mettre à jour l'apparence du contour
      if (inPosition) {
        if (!isPositionCorrect) {
          isPositionCorrect = true;
          this.hudElements.positionOutline.classList.add("correct");
          soundManager.playBonusCollect();

          // Démarrer le compte à rebours si ce n'est pas déjà fait
          if (!countdownStarted) {
            countdownStarted = true;
            this.hudElements.positionTimer.classList.add("visible");
            this.hudElements.positionOutline.classList.add("pulsating");
          }
        }

        // Incrémenter le timer si le joueur est bien positionné
        positionTimer += 1 / 60; // Environ 60 FPS

        // Mise à jour du compteur
        const remainingSeconds = Math.ceil(3 - positionTimer);
        this.hudElements.positionSeconds.textContent = remainingSeconds;

        // Si le temps est écoulé, terminer
        if (positionTimer >= 3) {
          // Nettoyer l'intervalle
          clearInterval(checkInterval);

          // Jouer un son de succès
          soundManager.play("positionSuccess", { volume: 0.7 });

          // Masquer le contour avec une animation
          this.hudElements.positionOutlineContainer.classList.add("fade-out");

          setTimeout(() => {
            this.hudElements.positionOutlineContainer.classList.add("hidden");
            this.hudElements.positionOutlineContainer.classList.remove(
              "fade-out"
            );

            // Afficher une notification de succès
            this.showNotification("Position correcte !", "success");

            // Appeler la fonction de callback
            if (onPositioned) onPositioned();
          }, 500);
        }
      } else {
        // Si le joueur sort du contour, réinitialiser
        if (isPositionCorrect) {
          isPositionCorrect = false;
          countdownStarted = false;
          positionTimer = 0;
          this.hudElements.positionOutline.classList.remove(
            "correct",
            "pulsating"
          );
          this.hudElements.positionTimer.classList.remove("visible");
          this.hudElements.positionSeconds.textContent = "3";
          soundManager.playBallHit();
        }
      }
    };

    // Vérifier la position régulièrement
    const checkInterval = setInterval(checkPosition, 1000 / 60);
  }

  /**
   * Masque un écran spécifique et revient à l'écran précédent
   * @param {string} screenName - Nom de l'écran à masquer
   */
  hideScreen(screenName) {
    this.screens[screenName].classList.add("hidden");

    // Revenir à l'écran approprié
    if (this.game.isRunning && !this.game.isGameOver) {
      if (this.game.isPaused) {
        this.showScreen("pause");
      } else {
        this.showScreen("game");
      }
    } else if (this.game.isGameOver) {
      this.showScreen("gameOver");
    } else {
      this.showScreen("intro");
    }
  }

  /**
   * Active le bouton de difficulté sélectionné
   * @param {HTMLElement} selectedBtn - Bouton sélectionné
   */
  setActiveDifficultyButton(selectedBtn) {
    this.controls.difficultyBtns.forEach((btn) => {
      btn.classList.remove("active");
    });
    selectedBtn.classList.add("active");
  }

  /**
   * Active le bouton de difficulté avancée sélectionné
   * @param {HTMLElement} selectedBtn - Bouton sélectionné
   */
  setActiveAdvancedDifficultyButton(selectedBtn) {
    this.controls.advancedDifficultyBtns.forEach((btn) => {
      btn.classList.remove("active");
    });
    selectedBtn.classList.add("active");
  }

  /**
   * Met à jour l'affichage d'un paramètre personnalisé
   * @param {string} settingId - ID du paramètre
   */
  updateCustomSettingValue(settingId) {
    const slider = document.getElementById(settingId);
    const valueDisplay = document.getElementById(`${settingId}-value`);

    if (slider && valueDisplay) {
      let value = parseFloat(slider.value);

      // Formater la valeur avec une décimale
      if (settingId !== "initial-radius") {
        value = value.toFixed(1);
      }

      // Ajouter le suffixe approprié
      if (settingId === "spawn-interval" || settingId === "warning-time") {
        valueDisplay.textContent = `${value}s`;
      } else if (settingId === "initial-radius") {
        valueDisplay.textContent = `${value}px`;
      } else if (settingId === "growth-factor") {
        valueDisplay.textContent = `${value}x`;
      }
    }
  }

  /**
   * Met à jour l'interface des paramètres personnalisés
   */
  updateCustomSettingsUI() {
    // Mettre à jour les valeurs affichées
    this.updateCustomSettingValue("spawn-interval");
    this.updateCustomSettingValue("initial-radius");
    this.updateCustomSettingValue("growth-factor");
    this.updateCustomSettingValue("warning-time");

    // Mettre à jour le bouton de difficulté actif
    const difficulty = this.game.difficulty;
    this.controls.advancedDifficultyBtns.forEach((btn) => {
      if (btn.getAttribute("data-difficulty") === difficulty) {
        this.setActiveAdvancedDifficultyButton(btn);
      }
    });

    // Afficher/masquer les paramètres personnalisés
    if (difficulty === "custom") {
      document.getElementById("custom-settings").classList.remove("hidden");
    } else {
      document.getElementById("custom-settings").classList.add("hidden");
    }

    // Mettre à jour l'état de la case à cocher d'augmentation progressive
    this.controls.progressiveIncrease.checked = this.game.progressiveIncrease;
  }

  /**
   * Réinitialise les paramètres personnalisés
   */
  resetCustomSettings() {
    // Réinitialiser les curseurs aux valeurs par défaut
    this.controls.spawnInterval.value = 5.0;
    this.controls.initialRadius.value = 20;
    this.controls.growthFactor.value = 6.0;
    this.controls.warningTime.value = 3.0;
    this.controls.progressiveIncrease.checked = false;

    // Mettre à jour l'affichage
    this.updateCustomSettingValue("spawn-interval");
    this.updateCustomSettingValue("initial-radius");
    this.updateCustomSettingValue("growth-factor");
    this.updateCustomSettingValue("warning-time");
  }

  /**
   * Enregistre les paramètres personnalisés
   */
  saveCustomSettings() {
    // Récupérer les valeurs des curseurs
    const customSettings = {
      spawnInterval: parseFloat(this.controls.spawnInterval.value),
      initialRadius: parseInt(this.controls.initialRadius.value),
      growthFactor: parseFloat(this.controls.growthFactor.value),
      warningTime: parseFloat(this.controls.warningTime.value),
      progressiveIncrease: this.controls.progressiveIncrease.checked,
    };

    // Appliquer les paramètres au jeu
    this.game.applyCustomSettings(customSettings);

    // Afficher une notification
    this.showNotification("Paramètres sauvegardés", "success");
  }

  /**
   * Active/désactive le mode Zen
   */
  toggleZenMode() {
    const zenMode = !this.game.zenMode;
    this.game.setZenMode(zenMode);

    // Mettre à jour l'interface
    this.updateZenModeUI();
  }

  /**
   * Met à jour l'interface du mode Zen
   */
  updateZenModeUI() {
    const zenMode = this.game.zenMode;

    // Mettre à jour le bouton et le toggle
    this.controls.zenModeBtn.classList.toggle("active", zenMode);
    this.controls.zenModeToggle.checked = zenMode;

    // Mettre à jour l'effet visuel
    document
      .getElementById("game-container")
      .classList.toggle("zen-mode-active", zenMode);

    // Mettre à jour l'info du Game Over
    document
      .getElementById("zen-mode-info")
      .classList.toggle("hidden", !zenMode);
  }

  /**
   * Active/désactive le son
   */
  toggleSound() {
    const muted = !soundManager.isMuted;
    soundManager.setMuted(muted);

    // Mettre à jour l'interface
    this.controls.soundBtn.innerHTML = muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  }

  /**
   * Met à jour l'affichage du score
   * @param {number} score - Score actuel
   * @param {boolean} animate - Animer le changement
   */
  updateScore(score, animate = false) {
    this.hudElements.score.textContent = score;

    if (animate) {
      this.hudElements.score.classList.add("score-animate");
      setTimeout(() => {
        this.hudElements.score.classList.remove("score-animate");
      }, 300);
    }
  }

  /**
   * Met à jour l'affichage des vies
   * @param {number} lives - Nombre de vies restantes
   */
  updateLives(lives) {
    const heartsHtml = Array(lives)
      .fill('<i class="fas fa-heart text-red-500 text-2xl"></i>')
      .join("");

    this.hudElements.lives.innerHTML = heartsHtml;
  }

  /**
   * Met à jour l'affichage du chronomètre
   * @param {number} time - Temps écoulé en secondes
   */
  updateTimer(time) {
    const minutes = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    this.hudElements.timer.textContent = `${minutes}:${seconds}`;
  }

  /**
   * Met à jour l'affichage de la difficulté
   * @param {string} difficulty - Nom de la difficulté
   * @param {number} level - Niveau actuel (pour le mode progressif)
   */
  updateDifficulty(difficulty, level = null) {
    // Traduction des noms de difficulté
    const difficultyNames = {
      easy: "Facile",
      medium: "Moyen",
      hard: "Difficile",
      progressive: "Progressif",
      custom: "Personnalisé",
    };

    this.hudElements.currentDifficulty.textContent =
      difficultyNames[difficulty] || difficulty;

    // Afficher/masquer l'indicateur de niveau
    if (difficulty === "progressive" && level !== null) {
      this.hudElements.levelIndicator.textContent = `Niv. ${level}`;
      this.hudElements.levelIndicator.classList.remove("hidden");

      // Afficher la barre de progression
      this.hudElements.progressionContainer.classList.remove("hidden");
    } else {
      this.hudElements.levelIndicator.classList.add("hidden");
      this.hudElements.progressionContainer.classList.add("hidden");
    }
  }

  /**
   * Met à jour la barre de progression du niveau
   * @param {number} progress - Progression (0-100)
   * @param {number} timeLeft - Temps restant avant le prochain niveau
   */
  updateLevelProgress(progress, timeLeft) {
    this.hudElements.levelProgress.style.width = `${progress}%`;
    this.hudElements.nextLevelTime.textContent = `${Math.ceil(timeLeft)}s`;
  }

  /**
   * Met à jour l'affichage du combo
   * @param {number} combo - Nombre de combos
   * @param {number} multiplier - Multiplicateur actuel
   */
  updateCombo(combo, multiplier) {
    // Afficher/masquer le compteur de combo
    if (combo > 0) {
      this.hudElements.comboContainer.classList.remove("hidden");
      this.hudElements.comboCounter.textContent = combo;
      this.hudElements.comboMultiplier.textContent = `x${multiplier.toFixed(
        1
      )}`;

      // Activer l'animation si le combo est élevé
      this.hudElements.comboContainer.classList.toggle("active", combo >= 3);
    } else {
      this.hudElements.comboContainer.classList.add("hidden");
    }
  }

  /**
   * Affiche une notification
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success, warning, error, combo)
   */
  showNotification(message, type = "info") {
    // Créer l'élément de notification
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Ajouter au conteneur
    this.hudElements.notificationArea.appendChild(notification);

    // Supprimer après l'animation
    setTimeout(() => {
      notification.remove();
    }, 1500);
  }

  /**
   * Affiche le compte à rebours initial
   * @param {Function} callback - Fonction à appeler à la fin du compte à rebours
   */
  showCountdown(callback) {
    this.hudElements.countdownContainer.classList.remove("hidden");

    let count = 3;
    this.hudElements.countdown.textContent = count;

    soundManager.playCountdown();

    const countdownInterval = setInterval(() => {
      count--;

      if (count > 0) {
        this.hudElements.countdown.textContent = count;
        soundManager.playCountdown();
      } else {
        this.hudElements.countdown.textContent = "GO!";

        // Terminer le compte à rebours
        setTimeout(() => {
          clearInterval(countdownInterval);
          this.hudElements.countdownContainer.classList.add("hidden");
          callback();
        }, 1000);
      }
    }, 1000);
  }

  /**
   * Met à jour les statistiques de fin de partie
   * @param {Object} stats - Statistiques du jeu
   */
  updateGameOverStats(stats) {
    // Mettre à jour les statistiques
    document.getElementById("final-score").textContent = stats.score;
    document.getElementById("stats-difficulty").textContent =
      this.getDifficultyName(stats.difficulty);
    document.getElementById("stats-time").textContent = this.formatTime(
      stats.time
    );
    document.getElementById("stats-dodges").textContent = stats.dodges;
    document.getElementById("stats-max-combo").textContent = stats.maxCombo;

    // Afficher/masquer l'info du mode Zen
    document
      .getElementById("zen-mode-info")
      .classList.toggle("hidden", !stats.zenMode);
  }

  /**
   * Partage le score sur les réseaux sociaux (simulé)
   */
  shareScore() {
    const score = document.getElementById("final-score").textContent;
    const message = `J'ai obtenu un score de ${score} dans AxoDodge!`;

    // Simuler le partage (dans une vraie implémentation, utiliser l'API Web Share)
    alert(`Partage: ${message}`);
  }

  /**
   * Affiche une animation de niveau supérieur
   * @param {number} level - Numéro du niveau
   */
  showLevelUpAnimation(level) {
    // Créer un élément pour l'animation
    const levelUpElement = document.createElement("div");
    levelUpElement.className =
      "fixed inset-0 flex items-center justify-center z-40 pointer-events-none";
    levelUpElement.innerHTML = `
            <div class="text-4xl font-bold text-center level-animate">
                <div class="text-purple-400">NIVEAU ${level}</div>
                <div class="text-sm text-gray-300 mt-1">La difficulté augmente!</div>
            </div>
        `;

    // Ajouter au document
    document.body.appendChild(levelUpElement);

    // Supprimer après l'animation
    setTimeout(() => {
      levelUpElement.remove();
    }, 2000);
  }

  /**
   * Obtient le nom traduit d'une difficulté
   * @param {string} difficulty - Identifiant de la difficulté
   * @returns {string} - Nom traduit
   */
  getDifficultyName(difficulty) {
    const names = {
      easy: "Facile",
      medium: "Moyen",
      hard: "Difficile",
      progressive: "Progressif",
      custom: "Personnalisé",
    };

    return names[difficulty] || difficulty;
  }

  /**
   * Formate un temps en secondes en format MM:SS
   * @param {number} time - Temps en secondes
   * @returns {string} - Temps formaté
   */
  formatTime(time) {
    const minutes = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }
}
