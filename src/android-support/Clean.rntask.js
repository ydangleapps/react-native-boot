
const fs = require('fs-extra')

module.exports = runner => {

    //
    // Delete native project
    runner.register('clean.android').name('Android').do(async ctx => {

        // Delete it
        ctx.status('Cleaning...')
        await fs.remove(ctx.android.path)
        ctx.session.set('android.last-build-hash', null)

        // Check if still exists
        if (await fs.exists(ctx.android.path))
            throw new Error('Unable to delete Android build folder. Maybbe you have a stuck instance of ' + chalk.yellow('adb') + ' still running?')

    })

}