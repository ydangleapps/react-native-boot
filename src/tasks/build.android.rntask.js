
// const path = require('path')
// const chalk = require('chalk')

// module.exports = runner => runner.register('build.android').name('Build for Android').do(async ctx => {

//     // Recreate project structure
//     await runner.run('prepare', ctx)

//     // Run build command
//     ctx.status('Building...')
//     await ctx.run('gradlew app:assembleRelease', { cwd: path.resolve(ctx.project.path, 'android') })

//     // Done
//     ctx.status('Done! APK can be found at ' + chalk.cyan('android/app/build/outputs/apk/release/app-release.apk'))

// })