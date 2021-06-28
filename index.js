const discord = require('discord.js')
const configReader = require('./ConfigReader.js')

const dClient = new discord.Client()

const configFile = './CountDownBot.conf' // Path to config file
const configOptions = { // Options to retrieve from config file
    'Discord API Token':'',
}

configReader.readOptions(configFile, configOptions, false).then((result) =>
{
    console.info('Successfully read config information.')

    dClient.login(result['Discord API Token'])
})
.catch((err) =>
{
    console.error(err)
    process.exit(1)
})