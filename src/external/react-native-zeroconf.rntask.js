
const path = require('path')
const replace = require('replace-in-file')

module.exports = runner => runner.register('react-native-zeroconf').after('prepare.android').requires(ctx => ctx.project.uses('react-native-zeroconf')).do(async ctx => {

    // Fix permissions for zeroconf lib
    ctx.status('Adding permissions...')
    replace.sync({
        files: path.resolve(ctx.android.path, 'app/src/main/AndroidManifest.xml'),
        from: '<application',
        to: `

            <!-- Permissions for react-native-zeroconf lib -->
            <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
            <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
            <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
        
        <application`
    })

})