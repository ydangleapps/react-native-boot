
const NSObject = require('./classes/NSObject')

// Tokens
const BlockStart = /^\s*{/
const BlockEnd = /^\s*}[;,\n$]/
const ArrayBlockStart = /^\s*\(/
const ArrayBlockEnd = /^\s*\)[;,\n$]/
const PropertyAssign = /^\s*([^\s";,]*)\s*=/
const PropertyAssignEscaped = /^\s*"((.*?(?<!\\)))"\s*=/
const NumberAssignmentValue = /^\s*([0-9\.]*)\s*[;,]/
const TextAssignmentValue = /^\s*([^\s"]*)\s*[;,]/
const TextEscapedAssignmentValue = /^\s*"((.*?(?<!\\)))"\s*[;,]/
const ObjectIDToken = /^[0-9A-Z]{24}$/

/**
 * Parses a serialized Xcode project archive
 */
module.exports = class ArchiveParser {

    /** Constructor */
    constructor() {

        // Vars
        this.text = ''
        this.index = 0

    }

    /** Returns remaining unprocessed text */
    get remainingText() {
        return this.text.substring(this.index)
    }
    
    /** Deserialize the specified Xcode archive text */
    deserialize(text) {

        // Remove all comments from the text
        text = text.replace(/\/\/.*?\n/g, '')
        text = text.replace(/\/\*.*?\*\//g, '')

        // Store text
        this.text = text

        // Parse root object
        let archive = this.parseValue()

        // Convert objects to their classes
        let objects = {}
        for (let id in archive.objects) {

            // Stop if not an object
            if (!ObjectIDToken.exec(id))
                continue
            
            // Fetch class
            let dict = archive.objects[id]
            let Class = NSObject.class(dict.isa)
            if (!Class)
                Class = NSObject

            // Deserialize class
            let object = Class.deserialize(dict)
            object.serializationID = id
            objects[id] = object

        }

        // Get root object
        let rootObject = objects[archive.rootObject]

        // Reconstruct object links
        this.linkObject(rootObject, objects)

        // Done
        return rootObject

    }

    /** @private Link referenced objects */
    linkObject(object, allObjects, depth = 1, linkedObjects = []) {

        // Stop if too deep
        if (depth > 16)
            throw new Error('Unable to link objects, recursive search went too deep.')

        // Only do this object once
        if (linkedObjects.includes(object)) return
        linkedObjects.push(object)

        // Go through all properties
        for (let name in object) {

            // Skip known fields
            if (name == 'serializationID' || name == 'remoteGlobalIDString')
                continue

            // Check if string
            let value = object[name]
            if (typeof value == 'string' && ObjectIDToken.exec(value)) {

                // Replace directly
                let instance = allObjects[value]
                if (!instance) {
                    console.warn('Object with ID ' + value + ' for key ' + name + ' not found in archive.')
                    continue
                }

                // Link and recurse into this object
                object[name] = instance
                this.linkObject(instance, allObjects, depth + 1, linkedObjects)

            } else if (typeof value == 'object') {

                // Recurse
                this.linkObject(value, allObjects, depth + 1, linkedObjects)

            }

        }

    }

    /** Parse the object */
    parseDictionary() {

        // Create object
        let object = new NSObject()

        // Check next token
        while (true) {

            // Check next token
            let match = null
            if (match = PropertyAssign.exec(this.remainingText)) {

                // Store property
                this.index += match[0].length
                let name = match[1]
                let value = this.parseValue()
                object[name] = value

            } else if (match = PropertyAssignEscaped.exec(this.remainingText)) {

                // Store property
                this.index += match[0].length
                let name = match[1].replace(/\\"/g, '"')
                let value = this.parseValue()
                object[name] = value

            } else if (match = BlockEnd.exec(this.remainingText)) {

                // Done
                this.index += match[0].length
                break

            } else {

                throw new Error("Couldn't parse dictionary.")

            }

        }

        // Done
        return object

    }

    /** Parse the array */
    parseArray() {

        // Create array
        let array = []

        // Check next token
        while (true) {

            // Check next token
            let match = null
            if (match = ArrayBlockEnd.exec(this.remainingText)) {

                // Done
                this.index += match[0].length
                break

            } else {

                // Fetch next value
                let value = this.parseValue()
                array.push(value)

            }

        }

        // Done
        return array

    }

    /** Parse a value of an assignment */
    parseValue() {

        // Check next token
        let match = null
        if (match = NumberAssignmentValue.exec(this.remainingText)) {

            // Value is a number
            this.index += match[0].length
            return parseFloat(match[1])

        } else if (match = TextAssignmentValue.exec(this.remainingText)) {

            // Value is a string
            this.index += match[0].length
            return match[1]

        } else if (match = TextEscapedAssignmentValue.exec(this.remainingText)) {

            // Value is a string
            this.index += match[0].length
            return match[1].replace(/\\"/g, '"')

        } else if (match = BlockStart.exec(this.remainingText)) {

            // Value is a dictionary
            this.index += match[0].length
            return this.parseDictionary()

        } else if (match = ArrayBlockStart.exec(this.remainingText)) {

            // Value is an array
            this.index += match[0].length
            return this.parseArray()

        } else {


            throw new Error("Couldn't parse value.")

        }

    }

}