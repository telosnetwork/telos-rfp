const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Set Milestone Length Telos Works Smart Contract Tests", () => {
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

    it("change milestone length", async () => {
        expect.assertions(1);


        await telosbuild.contract.setmilestone({ days: 7 },
          [{
            actor: admin.accountName,
            permission: "active"
          }]);

        const config = telosbuild.getTableRowsScoped("config")[telosbuild.accountName][0];
        expect(config.milestones_days).toEqual(7);
    })

    it("fails to change milestone length if trying to set to 0", async () => {
    await expect(telosbuild.contract.setmilestone({ days: 0 },
          [{
            actor: admin.accountName,
            permission: "active"
          }])).rejects.toThrow("Milestones must last at least 1 day");
    })

    
    it("fails to change bonus if user different than admin tries", async () => {
        await expect(telosbuild.contract.setmilestone({ days: 7 },
          [{
            actor: user1.accountName,
            permission: "active"
          }])).rejects.toThrow();
    })

});