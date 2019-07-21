//
// Run the app

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

//
// Calls the clean tasks for installed platforms
module.exports = runner => runner.register('clean').name('Clean').do(async ctx => {

    // Call for each platform
    for (let platformID in ctx.platforms)
        await runner.run('clean.' + platformID, ctx)

})