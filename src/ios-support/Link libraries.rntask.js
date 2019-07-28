
const path = require('path')
const replace = require('replace-in-file')
const fs = require('fs-extra')
const chalk = require('chalk')
const glob = require('glob')
const xcode = require('xcode')
const PBX = require('./PBX')

module.exports = runner => {

    //
    // Add linking configuration options and helpers
    runner.register().after('_init.ios').do(ctx => {

        // Allows libraries to override auto linking for a library by doing `ctx.android.linking.skip['my-lib'] = true`
        ctx.ios.linking = {}
        ctx.ios.linking.skip = {}

        // Get the podspec class object name
        ctx.ios.readPodspecObjectName = podspecTxt => {
            let match = /Pod::Spec.new do \|(.*?)\|/g.exec(podspecTxt)
            if (!match || !match[1]) throw new Error('Unable to parse podspec.')
            return match[1]
        }

        // Get a field from a pospec
        ctx.ios.readPodspecString = (podspecTxt, fieldName) => {
            let match = new RegExp(`\\.${fieldName}\\s*?=\\s*?"(.*?)"`).exec(podspecTxt)
            return match && match[1]
        }

        // Inject a dependency string into the Podfile
        ctx.ios.injectDependency = async txt => {
            
            // Append to Podfile
            replace.sync({
                files: path.resolve(ctx.ios.path, 'Podfile'),
                from: '#INJECT_PODS',
                to: `#INJECT_PODS\n    ${txt}`
            })

        }

        // Add a local pod as a dependency
        ctx.ios.addLocalPodspecDependency = async podspec => {

            // Read podspec, check for required `homepage` field
            let txt = await fs.readFile(podspec, 'utf8')
            let homepage = ctx.ios.readPodspecString(txt, 'homepage')
            let s = ctx.ios.readPodspecObjectName(txt)
            if (!homepage) {

                // Podspec missing a homepage field which has become a requirement recently, add one in
                ctx.status(chalk.yellow('Adding missing homepage to podspec'))
                
                // Comment out any existing homepage reference
                txt = txt.replace(s + '.homepage', '#' + s + '.homepage')

                // Add our new homepage reference
                txt = txt.replace(`Pod::Spec.new do |${s}|`, `Pod::Spec.new do |${s}|\n  ${s}.homepage = "https://facebook.github.io/react-native/"`)

                // Write back
                await fs.writeFile(podspec, txt)

            }

            // Get lib name from podspec
            let libName = path.basename(podspec)
            if (libName.endsWith('.podspec'))
                libName = libName.substring(0, libName.length - 8)

            // Append to Podfile
            replace.sync({
                files: path.resolve(ctx.ios.path, 'Podfile'),
                from: '#INJECT_PODS',
                to: `#INJECT_PODS\n    pod '${libName}', :path => '${path.resolve(podspec, '..')}'`
            })

        }

        // Add a .xcodeproj/project.pbxproj library as a dependency, creating a podspec for it as needed
        ctx.ios.addLocalProjectDependency = async (xcodeprojFile, opts = {}) => {

            // Read project data
            let pbx = new PBX(path.resolve(xcodeprojFile, 'project.pbxproj'))
            
            // Find the correct target
            // TODO: Determine if project
            for (let project of pbx.projects()) {

                // Go through targets
                for (let target of pbx.projectTargets(project.id)) {

                    // Only continue for library projects
                    if (!target.value.productType.includes('com.apple.product-type.library.static')) {
                        console.log(chalk.gray('Skipping target ' + target.value.name + ' ' + target.value.productType))
                        continue
                    }

                    // Create pod for this target
                    await ctx.ios.addLocalProjectTargetDependency(xcodeprojFile, pbx, project, target, opts)

                }

            }

        }

        // @private Add a single target from an .xcodeproj as a cocoapod module
        ctx.ios.addLocalProjectTargetDependency = async (xcodeprojFile, pbx, project, target, opts) => {

            // Stop if not an iOS target
            let buildConfig = pbx.defaultBuildConfig(target.id)
            if (buildConfig.value.buildSettings.SDKROOT && buildConfig.value.buildSettings.SDKROOT != 'iphoneos')
                return console.log(chalk.gray('Skipping ' + target.value.name + ' since it is not for iOS. (sdk = ' + buildConfig.value.buildSettings.SDKROOT + ')'))

            // Get library name
            let libName = target.value.name.replace(/[^0-9A-Za-z]/g, '')
            ctx.status('Creating temporary Pod for target ' + chalk.cyan(libName))

            // Fetch xcconfig flags
            let xcconfigFlags = []
            // xcconfigFlags.push({ key: 'USER_HEADER_SEARCH_PATHS', value: `"${path.resolve(ctx.project.path, 'node_modules/react-native')}"/**` })
            // xcconfigFlags.push({ key: 'ALWAYS_SEARCH_USER_PATHS', value: 'YES' })
            for (let key of Object.keys(buildConfig.allBuildSettings)) {

                // Skip flags already set
                if (xcconfigFlags.find(c => c.key == key))
                    continue

                // Strip quotes from string
                let value = buildConfig.allBuildSettings[key]
                if (!value) continue
                if (Array.isArray(value)) value = value.join(' ')
                if (value.startsWith('"') && value.endsWith('"')) 
                    value = value.substring(1, value.length - 1)

                // Store others
                xcconfigFlags.push({ key, value })

            }


            // Create new temporary folder for this item
            let libBasePath = path.resolve(ctx.tempPath, 'ios-pods', libName)
            await fs.remove(libBasePath)
            await fs.ensureDir(libBasePath)

            // Find frameworks to link to
            let frameworks = []
            for (let file of pbx.iterateFilesInBuildSection(target.id, 'PBXFrameworksBuildPhase')) {

                // Do something
                console.log('FRAMEWORK ' + file.relativePath)

            }

            // Find source files to compile
            let sources = []
            for (let file of pbx.iterateFilesInBuildSection(target.id, 'PBXSourcesBuildPhase')) {

                // Copy file to temporary folder
                await fs.ensureDir(path.resolve(libBasePath, file.relativePath, '..'))
                await fs.copyFile(
                    path.resolve(xcodeprojFile, '..', file.relativePath),
                    path.resolve(libBasePath, file.relativePath)
                )

                // Resolve path to file
                sources.push(file.relativePath)

            }

            // Add header files to the sources
            for (let file of pbx.iterateFilesInBuildSection(target.id, 'PBXHeadersBuildPhase')) {

                // Copy file to temporary folder
                await fs.ensureDir(path.resolve(libBasePath, file.relativePath, '..'))
                await fs.copyFile(
                    path.resolve(xcodeprojFile, '..', file.relativePath),
                    path.resolve(libBasePath, file.relativePath)
                )

                // Resolve path to file
                sources.push(file.relativePath)

            }

            // Copy over all header files, since some libraries don't include all headers in their Headers or CopyFiles build phase
            for (let relativeFile of await ctx.files.glob('**/*.h', path.resolve(xcodeprojFile, '..'))) {

                // Stop if already copied
                if (sources.includes(relativeFile))
                    continue

                // Copy file to temporary folder
                await fs.ensureDir(path.resolve(libBasePath, relativeFile, '..'))
                await fs.copyFile(
                    path.resolve(xcodeprojFile, '..', relativeFile),
                    path.resolve(libBasePath, relativeFile)
                )

                // Add to source files
                sources.push(relativeFile)
                ctx.warning('Copied unreferenced header: ' + chalk.cyan(relativeFile))

            }

            // Add CopyFiles build phase files to the sources
            for (let file of pbx.iterateFilesInBuildSection(target.id, 'PBXCopyFilesBuildPhase')) {

                // Copy file to temporary folder
                await fs.ensureDir(path.resolve(libBasePath, file.relativePath, '..'))
                await fs.copyFile(
                    path.resolve(xcodeprojFile, '..', file.relativePath),
                    path.resolve(libBasePath, file.relativePath)
                )

                // Resolve path to file
                sources.push(file.relativePath)

            }

            // Create podspec
            let txt = `
            
                # Temporary local podspec
                Pod::Spec.new do |spec|
                    spec.name           = '${libName}'
                    spec.version        = '1.0.0'
                    spec.author         = 'Unknown'
                    spec.license        = 'MIT'
                    spec.source         = { :http => 'http://nothing.here' }
                    spec.homepage       = 'https://facebook.github.io/react-native/'
                    spec.summary        = 'None'
                    spec.frameworks     = ${frameworks.map(f => `'${f}'`).join(', ') || 'nil'}
                    spec.source_files   = ${sources.map(f => `'${f}'`).join(', ') || 'nil'}
                    spec.ios.deployment_target  = '9.0'
                    spec.dependency 'React'
                    spec.pod_target_xcconfig = {
                        ${xcconfigFlags.map(xc => `'${xc.key}' => '${xc.value}'`).join(',\n')}
                    }

                    ${opts.inject || ''}

                end

            `

            // Write out the podspec to a temporary folder
            let podPath = path.resolve(libBasePath, libName + '.podspec')
            await fs.ensureDir(path.resolve(podPath, '..'))
            await fs.writeFile(podPath, txt)

            // Append to Podfile
            replace.sync({
                files: path.resolve(ctx.ios.path, 'Podfile'),
                from: '#INJECT_PODS',
                to: `#INJECT_PODS\n    pod '${libName}', :path => '${path.resolve(podPath, '..')}'`
            })

        }

    })

    //
    // Update native project to reference the included libraries.
    // @caller preapre.ios
    runner.register('prepare.ios.link').name('Link dependencies').do(async ctx => {

        // Read all installed packages for this project
        for (let filename of await ctx.files.glob('**/package.json', path.resolve(ctx.project.path, 'node_modules'))) {

            // Get package.json
            let packagePath = path.resolve(ctx.project.path, 'node_modules', filename, '..')
            let packageInfo = require(path.resolve(packagePath, 'package.json'))

            // Skip non dependencies
            if (packageInfo.name == 'react-native') continue
            if (packageInfo.name == 'react-native-boot') continue

            // Find podspec for this package, skip submodules
            let podspecs = await ctx.files.glob('**/*.podspec', packagePath)
            podspecs = podspecs.filter(p => !p.includes('node_modules'))
            for (let podspec of podspecs) {

                // Get absolute path
                podspec = path.resolve(packagePath, podspec)

                // Install it as a dependency
                ctx.status('Adding ' + chalk.cyan(packageInfo.name) + chalk.gray(' (' + path.basename(podspec) + ')'))
                await ctx.ios.addLocalPodspecDependency(podspec)

            }

            // If we added a podspec, stop here
            if (podspecs.length > 0)
                continue

            // No podspecs found, check if an .xcodeproj exists
            let xcodeprojs = await ctx.files.glob('**/*.xcodeproj', packagePath)
            xcodeprojs = xcodeprojs.filter(p => !p.includes('node_modules'))
            for (let xcodeproj of xcodeprojs) {

                // Get absolute path
                xcodeproj = path.resolve(packagePath, xcodeproj)

                // Install it as a dependency, creating a virtual Podspec for it
                ctx.status('Adding ' + chalk.cyan(packageInfo.name) + chalk.gray(' (' + path.basename(xcodeproj) + ')'))
                await ctx.ios.addLocalProjectDependency(xcodeproj)

            }

        }

        // Install pods
        await runner.run('prepare.ios.podinstall', ctx)

    })

    // 
    // Run `pod install`
    runner.register('prepare.ios.podinstall').name('Install dependencies').do(async ctx => {

        // TODO: First run on this machine, do 'pod repo update'

        ctx.status('Installing...')
        await ctx.run(`pod install`, { cwd: ctx.ios.path })

    })

}