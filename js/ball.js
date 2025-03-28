/**
 * AxoDodge - Gestion des boules et du système de particules
 */

/**
 * Classe Ball - Gère les boules du jeu
 */
class Ball {
  /**
   * Crée une nouvelle boule
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} type - Type de boule ('normal' ou 'bonus')
   * @param {Object} config - Configuration de la boule
   */
  constructor(x, y, type, config) {
    this.x = x;
    this.y = y;
    this.type = type || "normal";

    // Configuration
    this.radius = config.initialRadius || 20;
    this.warningTime = config.warningTime || 3.0;
    this.growthFactor = config.growthFactor || 6.0;

    // État
    this.state = "warning"; // 'warning', 'active', 'finished'
    this.timeLeft = this.warningTime;
    this.alpha = 1.0;
    this.isDodged = false;
    this.isCollided = false;

    // Couleurs (selon le type)
    this.warningColor = this.type === "normal" ? "#FFD700" : "#87CEFA";
    this.activeColor = this.type === "normal" ? "#FF0000" : "#6C7CEA";
    this.currentColor = this.warningColor;

    // Animation
    this.pulsePhase = 0;
    this.pulseSpeed = 3;
    this.glowIntensity = 10;

    // Taille initiale et taille maximale
    this.initialRadius = this.radius;
    this.maxRadius = this.initialRadius * this.growthFactor;
  }

  /**
   * Met à jour l'état de la boule
   * @param {number} deltaTime - Temps écoulé depuis le dernier update
   * @returns {string} - Événement déclenché ('none', 'changed_state', 'missed', 'collided', 'dodged')
   */
  update(deltaTime) {
    // Animation de pulsation
    this.pulsePhase += deltaTime * this.pulseSpeed;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase -= Math.PI * 2;
    }

    if (this.state === "warning") {
      // Compte à rebours en phase d'avertissement
      this.timeLeft -= deltaTime;

      // Passer à l'état actif quand le temps est écoulé
      if (this.timeLeft <= 0) {
        this.state = "active";
        this.currentColor = this.activeColor;
        return "changed_state";
      }
    } else if (this.state === "active") {
      // Croissance progressive en phase active
      const growthRate =
        (this.maxRadius - this.initialRadius) / this.warningTime;
      this.radius += growthRate * deltaTime;

      // Vérifier si la boule a atteint sa taille maximale
      if (this.radius >= this.maxRadius) {
        this.finish("missed");
        return this.type === "normal" ? "dodged" : "missed";
      }
    } else if (this.state === "finished") {
      // Animation de disparition
      this.alpha -= deltaTime * 2;

      if (this.alpha <= 0) {
        this.alpha = 0;
        return "remove";
      }
    }

