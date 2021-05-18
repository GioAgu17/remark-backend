const launch = require('@serverless-chrome/lambda')

const handler = require('./6w6utvbrr8x___api.js')
const options = {"flags":[]}

module.exports.getProfilePic = function ensureHeadlessChrome (
  event,
  context,
  callback
) {
  return (typeof launch === 'function' ? launch : launch.default)(options)
    .then(instance =>
      handler.getProfilePic(event, context, callback, instance))
    .catch((error) => {
      console.error(
        'Error occured in serverless-plugin-chrome wrapper when trying to ' +
          'ensure Chrome for getProfilePic() handler.',
        options,
        error
      )

      callback(error)
    })
}