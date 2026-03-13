/**
 * Entry point customizado: registra o handler FCM ANTES do app iniciar.
 * Obrigatório para mensagens em background/killed funcionarem.
 */
require('./lib/fcm-handler');
require('expo-router/entry');
