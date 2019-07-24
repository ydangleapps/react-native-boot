
const rimraf = require('rimraf')

module.exports = runner => {

    //
    // Delete native project
    runner.register('clean.ios').name('iOS').do(async ctx => {

        // Delete it
        ctx.status('Cleaning...')
        rimraf.sync(ctx.ios.path, { glob: false })
        ctx.session.set('ios.last-build-hash', null)

    })

}