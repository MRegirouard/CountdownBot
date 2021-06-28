const discord = require('discord.js')
const configReader = require('./ConfigReader.js')
const cmd = require('./Command.js')

const dClient = new discord.Client()

const configFile = './CountDownBot.conf' // Path to config file
const configOptions = { // Options to retrieve from config file
    'Discord API Token':'',
    'Countdowns':[]
}
var countdowns

cmd.command.beforeHelp = 'Hello! I\'m a countdown bot developed by <@592832907358502961>! Here are my commands:\n'
cmd.command.afterHelp = 'View and contribute to my source code here: https://github.com/MRegirouard/CountdownBot'

const pingCmd = new cmd.command('ping', [], 'Test bot connection.', [], async function(args, message)
{
    const latency = Date.now() - message.createdTimestamp
    const apiLatency = Math.round(dClient.ws.ping)

    message.channel.send("Pong! Latency is " + latency + "ms. API Latency is " + apiLatency +"ms.");
}, null)

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

dClient.on('message', message =>
{
  if (message.author.id !== dClient.user.id)
    cmd.command.checkAll(message)
})

function updateClocks()
{
    
}