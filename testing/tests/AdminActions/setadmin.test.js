const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("SetAdmin Telos Works Smart Contract Tests", () => {
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

    it("change current admin", async () => {
        expect.assertions(1);

        blockchain.createAccount("newadmin");

        await telosbuild.contract.setadmin({ new_admin: "newadmin" },
          [{
            actor: admin.accountName,
            permission: "active"
          }]);

        const config = telosbuild.getTableRowsScoped("config")[telosbuild.accountName][0];
        expect(config.administrator).toEqual("newadmin");
      })

      it("fails to set new admin if user different than admin tries", async () => {

          await expect(telosbuild.contract.setadmin({ new_admin: "user1" },
            [{
              actor: user1.accountName,
              permission: "active"
            }])).rejects.toThrow();
      })

      it("do not change current admin if new admin do not exists", async () => {

        await expect(telosbuild.contract.setadmin({ new_admin: "fakeadmin" },
          [{
            actor: admin.accountName,
            permission: "active"
          }]
        )).rejects.toThrow("new admin account doesn't exist");
      })
});