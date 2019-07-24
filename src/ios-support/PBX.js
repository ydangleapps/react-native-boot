const xcode = require('xcode')

//
// Handles reading contents from an Xcode .pbxproj file

module.exports = class PBX {

    /** Constructor */
    constructor(file) {

        // Parse file immediately
        this.pbx = xcode.project(file)
        this.pbx.parseSync()

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

            // Get parent folder
            let parent = allGroups.find(group => !!group.value.children.find(c => c.value == file.id))
            if (!parent)
                break

            // Add to path
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

}