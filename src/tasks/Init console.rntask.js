
const path = require('path')
const inquirer = require('inquirer')

//
// Predefined input validators
const BuiltinValidators = {
    password: function(input) {
        if (input.length < 6) return "Too few characters."
        if (input.includes('"')) return "Invalid \" character."
        return true
    }
}

//
// Add helper methods for dealing with the console
module.exports = runner => runner.register().name('Add console helpers').before('_init').do(async ctx => {

    // Add console object
    ctx.console = {}

    // Add function to ask the user a question
    ctx.console.ask = async ({ question, defaultValue, type, validate }) => {

        // Create validator function which uses all validators in the array, if an array was provided
        if (validate && !Array.isArray(validate)) validate = [validate]
        if (validate) {
            let validators = validate
            validate = function(input, hash) {

                // Try each validator
                for (let validator of validators) {

                    // Execute validator, stop if it failed
                    if (typeof validator == 'string') validator = BuiltinValidators[validator]
                    let out = validator(input, hash)
                    if (out !== true)
                        return out

                }

                // All validators are ok
                return true

            }
        }

        // Ask
        let answers = await inquirer.prompt([
            { 
                type: type || 'input', 
                name: 'value', 
                message: question, 
                default: defaultValue, 
                validate: validate
            }
        ])
        
        return answers.value

    }

    // Add function to ask the user a yes/no question
    ctx.console.confirm = async ({ question, defaultValue }) => {

        // Ask
        let answers = await inquirer.prompt([
            { type: 'confirm', name: 'value', message: question, default: defaultValue }
        ])
        
        return answers.value

    }

    // Add function to select an item from a list. `choices` is an array of objects with `{ name, value }` and the selected `value` is returned.
    ctx.console.select = async ({ question, choices }) => {

        // Ask
        let answers = await inquirer.prompt([
            { type: 'list', name: 'value', message: question, choices }
        ])
        
        return answers.value

    }

    // Add function to select multiple items from a list. `choices` is an array of objects with `{ name, value, checked }` and the selected `[value]` is returned as an aray.
    ctx.console.selectMultiple = async ({ question, choices }) => {

        // Ask
        let answers = await inquirer.prompt([
            { type: 'checkbox', name: 'value', message: question, choices }
        ])
        
        return answers.value

    }

})