# grunt-jenkins-job

Just run build jenkins job 

## Install

```sh
npm install grunt-jenkins-job
```

## Config

Create file `.jenkins.json` example:
```json
{
	"login": "login",
	"password": "password"
}
```

Add `.jenkins` to `.gitignore`

```sh
echo .jenskins.json >> .gitignore
```

Add config to `Gruntfile.js`

### Example config:

```javascript
	grunt.initConfig({
		jenkins: grunt.file.readJSON('.jenkins.json'),
		'grunt-jenkins-job': {
			username: '<%=jenkins.login%>',
			password: '<%=jenkins.password%>',
			host: 'https://myjenkins.com',
			tasks: {
				deployDev: {
					jobName: 'deploy_dev',
					parameter: [
						{
							name: 'param1',
							value: 'value1'
						},
						{
							name: 'param2',
							value: 'value2'
						}
					]
				}
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-jenkins-job');
	grunt.registerTask('deploydev', ['grunt-jenkins-job:deployDev']);
```

## Run

```sh
grunt deploydev
```