import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { User } from '../../models/user/user.model';

export class FirebaseService {
    private static instance: boolean = false;

    /**
     * Initialize Firebase Admin SDK
     */
    static initialize() {
        if (this.instance) return;

        try {
            const serviceAccountPath = path.join(process.cwd(), 'certs', 'firebase-service-account.json');
            
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                this.instance = true;
                console.log('Firebase Admin SDK initialized successfully');
            } else {
                console.warn(`Firebase service account file not found at: ${serviceAccountPath}\nPush notifications will be disabled until this file is provided.`);
            }
        } catch (error) {
            console.error('Error initializing Firebase Admin SDK:', error);
        }
    }

    /**
     * Send push notification to a specific user
     */
    static async sendToUser(userId: string, title: string, body: string, data: any = {}) {
        if (!this.instance) return;

        try {
            const user = await User.findById(userId).select('fcmTokens');
            if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
                return;
            }

            const tokens = user.fcmTokens;

            const message: admin.messaging.MulticastMessage = {
                notification: {
                    title,
                    body,
                },
                android: {
                    notification: {
                        sound: 'default',
                        priority: 'high',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        },
                    },
                },
                webpush: {
                    notification: {
                        icon: '/icon-192.png',
                        badge: '/icon-192.png',
                    },
                },
                data: {
                    ...data,
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
                tokens: tokens,
            };

            const response = await admin.messaging().sendEachForMulticast(message);
            
            // Clean up invalid tokens
            if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const error = resp.error as any;
                        if (error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/registration-token-not-registered') {
                            failedTokens.push(tokens[idx]);
                        }
                    }
                });

                if (failedTokens.length > 0) {
                    await User.findByIdAndUpdate(userId, {
                        $pull: { fcmTokens: { $in: failedTokens } }
                    });
                }
            }
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }
}
