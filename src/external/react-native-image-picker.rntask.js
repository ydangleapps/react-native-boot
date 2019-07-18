
const path = require('path')
const replace = require('replace-in-file')

module.exports = runner => {
    
    // HACK: Android permissions. Normally this should be added to the lib's AndroidManifest.xml
    runner.register('react-native-image-picker').after('prepare.android.link').requires(ctx => ctx.project.uses('react-native-image-picker')).do(async ctx => {

        // TODO: Better Android permission handling

        // Fix permissions for image-picker lib
        ctx.status('Adding permissions...')
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/src/main/AndroidManifest.xml'),
            from: '<application',
            to: `

                <!-- Permissions for react-native-image-picker lib -->
                <uses-permission android:name="android.permission.CAMERA" />
                <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
            
            <application`
        })

    })

    // iOS permissions
    runner.register().before('prepare.ios.permissions').requires(ctx => ctx.project.uses('react-native-image-picker')).do(ctx => {
        ctx.iosPermissions.add('NSPhotoLibraryUsageDescription')
        ctx.iosPermissions.add('NSCameraUsageDescription')
        ctx.iosPermissions.add('NSPhotoLibraryAddUsageDescription')
        ctx.iosPermissions.add('NSMicrophoneUsageDescription')
    })

}