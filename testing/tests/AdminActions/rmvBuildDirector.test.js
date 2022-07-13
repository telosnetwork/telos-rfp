const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Remove Build Director Telos Works Smart Contract Tests", () => {
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
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 1,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1970-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });

    });

    it("remove build director", async () => {
        expect.assertions(2);

        await telosworks.contract.rmvbuilddir({ director: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }]);

        const config = telosworks.getTableRowsScoped("config")[telosworks.accountName][0];
        expect(config.build_directors).toEqual([]);
        
        const projects = telosworks.getTableRowsScoped("projects")[telosworks.accountName];
        expect(projects).toBeUndefined();
    });

    it("fails to remove build director if user is not a build director", async () => {
        await expect(telosworks.contract.rmvbuilddir({ director: "user2" },
            [{
              actor: admin.accountName,
              permission: "active"
            }])).rejects.toThrow("The user user2 is not set as Build Director");
    })


    it("fails to remove build director if it has any active project", async () => {
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 15,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1970-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });

        await expect(telosworks.contract.rmvbuilddir({ director: "user1" },
            [{
              actor: admin.accountName,
              permission: "active"
            }])).rejects.toThrow( "Can not remove a build director that has active projects");
    })

    it("fails to remove build director if user different than admin tries", async () => {
        await expect(telosworks.contract.rmvbuilddir({ director: "user1" },
            [{
              actor: user1.accountName,
              permission: "active"
            }])).rejects.toThrow();
    })

});