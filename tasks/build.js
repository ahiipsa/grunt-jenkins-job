/*
 * grunt-jenkins-job
 */
'use strict';

module.exports = function (grunt) {
    var util = require('util'),
        request = require('request'),
        jar = request.jar();

    grunt.registerTask('grunt-jenkins-job', 'build jenkins jobs', function(task) {
        grunt.config.requires('grunt-jenkins-job');
        grunt.config.requires('grunt-jenkins-job.username');
        grunt.config.requires('grunt-jenkins-job.password');
        grunt.config.requires('grunt-jenkins-job.host');
        grunt.config.requires('grunt-jenkins-job.tasks.' + task );
        grunt.config.requires('grunt-jenkins-job.tasks.' + task + '.jobName' );

        var config = grunt.config('grunt-jenkins-job'),
            done = this.async();

        if(!config.tasks[task].jobName){
            grunt.fail.warn( util.format('Required config property "grunt-jenkins-job.tasks.%s.jobName" missing.', task) );
            return done(false);
        }

        grunt.log.writeln( util.format('%s build prepare', task));

        // const
        var PATH_LOGIN = '/j_acegi_security_check',
            PATH_BUILD = '/job/%s/build/api/json',
            PATH_LAST_BUILD = '/job/%s/lastBuild/api/json';

        var buildURL = function(path){
            return util.format('%s%s', config.host, path);
        };

        var login = function (cb) {
            var formData = {
                    j_username: config.username,
                    j_password: config.password,
                    from: '/',
                    remember_me: false
                },
                url =  buildURL(PATH_LOGIN),
                requestParams = {
                    url: url,
                    method: 'POST',
                    strictSSL: false,
                    jar: jar,
                    followRedirect: true,
                    form: formData
                };

            request(requestParams, function(error, response) {
                if(error || response.statusCode > 399) {
                    return cb(error || 'ERROR_AUTH');
                }

                return cb(null);
            });
        };

        var buildJob = function(jobName, cb) {
            var job = config.tasks[jobName],
                path = util.format(PATH_BUILD, job.jobName),
                url = buildURL(path);

            request({
                url: url,
                method: 'POST',
                strictSSL: false,
                jar: jar,
                form: {
                    json: JSON.stringify({"parameter": job.parameter})
                }
            }, function(error, response, body) {
                if(error || response.statusCode > 399) {
                    grunt.verbose.writeln(util.format('job build, response: %d %s',  response.statusCode, url));

                    var errorCode = 'ERROR_JOB_BUILD';

                    if(response.statusCode === 403){
                        errorCode = 'ERROR_AUTH';
                    }

                    if(response.statusCode === 404){
                        errorCode = 'ERROR_JOB_NOT_FOUND';
                    }

                    return cb(error || errorCode);
                }

                return cb(null);
            });
        };

        var getLastBuild = function(jobName, cb) {
            var job = config.tasks[jobName],
                path = util.format(PATH_LAST_BUILD, job.jobName);

            request({
                url: buildURL(path),
                method: 'POST',
                strictSSL: false,
                jar: jar,
                json: true
            }, function(error, response, body) {
                if(error || response.statusCode > 399) {
                    return cb(error || 'ERROR_GET_LAST_BUILD');
                }

                return cb(null, body);
            });
        };

        login(function(err) {
            if(err) {
                grunt.log.error('Authentication error', err);
                if('ERROR_AUTH' === err){
                    grunt.log.warn('Check host, username, password');
                    grunt.log.warn(util.format( 'host: %s, username: %s', config.host, config.username ));
                }

                return done(false);
            }

            buildJob(task, function(err) {
                if(err){
                    grunt.log.error('Run build error', err);
                    return done(false);
                }

                grunt.log.write(util.format('%s build in progress', task));

                var isBuilding = function() {
                    getLastBuild(task, function(err, build) {
                        if(err){
                            grunt.log.writeln('');
                            return done(false);
                        }

                        grunt.log.write('.');

                        if(build.building === false) {
                            setTimeout(isBuilding, 1000);
                        } else {
                            grunt.log.writeln('');
                            grunt.log.ok(util.format('%s build complete', task));
                            return done(true);
                        }
                    });
                };

                isBuilding();
            });
        });
    });
}