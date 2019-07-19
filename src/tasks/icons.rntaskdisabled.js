
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs')
const sharp = require('sharp')

// module.exports = runner => runner.register('prepare.icons').after('prepare').name('App icons').do(async ctx => {

//     // Generate Android app icons
//     ctx.status(`Generating app icons...`)
//     replace.sync({
//         files: path.resolve(ctx.project.path, 'android/app/src/main/AndroidManifest.xml'),
//         from: `android:roundIcon="@mipmap/ic_launcher_round"`,
//         to: ``
//     })
//     fs.unlinkSync(path.resolve(ctx.project.path, 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png'))
//     fs.unlinkSync(path.resolve(ctx.project.path, 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png'))
//     fs.unlinkSync(path.resolve(ctx.project.path, 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png'))
//     fs.unlinkSync(path.resolve(ctx.project.path, 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png'))
//     fs.unlinkSync(path.resolve(ctx.project.path, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png'))
//     await sharp(path.resolve(ctx.project.path, 'metadata/icon-android.png')).resize(48, 48).toFile(path.resolve(ctx.project.path, 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png'))
//     await sharp(path.resolve(ctx.project.path, 'metadata/icon-android.png')).resize(72, 72).toFile(path.resolve(ctx.project.path, 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png'))
//     await sharp(path.resolve(ctx.project.path, 'metadata/icon-android.png')).resize(96, 96).toFile(path.resolve(ctx.project.path, 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png'))
//     await sharp(path.resolve(ctx.project.path, 'metadata/icon-android.png')).resize(144, 144).toFile(path.resolve(ctx.project.path, 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png'))
//     await sharp(path.resolve(ctx.project.path, 'metadata/icon-android.png')).resize(192, 192).toFile(path.resolve(ctx.project.path, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png'))
    
