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
file `.jenkins.json` can store task information as well
example 2:
```json
{
  "login": "",
  "password" : "",
  "token" : "",
  "run_hux" : {
    "job_name" : "",
    "parameters" : [
      {
      "name" : "",
      "value" : ""
      }
    ]
  }
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

Save Build Reslut json to file:

Add to grunt config:

```javascript
'grunt-jenkins-job': {
	result_file: true, // will save result json to current folder with name .build_result.json
```
or
```javascript
'grunt-jenkins-job': {
	result_file: 'provide the full path and file name',
```

```sh
echo .build_result.json >> .gitignore
```

## Run

```sh
grunt deploydev
```
