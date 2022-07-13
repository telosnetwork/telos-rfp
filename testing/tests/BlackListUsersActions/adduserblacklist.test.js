const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Add user Blacklist Telos Works Smart Contract Tests", () => {
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
        await telosbuild.loadFixtures("profiles", require("../fixtures/telosbuild/profiles.json"));

    });

    it("add user blacklist", async () => {
        expect.assertions(1);


        await telosbuild.contract.adduserbl({ account: "user1" },
          [{
            actor: admin.accountName,
            permission: "active"
          }]);

        const blacklist = telosbuild.getTableRowsScoped("usersbl")[telosbuild.accountName];
        expect(blacklist).toEqual([{account: "user1"}]);
    })

    it("fails to add user blacklist if user is not in the system", async () => {
        await expect(telosbuild.contract.adduserbl({ account: "user3" },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow("account doesn't exist in the system");
    });

    it("fails to add user blacklist if user is already in the blacklist", async () => {
        
        await telosbuild.contract.adduserbl({ account: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }]);
         
        await expect(telosbuild.contract.adduserbl({ account: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow("This account is already in users blacklist");
    });


    it("fails to add user blacklist if user different than admin tries", async () => {
        await expect(telosbuild.contract.adduserbl({ account: "user1" },
            [{
              actor: user1.accountName,
              permission: "active"
            }])).rejects.toThrow();
    })

});