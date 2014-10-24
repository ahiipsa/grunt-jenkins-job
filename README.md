# grunt-jenkins-job

just run Jenkins job build


## Example config:

```javascript

	grunt.initConfig({
		'grunt-jenkins-job': {
			username: 'user_name',
			password: 'user_password',
			host: 'https://myjenkins.com',
			tasks: {
				deployDev: {
					jobName: 'deploy_dev_restapi',
					parameter: {
						name: 'BRANCH',
						value: 'master'
					}
				}
			}
		}
	});
	
	
	grunt.registerTask('default', ['grunt-jenkins-job:deployDev']);
	
```