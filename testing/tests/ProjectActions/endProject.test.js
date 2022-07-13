const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("End project Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let user3 = blockchain.createAccount("user3");
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
                    "ballot_name": "ballot",
                    "status": 6,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "15.0000 TLOS",
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

         await telosbuild.loadFixtures("proposals", {
             "telosbuild": [
                {
                    "proposal_id": "0",
                    "project_id": "0",
                    "title": "Title",
                    "status": "6",
                    "proposer": "user2",
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
                    "title": "Title",
                    "status": "5",
                    "proposer": "user3",
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
             ]
         })
        
        

        await telosbuild.loadFixtures("milestones", {
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
                    "tlos_rewarded": "3.0000 TLOS",
                    "title": "Title",
                    "description": "description",
                    "documents": "documents",
                    "start_ts": "2000-01-21T00:00:00.000",
                    "end_ts": "2000-01-31T00:00:00.000",
                    "send_ts": "2000-01-25T00:00:00.000",
                    "review_ts": "2000-02-01T00:00:00.000",
                },
                {
                    "milestone_id": 2,
                    "status": 3,
                    "tlos_rewarded": "0.0000 TLOS",
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
        expect.assertions(5);

        await telosbuild.contract.endproject({
            project_id: 0,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])

        const projects = telosbuild.getTableRowsScoped("projects")["telosbuild"];
        expect(projects.find(proj => proj.project_id == 0).status).toEqual(7);

        const config = telosbuild.getTableRowsScoped("config")["telosbuild"][0];
        expect(config.available_funds).toEqual("44.0000 TLOS");
        expect(config.reserved_funds).toEqual("6.0000 TLOS");

        const profiles = telosbuild.getTableRowsScoped("profiles")["telosbuild"];
        expect(profiles.find(prof => prof.account === "user2").locked_tlos_balance).toEqual("6.0000 TLOS");

        const lockedtlos = telosbuild.getTableRowsScoped("lockedtlos");
        expect(lockedtlos).toEqual({
            user2: [
            {
                locked_id: '0',
                tlos_amount: '6.0000 TLOS',
                locked_until_ts: '2000-12-31T00:00:00.000',
                memo: "TLOS rewards for the milestones of the proposal 0 of the project 0",
            }
            ]
        });

        
    });

    it("fails if project not found", async () => { 
         await expect(telosbuild.contract.endproject({ project_id: 15 },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Project not found");
    });

    it("fails if project is not in started state", async () => { 
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 1,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": ["5"],
                    "proposal_selected": ["5"],
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

        await telosbuild.loadFixtures("proposals", {
             "telosbuild": [
                {
                    "proposal_id": "5",
                    "project_id": "1",
                    "title": "Title",
                    "status": "6",
                    "proposer": "user2",
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
                 }
             ]
         })




        await expect(telosbuild.contract.endproject({ project_id: 1 },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Project must be in started status to be able to close it.");

    });

    
    it("fails if not all milestones has been reviewed", async () => { 
         await telosbuild.loadFixtures("milestones", {
            "": [
                {
                    "milestone_id": 3,
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
        
        await expect(telosbuild.contract.endproject({ project_id: 0 },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("All milestones needs to be reviewed to end the project");
    });

    it("fails if user other than program manager tries to start project", async () => { 
         await expect(telosbuild.contract.endproject({ project_id: 0 },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow();
    });

});