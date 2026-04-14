/**
 * Nexus-Core: Identity Utility
 * Generates unique internal identifiers for Models and Collections.
 */

let counter = 0;
const prefix = 'nxc'; // "Nexus Core"

/**
 * Generates a unique client-side ID.
 * 2026 approach: simple, fast incrementing IDs for local state,
 * but prefixed to avoid collisions with external DB IDs.
 */
export const uniqueId = () => {
  counter++;
  return `${prefix}${counter}`;
};
