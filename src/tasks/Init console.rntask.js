
const path = require('path')
const inquirer = require('inquirer')

//
// Add helper methods for dealing with the console
module.exports = runner => runner.register().name('Add console helpers').before('_init').do(async ctx => {

    // Add console object
    ctx.console = {}

    // Add function to ask the user a question
    ctx.console.ask = async ({ question, defaultValue }) => {

        // Ask
        let answers = await inquirer.prompt([
            { type: 'input', name: 'value', message: question, default: defaultValue }
        ])
        
        return answers.value

    }

    // Add function to select an item from a list. `items` is an array of objects with `{ name, value }` and the selected `value` is returned.
    ctx.console.select = async ({ question, choices }) => {

        // Ask
        let answers = await inquirer.prompt([
            { type: 'list', name: 'value', message: question, choices }
        ])
        
        return answers.value

    }

})