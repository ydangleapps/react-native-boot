
const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')

//
// Add helper methods for dealing with files
module.exports = runner => runner.register().name('Add platform helpers').before('_init').do(async ctx => {

    // Add platform info
    ctx.platforms = {}

})