const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Delete Proposal Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");

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
                    "status": 2,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
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
        await telosbuild.loadFixtures("proposals", {
           "telosbuild": [{
                "proposal_id": "0",
                "project_id": "0",
                "status": "1",
                "title": "Title",
                "proposer": "user1",
                "timeline": "timeline",
                "number_milestones": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })

    });

    it("Remove proposal user", async () => {
        expect.assertions(1);

        await telosbuild.contract.rmvproposal({  proposal_id: 0 },
            [{
                actor: user1.accountName,
                permission: "active"
            }]);

        expect(telosbuild.getTableRowsScoped("proposals")).toEqual({});
    });


    it("Fails to remove proposal if it doesn't exist", async () => {
        await expect(telosbuild.contract.rmvproposal({  proposal_id: 15},
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Proposal not found");
    });

    it("Fails to remove proposal if it is in status other than published", async () => {
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 3,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
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
         
        await telosbuild.loadFixtures("proposals", {
           "telosbuild": [{
                "proposal_id": "1",
                "project_id": "1",
                "status": "1",
                "title": "Title",
                "proposer": "user1",
                "number_milestones": 5,
                "timeline": "timeline",
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
         
         
        await expect(telosbuild.contract.rmvproposal({  proposal_id: 1 },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Project must be in published state to erase a proposal.");
    });

    it("Fails to remove proposal if proposing time has ended", async () => { 
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1999-12-31T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });

        await telosbuild.loadFixtures("proposals", {
           "telosbuild": [{
                "proposal_id": "1",
                "project_id": "1",
                "status": "1",
                "title": "Title",
                "proposer": "user1",
                "number_milestones": 5,
                "timeline": "timeline",
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
         
         
        await expect(telosbuild.contract.rmvproposal({ proposal_id: 1 },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Proposal can not be removed after proposing time has ended");
    });
    
    it("Fails to remove a proposal if user other than proposer tries to delete it", async () => {

        await expect(telosbuild.contract.rmvproposal({  proposal_id: 0 },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow();
    });
});