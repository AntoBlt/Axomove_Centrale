/**
 * AxoDodge - Gestion du système audio
 * Gère les sons et la musique du jeu
 */
class SoundManager {
  constructor() {
    // État du son (activé/désactivé)
    this.isMuted = false;

    // Cache des sons
    this.sounds = {};

    // Liste des sons à précharger
    this.soundsToLoad = {
      countdown: "sounds/countdown.mp3",
      ballDisappear: "sounds/ball_disappear.mp3",
      ballHit: "sounds/ball_hit.mp3",
      gameOver: "sounds/game_over.mp3",
      bonusCollect: "sounds/bonus_collect.mp3",
      levelUp: "sounds/level_up.mp3",
      combo: "sounds/combo.mp3",
      buttonClick: "sounds/button_click.mp3",
      backgroundMusic: "sounds/background_music.mp3",
      positionSuccess: "sounds/level_up.mp3", // Réutiliser un son existant pour le succès de positionnement
    };

    // Musique d'arrière-plan
    this.backgroundMusic = null;

    // Initialiser le système audio
    this.init();
  }

  /**
   * Initialise le système audio
   */
  init() {
    // Créer les éléments audio pour chaque son
    Object.keys(this.soundsToLoad).forEach((key) => {
      this.createAudio(key, this.soundsToLoad[key]);
    });

    // Configuration spéciale pour la musique de fond
    this.backgroundMusic = this.sounds.backgroundMusic;
    if (this.backgroundMusic) {
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.5;
    }
  }

  /**
   * Crée un élément audio pour un son
   * @param {string} name - Nom du son
   * @param {string} src - Chemin du fichier son
   */
  createAudio(name, src) {
    // Remplacer le chemin par une version fictive pour la démonstration
    // Dans un environnement réel, vous utiliseriez le chemin réel du fichier
    const audio = new Audio();

    // Définir les attributs
    audio.src = src;
    audio.preload = "auto";

    // Ajouter au cache
    this.sounds[name] = audio;

    // Gérer les erreurs de chargement
    audio.onerror = () => {
      console.warn(`Erreur lors du chargement du son: ${name}`);

      // Création d'un élément audio fallback pour la démo
      const fallbackAudio = new Audio();
      fallbackAudio.src =
        "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
      this.sounds[name] = fallbackAudio;
    };
  }

  /**
   * Joue un son
   * @param {string} name - Nom du son à jouer
   * @param {Object} options - Options de lecture (volume, etc.)
   */
  play(name, options = {}) {
    // Ne pas jouer si le son est désactivé
    if (this.isMuted) return;

    // Vérifier si le son existe
    if (!this.sounds[name]) {
      console.warn(`Son non trouvé: ${name}`);
      return;
    }

    try {
      // Cloner l'audio pour permettre la lecture multiple
      const sound = this.sounds[name].cloneNode();

      // Appliquer les options
      if (options.volume !== undefined) {
        sound.volume = options.volume;
      }

      // Lecture
      sound.play().catch((error) => {
        console.warn(`Erreur lors de la lecture du son ${name}:`, error);
      });
    } catch (error) {
      console.warn(`Erreur lors de la lecture du son ${name}:`, error);
    }
  }

  /**
   * Démarre la musique de fond
   */
  startBackgroundMusic() {
    if (this.isMuted || !this.backgroundMusic) return;

    // Lecture avec fondu d'entrée
    this.backgroundMusic.volume = 0;
    this.backgroundMusic.play().catch((error) => {
      console.warn("Erreur lors de la lecture de la musique de fond:", error);
    });

    // Fondu d'entrée
    this.fadeIn(this.backgroundMusic, 0.5, 2);
  }

  /**
   * Arrête la musique de fond
   */
  stopBackgroundMusic() {
    if (!this.backgroundMusic) return;

    // Fondu de sortie puis arrêt
    this.fadeOut(this.backgroundMusic, 1).then(() => {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    });
  }

  /**
   * Reprend la musique de fond (après pause)
   */
  resumeBackgroundMusic() {
    if (this.isMuted || !this.backgroundMusic) return;

    this.backgroundMusic.play().catch((error) => {
      console.warn("Erreur lors de la reprise de la musique de fond:", error);
    });
  }

  /**
   * Met en pause la musique de fond
   */
  pauseBackgroundMusic() {
    if (!this.backgroundMusic) return;

    this.backgroundMusic.pause();
  }

  /**
   * Active ou désactive tous les sons
   * @param {boolean} muted - État muet (true = son désactivé)
   */
  setMuted(muted) {
    this.isMuted = muted;

    if (muted) {
      // Mettre en pause la musique de fond
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
      }
    } else {
      // Reprendre la musique de fond si le jeu est en cours
      if (this.backgroundMusic && !document.hidden) {
        this.resumeBackgroundMusic();
      }
    }
  }

  /**
   * Joue le son de clic de bouton
   */
  playButtonClick() {
    this.play("buttonClick", { volume: 0.7 });
  }

  /**
   * Joue le son de compte à rebours
   */
  playCountdown() {
    this.play("countdown", { volume: 0.8 });
  }

  /**
   * Joue le son de disparition de boule
   */
  playBallDisappear() {
    this.play("ballDisappear", { volume: 0.6 });
  }

  /**
   * Joue le son de collision avec une boule
   */
  playBallHit() {
    this.play("ballHit", { volume: 0.8 });
  }

  /**
   * Joue le son de collecte de bonus
   */
  playBonusCollect() {
    this.play("bonusCollect", { volume: 0.7 });
  }

  /**
   * Joue le son de fin de partie
   */
  playGameOver() {
    this.play("gameOver", { volume: 0.8 });
  }

  /**
   * Joue le son de montée de niveau
   */
  playLevelUp() {
    this.play("levelUp", { volume: 0.8 });
  }

  /**
   * Joue le son de combo
   */
  playCombo() {
    this.play("combo", { volume: 0.7 });
  }

  /**
   * Effectue un fondu d'entrée sur un élément audio
   * @param {HTMLAudioElement} audio - Élément audio
   * @param {number} targetVolume - Volume cible
   * @param {number} duration - Durée du fondu en secondes
   */
  fadeIn(audio, targetVolume, duration) {
    const volumeStep = targetVolume / (duration * 60); // 60 fps approximatif
    let currentVolume = 0;

    const fadeInterval = setInterval(() => {
      currentVolume += volumeStep;

      if (currentVolume >= targetVolume) {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
      } else {
        audio.volume = currentVolume;
      }
    }, 1000 / 60);
  }

  /**
   * Effectue un fondu de sortie sur un élément audio
   * @param {HTMLAudioElement} audio - Élément audio
   * @param {number} duration - Durée du fondu en secondes
   * @returns {Promise} - Promise résolue à la fin du fondu
   */
  fadeOut(audio, duration) {
    return new Promise((resolve) => {
      const startVolume = audio.volume;
      const volumeStep = startVolume / (duration * 60); // 60 fps approximatif
      let currentVolume = startVolume;

      const fadeInterval = setInterval(() => {
        currentVolume -= volumeStep;

        if (currentVolume <= 0) {
          audio.volume = 0;
          clearInterval(fadeInterval);
          resolve();
        } else {
          audio.volume = currentVolume;
        }
      }, 1000 / 60);
    });
  }
}

// Créer une instance globale du gestionnaire de sons
const soundManager = new SoundManager();
