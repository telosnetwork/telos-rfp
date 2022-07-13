const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Set Version Telos Works Smart Contract Tests", () => {
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

    it("change current version", async () => {
        expect.assertions(1);


        await telosbuild.contract.setversion({ new_version: "0.2.0" },
          [{
            actor: admin.accountName,
            permission: "active"
          }]);

        const config = telosbuild.getTableRowsScoped("config")[telosbuild.accountName][0];
        expect(config.contract_version).toEqual("0.2.0");
    })

    it("fails to set new version if user different than admin tries", async () => {
        await expect(telosbuild.contract.setversion({ new_version: "0.2.0" },
            [{
              actor: user1.accountName,
              permission: "active"
            }])).rejects.toThrow();
    })

});