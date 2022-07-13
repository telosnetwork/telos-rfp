const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Catch Transfer telosbuild Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let user3 = blockchain.createAccount("user3");
    let eosiotoken = blockchain.createAccount("eosio.token");

    beforeAll(async () => {
        telosbuild.setContract(blockchain.contractTemplates[`telosbuild`]);
        telosbuild.updateAuth(`active`, `owner`, {
        accounts: [
            {
            permission: {
                actor: telosbuild.accountName,
                permission: `eosio.code`
            },
            weight: 1
            }
        ]
        });

        eosiotoken.setContract(blockchain.contractTemplates["eosio.token"]);
    });

   beforeEach(async () => {
        telosbuild.resetTables();
        eosiotoken.resetTables();

        await telosbuild.loadFixtures("config", {
            "telosbuild": [
                {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "0.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        });
       
        await eosiotoken.loadFixtures();
    });
    
    it("catch transfer and add to available funds if memo is fund", async () => {
        expect.assertions(4);

        await eosiotoken.contract.transfer({
            from: "user1",
            to: "telosbuild",
            quantity: "25.0000 TLOS",
            memo: "fund"
        },[{
            actor: user1.accountName,
            permission: "active"
        }]);

        const accounts = eosiotoken.getTableRowsScoped("accounts");
        expect(accounts.telosbuild[0].balance).toEqual("75.0000 TLOS");
        expect(accounts.user1[0].balance).toEqual("25.0000 TLOS");
        
        const config = telosbuild.getTableRowsScoped("config")["telosbuild"][0];
        expect(config.available_funds).toEqual("25.0000 TLOS");

        const profiles = telosbuild.getTableRowsScoped("profiles")["telosbuild"];
        expect(profiles).toBeUndefined();

    });

    it("catch transfer and add account balance if memo is not fund", async () => {
        expect.assertions(4);

        await eosiotoken.contract.transfer({
            from: "user1",
            to: "telosbuild",
            quantity: "25.0000 TLOS",
            memo: "transfer"
        },[{
            actor: user1.accountName,
            permission: "active"
        }]);

        const accounts = eosiotoken.getTableRowsScoped("accounts");
        expect(accounts.telosbuild[0].balance).toEqual("75.0000 TLOS");
        expect(accounts.user1[0].balance).toEqual("25.0000 TLOS");
        
        const config = telosbuild.getTableRowsScoped("config")["telosbuild"][0];
        expect(config.available_funds).toEqual("0.0000 TLOS");

        const profiles = telosbuild.getTableRowsScoped("profiles")["telosbuild"];
        expect(profiles.find(prof => prof.account === "user1")).toEqual({
            account: "user1",
            tlos_balance: "25.0000 TLOS",
            locked_tlos_balance: "0.0000 TLOS",
            locked_tlos_bonds: "0.0000 TLOS",
        })
    });



    
});