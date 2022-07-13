const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Add Build Director Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");

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
    });

    beforeEach(async () => {
        telosworks.resetTables();

        await telosworks.loadFixtures("config", {
            "telosworks": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "0.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "build_directors": [],
                    "reward_percentage": 0.05,
                    "bonus_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })
        await telosworks.loadFixtures("profiles", require("../fixtures/telosworks/profiles.json"));

    });

    it("add build director", async () => {
        expect.assertions(1);


        await telosworks.contract.addbuilddir({ director: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }]);

        const config = telosworks.getTableRowsScoped("config")[telosworks.accountName][0];
        expect(config.build_directors).toEqual(["user1"]);
    });

    it("fails to add build director if user is not a tlos account", async () => {
        await expect(telosworks.contract.addbuilddir({ director: "user3" },
            [{
              actor: admin.accountName,
              permission: "active"
            }])).rejects.toThrow( "The user user3 is not a TLOS account");
    })

    it("fails to add build director if user is already a build director", async () => {
        await telosworks.contract.addbuilddir({ director: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }]);
        
        await expect(telosworks.contract.addbuilddir({ director: "user1" },
            [{
              actor: admin.accountName,
              permission: "active"
            }])).rejects.toThrow( "The user user1 is already set as Build Director");
    })

    it("fails to add build director if user different than admin tries", async () => {
        await expect(telosworks.contract.addbuilddir({ director: "user1" },
            [{
              actor: user1.accountName,
              permission: "active"
            }])).rejects.toThrow();
    })

});