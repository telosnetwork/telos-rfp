const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Remove program manager Telos Works Smart Contract Tests", () => {
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
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 1,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf": "New pdf",
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

    it("remove program manager", async () => {
        expect.assertions(2);

        await telosbuild.contract.rmvmanager({ manager: "user1" },
            [{
                actor: admin.accountName,
                permission: "active"
            }]);

        const config = telosbuild.getTableRowsScoped("config")[telosbuild.accountName][0];
        expect(config.program_managers).toEqual([]);
        
        const projects = telosbuild.getTableRowsScoped("projects")[telosbuild.accountName];
        expect(projects).toBeUndefined();
    });

    it("fails to remove program manager if user is not a program manager", async () => {
        await expect(telosbuild.contract.rmvmanager({ manager: "user2" },
            [{
              actor: admin.accountName,
              permission: "active"
            }])).rejects.toThrow("The user user2 is not set as program manager");
    })


    it("fails to remove program manager if it has any active project", async () => {
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 15,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf": "New pdf",
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

        await expect(telosbuild.contract.rmvmanager({ manager: "user1" },
            [{
              actor: admin.accountName,
              permission: "active"
            }])).rejects.toThrow( "Can not remove a program manager that has active projects");
    })

    it("fails to remove program manager if user different than admin tries", async () => {
        await expect(telosbuild.contract.rmvmanager({ manager: "user1" },
            [{
              actor: user1.accountName,
              permission: "active"
            }])).rejects.toThrow();
    })

});