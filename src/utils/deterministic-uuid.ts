import { createHash } from 'crypto';

/**
 * Generate a deterministic UUID v5 from a Privy ID
 * This ensures the same Privy ID always generates the same UUID
 */
export function generateDeterministicUUID(privyId: string): string {
  console.log('[generateDeterministicUUID] Generating UUID for privyId:', privyId);
  
  // Use SHA-256 to hash the Privy ID
  const hash = createHash('sha256').update(privyId).digest('hex');
  console.log('[generateDeterministicUUID] SHA-256 hash:', hash);
  
  // Format as UUID v5 (deterministic UUID)
  // Take first 32 chars of hash and format as UUID
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16), // Version 5
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20), // Variant bits
    hash.substring(20, 32)
  ].join('-');
  
  console.log('[generateDeterministicUUID] Generated UUID:', uuid);
  return uuid;
}

/**
 * Generate a channel-specific UUID by combining user's deterministic UUID with a namespace
 */
export function generateChannelUUID(privyId: string, namespace: string = 'private-channel'): string {
  const userUuid = generateDeterministicUUID(privyId);
  const combined = `${namespace}:${userUuid}`;
  
  // Generate another deterministic UUID from the combination
  const hash = createHash('sha256').update(combined).digest('hex');
  
  const channelUuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
  
  return channelUuid;
}

/**
 * Validate if a string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
} 