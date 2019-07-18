
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const replace = require('replace-in-file')

module.exports = runner => {

    //
    // Prepare Android code
    runner.register('react-native-firebase:android').name('react-native-firebase').requires(c => c.project.uses('react-native-firebase')).after('prepare.android.link').do(async ctx => {

        // Find path to Android JSON
        let jsonPath = path.resolve(ctx.project.path, 'metadata/google-services-android.json')
        if (!await fs.exists(jsonPath))
            throw new Error(`The file ${chalk.cyan('metadata/google-services-android.json')} was not found. Please go to the Firebase console > Project Settings > Add Android and download the google-services.json file. Then, copy it to this path in your project.`)

        // Inject classpath
        ctx.status('Modifying native code...')
        await fs.copyFile(
            jsonPath,
            path.resolve(ctx.android.path, 'app/google-services.json')
        )
        replace.sync({
            files: path.resolve(ctx.android.path, 'build.gradle'),
            from: '/*INJECT_CLASSPATH_DEPENDENCIES*/',
            to: "/*INJECT_CLASSPATH_DEPENDENCIES*/\n        classpath 'com.google.gms:google-services:4.2.0'"
        })
        await fs.appendFile(
            path.resolve(ctx.android.path, 'app/build.gradle'),
            "\napply plugin: 'com.google.gms.google-services'"
        )
        replace.sync({
            files: path.resolve(ctx.android.path, 'app/build.gradle'),
            from: "/*PROJECT_DEPS_INJECT*/",
            to: "/*PROJECT_DEPS_INJECT*/\n    // Firebase dependencies\n    implementation 'com.google.android.gms:play-services-base:16.1.0'\n    implementation 'com.google.firebase:firebase-core:16.0.9'"
        })

    })

}