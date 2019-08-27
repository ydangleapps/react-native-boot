
const chalk = require('chalk')

//
// This class manages running and registering tasks.
module.exports = class TaskRunner {

    constructor() {

        // List of all tasks
        this.tasks = {}

        // Context template. Everything in this object will be copied into the context when running a task.
        this.contextTemplate = {
            runner: this,
            doneTasks: [],
            stack: [],
            flags: {}
        }

        // If there is an error, this is the task stack that caused the error
        this.errorStack = null

        // Register internal _init task, so tasks can run before or after it to do setup actions.
        this.register('_init').name('Initialize')

    }

    register(id) {

        // If no ID, generate a random one
        if (!id)
            id = 'temp-' + Math.random().toString(36).substring(2)

        // Throw if task already exists
        if (this.tasks[id])
            throw new Error('Task with ID ' + chalk.blue(id) + ' already exists.')

        // Create task
        let task = new Task(id)
        this.tasks[id] = task

        // Clear sorted tasks cache
        this._sortedTasks = null
        return task

    }

    /** Returns a sorted array of tasks */
    get sortedTasks() {
        if (!this._sortedTasks) this._sortedTasks = Object.values(this.tasks).sort((a, b) => a._priority - b._priority)
        return this._sortedTasks
    }

    taskName(id) {
        return this.tasks[id] && this.tasks[id].taskName || id
    }

    createContext() {

        // Create context
        let ctx = {}
        Object.assign(ctx, {
            status: txt => console.log(chalk.blue(ctx.stack.map(id => this.tasks[id].taskName || id).join(' > ') + ': ') + txt),
            warning: txt => ctx.status(chalk.yellow('Warning: ') + txt)
        }, this.contextTemplate)

        return ctx

    }

    async run(id, _context) {

        // Prepare context if needed
        let ctx = _context
        if (!ctx) {
            
            // Create context
            ctx = this.createContext()

            // Clear error stack
            this.errorStack = null

        }

        // Find task with this ID
        let task = this.tasks[id]
        if (!task)
            throw new Error('Task not found: ' + chalk.blue(id))

        // Check if the task's checks pass first
        ctx.stack.push(id)
        let allPassed = true
        for (let check of task.requireChecks) {
            if (!await check(ctx)) {
                allPassed = false
                break
            }
        }
        ctx.stack.pop()
        if (!allPassed)
            return

        // Check if a done task was requested
        if (ctx.doneTasks.includes(id))
            throw new Error(`Circular dependency in ${chalk.blue(id)}, this task has run already.`)

        // Add us to the stack
        ctx.doneTasks.push(id)
        ctx.stack.push(id)

        // Run pre-tasks
        for (let otherTask of this.sortedTasks)
            if (otherTask.beforeTasks.includes(id))
                await this.run(otherTask.id, ctx)

        // Catch errors
        try {

            // Run task
            if (task.code)
                await task.code(ctx)

        } catch (err) {

            // If allow fail, continue
            if (task.taskAllowFail) {

                // Log warning
                ctx.warning(err.message)

            } else {

                // Store stack
                if (this.errorStack == null) this.errorStack = ctx.stack.slice()
                throw err

            }

        }

        // Run post-tasks
        for (let otherTask of this.sortedTasks)
            if (otherTask.afterTasks.includes(id))
                await this.run(otherTask.id, ctx)

        // Remove us from the stack
        ctx.stack.pop()

    }

}

class Task {

    constructor(id) {
        this.id = id
        this.taskName = ''
        this.taskDescription = ''
        this.beforeTasks = []
        this.afterTasks = []
        this.code = null
        this.requireChecks = []
        this.needsProject = true
        this._priority = 0
    }

    /** Sets the task's human friendly name. */
    name(v) {
        this.taskName = v
        return this
    }

    /** Sets the task's human friendly description */
    description(v) {
        this.taskDescription = v
        return this
    }

    /** Makes this task run before the specified task. */
    before(id) {
        this.beforeTasks.push(id)
        return this
    }

    /** Makes this task run after the specified task. */
    after(id) {
        this.afterTasks.push(id)
        return this
    }

    /** Sets the code to be executed when this task runs. */
    do(code) {
        this.code = code
        return this
    }

    /** 
     * Adds a requirement check function, if the requirement fails the task will not run. 
     * This can be used to, for example, not run a task unless a module is used by the project, etc.
     */
    requires(check) {
        this.requireChecks.push(check)
        return this
    }

    /** Allow the task to fail, it will instead just output a warning. */
    allowFail() {
        this.taskAllowFail = true
        return this
    }

    /** If false, this command can be run outside of a project. */
    requiresProject(b) {
        this.needsProject = b
        return this
    }

    /** Set priority. 0 is default, negative runs before the default and positive runs after the default. */
    priority(p) {
        this._priority = p
        return this
    }

}