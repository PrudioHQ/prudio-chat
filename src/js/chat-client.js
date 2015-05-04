(function() {

    // Localize jQuery variable
    var jQuery;

    var baseURL   = 'https://chat.prud.io';
    var assetsURL = 'https://static.prud.io';
    var socketURL = '';
    var socket    = null;
    var online    = false;
    var muted     = false;
    var emoji     = window.emojiParser;
    var ENTER_KEY_CODE = 13;

    // https://github.com/iamcal/js-emoji/blob/master/emoji.js#L1201-L1248
    var emoticons = {
        ':simple_smile:':'smile',
        '<3':'heart',
        ':o)':'monkey_face',
        ':*':'kiss',
        ':-*':'kiss',
        '<\/3':'broken_heart',
        '=)':'smiley',
        '=-)':'smiley',
        'C:':'smile',
        'c:':'smile',
        ':D':'smile',
        ':-D':'smile',
        ':>':'laughing',
        ':->':'laughing',
        ';)':'wink',
        ';-)':'wink',
        ':)':'smile',
        '(:':'smile',
        ':-)':'smile',
        '8)':'sunglasses',
        ':|':'neutral_face',
        ':-|':'neutral_face',
        ':\\':'confused',
        ':-\\':'confused',
        ':\/':'confused',
        ':-\/':'confused',
        ':p':'stuck_out_tongue',
        ':-p':'stuck_out_tongue',
        ':P':'stuck_out_tongue',
        ':-P':'stuck_out_tongue',
        ':b':'stuck_out_tongue',
        ':-b':'stuck_out_tongue',
        ';p':'stuck_out_tongue_winking_eye',
        ';-p':'stuck_out_tongue_winking_eye',
        ';b':'stuck_out_tongue_winking_eye',
        ';-b':'stuck_out_tongue_winking_eye',
        ';P':'stuck_out_tongue_winking_eye',
        ';-P':'stuck_out_tongue_winking_eye',
        '):':'disappointed',
        ':(':'disappointed',
        ':-(':'disappointed',
        '>:(':'angry',
        '>:-(':'angry',
        ':\'(':'cry',
        'D:':'anguished',
        ':o':'open_mouth',
        ':-o':'open_mouth'
    };

    /******** Load jQuery if not present *********/
    if (window.jQuery === undefined || window.jQuery.fn.jquery.split('.').map(function(i) { return ('0' + i).slice(-2); }).join('.') <= '02.00.00') {
        var scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'text/javascript');
        scriptTag.setAttribute('src', '//cdn.jsdelivr.net/jquery/2.1.3/jquery.min.js');
        if (scriptTag.readyState) {
            scriptTag.onreadystatechange = function() { // For old versions of IE
                if (this.readyState === 'complete' || this.readyState === 'loaded') {
                    scriptLoadHandler();
                }
            };
        } else { // Other browsers
            scriptTag.onload = scriptLoadHandler;
        }
        // Try to find the head, otherwise default to the documentElement
        (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(scriptTag);
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
        jQuery.event.props.push('dataTransfer');

        jQuery(document).ready(function($) {
            $.urlParam = function(name, url) {
                var results = new RegExp('[?|&|#]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url);
                if (results === null) {
                    return;
                }
                return results[1] || 0;
            };

            $.loadCSS = function(href) {
                var cssLink = $('<link rel="stylesheet" type="text/css" href="' + href + '">');
                $('head').append(cssLink);
            };

            $.findJS = function() {
                var elems = document.getElementsByTagName('script');
                var re = /static\.prud\.io\/client/;

                for (var i = 0; i < elems.length; i++) {
                    if (elems[i].src.match(re)) {
                        return elems[i];
                    }
                }

                throw 'Could not find the script from Prudio.';
            };

            $.getSettings = function() {
                var el = $.findJS();
                var params = ['appid', 'name', 'email'];
                var settings = {};

                for (var i = 0; i < params.length; i++) {
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

            $.createButton = function(settings) {
                var button = $('<div id="prudio-button" class="reset-styles" style="display: none;' +
                (settings.buttonColor !== undefined ?  ' background-color: ' + settings.buttonColor + ';' : '') +
                (settings.borderColor !== undefined ?  ' border-color: ' + settings.borderColor + ';' : '') +
                    '" title="Chat with us"><i class="' + (settings.icon !== undefined ?  settings.icon : 'prd-icon-btn-help') + '"' +
                    ' style="' + (settings.iconColor !== undefined ?  'color: ' + settings.iconColor + ';' : '') + '">' +
                    '</i></div><div id="prudio-notification"></div>');

                $('body').append(button);
            };

            $.scrollChat = function(to) {
                $(to).stop().animate({
                    scrollTop: $(to).prop('scrollHeight')
                }, 'slow');
            };

            /**
            * Set cookie with name @var cookie with value @var value for @var days period.
            */
            $.setCookie = function(cookie, value, days) {
                days = days || 730; // 2 years

                var date = new Date();
                date.setTime(date.getTime() + (days * 86400000));

                // Set Cookie
                document.cookie = cookie + '=' + value + '; expires=' + date.toGMTString() + '; path=/';
            };

            /**
            * Get a cookie named @var cookie
            */
            $.getCookie = function(name) {
                var value = ' ' + document.cookie;
                var start = value.indexOf(' ' + name + '=');
                if (start === -1) {
                    value = null;
                } else {
                    start = value.indexOf('=', start) + 1;
                    var end = value.indexOf(';', start);
                    if (end === -1) {
                        end = value.length;
                    }
                    value = unescape(value.substring(start, end));
                }
                return value;
            };

            /**
            * Gets the UUID for this user. If doesn't exist, creates a new UUID.
            */
            /*
            $.getUUID = function() {
                var cookieName = 'prudio-uuid';
                if ($.getCookie(cookieName) === null) {
                    // Does not exists; Lets create a UUID for this user
                    $.getScript(assetsURL + "/js/uuid.js");
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
                    screenSize += ['', width, ' x ', height].join('');
                }

                //browser
                var nVer = navigator.appVersion;
                var nAgt = navigator.userAgent;
                var browser = navigator.appName;
                var version = ['', parseFloat(navigator.appVersion)].join('');
                var majorVersion = parseInt(navigator.appVersion, 10);
                var nameOffset;
                var verOffset;
                var ix;
                var url = document.URL;

                // Opera
                if ((verOffset = nAgt.indexOf('Opera')) !== -1) {
                    browser = 'Opera';
                    version = nAgt.substring(verOffset + 6);
                    if ((verOffset = nAgt.indexOf('Version')) !== -1) {
                        version = nAgt.substring(verOffset + 8);
                    }
                } else if ((verOffset = nAgt.indexOf('MSIE')) !== -1) {
                    // MSIE
                    browser = 'Microsoft Internet Explorer';
                    version = nAgt.substring(verOffset + 5);
                } else if ((verOffset = nAgt.indexOf('Chrome')) !== -1) {
                    // Chrome
                    browser = 'Chrome';
                    version = nAgt.substring(verOffset + 7);
                } else if ((verOffset = nAgt.indexOf('Safari')) !== -1) {
                    // Safari
                    browser = 'Safari';
                    version = nAgt.substring(verOffset + 7);
                    if ((verOffset = nAgt.indexOf('Version')) !== -1) {
                        version = nAgt.substring(verOffset + 8);
                    }
                } else if ((verOffset = nAgt.indexOf('Firefox')) !== -1) {
                    // Firefox
                    browser = 'Firefox';
                    version = nAgt.substring(verOffset + 8);
                } else if (nAgt.indexOf('Trident/') !== -1) {
                    // MSIE 11+
                    browser = 'Microsoft Internet Explorer';
                    version = nAgt.substring(nAgt.indexOf('rv:') + 3);
                } else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
                    // Other browsers
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

                majorVersion = parseInt(['', version].join(''), 10);
                if (isNaN(majorVersion)) {
                    version = ['', parseFloat(navigator.appVersion)].join('');
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
                $.titleAlert._settings = settings = $.extend({}, $.titleAlert.defaults, settings);

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

            $.titleAlert._focus = function() {
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
                        document.title = '.';
                        document.title = initialText;
                    }, 1000);
                }
            };
            $.titleAlert._blur = function() {
                $.titleAlert.hasFocus = false;
            };

            // bind focus and blur event handlers
            $(window).bind('focus', $.titleAlert._focus);
            $(window).bind('blur', $.titleAlert._blur);

            /**
            * END titleAlert
            */

            /*
            * Play Notification
            */
            $.playSound = function() {
                var filename = assetsURL + '/notification';

                if (!muted) {
                    $('#prudio-notification').html('<audio autoplay="autoplay"><source src="' + filename + '.mp3" type="audio/mpeg" /><source src="' + filename + '.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + filename + '.mp3" /></audio>');
                }
            };

            /*
            * Send browser notification
            */
            $.browserNotification = function(text) {
                var options = {
                    body: text,
                    icon: '/favicon.ico',
                    dir : 'ltr'
                };

                if (!('Notification' in window) || $.titleAlert.hasFocus) {
                    return;
                } else if (Notification.permission === 'granted') {
                    var notification = new Notification('New message', options);
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission(function(permission) {
                        if (!('permission' in Notification)) {
                            Notification.permission = permission;
                        }

                        if (permission === 'granted') {
                            var notification = new Notification('New message', options);
                        }
                    });
                }
            };

            /*
            * Check this app status
            */
            $.checkStatus = function(appid) {
                $.ajax({
                    url: baseURL + '/app/status',
                    method: 'POST',
                    data: {
                        appid: appid
                    },
                    error: function(xhr, ajaxOptions, thrownError) {
                        console.log('We got a problem checking the app status!', thrownError);
                        online = false;

                        if ($('#prudio-window').hasClass('prudio-window-open')) {
                            $('#prudio-window').toggleClass('prudio-window-open');
                        }

                        if (!settings.buttonSelector) {
                            $(prudioButtonSelector).fadeOut();
                        }
                    },
                    success: function(response) {
                        if (response.success !== 'undefined' && response.success) {
                            socketURL = response.socketURL;
                            online = response.success;

                            if (online) {

                                // Remove style="display:none" from #prudio-window
                                $('#prudio-window').removeAttr('style');

                                switch ($.getCookie('prudio-status')) {
                                    case 'open':
                                        $.continueProgram(settings);
                                        $('#prudio-window').toggleClass('prudio-window-open');
                                        break;

                                    case 'minimized':
                                        $.continueProgram(settings);
                                        if (!settings.buttonSelector) {
                                            $(prudioButtonSelector).fadeIn();
                                        }
                                        break;

                                    case 'closed':
                                        if (!settings.buttonSelector) {
                                            $(prudioButtonSelector).fadeIn();
                                        }
                                        break;

                                    default:
                                        if (!settings.buttonSelector) {
                                            $(prudioButtonSelector).fadeIn();
                                        }
                                        break;
                                }

                            } else {

                                if ($('#prudio-window').hasClass('prudio-window-open')) {
                                    $('#prudio-window').toggleClass('prudio-window-open');
                                }

                                if (!settings.buttonSelector) {
                                    $(prudioButtonSelector).fadeOut();
                                }
                            }
                        }
                    }
                });
            };

            /*
            * Ping for available people in Slack
            */
            $.pingAvailable = function(appid) {
                // Ping the app
                $.ajax({
                    url: socketURL + '/app/ping',
                    method: 'POST',
                    data: {
                        appid: appid
                    },
                    error: function(xhr, ajaxOptions, thrownError) {
                        console.log('We got a problem pinging the app!', thrownError);
                    },
                    success: function(response) {
                        if (response.success !== 'undefined' && response.success && response.onlineUsers !== 'undefined') {
                            if (response.onlineUsers <= 0) {
                                $('<li class="server announcement"></li>').text('Currently there are no users online to help you. Leave a message and we will get back to you ASAP! Sorry!').appendTo($('#prudio-window ul'));
                                $.scrollChat('#prudio-window div.messages');
                            }
                        }
                    }
                });
            };

            /*
            * Retrive chat history
            */
            $.retriveHistory = function(appid, channel, signature) {

                // Recover conversation
                $.ajax({
                    url: socketURL + '/chat/history',
                    method: 'POST',
                    data: {
                        appid:       appid,
                        channel:     channel,
                        signature:   signature
                    },
                    error: function(xhr, ajaxOptions, thrownError) {
                        //$('<li class="error"></li>').text("We got a problem retriving the history!").appendTo($('#prudio-window ul'));
                        console.log('We got a problem retriving the history!', thrownError);
                    },
                    success: function(data) {
                        if (data.success !== 'undefined' && data.success && data.messages !== 'undefined' && data.messages.length > 0) {
                            for (var i in data.messages) {
                                if (data.messages.hasOwnProperty(i)) {
                                    var message = data.messages[i];
                                    message.text = $.emojiMapper(message.text);
                                    message.text = $.linkParser(message.text);
                                    $('<li class="' + message.sender + '"></li>').html(emoji(message.text, assetsURL + '/emojis')).appendTo($('#prudio-window ul'));
                                }
                            }

                            $('<li class="server"></li>').text('Conversation history').appendTo($('#prudio-window ul'));

                            $.scrollChat('#prudio-window div.messages');
                        }
                    }
                });
            };

            $.continueProgram = function(settings) {
                var channel   = $.getCookie('prudio-channel');
                var signature = $.getCookie('prudio-signature');

                if (channel !== '' && signature !== '') {
                    $.retriveHistory(settings.appid, channel, signature);
                }

                $('#prudio-window div.reply input[name=message]').attr('type', 'text').attr('placeholder', 'Just write...').blur().focus();

                $.getScript(socketURL + '/socket.io/socket.io.js')
                    .done(function() {
                        $.openSocket(settings);
                    })
                    .fail(function() {
                        $('<li class="error"></li>').text('We got a problem connecting to the server!').appendTo($('#prudio-window ul'));
                    });
            };

            $.checkUserInfo = function(settings) {

                // No name or email
                if (typeof settings.name === 'undefined' || typeof settings.email === 'undefined') {

                    //Ask for name and email
                    if ($('#userInfoInput').length === 0) {

                        var userInfoInput = $('<div id="userInfoInput" class="user-info"><div id="prudio-empty-msg"></div></div>');
                        var userInfoForm  = $('<form id="userInfoForm"></form>');

                        userInfoForm.append('<label>Name:<br/></label><div class="reply"><input id="prudio-name-input" type="text"/></div>');
                        userInfoForm.append('<label>Email:<br/></label><div class="reply"><input id="prudio-email-input" type="text"/></div>');
                        userInfoForm.append('<div class="start-conversation"><input type="button" id="prudio-submit-name" value="Start Conversation"/></div>');

                        //Added it to The DOM
                        userInfoInput.append(userInfoForm);
                        $('.messages').append(userInfoInput);

                        // Check if all if is there
                        $('#prudio-submit-name').on('click', function() {
                            var name  = $('#prudio-name-input').val();
                            var email = $('#prudio-email-input').val();

                            if (name !== '' && email !== '') { //!isValid(email)) {
                                settings.name = name;
                                settings.email = email;
                                $('#userInfoInput').remove();
                                return $.continueProgram(settings);
                            } else {
                                $('#prudio-empty-msg').html('<span>Please fill the fields with valid name and email.</span>');
                            }
                        });
                    }
                } else {
                    return $.continueProgram(settings);
                }
            };

            $.emojiMapper = function(message) {
                message = ' ' + message + ' ';

                for (var emo in emoticons) {
                    message = message.replace(' ' + emo + ' ', ':' + emoticons[emo] + ':');
                }

                return message.trim();
            };

            // Check https://api.slack.com/docs/formatting#urls_and_escaping
            $.linkParser = function(message) {

                // <!everyone> becomes &lt;everyone&gt;
                message = message.replace(/\<\!([^\>]*)\>/g, '&lt;$1&gt;');

                // <@U1234|name> becomes name (or empty if there is no name)
                message = message.replace(/\<\@U([0-9A-Z]*)\|?(.*?)\>/g, '$2');

                // <#C1234|channel> becomes channel (or empty if there is no channel)
                message = message.replace(/\<\#C([0-9A-Z]*)\|?(.*?)\>/g, '$2');

                // <https://www.prud.io|Prud.io> becomes <a target="_blank" href="https://www.prud.io">Prud.io</a>
                message = message.replace(/\<([^\|\>]+)\|(\S+)?\>/g, '<a target="_blank" href="$1">$2</a>');

                // <https://www.prud.io> becomes <a target="_blank" href="https://www.prud.io">https://www.prud.io</a>
                message = message.replace(/\<([^\/][^\|\>\ ]+)\>/g, '<a target="_blank" href="$1">$1</a>');

                return message;
            };

            $.openSocket = function(settings) {
                var channel     = null;
                var channelName = null;
                var signature   = null;
                var userInfo    = $.getUserSystemInfo();
                var postURL     = socketURL + '/chat/create';

                // If it's minimized or open, override
                if ($.getCookie('prudio-status') === 'minimized' || $.getCookie('prudio-status') === 'open') {
                    channel     = $.getCookie('prudio-channel');
                    channelName = $.getCookie('prudio-channel-name');
                    signature   = $.getCookie('prudio-signature');
                    postURL     = socketURL + '/chat/continue';
                }

                $('<li class="server connecting"></li>').html('<i class="prd-icon-flash-outline"></i> Connecting to the server...').appendTo($('#prudio-window ul'));

                $.ajax({
                    url: postURL,
                    method: 'POST',
                    data: {
                        appid:       settings.appid,
                        channel:     channel,
                        channelName: channelName,
                        signature:   signature,
                        settings:    JSON.stringify(settings),
                        userInfo:    JSON.stringify(userInfo)
                    },
                    error: function(xhr, ajaxOptions, thrownError) {
                        $('<li class="error"></li>').text('We got a problem connecting to the server!').appendTo($('#prudio-window ul'));
                    },
                    success: function(data) {

                        // Save connection to cookies
                        $.setCookie('prudio-channel',      data.channel);
                        $.setCookie('prudio-channel-name', data.channelName);
                        $.setCookie('prudio-signature',    data.signature);
                        $.setCookie('prudio-status',       'open');

                        if (socket === null) {
                            socket = io.connect(socketURL + '/chat');
                        } else {
                            // Re-connect socket
                            socket.disconnect();
                            socket = io.connect(socketURL + '/chat');
                        }

                        // Send message from the chat
                        $('#prudio-window div.reply input[name=message]').bind('keypress', function(e) {
                            // if enter key
                            if (e.keyCode === ENTER_KEY_CODE && $(this).val() !== '') {
                                var message = $(this).val();

                                // Parse :) => :smile:
                                message = $.emojiMapper(message);

                                socket.emit('sendMessage', {
                                    message: message
                                });

                                $('<li class="self"></li>').html(emoji(message, assetsURL + '/emojis')).appendTo($('#prudio-window ul'));

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

                            // Ping for available users
                            $.pingAvailable(settings.appid);

                        });

                        // On Slack message
                        socket.on('message', function(data) {
                            if (data.sender === 'Other') {
                                var message = $.emojiMapper(data.message);
                                message = $.linkParser(message);

                                $('#prudio-window ul li.typing').remove();

                                $('<li class="other"></li>').html(emoji(message, assetsURL + '/emojis')).appendTo($('#prudio-window ul'));

                                $.scrollChat('#prudio-window div.messages');

                                $.titleAlert('New message', { stopOnMouseMove:true, stopOnFocus:true, requireBlur: true});

                                $.browserNotification(data.message);

                                $.playSound();
                            }
                        });

                        socket.on('disconnect', function() {
                            $('<li class="error"></li>').text('Server is now offline!').appendTo($('#prudio-window ul'));
                            $.scrollChat('#prudio-window div.messages');
                            $('#prudio-window div.reply input[name=message]').prop('disabled', true);
                        });

                        socket.on('serverMessage', function(data) {
                            $('<li class="server"></li>').text(data.message).appendTo($('#prudio-window ul'));
                            $.scrollChat('#prudio-window div.messages');
                            $('#prudio-window div.reply input[name=message]').prop('disabled', false);
                        });

                        socket.on('typingMessage', function() {
                            $('#prudio-window ul li.typing').remove();
                            $('<li class="typing"></li>').html('<i class="prd-icon-typing"></i> User is typing...').appendTo($('#prudio-window ul')).show().delay(7000).slideUp();
                            $.scrollChat('#prudio-window div.messages');
                        });
                    }
                });
            };

            $.uploadFiles = function(file) {

                // Create the FormData object to send the file as a form
                var data = new FormData();

                // Add the file to the formData
                data.append('file', file, file.name);

                // Perform the request
                $.ajax({
                    url: socketURL + '/app/file-upload?appid=' + settings.appid + '&channel=' + settings.joinedChannel,
                    type: 'POST',
                    data: data,
                    cache: false,
                    dataType: 'json',
                    processData: false, // Don't process the files
                    contentType: false // Set content type to false as jQuery will tell the server its a query string request
                })
                .done(function(data, textStatus, jqXHR) {
                    if (typeof data.error === 'undefined') {
                        $('<li class="server"></li>').text('Uploading file').appendTo($('#prudio-window ul'));
                    } else {
                        $('<li class="error"></li>').text('Error uploading the file!').appendTo($('#prudio-window ul'));
                    }
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    $('<li class="error"></li>').text('Error uploading the file! Try again!').appendTo($('#prudio-window ul'));
                });
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

            $.loadCSS(assetsURL + '/client.css');

            var settings  = $.getSettings();

            if (!settings.buttonSelector) {
                $.createButton(settings);
            }

            var prudioButtonSelector = settings.buttonSelector || '#prudio-button';

            $(document).on('click', '#prudio-window .status', function() {

                $('#prudio-window').toggleClass('prudio-window-open');

                $.setCookie('prudio-status', $(this).data('status'));

                // If close, remove all the cookie info and disconnect.
                if ($(this).data('status') === 'closed') {
                    $.setCookie('prudio-channel',      '');
                    $.setCookie('prudio-channel-name', '');
                    $.setCookie('prudio-signature',    '');

                    // Disconnect the socket (we can close without the token been opened)
                    if (socket) {
                        socket.disconnect();
                    }

                    // Remove all messages from the window
                    $('#prudio-window ul li').remove();

                }

                if (!settings.buttonSelector) {
                    $('#prudio-button').fadeIn();
                }
            });

            $(document).on('click', '#prudio-window .mute', function() {
                muted = !muted;
                $('#prudio-window span.mute i').toggleClass('prd-icon-volume-high').toggleClass('prd-icon-volume-off');
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

            $(document).on('click', '#prudio-window span.prd-icon-attach', function(event) {
                $('input[name=uploads]').trigger('click');
            });

            $(window).on('offline', function() {
                $('<li class="error offline"></li>').text('Looks like internet is gone!').appendTo($('#prudio-window ul'));
                $('#prudio-window div.reply input[name=message]').prop('disabled', true);
            });

            $(window).on('online', function() {
                $('#prudio-window ul li.offline').remove();
                $('<li class="server"></li>').text('We are back!').appendTo($('#prudio-window ul')).show().delay(5000).slideUp();
                $('#prudio-window div.reply input[name=message]').prop('disabled', false);
            });

            $(document).ready(function() {
                $.checkStatus(settings.appid);
            });

            $(document).on('click', prudioButtonSelector, function() {

                if (!online) {
                    return;
                }

                if (!settings.buttonSelector) {
                    $(this).fadeOut('fast');
                }

                // If there is no signature then is a new request, ask for user info.
                if (null === $.getCookie('prudio-signature') || $.getCookie('prudio-signature') === '') {
                    $.checkUserInfo(settings);
                } else if ($.getCookie('prudio-status') !== 'minimized') {
                    // If the window was minimized then just toggle it opened.
                    $.continueProgram(settings);
                }

                $('#prudio-window').toggleClass('prudio-window-open');
            });

            // Add prudio chat window to the DOM
            $('body').append(
                [
                    '<nav style="display:none" class="prudio-window prudio-window-vertical prudio-window-right reset-styles" id="prudio-window">',
                    '     <h3>',
                    '       <span class="mute" title="Mute"><i class="prd-icon-volume-high"></i></span>',
                            (settings.title || 'Support'),
                    '       <span class="status close" title="Close conversation" data-status="closed"><i class="prd-icon-cancel"></i></span>',
                    '       <span class="status minimize" title="Minimize conversation" data-status="minimized"><i class="prd-icon-minimize"></i></span>',
                    '     </h3>',
                    '     <div class="messages drop-zone">',
                    '         <div class="drop-overlay hidden"></div>',
                    '         <ul>',
                    '         </ul>',
                    '         <div class="reply-container">',
                    '            <div class="reply">',
                    '                <input type="file" name="uploads" class="hidden" multiple>',
                    '                <input type="text" name="message" placeholder="Just write..." autofocus="autofocus">',
                    '                <span class="prd-icon-attach" title="Attach a file"></span>',
                    '            </div>',
                    '            <div class="powered-by-prudio">',
                    '                <p><em><a target="_blank" href="http://prud.io">Powered by <i class="prd-icon-btn-prudio"></i> Prud.io</a></em></p>',
                    '            </div>',
                    '         </div>',
                    '     </div>',
                    '</nav>'
                ].join('')
            );
        });
    }
})(); // We call our anonymous function immediately
