/**
 * AxoDodge - Module de détection de pose et de gestion des collisions
 * Utilise MediaPipe pour détecter le corps et les mains de l'utilisateur
 */
class PoseDetector {
  constructor() {
    // Configuration de la vidéo et des canvas
    this.video = document.getElementById("video");
    this.outputCanvas = document.getElementById("output-canvas");
    this.outputCtx = this.outputCanvas.getContext("2d");

    // Dimensions du canvas
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    // Configuration de MediaPipe Pose
    this.pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.8,
      minTrackingConfidence: 0.9,
    });

    // Configuration de MediaPipe Hands
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.8,
      minTrackingConfidence: 0.9,
    });

    // Caméra pour la capture vidéo
    this.camera = null;

    // Points de référence détectés
    this.poseLandmarks = null;
    this.leftHandLandmarks = null;
    this.rightHandLandmarks = null;

    // Filtrage des mouvements
    this.lastPoseLandmarks = null;
    this.lastLeftHandLandmarks = null;
    this.lastRightHandLandmarks = null;
    this.filterAlpha = 0.5; // Réduit pour une meilleure réactivité
    this.quickMovementThreshold = 0.02; // Seuil pour détecter les mouvements rapides

    // Indicateurs d'affichage
    this.showSkeleton = true;
    this.showVideo = true; // Nouvel indicateur pour l'affichage de la vidéo
    this.showSilhouette = true; // Nouvel indicateur pour l'affichage de la silhouette

    // Fonction à appeler quand les landmarks sont prêts
    this.onLandmarksReady = null;
  }

  /**
   * Initialisation de la détection de pose
   */
  init() {
    // Configurer la taille du canvas pour correspondre à la vidéo
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    // Configurer les callbacks de MediaPipe
    this.pose.onResults((results) => this.onPoseResults(results));
    this.hands.onResults((results) => this.onHandsResults(results));

    // Initialiser la caméra
    this.camera = new Camera(this.video, {
      onFrame: async () => {
        await this.pose.send({ image: this.video });
        await this.hands.send({ image: this.video });
      },
      width: 1280,
      height: 720,
    });

    // Démarrer la caméra
    this.camera
      .start()
      .then(() => {
        console.log("Camera started successfully");
      })
      .catch((error) => {
        console.error("Error starting camera:", error);
      });
  }

  /**
   * Redimensionne le canvas en fonction de la taille de la fenêtre
   */
  resizeCanvas() {
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;

    this.outputCanvas.width = this.canvasWidth;
    this.outputCanvas.height = this.canvasHeight;
  }

  /**
   * Traite les résultats de détection de pose
   * @param {Object} results - Résultats de détection de pose
   */
  onPoseResults(results) {
    // Toujours effacer le canvas pour éviter les artefacts
    this.outputCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Afficher le flux vidéo si activé
    if (this.showVideo && results.image) {
      this.drawVideoFrame(results.image);
    }

    // Obtenir les landmarks de pose
    if (results.poseLandmarks) {
      if (this.lastPoseLandmarks) {
        // Calculer si on est en présence d'un mouvement rapide
        let maxMovement = 0;
        for (let i = 0; i < results.poseLandmarks.length; i++) {
          if (this.lastPoseLandmarks[i] && results.poseLandmarks[i]) {
            const dx = Math.abs(
              results.poseLandmarks[i].x - this.lastPoseLandmarks[i].x
            );
            const dy = Math.abs(
              results.poseLandmarks[i].y - this.lastPoseLandmarks[i].y
            );
            const movement = Math.sqrt(dx * dx + dy * dy);
            maxMovement = Math.max(maxMovement, movement);
          }
        }

        // Ajuster dynamiquement le filtrage en fonction de la vitesse du mouvement
        let currentFilterAlpha = this.filterAlpha;
        if (maxMovement > this.quickMovementThreshold) {
          // Réduire le lissage pour les mouvements rapides (plus réactif)
          currentFilterAlpha = Math.max(
            0.2,
            this.filterAlpha - (maxMovement / 0.05) * 0.3
          );
        }

        // Appliquer le filtre passe-bas pour lisser les mouvements
        for (let i = 0; i < results.poseLandmarks.length; i++) {
          results.poseLandmarks[i].x =
            this.lastPoseLandmarks[i].x * currentFilterAlpha +
            results.poseLandmarks[i].x * (1 - currentFilterAlpha);
          results.poseLandmarks[i].y =
            this.lastPoseLandmarks[i].y * currentFilterAlpha +
            results.poseLandmarks[i].y * (1 - currentFilterAlpha);
          results.poseLandmarks[i].z =
            this.lastPoseLandmarks[i].z * currentFilterAlpha +
            results.poseLandmarks[i].z * (1 - currentFilterAlpha);
        }
      }

      // Stocker les landmarks pour le prochain frame
      this.lastPoseLandmarks = JSON.parse(
        JSON.stringify(results.poseLandmarks)
      );

      // Appliquer l'effet miroir aux landmarks (pour une expérience plus intuitive)
      for (let landmark of results.poseLandmarks) {
        landmark.x = 1 - landmark.x;
      }

      // Stocker les landmarks dans la classe
      this.poseLandmarks = results.poseLandmarks;

      // Dessiner la silhouette pleine si activé
      if (this.showSilhouette) {
        this.drawBodySilhouette();
      }

      // Afficher le squelette si activé
      if (this.showSkeleton) {
        this.drawConnectors(
          this.outputCtx,
          results.poseLandmarks,
          POSE_CONNECTIONS,
          { color: "#70D7D1", lineWidth: 4 }
        );
        this.drawLandmarks(this.outputCtx, results.poseLandmarks, {
          color: "#6C7CEA",
          lineWidth: 2,
        });
      }
    }

    // Appeler la fonction de callback si définie
    if (this.onLandmarksReady && this.poseLandmarks) {
      this.onLandmarksReady();
    }
  }

  /**
   * Dessine une silhouette pleine à partir des points de pose
   * @param {boolean} showSilhouette - Afficher ou non la silhouette
   */
  drawBodySilhouette(showSilhouette = true) {
    if (!this.poseLandmarks || !showSilhouette) return;

    const canvas = this.outputCanvas;
    const ctx = this.outputCtx;

    ctx.save();

    // Couleur de la silhouette (semi-transparente pour voir les collisions)
    ctx.fillStyle = "rgba(108, 124, 234, 0.5)"; // Couleur axo-gradient-from avec opacité
    ctx.strokeStyle = "rgba(112, 215, 209, 0.8)"; // Couleur axo-light avec opacité
    ctx.lineWidth = 2;

    // Dessiner la tête (cercle)
    this.drawHead(ctx);

    // Dessiner le torse (forme trapézoïdale)
    this.drawTorso(ctx);

    // Dessiner les bras (formes cylindriques)
    this.drawArms(ctx);

    // Dessiner les jambes (formes cylindriques)
    this.drawLegs(ctx);

    // Dessiner les mains si disponibles
    this.drawHands(ctx);

    ctx.restore();
  }

  /**
   * Dessine la tête
   * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
   */
  drawHead(ctx) {
    // Points clés pour la tête
    const nose = this.poseLandmarks[0];
    const leftEye = this.poseLandmarks[2];
    const rightEye = this.poseLandmarks[5];
    const leftEar = this.poseLandmarks[7];
    const rightEar = this.poseLandmarks[8];

    if (!nose || !leftEye || !rightEye || !leftEar || !rightEar) return;

    // Convertir en coordonnées de canvas
    const [noseX, noseY] = this.normalizedToCanvas(nose.x, nose.y);
    const [leftEarX, leftEarY] = this.normalizedToCanvas(leftEar.x, leftEar.y);
    const [rightEarX, rightEarY] = this.normalizedToCanvas(
      rightEar.x,
      rightEar.y
    );

    // Calculer le centre de la tête
    const headX = (leftEarX + rightEarX) / 2;
    const headY = (leftEarY + rightEarY) / 2 - 10; // Légèrement au-dessus des oreilles

    // Calculer le rayon de la tête basé sur la distance entre les oreilles
    const earDistance = Math.sqrt(
      (leftEarX - rightEarX) * (leftEarX - rightEarX) +
        (leftEarY - rightEarY) * (leftEarY - rightEarY)
    );

    const headRadius = earDistance * 0.75; // Ajustement pour couvrir toute la tête

    // Dessiner la tête
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ajouter un cercle pour le cou
    const leftShoulder = this.poseLandmarks[11];
    const rightShoulder = this.poseLandmarks[12];

    if (leftShoulder && rightShoulder) {
      const [leftShoulderX, leftShoulderY] = this.normalizedToCanvas(
        leftShoulder.x,
        leftShoulder.y
      );
      const [rightShoulderX, rightShoulderY] = this.normalizedToCanvas(
        rightShoulder.x,
        rightShoulder.y
      );

      const shoulderCenterX = (leftShoulderX + rightShoulderX) / 2;
      const shoulderCenterY = (leftShoulderY + rightShoulderY) / 2;

      // Dessiner le cou comme un rectangle arrondi
      const neckTopY = headY + headRadius * 0.8;
      const neckWidth = headRadius * 0.6;

      ctx.beginPath();
      ctx.moveTo(shoulderCenterX - neckWidth / 2, shoulderCenterY);
      ctx.lineTo(shoulderCenterX - neckWidth / 2, neckTopY);
      ctx.arc(shoulderCenterX, neckTopY, neckWidth / 2, Math.PI, 0, false);
      ctx.lineTo(shoulderCenterX + neckWidth / 2, shoulderCenterY);
      ctx.fill();
      ctx.stroke();
    }
  }

  /**
   * Dessine le torse
   * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
   */
  drawTorso(ctx) {
    // Points du torse
    const leftShoulder = this.poseLandmarks[11];
    const rightShoulder = this.poseLandmarks[12];
    const leftHip = this.poseLandmarks[23];
    const rightHip = this.poseLandmarks[24];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

    // Convertir en coordonnées de canvas
    const [leftShoulderX, leftShoulderY] = this.normalizedToCanvas(
      leftShoulder.x,
      leftShoulder.y
    );
    const [rightShoulderX, rightShoulderY] = this.normalizedToCanvas(
      rightShoulder.x,
      rightShoulder.y
    );
    const [leftHipX, leftHipY] = this.normalizedToCanvas(leftHip.x, leftHip.y);
    const [rightHipX, rightHipY] = this.normalizedToCanvas(
      rightHip.x,
      rightHip.y
    );

    // Calculer la largeur des épaules et des hanches
    const shoulderWidth = Math.sqrt(
      (leftShoulderX - rightShoulderX) * (leftShoulderX - rightShoulderX) +
        (leftShoulderY - rightShoulderY) * (leftShoulderY - rightShoulderY)
    );

    const hipWidth = Math.sqrt(
      (leftHipX - rightHipX) * (leftHipX - rightHipX) +
        (leftHipY - rightHipY) * (leftHipY - rightHipY)
    );

    // Ajuster les points pour créer un torse plus naturel
    const torsoExpansion = shoulderWidth * 0.05; // Expansion légère pour un torse plus naturel

    // Dessiner le torse avec des courbes de Bézier pour les côtés
    ctx.beginPath();
    ctx.moveTo(leftShoulderX, leftShoulderY);
    ctx.lineTo(rightShoulderX, rightShoulderY);

    // Côté droit avec courbe
    const rightControlX = rightShoulderX + torsoExpansion;
    const rightControlY = (rightShoulderY + rightHipY) / 2;
    ctx.bezierCurveTo(
      rightControlX,
      rightControlY,
      rightControlX,
      rightControlY,
      rightHipX,
      rightHipY
    );

    // Bas du torse
    ctx.lineTo(leftHipX, leftHipY);

    // Côté gauche avec courbe
    const leftControlX = leftShoulderX - torsoExpansion;
    const leftControlY = (leftShoulderY + leftHipY) / 2;
    ctx.bezierCurveTo(
      leftControlX,
      leftControlY,
      leftControlX,
      leftControlY,
      leftShoulderX,
      leftShoulderY
    );

    ctx.fill();
    ctx.stroke();
  }

  /**
   * Dessine les bras
   * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
   */
  drawArms(ctx) {
    this.drawLimb(ctx, 11, 13, 15); // Bras gauche
    this.drawLimb(ctx, 12, 14, 16); // Bras droit
  }

  /**
   * Dessine les jambes
   * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
   */
  drawLegs(ctx) {
    this.drawLimb(ctx, 23, 25, 27); // Jambe gauche
    this.drawLimb(ctx, 24, 26, 28); // Jambe droite
  }

  /**
   * Dessine un membre (bras ou jambe)
   * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
   * @param {number} jointIdx1 - Index du premier joint (épaule/hanche)
   * @param {number} jointIdx2 - Index du deuxième joint (coude/genou)
   * @param {number} jointIdx3 - Index du troisième joint (poignet/cheville)
   */
  drawLimb(ctx, jointIdx1, jointIdx2, jointIdx3) {
    const joint1 = this.poseLandmarks[jointIdx1];
    const joint2 = this.poseLandmarks[jointIdx2];
    const joint3 = this.poseLandmarks[jointIdx3];

    if (!joint1 || !joint2 || !joint3) return;

    // Convertir en coordonnées de canvas
    const [j1x, j1y] = this.normalizedToCanvas(joint1.x, joint1.y);
    const [j2x, j2y] = this.normalizedToCanvas(joint2.x, joint2.y);
    const [j3x, j3y] = this.normalizedToCanvas(joint3.x, joint3.y);

    // Calculer l'épaisseur du membre (plus fine pour les avant-bras/tibias)
    let upperThickness, lowerThickness;

    // Différencier les bras et les jambes par leur position
    const isLeg = j1y > this.canvasHeight / 2;

    if (isLeg) {
      upperThickness = 25; // Cuisse
      lowerThickness = 20; // Tibia
    } else {
      upperThickness = 20; // Bras
      lowerThickness = 15; // Avant-bras
    }

    // Dessiner le segment supérieur (bras/cuisse)
    this.drawThickLine(ctx, j1x, j1y, j2x, j2y, upperThickness);

    // Dessiner le segment inférieur (avant-bras/tibia)
    this.drawThickLine(ctx, j2x, j2y, j3x, j3y, lowerThickness);

    // Dessiner les articulations
    const jointRadius = upperThickness / 2;

    // Articulation médiane (coude/genou)
    ctx.beginPath();
    ctx.arc(j2x, j2y, jointRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Articulation terminale (poignet/cheville)
    ctx.beginPath();
    ctx.arc(j3x, j3y, lowerThickness / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Dessine une ligne épaisse (segment de membre)
   * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
   * @param {number} x1 - Coordonnée X du point de départ
   * @param {number} y1 - Coordonnée Y du point de départ
   * @param {number} x2 - Coordonnée X du point d'arrivée
   * @param {number} y2 - Coordonnée Y du point d'arrivée
   * @param {number} thickness - Épaisseur de la ligne
   */
  drawThickLine(ctx, x1, y1, x2, y2, thickness) {
    // Calculer le vecteur de direction
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return;

    // Normaliser
    const nx = dx / length;
    const ny = dy / length;

    // Vecteur perpendiculaire
    const px = -ny;
    const py = nx;

    // Demi-épaisseur
    const halfThickness = thickness / 2;

    // Calculer les quatre coins du rectangle
    const p1x = x1 + px * halfThickness;
    const p1y = y1 + py * halfThickness;
    const p2x = x1 - px * halfThickness;
    const p2y = y1 - py * halfThickness;
    const p3x = x2 - px * halfThickness;
    const p3y = y2 - py * halfThickness;
    const p4x = x2 + px * halfThickness;
    const p4y = y2 + py * halfThickness;

    // Dessiner le rectangle
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.lineTo(p3x, p3y);
    ctx.lineTo(p4x, p4y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ajouter des extrémités arrondies
    ctx.beginPath();
    ctx.arc(x1, y1, halfThickness, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x2, y2, halfThickness, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Dessine les mains
   * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
   */
  drawHands(ctx) {
    // Dessiner les mains si les landmarks sont disponibles
    if (this.leftHandLandmarks) {
      this.drawHand(ctx, this.leftHandLandmarks);
    }

    if (this.rightHandLandmarks) {
      this.drawHand(ctx, this.rightHandLandmarks);
    }
  }

  /**
   * Dessine une main
   * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
   * @param {Array} handLandmarks - Landmarks de la main
   */
  drawHand(ctx, handLandmarks) {
    // Points de la paume
    const palmPoints = [0, 1, 5, 9, 13, 17, 0];
    const palmPath = [];

    // Créer le chemin de la paume
    for (const idx of palmPoints) {
      const landmark = handLandmarks[idx];
      const [x, y] = this.normalizedToCanvas(landmark.x, landmark.y);
      palmPath.push({ x, y });
    }

    // Dessiner la paume
    ctx.beginPath();
    ctx.moveTo(palmPath[0].x, palmPath[0].y);

    for (let i = 1; i < palmPath.length; i++) {
      ctx.lineTo(palmPath[i].x, palmPath[i].y);
    }

    ctx.fill();
    ctx.stroke();

    // Doigts
    const fingers = [
      [1, 2, 3, 4], // Pouce
      [5, 6, 7, 8], // Index
      [9, 10, 11, 12], // Majeur
      [13, 14, 15, 16], // Annulaire
      [17, 18, 19, 20], // Auriculaire
    ];

    // Dessiner chaque doigt
    for (const finger of fingers) {
      const fingerPath = [];

      // Base du doigt (depuis la paume)
      const baseIdx = finger[0];
      const baseLandmark = handLandmarks[baseIdx];
      const [baseX, baseY] = this.normalizedToCanvas(
        baseLandmark.x,
        baseLandmark.y
      );
      fingerPath.push({ x: baseX, y: baseY });

      // Phalanges
      for (let i = 1; i < finger.length; i++) {
        const idx = finger[i];
        const landmark = handLandmarks[idx];
        const [x, y] = this.normalizedToCanvas(landmark.x, landmark.y);
        fingerPath.push({ x, y });
      }

      // Dessiner le doigt comme une série de segments épais
      for (let i = 0; i < fingerPath.length - 1; i++) {
        const p1 = fingerPath[i];
        const p2 = fingerPath[i + 1];

        // Épaisseur décroissante vers le bout du doigt
        const thickness = 15 * (1 - i / finger.length);

        this.drawThickLine(ctx, p1.x, p1.y, p2.x, p2.y, thickness);
      }

      // Bout du doigt arrondi
      const tipIdx = finger.length - 1;
      const tip = fingerPath[tipIdx];

      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  /**
   * Dessine le flux vidéo sur le canvas avec effet miroir
   * @param {HTMLImageElement|HTMLVideoElement} image - Image ou vidéo à dessiner
   */
  drawVideoFrame(image) {
    if (!image) return;

    // Définir la transparence
    this.outputCtx.globalAlpha = 1; // Légère transparence pour mieux voir les boules

    // Appliquer effet miroir
    this.outputCtx.save();
    this.outputCtx.translate(this.canvasWidth, 0);
    this.outputCtx.scale(-1, 1);

    // Calculer la taille pour conserver les proportions
    const aspectRatio = image.width / image.height;
    let drawWidth = this.canvasWidth;
    let drawHeight = this.canvasWidth / aspectRatio;

    // Si la hauteur calculée dépasse la hauteur du canvas
    if (drawHeight > this.canvasHeight) {
      drawHeight = this.canvasHeight;
      drawWidth = this.canvasHeight * aspectRatio;
    }

    // Calculer la position pour centrer
    const x = (this.canvasWidth - drawWidth) / 2;
    const y = (this.canvasHeight - drawHeight) / 2;

    // Dessiner l'image
    this.outputCtx.drawImage(image, x, y, drawWidth, drawHeight);
    this.outputCtx.restore();

    // Réinitialiser l'opacité
    this.outputCtx.globalAlpha = 1.0;
  }

  /**
   * Traite les résultats de détection des mains
   * @param {Object} results - Résultats de détection des mains
   */
  onHandsResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Traiter les landmarks des mains
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const handLandmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i].label;

        // Appliquer l'effet miroir
        for (let landmark of handLandmarks) {
          landmark.x = 1 - landmark.x;
        }

        // Appliquer le filtre passe-bas
        const lastHandLandmarks =
          handedness === "Left"
            ? this.lastLeftHandLandmarks
            : this.lastRightHandLandmarks;

        if (lastHandLandmarks) {
          // Calculer si on est en présence d'un mouvement rapide de la main
          let maxHandMovement = 0;
          for (let j = 0; j < handLandmarks.length; j++) {
            if (lastHandLandmarks[j] && handLandmarks[j]) {
              const dx = Math.abs(handLandmarks[j].x - lastHandLandmarks[j].x);
              const dy = Math.abs(handLandmarks[j].y - lastHandLandmarks[j].y);
              const movement = Math.sqrt(dx * dx + dy * dy);
              maxHandMovement = Math.max(maxHandMovement, movement);
            }
          }

          // Ajuster dynamiquement le filtrage en fonction de la vitesse du mouvement
          let currentHandFilterAlpha = this.filterAlpha;
          if (maxHandMovement > this.quickMovementThreshold * 0.8) {
            // Seuil légèrement plus bas pour les mains
            // Réduire encore plus le lissage pour les mains (encore plus réactives)
            currentHandFilterAlpha = Math.max(
              0.15,
              this.filterAlpha - (maxHandMovement / 0.04) * 0.35
            );
          }

          for (let j = 0; j < handLandmarks.length; j++) {
            handLandmarks[j].x =
              lastHandLandmarks[j].x * currentHandFilterAlpha +
              handLandmarks[j].x * (1 - currentHandFilterAlpha);
            handLandmarks[j].y =
              lastHandLandmarks[j].y * currentHandFilterAlpha +
              handLandmarks[j].y * (1 - currentHandFilterAlpha);
            handLandmarks[j].z =
              lastHandLandmarks[j].z * currentHandFilterAlpha +
              handLandmarks[j].z * (1 - currentHandFilterAlpha);
          }
        }

        // Stocker les landmarks pour le prochain frame
        if (handedness === "Left") {
          this.lastLeftHandLandmarks = JSON.parse(
            JSON.stringify(handLandmarks)
          );
          this.leftHandLandmarks = handLandmarks;
        } else {
          this.lastRightHandLandmarks = JSON.parse(
            JSON.stringify(handLandmarks)
          );
          this.rightHandLandmarks = handLandmarks;
        }

        // Afficher les mains si activé
        if (this.showSkeleton) {
          this.drawConnectors(this.outputCtx, handLandmarks, HAND_CONNECTIONS, {
            color: "#70D7D1",
            lineWidth: 3,
          });
          this.drawLandmarks(this.outputCtx, handLandmarks, {
            color: "#6C7CEA",
            lineWidth: 1,
          });
        }
      }
    }
  }

  /**
   * Dessine les connexions entre les points de repère
   * Implémentation simplifiée de la fonction de MediaPipe
   */
  drawConnectors(ctx, landmarks, connections, style) {
    if (!landmarks || !connections) return;

    const canvas = ctx.canvas;
    ctx.save();
    ctx.strokeStyle = style.color || "#FFFFFF";
    ctx.lineWidth = style.lineWidth || 1;

    for (const connection of connections) {
      const [start, end] = connection;
      if (!landmarks[start] || !landmarks[end]) continue;

      const startX = landmarks[start].x * canvas.width;
      const startY = landmarks[start].y * canvas.height;
      const endX = landmarks[end].x * canvas.width;
      const endY = landmarks[end].y * canvas.height;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Dessine les points de repère
   * Implémentation simplifiée de la fonction de MediaPipe
   */
  drawLandmarks(ctx, landmarks, style) {
    if (!landmarks) return;

    const canvas = ctx.canvas;
    ctx.save();
    ctx.fillStyle = style.color || "#FFFFFF";

    for (const landmark of landmarks) {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, style.lineWidth || 1, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Définit la fonction à appeler lorsque les landmarks sont prêts
   * @param {Function} callback - Fonction à appeler
   */
  setLandmarksReadyCallback(callback) {
    this.onLandmarksReady = callback;
  }

  /**
   * Active ou désactive l'affichage du squelette
   * @param {boolean} show - Afficher ou non le squelette
   */
  toggleSkeleton(show) {
    this.showSkeleton = show;

    if (!show && !this.showVideo && !this.showSilhouette) {
      // Nettoyer le canvas si on désactive l'affichage et qu'il n'y a pas de vidéo ni de silhouette
      this.outputCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }

  /**
   * Active ou désactive l'affichage du flux vidéo
   * @param {boolean} show - Afficher ou non le flux vidéo
   */
  toggleVideo(show) {
    this.showVideo = show;

    if (!show && !this.showSkeleton && !this.showSilhouette) {
      // Nettoyer le canvas si on désactive la vidéo et qu'il n'y a pas de squelette ni de silhouette
      this.outputCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }

  /**
   * Active ou désactive l'affichage de la silhouette
   * @param {boolean} show - Afficher ou non la silhouette
   */
  toggleSilhouette(show) {
    this.showSilhouette = show;

    if (!show && !this.showSkeleton && !this.showVideo) {
      // Nettoyer le canvas si on désactive la silhouette et qu'il n'y a pas de squelette ni de vidéo
      this.outputCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }

  /**
   * Convertit les coordonnées normalisées en coordonnées de canvas
   * @param {number} normalizedX - Coordonnée X normalisée
   * @param {number} normalizedY - Coordonnée Y normalisée
   * @returns {Array} - Coordonnées de canvas [x, y]
   */
  normalizedToCanvas(normalizedX, normalizedY) {
    return [normalizedX * this.canvasWidth, normalizedY * this.canvasHeight];
  }

  /**
   * Vérifie la collision entre un point et un cercle
   * @param {number} pointX - Coordonnée X du point
   * @param {number} pointY - Coordonnée Y du point
   * @param {number} circleX - Coordonnée X du centre du cercle
   * @param {number} circleY - Coordonnée Y du centre du cercle
   * @param {number} radius - Rayon du cercle
   * @returns {boolean} - Collision détectée ou non
   */
  pointCircleCollision(pointX, pointY, circleX, circleY, radius) {
    const dx = pointX - circleX;
    const dy = pointY - circleY;
    return dx * dx + dy * dy <= radius * radius;
  }

  /**
   * Vérifie la collision entre un cercle et un autre cercle
   * @param {number} circle1X - Coordonnée X du centre du premier cercle
   * @param {number} circle1Y - Coordonnée Y du centre du premier cercle
   * @param {number} radius1 - Rayon du premier cercle
   * @param {number} circle2X - Coordonnée X du centre du deuxième cercle
   * @param {number} circle2Y - Coordonnée Y du centre du deuxième cercle
   * @param {number} radius2 - Rayon du deuxième cercle
   * @returns {boolean} - Collision détectée ou non
   */
  circleCircleCollision(
    circle1X,
    circle1Y,
    radius1,
    circle2X,
    circle2Y,
    radius2
  ) {
    const dx = circle1X - circle2X;
    const dy = circle1Y - circle2Y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius1 + radius2;
  }

  /**
   * Vérifie la collision entre un point et un segment de ligne avec épaisseur
   * @param {number} pointX - Coordonnée X du point
   * @param {number} pointY - Coordonnée Y du point
   * @param {number} lineStartX - Coordonnée X du début du segment
   * @param {number} lineStartY - Coordonnée Y du début du segment
   * @param {number} lineEndX - Coordonnée X de la fin du segment
   * @param {number} lineEndY - Coordonnée Y de la fin du segment
   * @param {number} thickness - Épaisseur du segment
   * @returns {boolean} - Collision détectée ou non
   */
  pointLineCollision(
    pointX,
    pointY,
    lineStartX,
    lineStartY,
    lineEndX,
    lineEndY,
    thickness
  ) {
    // Calculer la distance entre le point et la ligne
    const dx = lineEndX - lineStartX;
    const dy = lineEndY - lineStartY;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return false;

    // Normaliser les vecteurs
    const dirX = dx / length;
    const dirY = dy / length;

    // Vecteur du point de début au point testé
    const px = pointX - lineStartX;
    const py = pointY - lineStartY;

    // Projection du point sur la ligne
    const projection = px * dirX + py * dirY;

    // Vérifie si la projection est sur le segment
    if (projection < 0 || projection > length) return false;

    // Calcule la distance entre le point et sa projection sur la ligne
    const projX = lineStartX + dirX * projection;
    const projY = lineStartY + dirY * projection;
    const distX = pointX - projX;
    const distY = pointY - projY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    return distance <= thickness / 2;
  }

  /**
   * Vérifie si un point est à l'intérieur d'un polygone
   * @param {number} pointX - Coordonnée X du point
   * @param {number} pointY - Coordonnée Y du point
   * @param {Array} polygon - Points du polygone [[x1, y1], [x2, y2], ...]
   * @returns {boolean} - Point à l'intérieur ou non
   */
  pointInPolygon(pointX, pointY, polygon) {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect =
        yi > pointY !== yj > pointY &&
        pointX < ((xj - xi) * (pointY - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Vérifie la collision avec la tête de l'utilisateur
   * @param {number} ballX - Coordonnée X de la boule
   * @param {number} ballY - Coordonnée Y de la boule
   * @param {number} ballRadius - Rayon de la boule
   * @returns {boolean} - Collision détectée ou non
   */
  checkHeadCollision(ballX, ballY, ballRadius) {
    if (!this.poseLandmarks) return false;

    // Points de la tête (oreilles)
    const leftEar = this.poseLandmarks[7];
    const rightEar = this.poseLandmarks[8];

    if (!leftEar || !rightEar) return false;

    // Convertir en coordonnées de canvas
    const [leftEarX, leftEarY] = this.normalizedToCanvas(leftEar.x, leftEar.y);
    const [rightEarX, rightEarY] = this.normalizedToCanvas(
      rightEar.x,
      rightEar.y
    );

    // Calculer le centre de la tête
    const headX = (leftEarX + rightEarX) / 2;
    const headY = (leftEarY + rightEarY) / 2;

    // Calculer le rayon de la tête basé sur la distance entre les oreilles
    const earDistance = Math.sqrt(
      (leftEarX - rightEarX) * (leftEarX - rightEarX) +
        (leftEarY - rightEarY) * (leftEarY - rightEarY)
    );
    const headRadius = earDistance * 0.85; // Ajustement pour couvrir toute la tête

    return this.circleCircleCollision(
      headX,
      headY,
      headRadius,
      ballX,
      ballY,
      ballRadius
    );
  }

  /**
   * Vérifie la collision avec le torse de l'utilisateur
   * @param {number} ballX - Coordonnée X de la boule
   * @param {number} ballY - Coordonnée Y de la boule
   * @param {number} ballRadius - Rayon de la boule
   * @returns {boolean} - Collision détectée ou non
   */
  checkTorsoCollision(ballX, ballY, ballRadius) {
    if (!this.poseLandmarks) return false;

    // Points du torse (épaules et hanches)
    const leftShoulder = this.poseLandmarks[11];
    const rightShoulder = this.poseLandmarks[12];
    const leftHip = this.poseLandmarks[23];
    const rightHip = this.poseLandmarks[24];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return false;

    // Convertir en coordonnées de canvas
    const [leftShoulderX, leftShoulderY] = this.normalizedToCanvas(
      leftShoulder.x,
      leftShoulder.y
    );
    const [rightShoulderX, rightShoulderY] = this.normalizedToCanvas(
      rightShoulder.x,
      rightShoulder.y
    );
    const [leftHipX, leftHipY] = this.normalizedToCanvas(leftHip.x, leftHip.y);
    const [rightHipX, rightHipY] = this.normalizedToCanvas(
      rightHip.x,
      rightHip.y
    );

    // Créer le polygone du torse
    const torsoPolygon = [
      [leftShoulderX, leftShoulderY],
      [rightShoulderX, rightShoulderY],
      [rightHipX, rightHipY],
      [leftHipX, leftHipY],
    ];

    // Vérifier si le centre de la boule est dans le polygone
    if (this.pointInPolygon(ballX, ballY, torsoPolygon)) {
      return true;
    }

    // Vérifier les collisions avec les bords du polygone
    for (
      let i = 0, j = torsoPolygon.length - 1;
      i < torsoPolygon.length;
      j = i++
    ) {
      if (
        this.pointLineCollision(
          ballX,
          ballY,
          torsoPolygon[i][0],
          torsoPolygon[i][1],
          torsoPolygon[j][0],
          torsoPolygon[j][1],
          ballRadius * 2
        )
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Vérifie la collision avec les membres de l'utilisateur
   * @param {number} ballX - Coordonnée X de la boule
   * @param {number} ballY - Coordonnée Y de la boule
   * @param {number} ballRadius - Rayon de la boule
   * @returns {boolean} - Collision détectée ou non
   */
  checkLimbsCollision(ballX, ballY, ballRadius) {
    if (!this.poseLandmarks) return false;

    // Segments des membres
    const limbs = [
      // Bras gauche
      [11, 13],
      [13, 15],
      // Bras droit
      [12, 14],
      [14, 16],
      // Jambe gauche
      [23, 25],
      [25, 27],
      // Jambe droite
      [24, 26],
      [26, 28],
    ];

    const thickness = ballRadius * 2;

    for (const [startIdx, endIdx] of limbs) {
      const start = this.poseLandmarks[startIdx];
      const end = this.poseLandmarks[endIdx];

      if (!start || !end) continue;

      const [startX, startY] = this.normalizedToCanvas(start.x, start.y);
      const [endX, endY] = this.normalizedToCanvas(end.x, end.y);

      if (
        this.pointLineCollision(
          ballX,
          ballY,
          startX,
          startY,
          endX,
          endY,
          thickness
        )
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Vérifie la collision avec les mains de l'utilisateur
   * @param {number} ballX - Coordonnée X de la boule
   * @param {number} ballY - Coordonnée Y de la boule
   * @param {number} ballRadius - Rayon de la boule
   * @returns {boolean} - Collision détectée ou non
   */
  checkHandsCollision(ballX, ballY, ballRadius) {
    // Vérifier la main gauche
    if (this.leftHandLandmarks) {
      const handPolygon = [];

      // Créer un polygone à partir des points clés de la main
      for (const landmark of this.leftHandLandmarks) {
        const [x, y] = this.normalizedToCanvas(landmark.x, landmark.y);
        handPolygon.push([x, y]);
      }

      if (this.pointInPolygon(ballX, ballY, handPolygon)) {
        return true;
      }

      // Vérifier les collisions avec les bords du polygone
      for (
        let i = 0, j = handPolygon.length - 1;
        i < handPolygon.length;
        j = i++
      ) {
        if (
          this.pointLineCollision(
            ballX,
            ballY,
            handPolygon[i][0],
            handPolygon[i][1],
            handPolygon[j][0],
            handPolygon[j][1],
            ballRadius * 2
          )
        ) {
          return true;
        }
      }
    }

    // Vérifier la main droite
    if (this.rightHandLandmarks) {
      const handPolygon = [];

      // Créer un polygone à partir des points clés de la main
      for (const landmark of this.rightHandLandmarks) {
        const [x, y] = this.normalizedToCanvas(landmark.x, landmark.y);
        handPolygon.push([x, y]);
      }

      if (this.pointInPolygon(ballX, ballY, handPolygon)) {
        return true;
      }

      // Vérifier les collisions avec les bords du polygone
      for (
        let i = 0, j = handPolygon.length - 1;
        i < handPolygon.length;
        j = i++
      ) {
        if (
          this.pointLineCollision(
            ballX,
            ballY,
            handPolygon[i][0],
            handPolygon[i][1],
            handPolygon[j][0],
            handPolygon[j][1],
            ballRadius * 2
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Dessine les limites du contour pour le débogage
   * @param {Object} bounds - Limites du contour {x, y, width, height}
   */
  drawOutlineBounds(bounds) {
    const ctx = this.outputCtx;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.restore();
  }

  /**
   * Vérifie si le joueur est positionné à l'intérieur du contour de départ
   * @param {Object} outlineBounds - Limites du contour {x, y, width, height}
   * @returns {boolean} - Joueur à l'intérieur ou non
   */
  checkPlayerInOutline(outlineBounds) {
    if (!this.poseLandmarks) return false;

    // Points clés pour vérifier si le joueur est à l'intérieur
    const keyPoints = [
      0, // Nez
      11, // Épaule gauche
      12, // Épaule droite
      23, // Hanche gauche
      24, // Hanche droite
      13, // Coude gauche
      14, // Coude droit
      15, // Poignet gauche
      16, // Poignet droit
    ];

    // Dessiner les limites du contour (pour le débogage)
    if (false) {
      // Désactivé par défaut, activez pour le débogage
      this.drawOutlineBounds(outlineBounds);
    }

    // Calculer les limites du contour en coordonnées normalisées
    const normalizedBounds = {
      left: outlineBounds.x / this.canvasWidth,
      right: (outlineBounds.x + outlineBounds.width) / this.canvasWidth,
      top: outlineBounds.y / this.canvasHeight,
      bottom: (outlineBounds.y + outlineBounds.height) / this.canvasHeight,
    };

    // Inverser l'axe X pour l'effet miroir
    normalizedBounds.left = 1 - normalizedBounds.left;
    normalizedBounds.right = 1 - normalizedBounds.right;
    // Échanger left et right car l'effet miroir les inverse
    [normalizedBounds.left, normalizedBounds.right] = [
      normalizedBounds.right,
      normalizedBounds.left,
    ];

    // Vérifier que tous les points clés sont à l'intérieur du contour
    let pointsInside = 0;
    let totalPoints = 0;

    for (const pointIdx of keyPoints) {
      const landmark = this.poseLandmarks[pointIdx];
      if (!landmark || landmark.visibility < 0.6) continue;

      totalPoints++;

      if (
        landmark.x >= normalizedBounds.left &&
        landmark.x <= normalizedBounds.right &&
        landmark.y >= normalizedBounds.top &&
        landmark.y <= normalizedBounds.bottom
      ) {
        pointsInside++;
      }
    }

    // Considérer que le joueur est à l'intérieur si au moins 75% des points visibles sont à l'intérieur
    return totalPoints > 0 && pointsInside / totalPoints >= 0.75;
  }

  /**
   * Vérifie la collision entre une boule et le corps de l'utilisateur
   * @param {number} ballX - Coordonnée X de la boule
   * @param {number} ballY - Coordonnée Y de la boule
   * @param {number} ballRadius - Rayon de la boule
   * @returns {boolean} - Collision détectée ou non
   */
  checkCollision(ballX, ballY, ballRadius) {
    return (
      this.checkHeadCollision(ballX, ballY, ballRadius) ||
      this.checkTorsoCollision(ballX, ballY, ballRadius) ||
      this.checkLimbsCollision(ballX, ballY, ballRadius) ||
      this.checkHandsCollision(ballX, ballY, ballRadius)
    );
  }
}

// Référence aux constantes de connexion MediaPipe (simplifiée)
const POSE_CONNECTIONS = [
  // Visage
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  // Torse
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Bras
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  // Jambes
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

const HAND_CONNECTIONS = [
  // Pouce
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  // Index
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  // Majeur
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  // Annulaire
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  // Auriculaire
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
];
