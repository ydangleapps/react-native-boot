
const path = require('path')

module.exports = runner => {

    //
    // Register template
    runner.register().before('new').do(ctx => {
        ctx.templates.push({
            name: 'Bare minimum app',
            create: async e => ctx.createFromTemplate({
                source: path.resolve(__dirname, './bare-minimum-app')
            })
        })
    })

}