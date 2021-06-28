const prefix = ";"
const argSeparator = " "

class command
{
    static commands = []
    static beforeHelp = ""
    static afterHelp = ""

    constructor(name, aliases = [], description, args, runFunc, errorFunc)
    {
        this.name = name
        this.aliases = aliases
        this.args = args
        this.description = description
        this.runFunc = runFunc
        this.errorFunc = errorFunc
        command.commands.push(this)
    }

    helpText()
    {
        var helpStr = prefix + this.name

        for (const alias of this.aliases)
            helpStr += " / " + prefix + alias

        for (const arg of this.args)
            helpStr += " <" + arg + ">"

        helpStr += " : " + this.description

        return helpStr
    }

    checkCmd(userInput)
    {
                const args = userInput.toLowerCase().split(argSeparator)
        var cmd = args.shift()

        if (cmd.startsWith(prefix))
            cmd = cmd.slice(prefix.length)
        
        var correctCmd = false

        if (cmd === this.name)
            correctCmd = true
        else
        {
            for (const alias of this.aliases)
            {
                if (cmd === alias)
                    correctCmd = true
            }
        }

        return correctCmd
    }

    checkArgs(enteredCmd, enteredArgs)
    {
        if (this.args.length === enteredArgs.length || this.args.length === 0)
        {
            this.cmdError = ""
            return true
        }
        else
        {
            this.cmdError = "The command \"" + enteredCmd + "\" requires " + this.args.length

            if (this.args.length === 1)
                this.cmdError += " argument:"
            else
                this.cmdError += " arguments:"

            for (const arg of this.args)
                this.cmdError += " <" + arg + ">"

            this.cmdError += ", " + enteredArgs.length + " arguments supplied."
            return false
        }
    }

    static getArgs(userInput)
    {
        var args = ['']

        var inQuotes = false
        var isEscaped = false

        for (const c of userInput)
        {
            if (c === '\"')
            {
                if (isEscaped)
                {
                    args[args.length - 1] += '\"'
                    isEscaped = false
                }
                else
                {
                    if (inQuotes)
                        if (args[args.length - 1] !== '')
                            args.push('')

                    inQuotes = !inQuotes
                }

            }
            else if (c === '\\')
            {
                if (isEscaped)
                {
                    args[args.length - 1] += '\\'
                    isEscaped = false
                }
                else
                    isEscaped = true
            }
            else if (c === argSeparator)
            {
                if (isEscaped)
                {
                    args[args.length - 1] += c
                    isEscaped = false
                }
                else
                {
                    if (inQuotes)
                    {
                        args[args.length - 1] += c
                    }
                    else
                    {
                        if (args[args.length - 1] !== '')
                            args.push('')
                    }
                } 
            }
            else
            {
                args[args.length - 1] += c
                isEscaped = false
            }

            isEscaped = c === '\\'
        }

        args.shift()

        if (args[args.length - 1] === '')
            args.pop()

        return args
    }

    static getCmd(userInput)
    {
        return userInput.toLowerCase().split(argSeparator).shift()
    }

    static checkAll(message)
    {
        var userInput = message.content

        if (userInput.startsWith(prefix))
        {
            userInput = userInput.slice(prefix.length)

            if (userInput.toLowerCase() === 'help')
            {
                var help = command.beforeHelp

                for (const cmd of command.commands)
                {
                    help += "\t" + cmd.helpText() + "\n"
                }

                help += "\t" +  prefix + "help : Show this message.\n"

                help += command.afterHelp

                message.channel.send(help)
            }
            else
            {
                const enteredCmd = command.getCmd(userInput)
                const enteredArgs = command.getArgs(userInput)

                for (const testCmd of command.commands)
                {
                    if (testCmd.checkCmd(enteredCmd))
                    {
                        if (testCmd.checkArgs(enteredCmd, enteredArgs))
                            testCmd.runFunc(enteredArgs, message)
                        else
                            testCmd.errorFunc(testCmd.cmdError, message)

                        return
                    }
                }

                message.channel.send("Command \"" + enteredCmd + "\" does not exist. Please use **" + prefix + "help** for help.")
            }
        }
    }
}

exports.command = command