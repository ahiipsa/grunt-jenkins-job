# grunt-jenkins-job

just run Jenkins job build

## Install

```sh
$ npm install grunt-jenkins-job
```

create file `.jenkins.json`

example `.jenkins.json`
```json
{
	"login": "login",
	"password": "password"
}
```

add `.jenkins` to `.gitignore`

## Example config:

```javascript

	grunt.initConfig({
		jenkins: grunt.file.readJSON('.jenkins.json'),
		'grunt-jenkins-job': {
			username: '<%=jenkins.login%>',
			password: '<%=jenkins.password%>',
			host: 'https://myjenkins.com',
			tasks: {
				deployDev: {
					jobName: 'deploy_dev_restapi',
					parameter: [
                        {
                            name: 'BRANCH',
                            value: 'master'
                        }
					]
				}
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-jenkins-job');
	grunt.registerTask('default', ['grunt-jenkins-job:deployDev']);
	
```