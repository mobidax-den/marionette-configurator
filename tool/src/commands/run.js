const {Command, flags} = require('@oclif/command')
const RenderConfigCommand = require('./render-config')

var path = require('path'), 
    fs = require('fs'), 
    yaml = require('js-yaml'),
    chalk = require('chalk'),
    child_process = require('child_process');


const services = ['api', 'users', 'auth', 'monitoring', 'db', 'nats', 'traefik', 'userapp', 'jaeger', 'messages', 'wallets'];


class RunCommand extends Command {
  
  static args = [
    {
        name: 'service',
        description: 'service name',
        options: services,
        required: false
    },
  ]
  

    async runCompose(serviceName) {
    
        return new Promise( (resolve, reject) => {
            const attr = ["up", "-d"].concat(serviceName? [serviceName] : services);
            const command = `docker-compose`;
            const child = child_process.spawn(command, attr);

            child.on('error', function(e) {
                console.log("ERROR", chalk.red(JSON.stringify(e)));
            });
            
            child.stdout.on('data', (data) => {
                console.log(chalk.reset(data.toString("utf8")));
            });
        
            child.stderr.on('data', (data) => {
                console.log(chalk.yellow(data.toString("utf8")));
            });

            child.on('exit', (code, signal)=>{
                if (code===0) {
                    resolve()
                } else {
                    reject()
                }
            });
        });
    }

    async run() {
        const {flags, args} = this.parse(RunCommand)
    
        var configYaml = {};
        try {
            const fileConfigYaml = fs.readFileSync('./global/config.yaml', 'utf8');
            configYaml = yaml.load(fileConfigYaml);
        } catch(e) {
            console.log(chalk.red(`ERROR in global/config.yaml: ${e.reason}`));
            console.log(e.message);
            return;
        }
        
        await (new RenderConfigCommand([])).run();

        if (configYaml.mode === 'compose') {
            this.runCompose(args.service);
        }
    }
  
}

RunCommand.description = `Start service(s)
...

`

RunCommand.flags = {
  // name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = RunCommand
