
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
        ctx.ios.addLocalProjectDependency = async xcodeprojFile => {

            // Read project data
            let pbx = new PBX(path.resolve(xcodeprojFile, 'project.pbxproj'))
            
            // Find the correct target
            // TODO: Determine if project
            let project = null
            let target = null
            for (let nProject of pbx.projects()) {

                // Go through targets
                for (let nTarget of pbx.projectTargets(nProject.id)) {

                    // TODO: Determine if target is not compatible

                    // Get target
                    target = nTarget
                    project = nProject
                    break

                }

            }

            // Stop if no target
            if (!target)
                throw new Error('Unable to find build target in ' + chalk.cyan(xcodeprojFile))

            // Get library name
            let libName = target.value.name.replace(/[^0-9A-Za-z]/g, '')
            // if (libName == 'React')
            //     libName = 'ReactTmp'

            // Create new temporary folder for this item
            let libBasePath = path.resolve(ctx.tempPath, 'ios-pods', libName)
            await fs.remove(libBasePath)
            await fs.ensureDir(libBasePath)

            // Find frameworks to link to
            let frameworks = []
            let buildPhases = target.value.buildPhases.map(ph => pbx.object(ph.value))
            let frameworksPhase = buildPhases.find(ph => ph.value.isa == 'PBXFrameworksBuildPhase')
            if (frameworksPhase) {
                for (let fileRef of frameworksPhase.value.files.map(f => pbx.object(f.value))) {

                    let file = pbx.object(fileRef.value.fileRef)
                    if (!file) {
                        ctx.warning("Unlinked framework file in " + path.basename(xcodeprojFile), fileRef)
                        continue
                    }// console.log(fileRef, file)
                    // process.exit(0)

                    // Add each file
                    // let relativeFile = pbx.relativePath(file.id)

                    // // Copy file to temporary folder
                    // await fs.ensureDir(path.resolve(libBasePath, relativeFile, '..'))
                    // await fs.copyFile(
                    //     path.resolve(xcodeprojFile, '..', relativeFile),
                    //     path.resolve(libBasePath, relativeFile)
                    // )

                    // // Resolve path to file
                    // sources.push(relativeFile)

                }
            }

            // Find source files to compile
            let sources = []
            let sourcePhase = buildPhases.find(ph => ph.value.isa == 'PBXSourcesBuildPhase')
            if (sourcePhase) {
                for (let fileRef of sourcePhase.value.files.map(f => pbx.object(f.value))) {

                    // Find file reference
                    let file = pbx.object(fileRef.value.fileRef)
                    if (!file) {
                        ctx.warning("Unlinked source file in " + path.basename(xcodeprojFile), fileRef)
                        continue
                    }

                    // Get relative path
                    let relativeFile = pbx.relativePath(file.id)

                    // Copy file to temporary folder
                    await fs.ensureDir(path.resolve(libBasePath, relativeFile, '..'))
                    await fs.copyFile(
                        path.resolve(xcodeprojFile, '..', relativeFile),
                        path.resolve(libBasePath, relativeFile)
                    )

                    // Resolve path to file
                    sources.push(relativeFile)

                }
            }

            // Add header files to the sources
            let headerPhase = buildPhases.find(ph => ph.value.isa == 'PBXHeadersBuildPhase')
            if (headerPhase) {
                for (let fileRef of headerPhase.value.files.map(f => pbx.object(f.value))) {

                    // Add each file
                    let file = pbx.object(fileRef.value.fileRef)
                    if (!file) {
                        ctx.warning("Unlinked header file in " + path.basename(xcodeprojFile), fileRef)
                        continue
                    }
                    
                    // Get relative path
                    let relativeFile = pbx.relativePath(file.id)

                    // Copy file to temporary folder
                    await fs.ensureDir(path.resolve(libBasePath, relativeFile, '..'))
                    await fs.copyFile(
                        path.resolve(xcodeprojFile, '..', relativeFile),
                        path.resolve(libBasePath, relativeFile)
                    )

                    // Resolve path to file
                    sources.push(relativeFile)

                }
            }

            // Copy over all header files, since some libraries don't include all headers in their Headers or CopyFiles build phase
            for (let relativeFile of await ctx.files.glob('**/*.h', path.resolve(xcodeprojFile, '..'))) {

                // Copy file to temporary folder
                await fs.ensureDir(path.resolve(libBasePath, relativeFile, '..'))
                await fs.copyFile(
                    path.resolve(xcodeprojFile, '..', relativeFile),
                    path.resolve(libBasePath, relativeFile)
                )

                // Add to source files
                sources.push(relativeFile)

            }

            // Add CopyFiles build phase files to the sources
            let copyPhase = buildPhases.find(ph => ph.value.isa == 'PBXCopyFilesBuildPhase')
            if (copyPhase) {
                for (let fileRef of copyPhase.value.files.map(f => pbx.object(f.value))) {

                    // Add each file
                    let file = pbx.object(fileRef.value.fileRef)
                    if (!file) {
                        ctx.warning("Unlinked CopyFiles build phase file in " + path.basename(xcodeprojFile), fileRef)
                        continue
                    }
                    
                    // Get relative path
                    let relativeFile = pbx.relativePath(file.id)

                    // Copy file to temporary folder
                    await fs.ensureDir(path.resolve(libBasePath, relativeFile, '..'))
                    await fs.copyFile(
                        path.resolve(xcodeprojFile, '..', relativeFile),
                        path.resolve(libBasePath, relativeFile)
                    )

                    // Resolve path to file
                    sources.push(relativeFile)

                }
            }

            // if (libbName == 'ART') {

            // }

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
                    spec.source_files   = '**/*.{h,m,mm}'${''/*sources.map(f => `'${f}'`).join(', ') || 'nil'*/}
                    ${libName == 'React' ? '#' : ''} spec.dependency 'React'
                    #spec.pod_target_xcconfig = {
                    #    'USER_HEADER_SEARCH_PATHS' => '$(SRCROOT)/**',
                    #    'ALWAYS_SEARCH_USER_PATHS' => 'YES'
                    #}
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

        // Open main project
        let mainProj = xcode.project(path.resolve(ctx.ios.path, 'HelloWorld.xcodeproj/project.pbxproj'))
        mainProj.parseSync()

        // Find all cocoapod based libraries to link
        ctx.status('Searching for native libraries...')
        let files = await new Promise((resolve, reject) => glob('**/ios/*.podspec', {
            cwd: ctx.project.path,
            follow: true
        }, (err, matches) => {
            if (err) reject(err)
            else resolve(matches)
        }))
        
        // Link each library
        let linkedPackages = []
        for (let file of files) {

            // Skip projects where the native directory is not in the root of the project
            let podspec = path.resolve(ctx.project.path, file)
            if (!await fs.exists(path.resolve(podspec, '../../package.json')))
                continue

            // Skip projects with an app.json, since those are most likely template full apps and not a library
            if (await fs.exists(path.resolve(podspec, '../../app.json')))
                continue

            // Link it
            let libPackage = require(path.resolve(ctx.project.path, file, '../../package.json'))
            if (ctx.ios.linking.skip[libPackage.name]) continue
            ctx.status('Linking ' + chalk.cyan(libPackage.name))
            await ctx.ios.addLocalPodspecDependency(path.resolve(ctx.project.path, file))
            linkedPackages.push(libPackage.name)

        }

        // Find all xcodeproj based libraries to link
        files = await new Promise((resolve, reject) => glob('**/ios/*.xcodeproj', {
            cwd: ctx.project.path,
            follow: true
        }, (err, matches) => {
            if (err) reject(err)
            else resolve(matches)
        }))
        
        // Link each library
        for (let file of files) {

            // Skip projects where the native directory is not in the root of the project
            let podspec = path.resolve(ctx.project.path, file)
            if (!await fs.exists(path.resolve(podspec, '../../package.json')))
                continue

            // Skip projects with an app.json, since those are most likely template full apps and not a library
            if (await fs.exists(path.resolve(podspec, '../../app.json')))
                continue

            // Skip if this library had a podspec which has been linked
            let libPackage = require(path.resolve(ctx.project.path, file, '../../package.json'))
            if (linkedPackages.includes(libPackage.name))
                continue

            // Link it
            if (ctx.ios.linking.skip[libPackage.name]) continue
            ctx.status('Linking ' + chalk.cyan(libPackage.name) + chalk.gray(' (creating temporary podspec)'))
            await ctx.ios.addLocalProjectDependency(path.resolve(ctx.project.path, file))
            linkedPackages.push(libPackage.name)

        }

        // Install pods
        await runner.run('prepare.ios.podinstall', ctx)

    })

    // 
    // Run `pod install`
    runner.register('prepare.ios.podinstall').name('Install dependencies').do(async ctx => {

        ctx.status('Installing...')
        await ctx.run(`pod install`, { cwd: ctx.ios.path })

    })

}