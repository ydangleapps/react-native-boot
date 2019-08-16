
const path = require('path')
const replace = require('replace-in-file')
const compareVersions = require('compare-versions')

module.exports = runner => {
    
    //
    // Helper for dealing with minimum SDK version
    runner.register().after('_init.ios').do(ctx => {

        // Add function to set the minimum SDK version
        ctx.ios.minDeploymentTarget = '9.0'
        ctx.ios.requireDeploymentTarget = function(version) {
            if (compareVersions(ctx.ios.minDeploymentTarget, version) == -1) {

                // Store new minimum version
                ctx.ios.minDeploymentTarget = version

                // Update podfile
                replace.sync({
                    files: path.resolve(ctx.ios.path, 'Podfile'),
                    from: /platform :ios, '[0-9\.]+'/,
                    to: `platform :ios, '${version}'`
                })

            }
        }

    })

}