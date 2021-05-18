const launch = require('@serverless-chrome/lambda')

const handler = require('./xjv0adnhjir___api.js')
const options = {"flags":[]}

module.exports.checkUsername = function ensureHeadlessChrome (
  event,
  context,
  callback
) {
  return (typeof launch === 'function' ? launch : launch.default)(options)
    .then(instance =>
      handler.checkUsername(event, context, callback, instance))
    .catch((error) => {
      console.error(
        'Error occured in serverless-plugin-chrome wrapper when trying to ' +
          'ensure Chrome for checkUsername() handler.',
        options,
        error
      )

      callback(error)
    })
}