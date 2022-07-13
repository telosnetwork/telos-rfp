const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Init Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");

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
    });

    it("init the SC", async () => {
        expect.assertions(1);

        await telosbuild.contract.init({
            initial_admin: "admin"
        })

        expect(telosbuild.getTableRowsScoped("config")["telosbuild"][0]).toEqual({
            contract_version: "0.1.0",
            administrator: "admin",
            tlos_locked_time: 365,
            program_managers: [],
            available_funds: "0.0000 TLOS",
            reserved_funds: "0.0000 TLOS",
            reward_percentage: 0.05,
            milestones_days: 14
        });
    });

    it("return an error if contract is already initialized", async () => {
        await telosbuild.loadFixtures("config", require("../fixtures/telosbuild/config.json"));

        await expect(telosbuild.contract.init({
            initial_admin: "admin"
        })).rejects.toThrow("contract already initialized")
    
    });


    it("return an error if admin account doesn't exist", async () => {
        await expect(telosbuild.contract.init({
            initial_admin: "falseadmin"
        })).rejects.toThrow("initial admin account doesn't exist")
    });
});
