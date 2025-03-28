/**
 * AxoDodge - Logique principale du jeu
 * Gère la boucle de jeu, les collisions, et l'état global
 */
class Game {
  constructor() {
    // Canvas du jeu
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");

    // Configuration du canvas
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    // Détecteur de pose
    this.poseDetector = new PoseDetector();

    // Système de particules
    this.particleSystem = new ParticleSystem(this.canvas);

    // Interface utilisateur
    this.ui = new UI(this);

    // État du jeu
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameTime = 0;
    this.lastFrameTime = 0;

    // Mode Zen (pas de perte de vie)
    this.zenMode = false;

    // Score et vies
    this.score = 0;
    this.lives = 3;

    // Combo
    this.combo = 0;
    this.comboMultiplier = 1.0;
    this.lastComboTime = 0;
    this.comboTimeout = 2.5; // secondes
    this.maxCombo = 0;

    // Statistiques
    this.stats = {
      dodges: 0,
      hits: 0,
      bonusCollected: 0,
      bonusMissed: 0,
    };

    // Difficulté
    this.difficulty = "medium";
    this.difficultyLevel = 1; // Pour le mode progressif
    this.progressiveIncrease = false;

    // Timers et intervalles
    this.levelProgressTimer = 0;
    this.levelUpInterval = 30; // secondes

    // Configuration des boules
    this.ballConfig = this.getDifficultyConfig("medium");

    // Liste des boules actives
    this.balls = [];

    // Timer pour la génération de boules
    this.nextBallTimer = 0;

    // Flag pour le rendu stroboscopique
    this.antiStrobeFrame = 0;

    // Initialisation
    this.init();
  }

  /**
   * Initialise le jeu
   */
  init() {
    // Configurer le canvas
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    // Initialiser le détecteur de pose
    this.poseDetector.init();
    this.poseDetector.setLandmarksReadyCallback(() => {
      // Utiliser les landmarks pour les collisions
    });

    // Configurer les paramètres par défaut
    this.setDifficulty("medium");

    // Configurer l'animation
    window.requestAnimationFrame(this.gameLoop.bind(this));
  }

  /**
   * Redimensionne le canvas en fonction de la taille de la fenêtre
   */
  resizeCanvas() {
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;

    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
  }

  /**
   * Démarre le jeu
   */
  start() {
    // Réinitialiser l'état du jeu
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.gameTime = 0;
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.comboMultiplier = 1.0;
    this.maxCombo = 0;
    this.lastComboTime = 0;
    this.stats = {
      dodges: 0,
      hits: 0,
      bonusCollected: 0,
      bonusMissed: 0,
    };
    this.balls = [];
    this.nextBallTimer = 0;
    this.difficultyLevel = 1;
    this.levelProgressTimer = 0;

    // Mettre à jour l'interface
    this.ui.updateScore(this.score);
    this.ui.updateLives(this.lives);
    this.ui.updateTimer(this.gameTime);
    this.ui.updateDifficulty(this.difficulty, this.difficultyLevel);
    this.ui.updateCombo(this.combo, this.comboMultiplier);

    // Afficher l'écran de jeu
    this.ui.showScreen("game");

    // Démarrer la musique
    soundManager.startBackgroundMusic();

    // Afficher le contour de positionnement
    this.ui.showPositionOutline(() => {
      // Une fois le joueur correctement positionné, montrer le compte à rebours
      this.ui.showCountdown(() => {
        // Démarrer le jeu après le compte à rebours
        this.isRunning = true;
        this.lastFrameTime = performance.now();
      });
    });
  }

  /**
   * Redémarre le jeu
   */
  restart() {
    // Arrêter le jeu en cours
    this.isRunning = false;
    this.isPaused = false;

    // Démarrer un nouveau jeu
    this.start();
  }

