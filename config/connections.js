'use strict';

/**
 * Connections
 * (sails.config.connections)
 *
 * `Connections` are like "saved settings" for your adapters.  What's the difference between
 * a connection and an adapter, you might ask?  An adapter (e.g. `sails-mysql`) is generic--
 * it needs some additional information to work (e.g. your database host, password, user, etc.)
 * A `connection` is that additional information.
 *
 * Each model must have a `connection` property (a string) which is references the name of one
 * of these connections.  If it doesn't, the default `connection` configured in `config/models.js`
 * will be applied.  Of course, a connection can (and usually is) shared by multiple models.
 * .
 * Note: If you're using version control, you should put your passwords/api keys
 * in `config/local.js`, environment variables, or use another strategy.
 * (this is to prevent you inadvertently sensitive credentials up to your repository.)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.connections.html
 */
module.exports.connections = {

  /**
   * MongoDB is the leading NoSQL database.
   * http://en.wikipedia.org/wiki/MongoDB
   *
   * Run:
   * npm install sails-mongo
   */
  mongoServer: {
    adapter: 'sails-mongo',
    url: process.env.MONGO_URL || 'mongodb://localhost:27017/kalendoc'
  },

  mandrillAdapter: {
    apiKey: process.env.MANDRILL_KEY, // the api key for your mandrill account
    fromName: 'Kalendoc',
    fromEmail: 'noreply@kalendoc.com'
  },

  callr: {
    user: 'kalendoc',
    pass: process.env.CALLR_PASS,
    sendSMS: (process.env.SEND_SMS === 'true') || false,
    callback: 'http://kalendoc-api.scalingo.io/sms/receive'
  },

  slack: {
    status: 'https://hooks.slack.com/services/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',
    sms: 'https://hooks.slack.com/services/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',
    api: 'https://hooks.slack.com/services/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'
  }

  /**
   * More adapters:
   * https://github.com/balderdashy/sails
   */
};