//     let iosIconMeta = {
//         "images" : [
//             {
//             "size" : "20x20",
//             "idiom" : "iphone",
//             "filename" : "icon-20@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "20x20",
//             "idiom" : "iphone",
//             "filename" : "icon-20@3x.png",
//             "scale" : "3x"
//             },
//             {
//             "size" : "29x29",
//             "idiom" : "iphone",
//             "filename" : "icon-29@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "29x29",
//             "idiom" : "iphone",
//             "filename" : "icon-29@3x.png",
//             "scale" : "3x"
//             },
//             {
//             "size" : "40x40",
//             "idiom" : "iphone",
//             "filename" : "icon-40@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "40x40",
//             "idiom" : "iphone",
//             "filename" : "icon-40@3x.png",
//             "scale" : "3x"
//             },
//             {
//             "size" : "60x60",
//             "idiom" : "iphone",
//             "filename" : "icon-60@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "60x60",
//             "idiom" : "iphone",
//             "filename" : "icon-60@3x.png",
//             "scale" : "3x"
//             },
//             {
//             "size" : "20x20",
//             "idiom" : "ipad",
//             "filename" : "icon-20.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "20x20",
//             "idiom" : "ipad",
//             "filename" : "icon-20@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "29x29",
//             "idiom" : "ipad",
//             "filename" : "icon-29.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "29x29",
//             "idiom" : "ipad",
//             "filename" : "icon-29@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "40x40",
//             "idiom" : "ipad",
//             "filename" : "icon-40.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "40x40",
//             "idiom" : "ipad",
//             "filename" : "icon-40@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "76x76",
//             "idiom" : "ipad",
//             "filename" : "icon-76.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "76x76",
//             "idiom" : "ipad",
//             "filename" : "icon-76@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "83.5x83.5",
//             "idiom" : "ipad",
//             "filename" : "icon-83.5@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "1024x1024",
//             "idiom" : "ios-marketing",
//             "filename" : "icon-1024.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "60x60",
//             "idiom" : "car",
//             "filename" : "icon-60@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "60x60",
//             "idiom" : "car",
//             "filename" : "icon-60@3x.png",
//             "scale" : "3x"
//             },
//             {
//             "size" : "24x24",
//             "idiom" : "watch",
//             "filename" : "icon-24@2x.png",
//             "scale" : "2x",
//             "role" : "notificationCenter",
//             "subtype" : "38mm"
//             },
//             {
//             "size" : "27.5x27.5",
//             "idiom" : "watch",
//             "filename" : "icon-27.5@2x.png",
//             "scale" : "2x",
//             "role" : "notificationCenter",
//             "subtype" : "42mm"
//             },
//             {
//             "size" : "29x29",
//             "idiom" : "watch",
//             "filename" : "icon-29@2x.png",
//             "role" : "companionSettings",
//             "scale" : "2x"
//             },
//             {
//             "size" : "29x29",
//             "idiom" : "watch",
//             "filename" : "icon-29@3x.png",
//             "role" : "companionSettings",
//             "scale" : "3x"
//             },
//             {
//             "size" : "40x40",
//             "idiom" : "watch",
//             "filename" : "icon-40@2x.png",
//             "scale" : "2x",
//             "role" : "appLauncher",
//             "subtype" : "38mm"
//             },
//             {
//             "size" : "44x44",
//             "idiom" : "watch",
//             "filename" : "icon-44@2x.png",
//             "scale" : "2x",
//             "role" : "appLauncher",
//             "subtype" : "40mm"
//             },
//             {
//             "size" : "50x50",
//             "idiom" : "watch",
//             "filename" : "icon-50@2x.png",
//             "scale" : "2x",
//             "role" : "appLauncher",
//             "subtype" : "44mm"
//             },
//             {
//             "size" : "86x86",
//             "idiom" : "watch",
//             "filename" : "icon-86@2x.png",
//             "scale" : "2x",
//             "role" : "quickLook",
//             "subtype" : "38mm"
//             },
//             {
//             "size" : "98x98",
//             "idiom" : "watch",
//             "filename" : "icon-98@2x.png",
//             "scale" : "2x",
//             "role" : "quickLook",
//             "subtype" : "42mm"
//             },
//             {
//             "size" : "108x108",
//             "idiom" : "watch",
//             "filename" : "icon-108@2x.png",
//             "scale" : "2x",
//             "role" : "quickLook",
//             "subtype" : "44mm"
//             },
//             {
//             "size" : "1024x1024",
//             "idiom" : "watch-marketing",
//             "filename" : "icon-1024.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "16x16",
//             "idiom" : "mac",
//             "filename" : "icon-16.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "16x16",
//             "idiom" : "mac",
//             "filename" : "icon-16@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "32x32",
//             "idiom" : "mac",
//             "filename" : "icon-32.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "32x32",
//             "idiom" : "mac",
//             "filename" : "icon-32@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "128x128",
//             "idiom" : "mac",
//             "filename" : "icon-128.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "128x128",
//             "idiom" : "mac",
//             "filename" : "icon-128@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "256x256",
//             "idiom" : "mac",
//             "filename" : "icon-256.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "256x256",
//             "idiom" : "mac",
//             "filename" : "icon-256@2x.png",
//             "scale" : "2x"
//             },
//             {
//             "size" : "512x512",
//             "idiom" : "mac",
//             "filename" : "icon-512.png",
//             "scale" : "1x"
//             },
//             {
//             "size" : "512x512",
//             "idiom" : "mac",
//             "filename" : "icon-512@2x.png",
//             "scale" : "2x"
//             }
//         ],
//         "info" : {
//             "version" : 1,
//             "author" : "xcode"
//         }
//     }
//     let idx = 0
//     for (let meta of iosIconMeta.images) {

//         // Get image size
//         idx += 1
//         let width = Math.floor(parseFloat(meta.size) * parseFloat(meta.scale || '1'))
//         meta.filename = `icon-${idx}.png`
//         await sharp(path.resolve(ctx.project.path, 'metadata/icon-ios.png')).resize(width, width).toFile(path.resolve(ctx.project.path, 'ios/Flick/Images.xcassets/AppIcon.appiconset', meta.filename))
    
//     }
//     fs.writeFileSync(path.resolve(ctx.project.path, 'ios/Flick/Images.xcassets/AppIcon.appiconset/Contents.json'), JSON.stringify(iosIconMeta))

// })