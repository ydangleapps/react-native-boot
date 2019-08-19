//
// Run the app

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

//
// Runs the user's app on their selected device
module.exports = runner => runner.register('server').name('Start server').do(async ctx => {

    // Start Metro bundler through CLI
    ctx.run(`node ./node_modules/react-native/cli.js start`)

})