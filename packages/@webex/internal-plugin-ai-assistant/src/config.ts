/*!
 * Copyright (c) 2015-2025 Cisco Systems, Inc. See LICENSE file.
 */

export default {
  aiassistant: {
    /**
     * Timeout before AI Assistant request fails, in milliseconds.
     * @type {Number}
     */
    requestTimeout: 60000,

    /**
     * If run in Hybrid model, don't need decryption
     * @type {boolean}
     */
    needDecryption: true,

    /**
     * If run in Hybrid model, don't need encryption
     * @type {boolean}
     */
    needEncryption: true,
  },
};
