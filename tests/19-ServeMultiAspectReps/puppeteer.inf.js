
'use strict';

exports.inf = async function (inf) {

    const PUPPETEER = require("puppeteer");

    let serverApi = null;

    return {

        invoke: async function (pointer, value) {

            if (pointer === 'server') {

                serverApi = (await value.value()).value;

            } else
            if (pointer === 'run') {

                const browser = await PUPPETEER.launch({
                    headless: (!process.env.VERBOSE)
                });

                const page = await browser.newPage();

                let exports = {};
                eval(value.toString());
                await exports.run(inf, page, serverApi.baseUrl);

                await browser.close();
            }
        }
    };
}
