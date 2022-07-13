const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Select Proposal Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let eosiotoken = blockchain.createAccount("eosio.token");

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

        eosiotoken.setContract(blockchain.contractTemplates["eosio.token"]);
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
                    "status": 4,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [0, 1],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1999-01-01T00:00:00.000",
                    "vote_end_ts": "1999-11-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
       await telosbuild.loadFixtures("proposals", {
           "telosbuild": [
               {
                "proposal_id": "0",
                "project_id": "0",
                "status": "5",
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
               },
               {
                "proposal_id": "1",
                "project_id": "0",
                "status": "5",
                "title": "Title",
                "proposer": "user1",
                "timeline": "new timeline",
                "number_milestones": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
               },
                {
                "proposal_id": "2",
                "project_id": "0",
                "status": "5",
                "proposer": "user1",
                "title": "Title",
                "timeline": "new timeline",
                "number_milestones": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
               }
           ]
        })

    });

    it("Pick proposal succeeds", async () => { 
        expect.assertions(2);

        await telosbuild.contract.pickproposal({
            project_id: 0,
            proposal_id: 1
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])

        const project = telosbuild.getTableRowsScoped("projects")["telosbuild"];
        expect(project.find(proj => proj.project_id === "0")).toEqual({
                project_id: '0',
                title: 'Title',
                ballot_name: "",
                status: 5,
                program_manager: 'user1',
                bond: "10.0000 TLOS",
                project_manager: "user1",
                description: 'description',
                github_url: 'url',
                pdf: "pdf",
                usd_rewarded: '10.0000 USD',
                tlos_locked: '0.0000 TLOS',
                proposal_selected: ["1"],
                proposals_rewarded: ["0","1"],
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
                update_ts: '2000-01-01T00:00:00.000',
                propose_end_ts: "1999-01-01T00:00:00.000",
                vote_end_ts: '1999-11-01T00:00:00.000',
                start_ts: "2000-01-01T00:00:00.000",
                end_ts: "2000-01-01T00:00:00.000",
        })

        const proposals = telosbuild.getTableRowsScoped("proposals")["telosbuild"];
        expect(proposals).toEqual([
            {
                "kanban_board_link": "kanban_board_link",
                "mockups_link": "mockups_link",
                "number_milestones": "5",
                "project_id": "0",
                "proposal_id": "0",
                "title": "Title",
                "proposer": "user1",
                "status": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "timeline": "timeline",
                "update_ts": "2000-01-01T00:00:00.000",
                "usd_amount": "10.0000 USD"
            }, {
                "kanban_board_link": "kanban_board_link",
                "mockups_link": "mockups_link",
                "number_milestones": "5",
                "title": "Title",
                "project_id": "0",
                "proposal_id": "1",
                "proposer": "user1",
                "status": 6,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "timeline": "new timeline",
                "update_ts": "2000-01-01T00:00:00.000",
                "usd_amount": "10.0000 USD"
            }, {
                "kanban_board_link": "kanban_board_link",
                "mockups_link": "mockups_link",
                "number_milestones": "5",
                "title": "Title",
                "project_id": "0",
                "proposal_id": "2",
                "proposer": "user1",
                "status": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "timeline": "new timeline",
                "update_ts": "2000-01-01T00:00:00.000",
                "usd_amount": "10.0000 USD"
            }]
        );
    });


    it("fails if project not found", async () => { 
        await expect(telosbuild.contract.pickproposal({
            project_id: 54,
            proposal_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project not found");
    });

    it("fails if project is not in voted state", async () => { 
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
                    "propose_end_ts": "1999-12-31T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
          });
        
        await expect(telosbuild.contract.pickproposal({
            project_id: 1,
            proposal_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project must be in voted status");
    });


    it("fails if proposals selected is not between the proposals rewarded", async () => { 
        await expect(telosbuild.contract.pickproposal({
            project_id: 0,
            proposal_id: 2,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow( "Proposal selected must be one of the proposals rewarded");
    });


    it("fails if user other than program manager tries to select proposal", async () => { 
        await expect(telosbuild.contract.pickproposal({
            project_id: 0,
            proposal_id: 1
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])).rejects.toThrow();
    });

});