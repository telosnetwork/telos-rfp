const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe.skip("Remove profile Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");

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

        await telosworks.loadFixtures("config", {
            "telosworks": [
                {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "0.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "build_directors": [],
                    "reward_percentage": 0.05,
                    "bonus_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })
        await telosworks.loadFixtures("profiles", require("../fixtures/telosworks/profiles.json"));
    });

    it("Remove profile user", async () => {
        expect.assertions(1);

        await telosworks.contract.rmvprofile({ account: "user1" },
            [{
                actor: user1.accountName,
                permission: "active"
            }]);

        const profiles = telosworks.getTableRowsScoped("profiles")["telosworks"];
        expect(profiles.find(prof => prof.account === "user1")).toBeUndefined();
    });

    it("Remove profile admin", async () => {
        expect.assertions(1);

        await telosworks.contract.rmvprofile({ account: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }]);

        const profiles = telosworks.getTableRowsScoped("profiles")["telosworks"];
        expect(profiles.find(prof => prof.account === "user1")).toBeUndefined();
    });

    it("Fails to remove profile if it doesn't exist", async () => {
        await expect(telosworks.contract.rmvprofile({ account: "user3" },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow("profile not found");
    });
    
    it("Fails to remove profile if user is a build director", async () => {

        await telosworks.contract.addbuilddir({ director: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }]);
        
        await expect(telosworks.contract.rmvprofile({ account: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow("Can't delete a build director account, need to be removed from build director list first");
    });
    
    it("Fails to remove profile if user other than user1 or admin tries to remove profile", async () => {
        await expect(telosworks.contract.rmvprofile({ account: "user1" },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("requires authentication from profile account or admin account");
    });
});