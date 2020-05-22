"use strict";

const PaperWS = require("./ws-core");
const util = require('util');
const sleep = util.promisify(setTimeout);

const fs = require('fs');
const rq = require('request');
const request = util.promisify(rq);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const Chance = require('chance');
const chance = new Chance();


(async () => {
    let config = {
        autoBuyImprovements: false,
        autoBuyBonuses: false,
        transferStealProfit: true,
        transferUserId: 69669411,
        role: 'storage',
        isStorageMiddle: true,
        keepInfected: true,
        debug: false,
        proxy: false,
        stealOffset: 0,
    };

    // Parse arguments
    for (let argn = 2; argn < process.argv.length; argn += 2) {
        let argument = process.argv[argn];
        let value = process.argv[argn + 1];

        if (value === 'false' || value === 'true') {
            value = value === 'true';
        }

        let parsedInt = parseInt(value);
        if (parsedInt.toString().length === value.length) {
            value = parsedInt;
        }

        config[argument.replace('-', '')] = value;

        if (config.stealers) {
            config.stealers = config.stealers.split(',');
        }
    }

    console.log(config);

    let paperCore = new PaperWS();

    paperCore.run(config.wss, async _ => {
        console.log(`Аккаунт ${config.id} с ролью ${config.role} присоеденился к игре и начал в работу.`);
    }, { debug: config.debug, proxy: config.proxy });


    let game = {
        user: {},
        bonuses: {},
        improvements: {},
        items: {},
        disinfectants: {},
        transfers: {},
    };

    let improvementsPlan = {
        '1': 25,
        '2': 22,
        '3': 19,
        '4': 18,
        '5': 17,
        '6': 17,
        '7': 15,
        '8': 11,
        '9': 10,
    };
    let improvementsPlanSchedule;

    let bonusesPlan = {
        '1': 1,
        '2': 1,
        '3': 1,
        '4': 1,
        '5': 1,
        '6': 1,
        '7': 1,
        '8': 1,
        '9': 1,
        '10': 1,
        '11': 1,
    };
    let bonusesSchedule;

    let ratingsSchedule;

    let stealAvailable = [];
    let stealSchedule;

    let infectionList = [];
    let infectionSchedule;
    let haveTransferError = false;

    let scrollSchedule;

    paperCore.onRawData(async (data) => {
        const command = data[0];
        const response = data[1];

        switch (command) {
            case "ping":
                await paperCore.sendPong();
                break;

            case "init":
                game.user = response.user;
                game.bonuses = response.bonuses;
                game.improvements = response.improvements;

                setTimeout(async () => {
                    if (!ratingsSchedule && ['stealer', 'infected'].includes(config.role)) {
                        await createRatingsSchedule()
                    }
                    setTimeout(async () => {
                        if (config.role === "stealer" && !stealSchedule) {
                            await createStealSchedule()
                        }
                        if (config.role === "infected" && !infectionSchedule) {
                            await createInfectionSchedule()
                        }
                        if (config.role === "miner" && !scrollSchedule) {
                            await createScrollSchedule()
                        }
                        if (config.autoBuyImprovements && !improvementsPlanSchedule) {
                            await createImprovementsSchedule()
                        }
                        if (config.autoBuyBonuses && !bonusesSchedule) {
                            await createBonusesSchedule()
                        }
                    }, 5000);
                    // if (!scrollSchedule) {
                    //     await createScrollSchedule()
                    // }
                }, 1000);

                if (!game.user.is_onboard_completed) {
                    await paperCore.sendRawPacket(["onboard:complete"]);
                    await paperCore.sendRawPacket(["achievements:trigger", { type: "story_share" }]);
                    await paperCore.sendRawPacket(["achievements:trigger", { type: "wall_share" }]);
                }

                if (game.user.offline_died) {
                    await paperCore.sendRawPacket(["event:trigger", { type: "offline_died_reset" }]);
                }

                break;

            case "init:extended":
                game.items = response.items;
                game.disinfectants = response.bonuses;
                game.transfers = response.improvements;
                game.achievements = response.achievements;
                break;

            case "user:sync":
                game.user = response;

                if (game.user.can_be_infected && !config.keepInfected) {
                    let item = game.items.find(i => i.type_id === 1);
                    if (item) {
                        if (item.current_count === 0 && game.user.balance >= item.cost) {
                            paperCore.sendRawPacket(["items:buy", { type_id: 1 }]);
                            await sleep(3000);
                        }
                        item = game.items.find(i => i.type_id === 1);
                        if (item.current_count > 0) {
                            paperCore.sendRawPacket(["items:use", { type_id: 1 }]);
                            await sleep(3000);
                        }
                    }
                }

                if (game.user.is_infected && config.role !== "infected" && !config.keepInfected) {
                    let item = game.items.find(i => i.type_id === 2);
                    if (item) {
                        if (item.current_count === 0 && game.user.balance >= item.cost) {
                            paperCore.sendRawPacket(["items:buy", { type_id: 2 }]);
                            await sleep(3000);
                        }
                        item = game.items.find(i => i.type_id === 2);
                        if (item.current_count > 0) {
                            paperCore.sendRawPacket(["items:use", { type_id: 2 }]);
                            await sleep(3000);
                        }
                    }
                }

                let transferAmount = (game.user.balance - 30000000);
                if (config.isStorageMiddle && config.role === "storage" && transferAmount > 0) {
                    console.log(`Sending ${game.user.balance} balance to ${config.transferUserId}`);
                    paperCore.sendRawPacket(["transfer", [
                        config.transferUserId,
                        transferAmount,
                        'balance',
                        0,
                    ]]);
                }
                break;

            case "user:update":
                let attribute = response[0];
                let operation = response[1];
                let value = response[2];
                switch (attribute) {
                    case "balance":
                        if (operation === "incr") {
                            game.user.balance += value;
                        } else if (operation === "decr") {
                            game.user.balance -= value;
                        }
                        break;
                    case "improvements_sum":
                        if (operation === "incr") {
                            game.user.improvements_sum += value;
                        } else if (operation === "decr") {
                            game.user.improvements_sum -= value;
                        }
                        break;
                }
                break;

            case "bonuses:sync":
                game.bonuses = response;
                break;

            case "improvements:sync":
                game.improvements = response;
                break;

            case "items:sync":
                game.items = response;
                break;

            case "disinfectants:sync":
                game.disinfectants = response;
                break;

            case "achievements:sync":
                game.achievements = response;
                break;

            case "transfers:sync":
                game.transfers = response;
                break;

            case "ratings:update":
                if (config.role === "infected") {
                    if ((game.user.last_infection_date === 0 && !game.user.is_infected) && config.stealers && config.stealers.length >= 1) {
                        infectionList = config.stealers;
                    } else {
                        infectionList = [
                            ...new Set([
                                ...infectionList,
                                ...response.ratings.users.items
                                    .sort((a, b) => a.balance < b.balance ? 1 : -1)
                                    .map(user => (user.user_id))
                            ])
                        ];
                    }

                    console.log(`Find ${infectionList.length} victims`);
                }


                if (config.role === "stealer") {
                    // console.log("Received new ratings!");
                    stealAvailable = [
                        ...new Set([
                            ...stealAvailable,
                            ...response.ratings.users.items
                                .filter(user => (user.is_steal_available))
                                .sort((a, b) => a.balance < b.balance ? 1 : -1)
                                .map(user => (user.user_id))
                        ])
                    ];
                    if (stealAvailable.length > 0) {
                        if (config.stealOffset && config.stealOffset > 0 && (stealAvailable.length - config.stealOffset) > 0) {
                            stealAvailable = stealAvailable.concat(stealAvailable.splice(0, stealAvailable.length - config.stealOffset));
                        }
                        console.log(`Can steal paper from ${stealAvailable.length} users`);
                    }
                }
                break;

            case "transfer:new":
                if (response.transfer.type === 'steal') {
                    clearInterval(stealSchedule);
                    console.log(`Delayed steal schedule...`);
                    setTimeout(async () => {
                        console.log(`Restart steal schedule.`);
                        stealAvailable = [];
                        await createStealSchedule()
                    }, 39000);

                    if (config.transferStealProfit && config.transferUserId !== game.user.user_id) {
                        await paperCore.sendRawPacket(["transfer", [
                            config.transferUserId,
                            response.transfer.amount,
                            'balance',
                            0,
                        ]]);
                    }

                }
                break;

            case "transfer:error":
                haveTransferError = true;
                break;

            case "notify":
            case "toast":
                if (!config.debug) {
                    console.log(JSON.stringify(response));
                }
                if (response.category && response.category === "error") {
                    if (response.message.toLowerCase().includes("подождите")) {
                        clearInterval(stealSchedule);
                        console.log(`Delayed steal schedule...`);
                        setTimeout(async () => {
                            console.log(`Restart steal schedule.`);
                            stealAvailable = [];
                            await createStealSchedule()
                        }, 41000);
                    }
                }
                break;

            case "error":
                console.log(JSON.stringify(response));
                process.exit(1);
                break;

            case "reconnect":
                process.exit(7);
                break;
        }
    });


    async function createStealSchedule(time = 3000) {
        stealSchedule = setInterval(() => {
            stealFromAvailable()
        }, time);
    }

    async function createInfectionSchedule(time = 2000) {
        setInterval(async () => {
            if (!infectionSchedule) {
                infectionSchedule = true;
                await infectRatedUsers().then(async () => {
                    infectionSchedule = null;
                });
            }
        }, time);
    }

    async function createRatingsSchedule(time = 3100) {
        ratingsSchedule = setInterval(async () => {
            await paperCore.sendRawPacket(["ratings:update"]);
        }, time);
    }

    async function createScrollSchedule(time = 3100) {
        scrollSchedule = true;
        (function ontimeout() {
            if (scrollSchedule) {
                paperCore.sendScroll();
                let delay = chance.integer({ min: time, max: time + (time * 0.10) });
                setTimeout(ontimeout, delay);
            }
        })();
    }

    async function infectRatedUsers() {
        let victimList = [];
        let transf = chance.integer({ min: 2, max: 1999 });
        if (game.user.balance < transf) return false;
        for (let [index, victim] of infectionList.entries()) {
            paperCore.sendRawPacket(["transfer", [victim, transf, 'balance', 0,]]);
            let delay = chance.integer({ min: 3100, max: 3500 });
            if (haveTransferError) {
                delay += 5000;
                haveTransferError = false;
            }
            await sleep(delay);
            victimList.push(victim);
            console.log(`Victim ${index}/${infectionList.length}`)
        }

        infectionList = infectionList.filter(user => (!victimList.includes(user)));
        return true;
    }

    async function stealFromAvailable() {
        if (stealAvailable.length < 1) return;
        let user_id = stealAvailable.shift();
        console.log(`Try to steal from ${user_id}`);
        // await paperCore.sendRawPacket(["profile:info", { user_id }]);
        await paperCore.sendRawPacket(["steal", { user_id }]);
    }

    async function createImprovementsSchedule(time = 45000) {
        improvementsPlanSchedule = setInterval(async () => {
            let need_to_buy = game.improvements.filter(impr => (improvementsPlan[impr.type_id] > impr.current_count));
            if (need_to_buy.length === 0) {
                clearInterval(improvementsPlanSchedule);
                console.log(`Improvements plan completed, stopping schedule.`);
            } else {
                need_to_buy.sort((a, b) => (a.speed / a.current_cost) < (b.speed / b.current_cost) ? 1 : -1);
                let buy = need_to_buy[0];
                console.log(`You have ${buy.current_count}/${improvementsPlan[buy.type_id]} for ${buy.name}.`);
                if (game.user.balance >= buy.current_cost) {
                    await paperCore.sendRawPacket(["improvements:buy", { type_id: buy.type_id }]);
                    console.log(`Successfully buy the ${buy.name}.`);
                } else {
                    console.log(`You have not enough money ${game.user.balance} but needed: ${buy.current_cost}.`);
                }
            }
        }, time);
    }


    async function createBonusesSchedule(time = 30000) {
        bonusesSchedule = setInterval(async () => {
            let need_to_buy = game.bonuses.filter(bonus => (bonusesPlan[bonus.type_id] > bonus.current_count));
            if (need_to_buy.length === 0) {
                clearInterval(bonusesSchedule);
                console.log(`Bonuses plan completed, stopping schedule.`);
            } else {
                need_to_buy.sort((a, b) => a.speed > b.speed ? 1 : -1);
                let buy = need_to_buy[0];
                console.log(`You have ${buy.current_count}/${bonusesPlan[buy.type_id]} for ${buy.name}.`);
                if (game.user.balance >= buy.cost) {
                    await paperCore.sendRawPacket(["bonuses:buy", { type_id: buy.type_id }]);
                    console.log(`Successfully buy the ${buy.name}.`);
                } else {
                    console.log(`You have not enough money ${game.user.balance} but needed: ${buy.cost}.`);
                }
            }
        }, time);
    }
})();

module.exports = {
    PaperWS: PaperWS
};
