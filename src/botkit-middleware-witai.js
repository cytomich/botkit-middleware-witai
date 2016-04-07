var wit = require('node-wit');

module.exports = function(config) {

    if (!config || !config.token) {
        throw new Error('No wit.ai API token specified');
    }

    if (!config.minimum_confidence) {
        config.minimum_confidence = 0.5;
    }

    var middleware = {};

    middleware.receive = function(bot, message, next) {
        /*
         * hack, filter messages by sender
         * solves the problem when send messages from bot into wit
         * TODO: find a way to do it in common style
         * TODO: find a way to add filter for strip text from slack-style mentions, text preprocessing, etc
         * @vponomarev
         */
        if (message.text && (message.user != bot.identity.id)) {
            wit.captureTextIntent(config.token, message.text, function(err, res) {
                if (err) {
                    next(err);
                } else {
                    // sort in descending order of confidence so the most likely match is first.
                    console.log(JSON.stringify(res));
                    message.intents = res.outcomes.sort(function(a,b) {
                        return b.confidence - a.confidence;
                    });
                    next();
                }
            });
        } else {
            next();
        }

    };

    middleware.hears = function(tests, message) {

        if (message.intents) {
            for (var i = 0; i < message.intents.length; i++) {
                for (var t = 0; t < tests.length; t++) {
                    if (message.intents[i].intent == tests[t] &&
                        message.intents[i].confidence >= config.minimum_confidence) {
                        return true;
                    }
                }
            }
        }

        return false;
    };


    return middleware;

};
