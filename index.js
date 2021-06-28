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

const countdownCmd = new cmd.command('countdown', ['count', 'timer', 'new'], 'Create a new countdown.', ['End Date', 'Name'], function(args, message)
{
    const endDate = new Date(args[0])

    if (isNaN(endDate))
    {
        message.channel.send('Invalid date entered. Please be as verbose as possible. Do not use \"st\", \"nd\", etc. suffixes.')
        return
    }

    const now = Date.now()
    const difference = endDate - now
    const intervals = computeIntervals(difference)

    var messageStr = 'Countdown to '

    if (args[1] === ' ')
        messageStr += endDate.toLocaleString()
    else
        messageStr += args[1] + ' (' + endDate.toLocaleString() + ')'

    messageStr += ':\n'
    messageStr += intervals.days + ' Days, '
    messageStr += intervals.hours + ' Hours, '
    messageStr += intervals.minutes + ' Minutes, '
    messageStr += intervals.seconds + ' Seconds.'

    message.channel.send(messageStr).then(result => 
    {
        const countdownObj = {'Channel Id': message.channel.id,'Message Id': result.id, 'End Date': endDate, 'Title': args[1]}
        countdowns.push(countdownObj)
        console.log(countdowns)
    })

}, null)

function computeIntervals(msDifference)
{
    const days = Math.floor(msDifference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((msDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((msDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((msDifference % (1000 * 60)) / 1000);

    return {days: days, hours: hours, minutes: minutes, seconds: seconds}
}

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
    for (const countdown of countdowns)
    {
        const now = Date.now()
        const difference = countdown['End Date'] - now
        const intervals = computeIntervals(difference)

        var messageStr = 'Countdown to '

        if (countdown['Title'] === ' ')
            messageStr += countdown['End Date'].toLocaleString()
        else
            messageStr += countdown['Title'] + ' (' + countdown['End Date'].toLocaleString() + ')'

        messageStr += ':\n'
        messageStr += intervals.days + ' Days, '
        messageStr += intervals.hours + ' Hours, '
        messageStr += intervals.minutes + ' Minutes, '
        messageStr += intervals.seconds + ' Seconds.'
    
        const channel = dClient.channels.cache.get(countdown['Channel Id'])
        const message = channel.messages.cache.get(countdown['Message Id'])
        message.edit(messageStr)
    }
}