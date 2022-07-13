const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Set Locked Time Telos Works Smart Contract Tests", () => {
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

        await telosbuild.loadFixtures("config", require("../fixtures/telosbuild/config.json"));

    });

    it("change TLOS locked time", async () => {
        expect.assertions(1);


        await telosbuild.contract.setlckdtime({ days: 360 },
          [{
            actor: admin.accountName,
            permission: "active"
          }]);

        const config = telosbuild.getTableRowsScoped("config")[telosbuild.accountName][0];
        expect(config.tlos_locked_time).toEqual(360);
    })

    it("fails to change TLOS locked time if days is 0", async () => {
    await expect(telosbuild.contract.setlckdtime({ days: 0 },
        [{
            actor: admin.accountName,
            permission: "active"
        }])).rejects.toThrow("Minimum Locked days must be greater than 0");
    })
    
    it("fails to change TLOS locked time if user different than admin tries", async () => {
        await expect(telosbuild.contract.setlckdtime({ days: 360 },
            [{
              actor: user1.accountName,
              permission: "active"
            }])).rejects.toThrow();
    })

});