const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Init Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");

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
    });

    it("init the SC", async () => {
        expect.assertions(1);

        await telosworks.contract.init({
            initial_admin: "admin"
        })

        expect(telosworks.getTableRowsScoped("config")["telosworks"][0]).toEqual({
            contract_version: "0.1.0",
            administrator: "admin",
            tlos_locked_time: 365,
            build_directors: [],
            available_funds: "0.0000 TLOS",
            reserved_funds: "0.0000 TLOS",
            bonus_percentage: 0.05,
            reward_percentage: 0.05,
            milestones_days: 14
        });
    });

    it("return an error if contract is already initialized", async () => {
        await telosworks.loadFixtures("config", require("../fixtures/telosworks/config.json"));

        await expect(telosworks.contract.init({
            initial_admin: "admin"
        })).rejects.toThrow("contract already initialized")
    
    });


    it("return an error if admin account doesn't exist", async () => {
        await expect(telosworks.contract.init({
            initial_admin: "falseadmin"
        })).rejects.toThrow("initial admin account doesn't exist")
    });
});
