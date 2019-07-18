#!/usr/bin/env node

const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')
const ChildProcess = require('child_process')
const TaskRunner = require('./src/TaskRunner')
const glob = require('glob')
const os = require('os')

// Vars
let taskRunner = new TaskRunner()
let verbose = false

// Main function
async function main() {

    // TODO: Use `blessed` library to output a smart console UI

    // Output header
    const headers = require('./src/headers')
    const header = headers[Math.floor(Math.random() * headers.length)]
    header()

    // Walk up current working dir until a folder with package.json is found
    let projectPath = path.resolve(process.cwd())
    while (true) {

        // Check if package.json exists
        if (await fs.exists(path.resolve(projectPath, 'package.json')))
            break

        // Go up one, fail if we're at the top
        let last = projectPath
        projectPath = path.resolve(projectPath, '..')
        if (projectPath == last) {
            projectPath = null
            break
        }

    }

    // Load all tasks in all modules in the project
    console.log('Loading tasks...')
    let ctx = taskRunner.createContext()
    let files = await new Promise((resolve, reject) => glob('**/*.rntask.js', {
        cwd: projectPath || __dirname,
        follow: true
    }, (err, matches) => {
        if (err) reject(err)
        else resolve(matches)
    }))

    // Load tasks from those files
    for (let file of files) {

        // Load, catch errors
        try {
            let func = require(path.resolve(projectPath || __dirname, file))
            if (typeof func != 'function') throw new Error('Exported item is not a function.')
            func(taskRunner, ctx)
        } catch (err) {
            console.warn(chalk.red('Task error: ') + file + ': ' + err.message)
        }

    }

    // Check if task can be run
    var args = process.argv.slice(process.execArgv.length + 2)
    var taskName = args[0] || 'run'
    verbose = args[1] == 'verbose'
    if (!taskRunner.tasks[taskName])
        throw new Error(`The task ${chalk.cyan(taskName)} was not found.`)

    // Store CLI context information
    ctx.cli = {}
    ctx.cli.task = taskName
    ctx.cli.projectPath = projectPath

    // Run initialization
    await taskRunner.run('_init', ctx)

    // Run requested task
    await taskRunner.run(taskName, ctx)

    // Platform object, extended by platform plugins
    taskRunner.contextTemplate.platforms = {}

}

// Start after init
setTimeout(e => {

    // Run main
    main().catch(err => {

        // If not verbose, print simple error
        if (!verbose && taskRunner.errorStack)
            return console.log(chalk.blue(taskRunner.errorStack.map(id => taskRunner.tasks[id].taskName || id).join(' > ') + ': ') + chalk.red('Failed: ') + err.message)
        if (!verbose)
            return console.log(chalk.red('Failed: ') + err.message)

        // Print error, if there's a task stack involved
        if (taskRunner.errorStack)
            console.log(chalk.blue(taskRunner.errorStack.map(id => taskRunner.tasks[id].taskName || id).join(' > ') + ': ') + chalk.red('Failed'))
            
        // Print stack
        console.log(err.stack)

    })

}, 1);