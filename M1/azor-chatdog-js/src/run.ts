#!/usr/bin/env node

/**
 * Azor ChatDog - Entry point
 */

import { initChat, mainLoop } from './chat.js';

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    await initChat();
    await mainLoop();
  } catch (error) {
    const err = error as Error;
    console.error('Fatal error:', err.message || String(error));
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Run the application
main();
