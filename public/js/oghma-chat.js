(function() {

// Localize jQuery variable
var jQuery

var baseURL = "http://oghma.herokuapp.com"; 

if(window.location.hostname == "localhost")
    baseURL = "http://localhost:8888";

/******** Load jQuery if not present *********/
if (window.jQuery === undefined || window.jQuery.fn.jquery !== '2.1.1') {
    var script_tag = document.createElement('script');
    script_tag.setAttribute("type","text/javascript");
    script_tag.setAttribute("src",
        "//code.jquery.com/jquery-2.1.1.min.js");
    if (script_tag.readyState) {
      script_tag.onreadystatechange = function () { // For old versions of IE
          if (this.readyState == 'complete' || this.readyState == 'loaded') {
              scriptLoadHandler();
          }
      };
    } else { // Other browsers
      script_tag.onload = scriptLoadHandler;
    }
    // Try to find the head, otherwise default to the documentElement
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
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
    jQuery(document).ready(function($)
    {
        $.urlParam = function(name, url) {
            var results = new RegExp('[?|&|#]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url);
            return results[1] || 0;
        }

        $.loadCSS = function(href) {
            var cssLink = $("<link rel='stylesheet' type='text/css' href='"+href+"'>");
            $("head").append(cssLink);
        }

        $.findJS = function() {
            var elems = document.getElementsByTagName('script');
            var re = /.*oghma-chat\.js/;

            for(var i = 0; i < elems.length; i++) {
                if(elems[i].src.match(re))
                    return elems[i];
            }

            throw "Could not find the script from Oghma.";
        }

        $.getSettings = function() {
            var el = $.findJS();
            var params = ['token'];
            var settings = new Object();

            for(var i = 0; i < params.length; i++) {
                var p = params[i];
                settings[p] = $.urlParam(p, el.src);
            }

            if (typeof window._LBSettings != 'undefined') {
                for (var attrname in window._LBSettings) {
                    settings[attrname] = window._LBSettings[attrname];
                }
            }

            return settings;
        }

        $.createButton = function() {
            var button = $('<div id="oghma-button" title="Chat with us"></div>');
            $("body").append(button);
        }

        $.loadJS = function(href) {
            var jsLink = $("<script src='" + href + "'></script>");
            $("head").append(jsLink);
        }

        $.scrollChat = function(to) {
            $(to).animate({
                scrollTop: $(to).height()
            }, 'slow');
        }

        /**
        * Set cookie with name @var cookie with value @var value for @var days period.
        */
        $.setCookie = function(cookie, value, days) {
            days = days || 730; // 2 years
           
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));

            // Set Cookie
            document.cookie = cookie + "=" + value + "; expires=" + date.toGMTString() + "; path=/";
        }

        /**
        * Get a cookie named @var cookie
        */
        $.getCookie = function(name) {
            var value = " " + document.cookie;
            var start = value.indexOf(" " + name + "=");
            if (start == -1) {
                value = null;
            }
            else {
                start = value.indexOf("=", start) + 1;
                var end = value.indexOf(";", start);
                if (end == -1) {
                    end = value.length;
                }
                value = unescape(value.substring(start,end));
            }
            return value;
        }

        /**
        * Gets the UUID for this user. If doesn't exist, creates a new UUID.
        */

        $.getUUID = function() {
            var cookieName = "oghma-uuid";
            if($.getCookie(cookieName) === null) {
                // Does not exists; Lets create a UUID for this user
                $.loadJS(baseURL + "/js/uuid.js");
                var cuuid = uuid.v4();
                $.setCookie(cookieName, cuuid);
                
                return cuuid;
            }
            return $.getCookie(cookieName);            
        }

        $.getUserSystemInfo = function() {
            /**
            * JavaScript Client Detection
            * (C) viazenetti GmbH (Christian Ludwig)
            */
            
            var unknown = '-';

            // screen
            var screenSize = '';
            if (screen.width) {
                width = (screen.width) ? screen.width : '';
                height = (screen.height) ? screen.height : '';
                screenSize += '' + width + " x " + height;
            }

            //browser
            var nVer = navigator.appVersion;
            var nAgt = navigator.userAgent;
            var browser = navigator.appName;
            var version = '' + parseFloat(navigator.appVersion);
            var majorVersion = parseInt(navigator.appVersion, 10);
            var nameOffset, verOffset, ix;

            // Opera
            if ((verOffset = nAgt.indexOf('Opera')) != -1) {
                browser = 'Opera';
                version = nAgt.substring(verOffset + 6);
                if ((verOffset = nAgt.indexOf('Version')) != -1) {
                    version = nAgt.substring(verOffset + 8);
                }
            }
            // MSIE
            else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
                browser = 'Microsoft Internet Explorer';
                version = nAgt.substring(verOffset + 5);
            }
            // Chrome
            else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
                browser = 'Chrome';
                version = nAgt.substring(verOffset + 7);
            }
            // Safari
            else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
                browser = 'Safari';
                version = nAgt.substring(verOffset + 7);
                if ((verOffset = nAgt.indexOf('Version')) != -1) {
                    version = nAgt.substring(verOffset + 8);
                }
            }
            // Firefox
            else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
                browser = 'Firefox';
                version = nAgt.substring(verOffset + 8);
            }
            // MSIE 11+
            else if (nAgt.indexOf('Trident/') != -1) {
                browser = 'Microsoft Internet Explorer';
                version = nAgt.substring(nAgt.indexOf('rv:') + 3);
            }
            // Other browsers
            else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
                browser = nAgt.substring(nameOffset, verOffset);
                version = nAgt.substring(verOffset + 1);
                if (browser.toLowerCase() == browser.toUpperCase()) {
                    browser = navigator.appName;
                }
            }
            // trim the version string
            if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
            if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
            if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

            majorVersion = parseInt('' + version, 10);
            if (isNaN(majorVersion)) {
                version = '' + parseFloat(navigator.appVersion);
                majorVersion = parseInt(navigator.appVersion, 10);
            }

            // mobile version
            var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

            // cookie
            var cookieEnabled = (navigator.cookieEnabled) ? true : false;

            if (typeof navigator.cookieEnabled == 'undefined' && !cookieEnabled) {
                document.cookie = 'testcookie';
                cookieEnabled = (document.cookie.indexOf('testcookie') != -1) ? true : false;
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
                var cs = clientStrings[id];
                if (cs.r.test(nAgt)) {
                    os = cs.s;
                    break;
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
                osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                break;
            }

            var info = {
                screen: screenSize,
                browser: browser,
                browserVersion: version,
                mobile: mobile,
                os: os,
                osVersion: osVersion,
                cookies: cookieEnabled,
            };
            
            return info;
        }

        $.loadCSS(baseURL + "/css/chat-styles.css");
        $.loadJS( baseURL + "/socket.io/socket.io.js");

        $.createButton();

        $('#oghma-button').click(function() {

            var settings = $.getSettings();

            var messages = [];

            var messageField = document.getElementById('messageField');
            var content = document.getElementById('conversation');
            var ENTER_KEY_CODE = 13;

            // If they exist.
            var channel   = $.getCookie('oghma-channel');
            var signature = $.getCookie('oghma-signature');
            var userInfo  = $.getUserSystemInfo();

            $.ajax({
                url: baseURL + "/chat/create",
                method: 'POST',
                data: {
                    token:     settings.token,
                    channel:   channel,
                    signature: signature,
                    userInfo:  userInfo
                },
                success: function(data) {

                    console.log(data);

                    // Save connection to cookies
                    $.setCookie('oghma-channel',   data.channel);
                    $.setCookie('oghma-signature', data.signature);

                    var socket = io.connect(baseURL + '/chat');

                    var domContent = [
                        '<nav class="cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right" id="cbp-spmenu-s2">',
                        '       <h3>Chat</h3>',
                        '       <ul></ul>',
                        '       <input type="text" name="message">',
                        '   </nav>',
                        ].join('');

                    $('body').append(domContent);

                    $.scrollChat('#cbp-spmenu-s2 ul');

                    $('#cbp-spmenu-s2').toggleClass('cbp-spmenu-open' );

                    $('#cbp-spmenu-s2 input').bind('keypress', function(e){
                        // if enter key
                        if (e.keyCode == ENTER_KEY_CODE && $(this).val() != "") {
                            var message = $(this).val();
                            
                            socket.emit('noncryptSend', {
                                message: message,
                            });

                            console.log("SEND: " + message);
                            $('#cbp-spmenu-s2 ul').append('<li class="self">' + message + '</li>');

                            $.scrollChat('#cbp-spmenu-s2 ul');

                            $(this).val(''); // clear message field after sending
                        }
                    });

                    socket.on('connect', function(){
                        console.log("Connected to " + data.channel);
                        socket.emit('joinRoom', settings.token, data.channel, data.signature);
                    });

                    // On Slack message
                    socket.on('noncryptMessage', function (data) {
                        if(data.sender == "Other") {
                            $('#cbp-spmenu-s2 ul').append('<li class="other">' + data.message + '</li>');
                            $.scrollChat('#cbp-spmenu-s2 ul');
                        }
                    });

                    socket.on('serverMessage', function (data) {
                        $('#cbp-spmenu-s2 ul').append('<li><i>Server: ' + data.message + '</i></li>');
                        $.scrollChat('#cbp-spmenu-s2 ul');
                    });
                }
            });

            // Get Channel from LB API with token
            // If no users online (not possible right now in Slack) show form for e-mail message.
            // Else create chat window and connect socket

        });


    });
}

})(); // We call our anonymous function immediately
