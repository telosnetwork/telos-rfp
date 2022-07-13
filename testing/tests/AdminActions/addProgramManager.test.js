const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Add program manager Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");

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
    });

    beforeEach(async () => {
        telosbuild.resetTables();

        await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "0.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": [],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })

    });

    it("add program manager", async () => {
        expect.assertions(1);


        await telosbuild.contract.addmanager({ manager: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }]);

        const config = telosbuild.getTableRowsScoped("config")[telosbuild.accountName][0];
        expect(config.program_managers).toEqual(["user1"]);
    });

    it("fails to add program manager if user is not a tlos account", async () => {
        await expect(telosbuild.contract.addmanager({ manager: "user3" },
            [{
              actor: admin.accountName,
              permission: "active"
            }])).rejects.toThrow( "The user user3 is not a TLOS account");
    })

    it("fails to add program manager if user is already a program manager", async () => {
        await telosbuild.contract.addmanager({ manager: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }]);
        
        await expect(telosbuild.contract.addmanager({ manager: "user1" },
            [{
              actor: admin.accountName,
              permission: "active"
            }])).rejects.toThrow( "The user user1 is already set as program manager");
    })

    it("fails to add program manager if user different than admin tries", async () => {
        await expect(telosbuild.contract.addmanager({ manager: "user1" },
            [{
              actor: user1.accountName,
              permission: "active"
            }])).rejects.toThrow();
    })

});