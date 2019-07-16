
const path = require('path')
const fs = require('fs-extra')

module.exports = runner => {
    
    // HACK: Add support libraries
    runner.register('react-native-sensors').after('prepare.android').requires(ctx => ctx.project.uses('react-native-sensors')).do(async ctx => {

        // Add imports
        ctx.status('Adding support libraries...')
        await fs.appendFile(path.resolve(ctx.project.path, 'node_modules/react-native-sensors/android/build.gradle'), `
            dependencies {
                compileOnly 'com.android.support:support-v4:27.0.2' // v4
            }`
        )

        // Set a config so it doesn't use jetify
        await fs.writeFile(path.resolve(ctx.project.path, 'node_modules/react-native-sensors/android/gradle.properties'), `
            android.useAndroidX=false
            android.enableJetifier=false
        `)

    })

}