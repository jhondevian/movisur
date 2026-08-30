import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";

type PushPayload = {
  title: string;
  body: string;
  notificationId?: string;
  route?: string;
  type?: string;
};

function getFirebasePrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function canUseFirebaseAdmin() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      getFirebasePrivateKey()
  );
}

function ensureFirebaseAdmin() {
  if (!canUseFirebaseAdmin()) return null;

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getFirebasePrivateKey(),
      }),
    });
  }

  return getMessaging();
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
) {
  const messaging = ensureFirebaseAdmin();
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  if (!messaging || uniqueUserIds.length === 0) return;

  const pushTokens = await prisma.mobilePushToken.findMany({
    where: {
      userId: { in: uniqueUserIds },
      isActive: true,
    },
    select: { id: true, token: true },
  });

  if (pushTokens.length === 0) return;

  const response = await messaging.sendEachForMulticast({
    tokens: pushTokens.map((pushToken) => pushToken.token),
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      notificationId: payload.notificationId ?? "",
      route: payload.route ?? "vaults",
      type: payload.type ?? "notification",
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  });

  const invalidTokenIds = response.responses
    .map((result, index) => ({ result, token: pushTokens[index] }))
    .filter(({ result }) => {
      const code = result.error?.code;
      return (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      );
    })
    .map(({ token }) => token.id);

  if (invalidTokenIds.length > 0) {
    await prisma.mobilePushToken.updateMany({
      where: { id: { in: invalidTokenIds } },
      data: { isActive: false },
    });
  }
}

export async function sendPushToRoles(
  roles: Array<"admin" | "moderador" | "creador" | "usuario">,
  payload: PushPayload
) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true },
  });

  await sendPushToUsers(
    users.map((user) => user.id),
    payload
  );
}
