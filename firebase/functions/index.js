/**
 * Firebase Cloud Functions - Sistema de Alertas Emergenciais
 *
 * Trigger: onCreate em /alerts/{alertId}
 * Lê o alerta, obtém tokens FCM dos destinatários e envia via FCM
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

admin.initializeApp();

const db = admin.firestore();

/**
 * Envia alerta via FCM quando um novo documento é criado em /alerts
 */
exports.sendEmergencyAlert = functions.firestore
  .document("alerts/{alertId}")
  .onCreate(async (snap, context) => {
    const alertId = context.params.alertId;
    const { title, message, target, createdBy } = snap.data();

    if (!title || !message) {
      console.error("Alerta sem título ou mensagem");
      return;
    }

    let usersWithTokens = [];

    if (target === "todos") {
      const usersSnap = await db.collection("users").get();
      usersWithTokens = usersSnap.docs
        .map((d) => ({ userId: d.id, token: d.data().fcmToken }))
        .filter((u) => u.token);
    } else {
      const usersSnap = await db
        .collection("users")
        .where("groups", "array-contains", target)
        .get();
      usersWithTokens = usersSnap.docs
        .map((d) => ({ userId: d.id, token: d.data().fcmToken }))
        .filter((u) => u.token);
    }

    const tokens = usersWithTokens.map((u) => u.token);

    if (tokens.length === 0) {
      console.log("Nenhum token FCM encontrado para o destino:", target);
      return;
    }

    // IMPORTANTE: Enviamos apenas "data" (data-only) para que o app exiba via Notifee.
    // Com "notification", o sistema exibe automaticamente usando canal padrão (sem bypass DND).
    // Com data-only, nosso handler processa e exibe via notifee.displayNotification()
    // usando o canal emergency_alerts que tem bypassDnd: true.
    const payload = {
      data: {
        isEmergency: "true",
        title,
        message,
        alertId,
      },
      android: {
        priority: "high",
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: {
          aps: {
            contentAvailable: 1,
          },
        },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...payload,
      });
      console.log(
        `Enviado para ${response.successCount}/${tokens.length} dispositivos`,
      );
      // Remover tokens inválidos do Firestore (ex: app desinstalado, token expirado)
      const invalidTokenErrors = [
        "messaging/registration-token-not-registered",
        "messaging/invalid-registration-token",
      ];
      const removePromises = [];
      response.responses.forEach((resp, i) => {
        if (!resp.success && resp.error) {
          console.error(
            `Token ${i + 1} falhou:`,
            resp.error.code,
            resp.error.message,
          );
          if (invalidTokenErrors.includes(resp.error.code)) {
            const { userId } = usersWithTokens[i];
            removePromises.push(
              db.collection("users").doc(userId).update({ fcmToken: FieldValue.delete() }),
            );
            console.log(`Token inválido removido do usuário ${userId}`);
          }
        }
      });
      await Promise.all(removePromises);
    } catch (error) {
      console.error("Erro ao enviar FCM:", error);
    }
  });
