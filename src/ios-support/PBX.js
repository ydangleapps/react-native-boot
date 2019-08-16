const xcode = require('xcode')
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')

//
// Handles reading contents from an Xcode .pbxproj file

module.exports = class PBX {

    /** Constructor */
    constructor(file) {

        // Parse file immediately
        this.file = file
        this.pbx = xcode.project(file)
        this.pbx.parseSync()

        // Project vars
        this.vars = {
            SRCROOT: path.resolve(file)
        }

    }

    /** Save changes back to the project file */
    async save() {
        return fs.writeFile(this.file, this.pbx.writeSync())
    }

    /** Get object with specified ID */
    object(id) {

        // Go through everything and find it
        for (let type in this.pbx.hash.project.objects) {

            // Look for match
            let obj = this.pbx.hash.project.objects[type][id]
            if (!obj)
                continue
            
            // Found it, return fields
            return {
                id,
                value: this.pbx.hash.project.objects[type][id],
                comment: this.pbx.hash.project.objects[type][id + '_comment'] || ''
            }

        }

    }

    /** Get all objects with the specified type */
    objects(type) {

        // Create list of all objects of this type
        let items = []
        for (let id in this.pbx.hash.project.objects[type] || {}) {

            // Skip comments
            if (typeof this.pbx.hash.project.objects[type][id] != 'object')
                continue

            // Create container for each object
            items.push({
                id,
                value: this.pbx.hash.project.objects[type][id],
                comment: this.pbx.hash.project.objects[type][id + '_comment'] || ''
            })

        }
        return items

    }

    /** Return all projects */
    projects() {
        return this.objects('PBXProject')
    }

    /** Return all targets for a project */
    projectTargets(projectID) {

        // Return all
        let proj = this.object(projectID).value
        return proj.targets.map(targetInfo => {

            // Fetch object
            return this.object(targetInfo.value)

        })

    }

    /** Returns a relative path to a file ID. Relative to the original .xcodeproj directory. */
    relativePath(fileID) {

        // Loop up until the full path is found
        let allGroups = this.objects('PBXGroup').concat(this.objects('PBXVariantGroup'))
        let file = this.object(fileID)
        let path = file.value.path
        if (path.startsWith('"')) path = path.substring(1)
        if (path.endsWith('"')) path = path.substring(0, path.length - 1)
        while (true) {

            // Check if this is the base
            if (file.value.sourceTree.includes('SOURCE_ROOT')) {

                // Stop here, this file is relative to SRCROOT
                break

            } else if (file.value.sourceTree.includes('<group>')) {

                // Continue, this file is relative to it's parent group

            } else if (file.value.sourceTree.includes('BUILT_PRODUCTS_DIR')) {

                // Stop here, this file is relative to the directory where products are built, which doesn't exist yet
                break

            } else if (file.value.sourceTree.includes('SDKROOT')) {

                // Stop here, this file is relative to the SDK root
                break

            } else {

                // Unknown root
                console.warn('Unknown source root ' + chalk.yellow(file.value.sourceTree) + ' for file ' + chalk.cyan(file.value.name || file.value.path) + chalk.gray(' (' + file.id + ')'))
                break

            }

            // Get parent folder
            let parent = allGroups.find(group => !!group.value.children.find(c => c.value == file.id))
            if (!parent)
                break

            // Add to path if it's
            if (parent.value.path) {

                // Strip " from path
                let nPath = parent.value.path
                if (nPath.startsWith('"')) nPath = nPath.substring(1)
                if (nPath.endsWith('"')) nPath = nPath.substring(0, nPath.length - 1)
                path = nPath + '/' + path

            }

            // Continue up
            file = parent

        }

        // Done
        return path

    }

    /** Go through files in target build section */
    * iterateFilesInBuildSection(targetID, buildSectionName) {
    
        // Me just experimenting with generator functions :/

        // Find target
        let target = this.object(targetID)
        if (!target)
            throw new Error('Build target not found. ' + chalk.gray(' (' + targetID + ')'))

        // Go through each file in the build phase
        let buildPhases = target.value.buildPhases.map(ph => this.object(ph.value))
        let buildPhase = buildPhases.find(ph => ph.value.isa == buildSectionName)
        if (buildPhase) {
            for (let fileRef of buildPhase.value.files.map(f => this.object(f.value)) || []) {

                // Fetch file reference in project tree
                let file = this.object(fileRef.value.fileRef)
                if (!file) {
                    console.warn("Unlinked file in " + buildSectionName + ": " + path.basename(this.file) + ", " + fileRef.comment + chalk.gray(' (' + fileRef.id + ')'))
                    continue
                }

                // Get relative path
                let relativeFile = this.relativePath(file.id)

                // Inform loop callback
                yield {
                    path: path.resolve(this.vars.SRCROOT, relativeFile),
                    relativePath: relativeFile
                }

            }
        }

    }

    /** Get all files in a target's build section */
    filesInBuildSection(targetID, buildSectionName) {

        // Get all from generator
        let all = []
        for (let f of this.iterateFilesInBuildSection(targetID, buildSectionName))
            all.push(f)

        return all

    }

    /** Get build configurations for target */
    buildConfigs(targetID) {

        // Find target
        let target = this.object(targetID)
        if (!target)
            throw new Error('Build target not found. ' + chalk.gray(' (' + targetID + ')'))

        // Get build configuration list
        let buildConfigs = this.object(target.value.buildConfigurationList)
        if (!buildConfigs)
            throw new Error("Build target's configuration list not found. " + chalk.gray(' (' + target.value.buildConfigurationList + ')'))

        // Go through each one
        let all = []
        for (let configLink of buildConfigs.value.buildConfigurations) {

            // Get build config
            let config = this.object(configLink.value)

            // Get all build settings

            // If there's a base config, apply it
            config.allBuildSettings = {}
            if (config.value.baseConfigurationReference) {

                // Get file
                let relativePath = this.relativePath(config.value.baseConfigurationReference)
                let contents = fs.readFileSync(path.resolve(this.file, '../..', relativePath), 'utf8')

                // Remove comments
                contents = contents.replace(/\/\*.*?\*\//g, '')     // Block style comments eg /* comment */
                contents = contents.replace(/\/\/.*?[\n$]/g, '\n')  // Line style comments eg // comment

                // Parse file
                for (let line of contents.split('\n')) {

                    // Ignore blank lines
                    line = line.trim()
                    if (!line)
                        continue

                    // Find =
                    let idx = line.indexOf('=')
                    if (idx == -1)
                        continue

                    // Extract key and value
                    let key = line.substring(0, idx).trim()
                    let value = line.substring(idx+1).trim()
                    if (value.startsWith('"') && value.endsWith('"')) 
                        value = value.substring(1, value.length - 1)

                    // Store build setting
                    config.allBuildSettings[key] = value

                }

            }

            // Apply direct build settings
            Object.assign(config.allBuildSettings, config.value.buildSettings)

            // Check if this is the default build config
            config.isDefault = buildConfigs.value.defaultConfigurationName == config.value.name

            // Done, add this build config
            all.push(config)

        }

        // Done
        return all

    }

    /** Gets the default build configuration for the specified target, or the first one if no default */
    defaultBuildConfig(targetID) {
        let all = this.buildConfigs(targetID)
        return all.find(c => c.isDefault) || all[0]
    }

    /** Adds a file to the project's resources. Path must be relative to the .xcodeproj file. */
    addResource(fileRelativePath) {

        // Add file reference, fix bug in xcode about uuid vs fileRef
        let file = this.pbx.addFile(fileRelativePath, )
        file.uuid = file.fileRef = file.fileRef || file.uuid

        // Go through all projects
        for (let project of this.projects()) {

            // Find Resources group
            let mainGroup = this.object(project.value.mainGroup)
            let children = mainGroup.value.children.map(c => this.object(c.value))
            let resourceGroup = children.find(c => c.value.name == 'Resources')
            if (!resourceGroup) {

                // No resource group, create one
                let id = this.pbx.generateUuid()
                this.pbx.hash.project.objects['PBXGroup'][id + '_comment'] = 'Resources'
                this.pbx.hash.project.objects['PBXGroup'][id] = {
                    isa: 'PBXGroup',
                    name: 'Resources',
                    sourceTree: '"<group>"',
                    children: []
                }

                // Add group to main group
                this.pbx.hash.project.objects['PBXGroup'][mainGroup.id].children.push({
                    value: id,
                    comment: 'Resources'
                })

                resourceGroup = this.object(id)

            }

            // Add file to Resources group
            this.pbx.hash.project.objects['PBXGroup'][resourceGroup.id].children.push({
                value: file.uuid,
                comment: fileRelativePath
            })

            // Go through all targets in this project
            for (let target of this.projectTargets(project.id)) {

                // Skip if target is not an application
                if (!target.value.productType.includes('com.apple.product-type.application'))
                    continue

                // Find resource build phase
                let buildPhases = target.value.buildPhases.map(bp => this.object(bp.value))
                let resourcePhase = buildPhases.find(bp => bp.value.isa == 'PBXResourcesBuildPhase')
                if (!resourcePhase)
                    continue

                // Add a build file reference
                let buildID = this.pbx.generateUuid()
                this.pbx.hash.project.objects['PBXBuildFile'][buildID + '_comment'] = fileRelativePath
                this.pbx.hash.project.objects['PBXBuildFile'][buildID] = {
                    isa: 'PBXBuildFile',
                    fileRef: file.uuid,
                    fileRef_comment: fileRelativePath
                }

                // Add file to this phase
                this.pbx.hash.project.objects['PBXResourcesBuildPhase'][resourcePhase.id].files.push({
                    value: buildID,
                    comment: fileRelativePath
                })

            }
        }

    }

    /** Set target attribute */
    setTargetAttribute(targetID, name, value) {

        // Get attributes
        let project = this.projects()[0]
        let attributeDict = project.value.attributes.TargetAttributes

        // Create attribute category if needed
        if (!attributeDict[targetID])
            attributeDict[targetID] = {}

        // Set attribute
        attributeDict[targetID][name] = value

    }

}