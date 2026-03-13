# Emergency Alert POC

Prova de conceito de um aplicativo Android para **alertas emergenciais** usando push notifications (FCM), com suporte a som de alarme, vibração forte, ligar tela e notificação em destaque.

## Stack

- **React Native** com **Expo** (SDK 55)
- **Expo Router** (file-based routing)
- **Firebase** (Authentication, Firestore, Cloud Messaging)
- **Notifee** (notificações avançadas no Android)
- **expo-notifications** (token FCM, recebimento de push)

> O projeto usa **Expo Dev Client** e **prebuild** porque o Notifee depende de código nativo.

---

## Estrutura do Projeto

```
emergency-alert-poc/
├── app/                    # Expo Router (file-based)
│   ├── _layout.tsx         # Layout raiz + AuthProvider
│   ├── index.tsx           # Redirect (login ou app)
│   ├── login.tsx           # Tela de login
│   └── (app)/              # Área autenticada
│       ├── _layout.tsx     # Tabs + listeners de notificação
│       ├── index.tsx       # Enviar alerta
│       ├── groups.tsx      # Grupos
│       └── profile.tsx     # Perfil / FCM token
├── components/
│   ├── AlertForm.tsx       # Formulário de envio de alerta
│   └── EmergencyOverlay.tsx # Overlay full-screen ao receber alerta
├── contexts/
│   └── AuthContext.tsx     # Autenticação + userData
├── lib/
│   ├── firebase.ts         # Config Firebase (Auth, Firestore)
│   ├── notifications.ts    # FCM token, listeners, Notifee display
│   └── notifee-channel.ts  # Canal de emergência Android
├── firebase/
│   ├── functions/
│   │   ├── index.js        # Cloud Function (trigger em /alerts)
│   │   └── package.json
│   └── firebase.json
├── app.json
├── google-services.json    # (criar a partir do Firebase Console)
└── google-services.json.example
```

---

## Configuração do Firebase

### 1. Criar projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto (ex: `emergency-alert-poc`)
3. Ative **Authentication** (Email/Password e Anônimo)
4. Crie um banco **Firestore**
5. Em **Project Settings > General**, adicione um app **Android**
   - Package name: `com.emergencyalert.poc`
   - Baixe o `google-services.json` e coloque na raiz do projeto

### 2. Configurar Cloud Messaging

- Em **Project Settings > Cloud Messaging**, copie o **Sender ID**
- Ative a **Cloud Messaging API** no Google Cloud Console (se necessário)

### 3. Configurar o app

Edite `lib/firebase.ts` e preencha com as credenciais do seu projeto:

```ts
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-sender-id",
  appId: "seu-app-id",
};
```

### 4. Regras do Firestore

Em **Firestore > Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /alerts/{alertId} {
      allow read, create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

---

## Executando o Projeto

### Pré-requisitos

- Node.js 18+
- Android Studio (para emulador ou build)
- Conta Expo
- Firebase configurado

### Desenvolvimento (Expo Go – sem Notifee)

Para testar apenas login, Firestore e envio de alertas:

```bash
cd emergency-alert-poc
npm install
npx expo start
# Escaneie o QR com Expo Go
```

> Nota: Push notifications e Notifee não funcionam no Expo Go. Use development build.

### Development Build (com Notifee e FCM)

1. **Instalar dependências e gerar código nativo:**

```bash
npm install
npx expo prebuild
```

2. **Rodar no Android:**

```bash
npx expo run:android
```

Ou com Dev Client:

```bash
npx expo install expo-dev-client
npx expo prebuild
npx expo run:android
```

### Gerar APK com EAS Build

1. **Instalar EAS CLI:**

```bash
npm install -g eas-cli
eas login
```

2. **Configurar o projeto:**

```bash
eas build:configure
```

3. **Gerar APK de desenvolvimento:**

```bash
eas build -p android --profile preview
```

4. **Gerar AAB para Play Store:**

```bash
eas build -p android --profile production
```

Crie/edite `eas.json`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## Cloud Functions

1. **Instalar Firebase CLI:**

```bash
npm install -g firebase-tools
firebase login
```

2. **Inicializar e deploy:**

```bash
cd firebase
firebase init functions
# ou, se já existir:
cd functions
npm install
firebase deploy --only functions
```

A função `sendEmergencyAlert` é disparada quando um documento é criado em `alerts`. Ela lê `title`, `message`, `target` (grupo ou `"todos"`), busca os tokens FCM e envia via FCM.

---

## Android: Canal e Comportamento da Notificação

O canal `emergency_alerts` é criado em `lib/notifee-channel.ts` com:

- `AndroidImportance.HIGH`
- `bypassDnd: true` (quando permitido pelo usuário)
- Padrão de vibração forte
- Luz vermelha

Para `fullScreenAction` (tela cheia ao receber alerta), é necessário:

1. `USE_FULL_SCREEN_INTENT` no AndroidManifest
2. `showWhenLocked` e `turnScreenOn` no canal/notificação
3. Permissões configuradas em `app.json`

---

## Limitações do Android

### Modo Silencioso e Não Perturbe (DND)

- **Silencioso:** Apps podem usar canais de alta prioridade; o sistema pode suprimir som/vibração.
- **DND:** `bypassDnd: true` só funciona se o app tiver permissão de **Acesso às configurações de DND**; o usuário precisa autorizar manualmente.
- **Modo Não Perturbe estrito:** O Android pode ignorar exceções e não tocar nem vibrar.

### Push vs Cell Broadcast

| Aspecto        | Push (FCM)              | Cell Broadcast (CB)        |
|----------------|-------------------------|----------------------------|
| Infraestrutura | Servidor (Firebase)     | Rede celular (operadora)   |
| Cobertura      | Precisa de internet     | Funciona sem internet      |
| Controle       | Total pelo app          | Governamental / operadora  |
| Uso típico     | App próprio, equipes    | Alertas oficiais (AMBER, tsunami, etc.) |
| Prioridade     | Alta, mas limitada      | Máxima no sistema          |

Alertas governamentais (ex.: emergências públicas) usam **Cell Broadcast**, integrado ao sistema operacional. Push notifications **não substituem** o Cell Broadcast para esse tipo de alerta.

---

## Funcionalidades Implementadas

- [x] Login (email/senha e anônimo)
- [x] Registro de FCM token no Firestore
- [x] Associação a grupos
- [x] Envio de alerta (todos ou grupo)
- [x] Cloud Function que envia FCM ao criar alerta
- [x] Canal de alta prioridade com Notifee
- [x] Overlay full-screen ao receber alerta (in-app)
- [x] Vibração e destaque visual
- [ ] Piscar tela em vermelho/branco (opcional)
- [ ] Piscar flash da câmera (opcional, requer `expo-camera`)

---

## Teste Visual Opcional

Para piscar a tela ou o flash, use `EmergencyOverlay` com `flashEffect={true}` e, se quiser, integre `expo-camera` para controlar o flash do dispositivo.

---

## Licença

MIT
