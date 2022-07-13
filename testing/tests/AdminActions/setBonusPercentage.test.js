const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Set Bonus Percentage Telos Works Smart Contract Tests", () => {
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

    it("change bonus percentage", async () => {
        expect.assertions(1);


        await telosworks.contract.setbonusperc({ bonus_percentage: 0.07 },
          [{
            actor: admin.accountName,
            permission: "active"
          }]);

        const config = telosworks.getTableRowsScoped("config")[telosworks.accountName][0];
        expect(config.bonus_percentage).toEqual(0.07);
    })

    it("fails to change bonus percentage if is lower than 0.05", async () => {
    await expect(telosworks.contract.setbonusperc({ bonus_percentage: 0.04 },
          [{
            actor: admin.accountName,
            permission: "active"
          }])).rejects.toThrow("Bonus percentage must be between 5% y 10%");
    })

    it("fails to change bonus percentage if is higher than 0.10", async () => {
    await expect(telosworks.contract.setbonusperc({ bonus_percentage: 0.11 },
          [{
            actor: admin.accountName,
            permission: "active"
          }])).rejects.toThrow("Bonus percentage must be between 5% y 10%");
    })
    
    it("fails to change bonus if user different than admin tries", async () => {
        await expect(telosworks.contract.setbonusperc({ bonus_percentage: 0.07 },
          [{
            actor: user1.accountName,
            permission: "active"
          }])).rejects.toThrow();
    })

});