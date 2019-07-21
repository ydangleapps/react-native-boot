//
// Run the app

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

//
// Runs the user's app on their selected device
module.exports = runner => runner.register('run').name('Run').do(async ctx => {

    // Setup project if needed
    await runner.run('setup.check', ctx)
    if (ctx.setupNeeded)
        await runner.run('setup', ctx)

    // Select device if needed
    await runner.run('devices.check', ctx)
    if (!ctx.device)
        await runner.run('devices', ctx)

    // Execute selected device's run task
    await runner.run(`run.${ctx.device.platform}`, ctx)

})