    return "none";
  }

  /**
   * Dessine la boule sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu du canvas
   */
  draw(ctx) {
    ctx.save();

    // Définir l'opacité
    ctx.globalAlpha = this.alpha;

    // Dessiner l'effet de lueur (glow)
    if (this.state !== "finished") {
      const pulseValue = Math.sin(this.pulsePhase) * 0.2 + 0.8;
      const glowSize = this.radius * 1.2 * pulseValue;

      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        this.radius,
        this.x,
        this.y,
        glowSize
      );

      gradient.addColorStop(0, this.currentColor);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.beginPath();
      ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Dessiner la boule principale
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    if (this.state === "warning") {
      // Remplissage uni en phase d'avertissement
      ctx.fillStyle = this.currentColor;
      ctx.fill();

      // Dessiner le compte à rebours
      const countdownText = Math.ceil(this.timeLeft).toString();
      ctx.font = `${this.radius}px 'Poppins', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000";
      ctx.fillText(countdownText, this.x, this.y);
    } else {
      // Dégradé pour la phase active
      const gradient = ctx.createRadialGradient(
        this.x - this.radius * 0.3,
        this.y - this.radius * 0.3,
        0,
        this.x,
        this.y,
        this.radius
      );

      if (this.type === "normal") {
        gradient.addColorStop(0, "#FF6666");
        gradient.addColorStop(1, "#CC0000");
      } else {
        gradient.addColorStop(0, "#87CEFA");
        gradient.addColorStop(1, "#4169E1");
      }

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Termine la boule (collision ou esquive)
   * @param {string} reason - Raison de la fin ('collided', 'dodged', 'missed')
   */
  finish(reason) {
    if (this.state === "finished") return;

    this.state = "finished";

    if (reason === "collided") {
      this.isCollided = true;
    } else if (reason === "dodged") {
      this.isDodged = true;
    }
  }

  /**
   * Vérifie si la boule est en collision avec le corps du joueur
   * @param {PoseDetector} poseDetector - Instance du détecteur de pose
   * @returns {boolean} - Collision détectée ou non
   */
  checkCollision(poseDetector) {
    if (this.state !== "active" || !poseDetector.poseLandmarks) {
      return false;
    }

    return poseDetector.checkCollision(this.x, this.y, this.radius);
  }
}

/**
 * Classe Particle - Gère les particules d'effets visuels
 */
class Particle {
  /**
   * Crée une nouvelle particule
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} color - Couleur de la particule
   */
  constructor(x, y, color) {
    this.reset(x, y, color);
  }

  /**
   * Réinitialise la particule avec de nouvelles propriétés
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} color - Couleur de la particule
   */
  reset(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color || "#FFFFFF";

    // Vecteur de vitesse aléatoire
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 100 + 50;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    // Propriétés d'apparence
    this.radius = Math.random() * 4 + 2;
    this.life = Math.random() * 0.5 + 0.5; // Durée de vie entre 0.5 et 1 seconde
    this.alpha = 1.0;
    this.deceleration = 0.92; // Facteur de décélération
    this.active = true;
  }

  /**
   * Met à jour l'état de la particule
   * @param {number} deltaTime - Temps écoulé depuis le dernier update
   */
  update(deltaTime) {
    if (!this.active) return;

    // Mettre à jour la position
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // Appliquer la décélération
    this.vx *= this.deceleration;
    this.vy *= this.deceleration;

    // Réduire la taille et l'opacité progressivement
    this.radius *= 0.98;
    this.life -= deltaTime;
    this.alpha = this.life > 0 ? this.life : 0;

    // Désactiver si la durée de vie est terminée
    if (this.life <= 0 || this.radius < 0.5) {
      this.active = false;
    }
  }

  /**
   * Dessine la particule sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu du canvas
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Dessiner la particule
    ctx.beginPath();
    ctx.arc(
      Math.round(this.x),
      Math.round(this.y),
      this.radius,
      0,
      Math.PI * 2
    );

    // Créer un dégradé pour une apparence plus attrayante
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius
    );

    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Classe ShockWave - Gère les ondes de choc (effets d'onde circulaire)
 */
class ShockWave {
  /**
   * Crée une nouvelle onde de choc
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} color - Couleur de l'onde
   * @param {number} maxSize - Taille maximale
   */
  constructor(x, y, color, maxSize) {
    this.x = x;
    this.y = y;
    this.color = color || "#FFFFFF";
    this.radius = 10;
    this.maxRadius = maxSize || 150;
    this.alpha = 1.0;
    this.active = true;
    this.growSpeed = 300; // Vitesse de croissance en pixels par seconde
  }

  /**
   * Met à jour l'état de l'onde de choc
   * @param {number} deltaTime - Temps écoulé depuis le dernier update
   */
  update(deltaTime) {
    if (!this.active) return;

    // Augmenter la taille de l'onde
    this.radius += this.growSpeed * deltaTime;

    // Réduire l'opacité progressivement
    this.alpha = 1 - this.radius / this.maxRadius;

    // Désactiver si la taille maximale est atteinte
    if (this.radius >= this.maxRadius) {
      this.active = false;
    }
  }

  /**
   * Dessine l'onde de choc sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu du canvas
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Dessiner l'anneau
    ctx.beginPath();
    ctx.arc(
      Math.round(this.x),
      Math.round(this.y),
      this.radius,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Classe ScoreAnimation - Gère l'animation du score
 */
class ScoreAnimation {
  /**
   * Crée une nouvelle animation de score
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} value - Valeur du score
   * @param {string} color - Couleur du texte
   */
  constructor(x, y, value, color) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.color = color || "#FFFFFF";
    this.alpha = 1.0;
    this.scale = 0;
    this.maxScale = 1;
    this.active = true;
    this.life = 1.0; // Durée de vie en secondes
    this.moveSpeed = 50; // Vitesse de déplacement vers le haut
  }

  /**
   * Met à jour l'état de l'animation
   * @param {number} deltaTime - Temps écoulé depuis le dernier update
   */
  update(deltaTime) {
    if (!this.active) return;

    // Mise à jour de la position (déplacement vers le haut)
    this.y -= this.moveSpeed * deltaTime;

    // Animation d'échelle (grandir puis rétrécir)
    if (this.scale < this.maxScale) {
      this.scale += deltaTime * 5;
      if (this.scale > this.maxScale) {
        this.scale = this.maxScale;
      }
    }

    // Réduire la durée de vie et l'opacité
    this.life -= deltaTime;
    this.alpha = this.life > 0 ? this.life : 0;

    // Désactiver si la durée de vie est terminée
    if (this.life <= 0) {
      this.active = false;
    }
  }

  /**
   * Dessine l'animation de score sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu du canvas
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Appliquer la transformation d'échelle
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.x, -this.y);

    // Dessiner le texte
    ctx.font = "bold 24px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Ajouter un contour pour améliorer la lisibilité
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.lineWidth = 3;
    ctx.strokeText((this.value > 0 ? "+" : "") + this.value, this.x, this.y);

    // Remplir avec la couleur principale
    ctx.fillStyle = this.color;
    ctx.fillText((this.value > 0 ? "+" : "") + this.value, this.x, this.y);

    ctx.restore();
  }
}

/**
 * Classe ParticleSystem - Système de gestion des effets visuels
 */
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    // Pools d'objets pour les différents effets
    this.particles = Array(100)
      .fill()
      .map(() => new Particle(0, 0, "#FFFFFF"));
    this.shockWaves = Array(10)
      .fill()
      .map(() => new ShockWave(0, 0, "#FFFFFF", 150));
    this.scoreAnimations = Array(20)
      .fill()
      .map(() => new ScoreAnimation(0, 0, 0, "#FFFFFF"));

    // Compteurs pour suivre les objets actifs
    this.activeParticles = 0;
    this.activeShockWaves = 0;
    this.activeScoreAnimations = 0;
  }

  /**
   * Met à jour tous les effets visuels
   * @param {number} deltaTime - Temps écoulé depuis le dernier update
   */
  update(deltaTime) {
    // Mettre à jour les particules
    for (let i = 0; i < this.activeParticles; i++) {
      this.particles[i].update(deltaTime);

      if (!this.particles[i].active) {
        // Remplacer la particule inactive par la dernière active
        if (i !== this.activeParticles - 1) {
          [this.particles[i], this.particles[this.activeParticles - 1]] = [
            this.particles[this.activeParticles - 1],
            this.particles[i],
          ];
          i--;
        }
        this.activeParticles--;
      }
    }

    // Mettre à jour les ondes de choc
    for (let i = 0; i < this.activeShockWaves; i++) {
      this.shockWaves[i].update(deltaTime);

      if (!this.shockWaves[i].active) {
        // Remplacer l'onde inactive par la dernière active
        if (i !== this.activeShockWaves - 1) {
          [this.shockWaves[i], this.shockWaves[this.activeShockWaves - 1]] = [
            this.shockWaves[this.activeShockWaves - 1],
            this.shockWaves[i],
          ];
          i--;
        }
        this.activeShockWaves--;
      }
    }

    // Mettre à jour les animations de score
    for (let i = 0; i < this.activeScoreAnimations; i++) {
      this.scoreAnimations[i].update(deltaTime);

      if (!this.scoreAnimations[i].active) {
        // Remplacer l'animation inactive par la dernière active
        if (i !== this.activeScoreAnimations - 1) {
          [
            this.scoreAnimations[i],
            this.scoreAnimations[this.activeScoreAnimations - 1],
          ] = [
            this.scoreAnimations[this.activeScoreAnimations - 1],
            this.scoreAnimations[i],
          ];
          i--;
        }
        this.activeScoreAnimations--;
      }
    }
  }

  /**
   * Dessine tous les effets visuels
   */
  draw() {
    // Dessiner les ondes de choc
    for (let i = 0; i < this.activeShockWaves; i++) {
      this.shockWaves[i].draw(this.ctx);
    }

    // Dessiner les particules
    for (let i = 0; i < this.activeParticles; i++) {
      this.particles[i].draw(this.ctx);
    }

    // Dessiner les animations de score
    for (let i = 0; i < this.activeScoreAnimations; i++) {
      this.scoreAnimations[i].draw(this.ctx);
    }
  }

  /**
   * Crée un effet d'explosion de particules
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} color - Couleur des particules
   * @param {number} count - Nombre de particules à créer
   */
  createExplosion(x, y, color, count) {
    count = Math.min(count || 20, 100 - this.activeParticles);

    for (
      let i = 0;
      i < count && this.activeParticles < this.particles.length;
      i++
    ) {
      this.particles[this.activeParticles].reset(x, y, color);
      this.activeParticles++;
    }
  }

  /**
   * Crée une onde de choc
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} color - Couleur de l'onde
   * @param {number} maxSize - Taille maximale
   */
  createShockWave(x, y, color, maxSize) {
    if (this.activeShockWaves < this.shockWaves.length) {
      const shockWave = this.shockWaves[this.activeShockWaves];
      shockWave.x = x;
      shockWave.y = y;
      shockWave.color = color || "#FFFFFF";
      shockWave.radius = 10;
      shockWave.maxRadius = maxSize || 150;
      shockWave.alpha = 1.0;
      shockWave.active = true;

      this.activeShockWaves++;
    }
  }

  /**
   * Crée une animation de score
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} value - Valeur du score
   * @param {string} color - Couleur du texte
   */
  createScoreAnimation(x, y, value, color) {
    if (this.activeScoreAnimations < this.scoreAnimations.length) {
      const scoreAnim = this.scoreAnimations[this.activeScoreAnimations];
      scoreAnim.x = x;
      scoreAnim.y = y;
      scoreAnim.value = value;
      scoreAnim.color = color || "#FFFFFF";
      scoreAnim.alpha = 1.0;
      scoreAnim.scale = 0;
      scoreAnim.life = 1.0;
      scoreAnim.active = true;

      this.activeScoreAnimations++;
    }
  }

  /**
   * Crée un effet de transition d'état pour une boule
   * @param {Ball} ball - Boule qui change d'état
   */
  createStateTransition(ball) {
    const color = ball.type === "normal" ? "#FFD700" : "#87CEFA";

    // Créer une onde de choc
    this.createShockWave(ball.x, ball.y, color, ball.radius * 3);

    // Créer des particules
    this.createExplosion(ball.x, ball.y, color, 15);
  }

  /**
   * Crée un effet de succès (boule évitée ou bonus collecté)
   * @param {Ball} ball - Boule évitée ou collectée
   * @param {number} score - Score gagné
   */
  createSuccessEffect(ball, score) {
    const color = ball.type === "normal" ? "#FFD700" : "#6C7CEA";

    // Créer une onde de choc plus grande
    this.createShockWave(ball.x, ball.y, color, ball.radius * 5);

    // Créer plus de particules
    this.createExplosion(ball.x, ball.y, color, 30);

    // Créer une animation de score
    this.createScoreAnimation(ball.x, ball.y - ball.radius * 2, score, color);
  }

  /**
   * Crée un effet de collision (boule touchée)
   * @param {Ball} ball - Boule touchée
   * @param {number} score - Score perdu
   */
  createCollisionEffect(ball, score) {
    const color = "#FF0000"; // Rouge pour les collisions

    // Créer une onde de choc
    this.createShockWave(ball.x, ball.y, color, ball.radius * 4);

    // Créer une explosion de particules
    this.createExplosion(ball.x, ball.y, color, 40);

    // Créer une animation de score
    this.createScoreAnimation(ball.x, ball.y - ball.radius * 2, score, color);
  }

  /**
   * Crée un effet pour le combo
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} comboCount - Nombre de combos
   */
  createComboEffect(x, y, comboCount) {
    // Couleur qui change en fonction du nombre de combos
    const comboColors = [
      "#FFFFFF", // Blanc (base)
      "#FFFFFF", // Blanc (niveau 1)
      "#FFFFFF", // Blanc (niveau 2)
      "#4169E1", // Bleu (niveau 3-4)
      "#4169E1", // Bleu (niveau 3-4)
      "#9370DB", // Violet (niveau 5-7)
      "#9370DB", // Violet (niveau 5-7)
      "#9370DB", // Violet (niveau 5-7)
      "#FFD700", // Or (niveau 8-11)
      "#FFD700", // Or (niveau 8-11)
      "#FFD700", // Or (niveau 8-11)
      "#FFD700", // Or (niveau 8-11)
      "#FF4500", // Orange-rouge (niveau 12-19)
      "#FF4500", // Orange-rouge (niveau 12-19)
      "#FF4500", // Orange-rouge (niveau 12-19)
      "#FF4500", // Orange-rouge (niveau 12-19)
      "#FF4500", // Orange-rouge (niveau 12-19)
      "#FF4500", // Orange-rouge (niveau 12-19)
      "#FF4500", // Orange-rouge (niveau 12-19)
      "#FF4500", // Orange-rouge (niveau 12-19)
      "#FF00FF", // Magenta (niveau 20+)
    ];

    const colorIndex = Math.min(comboCount, comboColors.length - 1);
    const color = comboColors[colorIndex];

    // Créer une onde de choc
    this.createShockWave(x, y, color, 200);

    // Créer des particules
    this.createExplosion(x, y, color, 25);

    // Créer une animation de texte
    this.createScoreAnimation(x, y, "COMBO x" + comboCount, color);
  }

  /**
   * Crée un effet pour le passage de niveau
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} level - Numéro du niveau
   */
  createLevelUpEffect(x, y, level) {
    const color = "#9370DB"; // Violet pour les niveaux

    // Créer une onde de choc qui couvre presque tout l'écran
    this.createShockWave(x, y, color, 500);

    // Créer plusieurs explosions de particules
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const offsetX = Math.cos(angle) * 100;
      const offsetY = Math.sin(angle) * 100;
      this.createExplosion(x + offsetX, y + offsetY, color, a);
    }
  }
}
