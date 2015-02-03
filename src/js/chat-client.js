(function() {

// Localize jQuery variable
var jQuery;

var baseURL = "https://prudio-chat.herokuapp.com:443";  //"http://chat.prud.io:80";
var ENTER_KEY_CODE = 13;

/******** Load jQuery if not present *********/
if (window.jQuery === undefined || window.jQuery.fn.jquery !== '2.1.1') {
    var scriptTag = document.createElement('script');
    scriptTag.setAttribute("type","text/javascript");
    scriptTag.setAttribute("src",
        "//code.jquery.com/jquery-2.1.1.min.js");
    if (scriptTag.readyState) {
      scriptTag.onreadystatechange = function () { // For old versions of IE
          if (this.readyState === 'complete' || this.readyState === 'loaded') {
              scriptLoadHandler();
          }
      };
    } else { // Other browsers
      scriptTag.onload = scriptLoadHandler;
    }
    // Try to find the head, otherwise default to the documentElement
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(scriptTag);
} else {
    // The jQuery version on the window is the one we want to use
    jQuery = window.jQuery;

    main();
}

/******** Called once jQuery has loaded ******/
function scriptLoadHandler() {
    // Restore $ and window.jQuery to their previous values and store the
    // new jQuery in our local jQuery variable
    jQuery = window.jQuery.noConflict(true);
    // Call our main function
    main();
}

/******** Our main function ********/
function main() {

    // Adding the proprety dataTransfer to jQuery events
    jQuery.event.props.push( "dataTransfer" );

    jQuery(document).ready(function($)
    {
        $.urlParam = function(name, url) {
            var results = new RegExp('[?|&|#]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url);
            if (results === null) {
                return;
            }
            return results[1] || 0;
        };

        $.loadCSS = function(href) {
            var cssLink = $("<link rel='stylesheet' type='text/css' href='"+href+"'>");
            $("head").append(cssLink);
        };

        $.findJS = function() {
            var elems = document.getElementsByTagName('script');
            var re = /chat\.prud\.io\/client/;

            for(var i = 0; i < elems.length; i++) {
                if(elems[i].src.match(re)) {
                    return elems[i];
                }
            }

            throw "Could not find the script from Prudio.";
        };

        $.getSettings = function() {
            var el = $.findJS();
            var params = ['appid', 'name', 'email'];
            var settings = new Object();

            for(var i = 0; i < params.length; i++) {
                var p = params[i];
                settings[p] = $.urlParam(p, el.src);
            }

            if (typeof window._PrudioSettings !== 'undefined') {
                for (var attrname in window._PrudioSettings) {
                    if (window._PrudioSettings.hasOwnProperty(attrname)) {
                        settings[attrname] = window._PrudioSettings[attrname];
                    }
                }
            }

            return settings;
        };

        $.createButton = function() {
            var button = $('<div id="prudio-button" style="background-color: ' + (settings.buttonColor || '') + '" title="Chat with us"><i class="icon-prudio"></i></div><div id="prudio-notification"></div>');
            $("body").append(button);
        };

        $.loadJS = function(href) {
            var jsLink = $("<script src='" + href + "'></script>");
            $("head").append(jsLink);
        };

        $.scrollChat = function(to) {
            $(to).stop().animate({
                scrollTop: $(to).prop("scrollHeight")
            }, 'slow');
        };

        /**
        * Set cookie with name @var cookie with value @var value for @var days period.
        */
        $.setCookie = function(cookie, value, days) {
            days = days || 730; // 2 years

            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));

            // Set Cookie
            document.cookie = cookie + "=" + value + "; expires=" + date.toGMTString() + "; path=/";
        };

        /**
        * Get a cookie named @var cookie
        */
        $.getCookie = function(name) {
            var value = " " + document.cookie;
            var start = value.indexOf(" " + name + "=");
            if (start === -1) {
                value = null;
            }
            else {
                start = value.indexOf("=", start) + 1;
                var end = value.indexOf(";", start);
                if (end === -1) {
                    end = value.length;
                }
                value = unescape(value.substring(start,end));
            }
            return value;
        };

        /**
        * Gets the UUID for this user. If doesn't exist, creates a new UUID.
        */
        /*
        $.getUUID = function() {
            var cookieName = "prudio-uuid";
            if($.getCookie(cookieName) === null) {
                // Does not exists; Lets create a UUID for this user
                $.loadJS(baseURL + "/js/uuid.js");
                var cuuid = uuid.v4();
                $.setCookie(cookieName, cuuid);

                return cuuid;
            }
            return $.getCookie(cookieName);
        }
        */

        /**
        * Get User Info
        */
        $.getUserSystemInfo = function() {
            /**
            * JavaScript Client Detection
            * (C) viazenetti GmbH (Christian Ludwig)
            */

            var unknown = '-';

            // screen
            var screenSize = '';
            if (screen.width) {
                var width = (screen.width) ? screen.width : '';
                var height = (screen.height) ? screen.height : '';
                screenSize += '' + width + " x " + height;
            }

            //browser
            var nVer = navigator.appVersion;
            var nAgt = navigator.userAgent;
            var browser = navigator.appName;
            var version = '' + parseFloat(navigator.appVersion);
            var majorVersion = parseInt(navigator.appVersion, 10);
            var nameOffset, verOffset, ix;
            var url = document.URL;

            // Opera
            if ((verOffset = nAgt.indexOf('Opera')) !== -1) {
                browser = 'Opera';
                version = nAgt.substring(verOffset + 6);
                if ((verOffset = nAgt.indexOf('Version')) !== -1) {
                    version = nAgt.substring(verOffset + 8);
                }
            }
            // MSIE
            else if ((verOffset = nAgt.indexOf('MSIE')) !== -1) {
                browser = 'Microsoft Internet Explorer';
                version = nAgt.substring(verOffset + 5);
            }
            // Chrome
            else if ((verOffset = nAgt.indexOf('Chrome')) !== -1) {
                browser = 'Chrome';
                version = nAgt.substring(verOffset + 7);
            }
            // Safari
            else if ((verOffset = nAgt.indexOf('Safari')) !== -1) {
                browser = 'Safari';
                version = nAgt.substring(verOffset + 7);
                if ((verOffset = nAgt.indexOf('Version')) !== -1) {
                    version = nAgt.substring(verOffset + 8);
                }
            }
            // Firefox
            else if ((verOffset = nAgt.indexOf('Firefox')) !== -1) {
                browser = 'Firefox';
                version = nAgt.substring(verOffset + 8);
            }
            // MSIE 11+
            else if (nAgt.indexOf('Trident/') !== -1) {
                browser = 'Microsoft Internet Explorer';
                version = nAgt.substring(nAgt.indexOf('rv:') + 3);
            }
            // Other browsers
            else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
                browser = nAgt.substring(nameOffset, verOffset);
                version = nAgt.substring(verOffset + 1);
                if (browser.toLowerCase() === browser.toUpperCase()) {
                    browser = navigator.appName;
                }
            }
            // trim the version string
            if ((ix = version.indexOf(';')) !== -1) { version = version.substring(0, ix); }
            if ((ix = version.indexOf(' ')) !== -1) { version = version.substring(0, ix); }
            if ((ix = version.indexOf(')')) !== -1) { version = version.substring(0, ix); }

            majorVersion = parseInt('' + version, 10);
            if (isNaN(majorVersion)) {
                version = '' + parseFloat(navigator.appVersion);
                majorVersion = parseInt(navigator.appVersion, 10);
            }

            // mobile version
            var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

            // cookie
            var cookieEnabled = !!(navigator.cookieEnabled);

            if (typeof navigator.cookieEnabled === 'undefined' && !cookieEnabled) {
                document.cookie = 'testcookie';
                cookieEnabled = (document.cookie.indexOf('testcookie') !== -1);
            }

            // system
            var os = unknown;
            var clientStrings = [
            {s:'Windows 3.11', r:/Win16/},
            {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
            {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
            {s:'Windows 98', r:/(Windows 98|Win98)/},
            {s:'Windows CE', r:/Windows CE/},
            {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
            {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
            {s:'Windows Server 2003', r:/Windows NT 5.2/},
            {s:'Windows Vista', r:/Windows NT 6.0/},
            {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
            {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
            {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
            {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
            {s:'Windows ME', r:/Windows ME/},
            {s:'Android', r:/Android/},
            {s:'Open BSD', r:/OpenBSD/},
            {s:'Sun OS', r:/SunOS/},
            {s:'Linux', r:/(Linux|X11)/},
            {s:'iOS', r:/(iPhone|iPad|iPod)/},
            {s:'Mac OS X', r:/Mac OS X/},
            {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
            {s:'QNX', r:/QNX/},
            {s:'UNIX', r:/UNIX/},
            {s:'BeOS', r:/BeOS/},
            {s:'OS/2', r:/OS\/2/},
            {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
            ];

            for (var id in clientStrings) {
                if (clientStrings.hasOwnProperty(id)) {
                    var cs = clientStrings[id];
                    if (cs.r.test(nAgt)) {
                        os = cs.s;
                        break;
                    }
                }
            }

            var osVersion = unknown;

            if (/Windows/.test(os)) {
                osVersion = /Windows (.*)/.exec(os)[1];
                os = 'Windows';
            }

            switch (os) {
            case 'Mac OS X':
                osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                break;

            case 'Android':
                osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                break;

            case 'iOS':
                osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] || 0);
                break;
            }

            return {
                screen: screenSize,
                browser: browser,
                browserVersion: version,
                mobile: mobile,
                os: os,
                osVersion: osVersion,
                cookies: cookieEnabled,
                url: url
            };
        };

        /**
        * Flash page title
        * URL: https://github.com/heyman/jquery-titlealert
        */
        $.titleAlert = function(text, settings) {
            // check if it currently flashing something, if so reset it
            if ($.titleAlert._running) {
                $.titleAlert.stop();
            }

            // override default settings with specified settings
            $.titleAlert._settings = settings = $.extend( {}, $.titleAlert.defaults, settings);

            // if it's required that the window doesn't have focus, and it has, just return
            if (settings.requireBlur && $.titleAlert.hasFocus) {
                return;
            }

            // originalTitleInterval defaults to interval if not set
            settings.originalTitleInterval = settings.originalTitleInterval || settings.interval;

            $.titleAlert._running = true;
            $.titleAlert._initialText = document.title;
            document.title = text;
            var showingAlertTitle = true;
            var switchTitle = function() {
                // WTF! Sometimes Internet Explorer 6 calls the interval function an extra time!
                if (!$.titleAlert._running) {
                    return;
                }

                showingAlertTitle = !showingAlertTitle;
                document.title = (showingAlertTitle ? text : $.titleAlert._initialText);
                $.titleAlert._intervalToken = setTimeout(switchTitle, (showingAlertTitle ? settings.interval : settings.originalTitleInterval));
            };

            $.titleAlert._intervalToken = setTimeout(switchTitle, settings.interval);

            if (settings.stopOnMouseMove) {
                $(document).mousemove(function(event) {
                    $(this).unbind(event);
                    $.titleAlert.stop();
                });
            }

            // check if a duration is specified
            if (settings.duration > 0) {
                $.titleAlert._timeoutToken = setTimeout(function() {
                    $.titleAlert.stop();
                }, settings.duration);
            }
        };

        // default settings
        $.titleAlert.defaults = {
            interval: 500,
            originalTitleInterval: null,
            duration:0,
            stopOnFocus: true,
            requireBlur: false,
            stopOnMouseMove: false
        };

        // stop current title flash
        $.titleAlert.stop = function() {
            if (!$.titleAlert._running) {
                return;
            }

            clearTimeout($.titleAlert._intervalToken);
            clearTimeout($.titleAlert._timeoutToken);
            document.title = $.titleAlert._initialText;

            $.titleAlert._timeoutToken = null;
            $.titleAlert._intervalToken = null;
            $.titleAlert._initialText = null;
            $.titleAlert._running = false;
            $.titleAlert._settings = null;
        };

        $.titleAlert.hasFocus = true;
        $.titleAlert._running = false;
        $.titleAlert._intervalToken = null;
        $.titleAlert._timeoutToken = null;
        $.titleAlert._initialText = null;
        $.titleAlert._settings = null;


        $.titleAlert._focus = function () {
            $.titleAlert.hasFocus = true;

            if ($.titleAlert._running && $.titleAlert._settings.stopOnFocus) {
                var initialText = $.titleAlert._initialText;
                $.titleAlert.stop();

                // ugly hack because of a bug in Chrome which causes a change of document.title immediately after tab switch
                // to have no effect on the browser title
                setTimeout(function() {
                    if ($.titleAlert._running) {
                        return;
                    }
                    document.title = ".";
                    document.title = initialText;
                }, 1000);
            }
        };
        $.titleAlert._blur = function () {
            $.titleAlert.hasFocus = false;
        };

        // bind focus and blur event handlers
        $(window).bind("focus", $.titleAlert._focus);
        $(window).bind("blur", $.titleAlert._blur);

        /**
        * END titleAlert
        */

        /*
        * Play Notification
        */
        $.playSound = function() {
            var filename = baseURL + "/notification";

            if(!muted) {
                $('#prudio-notification').html('<audio autoplay="autoplay"><source src="' + filename + '.mp3" type="audio/mpeg" /><source src="' + filename + '.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + filename + '.mp3" /></audio>');
            }
        };

        $.continueProgram = function(settings) {

            var channel     = $.getCookie('prudio-channel');
            var signature   = $.getCookie('prudio-signature');

            // Recover conversation
            $.ajax({
                url: baseURL + "/chat/history",
                method: 'POST',
                data: {
                    appid:       settings.appid,
                    channel:     channel,
                    signature:   signature
                },
                error: function(xhr, ajaxOptions, thrownError){

                    $('<li class="error"></li>').text("We got a problem retriving the history!").appendTo($('#prudio-window ul'));

                    console.log(xhr);
                    console.log(ajaxOptions);
                    console.log(thrownError);
                },
                success: function(data) {

                    for (var i in data.messages) {
                        if (data.messages.hasOwnProperty(i)) {
                            var message = data.messages[i];
                            $('<li class="' + message.sender + '"></li>').text(message.text).appendTo($('#prudio-window ul'));
                        }
                    }

                    $('<li class="server"></li>').text("Conversation history").appendTo($('#prudio-window ul'));

                    $.scrollChat('#prudio-window div.messages');
                }
            });

            $('#prudio-window div.reply input[name=message]').attr('type', 'text').attr('placeholder', 'Just write...').blur().focus();
            $.openSocket(settings);
        };


        $.checkUserInfo = function(settings) {

            console.log(settings);

            // No name
            if(typeof settings.name === 'undefined') {
                // Ask
                $('<li class="other"></li>').text("Please type your name in the chatbox below").appendTo($('#prudio-window ul'));

                $('#prudio-window div.reply input[name=message]').prop('placeholder', 'Your name').blur().focus();

                // Capture
                $('#prudio-window div.reply input[name=message]').bind('keypress', function(e) {
                    if (e.keyCode === ENTER_KEY_CODE && $(this).val() !== "") {
                        var message = $(this).val();

                        console.log("ENTER name");
                        settings.name = message;

                        $(this).val('').unbind('keypress');

                        $('<li class="self"></li>').text(settings.name).appendTo($('#prudio-window ul'));

                        console.log(settings);

                        return $.checkUserInfo(settings);
                    }
                });
            }

            // No e-mail
            else if(typeof settings.email === 'undefined') {
                // Ask
                $('<li class="other"></li>').text("Please type your e-mail in the chatbox below").appendTo($('#prudio-window ul'));

                $('#prudio-window div.reply input[name=message]').prop('placeholder', "Your e-mail").prop('type','email').blur().focus();

                // Capture
                $('#prudio-window div.reply input[name=message]').bind('keypress', function(e) {
                    if (e.keyCode === ENTER_KEY_CODE && $(this).val() !== "") {
                        var message = $(this).val();

                        console.log("ENTER email");
                        settings.email = message;

                        $(this).val('').prop('type', 'text').unbind('keypress');

                        $('<li class="self"></li>').text(settings.email).appendTo($('#prudio-window ul'));

                        return $.checkUserInfo(settings);
                    }
                });
            } else {
                return $.continueProgram(settings);
            }
        };

        $.openSocket = function(settings) {

            // If they exist.
            var channel     = $.getCookie('prudio-channel');
            var channelName = $.getCookie('prudio-channel-name');
            var signature   = $.getCookie('prudio-signature');
            var userInfo    = $.getUserSystemInfo();

            $('<li class="server connecting"></li>').html('<i class="icon-flash-outline"></i> Connecting to the server...').appendTo($('#prudio-window ul'));

            $.ajax({
                url: baseURL + "/chat/create",
                method: 'POST',
                data: {
                    appid:       settings.appid,
                    channel:     channel,
                    channelName: channelName,
                    signature:   signature,
                    settings:    JSON.stringify(settings),
                    userInfo:    JSON.stringify(userInfo)
                },
                error: function(xhr, ajaxOptions, thrownError){

                    $('<li class="error"></li>').text("We got a problem connecting to the server!").appendTo($('#prudio-window ul'));

                    console.log(xhr);
                    console.log(ajaxOptions);
                    console.log(thrownError);
                },
                success: function(data) {

                    // Save connection to cookies
                    $.setCookie('prudio-channel',      data.channel);
                    $.setCookie('prudio-channel-name', data.channelName);
                    $.setCookie('prudio-signature',    data.signature);

                    var socket = io.connect(baseURL + '/chat');

                    $('#prudio-window div.reply input[name=message]').bind('keypress', function(e){
                        // if enter key
                        if (e.keyCode === ENTER_KEY_CODE && $(this).val() !== "") {
                            var message = $(this).val();

                            socket.emit('sendMessage', {
                                message: message
                            });

                            $('<li class="self"></li>').text(message).appendTo($('#prudio-window ul'));

                            $.scrollChat('#prudio-window div.messages');

                            $(this).val(''); // clear message field after sending
                        }
                    });

                    socket.on('connect', function() {
                        // Store the joinedChannel fo further external uses (e.g. files upload)
                        settings.joinedChannel = data.channel;
                        socket.emit('joinRoom', settings.appid, data.channel, data.signature);

                        // Remove the connecting message
                        $('#prudio-window ul li.connecting').slideUp();
                    });

                    // On Slack message
                    socket.on('message', function (data) {
                        if(data.sender === "Other") {
                            $('#prudio-window ul li.typing').remove();
                            $('<li class="other"></li>').html(data.message).appendTo($('#prudio-window ul'));
                            $.scrollChat('#prudio-window div.messages');
                            $.titleAlert("New message", { stopOnMouseMove:true, stopOnFocus:true, requireBlur: true});
                            $.playSound();
                        }
                    });

                    socket.on('disconnect', function () {
                        $('<li class="error"></li>').text("Server is now offline!").appendTo($('#prudio-window ul'));
                        $.scrollChat('#prudio-window div.messages');
                        $('#prudio-window div.reply input[name=message]').prop('disabled', true);
                    });

                    socket.on('serverMessage', function (data) {
                        $('<li class="server"></li>').text(data.message).appendTo($('#prudio-window ul'));
                        $.scrollChat('#prudio-window div.messages');
                        $('#prudio-window div.reply input[name=message]').prop('disabled', false);
                    });

                    socket.on('typingMessage', function () {
                        $('#prudio-window ul li.typing').remove();
                        $('<li class="typing"></li>').html('<i class="icon-chat"></i> User is typing...').appendTo($('#prudio-window ul')).show().delay(7000).slideUp();
                        $.scrollChat('#prudio-window div.messages');
                    });
                }
            });
        };

        $.uploadFiles = function(file){

            // Create the FormData object to send the file as a form
            var data = new FormData();

            // Add the file to the formData
            data.append('file', file, file.name);

            // Perform the request
            $.ajax({
                url: baseURL + '/app/file-upload?appid=' + settings.appid + '&channel=' + settings.joinedChannel,
                type: 'POST',
                data: data,
                cache: false,
                dataType: 'json',
                processData: false, // Don't process the files
                contentType: false // Set content type to false as jQuery will tell the server its a query string request
            })
            .done(function(data, textStatus, jqXHR)
            {
                if(typeof data.error === 'undefined')
                {
                    // console.log('SUCCESS: ' + data);
                    $('<li class="server"></li>').text("Uploading file").appendTo($('#prudio-window ul'));
                }
                else
                {
                    // console.log('ERRORS: ' + data.error);
                    $('<li class="error"></li>').text("Error uploading the file!").appendTo($('#prudio-window ul'));

                }
            })
            .fail(function(jqXHR, textStatus, errorThrown)
            {
                // console.log('ERRORS: ' + textStatus);
                $('<li class="error"></li>').text("Error uploading the file! Try again!").appendTo($('#prudio-window ul'));
            })
        };

        $.handleFilesDragOver = function(event) {

            // Avoid Standard actions
            event.stopPropagation();
            event.preventDefault();

            // Explicitly show this is a copy, avoid user to _self with the files.
            event.dataTransfer.dropEffect = 'copy';

        };

        $.handleFileSelect = function(event) {

            // Avoid Standard actions
            event.stopPropagation();
            event.preventDefault();

            // Append files into a FileList Object
            var files = event.dataTransfer.files;

            // Itterate on files to send them one by one (async)
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                $.uploadFiles(file);
            }

        };

        $.handleFormFileSelect = function(event) {

            // Append files into a FileList Object
            var files = event.files;

            // Itterate on files to send them one by one (async)
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                $.uploadFiles(file);
            }

        };

        $.loadCSS(baseURL + "/client.css");
        $.loadJS(baseURL + "/socket.io/socket.io.js");

        var settings  = $.getSettings();

        if(!settings.buttonSelector) {
            $.createButton(settings);
        }

        var open = false;
        var muted = false;

        $(document).on('click', '#prudio-window span.close', function() {
            $('#prudio-window').toggleClass('prudio-window-open');
            if(!settings.buttonSelector) {
                $('#prudio-button').fadeIn();
            }
        });

        $(document).on('click', '#prudio-window span.mute', function() {
            muted = !muted;
            if(muted) {
                $('#prudio-window span.mute i').removeClass('icon-volume-high').addClass('icon-volume-off');
            } else {
                $('#prudio-window span.mute i').removeClass('icon-volume-off').addClass('icon-volume-high');
            }
        });

        $(document).on('dragover', '#prudio-window div.drop-zone, #prudio-window div.drop-overlay', function(event) {
            $.handleFilesDragOver(event);
            $('.drop-overlay').removeClass('hidden');
        });

        $(document).on('dragleave', '#prudio-window div.drop-overlay', function(event) {
            $('.drop-overlay').addClass('hidden');
        });

        $(document).on('drop', '#prudio-window div.drop-overlay', function(event) {
            $.handleFileSelect(event);
            $('.drop-overlay').addClass('hidden');
        });

        $(document).on('change', 'input[name=uploads]', function(event) {
            $.handleFormFileSelect($('input[name=uploads]')[0]);
            $('input[name=uploads]').val('');
        });

        $(document).on('click', '#prudio-window span.icon-attach', function(event) {
            $('input[name=uploads]').trigger('click');
        });

        $(document).on('click', (settings.buttonSelector || '#prudio-button'), function() {

            $('#prudio-window').toggleClass('prudio-window-open');

            if(!settings.buttonSelector) {
                $(this).fadeOut('fast');
            }

            if(open === false) {

                var domContent = [
                    '<nav class="prudio-window prudio-window-vertical prudio-window-right" id="prudio-window">',
                    '     <h3><span class="mute" title="Mute"><i class="icon-volume-high"></i></span>' + (settings.title || 'Support') + ' <span class="close" title="Close"><i class="icon-cancel"></i></span></h3>',
                    '     <div class="messages drop-zone">',
                    '         <div class="drop-overlay hidden"></div>',
                    '         <ul>',
                    '         </ul>',
                    '         <div class="reply-container">',
                    '            <div class="reply">',
                    '                <input type="file" name="uploads" class="hidden" multiple>',
                    '                <input type="text" name="message" placeholder="Just write..." autofocus="autofocus">',
                    '                <span class="icon-attach" title="Attach a file"></span>',
                    '            </div>',
                    '         </div>',
                    '     </div>',
                    '</nav>'
                    ].join('');

                $('body').append(domContent);

                $('#prudio-window').toggleClass('prudio-window-open');

                var hasSignature = $.getCookie('prudio-signature');

                if(hasSignature === null) {
                    $.checkUserInfo(settings);
                } else {
                    $.continueProgram(settings);
                }
            }

            open = true;
        });

    });
}




})(); // We call our anonymous function immediately
