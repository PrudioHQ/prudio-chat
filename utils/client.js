module.exports = function(app, App) {

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

    app.get('/', function(req, res, next) {
        return res.status(200).json({ success: true, message: "Welcome, nothing here" });
    });

    /*
    * Check the status before showing the icon
    */
    app.post('/app/status', isAuthorized, function(req, res, next) {
        var appid = req.param('appid');
        App.findOne({ appId: appid, active: true }, function(err, application) {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Error" });
            }

            return res.status(200).json({ success: true, active: true, socketURL: application.socketURL });
        });
    });

};
