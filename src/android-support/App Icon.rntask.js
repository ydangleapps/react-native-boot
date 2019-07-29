
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs')
const sharp = require('sharp')
const chalk = require('chalk')

//
// Setup app icon
module.exports = runner => runner.register('prepare.android.icon').name('App icon').do(async ctx => {

    // Find app icon
    let iconFile = ''
    if (await fs.exists(path.resolve(ctx.project.path, 'metadata/icon-android.png')))
        iconFile = path.resolve(ctx.project.path, 'metadata/icon-android.png')
    else if (await fs.exists(path.resolve(ctx.project.path, 'metadata/icon.png')))
        iconFile = path.resolve(ctx.project.path, 'metadata/icon.png')
    else
        return ctx.warning('No icon found. Please add an app icon to ' + chalk.cyan('metadata/icon-android.png') + ' in your project.')

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
    await sharp(iconFile).resize(48, 48).toFile(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-mdpi/ic_launcher.png'))
    await sharp(iconFile).resize(72, 72).toFile(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-hdpi/ic_launcher.png'))
    await sharp(iconFile).resize(96, 96).toFile(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-xhdpi/ic_launcher.png'))
    await sharp(iconFile).resize(144, 144).toFile(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-xxhdpi/ic_launcher.png'))
    await sharp(iconFile).resize(192, 192).toFile(path.resolve(ctx.android.path, 'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png'))

})