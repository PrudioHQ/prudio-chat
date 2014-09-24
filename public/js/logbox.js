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
            var re = /.*logbox\.js/;

            for(var i = 0; i < elems.length; i++) {
                if(elems[i].src.match(re))
                    return elems[i];
            }

            throw "Could not find the script from logbox.";
        }

        $.getSettings = function() {
            var el = $.findJS();
            var params = ['appid', 'client'];
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
            var button = $('<div id="_lb-container" title="Chat with us"></div>');
            $("body").append(button);
        }

        $.loadJS = function(href) {
            var jsLink = $("<script src='"+href+"'></script>");
            $("head").append(jsLink);
        }


        var settings = $.getSettings();
        console.log(settings);

        $.loadCSS(baseURL + "/css/lb-embeed.css");
        $.loadJS( baseURL + "/socket.io/socket.io.js");

        $.createButton();

        $('#_lb-container').css('bottom', '60px');

        $('#_lb-container').click(function() {


            var messages = [];

            var messageField = document.getElementById('messageField');
            var content = document.getElementById('conversation');
            var ENTER_KEY_CODE = 13;

            var socket = io.connect("http:" + baseURL + '/chat');

            var domContent = [
              '<div id="_lb-chatbox">',
              '    <div id="conversation">',
              '    </div>',
              '    <div class="converse-chat-input">',
              '        <input type="text" name="chat_text" placeholder="Type here and hit <enter> to chat">',
              '    </div>',
              '    <div id="converse-status"></div>',
              '</div>',
              ].join('');

            $('body').append(domContent);

            $("#_lb-chatbox input").bind('keypress', function(e){
                // if enter key
                if (e.keyCode == ENTER_KEY_CODE){
                    var message = $(this).val();
                    socket.emit('noncryptSend', {
                        message: message
                    });

                    console.log("SEND: " + message);

                    $(this).val(''); // clear message field after sending
                }
            });

            socket.on('connect', function(){
                console.log("connected!");
                socket.emit('joinRoom', "sp-6");
            });


            // Get Channel from LB API with token
            // If no users online (not possible right now in Slack) show form for e-mail message.
            // Else create chat window and connect socket

        });


    });
}

})(); // We call our anonymous function immediately
