
const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')

//
// Add helper methods for dealing with files
module.exports = runner => runner.register().name('Add file helpers').before('_init').do(async ctx => {

    // Return true if the specified string or regex exists in a file in the specified directory
    ctx.files = {}
    ctx.files.contains = async function(globPath, query) {

        // Glob search
        let files = glob.sync(globPath, { follow: true })
        for (let file of files) {

            // Read file
            let str = await fs.readFile(file, 'utf8')

            // Check if string exists
            if (typeof query == 'string')
                if (str.includes(query))
                    return true

            // Check if regex is found
            if (query instanceof RegExp)
                if (str.match(query))
                    return true

        }

        // Not found
        return false

    }

    /** Returns a list of files. Default root directory is the project directory. */
    ctx.files.glob = function(globPath, rootDirectory) {

        // Do it
        return new Promise((resolve, reject) => glob(globPath, {
            cwd: rootDirectory || ctx.project.path,
            follow: true
        }, (err, matches) => {
            if (err) reject(err)
            else resolve(matches)
        }))

    }

    /** Append text to a file */
    ctx.files.append = async function(fpath, txt) {

        // Read file
        let fileTxt = await fs.readFile(fpath, 'utf8')

        // Append text
        fileTxt = fileTxt + txt

        // Write file back
        await fs.writeFile(fpath, fileTxt)

    }

    /** Prepend text to a file */
    ctx.files.prepend = async function(fpath, txt) {

        // Read file
        let fileTxt = await fs.readFile(fpath, 'utf8')

        // Prepend text
        fileTxt = txt + fileTxt

        // Write file back
        await fs.writeFile(fpath, fileTxt)

    }

})