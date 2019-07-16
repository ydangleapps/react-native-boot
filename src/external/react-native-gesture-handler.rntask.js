
const path = require('path')
const fs = require('fs-extra')

module.exports = runner => {
    
    // HACK: Add support libraries
    runner.register('react-native-gesture-handler').after('prepare.android').requires(ctx => ctx.project.uses('react-native-gesture-handler')).do(async ctx => {

        // Add imports
        ctx.status('Adding support libraries...')
        await fs.appendFile(path.resolve(ctx.project.path, 'node_modules/react-native-gesture-handler/android/build.gradle'), `
            dependencies {
                compileOnly 'com.android.support:support-v4:27.0.2' // v4
            }`
        )

        // Set a config so it doesn't use jetify
        await fs.writeFile(path.resolve(ctx.project.path, 'node_modules/react-native-gesture-handler/android/gradle.properties'), `
            android.useAndroidX=false
            android.enableJetifier=false
        `)

    })

}