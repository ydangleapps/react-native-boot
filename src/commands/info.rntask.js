//
// Displays details about the project to the user.

const chalk = require('chalk')

module.exports = runner => runner.register('info').do(async ctx => {

    // Log project information
    console.log(chalk.blue('App name: ') + ctx.project.appInfo.name)

})