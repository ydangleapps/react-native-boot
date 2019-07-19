
const path = require('path')
const ChildProcess = require('child_process')
const fs = require('fs-extra')

//
// Add helper methods to the task context
module.exports = runner => runner.register().name('Add run helpers').before('_init').do(async ctx => {

    // Allow tasks to override environment variables
    ctx.env = Object.assign({}, process.env)

    // Add a function to run a command line tool
    ctx.run = (cmd, opts) => {
        
        // Start process
        let process = ChildProcess.spawn(cmd, [], Object.assign({ stdio: 'inherit', shell: true, cwd: ctx.project && ctx.project.path || '.', env: ctx.env }, opts))

        // Wait for process to finish
        return new Promise((resolve, reject) => {
            process.on('close', code => {
                if (code) reject(new Error('Process exited with error code ' + code))
                else resolve()
            })
        })

    }

    // Add a function to run a node module as a command line tool
    ctx.runNode = async (moduleName, args, opts) => {
        
        // Find path to module by Node's module resolution
        let mpath = ''
        try {
            mpath = require.resolve(moduleName)
        } catch (err) {
        }

        // Find path to module by reading it from the host app's packages
        let modulePackagePath = path.resolve(ctx.project.path, 'node_modules', moduleName, 'package.json')
        if (!mpath && await fs.exists(modulePackagePath)) {

            // Node couldn't resolve, but the package exists in the main project's dependencies, use that
            let json = JSON.parse(await fs.readFile(modulePackagePath))
            let rootPath = path.resolve(modulePackagePath, '..')
            if (await fs.exists(path.resolve(rootPath, json.bin || 'notfound'))) mpath = path.resolve(rootPath, json.bin || 'notfound')
            if (await fs.exists(path.resolve(rootPath, 'cli.js'))) mpath = path.resolve(rootPath, 'cli.js')
            if (await fs.exists(path.resolve(rootPath, 'index.js'))) mpath = path.resolve(rootPath, 'index.js')

        }

        // Run it
        console.log(mpath)
        return ctx.run(`node "${mpath}" ${args}`, opts)

    }

    // Add a function to run a shell process and return the output
    ctx.runWithOutput = (cmd, opts) => {

        // Create promise
        return new Promise((resolve, reject) => {

            // Run process
            ChildProcess.exec(cmd, Object.assign({
                cwd: ctx.project && ctx.project.path || '.',
                env: ctx.env
            }, opts), (error, stdout, stderr) => {

                // Fail if error
                if (error)
                    reject(new Error(stderr || stdout || error.message))
                else
                    resolve(stdout)

            })

        })

    }

    // Add a function to return line-by-line the output from a live process
    ctx.runStream = (cmd, opts, callback) => {

        // Start process
        let process = ChildProcess.spawn(cmd, [], Object.assign({ shell: true, cwd: ctx.project && ctx.project.path || '.', env: ctx.env }, opts))

        // Handle text out
        let buffer = ""
        function onInput(data) {

            // Append to current buffer
            buffer += data.toString()

            // Output lines
            while (true) {

                // Find next line
                let idx = buffer.indexOf('\n')
                if (idx == -1)
                    break

                // Extract it
                let line = buffer.substring(0, idx)
                buffer = buffer.substring(idx+1)

                // Call callback
                callback(line)

            }

        }

        // Register text handler
        process.stdout.on('data', onInput)
        process.stderr.on('data', onInput)

        // Wait for process to finish
        return new Promise((resolve, reject) => {
            process.on('close', code => {
                if (code) reject(new Error('Process exited with error code ' + code))
                else resolve()
            })
        })

    }

})