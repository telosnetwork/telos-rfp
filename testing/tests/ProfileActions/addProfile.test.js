const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe.skip("Add profile Telos Works Smart Contract Tests", () => {
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

    it("add profile", async () => {
        expect.assertions(1);

        await telosworks.contract.addprofile({ account: "user1", full_name: "User 1", country: "USA", email: "user@example.com", company: "FakeCompany" },
          [{
            actor: user1.accountName,
            permission: "active"
          }]);

        const profile = telosworks.getTableRowsScoped("profiles")[telosworks.accountName];
        expect(profile.find(prof => prof.account === "user1")).toEqual({
            account: "user1",
            full_name: "User 1",
            country: "USA",
            email: "user@example.com",
            company: "FakeCompany",
            tlos_balance: "0.0000 TLOS"
        });
    })

    it("modify profile", async () => {
        expect.assertions(1);

        await telosworks.loadFixtures("profiles", require("../fixtures/telosworks/profiles.json"));

        await telosworks.contract.addprofile({ account: "user1", full_name: "User 1", country: "USA", email: "user@example.com", company: "FakeCompany" },
          [{
            actor: user1.accountName,
            permission: "active"
          }]);

        const profile = telosworks.getTableRowsScoped("profiles")[telosworks.accountName];
        expect(profile.find(prof => prof.account === "user1")).toEqual({
            account: "user1",
            full_name: "User 1",
            country: "USA",
            email: "user@example.com",
            company: "FakeCompany",
            tlos_balance: "100.0000 TLOS"
        });
    })

    it("fails to add profile if authentication isn't valid", async () => {
        await expect(telosworks.contract.addprofile({ account: "user2", full_name: "User 1", country: "USA", email: "user@example.com", company: "FakeCompany" },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow();
    })

});