  /**
   * Met en pause ou reprend le jeu
   */
  togglePause() {
    if (this.isGameOver) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Mettre en pause
      this.ui.showScreen("pause");
      soundManager.pauseBackgroundMusic();
    } else {
      // Reprendre
      this.ui.showScreen("game");
      soundManager.resumeBackgroundMusic();
      this.lastFrameTime = performance.now();
    }
  }

  /**
   * Active ou désactive le mode Zen
   * @param {boolean} enabled - Mode Zen activé ou non
   */
  setZenMode(enabled) {
    this.zenMode = enabled;
    this.ui.updateZenModeUI();
  }

  /**
   * Active ou désactive l'affichage du squelette
   * @param {boolean} show - Afficher ou non le squelette
   */
  toggleSkeleton(show) {
    this.poseDetector.toggleSkeleton(show);
  }

  /**
   * Active ou désactive l'affichage du flux vidéo
   * @param {boolean} show - Afficher ou non le flux vidéo
   */
  toggleVideo(show) {
    this.poseDetector.toggleVideo(show);
  }

  /**
   * Définit la difficulté du jeu
   * @param {string} difficulty - Identifiant de la difficulté
   */
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    this.ballConfig = this.getDifficultyConfig(difficulty);

    // Réinitialiser le niveau pour le mode progressif
    if (difficulty === "progressive") {
      this.difficultyLevel = 1;
      this.levelProgressTimer = 0;
    }

    // Mettre à jour l'interface
    this.ui.updateDifficulty(difficulty, this.difficultyLevel);
  }

  /**
   * Obtient la configuration pour une difficulté donnée
   * @param {string} difficulty - Identifiant de la difficulté
   * @returns {Object} - Configuration de la difficulté
   */
  getDifficultyConfig(difficulty) {
    switch (difficulty) {
      case "easy":
        return {
          spawnInterval: 3.0,
          initialRadius: 15,
          growthFactor: 4.0,
          warningTime: 4.0,
          bonusChance: 0.4,
        };
      case "medium":
        return {
          spawnInterval: 3.0,
          initialRadius: 20,
          growthFactor: 5.0,
          warningTime: 3.0,
          bonusChance: 0.3,
        };
      case "hard":
        return {
          spawnInterval: 1.0,
          initialRadius: 40,
          growthFactor: 6.0,
          warningTime: 2.0,
          bonusChance: 0.2,
        };
      case "progressive":
        // Commencer avec la difficulté moyenne
        return {
          spawnInterval: 3.0,
          initialRadius: 20,
          growthFactor: 6.0,
          warningTime: 3.0,
          bonusChance: 0.3,
        };
      case "custom":
        // Utiliser les valeurs personnalisées ou par défaut
        return {
          spawnInterval:
            parseFloat(document.getElementById("spawn-interval").value) || 5.0,
          initialRadius:
            parseInt(document.getElementById("initial-radius").value) || 20,
          growthFactor:
            parseFloat(document.getElementById("growth-factor").value) || 6.0,
          warningTime:
            parseFloat(document.getElementById("warning-time").value) || 3.0,
          bonusChance: 0.3,
          progressiveIncrease:
            document.getElementById("progressive-increase").checked || false,
        };
      default:
        return this.getDifficultyConfig("medium");
    }
  }

  /**
   * Applique les paramètres personnalisés
   * @param {Object} settings - Paramètres personnalisés
   */
  applyCustomSettings(settings) {
    // Mettre à jour la configuration des boules
    this.ballConfig = {
      spawnInterval: settings.spawnInterval,
      initialRadius: settings.initialRadius,
      growthFactor: settings.growthFactor,
      warningTime: settings.warningTime,
      bonusChance: 0.3,
    };

    // Mettre à jour le mode d'augmentation progressive
    this.progressiveIncrease = settings.progressiveIncrease;

    // Si on n'est pas déjà en mode personnalisé, définir la difficulté
    if (this.difficulty !== "custom") {
      this.setDifficulty("custom");
    }
  }

  /**
   * Boucle principale du jeu
   * @param {number} currentTime - Temps actuel
   */
  gameLoop(currentTime) {
    // Calculer le delta time
    let deltaTime = 0;

    if (this.lastFrameTime > 0) {
      deltaTime = (currentTime - this.lastFrameTime) / 1000; // en secondes

      // Limiter le delta time pour éviter les sauts trop grands
      deltaTime = Math.min(deltaTime, 0.1);
    }

    this.lastFrameTime = currentTime;

    // Mettre à jour le jeu si en cours
    if (this.isRunning && !this.isPaused && !this.isGameOver) {
      this.update(deltaTime);
    }

    // Dessiner le jeu
    this.draw();

    // Anti-stroboscope pour stabiliser les performances
    this.antiStrobeFrame = (this.antiStrobeFrame + 1) % 3;

    // Continuer la boucle
    window.requestAnimationFrame(this.gameLoop.bind(this));
  }

  /**
   * Met à jour l'état du jeu
   * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
   */
  update(deltaTime) {
    // Mettre à jour le temps de jeu
    this.gameTime += deltaTime;

    // Mettre à jour le chronomètre
    this.ui.updateTimer(this.gameTime);

    // Mettre à jour le niveau (mode progressif)
    if (this.difficulty === "progressive" || this.progressiveIncrease) {
      this.updateProgressiveLevel(deltaTime);
    }

    // Mettre à jour le timer de combo
    this.updateCombo(deltaTime);

    // Générer de nouvelles boules
    this.updateBallSpawning(deltaTime);

    // Mettre à jour les boules existantes
    this.updateBalls(deltaTime);

    // Mettre à jour les effets visuels
    this.particleSystem.update(deltaTime);
  }

  /**
   * Met à jour le niveau progressif
   * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
   */
  updateProgressiveLevel(deltaTime) {
    this.levelProgressTimer += deltaTime;

    // Calculer la progression
    const progress = (this.levelProgressTimer / this.levelUpInterval) * 100;
    const timeLeft = this.levelUpInterval - this.levelProgressTimer;

    // Mettre à jour l'interface
    this.ui.updateLevelProgress(progress, timeLeft);

    // Passer au niveau suivant
    if (this.levelProgressTimer >= this.levelUpInterval) {
      this.levelUp();
      this.levelProgressTimer = 0;
    }
  }

  /**
   * Monte d'un niveau en mode progressif
   */
  levelUp() {
    // Augmenter le niveau
    this.difficultyLevel++;

    // Modifier la difficulté
    const config = { ...this.ballConfig };

    // Modifier les paramètres en fonction du niveau
    config.spawnInterval = Math.max(1.0, config.spawnInterval - 0.5);
    config.warningTime = Math.max(1.0, config.warningTime - 0.3);
    config.growthFactor += 0.5;

    // Appliquer les nouvelles valeurs
    this.ballConfig = config;

    // Mettre à jour l'interface
    this.ui.updateDifficulty(this.difficulty, this.difficultyLevel);
    this.ui.showLevelUpAnimation(this.difficultyLevel);

    // Jouer le son
    soundManager.playLevelUp();
  }

  /**
   * Met à jour le système de combo
   * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
   */
  updateCombo(deltaTime) {
    if (this.combo > 0) {
      const timeSinceLastCombo = this.gameTime - this.lastComboTime;

      // Réinitialiser le combo si le temps est écoulé
      if (timeSinceLastCombo > this.comboTimeout) {
        this.combo = 0;
        this.comboMultiplier = 1.0;
        this.ui.updateCombo(this.combo, this.comboMultiplier);
      }
    }
  }

  /**
   * Incrémente le combo et met à jour le multiplicateur
   */
  incrementCombo() {
    this.combo++;

    // Mettre à jour le multiplicateur en fonction du nombre de combos
    if (this.combo >= 20) {
      this.comboMultiplier = 4.0;
    } else if (this.combo >= 12) {
      this.comboMultiplier = 3.0;
    } else if (this.combo >= 8) {
      this.comboMultiplier = 2.5;
    } else if (this.combo >= 5) {
      this.comboMultiplier = 2.0;
    } else if (this.combo >= 3) {
      this.comboMultiplier = 1.5;
    } else {
      this.comboMultiplier = 1.0;
    }

    // Mettre à jour le dernier temps de combo
    this.lastComboTime = this.gameTime;

    // Mettre à jour le max combo
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // Mettre à jour l'interface
    this.ui.updateCombo(this.combo, this.comboMultiplier);

    // Jouer un son quand on atteint un palier
    if (
      this.combo === 3 ||
      this.combo === 5 ||
      this.combo === 8 ||
      this.combo === 12 ||
      this.combo === 20
    ) {
      soundManager.playCombo();

      // Créer un effet visuel
      const centerX = this.canvasWidth / 2;
      const centerY = this.canvasHeight / 2;
      this.particleSystem.createComboEffect(centerX, centerY, this.combo);
    }
  }

  /**
   * Réinitialise le combo
   */
  resetCombo() {
    this.combo = 0;
    this.comboMultiplier = 1.0;

    // Mettre à jour l'interface
    this.ui.updateCombo(this.combo, this.comboMultiplier);
  }

  /**
   * Met à jour la génération de boules
   * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
   */
  updateBallSpawning(deltaTime) {
    this.nextBallTimer -= deltaTime;

    // Générer une nouvelle boule si le timer est écoulé
    if (this.nextBallTimer <= 0) {
      this.spawnBall();

      // Réinitialiser le timer
      this.nextBallTimer = this.ballConfig.spawnInterval;
    }
  }

  /**
   * Génère une nouvelle boule
   */
  spawnBall() {
    // Position aléatoire (éviter les bords)
    const margin = 100;
    const x = Math.random() * (this.canvasWidth - 2 * margin) + margin;
    const y = Math.random() * (this.canvasHeight - 2 * margin) + margin;

    // Déterminer le type de boule
    const type =
      Math.random() < this.ballConfig.bonusChance ? "bonus" : "normal";

    // Créer une nouvelle boule
    const ball = new Ball(x, y, type, this.ballConfig);

    // Ajouter à la liste
    this.balls.push(ball);
  }

  /**
   * Met à jour les boules existantes
   * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
   */
  updateBalls(deltaTime) {
    // Collecter les balles à supprimer
    const ballsToRemove = [];

    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];

      // Mettre à jour la boule
      const event = ball.update(deltaTime);

      // Traiter les événements
      if (event === "changed_state") {
        // La boule passe de l'état warning à active
        this.particleSystem.createStateTransition(ball);
        soundManager.playBallDisappear();
      } else if (event === "dodged") {
        // La boule normale a été esquivée (a atteint sa taille maximale sans collision)
        this.handleNormalBallDodged(ball);
      } else if (event === "missed") {
        // La boule bonus a été manquée
        this.handleBonusMissed(ball);
      } else if (event === "remove") {
        // Marquer pour suppression
        ballsToRemove.push(i);
      } else if (ball.state === "active") {
        // Vérifier les collisions
        if (ball.checkCollision(this.poseDetector)) {
          // Collision détectée
          if (ball.type === "normal") {
            // Boule normale (négative)
            this.handleNormalBallCollision(ball);
          } else {
            // Boule bonus (positive)
            this.handleBonusBallCollision(ball);
          }
        }
      }
    }

    // Supprimer les boules marquées (de la fin vers le début)
    for (let i = ballsToRemove.length - 1; i >= 0; i--) {
      this.balls.splice(ballsToRemove[i], 1);
    }
  }

  /**
   * Gère la collision avec une boule normale
   * @param {Ball} ball - Boule touchée
   */
  handleNormalBallCollision(ball) {
    // Éviter les collisions multiples
    if (ball.isCollided) return;

    // Marquer comme collisionnée
    ball.finish("collided");

    // Jouer le son
    soundManager.playBallHit();

    // Créer un effet visuel
    this.particleSystem.createCollisionEffect(ball, -2);

    // Perdre des points
    this.addScore(-2);

    // Perdre une vie (sauf en mode Zen)
    if (!this.zenMode) {
      this.lives--;
      this.ui.updateLives(this.lives);

      // Vérifier la fin de partie
      if (this.lives <= 0) {
        this.gameOver();
      }
    }

    // Réinitialiser le combo
    this.resetCombo();

    // Mettre à jour les statistiques
    this.stats.hits++;
  }

  /**
   * Gère la collision avec une boule bonus
   * @param {Ball} ball - Boule touchée
   */
  handleBonusBallCollision(ball) {
    // Éviter les collisions multiples
    if (ball.isCollided) return;

    // Marquer comme collisionnée
    ball.finish("collided");

    // Jouer le son
    soundManager.playBonusCollect();

    // Créer un effet visuel
    this.particleSystem.createSuccessEffect(ball, 1);

    // Gagner des points
    this.addScore(1);

    // Incrémenter le combo
    this.incrementCombo();

    // Mettre à jour les statistiques
    this.stats.bonusCollected++;
  }

  /**
   * Gère l'esquive d'une boule normale
   * @param {Ball} ball - Boule esquivée
   */
  handleNormalBallDodged(ball) {
    // Éviter les événements multiples
    if (ball.isDodged) return;

    // Marquer comme esquivée
    ball.finish("dodged");

    // Créer un effet visuel
    this.particleSystem.createSuccessEffect(ball, 1);

    // Gagner des points
    this.addScore(1);

    // Incrémenter le combo
    this.incrementCombo();

    // Mettre à jour les statistiques
    this.stats.dodges++;
  }

  /**
   * Gère le manque d'une boule bonus
   * @param {Ball} ball - Boule manquée
   */
  handleBonusMissed(ball) {
    // Éviter les événements multiples
    if (ball.isDodged) return;

    // Marquer comme manquée
    ball.finish("missed");

    // Mettre à jour les statistiques
    this.stats.bonusMissed++;
  }

  /**
   * Ajoute des points au score
   * @param {number} points - Points à ajouter
   */
  addScore(points) {
    // Appliquer le multiplicateur de combo pour les points positifs
    if (points > 0) {
      points = Math.round(points * this.comboMultiplier);
    }

    // Mettre à jour le score
    this.score += points;
    if (this.score < 0) this.score = 0;

    // Mettre à jour l'interface
    this.ui.updateScore(this.score, true);
  }

  /**
   * Gère la fin de partie
   */
  gameOver() {
    this.isGameOver = true;
    this.isRunning = false;

    // Mettre à jour les statistiques
    const stats = {
      score: this.score,
      difficulty: this.difficulty,
      time: this.gameTime,
      dodges: this.stats.dodges,
      maxCombo: this.maxCombo,
      zenMode: this.zenMode,
    };

    // Mettre à jour l'interface
    this.ui.updateGameOverStats(stats);
    this.ui.showScreen("gameOver");

    // Jouer le son
    soundManager.playGameOver();

    // Arrêter la musique
    soundManager.stopBackgroundMusic();
  }

  /**
   * Dessine le jeu
   */
  draw() {
    // Effacer le canvas
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Ne pas dessiner si le jeu n'est pas en cours ou est en pause
    if (!this.isRunning && !this.isPaused && !this.isGameOver) return;

    // Dessiner les boules
    for (const ball of this.balls) {
      ball.draw(this.ctx);
    }

    // Dessiner les effets de particules
    this.particleSystem.draw();
  }
}

// Attendre que le DOM soit chargé, puis initialiser le jeu
document.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
});
