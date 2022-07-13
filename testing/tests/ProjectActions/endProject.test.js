const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("End project Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let eosiotoken = blockchain.createAccount("eosio.token");

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

        eosiotoken.setContract(blockchain.contractTemplates["eosio.token"]);
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
                    "ballot_name": "ballot",
                    "status": 6,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "100.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [0,1],
                    "proposal_selected": [0],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "2001-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });

        await telosworks.loadFixtures("milestones", {
            "": [
                {
                    "milestone_id": 0,
                    "status": 3,
                    "tlos_rewarded": "3.0000 TLOS",
                    "title": "Title",
                    "description": "description",
                    "documents": "documents",
                    "start_ts": "2000-01-11T00:00:00.000",
                    "end_ts": "2000-01-21T00:00:00.000",
                    "send_ts": "2000-01-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                },
                {
                    "milestone_id": 1,
                    "status": 3,
                    "tlos_rewarded": "23.0000 TLOS",
                    "title": "Title",
                    "description": "description",
                    "documents": "documents",
                    "start_ts": "2000-01-21T00:00:00.000",
                    "end_ts": "2000-01-31T00:00:00.000",
                    "send_ts": "2000-01-25T00:00:00.000",
                    "review_ts": "2000-02-01T00:00:00.000",
                }
            ]
        });
    });

    it("End Project succeeds", async () => { 
        expect.assertions(1);

        await telosworks.contract.endproject({
            project_id: 0,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])

        const projects = telosworks.getTableRowsScoped("projects")["telosworks"];
        expect(projects.find(proj => proj.project_id == 0).status).toEqual(7);
    });

    it("fails if project not found", async () => { 
         await expect(telosworks.contract.endproject({ project_id: 15 },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Project not found");
    });

    it("fails if project is not in started state", async () => { 
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
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

        await expect(telosworks.contract.endproject({ project_id: 1 },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Project must be in started status to be able to close it.");

    });

    
    it("fails if not all milestones has been reviewed", async () => { 
         await telosworks.loadFixtures("milestones", {
            "": [
                {
                    "milestone_id": 2,
                    "status": 2,
                    "tlos_rewarded": "3.0000 TLOS",
                    "title": "Title",
                    "description": "description",
                    "documents": "documents",
                    "start_ts": "2000-01-11T00:00:00.000",
                    "end_ts": "2000-01-21T00:00:00.000",
                    "send_ts": "2000-01-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
         });
        
        await expect(telosworks.contract.endproject({ project_id: 0 },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("All milestones needs to be reviewed to end the project");
    });

    it("fails if user other than build director tries to start project", async () => { 
         await expect(telosworks.contract.endproject({ project_id: 0 },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow();
    });

});