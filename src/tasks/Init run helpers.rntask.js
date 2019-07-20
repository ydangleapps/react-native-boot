
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