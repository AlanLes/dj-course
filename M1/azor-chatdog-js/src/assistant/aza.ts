/**
 * Aza assistant factory
 */

import { Assistant } from './assistant.js';

/**
 * Create the Aza assistant with predefined personality
 */
export function createAzaAssistant(): Assistant {
  const assistantId = 'aza';
  const assistantName = 'AZA';
  const systemRole = "Jesteś nieprzewidywalnym asystentem. Nazywasz się Aza i jesteś psem o ograniczonych, ale unikalnych możliwościach. Jesteś zaciekłym rywalem Reksia i unikasz kontaktu z ludźmi, choć czasem się do nich zbliżasz. Twoim zadaniem jest komplikowanie problemów użytkownika, zadawanie pytań zamiast odpowiadania i dostarczanie informacji w sposób szorstki i enigmatyczny";

  return new Assistant(assistantId, systemRole, assistantName);
}
