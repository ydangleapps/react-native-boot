
/**
 * Serializes a NSObject to xcode archive format.
 */
module.exports = class ArchiveSaver {

    serialize(object) {

        // Create a list of all objects
        let objects = this.allObjects(object).filter(obj => obj && obj.constructor && obj.constructor.className && obj.constructor.className != 'NSObject')

        // Create archive wrapper
        return `// !$*UTF8*$!
{
    archiveVersion = 1;
    classes = {
    };
    objectVersion = 46;
    objects = {
        ${objects.map(o => this.serializeClassInstance(o))}
    };
    rootObject = ${object.serializationID};`

    }

    /** Recursively fetch all objects */
    allObjects(object, current = []) {

        // Stop if current object already added
        if (current.includes(object))
            return current

        // Add current object
        current.push(object)

        // Go through all fields
        if (typeof object == 'object') {
            for (let key in object) {
                this.allObjects(object[key], current)
            }
        }

        // Done
        return current

    }

    /** Generate serialized link to an object */
    link(object) {
        return `${object.serializationID} /* ${object.serializationComment} */;`
    }

    /** Serialize the specified class instance. (not recursive) */
    serializeClassInstance(object, depth = 1) {

        // Add extra fields to object serialization
        return `${' '.repeat(depth * 4)} ${object.serializationID} /* ${object.serializationComment} */ = `
            + this.serializeObject(Object.assign({}, object, {
                isa: object.constructor.className
            }), 2)
            + ';\n'

    }

    /** Serialize the specified object */
    serializeObject(object, depth) {

        // Create text
        let txt = `{\n`
        
        // Add each field
        for (let name in object) {

            // Skip known fields
            if (name == 'ignoredPropertyNames' || name == 'serializationID' || name == 'serializationComment')
                continue

            // Skip ignored fields
            if (object.ignoredPropertyNames && object.ignoredPropertyNames.includes(name))
                continue

            // Skip functions
            if (typeof object[name] == 'function')
                continue

            // Output spacer
            txt += ' '.repeat(depth * 4)

            // Output name
            txt += `"${name.replace(/"/g, '\\"')}" = `

            // Output value
            txt += this.serializeValue(object[name], depth + 1)

            // Close property
            txt += ';\n'

        }

        // Done
        txt += '}'
        return txt

    }

    /** Serialize the specified value */
    serializeValue(value, depth = 1) {

        // Check type
        if (typeof value == 'string') {

            // Output string
            return '"' + value.replace(/"/g, '\\"') + '"'

        } else if (typeof value == 'number') {

            // Output string
            return ' '.repeat(depth * 4) + value

        } else if (Array.isArray(value)) {

            // Output each value separated by commas
            return '(\n' + value.map(value => this.serializeValue(value)).join(',\n' + ' '.repeat(depth * 4)) + '\n)'

        } else if (typeof value == 'object' && value.serializationID) {

            // Output each property
            return value.serializationID + ' /* ' + value.serializationComment + ' */'

        } else if (typeof value == 'object') {

            // Output each property
            return this.serializeObject(value, depth + 1)

        } else {

            // Unknown value type!
            console.warn('Unable to serialize value:', value)
            return '"" /* Unable to serialize */'

        }

    }

}