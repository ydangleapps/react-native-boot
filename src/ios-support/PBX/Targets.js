
/**
 * Helpers for dealing with targets in an Xcode project.
 */
module.exports = class Targets {

    constructor(pbx) {
        this.pbx = pbx
    }

    /** 
     * Get all targets associated with the main project. Each target has:
     * 
     * 
     * 
     */
    list() {

        // Get project
        let project = this.pbx.project()

        // Fetch each individual target by it's ID
        let targets = []
        for (let target of project.value.targets)
            targets.push(this.pbx.object(target.value))

        // Done
        return targets

    }

    /** Get target attributes */
    attributes(targetID) {

        // Get project


    }

}