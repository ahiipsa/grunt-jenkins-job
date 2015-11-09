/*
 * grunt-jenkins-job
 */
'use strict';

module.exports = function (grunt) {
    var util = require('util'),
        extend = require('util')._extend,
        request = require('request'),
        jar = request.jar();

    grunt.registerTask('grunt-jenkins-job', 'build jenkins jobs', function(task) {
        grunt.config.requires('grunt-jenkins-job');
        grunt.config.requires('grunt-jenkins-job.username');
        grunt.config.requires('grunt-jenkins-job.password');
        grunt.config.requires('grunt-jenkins-job.host');
        grunt.config.requires('grunt-jenkins-job.tasks.' + task );
        grunt.config.requires('grunt-jenkins-job.tasks.' + task + '.jobName' );
        var _ = grunt.util._;
        var config = grunt.config('grunt-jenkins-job'),
            done = this.async();
        var buildIdFound = -1;
        
        var ifFunction = function(valueToCheck){
          if (typeof valueToCheck !=='undefined' && valueToCheck!==null && _.isFunction(valueToCheck)){
            return valueToCheck.apply(grunt, []);
          }
          return valueToCheck;          
        }

        if(!config.tasks[task].jobName){
            grunt.fail.warn( util.format('Required config property "grunt-jenkins-job.tasks.%s.jobName" missing.', task) );
            return done(false);
        }

        grunt.log.writeln( util.format('%s build prepare', task));

        // const
        var PATH_LOGIN = '/j_acegi_security_check',
            PATH_BUILD = '%s/job/%s/build/api/json',
            PATH_LAST_BUILD = '/job/%s/lastBuild/api/json',
            PATH_ACTUAL_BUILD = '/job/%s/%s/api/json',
            PATH_WITH_PARAMS = '%s/job/%s/buildWithParameters/api/json',
            PATH_WITH_TOKEN = '?token=%s',
            PATH_WITH_PARAM = '&%s=%s'

        var buildURL = function(path){
            return util.format('%s%s', config.host, path);
        };   

        var buildPostURL = function(job, jobName){
          var url = null;
          var value = null;
          var name = null;
          var paramAdded = false;
          
          url = util.format(PATH_WITH_PARAMS, config.host, jobName);
          if(typeof config.token !=='undefined'){
            url = url.concat(util.format(PATH_WITH_TOKEN,config.token));
          }else{
            url = url.concat('?tokenUsed=false');
          }
          
          if(typeof config.parameters !=='undefined' && config.parameters !==null && config.parameters.length>0){
            config.parameters = ifFunction(config.parameters);
            paramAdded = true;
            for(var param in config.parameters){
              param = ifFunction(param);
              name = ifFunction(config.parameters[param].name);
              value = ifFunction(config.parameters[param].value);
              url = url + util.format(PATH_WITH_PARAM,encodeURIComponent(name),encodeURIComponent(value));
            }
          }
          
          if(job!==null && typeof job.parameters !=='undefined' && job.parameters !==null && job.parameters.length>0){
            job.parameters = ifFunction(job.parameters);
            paramAdded = true;
            for(var param in job.parameters){
              param = ifFunction(param);
              name = ifFunction(job.parameters[param].name);
              value = ifFunction(job.parameters[param].value);
              url = url + util.format(PATH_WITH_PARAM,encodeURIComponent(name),encodeURIComponent(value));
            }
          }
          
          if(!paramAdded){
            url = util.format(PATH_BUILD, config.host, jobName);
          }
          grunt.log.debug(util.format("Build Url = %s", url));
          return url;
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
                return cb( null);
            });
         };

        var buildJob = function(jobName, cb) {
            var job = config.tasks[jobName],
                path = util.format(PATH_BUILD, job.jobName),
                url = buildPostURL(job, job.jobName);

            request({
                url: url,
                method: 'POST',
                strictSSL: false,
                jar: jar,
                form: {
                    //json: JSON.stringify({"parameter": extend(job.parameter,config.parameter)})
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

                    return cb(null,error || errorCode);
                }
                return cb(response.headers['location'],null);
            });
        };

        var getLastBuild = function(jobName, buildId, cb) {

            var job = config.tasks[jobName];
            var path;
            if(buildId === null){
              path = util.format(PATH_LAST_BUILD, job.jobName);
            }else if( buildId === -1 ){
              return cb(null, null);
            }else{
              path = util.format(PATH_ACTUAL_BUILD, job.jobName, buildId);
            }

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
       
        var getBuildId = function(queueItem, jobName, cb) {
           var defaultBuildIdReturn = -1;
           
           if(buildIdFound!=-1){
             //grunt.log.writeln('buildIdFound = ' + buildIdFound);
             return getLastBuild(jobName, buildIdFound, cb);
           }
           else
           {
                var r = request({
                    url: queueItem + 'api/json',
                    method: 'GET',
                    strictSSL: false,
                    jar: jar,
                    json: true
                }, function(error, response, body) {
    
                    if(error || response.statusCode > 399) {
                        grunt.log.warn(error)
                        grunt.log.warn(response.statusCode)
                        return getLastBuild(jobName, defaultBuildIdReturn, cb);
                    }
                    
                    if(typeof body.executable === 'undefined' || body.executable === null){
                      return getLastBuild(jobName, defaultBuildIdReturn, cb);
                    }else{
                      buildIdFound = body.executable.number;        
                      return getLastBuild(jobName, body.executable.number, cb);
                    }
                });
           }
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
            var buildId = -1;
            buildJob(task, function(queueItem, err) {

                if(err){
                    grunt.log.error('Run build error', err);
                    return done(false);
                }
                grunt.log.debug(util.format('Queue Item: %s',queueItem));
                grunt.log.write(util.format('%s build in progress', task));
                var buildId = -1;
                var isBuilding = function() {

                    getBuildId(queueItem, task, function(err, build) {
                        if(err){
                            grunt.log.writeln('');
                            return done(false);
                        }

                        grunt.log.write('.');

                        if(build === null || build.result === null) {
                            setTimeout(function() { isBuilding(); }, 1000);
                        } else {
                            if(typeof config.result_file !=='undefined' && config.result_file !==null){
                              if(typeof config.result_file === "boolean"){
                                config.result_file = util.format('%s/.build_result.json',__dirname);
                              }
                              grunt.file.write(config.result_file, JSON.stringify(build));
                              grunt.log.writeln('');
                              grunt.log.writeln(util.format('Build Result written to: %s',config.result_file));
                            }
                            grunt.log.writeln('');
                            var msg = util.format('%s build %s complete with status of %s', task,build.url,build.result);
                            if(build.result === 'SUCCESS'){
                              grunt.log.ok(msg);
                            }else{
                              grunt.fail.warn(msg);
                            }
                            return done(true);
                        }
                    });
                };
                isBuilding();
            });
        });
    });
}
