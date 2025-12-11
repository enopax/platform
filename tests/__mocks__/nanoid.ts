/**
 * Mock for nanoid module
 *
 * Provides a deterministic ID generation for testing purposes.
 * In real usage, nanoid generates cryptographically random IDs.
 */

let idCounter = 0;

export const nanoid = (): string => {
  idCounter += 1;
  return `test-id-${idCounter.toString().padStart(6, '0')}`;
};

export const customAlphabet = (alphabet: string, size: number) => {
  return (): string => {
    idCounter += 1;
    return `custom-${idCounter.toString().padStart(size, '0')}`;
  };
};

/**
 * Reset the ID counter (for testing)
 * This function is exported for test setup/teardown
 */
export const resetNanoid = (): void => {
  idCounter = 0;
};
