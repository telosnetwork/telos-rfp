const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Delete Proposal Telos Works Smart Contract Tests", () => {
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

        await telosworks.loadFixtures("config", require("../fixtures/telosworks/config.json"));
        await telosworks.loadFixtures("profiles", require("../fixtures/telosworks/profiles.json"));
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 0,
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
                    "propose_end_ts": "2001-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        await telosworks.loadFixtures("proposals", {
           "": [{
                "proposal_id": "0",
                "proposer": "user1",
                "timeline": "timeline",
                "number_milestones": 5,
                "pdf": "pdf",
                "usd_amount": "10.0000 USD",
                "locked_tlos_amount": "0.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })

    });

    it("Remove proposal user", async () => {
        expect.assertions(1);

        await telosworks.contract.rmvproposal({ project_id: 0, proposal_id: 0 },
            [{
                actor: user1.accountName,
                permission: "active"
            }]);

        expect(telosworks.getTableRowsScoped("proposals")).toEqual({});
    });

    it("Remove proposal admin", async () => {
        expect.assertions(1);

        await telosworks.contract.rmvproposal({ project_id: 0, proposal_id: 0 },
            [{
                actor: admin.accountName,
                permission: "active"
            }]);

        expect(telosworks.getTableRowsScoped("proposals")).toEqual({});
    });


    it("Fails to remove proposal if project doesn't exist", async () => {
        await expect(telosworks.contract.rmvproposal({ project_id: 15, proposal_id: 1},
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Project not found");
    });


    it("Fails to remove proposal if it doesn't exist", async () => {
        await expect(telosworks.contract.rmvproposal({ project_id: 0, proposal_id: 15},
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Proposal not found");
    });

    it("Fails to remove proposal if it is in status other than published", async () => {
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 3,
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
                    "propose_end_ts": "2001-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
         
        await telosworks.loadFixtures("proposals", {
           "............1": [{
                "proposal_id": "0",
                "proposer": "user1",
                "number_milestones": 5,
                "timeline": "timeline",
                "pdf": "pdf",
                "usd_amount": "10.0000 USD",
                "locked_tlos_amount": "0.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
         
         
        await expect(telosworks.contract.rmvproposal({ project_id: 1, proposal_id: 0},
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Project must be in published state to erase a proposal.");
    });
    
    it("Fails to remove a proposal if user other than proposer tries to delete it", async () => {

        await expect(telosworks.contract.rmvproposal({ project_id: 0, proposal_id: 0 },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow();
    });
});