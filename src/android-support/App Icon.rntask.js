
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs')
const sharp = require('sharp')
const chalk = require('chalk')

//
// Setup app icon
module.exports = runner => runner.register('prepare.android.icon').after('prepare.android').name('App icon').do(async ctx => {

    // Find path to app icon
    let name = ctx.property('icon.android') || 'icon-android.png'
    let fullPath = path.resolve(ctx.project.path, name)
    if (!fs.existsSync(fullPath))
        return ctx.warning('App icon ' + chalk.blue(name) + ' does not exist, skipping.')

    // Generate icons
    ctx.status('Generating icons...')
    replace.sync({
        files: path.resolve(ctx.android.path, 'app/src/main/AndroidManifest.xml'),
        from: `android:roundIcon="@mipmap/ic_launcher_round"`,
        to: ``
    })
    fs.unlinkSync(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-mdpi/ic_launcher_round.png'))
    fs.unlinkSync(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-hdpi/ic_launcher_round.png'))
    fs.unlinkSync(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-xhdpi/ic_launcher_round.png'))
    fs.unlinkSync(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png'))
    fs.unlinkSync(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png'))
    await sharp(fullPath).resize(48, 48).toFile(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-mdpi/ic_launcher.png'))
    await sharp(fullPath).resize(72, 72).toFile(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-hdpi/ic_launcher.png'))
    await sharp(fullPath).resize(96, 96).toFile(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-xhdpi/ic_launcher.png'))
    await sharp(fullPath).resize(144, 144).toFile(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-xxhdpi/ic_launcher.png'))
    await sharp(fullPath).resize(192, 192).toFile(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png'))

})