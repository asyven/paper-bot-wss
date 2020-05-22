const fork = require('child_process').fork;
let config;
try {
    config = require("./config");
} catch (error) {
    console.error("config", error)
}

let CLUSTER = [];

function getArgumentsFromConfig(cfg) {
    if (!cfg.wss) return null;

    let argv = [];

    Object.entries(cfg).map((set, index) => {
        argv.push(`-${set[0]}`, set[1]);
    });

    if (cfg.role === 'infected') {
        argv.push(`-stealers`, config.accounts.filter(account => account.role === 'stealer').map(i => (i.id)).join(','));
    }
    if (cfg.role === 'stealer') {
        let indexOffset = config.accounts.map(i => (i.id)).indexOf(cfg.id);
        argv.push(`-stealOffset`, indexOffset);
    }

    return argv
};

let con = _ => console.log(_.substring(0, _.length - 1).toString());

let down = (n, i) => {
    CLUSTER.splice(CLUSTER.findIndex(v => n === v), 1);
    console.log(`[x][${i}] Отключен от кластера. Работает ${CLUSTER.length} из ${config.accounts.length}`)
};

let reload = (oldNode, params) => {
    let i = CLUSTER.findIndex(node => oldNode === node);
    oldNode.kill();
    CLUSTER.push(launchNode(i + 1, params));
    console.log(`[^][${i + 1}] Нода перезапущена.`)
};


function run() {
    if (config != null && config.accounts !== undefined && Array.isArray(config.accounts)) {
        config.accounts = config.accounts.filter(v => v != null && v !== "" && typeof v == "object");
        config.accounts.forEach((config, i) => {
            let params = getArgumentsFromConfig(config);
            if (params != null) {
                setTimeout(() => {
                    CLUSTER.push(launchNode(i + 1, params));
                }, 100 * i);
            } else console.log("Не найден Токен или URL для входа")
        });
        console.log(`Запущено ${CLUSTER.length} из ${config.accounts.length}`)
    } else {
        console.log(`Ошибка запуска кластера`)
    }
}

run();

function launchNode(localId, params) {
    const node = fork("./index.js", params, {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });
    node.stdout.on('data', _ => con(`[${new Date().toLocaleTimeString()}][${localId}]` + _.toString()));
    node.on('close', () => down(node, localId));
    node.on('exit', (code, signal) => {
        console.log('exit', code, signal)
        if (code === 7) {
            reload(node, params)
        }
    });

    return node;
}

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

setInterval(() => {
    CLUSTER.forEach(v => v.kill());
    let r = () => {
        if (CLUSTER.length === 0) run();
        else setTimeout(() => r(), 500)
    };
    r();
}, 1000 * 60 * 60 * 1.5);

rl.on('line', (l) => {
    switch (l.trim()) {
        case "reload":
            CLUSTER.forEach(v => v.kill());
            let r = () => {
                if (CLUSTER.length === 0) run();
                else setTimeout(() => r(), 500)
            };
            r();
            break;
        case "stop":
            process.exit();
            break;
        default:
            break;
    }
});