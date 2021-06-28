const discord = require('discord.js')
const configReader = require('./ConfigReader.js')

const dClient = new discord.Client()

const configFile = './CountDownBot.conf' // Path to config file
const configOptions = { // Options to retrieve from config file
    'Discord API Token':'',
    'Countdowns':[]
}
var countdowns

configReader.readOptions(configFile, configOptions, false).then((result) =>
{
    console.info('Successfully read config information.')

    countdowns = result['Countdowns']

    console.debug('Read', countdowns.length, 'countdowns.')

    dClient.login(result['Discord API Token'])
})
.catch((err) =>
{
    console.error(err)
    process.exit(1)
})

dClient.on('ready', () =>
{
    console.info('Bot is ready.')

    dClient.setInterval(updateClocks, 10000)
})

function updateClocks()
{
    
}