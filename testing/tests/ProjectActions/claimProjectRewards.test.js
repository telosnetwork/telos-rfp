const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Claim Rewards for project rewarded Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let user3 = blockchain.createAccount("user3");
    let eosiotoken = blockchain.createAccount("eosio.token");

    beforeAll(async () => {
        telosworks.setContract(blockchain.contractTemplates[`telosworks`]);
        telosworks.updateAuth(`active`, `owner`, {
        accounts: [
            {
            permission: {
                actor: telosworks.accountName,
                permission: `eosio.code`
            },
            weight: 1
            }
        ]
        });

        eosiotoken.setContract(blockchain.contractTemplates["eosio.token"]);
    });

    beforeEach(async () => {
        telosworks.resetTables();
        eosiotoken.resetTables();

        await telosworks.loadFixtures("config", {
            "telosworks": [
                {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "500.0000 TLOS",
                    "tlos_locked_time": 365,
                    "build_directors": ["user1"],
                    "reward_percentage": 0.05,
                    "bonus_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        });
        await telosworks.loadFixtures("profiles", {
            "telosworks": [
                {
                    "account": "user2",
                    "tlos_balance": "15.0000 TLOS"
                }
            ]
        });

        await telosworks.loadFixtures("lockedtlos", {
            "user2": [
                {
                    locked_id: 0,
                    tlos_amount: "15.0000 TLOS",
                    locked_until_ts: "1999-01-01T00:00:00.000"
                }
            ]
        })

        await eosiotoken.loadFixtures();
    });

    it("claim rewards succeeds", async () => {
        expect.assertions(5);

        await telosworks.contract.claimreward({
            account: "user2",
            locked_id: 0
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])

        const conf = telosworks.getTableRowsScoped("config")["telosworks"][0];
        expect(conf.reserved_funds).toEqual("485.0000 TLOS");

        const profiles = telosworks.getTableRowsScoped("profiles")["telosworks"];
        expect(profiles.find(prof => prof.account === "user2").tlos_balance).toEqual("0.0000 TLOS");

        const lockedtlos = telosworks.getTableRowsScoped("lockedtlos")["user2"];
        expect(lockedtlos).toBeUndefined();

        const accounts = eosiotoken.getTableRowsScoped("accounts");
        expect(accounts.telosworks[0].balance).toEqual("35.0000 TLOS");
        expect(accounts.user2[0].balance).toEqual("65.0000 TLOS");

        
    });

    it("fails if account not found", async () => {
        await expect(telosworks.contract.claimreward({
            account: "user3",
            locked_id: 0
        }, [{
            actor: user3.accountName,
            permission: "active"
        }])).rejects.toThrow("Profile not found");
    });

    it("fails if locked tlos id not found", async () => {
        await expect(telosworks.contract.claimreward({
            account: "user2",
            locked_id: 1
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])).rejects.toThrow("Locked tlos id not found");
    });

    it("fails if TLOS is still locked", async () => {
        await telosworks.loadFixtures("lockedtlos", {
            "user2": [
                {
                    locked_id: 1,
                    tlos_amount: "15.0000 TLOS",
                    locked_until_ts: "2001-01-01T00:00:00.000"
                }
            ]
        })

        await expect(telosworks.contract.claimreward({
            account: "user2",
            locked_id: 1
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])).rejects.toThrow("TLOS is still locked");
    });

    it("fails if user other than owner tries to claim funds", async () => {
        await expect(telosworks.contract.claimreward({
            account: "user2",
            locked_id: 1
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow();
    });

});