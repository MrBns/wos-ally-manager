import { eq } from 'drizzle-orm';
import { getDb } from '../../shared/db.js';
import { giftcodes, giftcodeRedemptions, users, notifications } from '../../shared/schema.js';
import { generateId } from '../../shared/id.js';

const WOS_GIFT_CODE_API = 'https://wos-giftcode-api.centurygame.com/api/player';
const WOS_GIFT_CODE_EXCHANGE_API = 'https://wos-giftcode-api.centurygame.com/api/gift_code';

export class GiftcodesService {
  private get db() { return getDb(); }

  async listGiftcodes() {
    return this.db.select().from(giftcodes).orderBy(giftcodes.createdAt);
  }

  async addGiftcode(data: { code: string; addedBy: string; expiresAt?: string | null }) {
    const id = generateId();
    const now = new Date().toISOString();
    const [code] = await this.db.insert(giftcodes).values({
      id,
      code: data.code,
      addedBy: data.addedBy,
      expiresAt: data.expiresAt ?? null,
      isActive: true,
      createdAt: now,
    }).returning();

    // Trigger auto-claim for all users asynchronously
    this.autoClaimForAllUsers(code.id, code.code).catch(console.error);

    return code;
  }

  private async autoClaimForAllUsers(giftcodeId: string, code: string) {
    const allUsers = await this.db.select().from(users);
    console.log(`[GiftCodes] Auto-claiming code "${code}" for ${allUsers.length} users`);

    for (const user of allUsers) {
      await this.claimForUser(giftcodeId, code, user);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private async claimForUser(giftcodeId: string, code: string, user: { id: string; gameUserId: string }) {
    const redemptionId = generateId();
    let status: 'success' | 'failed' | 'already_claimed' = 'failed';

    try {
      // Step 1: Get player sign (authentication token for WOS API)
      const sign = this.generateWosSign(user.gameUserId);

      const playerRes = await fetch(WOS_GIFT_CODE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ fid: user.gameUserId, sign }),
      });

      if (!playerRes.ok) {
        throw new Error(`Player API error: ${playerRes.status}`);
      }

      // Step 2: Redeem gift code
      const redeemSign = this.generateWosSign(user.gameUserId + code);
      const redeemRes = await fetch(WOS_GIFT_CODE_EXCHANGE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ fid: user.gameUserId, cdk: code, sign: redeemSign }),
      });

      const redeemData = await redeemRes.json() as { msg?: string; err_code?: number };

      if (redeemData.err_code === 40014) {
        status = 'already_claimed';
      } else if (redeemData.err_code === 0 || redeemRes.ok) {
        status = 'success';
      } else {
        status = 'failed';
      }
    } catch (err) {
      console.error(`[GiftCodes] Failed to claim for user ${user.gameUserId}:`, err);
      status = 'failed';
    }

    await this.db.insert(giftcodeRedemptions).values({
      id: redemptionId,
      giftcodeId,
      userId: user.id,
      status,
      redeemedAt: new Date().toISOString(),
    });

    // Create in-app notification
    if (status === 'success') {
      await this.db.insert(notifications).values({
        id: generateId(),
        userId: user.id,
        eventId: null,
        type: 'giftcode',
        channel: 'inapp',
        title: '🎁 Gift Code Claimed!',
        body: `Gift code "${code}" has been successfully claimed for your account.`,
        read: false,
        sentAt: new Date().toISOString(),
      });
    }

    console.log(`[GiftCodes] User ${user.gameUserId}: ${status}`);
  }

  /**
   * Generate WOS API sign using MD5.
   * Based on the open-source WOS gift code redemption implementations.
   */
  private generateWosSign(input: string): string {
    // WOS uses MD5 hash with a salt
    // The actual salt/algorithm needs to be reverse-engineered from the game client
    // Using a common implementation found in community tools
    const { createHash } = require('node:crypto');
    const salt = '7bzapT4KfpADMNpf'; // Known salt from community implementations
    return createHash('md5').update(input + salt).digest('hex');
  }

  async getRedemptions(giftcodeId: string) {
    return this.db.select().from(giftcodeRedemptions)
      .where(eq(giftcodeRedemptions.giftcodeId, giftcodeId));
  }

  async deactivateGiftcode(id: string) {
    await this.db.update(giftcodes).set({ isActive: false }).where(eq(giftcodes.id, id));
  }
}
