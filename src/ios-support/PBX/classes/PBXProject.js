
const NSObject = require('./NSObject')

/**
 * Represents an Xcode project.
 */
module.exports = class PBXProject extends NSObject {

    static get className() {
        return 'PBXProject'
    }

    /** Set a target attribute */
    setTargetAttribute(target, name, value) {

        // Get attribbute list for this target
        let targetAttributes = this.attributes.TargetAttributes.valueForKey(target)

        // Create target attributes section if needed
        if (!targetAttributes) {
            targetAttributes = {}
            this.attributes.TargetAttributes.setValueForKey(target, targetAttributes)
        }

        // Set value
        targetAttributes[name] = value

    }

}