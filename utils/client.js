var async   = require('async');
var request = require('request'); // github.com/mikeal/request
var formidable = require('formidable');
var crypto = require('crypto');

module.exports = function(app, io, slack, App) {

    var application = null;

    function isAuthorized(req, res, next) {

        var appid = req.param('appid');

        if(appid === null) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        App.findOne({ appId: appid }, function(err, app) {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Error" });
            }

            if(app === null) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            if(app.online === false) {
                return res.status(503).json({ success: false, message: "Support offline" });
            }

            if(app.active === false) {
                return res.status(404).json({ success: false, message: "Application offline" });
            }

            application = app;

            return next();
        });
    }

    function isAdmin(req, res, next) {

        var appid = req.param('appid');
        var token = req.param('token'); // Private token

        if(appid === null || token === null) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // TODO: use the real token
        App.findOne({ appId: appid, slackApiToken: token }, function(err, app) {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Error" });
            }

            if(app === null) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            if(app.online === false) {
                return res.status(503).json({ success: false, message: "Support offline" });
            }

            if(app.active === false) {
                return res.status(404).json({ success: false, message: "Application offline" });
            }

            application = app;

            return next();
        });
    }

    app.get('/', function(req, res, next) {
        return res.status(200).json({ success: true, message: "Welcome, nothing here" });
    });

    app.post('/app/file-upload', isAuthorized, function(req, res, next) {

        // Retrieve Prudio appid
        var appid       = req.param('appid');

        // Retrieve Slack channel
        var channel     = req.param('channel');

        // Create the POST parser object
        var form        = new formidable.IncomingForm();

        // Parse data from POST
        form.parse(req, function(err, fields, files) {
            App.findOne({ appId: appid, active: true }, function(err, application) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: "Error" });
                }

                slack.uploadFile(application.slackApiToken,channel, files);

                return res.status(200).json({ success: true, message: "Uploading" });
            });
        });

    });

    // TODO: Use diferent method for authorization
    app.post('/app/connect', isAdmin, function(req, res, next) {
        var appid            = req.param('appid');

        App.findOne({ appId: appid, active: true }, function(err, application) {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Error" });
            }

            slack.connect(application);

            return res.status(200).json({ success: true, message: "Initializing" });
        });
    });

    // TODO: Use diferent method for authorization
    app.post('/app/disconnect', isAdmin, function(req, res, next) {
        var appid = req.param('appid');
        App.findOne({ appId: appid, active: true }, function(err, application) {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Error" });
            }

            slack.disconnect(application.id);

            return res.status(200).json({ success: true, message: "Disconnecting" });
        });
    });

    app.post('/app/ping', isAuthorized, function(req, res, next) {
        var appid = req.param('appid');
        App.findOne({ appId: appid, active: true }, function(err, application) {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Error" });
            }

            var onlineUsers = slack.onlineUsers(application.appId);

            return res.status(200).json({ success: true, onlineUsers: onlineUsers.length, message: onlineUsers.length + " users online." });
        });
    });

    app.post('/chat/history', isAuthorized, function(req, res, next) {

        var appid            = req.param('appid');
        var channel          = req.param('channel');
        var channelSignature = req.param('signature');

        async.waterfall(
            [
                function(callback) {
                    App.findOne({ appId: appid, active: true }, function(err, application) {
                        if (err) {
                            return callback(err);
                        }

                        return callback(null, application);
                    });
                },

                function(application, callback) {
                    // Verify if the user already has previous support (from cookies)
                    if(channel !== null && channelSignature !== null) {
                        // Returning user with cookie
                        var verify = crypto.createHmac('sha1', application.slackApiToken).update(channel).digest('hex');

                        // Verify signature else it will create a new one!
                        if(verify === channelSignature) {
                            return callback(null, application);
                        } else {
                            return callback('Could not verify signature');
                        }
                    }
                },

                function(application, callback) {
                    return slack.history(application, channel, callback);
                }
            ],

            function(err, body, application) {
                if (err) {
                    return res.status(404).json({ success: false, result: err });
                }

                body.messages.reverse();

                var messages = [];

                for (var i in body.messages) {
                    if (body.messages.hasOwnProperty(i)) {
                        var message = body.messages[i];
                        if (message.type === 'message' && typeof message.subtype === 'undefined' && message.text !== '_User disconnected!_') {
                            console.log('Channel message: %j', message);

                            if (message.user === application.slack_invite_bot) {
                                message.sender = 'self';
                            } else {
                                message.sender = 'other';
                            }

                            message.user = undefined;
                            message.type = undefined;

                            messages.push(message);
                        }
                    }
                }

                return res.status(200).json({ success: true, messages: messages, messagesCount: messages.length });
            }
        );

    });

    app.post('/chat/create', isAuthorized, function(req, res, next) {

        var appid            = req.param('appid');
        var channelId        = req.param('channel');
        var channelName      = req.param('channelName');
        var channelSignature = req.param('signature');
        var userInfo         = req.param('userInfo');
        var settings         = req.param('settings');

        App.findOne({ appId: appid, active: true }, function(err, application) {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Error" });
            }

            if(application === null) {
                return res.status(404).json({ success: false, message: "Not found" });
            }

            async.waterfall(
                [
                    function(callback) {

                        // Verify if the user already has previous support (from cookies)
                        if(channelId !== null && channelSignature !== null) {
                            // Returning user with cookie
                            var verify = crypto.createHmac('sha1', application.slackApiToken).update(channelId).digest('hex');

                            // Verify signature else it will create a new one!
                            if(verify === channelSignature) {
                                return callback(null, channelName, channelId);
                            }
                        }

                        // No channel or signature, or invalid signature/channel, get the next channel
                        application.update({ $inc: { roomCount: 1}}, function(err, affected) {
                            if (err) {
                                return callback(err);
                            }

                            var channelName = application.roomPrefix + application.roomCount;
                            return callback(null, channelName, null);

                        });
                    },

                    // Create channel
                    function(channelName, channelId, callback) {

                        if(channelId !== null) {
                            return callback(null, channelName, channelId, true)
                        } else {

                            request.post(app.get('slack_api_url') + '/channels.join', { json: true, form: { token: application.slackApiToken, name: channelName }}, function (error, response, body) {
                                if (!error && response.statusCode === 200 && typeof body.channel !== "undefined") {
                                    return callback(null, channelName, body.channel.id, false);
                                }

                                return callback('Create Channel');
                            });
                        }
                    },

                    // Invite user to channel
                    function(channelName, channelId, returning, callback) {
                        request.post(app.get('slack_api_url') + '/channels.invite', { json: true, form: { token: application.slackApiToken, channel: channelId, user: application.slackInviteBot }}, function (error, response, body) {
                            if (!error && response.statusCode === 200) {
                                return callback(null, channelName, channelId, returning);
                            }
                            return callback('Invite user to channel');
                        });
                    },

                    // Set topic of channel
                    function(channelName, channelId, returning, callback) {

                        if(returning) {
                            return callback(null, channelName, channelId, returning);
                        }

                        var personal = JSON.parse(settings);

                        var topic = personal.name + " (" + personal.email + ")";

                        request.post(app.get('slack_api_url') + '/channels.setTopic', { json: true, form: { token: application.slackApiToken, channel: channelId, topic: topic }}, function (error, response, body) {
                            if (!error && response.statusCode === 200) {
                                return callback(null, channelName, channelId, returning);
                            }

                            return callback('Set topic of channel');
                        });
                    },


                    // Set purpose of channel
                    function(channelName, channelId, returning, callback) {

                        if(returning) {
                            return callback(null, channelName, channelId);
                        }

                        var info     = JSON.parse(userInfo);
                        var personal = JSON.parse(settings);

                        var purpose = "Help!" +
                        "\nURL: " + info.url + " (" + req.ip + ")" +
                        "\nBrowser: " + info.browser + " - " + info.browserVersion +
                        "\nOS: " + info.os + " - " + info.osVersion +
                        "\nMobile: " + info.mobile +" - Screen resolution: " + info.screen;

                        request.post(app.get('slack_api_url') + '/channels.setPurpose', { json: true, form: { token: application.slackApiToken, channel: channelId, purpose: purpose }}, function (error, response, body) {
                            if (!error && response.statusCode === 200) {
                                return callback(null, channelName, channelId);
                            }

                            return callback('Set purpose of channel');
                        });
                    },

                    // Leave the channel
                    function(channelName, channelId, callback) {

                        if (!application.join) {
                            request.post(app.get('slack_api_url') + '/channels.leave', { json: true, form: { token: application.slackApiToken, channel: channelId }}, function (error, response, body) {
                                if (!error && response.statusCode === 200) {
                                    return callback(null, channelName, channelId);
                                }

                                return callback('Leave the channel');
                            });
                        } else {
                            return callback(null, channelName, channelId);
                        }
                    },

                    // Send notification
                    function(channelName, channelId, callback) {

                        var text = "New help request at channel <#" + channelId + "|" + channelName + ">. Join now!";

                        request.post(app.get('slack_api_url') + '/chat.postMessage', { json: true, form: { token: application.slackApiToken, channel: '#general', text: text, username: 'Prud.io', icon_url: 'http://chat.prud.io/prudio-notification-icon.png' }}, function (error, response, body) {
                            if (!error && response.statusCode === 200) {
                                return callback(null, channelName, channelId);
                            }
                            return callback('Leave the channel');
                        });
                    },

                ],
                function(err, channelName, channelId) {
                    if(err) {
                        console.log("ERROR: " + err);
                        return res.status(404).json({ error: "Error: " + err});
                    }

                    var signature = crypto.createHmac('sha1', application.slackApiToken).update(channelId).digest('hex');

                    return res.status(200).json({ success: true, channel: channelId, channelName: channelName, signature: signature });
                }
            );
        });

    });

};
