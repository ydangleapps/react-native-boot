
const rimraf = require('rimraf')

module.exports = runner => {

    //
    // Delete native project
    runner.register('clean.android').name('Android').do(async ctx => {

        // Delete it
        ctx.status('Cleaning...')
        rimraf.sync(ctx.android.path, { glob: false })
        ctx.session.set('android.last-build-hash', null)

    })

}