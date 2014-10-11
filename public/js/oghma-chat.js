(function() {

// Localize jQuery variable
var jQuery
var baseURL = "//localhost:8888";

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
        $.getCookie = function(cookie) {
            var dc = document.cookie;
            var prefix = cookie + "=";
            var begin = dc.indexOf("; " + prefix);

            if (begin == -1) {
                begin = dc.indexOf(prefix);
                if (begin != 0) {
                    return null;
                }
                begin += 2;
                var end = document.cookie.indexOf(";", begin);
                if (end == -1) {
                    end = dc.length;
                }
                    
                return unescape(dc.substring(begin + prefix.length, end));
            }
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

        $.loadCSS(baseURL + "/css/chat-styles.css");
        $.loadJS( baseURL + "/socket.io/socket.io.js");

        $.createButton();

        $('#oghma-button').click(function() {

            var settings = $.getSettings();

            console.log("Token: " + settings.token);

            var messages = [];

            var messageField = document.getElementById('messageField');
            var content = document.getElementById('conversation');
            var ENTER_KEY_CODE = 13;

            $.ajax({
                url: baseURL + "/chat/create",
                method: 'POST',
                data: {
                    token: settings.token
                },
                success: function(data) {

                    console.log(data);

                    var socket = io.connect("http:" + baseURL + '/chat');

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

                    // On message
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
