
const NSObject = require('./NSObject')

/**
 * References an external file used in the project.
 */
module.exports = class PBXFileReference extends NSObject {

    static get className() {
        return 'PBXFileReference'
    }

}