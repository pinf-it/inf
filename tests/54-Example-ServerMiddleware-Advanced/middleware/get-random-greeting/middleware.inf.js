
'use strict';

exports.inf = async function (inf, alias) {

    const greetings = [
        'Hello World',
        'Good Morning',
        'Good Day',
        'Good Afternoon',
        'Good Evening'
    ];
    let lastGreetingIndex = 0;

    return {

        invoke: function (pointer, value) {

            if (pointer === 'getApp()') {
                
                return function (req, res, next) {

                    res.end(greetings[lastGreetingIndex]);

                    lastGreetingIndex += 1;
                    if (lastGreetingIndex > greetings.length - 1) {
                        lastGreetingIndex = 0;
                    }                    
                };
            }
        }
    };
}
