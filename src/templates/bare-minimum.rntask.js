
const path = require('path')

module.exports = runner => {

    //
    // Register template
    runner.register().before('create').do(ctx => {
        ctx.templates.push({
            name: 'Bare Minimum',
            create: async e => ctx.createFromTemplate({
                source: path.resolve(__dirname, './bare-minimum')
            })
        })
    })

}