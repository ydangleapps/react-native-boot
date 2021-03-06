
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs-extra')
const sharp = require('sharp')
const chalk = require('chalk')

module.exports = runner => runner.register('prepare.ios.icons').after('prepare').name('App icons').do(async ctx => {

    // Find app icon
    let iconFile = ''
    if (await fs.exists(path.resolve(ctx.project.path, 'metadata/icon-ios.png')))
        iconFile = path.resolve(ctx.project.path, 'metadata/icon-ios.png')
    else if (await fs.exists(path.resolve(ctx.project.path, 'metadata/icon.png')))
        iconFile = path.resolve(ctx.project.path, 'metadata/icon.png')
    else
        return ctx.warning('No icon found. Please add an app icon to ' + chalk.cyan('metadata/icon-ios.png') + ' in your project.')

    // Generate iOS app icons
    ctx.status(`Generating app icons...`)
    let iosIconMeta = {
        "images" : [
            {
            "size" : "20x20",
            "idiom" : "iphone",
            "filename" : "icon-20@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "20x20",
            "idiom" : "iphone",
            "filename" : "icon-20@3x.png",
            "scale" : "3x"
            },
            {
            "size" : "29x29",
            "idiom" : "iphone",
            "filename" : "icon-29@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "29x29",
            "idiom" : "iphone",
            "filename" : "icon-29@3x.png",
            "scale" : "3x"
            },
            {
            "size" : "40x40",
            "idiom" : "iphone",
            "filename" : "icon-40@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "40x40",
            "idiom" : "iphone",
            "filename" : "icon-40@3x.png",
            "scale" : "3x"
            },
            {
            "size" : "60x60",
            "idiom" : "iphone",
            "filename" : "icon-60@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "60x60",
            "idiom" : "iphone",
            "filename" : "icon-60@3x.png",
            "scale" : "3x"
            },
            {
            "size" : "20x20",
            "idiom" : "ipad",
            "filename" : "icon-20.png",
            "scale" : "1x"
            },
            {
            "size" : "20x20",
            "idiom" : "ipad",
            "filename" : "icon-20@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "29x29",
            "idiom" : "ipad",
            "filename" : "icon-29.png",
            "scale" : "1x"
            },
            {
            "size" : "29x29",
            "idiom" : "ipad",
            "filename" : "icon-29@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "40x40",
            "idiom" : "ipad",
            "filename" : "icon-40.png",
            "scale" : "1x"
            },
            {
            "size" : "40x40",
            "idiom" : "ipad",
            "filename" : "icon-40@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "76x76",
            "idiom" : "ipad",
            "filename" : "icon-76.png",
            "scale" : "1x"
            },
            {
            "size" : "76x76",
            "idiom" : "ipad",
            "filename" : "icon-76@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "83.5x83.5",
            "idiom" : "ipad",
            "filename" : "icon-83.5@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "1024x1024",
            "idiom" : "ios-marketing",
            "filename" : "icon-1024.png",
            "scale" : "1x"
            },
            {
            "size" : "60x60",
            "idiom" : "car",
            "filename" : "icon-60@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "60x60",
            "idiom" : "car",
            "filename" : "icon-60@3x.png",
            "scale" : "3x"
            },
            {
            "size" : "24x24",
            "idiom" : "watch",
            "filename" : "icon-24@2x.png",
            "scale" : "2x",
            "role" : "notificationCenter",
            "subtype" : "38mm"
            },
            {
            "size" : "27.5x27.5",
            "idiom" : "watch",
            "filename" : "icon-27.5@2x.png",
            "scale" : "2x",
            "role" : "notificationCenter",
            "subtype" : "42mm"
            },
            {
            "size" : "29x29",
            "idiom" : "watch",
            "filename" : "icon-29@2x.png",
            "role" : "companionSettings",
            "scale" : "2x"
            },
            {
            "size" : "29x29",
            "idiom" : "watch",
            "filename" : "icon-29@3x.png",
            "role" : "companionSettings",
            "scale" : "3x"
            },
            {
            "size" : "40x40",
            "idiom" : "watch",
            "filename" : "icon-40@2x.png",
            "scale" : "2x",
            "role" : "appLauncher",
            "subtype" : "38mm"
            },
            {
            "size" : "44x44",
            "idiom" : "watch",
            "filename" : "icon-44@2x.png",
            "scale" : "2x",
            "role" : "appLauncher",
            "subtype" : "40mm"
            },
            {
            "size" : "50x50",
            "idiom" : "watch",
            "filename" : "icon-50@2x.png",
            "scale" : "2x",
            "role" : "appLauncher",
            "subtype" : "44mm"
            },
            {
            "size" : "86x86",
            "idiom" : "watch",
            "filename" : "icon-86@2x.png",
            "scale" : "2x",
            "role" : "quickLook",
            "subtype" : "38mm"
            },
            {
            "size" : "98x98",
            "idiom" : "watch",
            "filename" : "icon-98@2x.png",
            "scale" : "2x",
            "role" : "quickLook",
            "subtype" : "42mm"
            },
            {
            "size" : "108x108",
            "idiom" : "watch",
            "filename" : "icon-108@2x.png",
            "scale" : "2x",
            "role" : "quickLook",
            "subtype" : "44mm"
            },
            {
            "size" : "1024x1024",
            "idiom" : "watch-marketing",
            "filename" : "icon-1024.png",
            "scale" : "1x"
            },
            {
            "size" : "16x16",
            "idiom" : "mac",
            "filename" : "icon-16.png",
            "scale" : "1x"
            },
            {
            "size" : "16x16",
            "idiom" : "mac",
            "filename" : "icon-16@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "32x32",
            "idiom" : "mac",
            "filename" : "icon-32.png",
            "scale" : "1x"
            },
            {
            "size" : "32x32",
            "idiom" : "mac",
            "filename" : "icon-32@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "128x128",
            "idiom" : "mac",
            "filename" : "icon-128.png",
            "scale" : "1x"
            },
            {
            "size" : "128x128",
            "idiom" : "mac",
            "filename" : "icon-128@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "256x256",
            "idiom" : "mac",
            "filename" : "icon-256.png",
            "scale" : "1x"
            },
            {
            "size" : "256x256",
            "idiom" : "mac",
            "filename" : "icon-256@2x.png",
            "scale" : "2x"
            },
            {
            "size" : "512x512",
            "idiom" : "mac",
            "filename" : "icon-512.png",
            "scale" : "1x"
            },
            {
            "size" : "512x512",
            "idiom" : "mac",
            "filename" : "icon-512@2x.png",
            "scale" : "2x"
            }
        ],
        "info" : {
            "version" : 1,
            "author" : "xcode"
        }
    }
    let idx = 0
    for (let meta of iosIconMeta.images) {

        // Get image size
        idx += 1
        let width = Math.floor(parseFloat(meta.size) * parseFloat(meta.scale || '1'))
        meta.filename = `icon-${idx}.png`
        await sharp(iconFile).resize(width, width).toFile(path.resolve(ctx.ios.path, 'HelloWorld/Images.xcassets/AppIcon.appiconset', meta.filename))
    
    }
    await fs.writeFile(path.resolve(ctx.ios.path, 'HelloWorld/Images.xcassets/AppIcon.appiconset/Contents.json'), JSON.stringify(iosIconMeta))

})