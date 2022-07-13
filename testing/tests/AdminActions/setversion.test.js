const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Set Version Telos Works Smart Contract Tests", () => {
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

        await telosworks.loadFixtures("config", require("../fixtures/telosworks/config.json"));

    });

    it("change current version", async () => {
        expect.assertions(1);


        await telosworks.contract.setversion({ new_version: "0.2.0" },
          [{
            actor: admin.accountName,
            permission: "active"
          }]);

        const config = telosworks.getTableRowsScoped("config")[telosworks.accountName][0];
        expect(config.contract_version).toEqual("0.2.0");
    })

    it("fails to set new version if user different than admin tries", async () => {
        await expect(telosworks.contract.setversion({ new_version: "0.2.0" },
            [{
              actor: user1.accountName,
              permission: "active"
            }])).rejects.toThrow();
    })

});