const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe.skip("Add profile Telos Works Smart Contract Tests", () => {
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

    it("add profile", async () => {
        expect.assertions(1);

        await telosbuild.contract.addprofile({ account: "user1", full_name: "User 1", country: "USA", email: "user@example.com", company: "FakeCompany" },
          [{
            actor: user1.accountName,
            permission: "active"
          }]);

        const profile = telosbuild.getTableRowsScoped("profiles")[telosbuild.accountName];
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

        await telosbuild.loadFixtures("profiles", require("../fixtures/telosbuild/profiles.json"));

        await telosbuild.contract.addprofile({ account: "user1", full_name: "User 1", country: "USA", email: "user@example.com", company: "FakeCompany" },
          [{
            actor: user1.accountName,
            permission: "active"
          }]);

        const profile = telosbuild.getTableRowsScoped("profiles")[telosbuild.accountName];
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
        await expect(telosbuild.contract.addprofile({ account: "user2", full_name: "User 1", country: "USA", email: "user@example.com", company: "FakeCompany" },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow();
    })

});