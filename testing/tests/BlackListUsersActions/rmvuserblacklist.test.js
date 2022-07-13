const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Add user Blacklist Telos Works Smart Contract Tests", () => {
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
        await telosworks.loadFixtures("profiles", require("../fixtures/telosworks/profiles.json"));
        await telosworks.loadFixtures("usersbl", {
            telosworks: [
                {account: "user1"}
            ]
        })

    });

    it("remove user blacklist", async () => {
        expect.assertions(1);

        await telosworks.contract.rmvuserbl({ account: "user1" },
          [{
            actor: admin.accountName,
            permission: "active"
          }]);

        const blacklist = telosworks.getTableRowsScoped("usersbl")[telosworks.accountName];
        expect(blacklist).toBeUndefined();
    })

    it("fails to remove user blacklist if user is not in the list", async () => {
        await expect(telosworks.contract.rmvuserbl({ account: "user2" },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow("This account is not in users blacklist");
    });


    it("fails to remove user blacklist if user different than admin tries", async () => {
        await expect(telosworks.contract.rmvuserbl({ account: "user1" },
            [{
              actor: user1.accountName,
              permission: "active"
            }])).rejects.toThrow();
    })

});