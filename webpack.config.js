const webpackMerge = require('webpack-merge')
const common = require('./config/webpack/webpack.common')
const env = process.env.NODE_ENV || 'development'
const envConfig = require(`./config/webpack/webpack.${env}`)

const getAddons = addonsArgs => {
  const addons = Array.isArray(addonsArgs) ? addonsArgs : [addonsArgs]
  return addons
    .filter(Boolean)
    .map(name => require(`./config/webpack/addons/webpack.${name}.js`))
}

module.exports = ({ addon } = {}) => {
  console.log('process.env.NODE_ENV===>', env, (addon ? `  addons ==> ${addon}` : ''))
  return webpackMerge(common, envConfig, ...getAddons(addon))
}
