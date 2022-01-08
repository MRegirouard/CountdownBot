const discord = require('discord.js')
const cmd = require('./Command.js')
const confReader = require('@eta357/config-reader')

const dClient = new discord.Client()

const configFile = './CountDownBot.conf' // Path to config file
const configOptions = { // Options to retrieve from config file
    'Discord API Token':'',
    'Countdowns':[],
    'Update Interval':"10000"
}

var config

cmd.command.beforeHelp = 'Hello! I\'m a countdown bot developed by <@592832907358502961>! Here are my commands:\n'
cmd.command.afterHelp = 'React to a countdown with \'🛑\' to stop it. View and contribute to my source code here: https://github.com/MRegirouard/CountdownBot'

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

    message.channel.send(messageStr).then(sentMessage =>
    {
        sentMessage.react('🛑')

        const countdownObj = {'Channel Id': message.channel.id,'Message Id': sentMessage.id, 'End Date': endDate, 'Title': args[1]}
        config['Countdowns'].push(countdownObj)

        confReader.writeOptions(configFile, config).then((result) =>
        {
            console.info('Successfully wrote new countdown to config file.')
        })
        .catch((err) =>
        {
            console.error(err)
            process.exit(1)
        })
    })

}, (error, message) =>
{
    message.channel.send(error)
})

function computeIntervals(msDifference)
{
    var days = Math.floor(msDifference / (1000 * 60 * 60 * 24))
    var hours = Math.floor((msDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((msDifference % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((msDifference % (1000 * 60)) / 1000);

    if (msDifference < 0)
    {
        days += 1
        hours += 1
        minutes += 1
    }

    return {days: days, hours: hours, minutes: minutes, seconds: seconds}
}

confReader.readOptions(configFile, configOptions, false).then((result) =>
{
    console.info('Successfully read config information.')

    config = result

    console.debug('Read', config['Countdowns'].length, 'countdowns.')

    dClient.login(config['Discord API Token'])
})
.catch((err) =>
{
    console.error(err)
    process.exit(1)
})

dClient.on('ready', () =>
{
    console.info('Bot is ready.')

    dClient.setInterval(updateClocks, config['Update Interval'])
})

dClient.on('message', message =>
{
  if (message.author.id !== dClient.user.id)
    cmd.command.checkAll(message)
})

dClient.on('messageReactionAdd', (reaction, user) =>
{
    if (reaction.message.author.id === dClient.user.id && user.id !== dClient.user.id)
    {
        if (reaction._emoji.name === '🛑')
        {
            for (const i in config['Countdowns'])
            {
                const countdown = config['Countdowns'][i]

                if (countdown['Message Id'] === reaction.message.id)
                {
                    const channel = dClient.channels.cache.get(countdown['Channel Id'])
                    const message = channel.messages.fetch(countdown['Message Id']).then((message) =>
                    {
                        message.delete()
                    })

                    config['Countdowns'].splice(i, 1)

                    confReader.writeOptions(configFile, config).then((result) =>
                    {
                        console.info('Successfully wrote new countdown to config file.')
                    })
                    .catch((err) =>
                    {
                        console.error(err)
                        process.exit(1)
                    })
                }
            }
        }
    }
});

function updateClocks()
{
    for (const countdown of config['Countdowns'])
    {
        const now = Date.now()
        const endDate = new Date(countdown['End Date'])
        const difference = endDate - now
        const intervals = computeIntervals(difference)

        var messageStr = 'Countdown to '

        if (countdown['Title'] === ' ')
            messageStr += endDate.toLocaleString()
        else
            messageStr += countdown['Title'] + ' (' + endDate.toLocaleString() + ')'

        messageStr += ':\n'
        messageStr += intervals.days + ' Days, '
        messageStr += intervals.hours + ' Hours, '
        messageStr += intervals.minutes + ' Minutes, '
        messageStr += intervals.seconds + ' Seconds.'

        const channel = dClient.channels.cache.get(countdown['Channel Id'])
        const message = channel.messages.fetch(countdown['Message Id']).then((message) =>
        {
        message.edit(messageStr)
        })
    }
}