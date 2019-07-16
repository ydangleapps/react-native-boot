
const chalk = require('chalk')

//
// This command displays all registered tasks and their dependency tree
module.exports = runner => runner.register('view.tasks').name('Display task run order').do(async ctx => {

    // Create a list of all "command" tasks, ie tasks with a name and no before or after triggers.
    var allTasks = Object.values(runner.tasks)
    var commands = allTasks.filter(t => !t.id.startsWith('temp-') && t.beforeTasks.length == 0 && t.afterTasks.length == 0)

    // Output info
    for (let cmd of commands) {
        console.log(chalk.blue(cmd.id) + ' - ' + (cmd.taskName || '(no name)'))
        logDepth('MAIN', allTasks, cmd, 0)
        console.log('')
    }

})

function logDepth(type, allTasks, currentTask, depth) {

    // Log before tasks
    for (let task of allTasks)
        if (task.beforeTasks.includes(currentTask.id))
            logDepth('BEFORE ' + currentTask.id, allTasks, task, depth + 1)

    // Log main task
    let padding = ''
    console.log(`${padding}- ${chalk.blue(type)} ${chalk.cyan(currentTask.id)}: ${currentTask.taskName || '(no name)'}`)

    // Log after tasks
    for (let task of allTasks)
        if (task.afterTasks.includes(currentTask.id))
            logDepth('AFTER ' + currentTask.id, allTasks, task, depth + 1)

}